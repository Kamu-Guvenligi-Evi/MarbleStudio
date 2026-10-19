import assert from 'node:assert/strict';
import { Battle, UNIT_TYPES } from '../src/crown-battle.js';

function encounter(type, { team = 0, blocked = false, order = null, y = 400 } = {}) {
  const armies = [{ [type]: 1, ...(blocked ? { roman: 1 } : {}) }, { roman: 1 }];
  if (team) armies.reverse();
  const b = new Battle({ historicalArmies: armies, seed: 42 });
  const a = b.units.find(u => u.type === type), z = b.units.find(u => u.team !== team);
  const guard = b.units.find(u => u.team === team && u !== a);
  const x = n => team ? 600 - n : n;
  Object.assign(a, { x: x(250), y, cooldown: 0, headingX: team ? -1 : 1, headingY: 0, order });
  Object.assign(z, { x: x(380), y, hp: 10000, cooldown: 100, order: { kind: 'hold' } });
  if (guard) Object.assign(guard, { x: x(275), y, cooldown: 100, order: { kind: 'hold' } });
  const events = [];
  b.onCombatEvent = e => events.push(e);
  return { b, a, z, guard, events };
}
const tick = (b, hz = 60) => { for (let i = 0; i < 10 * hz; i++) b.step(1 / hz); };

const crossbows = Object.entries(UNIT_TYPES).filter(([, cfg]) => cfg.projectile === 'bolt');
for (const [type] of crossbows) {
  const { b, a, z, events } = encounter(type);
  tick(b);
  assert(events.some(e => e.kind === 'attack' && e.unit === a && e.projectile), `${type}: autonomous release`);
  assert(events.some(e => e.kind === 'hit' && e.target === z && e.projectileKind === 'bolt'), `${type}: bolt arrives`);
  assert(z.hp < 10000, `${type}: ranged damage`);
}

let blockedCases = 0;
for (const team of [0, 1]) for (const hz of [30, 60]) for (const y of [110, 400, 875]) {
  const { b, a, z, guard } = encounter('german_pavise_crossbowman', { team, blocked: true, y });
  const guardHp = guard.hp;
  tick(b, hz);
  assert(b.stats.heldShots > 0, 'Initially withholds the blocked shot');
  assert(b.stats.arrows >= 2 && z.hp < 10000, 'Opens a lane and resumes firing');
  assert.equal(guard.hp, guardHp, 'Does not shoot through the allied guard');
  assert(Math.hypot(a.x - (team ? 350 : 250), a.y - y) < 40, 'Only a local sidestep');
  assert(a.y >= b.bounds.top + 110 && a.y <= b.bounds.bottom - 85, 'Stays inside the battlefield');
  blockedCases++;
}
for (const kind of ['hold', 'move', 'attack']) {
  const order = { kind, x: 250, y: 500 };
  const { b, a, z } = encounter('german_pavise_crossbowman', { blocked: true, order });
  if (kind === 'attack') { order.targetId = z.id; a.target = z; }
  // Populate the spatial grid before exercising a blocked release directly.
  b.step(1 / 60); a.attack = 0; a.pendingAttack = null;
  b.resolveAttack(a, z, true);
  assert.equal(a.screenYield, null, `${kind}: does not replace a direct player order`);
  assert.equal(a.order, order);
}
console.log(`PASS crossbow fire: ${crossbows.length} types release/damage; ${blockedCases} blocked German cases (both teams, 30/60 Hz, edges); direct orders preserved`);
