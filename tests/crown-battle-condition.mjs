import assert from 'node:assert/strict';
import { Battle, UNIT_TYPES } from '../src/crown-battle.js';
import { conditionSpeed, conditionCadence, conditionSummary } from '../src/crown-battle-condition.js';
const gap = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
function pair(type='mongol', hz=30) {
  const b = new Battle({seed:1427,historicalArmies:[{[type]:1},{roman:1}],expandedMap:true});
  const [a,z]=b.units;
  Object.assign(a,{x:300,y:450,cooldown:0});
  Object.assign(z,{x:350,y:450,hp:10000,maxHp:10000,cooldown:1000});
  return {b,a,z,run(seconds,inspect=()=>{}) {for(let i=0;i<seconds*hz&&b.winner===null;i++){b.step(1/hz);inspect();}}};
}

// Successful arrows cannot renew the horse's energy. Check both teams and tick rates.
const pursuits=[];
for (const hz of [30,60]) for (const team of [0,1]) {
  const {b,a,z,run}=pair('mongol',hz);
  if(team) {a.team=1;z.team=0;}
  let fatiguePeak=0,rested=false,contactAt=null,movingShots=0,arrows=0;
  run(150,()=>{
    fatiguePeak=Math.max(fatiguePeak,a.fatigue); rested ||= a.resting;
    if(b.stats.arrows>arrows&&a.moving)movingShots++;
    arrows=b.stats.arrows;
    if(b.time>20&&gap(a,z)<26&&contactAt===null)contactAt=b.time;
  });
  assert.ok(movingShots>5&&z.hp<9900,'Fresh rider still shoots effectively while moving');
  assert.ok(fatiguePeak>=80&&rested,'Successful fire still exhausts horse');
  assert.ok(contactAt!==null&&contactAt<150,'Persistent infantry can catch exhausted rider');
  pursuits.push({hz,team,contactAt:+contactAt.toFixed(1),fatiguePeak:+fatiguePeak.toFixed(1)});
}

// All current mounted ranged equipment shares the condition rules.
for(const [type,cfg] of Object.entries(UNIT_TYPES).filter(([,c])=>c.role==='cavalry'&&c.ranged)) {
  const {b,a,z}=pair(type); a.fatigue=100;
  assert.ok(cfg.speed*conditionSpeed(a)<UNIT_TYPES.roman.speed,`${type}: exhausted speed is catchable`);
  a.resting=true;b.attack(a,z,80);assert.equal(a.pendingAttack,undefined,'Resting rider holds ranged fire');
}

{
  const {b,a,z,run}=pair();z.order={kind:'hold'};z.x=1200;
  Object.assign(a,{fatigue:90,morale:60,resting:true,order:{kind:'hold'}});
  b.selected.add(a.id);b.stopSelected();assert.equal(a.fatigue,90);assert.equal(a.morale,60);
  b.moveSelected(350,450);assert.equal(a.fatigue,90);
  b.engageSelected();assert.equal(a.fatigue,90);
  b.stopSelected();run(18);
  assert.ok(a.fatigue<40&&!a.resting,'Quiet rest restores energy and releases recovery state');
  assert.ok(a.morale>60,'Quiet rest restores morale');
  a.fatigue=100;a.morale=30;
  assert.ok(conditionCadence(a)>1.8,'Fatigue and shaken morale slow attacks');
  assert.match(conditionSummary(b),/Seçili.*Yorgunluk %100.*Moral %30/);
}

// Standing archers must stop firing to recover, not just stop travelling.
{
  const {b,a,z,run}=pair('norse_longbowman');a.fatigue=55;a.order={kind:'hold'};z.x=410;z.order={kind:'hold'};
  run(10);assert.ok(a.fatigue>55&&b.stats.arrows>2);
  b.selected.add(a.id);b.restSelected();const tired=a.fatigue,shots=b.stats.arrows;
  assert.match(conditionSummary(b),/1 dinleniyor/,'Manual rest is visible in condition status');
  run(12);assert.ok(a.fatigue<tired-20);assert.equal(b.stats.arrows,shots,'Rest order stops fire even inside weapon range');
  b.engageSelected();run(4);assert.ok(b.stats.arrows>shots,'Free engagement resumes fire');
}

