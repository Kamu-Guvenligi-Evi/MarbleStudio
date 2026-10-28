import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { FORMATIONS } from '../src/crown-battle-formations.js';
import { formationRoute, clearFormationSegment } from '../src/crown-battle-formation-path.js';

const obstacles = [{x: 20, y: 0, r: 8}, {x: 20, y: 12, r: 8}];
const start = {x: 0, y: 0}, goal = {x: 40, y: 0};
const path = formationRoute(start, goal, obstacles, () => true);
assert.ok(path.length > 1);
let previous = start;
for (const next of path) { assert.ok(clearFormationSegment(previous, next, obstacles)); previous = next; }
assert.deepEqual(previous, goal);
assert.deepEqual(formationRoute(start, goal, [], () => true), [goal]);

let checks = 0, longest = 0;
for (const kind of Object.keys(FORMATIONS)) for (const direction of [0, 90, 180, 270]) for (const team of [0, 1]) {
  const b = new Battle({ expandedMap: true, historicalArmies: [{samurai: 9}, {samurai: 9}] });
  // Keep combat and collision knockback out of this arrival regression.
  for (const u of b.units) if (u.team !== team) { u.x += 900; u.y += 900; }
  for (const t of [0, 1]) { b.setActiveTeam(t); b.select(); b.stopSelected(); }
  b.setActiveTeam(team); b.select(); b.step(1 / 30);
  const movers = b.units.filter(u => u.team === team);
  const opponent = b.units.filter(u => u.team !== team).map(u => [u.x, u.y]);
  assert.ok(b.moveSelected(50, team ? 700 : 300, { kind, direction }).valid);
  let frames = 0;
  for (; frames < 900; frames++) {
    const before = movers.map(u => [u.x, u.y]);
    b.step(1 / 30);
    movers.forEach((u, i) => assert.ok(Math.hypot(u.x - before[i][0], u.y - before[i][1]) < 3, 'No teleport while routing'));
    if (movers.every(u => u.order.kind === 'hold')) break;
  }
  assert.ok(frames < 900, `${kind}/${direction}/team ${team}: every soldier arrives within 30 seconds`);
  assert.deepEqual(b.units.filter(u => u.team !== team).map(u => [u.x, u.y]), opponent);
  longest = Math.max(longest, frames); checks++;
}
console.log(`PASS formation movement: ${checks} layouts/directions/teams, no teleport, stationary opponents; longest ${(longest / 30).toFixed(1)}s`);
