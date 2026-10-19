import assert from 'node:assert/strict';
import { SiegeBattle, CASTLE, ATTACKERS, DEFENDERS } from '../src/crown-siege.js';
import { Battle, TYPES } from '../src/crown-battle.js';

const b = new SiegeBattle();
assert.deepEqual(b.counts(), [44,84]);
assert.ok((CASTLE.right-CASTLE.left)*(CASTLE.bottom-CASTLE.top)>10*400*280,'Fortress footprint exceeds ten previous courtyards');
assert.ok(b.units.filter(u=>u.team===DEFENDERS).every(u=>u.x<CASTLE.right),'Left army defends castle');
assert.ok(b.units.filter(u=>u.team===ATTACKERS).every(u=>u.x>CASTLE.right+300),'Right army attacks from east');
assert.ok(b.units.filter(u=>u.wall).every(u=>u.team===DEFENDERS&&u.headingX===1),'Wall archers face east');
for(const u of b.units.filter(u=>!u.wall))assert.ok(b.navigation.free(u,3),'Initial infantry avoids buildings and walls');
assert.equal(b.navigation.clear({x:130,y:480},{x:10,y:480},3.75),false,'Closed gate must block infantry');
assert.equal(b.navigation.route({x:130,y:480},{x:-200,y:480},3.75).length,0,'Cannot walk around a closed castle');
const infantry=b.units.find(u=>u.team===ATTACKERS&&u.type==='sword'),wall=b.units.find(u=>u.wall);
const old={x:infantry.x,y:infantry.y};Object.assign(infantry,{x:120,y:480});
b.moveUnit(infantry,0,480);assert.equal(infantry.x,120,'Cannot tunnel through gate');Object.assign(infantry,old);
assert.equal(b.clearShot(infantry,wall,false),false);
let hp=wall.hp;b.hit(wall,20,infantry);assert.equal(wall.hp,hp,'Ground melee cannot hit walkway');
b.hit(wall,20,undefined,{x:300,y:600},'arrow');assert.equal(wall.hp,hp-10,'Parapet halves arrow damage');
const wallPos={x:wall.x,y:wall.y};b.moveUnit(wall,200,300);assert.equal(wall.x,wallPos.x);assert.equal(wall.y,wallPos.y);
b.damageGate(b.gate.maxHp);assert.equal(b.phase,'courtyard');
assert.equal(b.navigation.clear({x:130,y:480},{x:10,y:480},3.75),true,'Breach opens infantry route');
assert.ok(b.navigation.route({x:130,y:480},{x:-200,y:480},3.75).length);
assert.equal(b.navigation.clear({x:130,y:800},{x:10,y:800},3.75),false,'Other walls stay solid');
assert.equal(b.navigation.clear({x:-560,y:480},{x:-330,y:480},3.75),false,'Inner keep is a solid building');
assert.equal(b.navigation.clear({x:-300,y:-260},{x:-300,y:-60},3.75),false,'Barracks cannot be walked through');
const defender=b.units.find(u=>u.team===DEFENDERS&&!u.wall);
for(const u of b.units){u.order={kind:'hold'};u.cooldown=1000;if(u.team===DEFENDERS&&!u.wall)u.y+=600;}
Object.assign(infantry,{x:-200,y:480});b.updateUnits(.05);assert.equal(b.capture.progress,.05);
Object.assign(defender,{x:-170,y:480});b.updateUnits(.05);assert.equal(b.capture.contested,true);assert.equal(b.capture.progress,.05);
Object.assign(defender,{x:-200,y:700});b.updateUnits(.05);assert.equal(b.capture.progress,.1);
Object.assign(infantry,{x:200,y:480});b.updateUnits(.05);assert.equal(b.capture.progress,.1,'Empty objective retains progress but stops clock');
b.capture.progress=30;b.checkOutcome();assert.equal(b.winner,ATTACKERS);
const finishedTime=b.time;b.step(.05);assert.equal(b.time,finishedTime);
const timeout=new SiegeBattle();timeout.time=300;timeout.checkOutcome();assert.equal(timeout.winner,DEFENDERS);
const lost=new SiegeBattle();for(const u of lost.units)if(u.team===ATTACKERS)u.hp=0;lost.checkOutcome();assert.equal(lost.winner,DEFENDERS);
const noGarrison=new SiegeBattle();for(const u of noGarrison.units)if(u.team===DEFENDERS)u.hp=0;noGarrison.checkOutcome();assert.equal(noGarrison.winner,null,'Attacker still needs the objective');
const command=new SiegeBattle({activeTeam:DEFENDERS});command.selected.add(command.units[0].id);assert.equal(command.commandMove(200,600),1);assert.equal(command.units[0].order.kind,'move');
assert.equal(TYPES.archer.reach,170,'Siege range must not mutate classic config');
const classic=new Battle({size:40});assert.equal(classic.mode,undefined);assert.equal(classic.navigation,null);classic.time=180;classic.checkOutcome();assert.notEqual(classic.winner,null,'Classic timeout unchanged');
console.log('PASS siege gate, walls, elevation, cover, capture, commands, outcomes, classic isolation');

// Full autonomous battles catch gate queues and navigation deadlocks.
for(const seed of [1066,42,123]){
  const sim=new SiegeBattle({seed});let breach=null,entered=false;
  for(let i=0;i<9002&&sim.winner===null;i++){
    sim.step(1/30);
    if(!sim.gate.hp&&breach===null)breach=sim.time;
    if(sim.units.some(u=>u.team===ATTACKERS&&u.hp>0&&u.x<0))entered=true;
    if(i%600===0)for(const u of sim.units.filter(u=>u.hp>0&&!u.wall))assert.ok(sim.navigation.free(u,3),'Living infantry must remain outside solid walls');
  }
  console.log(JSON.stringify({seed,breach:breach===null?null:Math.round(breach),time:Math.round(sim.time),winner:sim.winner,counts:sim.counts(),capture:Math.round(sim.capture.progress),climbs:sim.siegeStats.climbs,ramHits:sim.ram.hits,entered}));
  assert.ok(breach!==null,'Default siege must reach the breach phase');assert.ok(entered,'Attackers must navigate into courtyard');assert.notEqual(sim.winner,null);
  assert.ok(sim.ram.hits>0,'Crew must deliver real ram strikes');
  assert.ok(sim.siegeStats.climbs>0,'Covering archers must enable a ladder assault');
}
