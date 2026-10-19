import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Battle } from '../src/crown-battle.js';
import { createCommanderArmy } from '../src/historical-army-presets.js';

const ids = ['mehmed_ii', 'georg_frundsberg', 'harold_godwinson', 'charles_vii', 'francesco_sforza',
  'leonidas', 'darius_i', 'takeda_shingen', 'qin_shi_huang', 'qi_jiguang', 'alp_arslan'];
const files = ['historical-alliance-coordination.js', 'historical-compact-deployment.js', 'historical-tactics.js',
  'historical-deployment-corps.js', 'historical-commander-strategy.js',
  'historical-civilization-tactics.js', 'historical-commander-formations.js', 'historical-commander-deployment.js',
  'crown-battle.js', 'historical-combat.js', 'historical-catalogue.js', 'historical-unit-stat-balance.js',
  'historical-army-presets.js', 'commander-army-units.js', 'historical-units.json'];
const hashes = () => Object.fromEntries(files.map(f => [f, createHash('sha256').update(readFileSync(`src/${f}`)).digest('hex')]));
const before = hashes(), results = [];
for (const [index, id] of ids.entries()) for (const team of [0, 1]) {
  const configs = [[id, team], ['julius_caesar', team], [ids[(index + 4) % ids.length], 1 - team], ['julius_caesar', 1 - team]]
    .map(([commanderId, team], i) => ({ id: `army-${i}`, team, commanderId, roster: createCommanderArmy(commanderId, 48) }));
  const b = new Battle({ seed: 42, expandedMap: true, armyConfigs: configs });
  const byId = new Map(b.units.map(u => [u.id, u]));
  const violations = new Set();
  for (let frame = 0; frame < 600 * 30 && b.winner === null; frame++) {
    b.step(1 / 30);
    if (frame % 15) continue;
    for (const director of [b.tactics, b.tactics.civilizations, b.tactics.formations]) {
      for (const [unitId, intent] of director.intents) {
        const u = byId.get(unitId);
        if (!b.tactics.coordination.contains(u.armyId, intent.goal, u.combatProfile.radius)) violations.add('maneuver crosses allied sector');
      }
      for (const state of director.armies.values()) {
        if (state.members.some(m => m.unit.armyId !== state.armyId)) violations.add('borrowed allied soldier');
      }
    }
  }
  if (!b.units.every(u => [u.x, u.y, u.hp].every(Number.isFinite))) violations.add('invalid unit state');
  if (b.outcomeReason !== 'elimination') violations.add('battle did not end by elimination');
  results.push({ id, team, seconds: +b.time.toFixed(2), outcome: b.outcomeReason, violations: [...violations] });
}
const after = hashes(), changedSources = files.filter(f => before[f] !== after[f]);
mkdirSync('artifacts/alliance-tactics', { recursive: true });
writeFileSync('artifacts/alliance-tactics/full-battles.json', JSON.stringify({ before, changedSources, results }, null, 2));
assert.deepEqual(changedSources, [], 'concurrent edits invalidate this simulation run');
assert.deepEqual(results.filter(r => r.violations.length), []);
console.log(`PASS ${results.length} complete allied battles: 11 historical commanders, both sides, sector-contained maneuvers, natural elimination.`);
