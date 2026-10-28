import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { ARMY_PRESETS, createCommanderArmy } from '../src/historical-army-presets.js';
import { HISTORICAL_TYPES } from '../src/historical-combat.js';
import { armyPoints, createBudgetArmy, minimumArmyBudget, UNIT_POINTS, equipmentPoints, MAX_ARMY_BUDGET } from '../src/historical-army-budget.js';
import { Battle } from '../src/crown-battle.js';
import { armyCapacity } from '../src/historical-army-capacity.js';
import { restoreArmyConfigs, aggregateArmies } from '../src/crown-battle-alliances.js';

for (const [id, cfg] of Object.entries(HISTORICAL_TYPES)) {
  assert.ok(Number.isSafeInteger(UNIT_POINTS[id]) && UNIT_POINTS[id] > 0, id);
  for (const key of ['hp', 'damage', 'speed', 'reach']) assert.ok(equipmentPoints({ ...cfg, [key]: cfg[key] * 1.5 }) >= UNIT_POINTS[id], `${id}: improving ${key} never makes equipment cheaper`);
}
assert.ok(UNIT_POINTS.timur > UNIT_POINTS.timurid_guard_cavalry * 2, 'An elephant is not priced as one ordinary mounted soldier');
assert.throws(() => armyPoints({ unknown: 1 }));
assert.throws(() => armyPoints({ roman: -1 }));
assert.throws(() => armyPoints({ roman: 1.5 }));
assert.equal(armyPoints({}), 0);
for (const [id, preset] of Object.entries(ARMY_PRESETS)) {
  const minimum = minimumArmyBudget(id);
  assert.deepEqual(createBudgetArmy(id, minimum), preset.units, `${id}: core roles intact`);
  for (const invalid of [minimum - 1, NaN, Infinity, 0, -1, minimum + .5, MAX_ARMY_BUDGET + 1]) assert.throws(() => createBudgetArmy(id, invalid));
  for (const budget of [minimum + 1, minimum * 2 + 17, 2000, MAX_ARMY_BUDGET]) {
    const army = createBudgetArmy(id, budget);
    assert.ok(armyPoints(army) <= budget, `${id}: no overspend`);
    assert.ok(budget - armyPoints(army) < Math.max(...Object.keys(army).map(t => UNIT_POINTS[t])), `${id}: bounded unspent remainder`);
    for (const [type, weight] of Object.entries(preset.units)) assert.ok(army[type] >= weight, `${id}: ${type} retained`);
    assert.deepEqual(army, createBudgetArmy(id, budget), 'Deterministic allocation');
    const saved = JSON.stringify([{ id: 'army-0', team: 0, commanderId: id, roster: army }, { id: 'army-1', team: 1, roster: {} }]);
    assert.deepEqual(aggregateArmies(restoreArmyConfigs(JSON.parse(saved))), [army, {}], `${id}: full budget roster survives save and restore without truncation`);
  }
}

// Small diagnostic, no required winner. Capacity and budget are deliberately
// compared with tactics disabled to isolate equipment/composition from plans.
const results = [];
for (const mode of ['capacity', 'budget']) for (const rival of ['mehmed_ii', 'alp_arslan']) for (const seed of [42, 93]) for (const mirror of [false, true]) {
  const ids = mirror ? ['timur', rival] : [rival, 'timur'];
  const rosters = ids.map(id => mode === 'budget' ? createBudgetArmy(id, 2000) : createCommanderArmy(id, 96));
  const b = new Battle({ seed, expandedMap: true, historicalArmies: rosters, commanders: ids, tacticalAI: false });
  for (let frame = 0; frame < 600 * 30 && b.winner === null; frame++) b.step(1 / 30);
  assert.equal(b.outcomeReason, 'elimination', `${ids}: battle terminates`);
  assert.ok(b.units.every(u => Number.isFinite(u.x) && Number.isFinite(u.y) && Number.isFinite(u.hp)), 'Finite simulation state');
  results.push({ mode, rival, seed, mirror, winner: ids[b.winner], seconds: +b.time.toFixed(2), armies: ids.map((id, team) => ({ id, capacity: armyCapacity(rosters[team]), elephants: rosters[team].timur || 0, points: armyPoints(rosters[team]), count: Object.values(rosters[team]).reduce((s, n) => s + n, 0), survivors: b.units.filter(u => u.team === team && u.hp > 0 && !u.removed && !u.commanderId).length })) });
}
const summary = [];
for (const mode of ['capacity', 'budget']) for (const rival of ['mehmed_ii', 'alp_arslan']) {
  const rows = results.filter(r => r.mode === mode && r.rival === rival);
  summary.push({ mode, rival, wins: Object.fromEntries([rival, 'timur'].map(id => [id, rows.filter(r => r.winner === id).length])) });
}
mkdirSync('artifacts/commander-balance', { recursive: true });
writeFileSync('artifacts/commander-balance/budget.json', JSON.stringify({ summary, results }, null, 2));
console.log(`PASS ${Object.keys(UNIT_POINTS).length} unit prices, ${Object.keys(ARMY_PRESETS).length} presets, validation and 16 mirrored battles: ${JSON.stringify(summary)}`);
