import assert from 'node:assert/strict';
import { MIDDLE_EARTH_UNITS as units } from '../src/middle-earth-units.js';
import { HISTORICAL_TYPES, restoreHistoricalArmies } from '../src/historical-combat.js';
import { Battle } from '../src/crown-battle.js';
import catalogue from '../src/historical-catalogue.js';

const ids = ['gondor_swordsman','gondor_spearman','gondor_veteran','rohan_warrior','uruk_swordsman','uruk_pikeman','mordor_orc','lorien_elf','iron_hills_dwarf','iron_hills_veteran','aragorn','legolas','gimli','gandalf','sauron','witch_king','cave_troll','balrog'].map(id => `me_${id}`);
// A new card can be inserted beside its faction without invalidating old IDs.
const previousUnits = units.filter(u => u.id !== 'me_uruk_warg_rider');
assert.deepEqual(previousUnits.slice(0,18).map(u => u.id), ids, 'Existing saved army IDs must survive');
ids.push(...['elrond','ent','nazgul','rohirrim','gondor_cavalry','dwarf_ram_rider','elf_stag_rider','azog_warg'].map(id=>`me_${id}`));
assert.deepEqual(previousUnits.slice(0,26).map(u=>u.id),ids,'Previous expansion IDs and relative order survive');
ids.push(...['theoden','eomer','boromir','faramir','saruman','thranduil','haldir','dain','shelob','mumakil'].map(id=>`me_${id}`));
assert.deepEqual(previousUnits.map(u=>u.id),ids);
ids.push('me_uruk_warg_rider');
assert.equal(new Set(units.map(u => u.id)).size, ids.length);
assert.ok(units.some(u => u.id === 'me_uruk_warg_rider'));
assert.equal(units.filter(u => u.hero).length, 16);
for (const unit of units) {
  const resolved = catalogue.find(u => u.id === unit.id);
  for (const [key,value] of Object.entries(resolved.combat)) assert.equal(HISTORICAL_TYPES[unit.id][key],value, `${unit.id}/${key}`);
}
const all = Object.fromEntries(ids.map(id => [id,1]));
const saved = [{roman:2,...all}, {spartan:2,...all}];
assert.deepEqual(restoreHistoricalArmies(JSON.parse(JSON.stringify(saved))).armies,saved);
const commands = new Battle({historicalArmies:saved,seed:72});
for (const team of [0,1]) {
  commands.setActiveTeam(team);
  for (const id of ids) {
    commands.select(id);assert.equal(commands.selected.size,1);
    const selected = commands.units.find(u => commands.selected.has(u.id));
    commands.moveSelected(240,600);assert.equal(selected.order.kind,'move');
    commands.stopSelected();assert.equal(selected.order.kind,'hold');assert.ok(!selected.pendingAttack);
    const target = commands.units.find(u => u.team !== team && u.hp > 0);
    assert.ok(commands.attackSelected(target.id));assert.equal(selected.order.targetId,target.id);
    commands.engageSelected();assert.equal(selected.order,null);
  }
  commands.select('me_sauron');assert.equal(commands.removeSelected().length,1);
}
for (const id of ['me_legolas','me_faramir','me_gandalf','me_saruman','me_sauron','me_cave_troll','me_balrog','me_ent','me_mumakil']) {
  const archer=['me_legolas','me_faramir'].includes(id);
  const b = new Battle({historicalArmies:[{[id]:1},{roman:3}],seed:5});
  Object.assign(b.units[0],{x:250,y:400,cooldown:0,chargeCooldown:100,headingX:1,headingY:0});
  for (const [i,u] of b.units.slice(1).entries()) Object.assign(u,{x:archer?360:273,y:398+i*3,cooldown:100});
  for (let i=0;i<20;i++) b.step(1/30);
  if (archer) assert.ok(b.stats.arrows>0,`${id} releases arrows`);
  else {assert.equal(b.stats.arrows,0,`${id} must not fire bow arrows`);assert.ok(b.units.slice(1).filter(u=>u.hp<u.maxHp).length>=2,`${id} close area hit`);}
}
const a = new Battle({historicalArmies:[all,all],seed:39}), b = new Battle({historicalArmies:[all,all],seed:39});
for (let i=0;i<9000 && a.winner===null;i++){a.step(1/30);b.step(1/30);}
assert.notEqual(a.winner,null,'Mixed battle must finish');
assert.ok(a.units.every(u=>[u.x,u.y,u.hp].every(Number.isFinite)));
assert.deepEqual(a.units.map(u=>[u.x,u.y,u.hp]),b.units.map(u=>[u.x,u.y,u.hp]));
console.log(`PASS Middle-earth: ${ids.length} IDs, 16 heroes, mixed saves, orders/removal both teams, archery/melee/splash; deterministic battle ${a.time.toFixed(1)}s.`);
