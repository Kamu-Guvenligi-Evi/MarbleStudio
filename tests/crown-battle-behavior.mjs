import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { Battle, UNIT_TYPES } from '../src/crown-battle.js';
import { conditionSpeed } from '../src/crown-battle-condition.js';

const dt = 1 / 30;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const army = (type, count = 1) => ({ sword: 0, pike: 0, archer: 0, cavalry: 0, [type]: count });
function pair(type, enemy, historical = false) {
  const b = new Battle({ seed: 1427, ...(historical ? { historicalArmies: [{ [type]: 1 }, { [enemy]: 1 }] } : { armies: [army(type), army(enemy)] }) });
  const [a, z] = b.units;
  Object.assign(a, { x: 200, y: 450, cooldown: 0, chargeCooldown: 0 });
  Object.assign(z, { x: 300, y: 450, cooldown: 1000, chargeCooldown: 1000, order: { kind: 'hold' } });
  return { b, a, z };
}
function run(b, seconds, inspect = () => {}) {
  for (let i = 0; i < Math.round(seconds / dt) && b.winner === null; i++) { b.step(dt); inspect(); }
}

// Equal impact distance isolates the defender's orientation from approach time.
const impacts = [];
for (const angle of [Math.PI, Math.PI / 2, 0]) {
  const { b, a, z } = pair('cavalry', 'pike');
  // Test at actual weapon contact, not the former 28px radial damage aura.
  a.x = 280;
  Object.assign(z, { headingX: Math.cos(angle), headingY: Math.sin(angle) });
  b.startCharge(a, z); b.step(dt);
  impacts.push({ damage: z.maxHp - z.hp, counters: b.stats.pikeCounters, cavalryHp: a.hp });
}
assert.equal(impacts[0].counters, 1);
assert.equal(impacts[1].counters, 0); assert.equal(impacts[2].counters, 0);
assert.ok(impacts[0].damage < impacts[1].damage && impacts[0].cavalryHp < impacts[1].cavalryHp);
console.log('PASS directional pike: front counters; flank/rear receive greater charge damage');

{
  const { b, a, z } = pair('cavalry', 'sword');
  a.x = 150; z.hp = 10000;
  run(b, .4); assert.equal(b.stats.charges, 0, 'stationary cavalry must accelerate and run up');
  run(b, 4); assert.ok(b.stats.charges >= 1); assert.ok(b.stats.chargeHits >= 1);
  const contact = pair('cavalry', 'sword'); contact.a.x = 281; contact.z.hp = 10000;
  run(contact.b, 12); assert.equal(contact.b.stats.charges, 0, 'contact must not recharge charge damage');
  console.log('PASS cavalry: automatic charge after run-up; no contact charge over 12 seconds');
}

{
  const { b, a, z } = pair('mongol', 'roman', true);
  a.x = 300; z.x = 350; z.hp = 10000; z.order = null;
  let movingShots = 0, previousArrows = 0, maxDistance = 0;
  run(b, 45, () => {
    if (b.stats.arrows > previousArrows && a.moving) movingShots++;
    previousArrows = b.stats.arrows; maxDistance = Math.max(maxDistance, distance(a, z));
  });
  assert.ok(movingShots > 0); assert.ok(maxDistance > 65);
  assert.ok(a.evadeSpent > 500);
  assert.ok(z.hp < 9900, 'Fresh mounted archery still damages the pursuer');
  assert.ok(a.fatigue > 60 && conditionSpeed(a) < .7, 'Successful moving shots eventually cost speed instead of guaranteeing permanent spacing');
  console.log('PASS horse archer: effective moving fire accumulates fatigue; long pursuit covered in condition regression');
}

{
  const { b, a, z } = pair('archer', 'sword');
  z.x = 240; z.hp = 10000; z.order = null;
  run(b, 12); assert.ok(a.evadeSpent > 0 && a.evadeSpent <= 36);
  const melee = pair('archer', 'sword'); melee.z.x = 215; melee.a.order = { kind: 'hold' };
  melee.b.step(dt);
  assert.ok(melee.z.maxHp - melee.z.hp < UNIT_TYPES.archer.damage / 2);
  assert.equal(melee.b.stats.arrows, 0);
  console.log('PASS foot archer: bounded retreat and reduced contact damage');
}

