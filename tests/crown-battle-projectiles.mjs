import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { createArrow, advanceArrow, projectilePose } from '../src/crown-battle-projectiles.js';

const source = { x: 250, y: 400, face: 1, team: 0 };
const target = { x: 400, y: 400, hp: 100 };
const near = createArrow(source, { ...target, x: 280 }, 10);
const far = createArrow(source, target, 10);
advanceArrow(near, near.duration / 2); advanceArrow(far, far.duration / 2);
assert(far.height - 13 > (near.height - 13) * 20, 'Long shots have higher ballistic arcs than close shots');
const moving = { ...target, moving: true, speed: 30, headingX: 0, headingY: 1 };
const lead = createArrow(source, moving, 10);
assert(lead.endY > moving.y, 'Aim ahead of a moving target');
assert(Math.abs(Math.hypot(lead.vx, lead.vy) - 280) < 1e-8, 'Lead preserves launch speed');
const copy = structuredClone(lead);
moving.x = 50; moving.y = 100;
advanceArrow(lead, .2); advanceArrow(copy, .2);
assert.deepEqual([lead.x, lead.y, lead.angle], [copy.x, copy.y, copy.angle], 'No homing after release');

for (const [sx, sy] of [[1, 1], [.54, 1.9], [.8, 2.5]]) {
  for (const [dx, dy] of [[150, 0], [-150, 0], [0, 150], [0, -150], [90, 90], [-90, -90]]) {
    for (const phase of [.1, .5, .9, 1.1]) {
      const p = createArrow({ ...source, face: dx < 0 ? -1 : 1 }, { ...target, x: source.x + dx, y: source.y + dy }, 10);
      advanceArrow(p, p.duration * phase);
      const at = projectilePose(p, sx, sy);
      advanceArrow(p, 1e-6);
      const next = projectilePose(p, sx, sy);
      const tangent = Math.atan2((next.y - at.y) / sy, (next.x - at.x) / sx);
      assert(Math.abs(Math.sin(tangent - at.angle)) < 1e-5, 'Arrowhead follows actual projected velocity, including after a miss');
    }
  }
}

function encounter() {
  const b = new Battle({ armies: [{ archer: 1, sword: 0, pike: 0, cavalry: 0 }, { sword: 1, archer: 0, pike: 0, cavalry: 0 }] });
  const [a, z] = b.units;
  Object.assign(a, { x: 250, y: 400, face: 1, cooldown: 100, order: { kind: 'hold' } });
  Object.assign(z, { x: 390, y: 400, cooldown: 100, order: { kind: 'hold' } });
  b.resolveAttack(a, z, true);
  return { b, a, z, p: b.projectiles[0] };
}
for (const dt of [1 / 120, 1 / 60, 1 / 30, 1 / 20]) {
  const { b, z, p } = encounter();
  let hits = 0, previous = z.hp;
  for (let i = 0; i < Math.ceil(1.5 / dt); i++) {
    b.step(dt);
    // Contact occurs at the front surface of the body, before its center.
    if (previous !== z.hp) { hits++; assert(b.time + 1e-9 >= p.duration - 4.75 / 280); previous = z.hp; }
  }
  assert.equal(hits, 1, 'One projectile applies damage exactly once');
  assert.equal(b.projectiles.length, 0);
}
{
  const { b, z, p } = encounter(); z.y += 80;
  for (let i = 0; i < 90; i++) b.step(1 / 60);
  assert.equal(z.hp, z.maxHp, 'A dodged shot does not deal remote damage');
  assert.equal(b.projectiles.length, 0);
  const mark = b.effects.find(e => e.kind === 'arrow-ground');
  assert(mark && mark.x > p.endX && mark.height === 0, 'Miss continues past intercept and lands');
  assert(Object.values(projectilePose(mark, .54, 1.9)).every(Number.isFinite));
  for (let i = 0; i < 200; i++) b.step(1 / 60);
  assert.equal(b.effects.length, 0, 'Ground arrows expire');
}
{
  const { b, z } = encounter();
  b.navigation = { clear: () => false };
  b.updateUnits = () => {};
  for (let i = 0; i < 70; i++) b.step(1 / 60);
  assert.equal(z.hp, z.maxHp, 'Blocked arrival does not damage a target');
}
{
  const { b, a, z } = encounter();
  for (let i = 0; i < 250; i++) b.resolveAttack(a, z, true);
  z.y += 80;
  for (let i = 0; i < 90; i++) b.step(1 / 60);
  assert(b.effects.length <= 96 && b.projectiles.length === 0, 'Large missed volleys have bounded remnants');
}
console.log('PASS arrows: ballistic range, fixed intercept/lead, 72 projected tangents, 20–120 Hz impacts, misses/landing/expiry, walls, bounded volley effects');
