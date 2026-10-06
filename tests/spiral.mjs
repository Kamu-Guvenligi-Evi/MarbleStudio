import assert from 'node:assert/strict';
import {Spiral,spiralPoint,spiralLength,SPIRAL,gateDistance,gatePoint} from '../src/spiral.js';
import {SpiralIce} from '../src/spiral-ice.js';
import {normalizeProject} from '../src/projects.js';

for(const seed of [1,2048,999999]){
  const race=new Spiral({seed});
  assert.deepEqual(race.balls[0].body.position,{x:515,y:276});
  assert.equal(race.multiplier,2);assert.equal(race.progress,0);
  race.step();assert.equal(race.time,0);
  race.start();let previous=race.progress,emptyFrames=0,peak=0;
  for(let i=0;i<120*180&&race.state==='running';i++){
    race.step();assert.ok(race.progress>=previous);previous=race.progress;
    assert.ok(race.balls.length<=SPIRAL.limit);
    peak=Math.max(peak,race.balls.length);
    if(!race.balls.length&&race.state==='running')emptyFrames++;
    assert.equal(race.totalConsumed,race.totalBreaks);
    assert.equal(race.nextBallId,race.totalConsumed+race.balls.length);
    for(const ball of race.balls){assert.ok(Number.isFinite(ball.body.position.x));assert.ok(ball.distance>=0&&ball.distance<=spiralLength);}
  }
  assert.equal(race.state,'finished');assert.equal(race.progress,1);
  assert.ok(peak>=20&&emptyFrames>0&&race.round>2,'Groups must deplete and be replenished from outside.');
  const time=race.time;race.step();assert.equal(race.time,time);
  const replay=new Spiral({seed});replay.start();replay.step(time*1000);
  assert.equal(replay.balls.length,race.balls.length);assert.equal(replay.totalBreaks,race.totalBreaks);
}
// A hit removes the ball immediately; the empty interval precedes an outside drop.
const lifecycle=new Spiral();lifecycle.start();
while(lifecycle.totalConsumed===0)lifecycle.step();
assert.equal(lifecycle.balls.length,0);assert.equal(lifecycle.multiplier,2);
assert.equal(lifecycle.round,1);const ice=lifecycle.cleared;
lifecycle.step(1000/240);assert.equal(lifecycle.balls.length,0);
while(!lifecycle.balls.length)lifecycle.step();
assert.equal(lifecycle.round,2);assert.equal(lifecycle.cleared,ice);
assert.ok(lifecycle.balls[0].airborne);assert.equal(lifecycle.balls[0].body.position.x,515);
assert.ok(lifecycle.balls[0].body.position.y<290);
// Touching x2 creates one group; its queued members cannot trigger early respawn.
const group=new Spiral();
for(let s=gateDistance-60;s<gateDistance+100;s+=10)group.ice.chip(spiralPoint(s),()=>.5,2);
Object.assign(group.balls[0],{airborne:false,distance:gateDistance-30,release:0});
group.balls[0].body.position=spiralPoint(gateDistance-30);group.start();
while(group.multiplier===2)group.step();
assert.equal(group.balls.length,2);assert.equal(group.multiplier,3);
assert.ok(group.balls.some(b=>b.release>group.time));
while(group.totalConsumed===0)group.step();
assert.equal(group.balls.length,1);assert.equal(group.respawnAt,null);assert.equal(group.multiplier,3);
// Removing the last ice ends the simulation instead of scheduling another drop.
const ending=new Spiral();ending.ice.clear();
Object.assign(ending.balls[0],{airborne:false,multiplied:true,distance:spiralLength-12,velocity:800});
ending.balls[0].body.position=spiralPoint(spiralLength-12);
ending.start();ending.step(50);assert.equal(ending.state,'finished');
assert.equal(ending.respawnAt,null);const finalCount=ending.nextBallId;
ending.step(2000);assert.equal(ending.nextBallId,finalCount);
// A local impact preserves distant ice and produces a polygonal fracture.
const iceField=new SpiralIce(),before=iceField.remaining;
const contact=iceField.contact(275,716,10);assert.ok(contact);
iceField.chip(contact,()=>.5);
assert.ok(iceField.remaining<before&&iceField.remaining>before*.98);
assert.ok(iceField.contact(270,485,5));assert.equal(iceField.cuts[0].length,16);
// Colours belong to each ball; speed follows height in the channel.
const motion=new Spiral();motion.ice.clear();motion.start();
motion.balls[0].multiplied=true;motion.balls[0].airborne=false;motion.balls[0].release=0;
motion.balls[0].distance=gateDistance;motion.balls[0].body.position=spiralPoint(gateDistance);
const hue=motion.balls[0].hue;motion.step();const bottomSpeed=motion.balls[0].velocity;
motion.balls[0].distance=1100;motion.balls[0].body.position=spiralPoint(1100);motion.step();
assert.ok(motion.balls[0].velocity<bottomSpeed);assert.equal(motion.balls[0].hue,hue);
assert.deepEqual(spiralPoint(-20),spiralPoint(0));
assert.deepEqual(spiralPoint(spiralLength+20),spiralPoint(spiralLength));
assert.equal(normalizeProject({mode:'spiral',count:1,sequence:[]}).count,1);
assert.throws(()=>normalizeProject({mode:'track',count:1,sequence:[]}));
assert.throws(()=>normalizeProject({mode:'spiral',count:-1,sequence:[]}));
console.log('PASS: consume-on-impact, empty interval, external respawn, multiplied groups, completion and deterministic replay.');
