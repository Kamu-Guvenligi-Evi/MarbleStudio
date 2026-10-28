import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';

const configs = (n, team, generic) => [
  { id: 'own', team, commanderId: generic ? 'julius_caesar' : 'alp_arslan',
    roster: generic ? { roman: n / 2, hussar: n / 4, achaemenid_archer: n / 4 }
      : { seljuk_hassa: n * 2 / 3, seljuk_turkmen_archer: n / 3 } },
  { id: 'enemy', team: 1 - team, commanderId: 'julius_caesar', roster: { roman: n } },
];
const metrics = [];
for (const team of [0, 1]) for (const n of [24, 96, 240]) for (const generic of [false, true]) {
  const b = new Battle({ seed: 42, expandedMap: true, armyConfigs: configs(n, team, generic) });
  const blue = b.units.filter(u => u.team === 0), red = b.units.filter(u => u.team === 1);
  const corridor = Math.min(...red.map(u => u.x - u.combatProfile.radius))
    - Math.max(...blue.map(u => u.x + u.combatProfile.radius));
  assert.ok(corridor >= b.deploymentSpacing.frontGap);
  assert.ok(corridor > 560 && corridor < 1000);
  let firstHit = null, assembled;
  const hit = b.hit.bind(b);
  b.hit = (t, ...args) => {
    const hp = t.hp, result = hit(t, ...args);
    if (t.hp < hp) firstHit ??= b.time;
    return result;
  };
  const f = b.tactics.formations, update = f.update.bind(f);
  f.update = (...args) => {
    const s = f.armies.get('own'), preparing = s?.phase === 'assemble';
    const fraction = preparing ? s.members.filter(m => Math.hypot(m.unit.x - m.goal.x, m.unit.y - m.goal.y) < 20).length / s.members.length : 0;
    const result = update(...args);
    if (preparing && s.phase === 'advance') assembled = { time: b.time, fraction, limit: s.assembleLimit };
    return result;
  };
  for (let frame = 0; frame < 600 * 30 && b.winner === null; frame++) b.step(1 / 30);
  const label = `${team}/${n}/${generic}`;
  assert.equal(b.outcomeReason, 'elimination', `${label}: spacing must not create endless battles`);
  assert.ok(firstHit > 5, `${label}: preparation before damage`);
  if (generic) {
    assert.ok(assembled?.fraction >= .75, `${label}: reach the commander formation before advancing`);
    assert.ok(assembled.time < firstHit && assembled.time <= assembled.limit && assembled.limit <= 25);
  } else {
    const s = b.tactics.armies.get('own');
    // A commander now keeps the opposing ranks together. If those ranks do
    // not pursue the bait, regrouping is the correct bounded alternative.
    if (s.history.some(h => h.phase === 'retreat'))
      assert.ok(s.history.some(h => h.phase === 'charge'), `${label}: actual envelopment and charge after pursuit`);
    else assert.ok(s.history.some(h => h.phase === 'regroup'), `${label}: declined pursuit triggers regrouping`);
    assert.equal(s.phase, 'done');
  }
  metrics.push({ team, n, generic, corridor: +corridor.toFixed(1), firstHit: +firstHit.toFixed(2),
    assembled, end: +b.time.toFixed(2) });
}

// A stationary opponent must not reserve the bait and wings indefinitely.
const stationary = new Battle({ seed: 42, expandedMap: true, armyConfigs: configs(24, 0, false) });
stationary.units.filter(u => u.team === 1).forEach(u => { u.order = { kind: 'hold' }; });
for (let frame = 0; frame < 65 * 30; frame++) stationary.step(1 / 30);
assert.equal(stationary.tactics.armies.get('own').phase, 'done');
assert.ok(stationary.tactics.armies.get('own').history.some(h => h.phase === 'regroup'));
console.log('PASS 12 mirrored deployment/formation/Turan battles and bounded stationary fallback', JSON.stringify(metrics));
