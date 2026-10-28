import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';

for (const team of [0, 1]) for (const count of [24, 48, 96]) {
  const armies = [{ roman: count }, { roman: count }], commanders = [null, null];
  armies[team] = { seljuk_hassa: count }; commanders[team] = 'alp_arslan';
  const b = new Battle({ seed: 42, expandedMap: true, commanders, historicalArmies: armies });
  const charges = new Map(), impacts = new Map();
  const start = b.startCharge.bind(b), hit = b.hit.bind(b);
  const role = u => b.tactics.teams[team]?.members.find(m => m.unit === u)?.role;
  b.startCharge = (u, target) => {
    if (u.team === team && role(u)) {
      assert.ok(u.runDistance >= 28 && u.speed >= u.combatProfile.config.speed * .8,
        'No free momentum: actual engine run-up and acceleration are required');
      assert.ok(b.facing(u, target) > .85, 'The horse must turn towards the charge target');
      charges.set(role(u), (charges.get(role(u)) || 0) + 1);
    }
    return start(u, target);
  };
  b.hit = (target, damage, source, ...args) => {
    const hp = target.hp;
    const result = hit(target, damage, source, ...args);
    if (source?.team === team && source.charge && target.hp < hp) {
      impacts.set(role(source), (impacts.get(role(source)) || 0) + 1);
    }
    return result;
  };
  for (let frame = 0; frame < 45 * 30 && b.winner === null; frame++) b.step(1 / 30);
  const s = b.tactics.teams[team];
  assert.deepEqual(s.history.map(h => h.phase), ['assemble', 'retreat', 'envelop', 'charge', 'done']);
  assert.ok(s.closure && s.chargeRelease?.distances.some(d => d.runUp && d.distance >= 95));
  const relative = p => ({ f: (p.x - s.closure.trap.x) * s.forward.x + (p.y - s.closure.trap.y) * s.forward.y,
    a: (p.x - s.closure.trap.x) * s.side.x + (p.y - s.closure.trap.y) * s.side.y });
  assert.ok(relative(s.closure.left).a < -75 && relative(s.closure.right).a > 75,
    'Wings must occupy opposite flanks, leaving real room for acceleration');
  assert.ok(relative(s.closure.bait).f < 0, 'The bait remains behind the pursuing enemy');
  for (const wing of ['left', 'right']) {
    assert.ok(charges.get(wing) > 0 && impacts.get(wing) > 0, `${team}/${count}/${wing}: real charge and damage`);
  }
  if (count === 24) assert.ok(charges.get('bait') > 0 && impacts.get('bait') > 0, 'Bait turns and countercharges');
  assert.ok(s.chargeRelease.time - s.history.find(h => h.phase === 'charge').time <= 3.01,
    'Riders unable to open a lane must not wait helplessly');
  console.log(`PASS team=${team} cavalry=${count}: charges=${[...charges.values()].reduce((a,b)=>a+b,0)} damaging impacts=${[...impacts.values()].reduce((a,b)=>a+b,0)}`);
}

const narrow = new Battle({ commanders: ['alp_arslan', null], historicalArmies: [{ seljuk_hassa: 24 }, { roman: 24 }] });
narrow.step(1 / 30);
assert.equal(narrow.tactics.teams[0], null, 'Do not squeeze an envelopment into a field too narrow for both wings');
console.log('PASS narrow-field fallback preserves ordinary cavalry combat');
