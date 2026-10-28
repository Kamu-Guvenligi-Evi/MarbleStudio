import assert from 'node:assert/strict';
import { MYTHOLOGICAL_UNITS as creatures } from '../src/mythological-units.js';
import { HISTORICAL_TYPES, restoreHistoricalArmies } from '../src/historical-combat.js';
import { CULTURE_GROUPS } from '../src/historical-culture-groups.js';
import { Battle } from '../src/crown-battle.js';

assert.equal(creatures.length, 9);
assert.equal(new Set(creatures.map(u => u.id)).size, 9);
assert.deepEqual(CULTURE_GROUPS.find(g => g.id === 'mythology').countries.map(g => g.name),
  ['Yunan Mitolojisi', 'İskandinav Mitolojisi', 'Mısır Mitolojisi']);
for (const unit of creatures) {
  for (const [key, value] of Object.entries(unit.combat)) assert.equal(HISTORICAL_TYPES[unit.id][key], value, `${unit.id}/${key}`);
  assert.ok(unit.fictional && !unit.source && !unit.image);
}
const all = Object.fromEntries(creatures.map(u => [u.id, 2]));
const saved = [{ roman: 3, ...all }, { spartan: 4, ...all }];
assert.deepEqual(restoreHistoricalArmies(JSON.parse(JSON.stringify(saved))).armies, saved);
const orders = new Battle({ historicalArmies: saved, seed: 72 });
for (const team of [0, 1]) {
  orders.setActiveTeam(team);
  for (const unit of creatures) {
    orders.select(unit.id); assert.equal(orders.selected.size, 2);
    orders.moveSelected(230, 650);
    let chosen = orders.units.filter(u => orders.selected.has(u.id));
    assert.ok(chosen.every(u => u.order?.kind === 'move'));
    orders.stopSelected(); assert.ok(chosen.every(u => u.order?.kind === 'hold' && !u.charge && !u.pendingAttack));
    const target = orders.units.find(u => u.team !== team && u.hp > 0);
    assert.ok(orders.attackSelected(target.id));
    assert.ok(chosen.every(u => u.order?.targetId === target.id));
    orders.engageSelected(); assert.ok(chosen.every(u => u.order === null));
  }
  orders.select('myth_uraeus'); assert.equal(orders.removeSelected().length, 2);
}
// A real released attack: splash hits nearby enemies, the bow emits an arrow.
for (const id of ['myth_minotaur', 'myth_cyclops', 'myth_jotun', 'myth_nidhogg', 'myth_ammit', 'myth_centaur']) {
  const b = new Battle({ historicalArmies: [{ [id]: 1 }, { roman: 3 }], seed: 5 });
  const source = b.units[0]; Object.assign(source, { x: 250, y: 400, cooldown: 0, chargeCooldown: 100, headingX: 1, headingY: 0 });
  for (const [i, enemy] of b.units.slice(1).entries()) Object.assign(enemy, { x: id === 'myth_centaur' ? 360 : 273, y: 398+i*3, cooldown: 100 });
  for (let i=0;i<10;i++) b.step(1/30);
  if (id === 'myth_centaur') assert.ok(b.stats.arrows > 0 && b.stats.charges === 0);
  else assert.ok(b.units.slice(1).filter(u => u.hp < u.maxHp).length >= 2, `${id} area damage`);
}
for (const armies of [[all, all], [{myth_centaur: 7}, {myth_fenrir: 7}], [{myth_cyclops: 3}, {spartan: 25}]]) {
  const a = new Battle({ historicalArmies: armies, seed: 39 }), b = new Battle({ historicalArmies: armies, seed: 39 });
  for (let i=0;i<9000 && a.winner===null;i++) { a.step(1/30);b.step(1/30); }
  assert.notEqual(a.winner, null, 'battle must end, including mounted archer pursuit');
  assert.ok(a.units.every(u => [u.x,u.y,u.hp].every(Number.isFinite)));
  assert.deepEqual(a.units.map(u => [u.x,u.y,u.hp]), b.units.map(u => [u.x,u.y,u.hp]));
  console.log(`PASS mythology deterministic battle ${a.time.toFixed(1)}s, survivors ${a.counts()}`);
}
console.log('PASS 9 creatures, 3 cultures, mixed saves, both-team orders/removal, splash and archery.');
