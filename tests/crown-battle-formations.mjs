import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { FORMATIONS } from '../src/crown-battle-formations.js';

let checks = 0;
for (const team of [0, 1]) for (const kind of Object.keys(FORMATIONS)) for (const direction of [0, 90, 180, 270]) {
  const b = new Battle({ expandedMap: true, historicalArmies: [{ samurai: 12, timur: 2 }, { janissary: 12, hussar: 2 }] });
  b.setActiveTeam(team); b.select();
  const enemy = b.units.filter(u => u.team !== team).map(u => [u.x, u.y]);
  const result = b.deploySelected(-295, -475, { kind, direction });
  assert.equal(result.valid, true);
  for (const slot of result.slots) {
    assert.ok(slot.x >= b.bounds.left + 45 && slot.x <= b.bounds.right - 45);
    assert.ok(slot.y >= b.bounds.top + 115 && slot.y <= b.bounds.bottom - 95);
    const u = b.units.find(u => u.id === slot.id); assert.equal(u.x, slot.x); assert.equal(u.order, null);
    for (const other of result.slots) if (other.id !== slot.id) assert.ok(Math.hypot(slot.x-other.x, slot.y-other.y) >= slot.radius+other.radius);
  }
  assert.deepEqual(b.units.filter(u => u.team !== team).map(u => [u.x, u.y]), enemy);
  assert.equal(b.time, 0); checks++;
}
const b = new Battle({ expandedMap: true, historicalArmies: [{ samurai: 9 }, { janissary: 9 }] });
b.select(); const initial = b.units.map(u => [u.x, u.y]);
assert.equal(b.deploySelected(NaN, 400).valid, false);
assert.equal(b.deploySelected(4000, 400).valid, false);
assert.equal(b.deploySelected(300, 400, { kind: 'bogus' }).valid, false);
assert.deepEqual(b.units.map(u => [u.x, u.y]), initial);
const wide = b.formationPlan(300, 400, { kind: 'line' });
const block = b.formationPlan(300, 400, { kind: 'block' });
assert.notDeepEqual(wide.slots, block.slots);
b.stopSelected(); b.setActiveTeam(1); b.select(); b.stopSelected(); b.setActiveTeam(0); b.select(); b.step(1/30);
const positions = b.units.map(u => [u.x, u.y]);
assert.equal(b.deploySelected(200, 400).valid, false, 'No teleport after the first simulation step');
assert.deepEqual(b.units.map(u => [u.x, u.y]), positions);
const mover = b.units[0]; mover.pendingAttack = { target: b.units[9] }; mover.attack = .24;
assert.equal(b.moveSelected(50, 300, { kind: 'wedge' }).valid, true);
assert.deepEqual(b.units.map(u => [u.x, u.y]), positions, 'Movement starts without teleporting');
assert.equal(mover.pendingAttack, null);
assert.ok(b.units.filter(u => u.team === 0).every(u => u.order.kind === 'move'));
// Routing around planted ranks takes longer than an unobstructed straight walk.
for (let i=0;i<900;i++) b.step(1/30);
assert.ok(b.units.filter(u => u.team === 0).every(u => u.order.kind === 'hold'), 'Formation reaches assigned positions');
const huge = new Battle({ historicalArmies: [{ timur: 2000 }, { samurai: 1 }] }); huge.select();
assert.equal(huge.deploySelected(300, 400).valid, false, 'Oversized formation cannot collapse onto map edges');
console.log(`PASS formations: ${checks} layouts, mixed unit spacing, both teams, invalid targets, movement, no teleport, capacity`);
