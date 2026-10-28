import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { firstArrowContact, arrowBodyContact, contactCandidates } from '../src/crown-battle-contact.js';

let seed = 58129;
const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
const units = Array.from({ length: 2400 }, (_, id) => {
  const x = Math.floor(random() * 1200 - 600), y = Math.floor(random() * 1200 - 600);
  return { id, x, y, lastX: x - random() * 12 + 6, lastY: y - random() * 12 + 6,
    hp: id % 19 ? 100 : 0, removed: id % 43 === 0,
    combatProfile: { radius: id % 7 ? 3.75 : 14, role: id % 7 ? 'sword' : 'elephant' } };
});
// Exact production-shaped buckets; include negative coordinates and cell edges.
const grid = { minX: -16, maxX: 15, minY: -16, maxY: 15, width: 32, cells: new Array(1024) };
for (const u of units) {
  const index = (Math.floor(u.y / 40) - grid.minY) * grid.width + Math.floor(u.x / 40) - grid.minX;
  (grid.cells[index] ||= []).push(u);
}
// Grid membership precedes the final local separation pass in the engine.
for (const u of units) { u.x += random() * 4 - 2; u.y += random() * 4 - 2; }
const queries = Array.from({ length: 3000 }, (_, i) => {
  const a = units[Math.floor(random() * units.length)], b = units[Math.floor(random() * units.length)];
  const span = i % 3 ? .05 : 1;
  const vx = i % 11 === 0 ? 0 : (b.x - a.x) / span;
  const vy = i % 13 === 0 ? 0 : (b.y - a.y) / span;
  return { p: { fromX: a.x, fromY: a.y, sourceId: a.id, vx, vy, vz: i % 4 ? 0 : 100,
    gravity: i % 4 ? 0 : 180, releaseHeight: 13 }, span, frameDt: i % 3 ? .05 : Infinity };
});
let hits = 0;
for (const { p, span, frameDt } of queries) {
  let expected = null;
  for (const u of units) {
    if (u.hp <= 0 || u.removed) continue;
    const age = arrowBodyContact(p, u, 0, span, frameDt);
    if (age !== null && (!expected || age < expected.age || (age === expected.age && u.id < expected.unit.id)))
      expected = { unit: u, age };
  }
  const actual = firstArrowContact(p, 0, span, grid, frameDt);
  assert.equal(actual?.unit.id, expected?.unit.id, 'broad phase must retain the first physical contact');
  assert.equal(actual?.age, expected?.age);
  if (actual) hits++;
}
assert(hits > 1000, 'exercise actual intersections, not only empty rays');
assert.equal(firstArrowContact(queries[0].p, 0, 1, { cells: [] }, Infinity), null);
console.log(`PASS contact queries: ${queries.length} rays / ${units.length} bodies against exhaustive collision oracle; ${hits} hits`);

// Optional A/B microbenchmark: same process, alternating order, warmup, seven
// rounds. Measures contact CPU only, not rendering or whole-game frame rate.
if (process.argv[2]) {
  const previous = await import(pathToFileURL(resolve(process.argv[2])).href);
  const workload = queries.filter((_, i) => i % 3 === 0);
  for (const { p, span } of workload) {
    const a = previous.firstArrowContact(p, 0, span, grid, Infinity);
    const b = firstArrowContact(p, 0, span, grid, Infinity);
    assert.equal(a?.unit.id, b?.unit.id); assert.equal(a?.age, b?.age);
  }
  const variants = { before: previous, after: { firstArrowContact, contactCandidates } };
  const results = {};
  for (const [name, variant] of Object.entries(variants)) {
    let candidates = 0;
    for (const { p, span } of workload) candidates += variant.contactCandidates(grid,
      p.fromX, p.fromY, p.fromX + p.vx * span, p.fromY + p.vy * span).length;
    results[name] = { candidates, roundsMs: [] };
  }
  for (let round = -2; round < 7; round++) {
    const names = round % 2 ? ['before', 'after'] : ['after', 'before'];
    for (const name of names) {
      const start = performance.now();
      for (let repeat = 0; repeat < 4; repeat++) for (const { p, span } of workload)
        variants[name].firstArrowContact(p, 0, span, grid, Infinity);
      if (round >= 0) results[name].roundsMs.push(performance.now() - start);
    }
  }
  for (const r of Object.values(results)) r.medianMs = r.roundsMs.toSorted((a, b) => a - b)[3];
  const report = { queriesPerRound: workload.length * 4, bodyCount: units.length, results };
  if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
