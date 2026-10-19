import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { BattleFeedback, combatOffset } from '../src/crown-battle-feedback.js';
import { battleSoundSamples } from '../src/crown-battle-audio.js';

function pair(type = 'samurai') {
  const b = new Battle({ historicalArmies: [{ [type]: 1 }, { roman: 1 }] });
  const [a, z] = b.units;
  Object.assign(a, { x: 250, y: 400, headingX: 1, headingY: 0, face: 1, cooldown: 0, chargeCooldown: 100, order: { kind: 'hold' } });
  Object.assign(z, { x: ['janissary', 'mongol'].includes(type) ? 350 : 263, y: 400, cooldown: 100, order: { kind: 'hold' } });
  return { b, a, z };
}
for (const type of ['samurai', 'janissary', 'mongol', 'timur']) {
  // Historical equipment controls behavior, not a civilization/name test.
  const { b, a, z } = pair(type), sounds = [], feedback = new BattleFeedback(b, { play: kind => sounds.push(kind) });
  b.step(1 / 60); assert.equal(feedback.effects.length, 0, 'Wind-up has no false contact');
  for (let i = 0; i < 10; i++) { b.step(1 / 60); feedback.update(); }
  const expected = { samurai: 'slash', janissary: 'muzzle', mongol: 'release', timur: 'dust' }[type];
  assert(feedback.effects.some(e => e.kind === expected), `${type} release effect`);
  assert(sounds.includes({ samurai: 'clash', janissary: 'gun', mongol: 'bow', timur: 'stomp' }[type]));
  if (type === 'janissary' || type === 'mongol') assert.equal(z.hp, z.maxHp, 'Launch is not impact');
  const before = sounds.length; b.hit(z, 0, a); assert.equal(sounds.length, before, 'No zero-damage impact');
  if (type === 'samurai' || type === 'timur') assert.equal(sounds.length, 1, 'One contact does not make two overlapping sounds');
}
{
  const { b, a, z } = pair(), f = new BattleFeedback(b);
  b.clearShot = () => false; b.resolveAttack(a, z, false); assert.equal(f.effects.length, 0, 'Wall blocks contact');
  for (let i = 0; i < 10000; i++) f.onEvent({ kind: 'hit', target: { x: i * 40, y: 400 } });
  assert.equal(f.effects.length, 96); assert(f.cells.size <= 96);
  b.time += 1; f.update(); assert.equal(f.effects.length, 0); assert.equal(f.cells.size, 0);
  a.attack = .12; assert(combatOffset(a) > 0); a.attack = 0; assert.equal(combatOffset(a), 0);
  a.attack = .21; assert(combatOffset(a) < 0, 'Melee preparation pulls back before contact');
  a.attack = .12; const strike = combatOffset(a);
  a.attack = .03; assert(combatOffset(a) < strike, 'The body recovers after contact');
  a.face = -1; a.attack = .12; assert.equal(combatOffset(a), -strike, 'Both facing directions use the same motion');
  const { a: gunner } = pair('janissary');
  gunner.attack = .18; assert.equal(Math.abs(combatOffset(gunner)), 0, 'No recoil before a shot');
  gunner.attack = .06; assert(combatOffset(gunner) < 0, 'Recoil starts after release');
}
{
  const first = pair('janissary'), second = pair('janissary'), f = new BattleFeedback(second.b);
  for (let i = 0; i < 600; i++) { first.b.step(1 / 30); second.b.step(1 / 30); f.update(); }
  assert.deepEqual(second.b.units, first.b.units, 'Feedback cannot change seeded combat');
  assert.deepEqual(second.b.stats, first.b.stats);
}
const signatures = [];
{
  const army = { sword: 0, pike: 1, cavalry: 0, archer: 0 };
  const b = new Battle({ armies: [army, army] }), f = new BattleFeedback(b), [a, z] = b.units;
  Object.assign(a, { x: 250, y: 400, headingX: 1, headingY: 0 }); Object.assign(z, { x: 268, y: 400 });
  b.resolveAttack(a, z, false); assert(f.effects.some(e => e.kind === 'thrust'), 'Classic pike thrust');
}
for (const kind of ['gun', 'bow', 'clash', 'hit', 'stomp']) {
  const sample = battleSoundSamples(kind, 24000);
  assert(sample.every(Number.isFinite)); assert(Math.max(...sample.map(Math.abs)) <= .9);
  const energy = sample.reduce((sum, value) => sum + value * value, 0) / sample.length;
  assert(energy > .00001, `${kind} is audible data`); signatures.push(energy);
  assert.equal(sample[0], 0); assert(Math.abs(sample.at(-1)) < .00001);
}
assert.equal(new Set(signatures).size, 5);
console.log('PASS feedback: attack/impact timing, weapon effects, obstruction, bounded effects, seeded parity, five non-silent samples');
