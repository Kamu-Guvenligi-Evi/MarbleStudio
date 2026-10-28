import assert from 'node:assert/strict';
import { FORMATIONS, formationLayout } from '../src/crown-battle-formations.js';

const bounds = { left: -900, right: 1500, top: -1440, bottom: 2400 };
const radiusOf = u => u.radius;
let checked = 0, rejected = 0;
for (const kind of Object.keys(FORMATIONS)) for (const direction of [0, 90, 180, 270]) {
  for (const count of [1, 2, 3, 7, 16, 31, 64, 127, 300]) {
    const units = Array.from({ length: count }, (_, id) => ({ id, radius: id % 7 === 0 ? 14 : 5 }));
    for (const [x, y] of [[300, 480], [bounds.left, bounds.top], [bounds.right, bounds.bottom]]) {
      const plan = formationLayout(units, x, y, { kind, direction }, bounds, radiusOf);
      if (!plan.valid) { assert.equal(plan.slots.length, 0); rejected++; continue; }
      assert.equal(plan.slots.length, count);
      assert.equal(new Set(plan.slots.map(s => s.id)).size, count);
      for (let i = 0; i < count; i++) {
        const s = plan.slots[i];
        assert.ok(Number.isFinite(s.x) && Number.isFinite(s.y));
        assert.ok(s.x >= bounds.left + 45 && s.x <= bounds.right - 45);
        assert.ok(s.y >= bounds.top + 115 && s.y <= bounds.bottom - 95);
        for (let j = i + 1; j < count; j++) {
          const t = plan.slots[j];
          assert.ok(Math.hypot(s.x - t.x, s.y - t.y) + 1e-8 >= s.radius + t.radius,
            `${kind}/${direction}/${count}: overlapping bodies ${i},${j}`);
        }
      }
      checked++;
    }
  }
}
const units = Array.from({ length: 16 }, (_, id) => ({ id, radius: 5 }));
const layout = (kind, direction = 0) => formationLayout(units, 300, 480, { kind, direction }, bounds, radiusOf);
for (const kind of Object.keys(FORMATIONS)) {
  const normal = layout(kind), turned = layout(kind, 90);
  assert.ok(normal.valid && turned.valid);
  normal.slots.forEach((p, i) => {
    assert.ok(Math.abs((p.x - normal.x) - (turned.slots[i].y - turned.y)) < 1e-8);
    assert.ok(Math.abs((p.y - normal.y) + (turned.slots[i].x - turned.x)) < 1e-8);
  });
}
const circle = layout('circle');
const radii = circle.slots.map(s => Math.hypot(s.x - circle.x, s.y - circle.y));
assert.ok(Math.max(...radii) - Math.min(...radii) < 1e-8, 'Ring has an empty centre');
const square = layout('hollowSquare');
const edge = Math.max(...square.slots.map(s => Math.abs(s.x - square.x)));
assert.ok(square.slots.every(s => Math.abs(Math.max(Math.abs(s.x - square.x), Math.abs(s.y - square.y)) - edge) < 1e-8));
const crescent = layout('crescent');
const front = crescent.slots.slice(0, 10);
assert.ok(front[0].x > front[4].x && front[9].x > front[5].x, 'Both wings lead the centre');
const left = layout('echelonLeft'), right = layout('echelonRight');
assert.ok(left.slots[0].x > left.slots[9].x && right.slots[0].x < right.slots[9].x, 'Stepped fronts are mirrored');
assert.equal(formationLayout(units, 300, 480, { kind: 'toString' }, bounds, radiusOf).valid, false);
assert.equal(formationLayout([], 300, 480, {}, bounds, radiusOf).valid, false);
console.log(`PASS formation geometry: ${checked} layouts, ${rejected} safe capacity rejections, spacing, edges, rotations and distinct shapes`);
