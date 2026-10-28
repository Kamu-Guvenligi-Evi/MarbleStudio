import assert from 'node:assert/strict';
import { Battle, UNIT_TYPES } from '../src/crown-battle.js';
import { COMMANDER_TYPES, COMMANDER_BALANCE, commanderType } from '../src/historical-commander-types.js';

const historicalArmies = [{ samurai: 2 }, { roman: 3 }];
const create = (commanders = ['mehmed_ii', 'timur']) => new Battle({ historicalArmies, commanders, seed: 17 });
const baseline = create(null);
for (const definition of Object.values(COMMANDER_TYPES)) {
  const b = create([definition.commanderId, definition.commanderId]);
  assert.deepEqual(b.initial, [3, 4]);
  assert.deepEqual(b.counts(), b.initial);
  assert.equal(new Set(b.units.map(u => u.id)).size, b.units.length);
  assert.deepEqual(b.units.filter(u => !u.commanderId), baseline.units, 'Leaders do not change regular units or their stats');
  b.commanders.forEach((unit, team) => {
    assert.equal(unit.team, team);
    assert.equal(unit.hp, COMMANDER_BALANCE.hp);
    assert.equal(UNIT_TYPES[unit.type].damage, COMMANDER_BALANCE.damage);
    assert.equal(unit.name, definition.name);
  });
}
assert.deepEqual(create(['invalid', null]).units, baseline.units);
assert.deepEqual(new Battle({ commanders: ['timur', 'attila'] }).units, new Battle().units, 'Classic mode ignores leaders');
assert.deepEqual(create(['timur', null]).initial, [3, 3]);
{
  const b = create(), [blue, red] = b.commanders;
  b.select(commanderType('mehmed_ii'));
  assert.deepEqual([...b.selected], [blue.id]);
  b.moveSelected(250, 400);
  assert.equal(blue.order.kind, 'move');
  b.stopSelected();
  assert.equal(blue.order.kind, 'hold');
  assert.equal(b.attackSelected(red.id), false, 'Commanders do not accept attack orders');
  assert.equal(blue.order.kind, 'hold');
  blue.x = 250; blue.y = 400; red.x = 265; red.y = 400;
  blue.cooldown = 0; blue.chargeCooldown = 100;
  b.attack(blue, red, 15);
  assert.equal(blue.pendingAttack, null, 'Commander never winds up a strike');
  b.startCharge(blue, red);
  assert.equal(blue.charge, null, 'Commander never charges');
  for (let i = 0; i < 4; i++) b.step(1 / 30);
  assert.equal(red.hp, red.maxHp, 'Commander deals no damage');
  b.hit(blue, 10000, red);
  assert.equal(blue.hp, 0);
  assert.equal(b.selected.has(blue.id), false);
  assert.deepEqual(b.counts(), [2, 4]);
  const deaths = b.events.filter(e => e.message.includes('düştü')).length;
  b.hit(blue, 10000, red);
  assert.equal(b.events.filter(e => e.message.includes('düştü')).length, deaths);
}
{
  const b = create();
  b.units.filter(u => !u.commanderId).forEach(u => b.hit(u, 10000));
  b.step(1 / 30);
  assert.equal(b.winner, 'draw', 'Two surviving commanders do not prolong a finished battle');
  assert.deepEqual(b.counts(), [1, 1]);
}
{
  const b = create();
  b.units.filter(u => u.team === 1 && !u.commanderId).forEach(u => b.hit(u, 10000));
  b.step(1 / 30);
  assert.equal(b.winner, 0, 'Army without fighting troops loses even with its commander alive');
  assert.ok(b.commanders[1].hp > 0, 'Defeated commander is not artificially killed');
}
{
  const a = create(), b = create();
  for (let i = 0; i < 5500 && a.winner === null; i++) { a.step(1 / 30); b.step(1 / 30); }
  assert.notEqual(a.winner, null);
  assert.deepEqual(a.units, b.units, 'Commander battles are deterministic');
  assert.ok(a.units.every(u => Number.isFinite(u.x) && Number.isFinite(u.y) && Number.isFinite(u.hp)));
}
console.log(`PASS: ${Object.keys(COMMANDER_TYPES).length} commanders, counts, no bonuses, movement orders, no attacks, death, troop-based victory, determinism and classic compatibility`);
