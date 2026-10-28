import assert from 'node:assert/strict';
import {TerritoryBattle} from '../src/territory.js';

const start=40*80+40;
function setup(seed=42){
  const race=new TerritoryBattle({count:8,arenaShape:'square',seed});
  race.time=5;race.state='running';
  for(const i of race.valid)race.setOwner(i,-1);
  const b=race.balls[0];
  for(const other of race.balls.slice(1))other.eliminatedAt=0;
  b.cell=start;b.home=start;b.body.position=race.position(start);b.launchReady=true;
  race.setOwner(start,b.id);
  return {race,b};
}
{
  const {race,b}=setup();b.speedUntil=race.time+.5;
  assert.ok(Math.abs(race.travelTime(b,24)-1.4)<1e-9,'Travel estimates include normal speed after the boost expires');
  assert.ok(Math.abs(race.travelTime(b,6)-.25)<1e-9);
}
for(const boosted of [false,true]){
  const {race,b}=setup(),victim=race.balls[1];
  victim.eliminatedAt=null;victim.cell=start+30;victim.body.position=race.position(victim.cell);
  victim.trail=Array.from({length:9},(_,i)=>start+18+i*80);
  if(boosted)b.speedUntil=race.time+2;
  assert.equal(race.seekCut(b),boosted,'Speed enables an interception outside the ordinary time budget');
  if(boosted)assert.equal(b.route.at(-1),victim.trail[0]);
}
for(const distance of [7,15]){
  const {race,b}=setup(),victim=race.balls[1];
  victim.eliminatedAt=null;victim.cell=start+30;victim.body.position=race.position(victim.cell);
  victim.trail=Array.from({length:9},(_,i)=>start+distance+i*80);
  b.shieldUntil=race.time+1.5;
  assert.equal(race.seekCut(b),distance===7,'A shield raid must fit the remaining protection including the return');
  if(distance===7){
    assert.equal(b.route.at(-1),start);
    assert.ok(race.travelTime(b,b.route.length)+.2<=1.5);
    let previous=start;for(const cell of b.route){assert.ok(race.neighbors(previous).includes(cell));previous=cell;}
  }
}
{
  const {race,b}=setup();b.shieldUntil=race.time+1.5;
  race.plan(b);
  assert.ok(b.route.length>=8,'A shield without a reachable rival still makes a productive claim');
  assert.equal(b.route.at(-1),start);
  assert.ok(race.travelTime(b,b.route.length)+.2<=1.5,'The planned claim closes within the shield lifetime');
  const before=b.area;while(b.route.length)race.advance(b);
  assert.ok(b.area>before);
}
{
  const {race,b}=setup();b.cell=start+5;b.body.position=race.position(b.cell);
  b.trail=Array.from({length:5},(_,i)=>start+i+1);
  b.route=Array.from({length:12},(_,i)=>b.cell+(i+1)*80);
  b.shieldUntil=race.time+.6;
  assert.equal(race.tryCloseTrail(b),true,'Start the return before shield expiry, even with a short trail and no nearby body');
  assert.equal(b.route.at(-1),start);assert.equal(b.route.length,5);
  assert.ok(race.travelTime(b,b.route.length)<.6);
}
{
  const {race,b}=setup();b.speedUntil=race.time+2;
  b.trail=[start+1];b.cell=start+1;b.route=[start+2,start+82,start+81,start+80,start];
  const committed=[...b.route];b.buffDecision=true;race.useBuff(b);
  assert.deepEqual(b.route,committed,'A new buff does not abandon an open claim');
  b.trail=[];b.cell=start;b.route=[start+1,start+81,start+80,start];b.buffDecision=true;
  race.useBuff(b);assert.equal(b.route.length,0,'Replan an unstarted claim to exploit the new buff');
  race.pickups=[{type:'shield',cell:start-10,expiresAt:20}];race.seekPickup(b);
  assert.ok(!b.pickupTarget,'Spend the active boost on play instead of collecting another pickup');
}
{
  const {race,b}=setup();b.route=[start+1,start+81,start+80,start];
  b.phase=.5;b.body.position.x+=3;
  race.pickups=[{type:'shield',cell:start+5,expiresAt:20}];
  const next=b.route[0],before={...b.body.position};race.move(b,1/120);
  assert.equal(b.route[0],next,'Collecting a buff cannot change a segment halfway through movement');
  assert.ok(Math.hypot(b.body.position.x-before.x,b.body.position.y-before.y)<=6/race.cellSeconds/120+1e-7);
}
{
  let normal=0,fast=0;
  for(let seed=1;seed<=24;seed++)for(const boosted of [false,true]){
    const {race,b}=setup(seed);if(boosted)b.speedUntil=race.time+2;
    race.plan(b);while(b.route.length)race.advance(b);
    if(boosted)fast+=b.area;else normal+=b.area;
  }
  assert.ok(fast>normal*1.1,`Speed should produce meaningfully bigger planned claims (${fast} vs ${normal})`);
}
console.log('PASS: expiry-aware timing, speed interceptions and larger claims, protected raids with a return, shield banking, active-buff focus and continuous committed routes.');
