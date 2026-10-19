import assert from 'node:assert/strict';
import catalogue from '../src/historical-catalogue.js';
import { Battle } from '../src/crown-battle.js';
import { HISTORICAL_TYPES, DEMO_ARMIES, validateHistoricalArmies } from '../src/historical-combat.js';

assert.deepEqual(Object.keys(HISTORICAL_TYPES).sort(), catalogue.map(u=>u.id).sort());
for (const plan of [null, [{},{}], [{samurai:-1},{roman:1}], [{samurai:.5},{roman:1}], [{unknown:1},{roman:1}], [{samurai:Infinity},{roman:1}]]) assert.throws(()=>validateHistoricalArmies(plan));
const all = Object.fromEntries(Object.keys(HISTORICAL_TYPES).map(id=>[id,3]));
const b = new Battle({historicalArmies:[all,all]});
assert.deepEqual(b.initial,[catalogue.length*3,catalogue.length*3]);
for(const id of Object.keys(all)){b.select(id);assert.equal(b.selected.size,3);}
b.select('cavalry');assert.equal(b.selected.size,Object.values(HISTORICAL_TYPES).filter(u=>u.role==='cavalry').length*3);
b.select('timur');b.moveSelected(300,300);assert.equal(b.units.filter(u=>u.order).length,3);b.engageSelected();assert.equal(b.units.filter(u=>u.order).length,0);
const large=new Battle({historicalArmies:[{kipchak:2501},{spartan:2}]});assert.deepEqual(large.initial,[2501,2]);assert.ok(large.units.every(u=>u.x>=35&&u.x<=565&&u.y>=110&&u.y<=875));
function encounter(type, enemy='roman', count=1) {
 const battle=new Battle({historicalArmies:[{[type]:1},{[enemy]:count}]});const source=battle.units[0];source.x=250;source.y=400;source.cooldown=0;source.chargeCooldown=100;
 const targets=battle.units.slice(1);targets.forEach((u,i)=>{u.x=275+i*3;u.y=400+i*3;u.cooldown=100;u.chargeCooldown=100;});
 return {battle,source,targets};
}
{
 const {battle,targets}=encounter('timur','roman',3);battle.step(1/30);assert.equal(battle.stats.stomps,0);for(let i=0;i<4;i++)battle.step(1/30);assert.equal(battle.stats.stomps,1);assert.ok(targets.every(u=>u.hp<u.maxHp&&u.vx>0),'Elephant damages and displaces multiple enemies at contact');
}
{
 const {battle,source,targets}=encounter('hussar','spartan');battle.startCharge(source,targets[0]);battle.step(1/30);assert.equal(source.charge,null);assert.equal(battle.stats.pikeCounters,1);
}
for(const type of ['kipchak','mongol','janissary']) {
 const {battle,source,targets}=encounter(type);targets[0].x=360;battle.step(1/30);assert.equal(battle.projectiles.length,0);for(let i=0;i<4;i++)battle.step(1/30);assert.equal(battle.projectiles.length,1);assert.equal(targets[0].hp,targets[0].maxHp);
 assert.equal(battle.projectiles[0].kind,type==='janissary'?'bullet':'arrow');
 for(let i=0;i<20;i++)battle.step(1/30);assert.ok(targets[0].hp<targets[0].maxHp);assert.equal(source.charge,null);
}
{
 const {battle,source}=encounter('mongol');const before=source.x;
 // Local navigation may spend its first frame choosing a collision-free lane.
 for(let i=0;i<5;i++)battle.step(1/30);assert.equal(battle.stats.arrows,1);
 for(let i=0;i<25;i++)battle.step(1/30);
 assert.ok(source.x<before,'Mounted archer retreats after choosing its escape lane');
}
for(const armies of [DEMO_ARMIES,[all,all],[{timur:2},{spartan:30}],[{mongol:12},{knight:10}]]) {
 const a=new Battle({historicalArmies:armies,seed:17}),b=new Battle({historicalArmies:armies,seed:17});
 for(let i=0;i<5500&&a.winner===null;i++){a.step(1/30);b.step(1/30);}
 assert.notEqual(a.winner,null);assert.ok(a.units.every(u=>[u.x,u.y,u.hp].every(Number.isFinite)));
 assert.deepEqual(a.units.map(u=>[u.x,u.y,u.hp]),b.units.map(u=>[u.x,u.y,u.hp]));
 console.log(`PASS historical battle: ${a.time.toFixed(1)}s; survivors ${a.counts()}; arrows ${a.stats.arrows}, shots ${a.stats.shots}, stomps ${a.stats.stomps}`);
}
console.log('PASS: all catalogue types, exact 2501-unit roster, selection/orders, invalid plans, elephant area damage, pike counter, mounted archery, gunfire, deterministic outcomes.');
