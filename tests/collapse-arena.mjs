import assert from 'node:assert/strict';
import Matter from 'matter-js';
import {CollapseArena,normalizeCollapse,fractureDisc,sweepSpike,CX,CY} from '../src/collapse-arena.js';
import {normalizeSnapshot} from '../src/studio-transfer.js';
const normalized=normalizeCollapse({seed:-5,fragments:100,growth:0,playbackSpeed:99});
assert.equal(normalized.seed,0);assert.equal(normalized.fragments,24);assert.equal(normalized.growth,3);assert.equal(normalized.playbackSpeed,3);
const area=poly=>Math.abs(poly.reduce((a,p,i)=>{const q=poly[(i+1)%poly.length];return a+p.x*q.y-p.y*q.x;},0)/2);
assert.ok(Math.abs(fractureDisc(35,16,()=>.5).reduce((sum,p)=>sum+area(p),0)-Math.PI*35*35)<20,'Fractures preserve disc area');
assert.equal(normalizeSnapshot({mode:'collapse-arena',project:{seed:17}}).project.seed,17);
const a=new CollapseArena({seed:17}),b=new CollapseArena({seed:17});
for(let i=0;i<600;i++){a.step();b.step();}
assert.deepEqual(a.snapshot(),b.snapshot(),'Same seed produces identical simulation');
const airborne=new CollapseArena();airborne.broken=8;
Matter.Body.setPosition(airborne.ball,{x:270,y:490});Matter.Body.setStatic(airborne.ball,true);
for(let i=0;i<120*8;i++)airborne.step();
assert.equal(airborne.broken,8,'An old stationary ball must not break in midair');
assert.ok(airborne.spike.bounds.max.x-airborne.spike.bounds.min.x>=66);
assert.ok(airborne.spike.bounds.max.y-airborne.spike.bounds.min.y>=69);
assert.equal(airborne.ball.circleRadius,12,'No growth without a wall hit');
const wallGame=new CollapseArena({growth:5});wallGame.engine.gravity.y=0;
Matter.Body.setPosition(wallGame.ball,{x:486,y:490});Matter.Body.setVelocity(wallGame.ball,{x:6,y:0});
const originalBall=wallGame.ball;
for(let i=0;i<12;i++)wallGame.step();
assert.equal(wallGame.ball,originalBall,'The same ball grows on contact');
assert.equal(wallGame.ball.circleRadius,13,'One wall bounce grows exactly once');
assert.equal(wallGame.broken,0);
assert.ok(Math.abs(wallGame.ball.velocity.x)>4.5&&Math.abs(wallGame.ball.velocity.x)<4.9,'Wall bounce retains about 80 percent of normal speed');
wallGame.breakBall();wallGame.spawn();
assert.ok(Math.abs(wallGame.ball.circleRadius-13)<1e-9,'Breaking and respawning do not add growth');
// Late-game large circles must break at their visible edge, without growing.
for(const radius of [12,80,170]){
  const g=new CollapseArena({growth:10});g.engine.gravity.y=0;
  Matter.Body.scale(g.ball,radius/g.ball.circleRadius,radius/g.ball.circleRadius);
  const tip=Math.min(...g.spike.vertices.map(v=>v.y));
  Matter.Body.setPosition(g.ball,{x:CX,y:tip-radius-1});Matter.Body.setVelocity(g.ball,{x:0,y:12});
  const size=g.ball.circleRadius;let brokenSize=0;const breakBall=g.breakBall.bind(g);
  g.breakBall=()=>{brokenSize=g.ball.circleRadius;breakBall();};g.step();
  assert.equal(g.broken,1,'Fast triangle approach breaks in the same step');
  assert.equal(brokenSize,size,'Triangle contact cannot grow the ball');assert.equal(g.wallHits,0);
}
const triangle=[{x:0,y:0},{x:10,y:20},{x:-10,y:20}];
assert.ok(Math.abs(sweepSpike({x:0,y:-20},{x:0,y:40},5,triangle)-.25)<1e-9,'Sweep detects contact even across the entire triangle');
assert.equal(sweepSpike({x:30,y:-20},{x:30,y:40},5,triangle),Infinity,'A near miss is not contact');
// A grazing ball slides across the rim but does not repeatedly inflate there.
const grazing=new CollapseArena();grazing.engine.gravity.y=0;
Matter.Body.setPosition(grazing.ball,{x:488,y:490});Matter.Body.setVelocity(grazing.ball,{x:0,y:.1});
for(let i=0;i<120;i++)grazing.step();assert.ok(grazing.wallHits<=1,'Continuous rim contact counts once');
const cases=process.argv.includes('--focused')?[]:process.argv.includes('--matrix')?[{seed:42},{seed:1,growth:3,fragments:8},{seed:987,growth:10,fragments:24}]:[{seed:42}];
// A full pile ends the round even when the active ball never reaches its size cap.
const filled=new CollapseArena();
const addFill=(x,y,w,h)=>{
  const shard=Matter.Bodies.rectangle(x,y,w,h);
  Object.assign(shard,{hue:0,light:50,fragmentShape:shard.vertices.map(v=>({x:v.x-x,y:v.y-y}))});
  filled.shards.push(shard);filled.shardArea+=shard.area;
};
for(let i=0;i<10;i++)addFill(CX,CY+100,300,100);
assert.equal(filled.isFull(),false,'Overlapping piles do not count empty space as filled');
filled.shards=[];filled.shardArea=0;filled.nextFillCheck=0;
addFill(CX,CY+50,460,360);
assert.equal(filled.isFull(),false,'A visible empty upper section keeps the game running');
filled.shards=[];filled.shardArea=0;filled.nextFillCheck=0;
for(let y=CY-225;y<CY+230;y+=30)for(let x=CX-225;x<CX+230;x+=30)addFill(x,y,30,30);
filled.step();
assert.equal(filled.phase,'collapse','Actual visible coverage triggers the finale');
const retained=filled.shards.length;
assert.ok(retained>0);assert.equal(filled.ball,null);
filled.spawn();assert.equal(filled.ball,null,'No new ball during the finale');
for(let i=0;i<120*6;i++)filled.step();
assert.equal(filled.state,'won','Full arena finishes instead of simulating indefinitely');
assert.equal(filled.sparks.length,retained,'Every accumulated fragment participates in the finale');
filled.reset();assert.equal(filled.shardArea,0);assert.equal(filled.phase,'arena');
const unforced=new CollapseArena();unforced.engine.gravity.y=0;unforced.time=3;
Matter.Body.setPosition(unforced.ball,{x:CX+50,y:CY});Matter.Body.setVelocity(unforced.ball,{x:0,y:0});
for(let i=0;i<120;i++)unforced.step();
assert.ok(unforced.ball.speed<1e-9,'A slow ball receives no artificial kick');
const fast=new CollapseArena();fast.engine.gravity.y=0;
Matter.Body.setPosition(fast.ball,{x:CX,y:CY});Matter.Body.setVelocity(fast.ball,{x:15,y:0});fast.step();
assert.ok(fast.ball.velocity.x>14.9,'Free flight is not flattened by a hard speed clamp');
const resting=new CollapseArena();resting.engine.gravity.y=0;
Matter.Body.setPosition(resting.ball,{x:488,y:CY});Matter.Body.setVelocity(resting.ball,{x:.2,y:0});resting.step();
assert.ok(Math.abs(resting.ball.velocity.x)<1e-9,'Slow wall contact settles without a micro bounce');
assert.equal(resting.wallHits,0,'Resting contact does not grow the ball');
// The ball pushes debris with reciprocal impulses; fragments persist.
const debrisGame=new CollapseArena();debrisGame.engine.gravity.y=0;
Matter.Body.setPosition(debrisGame.ball,{x:240,y:490});Matter.Body.setVelocity(debrisGame.ball,{x:6,y:0});
const debris=Matter.Bodies.rectangle(270,490,12,20,{density:.00015,collisionFilter:{category:4,mask:7}});
Object.assign(debris,{born:0,hue:0,light:50});debrisGame.shards.push(debris);Matter.Composite.add(debrisGame.engine.world,debris);
Matter.Sleeping.set(debris,true);
for(let i=0;i<20;i++)debrisGame.step();
assert.equal(debris.isSleeping,false,'Ball contact wakes a settled fragment');
assert.ok(debris.position.x>290,'Ball pushes the fragment out of its path');
assert.ok(debris.velocity.x>1,'Ball transfers momentum to fragments');
assert.ok(debrisGame.ball.velocity.x<6,'Fragments exert a reciprocal impulse');
Matter.Body.setStatic(debrisGame.ball,true);
for(let i=0;i<120*10;i++)debrisGame.step();
assert.ok(debrisGame.shards.includes(debris),'Fragments never expire');
assert.ok(!debris.isStatic,'Fragments keep their physics');
assert.ok(Matter.Detector.canCollide(debris.collisionFilter,debrisGame.walls[0].collisionFilter),'Fragments collide with walls');
assert.ok(Matter.Detector.canCollide(debris.collisionFilter,debris.collisionFilter),'Fragments collide with each other');
for(const settings of cases){const game=new CollapseArena(settings),start=Date.now();let peak=0;
  let lastBallRadius=0,lastShardCount=0;
  const breakBall=game.breakBall.bind(game);
  game.breakBall=()=>{const b=game.ball;assert.equal(sweepSpike(b.position,b.position,b.circleRadius+1e-6,game.spike.vertices),0,'Every break requires visible triangle contact');breakBall();};
  for(let i=0;i<120*240&&game.state==='running';i++){game.step();peak=Math.max(peak,game.shards.length);assert.ok(Number.isFinite(game.radius));
    if(game.phase==='arena'){
      assert.ok(game.shards.length>=lastShardCount,'Fragments never disappear during play');lastShardCount=game.shards.length;
      assert.ok(game.radius>=230-game.broken*.35-.001,'Arena contracts only slightly');
      if(game.ball){assert.ok(game.ball.circleRadius>=lastBallRadius-1e-6);lastBallRadius=game.ball.circleRadius;
        assert.ok(Math.hypot(game.ball.position.x-CX,game.ball.position.y-CY)+game.ball.circleRadius<=game.radius+1e-6,'Ball never crosses the visible circular wall');
        assert.equal(sweepSpike(game.ball.position,game.ball.position,game.ball.circleRadius,game.spike.vertices),Infinity,'A live ball never overlaps the triangle');
        for(const shard of game.shards)if(shard.collisionFilter.mask!==0)assert.equal(Matter.Detector.canCollide(game.ball.collisionFilter,shard.collisionFilter),true,'Ball physically pushes persistent debris');}
    }
  }
  assert.equal(game.state,'won',JSON.stringify(game.snapshot()));assert.ok(game.sparks.length>0);assert.equal(game.radius,0);
  console.log(JSON.stringify({settings,time:+game.time.toFixed(2),broken:game.broken,peak,ms:Date.now()-start}));
}
console.log('Collapse Arena: passed');
