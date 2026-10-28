import assert from 'node:assert/strict';
import { Battle, TYPES } from '../src/crown-battle.js';

{
  const armies = [{ sword: 0, pike: 0, archer: 37, cavalry: 123 }, { sword: 81, pike: 205, archer: 0, cavalry: 0 }];
  const b = new Battle({ armies, difficulty: 'hard' });
  for (const [team, army] of armies.entries()) for (const [type, number] of Object.entries(army)) assert.equal(b.units.filter(u => u.team === team && u.type === type).length, number, 'Custom counts must remain exact, including zero');
  assert.deepEqual(b.initial, [160, 286]);
  for (let i = 0; i < 60; i++) b.step(1 / 30);
  assert.ok(b.units.every(u => Number.isFinite(u.x) && Number.isFinite(u.y)));
  for (const preset of ['field', 'wall', 'flank']) {
    const large = new Battle({ preset, armies: [{ sword: 0, pike: 0, archer: 0, cavalry: 1001 }, { sword: 0, pike: 0, archer: 2, cavalry: 0 }] });
    assert.deepEqual(large.initial, [1001, 2], 'Custom armies must bypass the old total cap');
    assert.ok(large.units.every(u => u.x >= 35 && u.x <= 565 && u.y >= 110 && u.y <= 875), 'Large cavalry formations fit the field at spawn');
  }
  for (const value of [-1, .5, NaN, Infinity]) assert.throws(() => new Battle({ armies: [{ ...armies[0], cavalry: value }, armies[1]] }));
  assert.throws(() => new Battle({ armies: [{ sword: 0, pike: 0, archer: 0, cavalry: 0 }, armies[1]] }));
  console.log('PASS: exact custom rosters, omitted types, cavalry-only 1001-unit armies, valid formations, invalid/empty army validation.');
}

function duel(type, enemies) {
  const b = new Battle({ size: 40 });
  const source = b.units.find(u => !u.team && u.type === type);
  const targets = enemies.map((type, i) => { const target = { ...b.units.find(u => u.team && u.type === type), id: 100 + i, x: 220 + i * 5, y: 400 + i * 6, hp: TYPES[type].hp, maxHp: TYPES[type].hp }; return target; });
  source.x = 195; source.y = 400; source.cooldown = 0; source.chargeCooldown = 0;
  b.units = [source, ...targets]; return { b, source, targets };
}
{
  const { b, source, targets } = duel('cavalry', ['sword', 'sword', 'sword']);
  // Two bodies ahead resist successive impacts; a nearby flank is not a hit.
  source.speed = 110;
  Object.assign(targets[1], { x: 229, y: 400 });
  Object.assign(targets[2], { x: 223, y: 425 });
  for (const u of targets) { u.order = { kind: 'hold' }; u.cooldown = 100; }
  b.startCharge(source, targets[0]);
  for (let i = 0; i < 15 && b.stats.chargeHits < 2; i++) b.step(1 / 30);
  assert.equal(b.stats.chargeHits, 2, 'Charge contacts successive bodies in its forward lane');
  assert.ok(targets.slice(0, 2).every(u => u.hp < u.maxHp), 'Contact damages both forward bodies');
  assert.equal(targets[2].hp, targets[2].maxHp, 'A nearby body outside the lane is not struck');
}
{
  const { b, source, targets } = duel('cavalry', ['pike']);
  b.startCharge(source, targets[0]); b.step(1 / 30);
  assert.equal(source.charge, null, 'Pikes stop a charge'); assert.ok(b.stats.pikeCounters > 0); assert.ok(source.hp < source.maxHp);
}
{
  const { b, source, targets } = duel('archer', ['sword']); targets[0].x = 330;
  b.step(1 / 30); assert.equal(b.stats.arrows, 0, 'Bow winds up before release');
  for (let i = 0; i < 4; i++) b.step(1 / 30);
  assert.equal(b.stats.arrows, 1); assert.equal(targets[0].hp, targets[0].maxHp, 'Arrow damage waits for flight');
  for (let i = 0; i < 25; i++) b.step(1 / 30);
  assert.ok(targets[0].hp < targets[0].maxHp, 'Arrow hits at end of flight');
}
{
  const b = new Battle(); b.select('cavalry'); assert.ok(b.selected.size > 0);
  const selected = b.units.filter(u => b.selected.has(u.id)); b.moveSelected(300, 150);
  assert.ok(selected.every(u => u.order)); b.engageSelected(); assert.ok(selected.every(u => !u.order));
  b.selectArea({ x: 0, y: 0 }, { x: 600, y: 960 }); assert.equal(b.selected.size, b.initial[0]);
}
{
  const a = new Battle({ seed: 17, size: 80 }), b = new Battle({ seed: 17, size: 80 });
  for (let i = 0; i < 600; i++) { a.step(1 / 30); b.step(1 / 30); }
  assert.deepEqual(a.units.map(u => [u.x, u.y, u.hp]), b.units.map(u => [u.x, u.y, u.hp]), 'Seed and commands reproduce battle');
}
for (const preset of ['field', 'wall', 'flank']) {
  const b = new Battle({ seed: 1066, size: 160, preset });
  for (let i = 0; i < 5500 && b.winner === null; i++) b.step(1 / 30);
  assert.notEqual(b.winner, null, `${preset} must resolve`);
  assert.ok(b.units.every(u => [u.x, u.y, u.hp].every(Number.isFinite)), 'No invalid state');
  assert.ok(b.units.every(u => u.x >= 35 && u.x <= 565 && u.y >= 110 && u.y <= 875), 'Units stay on map');
  assert.ok(b.stats.arrows > 0 && b.stats.charges > 0, 'Army uses ranged fire and charges');
  const time = b.time; b.step(1 / 30); assert.equal(b.time, time, 'Finished simulation freezes');
  console.log(`PASS ${preset}: ${b.time.toFixed(1)}s; remaining ${b.counts()}; charges ${b.stats.charges}; arrows ${b.stats.arrows}`);
}
console.log('PASS: charge area/knockback, pike counter, arrow flight, orders, deterministic simulation, all scenario outcomes.');
