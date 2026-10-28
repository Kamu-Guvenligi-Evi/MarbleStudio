import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';

const make = (team, injured = false) => {
  const armies = [{ roman: 24 }, { roman: 24 }], commanders = [null, null];
  armies[team] = { seljuk_hassa: 16, seljuk_turkmen_archer: 8 };
  commanders[team] = 'alp_arslan';
  const b = new Battle({ seed: 42, expandedMap: true, historicalArmies: armies, commanders });
  if (injured) for (const u of b.units.filter(u => u.team === team)) u.hp *= .5;
  b.step(1 / 30);
  return b;
};
const tick = b => { b.time += .5; b.tactics.update(b, b.units.filter(u => u.hp > 0 && !u.removed)); };
for (const team of [0, 1]) {
  const injured = make(team, true), si = injured.tactics.teams[team];
  tick(injured);
  assert.equal(si.phase, 'assemble', 'Pre-existing wounds do not count as failed tactical exposure');
  assert.ok(si.healthRatio > .99);

  for (const phase of ['assemble', 'regroup', 'retreat', 'envelop']) {
    const b = make(team), s = b.tactics.teams[team];
    s.phase = phase;
    s.since = b.time - 15;
    s.retreatStart = { ...s.origin };
    s.retreatGoal = b.tactics.point(s, -100, 0);
    s.pursuers = new Map();
    s.lured = b.units.filter(u => u.team !== team && !u.commanderId).slice(0, 6);
    // The plan has suffered damage but no deaths; the old survivor-count
    // fallback alone cannot detect this exposure.
    for (const m of s.members) m.unit.hp *= .85;
    const before = s.history.length;
    tick(b);
    assert.equal(s.phase, 'done', `${phase}: unsafe preparation or failed pursuit releases control`);
    assert.ok(!s.history.slice(before).some(h => h.phase === 'regroup'), 'No march back under fire');
    assert.ok(s.members.every(m => !b.tactics.intents.has(m.unit.id)), 'No stale tactical movement after abort');
  }

  const b = make(team), s = b.tactics.teams[team];
  const bait = s.members.filter(m => m.role === 'bait');
  const center = bait.reduce((p, m) => ({ x: p.x + m.unit.x / bait.length, y: p.y + m.unit.y / bait.length }), { x: 0, y: 0 });
  const enemy = b.units.find(u => u.team !== team && !u.commanderId);
  enemy.x = center.x + s.forward.x * 20; enemy.y = center.y + s.forward.y * 20;
  tick(b);
  assert.equal(s.phase, 'done', 'An enemy in the unprepared center triggers defense instead of regrouping');
  assert.ok(!s.history.some(h => h.phase === 'regroup'));
}
console.log('PASS mirrored fallback: existing wounds, costly setup, failed pursuit/closure and early center contact');