{
  const b = new Battle({ seed: 1427, armies: [army('sword', 48), army('sword', 48)] });
  b.units.forEach((u, i) => {
    const n = i % 48;
    u.x = u.team ? 330 + (n % 6) * 4 : 270 - (n % 6) * 4;
    u.y = 400 + Math.floor(n / 6) * 4;
  });
  run(b, 1);
  assert.ok(new Set(b.units.filter(u => !u.team).map(u => u.target?.id)).size >= 8, 'approaches distribute across enemies');
  run(b, 89);
  assert.notEqual(b.winner, null, 'compressed melee must resolve without 180-second timeout');
  assert.ok(b.counts().includes(0));
  console.log(`PASS compressed melee: 48 vs 48 resolves in ${b.time.toFixed(1)}s`);
}

{
  const { b, a, z } = pair('cavalry', 'sword');
  z.hp = 10000; b.select(); b.startCharge(a, z); b.moveSelected(170, 530);
  assert.equal(a.charge, null);
  run(b, 8);
  assert.equal(a.order.kind, 'hold'); assert.ok(distance(a, { x: 170, y: 530 }) <= 4);
  assert.equal(z.hp, 10000, 'move order suppresses automatic attacks');
  const at = { x: a.x, y: a.y }; run(b, 3); assert.ok(distance(a, at) < .001);
  assert.equal(b.attackSelected(z.id), true); run(b, 1.5); assert.ok(distance(a, at) > 1);
  b.stopSelected(); const stopped = { x: a.x, y: a.y }; run(b, 2);
  assert.ok(distance(a, stopped) < .001); assert.equal(a.charge, null);
  b.attackSelected(z.id); z.hp = 0;
  // A second enemy keeps the battle live and must not replace the ordered target.
  b.units.push({ ...z, id: 2, hp: 1000, x: 500, target: null });
  b.step(dt); assert.equal(a.order.kind, 'hold');
  b.engageSelected(); assert.equal(a.order, null); run(b, 1); assert.ok(a.target?.hp > 0);
  console.log('PASS orders: movement/arrival hold, charge cancellation, explicit attack, stop, dead target, free engagement');
}

{
  const { b, a, z } = pair('janissary', 'roman', true);
  z.hp = 10000; a.order = { kind: 'hold' };
  const shotTimes = []; let lastShots = 0;
  run(b, 8, () => { if (b.stats.shots > lastShots) { shotTimes.push(b.time); lastShots = b.stats.shots; assert.equal(a.weaponPhase, 'fire'); } });
  assert.ok(shotTimes.length >= 3);
  for (let i = 1; i < shotTimes.length; i++) assert.ok(shotTimes[i] - shotTimes[i - 1] >= UNIT_TYPES.janissary.cooldown - 1e-8);
  b.select(); b.moveSelected(150, 700); run(b, 1);
  assert.equal(a.weaponPhase, 'ready'); assert.equal(a.reloadRemaining, 0);
  console.log('PASS firearm: distinct fire/reload cadence, reload continues during move orders');
}

{
  const { b, a, z } = pair('timur', 'roman', true);
  a.x = 280; z.hp = 10000;
  b.units.push({ ...z, id: 2, x: 305, y: 455 }, { ...z, id: 3, x: 310, y: 460 });
  b.step(dt); assert.ok(b.units.slice(1).every(u => u.hp === 10000), 'Elephant winds up before impact');
  run(b, .15); assert.ok(b.units.slice(1).every(u => u.hp < 10000));
  const stomps = b.stats.stomps; run(b, 1); assert.equal(b.stats.stomps, stomps);
  assert.equal(b.stats.charges, 0);
  console.log('PASS elephant: local area impact with bounded attack cadence');
}

{
  const b = new Battle({ armies: [army('sword'), army('sword', 2)] });
  const [a, z, other] = b.units;
  Object.assign(a, { x: 200, y: 400, cooldown: 1000 });
  for (const [u, y] of [[z, 399], [other, 401]]) Object.assign(u, { x: 290, y, cooldown: 1000, order: { kind: 'hold' } });
  b.step(dt); const first = a.target.id; let switches = 0;
  run(b, 2, () => { if (a.target.id !== first) switches++; });
  assert.equal(switches, 0, 'near-equivalent targets must not cause oscillation');
  console.log('PASS target hysteresis: retains equivalent reachable target');
}

{
  const b = new Battle({ seed: 1427, armies: [army('sword', 1200), army('sword', 1200)] });
  const begin = performance.now(); run(b, 2); const elapsed = performance.now() - begin;
  assert.ok(b.stats.targetChecks < 2400 * 96 * 10);
  assert.ok(b.stats.neighborChecks <= 2400 * 64 * 60);
  assert.ok(b.units.every(u => Number.isFinite(u.x) && Number.isFinite(u.y)));
  console.log(`PASS 2400 soldiers / 60 steps: ${elapsed.toFixed(0)}ms total; ${b.stats.targetChecks} target candidates; ${b.stats.neighborChecks} separation pairs`);
}
