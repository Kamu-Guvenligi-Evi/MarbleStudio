import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { ARMY_PRESETS, createCommanderArmy, presetMinimum } from '../src/historical-army-presets.js';
import { Battle } from '../src/crown-battle.js';

const hashes = () => Object.fromEntries(['crown-battle.js', 'historical-tactics.js', 'historical-civilization-tactics.js', 'historical-army-presets.js', 'historical-army-support-units.js'].map(f => [f, createHash('sha256').update(readFileSync(new URL('../src/' + f, import.meta.url))).digest('hex')]));
const before = hashes(), results = [];
for (const [id, preset] of Object.entries(ARMY_PRESETS)) {
  const n = presetMinimum(preset) * 2;
  for (const enemy of ['roman', 'landsknecht', 'achaemenid_archer']) for (const team of [0, 1]) {
    const historicalArmies = [{ [enemy]: n }, { [enemy]: n }], commanders = [null, null];
    historicalArmies[team] = createCommanderArmy(id, n); commanders[team] = id;
    const b = new Battle({ seed: 1427, historicalArmies, commanders, expandedMap: true });
    while (b.winner === null && b.time < 180) b.step(1 / 30);
    results.push({ id, enemy, team, winner: b.winner, seconds: +b.time.toFixed(2), survivors: [0, 1].map(t => b.units.filter(u => u.team === t && u.hp > 0 && !u.removed).length) });
    assert.ok(b.units.every(u => [u.x, u.y, u.hp].every(Number.isFinite)), `${id}/${enemy}/${team}: finite`);
  }
}
mkdirSync('artifacts/historical-army-support', { recursive: true });
const after = hashes();
writeFileSync('artifacts/historical-army-support/battles.json', JSON.stringify({ before, after, results }, null, 2));
assert.deepEqual(before, after, 'battle sources unchanged during this run');
assert.deepEqual(results.filter(r => r.winner === null), [], 'mixed armies finish without stalemate');
console.log(`PASS ${results.length} full mixed-army battles, 11 commanders, melee/pike/archer opponents, both sides; finite positions and no 180-second stalemate. Not a balance ranking.`);
