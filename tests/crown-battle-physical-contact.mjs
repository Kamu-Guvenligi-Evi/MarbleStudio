import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { arrowBodyContact } from '../src/crown-battle-contact.js';
import { createArrow, createBullet, loftArrow, advanceArrow } from '../src/crown-battle-projectiles.js';

const army = type => ({ sword: 0, pike: 0, archer: 0, cavalry: 0, [type]: 1 });
function pair(type = 'archer', enemy = 'sword') {
  const b = new Battle({ seed: 71, armies: [army(type), army(enemy)] });
  const [a, z] = b.units;
  Object.assign(a, { x: 200, y: 450, cooldown: 100, chargeCooldown: 100, headingX: 1, headingY: 0, order: { kind: 'hold' } });
  Object.assign(z, { x: 300, y: 450, cooldown: 100, chargeCooldown: 100, headingX: -1, headingY: 0, order: { kind: 'hold' } });
  return { b, a, z };
}
function body(b, template, id, x, y, team = template.team) {
  const u = { ...template, id, x, y, team, target: null, lastX: undefined, lastY: undefined };
  b.units.push(u); return u;
}
function run(b, seconds, hz) { for (let i = 0; i < seconds * hz; i++) b.step(1 / hz); }

{
  const { a, z } = pair();
  const p = createArrow(a, z, 20);
  const energy = p.vx ** 2 + p.vy ** 2 + p.vz ** 2, duration = p.duration;
  assert(loftArrow(p, z));
  assert(Math.abs((p.vx ** 2 + p.vy ** 2 + p.vz ** 2) / energy - 1) < 1e-6, 'loft preserves launch energy');
  assert(p.duration > duration * 2, 'higher arc costs flight time');
  const vx = p.vx, vy = p.vy;
  z.y += 80; advanceArrow(p, .5);
  assert.equal(p.vx, vx); assert.equal(p.vy, vy);
  assert.equal(p.groundY, a.y, 'loft cannot home after release');
}
{
  const { b, a, z } = pair();
  const ally = body(b, z, 100, 280, 450, a.team);
  b.step(1 / 60); b.resolveAttack(a, z, true);
  assert.equal(b.projectiles.length, 1);
  assert(b.projectiles[0].lofted, 'known allied obstruction selects a high arc');
  run(b, 3.5, 60);
  assert.equal(ally.hp, ally.maxHp, 'high arc clears allied body');
  assert(z.hp < z.maxHp, 'high arc descends onto stationary target');
}
{
  const { b, a, z } = pair();
  // Direct fire cannot loft: wait until the visible friendly obstruction clears.
  a.combatProfile = { ...a.combatProfile, config: { reach: 170, damage: 20, projectile: 'bullet' }, role: 'archer' };
  const ally = body(b, z, 100, 280, 450, a.team);
  let releases = 0; b.onCombatEvent = event => { if (event.kind === 'attack') releases++; };
  b.step(1 / 60); b.resolveAttack(a, z, true);
  assert.equal(b.projectiles.length, 0); assert.equal(b.stats.heldShots, 1);
  assert.equal(releases, 0, 'held fire must not emit an attack event');
  ally.y += 50; b.step(1 / 60); b.resolveAttack(a, z, true);
  assert.equal(b.projectiles.length, 1); assert.equal(releases, 1);
  run(b, .5, 60); assert(z.hp < z.maxHp); assert.equal(ally.hp, ally.maxHp);
}

