import assert from 'node:assert/strict';
import {TerritoryBattle} from '../src/territory.js';
import {normalizeSnapshot} from '../src/studio-transfer.js';

const cell=(x,y)=>y*80+x;
function setup(){
  const race=new TerritoryBattle({arenaShape:'square',count:2});race.time=5;
  for(const i of race.valid)race.setOwner(i,-1);
  for(const [id,b] of race.balls.entries()){
    b.cell=b.home=cell(id?65:20,id?65:20);b.body.position=race.position(b.cell);
    race.setOwner(b.cell,b.id);
  }
  return race;
}
{
  const race=setup(),b=race.balls[0],home=b.cell;
  b.route=[home+1,home+2,home+82,home+2,home+3];
  for(let i=0;i<5;i++)race.advance(b);
  assert.equal(b.trailAnchor,home);
  assert.deepEqual(b.trail,[home+1,home+2,home+3]);
  assert.equal(race.trailOwners[home+82],-1,'The retracted branch must no longer be cuttable');
  const path=[b.trailAnchor,...b.trail];
  for(let i=1;i<path.length;i++)assert.ok(race.neighbors(path[i-1]).includes(path[i]),'Every visible segment follows actual adjacent cells');
  b.route=[home+2,home+1,home,home+80,home+160];
  for(let i=0;i<3;i++)race.advance(b);
  assert.equal(b.cell,home);assert.equal(b.trail.length,0);assert.equal(b.route.length,0);
  assert.equal(b.launchReady,false,'A completed excursion starts a new decision');
}
{
  const race=setup(),[b,other]=race.balls,home=b.cell;
  b.route=Array.from({length:15},(_,i)=>home+i+1);
  for(let i=0;i<4;i++)race.advance(b);
  const original=[...b.route];
  other.trail=Array.from({length:9},(_,i)=>home-4*80+i);
  race.pickups=[{type:'shield',cell:home+4-8*80,expiresAt:20}];
  assert.equal(race.seekCut(b),false);race.seekPickup(b);
  assert.deepEqual(b.route,original,'An open claim cannot be interrupted by a new hunt or pickup');
}
for(const moving of [0,1]){
  const race=setup(),[a,b]=race.balls;
  a.cell=cell(40,40);b.cell=cell(47,40);
  for(const ball of [a,b]){ball.body.position=race.position(ball.cell);ball.trail=[ball.cell];}
  const mover=race.balls[moving],other=race.balls[1-moving];
  assert.equal(race.contact(mover,other.body.position),false);
  assert.ok(race.balls.every(ball=>ball.eliminatedAt===null),'Equal exposure cannot award a kill based on iteration order');
}
{
  const race=setup(),b=race.balls[0];
  for(let y=20;y<=50;y++)for(let x=20;x<=50;x++)race.setOwner(cell(x,y),b.id);
  b.cell=cell(35,20);b.body.position=race.position(b.cell);race.plan(b);
  assert.ok(!b.launchReady||b.route.length<=5,'Do not cross a large owned region to choose a random frontier');
}
assert.equal(new TerritoryBattle().duration,60);
{
  const race=setup(),b=race.balls[0],home=b.cell;
  b.trail=[home+1,home+2,home+3,home+83,home+163,home+243,home+323];
  b.cell=b.trail.at(-1);b.body.position=race.position(b.cell);
  let cursor=home+3;const original=[];
  for(const [delta,count] of [[1,9],[80,12],[-1,12],[-80,12]])for(let i=0;i<count;i++){cursor+=delta;original.push(cursor);}
  b.detourResumeRoute=original;b.route=[];
  b.nextSafetyLookAt=b.nextShieldLookAt=b.nextHuntAt=b.nextPickupLookAt=100;
  race.move(b,1/120);
  assert.ok(b.route.includes(cell(32,32)),'A sideways yield rejoins the claim instead of discarding it for a direct trip home');
  assert.equal(b.route.at(-1),home);
  let previous=b.cell;for(const c of b.route){assert.ok(race.neighbors(previous).includes(c));previous=c;}
}
{
  const race=setup(),b=race.balls[0],home=b.cell;
  race.setOwner(home+2,b.id);
  for(let x=0;x<=2;x++)race.setOwner(home+80+x,b.id);
  const short=race.claimCandidate(b,10,10,true);
  assert.deepEqual(short.route,[home+1,home+2],'Stop the forecast at the first real capture');
  assert.equal(short.gain,1,'Do not count the untouched rectangle beyond an early return');
  assert.equal(short.interior,0,'A one-cell strip encloses no territory');
  const loop=race.claimCandidate(b,10,10,false);
  assert.ok(loop.interior>=60,'The opposite direction still encloses the intended patch');
  b.route=[...loop.route];const before=b.area;
  while(b.route.length)race.advance(b);
  assert.equal(b.area-before,loop.gain,'Forecast matches the actual first capture');
}
for(let seed=1;seed<=24;seed++){
  const race=setup(),b=race.balls[0];
  // An irregular frontier with several possible early re-entry points.
  for(let y=20;y<=30;y++)for(let x=20;x<=30;x++)if(x<=22||y>=28)race.setOwner(cell(x,y),b.id);
  b.cell=cell(22,24);b.body.position=race.position(b.cell);b.launchReady=true;
  let state=seed;race.rng=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
  race.plan(b);assert.ok(b.route.length>2);
  let outside=false;
  for(const [i,c] of b.route.entries()){
    if(race.cells[c]!==b.id)outside=true;
    else if(outside)assert.equal(i,b.route.length-1,'A claim has no unreachable route after its first return');
  }
  assert.ok(outside);assert.equal(race.cells[b.route.at(-1)],b.id);
}
assert.equal(new TerritoryBattle({territoryDuration:90}).duration,90);
assert.equal(normalizeSnapshot({mode:'arena',project:{arenaGame:'territory',count:8,territoryDuration:90,sequence:[]}}).project.territoryDuration,90);
console.log('PASS: continuous retracting trails, claim commitment, fresh plans after return, symmetric contact, nearby frontiers and longer duration.');
