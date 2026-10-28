import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// A concurrent performance change may split a tick into generator batches.
// Validate that the frozen matrix still describes synchronous combat behavior.
const root = 'artifacts/tactical-responsiveness/matrix-snapshot';
const currentRoot = 'artifacts/tactical-responsiveness/matrix-final-snapshot';
const { Battle } = await import(pathToFileURL(resolve(currentRoot, 'src/crown-battle.js')));
const { Battle: FrozenBattle } = await import(pathToFileURL(resolve(root, 'src/crown-battle.js')));
const manifest = JSON.parse(readFileSync(root + '/snapshot-sources.json'));
const currentManifest = JSON.parse(readFileSync(currentRoot + '/snapshot-sources.json'));
const hash = path => createHash('sha256').update(readFileSync(path, 'utf8')).digest('hex');
const changes = Object.entries(manifest).filter(([path, digest]) => currentManifest[path] !== digest).map(([path]) => path);
const allowed = ['src/crown-battle.js', 'src/commander-roster-completion.js', 'src/historical-civilization-tactics.js'];
assert.ok(changes.every(path => allowed.includes(path.replaceAll('\\', '/'))),
  'Dependency changes require their own matrix rerun: ' + changes.join(', '));
const before = Object.fromEntries(Object.keys(currentManifest).map(path => [path, hash(resolve(currentRoot,path))]));
assert.deepEqual(before,currentManifest);
const { rosters } = JSON.parse(readFileSync(root + '/artifacts/tactical-responsiveness/all-progress.json'));
const ottoman = rosters.findIndex(r => r.commanderId === 'mehmed_ii');
assert.ok(ottoman >= 0);
const state = b => JSON.stringify({ units: b.units, projectiles: b.projectiles, effects: b.effects,
  stats: b.stats, time: b.time, winner: b.winner, outcome: b.outcomeReason }, (key, value) => {
  if (key === 'combatProfile') return undefined;
  if ((key === 'target' || key === 'nearbyThreat') && value) return value.id;
  if (value instanceof Set) return [...value].sort((a, b) => a - b);
  if (value && typeof value === 'object' && !Array.isArray(value))
    return Object.fromEntries(Object.keys(value).sort().map(k => [k, value[k]]));
  return value;
});
let matches = 0, checkpoints = 0;
for (let i = 0; i < rosters.length; i++) for (const team of [0, 1]) {
  // Their new formations are tested by every matchup in the delta matrix.
  if (['georg_frundsberg','qi_jiguang'].includes(rosters[i].commanderId)) continue;
  if (i === ottoman && team === 1) continue;
  const options = { seed: 42, expandedMap: true, armyConfigs: [
    { ...rosters[i], id: 'a', team }, { ...rosters[ottoman], id: 'b', team: 1 - team },
  ] };
  const current = new Battle(options), frozen = new FrozenBattle(options);
  let tick = 0;
  while (frozen.time < 600 && frozen.winner === null) {
    frozen.step(1 / 30); current.step(1 / 30);
    if (++tick % 300 === 0 || frozen.winner !== null) {
      const digest = b => createHash('sha256').update(state(b)).digest('hex');
      assert.equal(digest(current), digest(frozen), `${rosters[i].name}/${team} at ${frozen.time}`);
      checkpoints++;
    }
  }
  assert.equal(current.outcomeReason, 'elimination'); matches++;
  if (matches % 40 === 0) console.log(`PROGRESS ${matches} equivalent complete battles`);
}
assert.deepEqual(Object.fromEntries(Object.keys(currentManifest).map(path => [path, hash(resolve(currentRoot,path))])), before,
  'Sources changed during equivalence test; repeat on the final version.');
writeFileSync('artifacts/tactical-responsiveness/engine-equivalence.json', JSON.stringify({ matches, checkpoints, sources: before, changes }));
console.log(`PASS ${matches} complete battles, ${checkpoints} identical state checkpoints for unchanged formations versus Ottomans, both sides.`);
