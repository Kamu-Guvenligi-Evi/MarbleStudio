import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { BattleDeployment } from '../src/crown-battle-deployment.js';
import { validateArmyConfigs, aggregateArmies, restoreArmyConfigs } from '../src/crown-battle-alliances.js';

const configs = [0, 0, 1, 1].map((team, i) => ({ id: `force-${i}`, name: `Army ${i}`, team,
  roster: { samurai: 12 }, commanderId: 'mehmed_ii' }));
const make = () => new Battle({ armyConfigs: configs, expandedMap: true, tacticalAI: false });
const battle = make();
assert.deepEqual(battle.counts(), [26, 26]);
assert.equal(battle.armyCommanders.size, 4);
assert.equal(new Set(battle.units.map(u => u.id)).size, 52);
for (const army of configs) assert.equal(battle.units.filter(u => u.armyId === army.id).length, 13);
assert.deepEqual(aggregateArmies(configs), [{ samurai: 24 }, { samurai: 24 }]);
assert.deepEqual(restoreArmyConfigs(JSON.parse(JSON.stringify(configs))), validateArmyConfigs(configs));
assert.deepEqual(restoreArmyConfigs(configs.map((a, i) => ({...a, presetSize: 200 + i * 50}))).map(a => a.presetSize), [200, 250, 300, 350]);
assert.throws(() => validateArmyConfigs(configs.map(a => ({ ...a, team: 0 }))));
assert.throws(() => validateArmyConfigs([configs[0], configs[0], configs[2]]));
assert.throws(() => validateArmyConfigs(configs.map(a => ({ ...a, roster: { samurai: -1 } }))));

// Identical allied unit types keep separate saved deployments, even if reordered.
const values = new Map(), storage = () => ({ getItem: k => values.get(k), setItem: (k, v) => values.set(k, v) });
const save = new BattleDeployment('alliances-test', { storage });
for (const [i, army] of configs.entries()) {
  battle.setActiveTeam(army.team);
  battle.selected = new Set(battle.units.filter(u => u.armyId === army.id).map(u => u.id));
  battle.deploySelected(i < 2 ? -200 : 800, 200 + (i % 2) * 700, { kind: 'line', direction: 90 });
}
save.capture(battle);
const restored = new Battle({ armyConfigs: [...configs].reverse(), expandedMap: true, tacticalAI: false });
new BattleDeployment('alliances-test', { storage }).restore(restored);
const positions = (b, id) => b.units.filter(u => u.armyId === id).map(u => [u.x, u.y]);
for (const army of configs) assert.deepEqual(positions(restored, army.id), positions(battle, army.id));

// Leaders use their own army's centre, and never target allies or attack.
for (const u of battle.units) if (!u.commanderId) u.order = { kind: 'hold', x: u.x, y: u.y };
for (let frame = 0; frame < 120; frame++) {
  battle.step(1 / 30);
  for (const u of battle.units) {
    if (u.target) assert.notEqual(u.team, u.target.team);
    if (u.commanderId) { assert.equal(u.target, null); assert.equal(u.attack, 0); }
  }
}
assert.ok(Math.abs(battle.commanderMovement.armies.get('force-0').y - battle.commanderMovement.armies.get('force-1').y) > 500);
const outcome = make();
for (const u of outcome.units) if (u.armyId === 'force-0' && !u.commanderId) u.hp = 0;
outcome.checkOutcome(); assert.equal(outcome.winner, null, 'Remaining ally keeps the alliance fighting');
for (const u of outcome.units) if (u.armyId === 'force-1' && !u.commanderId) u.hp = 0;
outcome.checkOutcome(); assert.equal(outcome.winner, 1, 'All commanders are excluded from combatant victory count');
console.log('PASS alliances: 2v2, identities, validation, persistence, independent formations and leaders, allied survival and victory');
