import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { BattleFeedback } from '../src/crown-battle-feedback.js';

const b = new Battle({ historicalArmies: [{ roman: 2000 }, { viking: 2000 }], seed: 1066 });
const f = new BattleFeedback(b);
for (const u of b.units) Object.assign(u, { moving: true, x: (u.id % 80) * 30, y: Math.floor(u.id / 80) * 30 });
const before = structuredClone(b.units);
b.time = 1; f.update();
assert.equal(f.effects.length, 6, 'A frame emits at most six movement puffs');
assert(f.effects.every(e => e.kind === 'step-dust'));
const paused = structuredClone(f.effects);
for (let i = 0; i < 120; i++) f.update();
assert.deepEqual(f.effects, paused, 'Paused simulation neither spawns nor ages dust');
for (let i = 0; i < 30; i++) { b.time += .09; f.update(); }
assert(f.effects.length <= 36, 'Movement remains bounded in a 4000-soldier army');
assert.deepEqual(b.units, before, 'Cosmetics never mutate units');
f.effects = Array.from({ length: 72 }, () => ({ kind: 'armor-hit', born: b.time, life: 1 }));
b.time += .09; f.update();
assert.equal(f.effects.length, 72, 'Movement reserves capacity for combat impacts');
f.effects = []; f.listener = () => ({ x: -10000, y: -10000, zoom: 1 });
b.time += .09; f.update();
assert.equal(f.effects.length, 0, 'Offscreen movement does not emit particles');
f.listener = null;
for (const u of b.units) u.moving = false;
b.time += 1; f.update();
assert.equal(f.effects.length, 0, 'Stationary armies leave no persistent dust');
const horse = { type: 'cavalry', id: 1, hp: 100, moving: true, phase: 0, face: 1, x: 100, y: 100, headingX: 0, headingY: 1 };
const mountedBattle = { units: [horse], time: 0, winner: null };
const mountedFeedback = new BattleFeedback(mountedBattle);
const horseBefore = structuredClone(horse);
let normalCount = 0;
for (let i = 1; i <= 50; i++) {
  mountedBattle.time = i * .08;
  mountedFeedback.effects = [];
  mountedFeedback.movementDust(mountedBattle.time);
  normalCount += mountedFeedback.effects.length;
  for (const e of mountedFeedback.effects) {
    assert(e.hoof && e.mounted && !e.charging);
    assert.equal(e.angle, Math.PI / 2, 'Vertical travel retains its dust direction');
    assert.equal(e.x, 100, 'Dust stays at the original ground contact');
  }
}
assert(normalCount >= 10 && normalCount <= 12, 'Normal canter emits on half-strides');
assert.deepEqual(horse, horseBefore, 'Hoof cadence does not mutate the soldier');
horse.charge = { age: 1 };
let chargeCount = 0;
for (let i = 51; i <= 100; i++) {
  mountedBattle.time = i * .08;
  mountedFeedback.effects = [];
  mountedFeedback.movementDust(mountedBattle.time);
  chargeCount += mountedFeedback.effects.length;
  assert(mountedFeedback.effects.every(e => e.charging));
}
assert(chargeCount > normalCount, 'Charging produces more frequent hoof contacts');
for (const state of [{ moving: false }, { moving: true, hp: 0 }, { hp: 100, removed: true }]) {
  Object.assign(horse, state); mountedFeedback.effects = [];
  mountedBattle.time += 1; mountedFeedback.movementDust(mountedBattle.time);
  assert.equal(mountedFeedback.effects.length, 0, 'Stopped, dead or removed horses emit no dust');
}
console.log('PASS movement dust: bounded sampling, pause, 4000 units, combat priority, culling, expiry, hoof cadence, charge and simulation parity');
