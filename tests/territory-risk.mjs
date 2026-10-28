import assert from 'node:assert/strict';
import {TerritoryBattle,TERRITORY_BALL_RADIUS} from '../src/territory.js';

const cell=(x,y)=>y*80+x;
function arena(){
  const race=new TerritoryBattle({arenaShape:'square',count:2});
  for(const i of race.valid)race.setOwner(i,-1);
  for(const [i,b] of race.balls.entries()){
    b.cell=b.home=cell(i?64:20,i?64:20);b.body.position=race.position(b.cell);race.seedHome(b);
  }
  race.time=5;
  return race;
}
function longLoop(race){
  const b=race.balls[0];let c=b.cell;
  for(const direction of [1,80,-1,-80])for(let i=0;i<24;i++){c+=direction;b.route.push(c);}
  return b;
}
assert.equal(TERRITORY_BALL_RADIUS,19);

// The large interior is unbanked until the owner returns home.
{
  const race=arena(),b=longLoop(race),interior=cell(32,32);
  for(let i=0;i<90;i++)race.advance(b);
  assert.equal(race.cells[interior],-1);assert.ok(b.trail.length>80);
  while(b.route.length)race.advance(b);
  assert.equal(race.cells[interior],b.id);assert.ok(b.area>=625);
  assert.equal(b.trail.length,0);assert.equal(b.claims,1);
}

// A nearly completed big claim can still be lost entirely to one cut.
{
  const race=arena(),victim=longLoop(race),attacker=race.balls[1];
  for(let i=0;i<90;i++)race.advance(victim);
  const before=attacker.area+victim.area,edge=race.position(cell(32,20));
  attacker.body.position={x:edge.x,y:edge.y-18};
  assert.ok(!victim.trail.includes(attacker.cell),'The cutter centre need not enter the trail cell');
  race.cutTrails(attacker);
  assert.equal(victim.eliminatedAt,5);assert.equal(victim.area,0);assert.equal(victim.trail.length,0);
  assert.equal(attacker.area,before);assert.equal(race.cells[cell(32,32)],-1);
  assert.equal(attacker.cuts,1);
  const frozen={...victim.body.position};race.move(victim,1);assert.deepEqual(victim.body.position,frozen);
}

// Visible edge contact respects shields and does not reach distant trails.
for(const protectedTrail of [false,true]){
  const race=arena(),[attacker,victim]=race.balls,target=cell(28,20),p=race.position(target);
  victim.trail=[target];race.trailOwners[target]=victim.id;
  attacker.body.position={x:p.x,y:p.y-24};race.cutTrails(attacker);
  assert.equal(victim.eliminatedAt,null);
  if(protectedTrail)victim.shieldUntil=6;
  attacker.body.position.y=p.y-18;race.cutTrails(attacker);
  assert.equal(victim.eliminatedAt,protectedTrail?null:5);
}

// A nearby exposed trail draws an actual intercept, while a shielded one does not.
for(const shielded of [false,true]){
  const race=arena(),[attacker,victim]=race.balls;
  victim.trail=Array.from({length:9},(_,i)=>cell(28,16+i));
  for(const c of victim.trail)race.trailOwners[c]=victim.id;
  if(shielded)victim.shieldUntil=6;
  assert.equal(race.seekCut(attacker),!shielded);
  if(!shielded){
    assert.ok(victim.trail.includes(attacker.route.at(-1)));
    for(let i=0;i<100&&victim.eliminatedAt===null;i++){race.time+=1/120;race.move(attacker,1/120);}
    assert.notEqual(victim.eliminatedAt,null);assert.equal(attacker.cuts,1);
  }
}

// Ordinary matches must actually produce large claims, not only synthetic loops.
let bigClaimMatches=0;
for(const seed of [7,2048,19,42,99,123]){
  const race=new TerritoryBattle({arenaShape:'portrait',count:12,seed});race.start();let largest=0;
  while(race.state==='running'){
    race.step(1000/60);
    for(const event of race.events)if(event.type==='claim')largest=Math.max(largest,event.cells);
  }
  if(largest/race.valid.length>.05)bigClaimMatches++;
}
assert.ok(bigClaimMatches>=4,'Most seeded matches produce a successful claim above 5%; a particular risky attempt can fail');
console.log('PASS: large unbanked claims, immediate elimination and inheritance, visible edge cuts, shields, intentional interception and big claims in a full match.');