// Preparing/cancelling a ranged shot is not a release; blocked fire cannot
// exhaust a stationary unit while it waits for a clear line through allies.
{
  const b=new Battle({seed:71,historicalArmies:[{janissary:1,roman:1},{roman:1}]});
  const a=b.units.find(u=>u.type==='janissary'),ally=b.units.find(u=>u.team===0&&u!==a),z=b.units.find(u=>u.team===1);
  for(const u of b.units)Object.assign(u,{y:450,cooldown:100,order:{kind:'hold'}});
  a.x=200;ally.x=280;z.x=300;
  b.step(1/30);
  for(let i=0;i<8;i++){
    b.attack(a,z,100);assert.equal(a.fatigue,0,'Drawing/aiming alone does not charge a projectile');
    b.resolveAttack(a,z,true);a.pendingAttack=null;
  }
  assert.equal(b.projectiles.length,0);assert.equal(b.stats.heldShots,8);
  assert.equal(a.fatigue,0);assert.equal(a.lastExertion,-Infinity);
  ally.y+=80;b.step(1/30);b.resolveAttack(a,z,true);
  assert.equal(b.projectiles.length,1);assert.equal(a.fatigue,.9);
  assert.equal(a.lastExertion,b.time);
}

// A mounted archer fighting at arm's length pays melee effort, not moving fire.
{
  const {b,a,z}=pair();a.moving=true;a.speed=20;
  b.attack(a,z,15);assert.equal(a.fatigue,1.3);
  a.fatigue=80;a.resting=true;a.moving=true;b.selected.add(a.id);
  assert.match(conditionSummary(b),/1 dinlenme arıyor/);
  a.moving=false;assert.match(conditionSummary(b),/1 dinleniyor/);
}

// Shock is based on actual post-armour damage, and rallying suspends pending fire/orders.
{
  const {b,a,z,run}=pair();z.order={kind:'hold'};z.x=1200;
  a.morale=25;a.fatigue=20;
  b.hit(a,20,z);assert.ok(a.morale<20);
  a.order={kind:'move',x:800,y:450};const order=a.order;
  a.pendingAttack={target:z,projectile:true};a.attack=.1;
  run(1);assert.ok(a.rally);assert.equal(a.pendingAttack,null);assert.equal(a.order,order);
  assert.equal(b.stats.arrows,0);assert.ok(a.x<320,'Rally overrides forward movement briefly');
  run(8);assert.equal(a.rally,null);assert.ok(a.morale>=40);assert.equal(a.order,order);
  assert.equal(b.stats.rallies,1,'Rally cooldown prevents repeated instant retreat');
}

// Allied armies keep independent casualty/leader shocks.
{
  const b=new Battle({seed:42,tacticalAI:false,armyConfigs:[
    {id:'first',team:0,roster:{roman:10},commanderId:'alp_arslan'},
    {id:'second',team:0,roster:{roman:10},commanderId:null},
    {id:'enemy',team:1,roster:{roman:10},commanderId:null}]});
  for(const u of b.units)u.order={kind:'hold'};
  b.step(1/30);
  const first=b.units.filter(u=>u.armyId==='first'&&!u.commanderId),other=b.units.find(u=>u.armyId==='second');
  for(const u of first.slice(0,7))b.hit(u,10000);
  b.hit(b.armyCommanders.get('first'),10000);
  for(let i=0;i<20;i++)b.step(1/30);
  assert.ok(first[9].morale<55,'Army casualty and commander shock apply');
  assert.ok(other.morale>99,'Other allied army does not inherit those losses');
}

// Exhausted cavalry cannot spam charges through a fresh order.
{
  const {b,a,z}=pair('seljuk_hassa');a.fatigue=85;b.startCharge(a,z);assert.equal(a.charge,null);
}
console.log('PASS fatigue, rest, morale, rally, order persistence, allied army isolation, all mounted ranged types',JSON.stringify(pursuits));
