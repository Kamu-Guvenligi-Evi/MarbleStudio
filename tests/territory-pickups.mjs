import assert from 'node:assert/strict';
import {TerritoryBattle,TERRITORY_BUFFS,TERRITORY_PICKUP_RADIUS} from '../src/territory.js';

const start=40*80+40;
function setup(){
  const race=new TerritoryBattle({arenaShape:'square',count:2});
  const b=race.balls[0];b.cell=start;b.body.position=race.position(start);
  race.setOwner(start,b.id);race.plan=()=>{};
  return {race,b};
}
function tick(race,b){
  const before={...b.body.position};race.time+=1/120;race.move(b,1/120);
  assert.ok(Math.hypot(b.body.position.x-before.x,b.body.position.y-before.y)<=6*1.8/.035/120+1e-7,'Buff decisions preserve continuous movement');
}

for(const type of ['speed','shield']){
  const {race,b}=setup();b.route=[start+1,start+2];
  race.pickups=[{type,cell:start+5,expiresAt:10}];
  // The ball touches the pickup between grid centers, while following its route.
  b.phase=.75;b.body.position.x+=4.5;
  assert.ok(30-4.5<b.body.circleRadius+TERRITORY_PICKUP_RADIUS);
  race.collectPickups(b);
  assert.equal(race.pickups.length,0,'Visible contact collects the pickup immediately');
  const until=b[type==='speed'?'speedUntil':'shieldUntil'];
  assert.equal(until,TERRITORY_BUFFS[type].duration,'Effects start at contact and retain their short duration');
  if(type==='speed')assert.equal(race.speed(b),1.8);else assert.equal(race.protected(b),true);
  race.time=until;
  if(type==='speed')assert.equal(race.speed(b),1);else assert.equal(race.protected(b),false);
}
{
  const {race,b}=setup();race.pickups=[{type:'speed',cell:start,expiresAt:0}];race.collectPickups(b);
  assert.equal(b.speedUntil,0,'An expired pickup cannot activate');
  race.pickups=[{type:'shield',cell:start,expiresAt:10}];b.eliminatedAt=0;race.collectPickups(b);
  assert.equal(race.pickups.length,1,'Eliminated players cannot take pickups');
}
{
  const {race,b}=setup();b.route=[start-1];
  race.pickups=[{type:'speed',cell:start-20*80,expiresAt:10}];race.seekPickup(b);
  assert.equal(b.route.at(-1),race.pickups[0].cell,'A useful buff in the wider local range is pursued');
  for(let i=0;i<100&&race.pickups.length;i++)tick(race,b);
  assert.equal(race.pickups.length,0,'The pursued pickup is actually collected');
}
{
  const {race,b}=setup(),goal=start+20;
  b.route=Array.from({length:20},(_,i)=>start+i+1);
  for(const cell of b.route)race.setOwner(cell,b.id);
  race.pickups=[{type:'shield',cell:start+8,expiresAt:10}];
  for(let i=0;i<120;i++){
    const x=b.body.position.x;tick(race,b);
    assert.ok(b.body.position.x>=x,'A pickup along the route never causes an unnecessary return trip');
  }
  assert.equal(b.cell,goal);assert.equal(race.pickups.length,0);
}
for(const reason of ['taken','expired']){
  const {race,b}=setup();b.route=Array.from({length:8},(_,i)=>start-i-1);
  race.pickups=[{type:'shield',cell:start-12*80,expiresAt:10}];tick(race,b);
  const next=b.route[0];assert.ok(b.phase>0&&b.phase<1);
  if(reason==='taken')race.pickups=[];else race.time=10;
  tick(race,b);assert.equal(b.route[0],next,'A vanished target cannot turn a ball in mid-cell');
  for(let i=0;i<8;i++)tick(race,b);
  assert.equal(b.pickupTarget,null,`${reason}: stop chasing a pickup that is gone`);
  for(let i=0;i<80;i++)tick(race,b);
  assert.equal(b.cell,start,'Bank the return home before choosing a new land-taking route');
  assert.equal(b.route.length,0,'A completed return discards the obsolete route');
}
{
  const {race,b}=setup();race.setOwner(start,-1);b.trail=Array.from({length:12},(_,i)=>start+i);
  b.route=Array.from({length:16},(_,i)=>start+i+1);
  const shield={type:'shield',cell:start-10*80,expiresAt:10};
  const original=[...b.route];
  race.pickups=[{type:'speed',cell:start-8,expiresAt:10},shield];race.seekPickup(b);
  assert.ok(!b.pickupTarget,'An open claim is not abandoned for a buff');
  assert.deepEqual(b.route,original,'Keep the committed land-taking route');
}
{
  const {race,b}=setup();b.trail=Array.from({length:31},(_,i)=>start+i);b.route=Array.from({length:6},(_,i)=>start-(i+1)*80);
  race.pickups=[{type:'shield',cell:start-6*80,expiresAt:10}];
  for(let i=0;i<40&&race.pickups.length;i++)tick(race,b);
  assert.equal(race.pickups.length,0,'A long trail does not forbid an immediately useful nearby buff');
}
{
  const {race,b}=setup(),blocker=race.balls[1];
  blocker.cell=start-7*80;blocker.body.position=race.position(blocker.cell);blocker.shieldUntil=10;
  b.route=[start-1];race.pickups=[{type:'speed',cell:start-14*80,expiresAt:10}];race.seekPickup(b);
  assert.ok(b.pickupTarget,'A reachable pickup behind a body still gets a route');
  for(const cell of b.route){
    const p=race.position(cell),q=blocker.body.position;
    assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=b.body.circleRadius+blocker.body.circleRadius+2,'Pickup routes go around occupied space');
  }
  for(let i=0;i<120&&race.pickups.length;i++)tick(race,b);
  assert.equal(race.pickups.length,0,'The player can collect the pickup around a stationary blocker');
}
console.log('PASS: visible pickup contact, short effect duration, purposeful pursuit, useful shields, no wasted return trips, cancelled targets and obstacle-aware pickup routes.');
