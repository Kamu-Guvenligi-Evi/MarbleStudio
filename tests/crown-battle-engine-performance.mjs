import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { Session } from 'node:inspector';

// The optional snapshot makes old/new runs use identical current dependencies.
const filename = process.argv[2] || 'src/crown-battle.js';
async function load(filename) {
  const source = readFileSync(filename, 'utf8').replace(/from '(\.\/[^']+)'/g,
    (_, specifier) => `from '${pathToFileURL(resolve('src', specifier)).href}'`);
  return await import(`data:text/javascript;base64,${Buffer.from(source + '\nexport { SpatialGrid };').toString('base64')}`);
}
const variants = [{ name: filename, ...await load(filename) }];
if (process.argv[4]) variants.push({ name: process.argv[4], ...await load(process.argv[4]) });
if (variants.length > 1) {
  const rng = variants[0].random(2026);
  for (const count of [0, 1, 16, 17, 500]) {
    const units = Array.from({length: count}, (_, id) => ({id, hp: id % 9 ? 100 : 0,
      x: id % 3 ? -280 + rng() * 1160 : 40, y: id % 3 ? -460 + rng() * 1880 : 40}));
    const grids = variants.map(({SpatialGrid}) => new SpatialGrid(units));
    // Buckets keep insertion-time membership while soldiers move during a tick.
    for (const u of units) { u.x += rng() * 20 - 10; u.y += rng() * 20 - 10; }
    const points = [...units.slice(0, 20), ...Array.from({length: 30}, (_, id) => ({id,
      x: Math.floor(rng() * 40 - 10) * 40, y: Math.floor(rng() * 60 - 15) * 40}))];
    for (const point of points) for (const radius of [0, 17.75, 28, 40, 60, 140, 300, 2400]) {
      for (const limit of [1, 32, 96]) assert.deepEqual(
        grids[0].near(point, radius, limit).map(u => u.id),
        grids[1].near(point, radius, limit).map(u => u.id),
        'query order, sampling, limits, negative coordinates and moved/dead units must match');
    }
  }
  console.log('PASS spatial queries: boundaries, negative positions, empty/dead/moved units, sampling and limits');
}
const stats = values => {
  const sorted = values.toSorted((a, b) => a - b);
  return Object.fromEntries([['median', .5], ['p95', .95]].map(([key, p]) => [key, +sorted[Math.floor(sorted.length * p)].toFixed(3)]));
};
const digest = battle => createHash('sha256').update(JSON.stringify({
  units: battle.units, projectiles: battle.projectiles, effects: battle.effects,
  stats: battle.stats, time: battle.time, winner: battle.winner,
}, (key, value) => {
  // Shared immutable metadata is an implementation cache, not battle state.
  if (key === 'combatProfile') return undefined;
    if ((key === 'target' || key === 'nearbyThreat') && value) return value.id;
    if (value instanceof Set) return [...value].sort((a, b) => a - b);
  if (value && typeof value === 'object' && !Array.isArray(value))
    return Object.fromEntries(Object.keys(value).sort().map(k => [k, value[k]]));
  return value;
})).digest('hex');
const cases = [
  { count: 320, dense: false }, { count: 2000, dense: false },
  { count: 1800, dense: true }, { count: 4000, dense: true },
  { count: 1800, dense: true, historical: true },
];
const results = [];
const session = process.env.PROFILE ? new Session() : null;
if (session) {
  session.connect();
  for (const command of ['Profiler.enable', 'Profiler.start']) await new Promise((accept, reject) =>
    session.post(command, (error, result) => error ? reject(error) : accept(result)));
}
for (const scenario of cases) {
  const army = { sword: scenario.count / 8, pike: scenario.count / 8, archer: scenario.count / 8, cavalry: scenario.count / 8 };
  const historicalArmy = {samurai:100,janissary:80,kipchak:70,hussar:70,timur:20,spartan:100,mongol:70,mamluk:70,viking:100,roman:100,persian:100,knight:20};
  const runs = [], hashes = [];
  for (let repeat = 0; repeat < 2; repeat++) {
    for (const {name, Battle} of repeat % 2 ? variants.toReversed() : variants) {
      const battle = new Battle({ seed: 1066, ...(scenario.historical
        ? {historicalArmies:[historicalArmy,historicalArmy]} : {armies:[army,army]}) });
      if (scenario.dense) for (const u of battle.units) {
        u.x = 70 + (u.id % 70) * 6.5; u.y = 440 + u.team * 90 + Math.floor(u.id / 70) % 14 * 3;
      }
      const times = [], checkpoints = [];
      for (let tick = 0; tick < 90; tick++) {
        const start = performance.now(); battle.step(1 / 30);
        if (tick >= 15) times.push(performance.now() - start);
        if (tick % 15 === 14) checkpoints.push(digest(battle));
      }
      runs.push({name, ...stats(times)}); hashes.push(checkpoints);
    }
  }
  for (const hash of hashes.slice(1)) assert.deepEqual(hashes[0], hash, 'old/new engines and repeated seeds must reproduce every checkpoint');
  results.push({ ...scenario, runs, checkpoints: hashes[0] });
}
if (session) {
  const { profile } = await new Promise((accept, reject) => session.post('Profiler.stop', (e, r) => e ? reject(e) : accept(r)));
  console.log('CPU', profile.nodes.filter(n => n.hitCount).sort((a,b) => b.hitCount-a.hitCount).slice(0,10).map(n=>[n.callFrame.functionName,n.hitCount]));
  session.disconnect();
}
if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.map(({ checkpoints, ...result }) => result)));
