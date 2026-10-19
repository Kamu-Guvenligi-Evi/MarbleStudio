import assert from 'node:assert/strict';
import { armyCapacity, unitCapacity } from '../src/historical-army-capacity.js';
import { ARMY_PRESETS, createCommanderArmy, presetMinimum } from '../src/historical-army-presets.js';
import { restoreArmyConfigs, aggregateArmies } from '../src/crown-battle-alliances.js';
import { Battle } from '../src/crown-battle.js';

assert.equal(unitCapacity('timur'), 5);
assert.equal(unitCapacity('me_mumakil'), 5);
assert.equal(unitCapacity('carthage_war_elephant'), 5);
assert.equal(presetMinimum(ARMY_PRESETS.hannibal_barca), 29);
assert.throws(() => createCommanderArmy('hannibal_barca', 28));
for (const capacity of [29, 30, 34, 35, 67, 68, 97, 241, 100000]) {
  const army = createCommanderArmy('hannibal_barca', capacity);
  assert.equal(armyCapacity(army), capacity);
  assert.ok(army.carthage_war_elephant >= 1);
  assert.equal(capacity - Object.values(army).reduce((s, n) => s + n, 0), army.carthage_war_elephant * 4);
}
for (const id of ['roman', 'timurid_horse_archer', 'myth_cyclops', 'myth_jotun']) assert.equal(unitCapacity(id), 1);
assert.equal(armyCapacity({}), 0);
assert.equal(armyCapacity({ timur: 2, me_mumakil: 1, roman: 7 }), 22);
assert.equal(presetMinimum(ARMY_PRESETS.timur), 28);
assert.throws(() => createCommanderArmy('timur', 27));
assert.deepEqual(createCommanderArmy('timur', 28), ARMY_PRESETS.timur.units);
for (const capacity of [28, 29, 34, 65, 66, 96, 97, 200, 100000]) {
  const army = createCommanderArmy('timur', capacity);
  const count = Object.values(army).reduce((s, n) => s + n, 0);
  assert.equal(armyCapacity(army), capacity);
  assert.equal(capacity - count, army.timur * 4, 'Each elephant consumes four extra slots');
  assert.ok(army.timur >= 1);
  assert.deepEqual(army, createCommanderArmy('timur', capacity));
}
// Existing/manual armies retain real model counts, even above preset capacity.
const oldArmy = { timur: 12, timurid_horse_archer: 20 };
const saved = JSON.stringify([{ id: 'army-0', team: 0, commanderId: 'timur', roster: oldArmy }, { id: 'army-1', team: 1, roster: { roman: 24 } }]);
assert.deepEqual(aggregateArmies(restoreArmyConfigs(JSON.parse(saved))), [oldArmy, { roman: 24 }]);
const battle = new Battle({ historicalArmies: [oldArmy, { roman: 24 }], seed: 42 });
assert.equal(battle.units.filter(u => u.type === 'timur').length, 12, 'Capacity never multiplies spawned elephants');
console.log('PASS elephant capacity: actual elephants only, exact allocation, minimum, 100000 slots, old saves and real spawn counts');
