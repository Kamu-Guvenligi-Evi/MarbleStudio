import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Battle } from '../src/crown-battle.js';
import { createCommanderArmy } from '../src/historical-army-presets.js';

// Exercise complete battles for the seven newly supported commander rosters.
// Wins are not prescribed: completion and valid damage/state are the contract.
const ids = ['attila', 'genghis_khan', 'alexander_great', 'julius_caesar', 'saladin', 'hannibal_barca', 'nikephoros_ii_phokas'];
const files = ['src/crown-battle.js', 'src/historical-tactics.js', 'src/historical-army-presets.js', 'src/commander-army-units.js'];
const hash = () => Object.fromEntries(files.map(f => [f, createHash('sha256').update(readFileSync(f)).digest('hex')]));
const before = hash(), results = [];
for (const id of ids) for (const team of [0, 1]) {
  const armies = [{ roman: 48 }, { roman: 48 }], commanders = [null, null];
  armies[team] = createCommanderArmy(id, 48); commanders[team] = id;
  const b = new Battle({ seed: 42, expandedMap: true, historicalArmies: armies, commanders });
  for (let frame = 0; frame < 600 * 30 && b.winner === null; frame++) b.step(1 / 30);
  const valid = b.units.every(u => [u.x, u.y, u.hp].every(Number.isFinite));
  results.push({ id, team, seconds: +b.time.toFixed(2), winner: b.winner, outcome: b.outcomeReason, valid });
}
const after = hash(), changedSources = files.filter(f => before[f] !== after[f]);
mkdirSync('artifacts/commander-balance', { recursive: true });
writeFileSync('artifacts/commander-balance/new-roster-battles.json', JSON.stringify({ before, changedSources, results }, null, 2));
assert.deepEqual(changedSources, [], 'source changes during the run invalidate the report');
assert.ok(results.every(r => r.valid && r.outcome === 'elimination'), JSON.stringify(results.filter(r => !r.valid || r.outcome !== 'elimination')));
console.log(`PASS ${results.length} complete battles: seven new commander rosters, both orientations, finite state, natural elimination.`);
