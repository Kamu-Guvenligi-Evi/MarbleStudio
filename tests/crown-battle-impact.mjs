import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';

function pair(type = 'sword', expandedMap = false) {
  const army = kind => ({ sword: 0, pike: 0, cavalry: 0, archer: 0, [kind]: 1 });
  const b = new Battle({ armies: [army(type), army('sword')], expandedMap });
  const [a, z] = b.units;
  Object.assign(a, { x: 250, y: 400, cooldown: 0, chargeCooldown: 100, order: { kind: 'hold' } });
  Object.assign(z, { x: type === 'archer' ? 350 : 262, y: 400, cooldown: 100, order: { kind: 'hold' } });
  return { b, a, z };
}
const ticks = (b, n, dt = 1 / 60) => { for (let i = 0; i < n; i++) b.step(dt); };

for (const dt of [1 / 120, 1 / 60, 1 / 30, 1 / 20]) {
  const { b, a, z } = pair();
  b.step(dt);
  assert.equal(z.hp, z.maxHp, 'Wind-up is visible before damage');
  assert.equal(a.attack, .24);
  let hits = 0, previous = z.hp;
  for (let i = 0; i < Math.ceil(.3 / dt); i++) {
    b.step(dt);
    if (previous !== z.hp) {
      hits++;
      assert.ok(a.attack <= .12 && a.attack >= .12 - dt - 1e-8, 'Damage occurs at the contact frame');
    }
    previous = z.hp;
  }
  assert.equal(hits, 1, 'One swing produces exactly one hit');
}
for (const cancel of ['move', 'stop', 'retarget', 'death', 'remove', 'escape']) {
  const { b, a, z } = pair();
  // Keep the simulation alive after death/removal, so freezing cannot mask a late hit.
  b.units.push({ ...a, id: 2, x: 100, y: 200, cooldown: 100, target: null });
  b.step(1 / 60); b.selected = new Set([a.id]);
  if (cancel === 'move') b.moveSelected(100, 600);
  if (cancel === 'stop') b.stopSelected();
  if (cancel === 'retarget') b.attackSelected(z.id);
  if (cancel === 'death') b.hit(a, 10000);
  if (cancel === 'remove') b.removeSelected();
  if (cancel === 'escape') z.x = 350;
  ticks(b, 18);
  assert.equal(z.hp, z.maxHp, `${cancel} prevents the committed hit`);
  assert.equal(a.pendingAttack, null);
  assert.equal(b.winner, null);
}
{
  const { b, a, z } = pair('archer'); b.step(1 / 60);
  assert.equal(b.projectiles.length, 0);
  for (let i = 0; i < 10 && !b.projectiles.length; i++) b.step(1 / 60);
  assert.equal(b.projectiles.length, 1);
  assert.ok(a.attack <= .12 && a.attack > .09);
  assert.equal(z.hp, z.maxHp, 'Release frame does not apply damage');
  ticks(b, 30);
  assert.ok(z.hp < z.maxHp, 'Impact follows the flight');
}
for (const [x, y] of [[250, 500], [150, 400]]) {
  const { b, a, z } = pair('archer'); Object.assign(z, { x, y });
  ticks(b, 10);
  const p = b.projectiles[0]; assert.ok(p && Number.isFinite(p.angle));
  if (x === a.x) assert.ok(Math.abs(Math.cos(p.angle)) < 1e-8, 'Vertical arrows point along vertical flight');
  else assert.ok(Math.cos(p.angle) < 0, 'Leftward arrows point left');
  b.units.push({ ...a, id: 2, x: 100, y: 200, cooldown: 100, target: null, pendingAttack: null });
  b.hit(a, 10000); ticks(b, 30);
  assert.ok(z.hp < z.maxHp, 'An already released arrow survives the shooter');
}
{
  const { b, a, z } = pair('sword', true);
  assert.deepEqual(b.bounds, { left: -2100, right: 2700, top: -3360, bottom: 4320 });
  Object.assign(a, { x: -2000, y: -3200, order: null });
  Object.assign(z, { x: 2600, y: 4200 });
  b.step(1 / 30);
  assert.equal(a.target, z, 'Target search spans the expanded diagonal');
  b.select(); b.moveSelected(-9999, 9999);
  assert.equal(a.order.x, -2055); assert.equal(a.order.y, 4225);
  Object.assign(a, { x: -800, y: -1300, cooldown: 0 });
  Object.assign(z, { x: -788, y: -1300 });
  b.stopSelected(); ticks(b, 20);
  assert.ok(z.hp < z.maxHp, 'Negative grid coordinates support combat');
  Object.assign(a, { x: 1400, y: 2300, cooldown: 0 });
  Object.assign(z, { x: 1412, y: 2300 });
  b.stopSelected(); const hp = z.hp; ticks(b, 20);
  assert.ok(z.hp < hp, 'Combat works beyond the old right/bottom edges');
  assert.ok(a.x > 900 && a.y > 1440);
}
console.log('PASS: contact-frame damage at 20/30/60/120 Hz, interrupted/escaped attacks, projectile release and flight, expanded-map commands/targeting/combat');
