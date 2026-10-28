import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';

const pair = options => new Battle({ historicalArmies: [{ roman: 1 }, { roman: 1 }], tacticalAI: false, ...options });
{
  const b = pair({ expandedMap: true });
  b.time = 181; b.checkOutcome();
  assert.equal(b.winner, null, 'live battles continue while both armies survive');
  assert.equal(b.outcomeReason, null);
  b.units.find(u => u.team === 1).hp = 0;
  b.checkOutcome();
  assert.equal(b.winner, 0);
  assert.equal(b.outcomeReason, 'elimination', 'late elimination is not reported as a timeout');
}
for (const options of [{}, { expandedMap: true, timeLimit: 180 }]) {
  const b = pair(options);
  b.time = 181; b.checkOutcome();
  assert.equal(b.winner, 'draw');
  assert.equal(b.outcomeReason, 'time-limit', 'explicit and classic limits remain supported');
}
{
  const b = pair({ expandedMap: true, commanders: ['mehmed_ii', 'alp_arslan'] });
  for (const u of b.units) if (u.team === 1 && !u.commanderId) u.hp = 0;
  b.time = 200; b.checkOutcome();
  assert.equal(b.winner, 0, 'surviving commander cannot keep a defeated army fighting');
}
for (const count of [2, 12]) {
  const b = pair({ historicalArmies: [{ roman: count }, { roman: 1 }] });
  const soldiers = b.units.filter(u => u.team === 0);
  for (const u of soldiers) Object.assign(u, { x: 240, y: 450, cooldown: 999, order: { kind: 'hold' } });
  Object.assign(b.units.find(u => u.team === 1), { x: 900, y: 450, cooldown: 999, order: { kind: 'hold' } });
  b.step(1 / 30);
  if (count === 2) assert(Math.hypot(soldiers[0].x - soldiers[1].x, soldiers[0].y - soldiers[1].y) > 8,
    'deeply overlapping pair separates within one simulation tick');
  for (let i = 1; i < 30; i++) b.step(1 / 30);
  let minimum = Infinity;
  for (const u of soldiers) for (const v of soldiers) if (u.id < v.id) minimum = Math.min(minimum, Math.hypot(u.x - v.x, u.y - v.y));
  assert(minimum > 8, `${count} stationary soldiers must escape severe overlap: ${minimum}`);
  assert(soldiers.every(u => [u.x,u.y].every(Number.isFinite)));
}
console.log('PASS live battle duration, explicit limits, commander elimination and compressed stationary ranks');
