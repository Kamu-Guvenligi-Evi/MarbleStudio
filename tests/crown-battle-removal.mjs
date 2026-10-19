import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { restoreHistoricalArmies } from '../src/historical-combat.js';

const empty = { sword:0, pike:0, archer:0, cavalry:0 };
for (const config of [{ armies:[empty, empty] }, { historicalArmies:[{}, {}] }, { historicalArmies:[{}, { roman:2 }] }]) {
  const b = new Battle({ ...config, allowEmpty:true });
  b.step(1); assert.equal(b.time, 0); assert.equal(b.winner, null);
}
assert.throws(() => new Battle({ armies:[{...empty, sword:-1}, empty], allowEmpty:true }));
const b = new Battle({ armies:[{...empty, sword:2, archer:2}, {...empty, pike:3}] });
const originalIds = b.units.map(u => u.id), targets = [b.units[0], b.units[1]];
b.projectiles = targets.map(target => ({ target }));
b.selected = new Set([0, 2, 4]); // A stale enemy ID must never remove an enemy.
assert.equal(b.removeSelected().length, 2);
assert.deepEqual(b.counts(), [2,3]); assert.deepEqual(b.initial, [2,3]);
assert.equal(b.projectiles.length, 1); assert.equal(b.projectiles[0].target.id, 1);
assert.deepEqual(b.units.map(u => u.id), originalIds);
assert.equal(b.units[0].removed, true); assert.equal(b.selected.size, 0);
assert.equal(b.removeSelected().length, 0);
b.select(); b.removeSelected(); b.step(1);
assert.deepEqual(b.counts(), [0,3]); assert.equal(b.winner, null); assert.equal(b.time, 0);

const started = new Battle({ historicalArmies:[{samurai:2}, {roman:2}], commanders:['mehmed_ii', null] });
started.step(1/30); started.select(); started.removeSelected();
assert.equal(started.commanders[0], null); assert.equal(started.winner, 1);
assert.deepEqual(started.initial, [0,2]);

const migrated = restoreHistoricalArmies([{samurai:4, sparta_hippeis:3}, {roman:5}]);
assert.deepEqual(migrated.armies, [{samurai:4}, {roman:5}]); assert.match(migrated.note, /3 asker/);
assert.deepEqual(restoreHistoricalArmies([{sparta_hippeis:2}, {}]).armies, [{},{}]);
assert.throws(() => restoreHistoricalArmies([{unknown_unit:1}, {}]));
for (const army of [{ottoman_sipah:4, ottoman_silahdar:3, ottoman_ulufeci_left:2}, {ottoman_silahdar:3, ottoman_ulufeci_left:2, ottoman_sipah:4}]) {
  const merged = restoreHistoricalArmies([army, {}]);
  assert.deepEqual(merged.armies, [{ottoman_sipah:9}, {}]);
  assert.match(merged.note, /5 asker Kapıkulu/);
}
assert.throws(() => restoreHistoricalArmies([{ottoman_silahdar:-1, ottoman_sipah:4}, {}]));
assert.throws(() => restoreHistoricalArmies([{ottoman_silahdar:Number.MAX_SAFE_INTEGER, ottoman_sipah:1}, {}]));
const teams = new Battle({armies:[{...empty,sword:3}, {...empty,sword:2,archer:2}]});
teams.select(); teams.moveSelected(250,300);
teams.setActiveTeam(1); assert.equal(teams.selected.size,0);
teams.selectArea({x:0,y:0},{x:1000,y:1000});
assert.equal(teams.selected.size,4); assert.ok([...teams.selected].every(id=>teams.units[id].team===1));
teams.moveSelected(260,650); teams.stopSelected();
assert.ok(teams.units.filter(u=>u.team===1).every(u=>u.order.kind==='hold'));
assert.equal(teams.attackSelected(3),false); assert.equal(teams.attackSelected(0),true);
assert.ok(teams.units.filter(u=>u.team===1).every(u=>u.order.targetId===0));
assert.ok(teams.units.filter(u=>u.team===0).every(u=>u.order.kind==='move'));
teams.select('archer'); assert.equal(teams.removeSelected().length,2); assert.deepEqual(teams.counts(),[3,2]);
teams.select(); teams.step(1/30); teams.removeSelected();
assert.equal(teams.winner,0); assert.deepEqual(teams.counts(),[3,0]);
assert.throws(()=>teams.setActiveTeam(2));
console.log('PASS: empty staging, validation, partial selection removal, stable IDs, projectile cleanup, leader removal, outcome and saved-plan migration');
