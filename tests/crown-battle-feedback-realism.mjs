import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { BattleFeedback, drawCombatEffect } from '../src/crown-battle-feedback.js';

const b = new Battle({ historicalArmies: [{ samurai: 1 }, { roman: 1 }] });
const [a, z] = b.units;
Object.assign(a, { x: 250, y: 400 }); Object.assign(z, { x: 263, y: 400, hp: 10000 });
const heard = [], view = { x: 263, y: 400, zoom: 1 };
const f = new BattleFeedback(b, { play: (kind, pan, perspective) => heard.push({ kind, pan, ...perspective }) }, () => view);
for (let i = 0; i < 21; i++) { b.time += .1; b.hit(z, 10, a); }
assert(heard.every(e => e.kind === 'clash'), 'Armored melee has a steel contact');
const sparks = f.effects.filter(e => e.kind === 'sparks').length;
assert(sparks > 0 && sparks < f.effects.length / 2, 'Sparks are occasional, not every impact');
assert(f.effects.some(e => e.kind === 'armor-hit'));
b.time += .1; b.hit(z, 10, undefined, { x: z.x, y: z.y - 100 }, 'arrow');
assert.equal(heard.at(-1).kind, 'hit', 'Arrow impact is a dry contact, not a sword clang');
assert.equal(heard.at(-1).contact, 'armor', 'Armor material is forwarded for the dedicated arrow contact');
assert.equal(f.effects.at(-1).kind, 'armor-hit');
assert.equal(f.effects.at(-1).angle, Math.PI / 2, 'Impact direction follows the projectile origin');
z.type = 'archer'; b.time += .1; b.hit(z, 10, a);
assert.equal(heard.at(-1).kind, 'hit', 'Unarmored target does not clang');
for (const projectile of ['arrow', 'bolt', 'bullet']) {
  b.time += .1; b.hit(z, 1, undefined, a, projectile);
  assert.equal(heard.at(-1).contact, 'soft');
  assert.equal(heard.at(-1).projectileKind, projectile, 'Audio receives projectile identity for dedicated arrow/bolt contacts');
  assert.equal(f.effects.at(-1).kind, 'body-hit');
  assert.equal(f.effects.at(-1).projectileKind, projectile, 'Soft impact retains projectile identity for visuals');
  z.type = 'roman'; b.time += .1; b.hit(z, 1, undefined, a, projectile);
  assert.equal(heard.at(-1).contact, 'armor');
  assert.equal(f.effects.at(-1).kind, 'armor-hit', 'Projectiles do not throw sword sparks');
  assert.equal(f.effects.at(-1).projectileKind, projectile, 'Armor impact retains projectile identity for visuals');
  z.type = 'archer';
}
const mountedArcher = new Battle({ historicalArmies: [{ mongol: 1 }, { roman: 1 }] }).units[0];
z.type = 'roman'; b.time += .1; b.hit(z, 1, mountedArcher);
assert.equal(heard.at(-1).kind, 'clash', 'Mounted archer melee sidearm can hit armor');
b.time += .1; b.hit(z, 1, mountedArcher, mountedArcher, 'arrow');
assert.equal(heard.at(-1).weight, .65, 'Projectile weight is independent of its shooter mount');
z.type = 'archer';
view.x = 100; b.time += .1; b.hit(z, 10, a); const right = heard.at(-1);
view.x = 426; b.time += .1; b.hit(z, 10, a); const left = heard.at(-1);
assert(right.pan > 0 && left.pan < 0, 'Panning follows camera movement');
assert(right.gain < 1 && left.gain < 1);
view.x = 10000; const count = heard.length; b.time += .1; b.hit(z, 10, a);
assert.equal(heard.length, count, 'Very distant events do not spend audible voice budget');

// Test the real projectile path, including information retained until arrival.
for (const [type, targetType, material] of [
  ['mongol', 'roman', 'armor'], ['janissary', 'roman', 'armor'],
  ['norse_longbowman', 'genoese_crossbowman', 'armor'], ['norse_longbowman', 'crusader_crossbowman', 'soft'],
]) {
  const battle = new Battle({ historicalArmies: [{ [type]: 1 }, { [targetType]: 1 }] });
  const [shooter, target] = battle.units, events = [];
  const sounds = [];
  const feedback = new BattleFeedback(battle, { play: (kind, pan, perspective) => sounds.push({ kind, ...perspective }) });
  Object.assign(shooter, { x: 250, y: 400, cooldown: 100, chargeCooldown: 100, headingX: 1, headingY: 0, order: { kind: 'hold' } });
  Object.assign(target, { x: 350, y: 400, cooldown: 100, order: { kind: 'hold' } });
  battle.onCombatEvent = e => { events.push(e); feedback.onEvent(e); };
  battle.resolveAttack(shooter, target, true);
  assert(!events.some(e => e.kind === 'hit'), 'Launch never plays impact early');
  for (let i = 0; i < 40; i++) battle.step(1 / 60);
  const hit = events.find(e => e.kind === 'hit'); assert(hit, `${type} reaches target`);
  assert.equal(hit.projectileKind, type === 'janissary' ? 'bullet' : 'arrow');
  assert.equal(hit.origin.x, 250);
  const contact = sounds.find(e => e.kind === 'hit');
  assert(contact, `${type} hitting ${targetType} produces a contact`);
  assert.equal(contact.projectileKind, hit.projectileKind);
  assert.equal(contact.contact, material);
}
const fatal = new Battle({ historicalArmies: [{ samurai: 1 }, { roman: 1 }] });
const fatalFeedback = new BattleFeedback(fatal);
const [attacker, casualty] = fatal.units;
fatal.hit(casualty,100000,attacker);
const dust = fatalFeedback.effects.find(e=>e.kind==='fall-dust');
assert(dust && dust.born > fatal.time + .4, 'Ground dust waits for the falling body');
const noEarlyDraw = new Proxy({}, {set(){throw new Error('Ground dust drawn before contact');},get(){throw new Error('Ground dust drawn before contact');}});
drawCombatEffect(noEarlyDraw,dust,fatal.time);
fatalFeedback.update();assert(fatalFeedback.effects.includes(dust),'Scheduled ground contact survives cleanup');
fatal.time=dust.born+dust.life+.01;fatalFeedback.update();
assert(!fatalFeedback.effects.includes(dust),'Ground dust expires after contact');
console.log('PASS material contacts, sparse sparks, projectile timing/direction, camera stereo, delayed ground contact and expiry');