for (const hz of [20, 30, 60, 120]) {
  {
    const dt = 1 / hz;
    const p = { fromX: 0, fromY: 0, vx: 14 / dt, vy: 0, releaseHeight: 13, vz: 0, gravity: 0 };
    const crossing = { id: 2, x: 7, y: 10, lastX: 7, lastY: -10 };
    assert.notEqual(arrowBodyContact(p, crossing, 0, dt / 2, dt), null,
      `${hz} Hz: terminal half-frame includes a body crossing before the projectile expires`);
    const late = { ...crossing, y: 0, lastY: -20 };
    assert.equal(arrowBodyContact(p, late, 0, dt / 2, dt), null,
      `${hz} Hz: body entering after projectile expiry must not be hit retroactively`);
    assert.notEqual(arrowBodyContact(p, late, 0, dt / 2, Infinity), null,
      'fire-line prediction still uses current stationary positions');
  }
  {
    const { b, a, z } = pair();
    const blocker = body(b, z, 100, 280, 450);
    b.projectiles.push(createBullet(a, z, 20)); run(b, .5, hz);
    assert(blocker.hp < blocker.maxHp, 'fast direct fire hits first body without tunneling');
    assert.equal(z.hp, z.maxHp);
  }
  {
    const { b, a, z } = pair();
    b.projectiles.push(createBullet(a, z, 20)); z.y += 60; run(b, .5, hz);
    assert.equal(z.hp, z.maxHp, 'a bullet cannot home onto a dodging target');
    assert.equal(b.projectiles.length, 0);
  }
  for (const ally of [false, true]) {
    const { b, a, z } = pair();
    const blocker = body(b, z, 100, 280, 450, ally ? a.team : z.team);
    b.resolveAttack(a, z, true); run(b, .8, hz);
    assert(blocker.hp < blocker.maxHp, `${hz} Hz: first body intercepts arrow (ally=${ally})`);
    assert.equal(z.hp, z.maxHp, 'an arrow cannot pass through a body and hit the selected target');
  }
  {
    const { b, a, z } = pair(); z.x = 360;
    const low = body(b, z, 100, 280, 450);
    b.resolveAttack(a, z, true); run(b, .8, hz);
    assert.equal(low.hp, low.maxHp, 'high arc passes above an intervening infantryman');
    assert(z.hp < z.maxHp, 'descending arrow reaches intended body');
  }
  {
    const { b, a, z } = pair();
    const behind = body(b, z, 100, 320, 450);
    b.resolveAttack(a, z, true); z.y += 70; run(b, .8, hz);
    assert(behind.hp < behind.maxHp, 'miss continues and can hit a different body');
    assert.equal(z.hp, z.maxHp);
  }
  {
    const { b, a, z } = pair('cavalry');
    a.x = 277; a.order = null; a.speed = 43;
    const rear = body(b, z, 100, 265, 450);
    const side = body(b, z, 101, 282, 470);
    b.startCharge(a, z); b.step(1 / hz);
    assert.equal(rear.hp, rear.maxHp, 'charge cannot hit behind the rider');
    assert.equal(side.hp, side.maxHp, 'charge cannot hit a body outside its lane');
    assert(a.speed < 115, 'ordinary cavalry accelerates instead of teleporting to top speed');
  }
}
{
  // Both endpoints miss; the body crosses the projectile during the frame.
  const p = { fromX: 0, fromY: 0, vx: 280, vy: 0, releaseHeight: 13, vz: 0, sourceId: 1 };
  const u = { id: 2, x: 7, y: 10, lastX: 7, lastY: -10 };
  const t = arrowBodyContact(p, u, 0, .05, .05);
  assert(t > 0 && t < .05, 'swept collision catches a moving body between frame endpoints');
}
{
  const { b, a, z } = pair();
  const behind = body(b, z, 100, 320, 450);
  b.resolveAttack(a, z, true);
  b.activeTeam = z.team; b.selected.add(z.id); b.removeSelected();
  assert.equal(b.projectiles.length, 1, 'removing the original target does not erase the arrow');
  run(b, .8, 60); assert(behind.hp < behind.maxHp);
}
{
  const { b, a, z } = pair();
  // Many candidates in one bucket: physical contacts may not use AI samples.
  for (let i = 0; i < 60; i++) body(b, z, 100 + i, 280, 475);
  const blocker = body(b, z, 999, 280, 450);
  b.resolveAttack(a, z, true); b.step(1 / 60);
  const grid = b.grid;
  // Freeze positions and the built grid to isolate collision from crowd pushing.
  b.updateUnits = () => { b.grid = grid; };
  run(b, .8, 60); assert(blocker.hp < blocker.maxHp, 'unsampled body in crowded bucket still intercepts');
}
{
  const damages = [];
  for (const speed of [43, 110]) {
    const { b, a, z } = pair('cavalry'); a.x = 281; a.order = null; a.speed = speed;
    b.startCharge(a, z); b.step(1 / 60); damages.push(z.maxHp - z.hp);
  }
  assert(damages[1] > damages[0] * 1.5, 'fast impact does more damage than a slow impact');
}
{
  const { b, a, z } = pair('cavalry'); a.x = 281; a.order = null; a.speed = 110;
  for (let i = 1; i <= 5; i++) body(b, z, 100 + i, 300 + i * 9, 450);
  b.startCharge(a, z); run(b, .8, 60);
  assert(b.stats.chargeHits <= 2, 'a horse cannot plow through unlimited ranks at full momentum');
  assert.equal(a.charge, null, 'successive body impacts exhaust the charge momentum');
}
console.log('PASS physical contact: 20/30/60/120 Hz arrow interception, allied bodies, arc clearance, overshoot, forward charge lane, acceleration, speed-dependent impact, rank resistance');
