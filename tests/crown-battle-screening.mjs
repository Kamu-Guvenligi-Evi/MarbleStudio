import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { requestRangedLane } from '../src/crown-battle-screening.js';
const tick = (b, seconds, hz = 30) => { for (let i = 0; i < seconds * hz; i++) b.step(1 / hz); };
const ranged = u => u.combatProfile.ranged;
const classicArmies = armies => armies.map(a => ({ sword: 0, pike: 0, archer: 0, cavalry: 0, ...a }));
const results = [];

for (const type of ['archer', 'german_pavise_crossbowman']) for (const team of [0, 1]) for (const hz of [30, 60]) {
  const classic = type === 'archer';
  const armies = classic ? [{ archer: 1, sword: 1 }, { sword: 1 }] : [{ [type]: 1, roman: 1 }, { roman: 1 }];
  if (team) armies.reverse();
  const b = new Battle({ seed: 42, ...(classic ? { armies: classicArmies(armies) } : { historicalArmies: armies }) });
  const shooter = b.units.find(u => u.team === team && ranged(u));
  const guard = b.units.find(u => u.team === team && !ranged(u));
  const enemy = b.units.find(u => u.team !== team);
  const x = n => team ? 600 - n : n;
  Object.assign(shooter, { x: x(300), y: 450, cooldown: 1000 });
  Object.assign(guard, { x: x(250), y: 450, cooldown: 1000, armyId: 'allied-reinforcements' });
  Object.assign(enemy, { x: x(380), y: 450, cooldown: 1000 });
  tick(b, 6, hz);
  const depth = (guard.x - shooter.x) * (team ? -1 : 1);
  assert.ok(depth > 16, `${type}/${team}/${hz}: shooter behind allied melee, depth=${depth}`);
  assert.ok((guard.x - x(250)) * (team ? -1 : 1) > 25, 'Guard advances to intercept');
  assert.ok(Math.hypot(shooter.x - guard.x, shooter.y - guard.y) > 7, 'Separate physical bodies');
  assert.ok(shooter.hp > 0);
  results.push({ type, team, hz, depth: +depth.toFixed(1) });
}

// A firing line makes room even before enemies reach retreat distance.
for (const team of [0, 1]) {
  const armies = [{ archer: 12, sword: 12 }, { sword: 12 }];
  if (team) armies.reverse();
  const b = new Battle({ armies: classicArmies(armies), seed: 12 });
  const x = n => team ? 600 - n : n;
  const bows = b.units.filter(u => u.team === team && ranged(u));
  const infantry = b.units.filter(u => u.team === team && !ranged(u));
  bows.forEach((u, i) => Object.assign(u, { x: x(275 + Math.floor(i / 6) * 10), y: 410 + i % 6 * 12, cooldown: 1000 }));
  infantry.forEach((u, i) => Object.assign(u, { x: x(252 - Math.floor(i / 6) * 10), y: 410 + i % 6 * 12, cooldown: 1000 }));
  b.units.filter(u => u.team !== team).forEach((u, i) => Object.assign(u, { x: x(405), y: 400 + i * 10, order: { kind: 'hold' }, cooldown: 1000 }));
  tick(b, 12);
  const crossed = infantry.filter(u => (u.x - x(300)) * (team ? -1 : 1) > 0).length;
  assert.equal(crossed, infantry.length, `All rear melee pass ranged ranks, team=${team}, passed=${crossed}`);
  assert.ok(bows.every(u => u.hp > 0));
  assert.ok((b.stats.screenChecks || 0) < 30000, 'Bounded local screening samples');
  results.push({ team, crossed });
}

// A direct order remains authoritative even under close pressure.
for (const kind of ['hold', 'move', 'attack']) {
  const b = new Battle({ armies: classicArmies([{ archer: 1, sword: 1 }, { sword: 1 }]) });
  const shooter = b.units.find(ranged), guard = b.units.find(u => !u.team && !ranged(u)), enemy = b.units.find(u => u.team);
  Object.assign(shooter, { x: 300, y: 450, cooldown: 1000, target: enemy, order: { kind, x: 300, y: 520, targetId: enemy.id } });
  Object.assign(guard, { x: 250, y: 450, cooldown: 1000 });
  Object.assign(enemy, { x: 365, y: 450, order: { kind: 'hold' }, cooldown: 1000 });
  tick(b, .5);
  assert.equal(shooter.screening, null);
  assert.equal(shooter.order.kind, kind);
  if (kind === 'hold') assert.equal(shooter.x, 300);
}

// Spearmen and mounted melee can also clear a ranged line. A sideways
// formation movement must not ask the same shooters to abandon their slots.
for (const type of ['sword', 'pike', 'cavalry']) {
  const b = new Battle({ armies: classicArmies([{ archer: 1, [type]: 1 }, { sword: 1 }]) });
  const bow = b.units.find(ranged), guard = b.units.find(u => !u.team && !ranged(u)), enemy = b.units.find(u => u.team);
  Object.assign(bow, { x: 280, y: 450 });
  Object.assign(guard, { x: 265, y: 450, target: enemy });
  Object.assign(enemy, { x: 400, y: 450 });
  assert.equal(requestRangedLane(b, guard, bow, 0, 1, 0), false, 'Flanking movement leaves the bow centre intact');
  assert.equal(requestRangedLane(b, guard, bow, 1, 0, 0), true, `${type} requests a passage towards the enemy`);
  assert.ok(bow.screenYield.until > b.time);
}

// No imaginary screen behind dead troops or other archers.
{
  const b = new Battle({ armies: classicArmies([{ archer: 2, sword: 1 }, { sword: 1 }]) });
  const bows = b.units.filter(ranged), guard = b.units.find(u => !u.team && !ranged(u)), enemy = b.units.find(u => u.team);
  bows.forEach((u, i) => Object.assign(u, { x: 300 - i * 40, y: 450, cooldown: 1000 }));
  Object.assign(guard, { x: 250, y: 450, hp: 0 });
  Object.assign(enemy, { x: 380, y: 450, cooldown: 1000 });
  tick(b, .5);
  assert.ok(bows.every(u => !u.screening));
}
console.log('PASS ranged cover, allied guards, mirrored directions, 30/60Hz, dense rank exchange and manual orders:', JSON.stringify(results));
