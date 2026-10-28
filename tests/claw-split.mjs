import assert from 'node:assert/strict';
import {ClawSplit,normalizeClaw,CLAW_RING} from '../src/claw-split.js';
assert.equal(normalizeClaw(null).radius,5);assert.equal(normalizeClaw().count,1);assert.equal(normalizeClaw().limit,20000);
const reference=new ClawSplit();
for(const time of [0,.5,1,2,10]){
 const [left,right]=reference.claws(time);
 const radial=p=>Math.hypot(p.x-CLAW_RING.x,p.y-CLAW_RING.y);
 assert.ok(Math.abs(radial(left[0])-CLAW_RING.r)<1e-8,'one hook endpoint attaches to the rim');
 assert.ok(Math.abs(radial(left[2])-(CLAW_RING.r-68))<1e-8,'free tip reaches inward instead of returning to rim');
 assert.ok(radial(left[1])<CLAW_RING.r-20,'elbow is inside the arena');
 for(let i=0;i<3;i++){assert.ok(Math.abs(left[i].x+right[i].x-2*CLAW_RING.x)<1e-8);assert.ok(Math.abs(left[i].y-right[i].y)<1e-8);}
 const middle={x:(left[1].x+left[2].x)/2,y:(left[1].y+left[2].y)/2};assert.ok(reference.hit(middle,[left]),'free arm participates in collisions');
}
const g=new ClawSplit({count:1,gravity:0,acceleration:0,rpm:1});
const tip=g.claws()[0][1];Object.assign(g.balls[0],tip,{vx:0,vy:0});g.step();assert.equal(g.balls.length,1,'touching a hook must not split');assert.equal(g.splits,0);assert.ok(Math.hypot(g.balls[0].x-tip.x,g.balls[0].y-tip.y)>1,'solid moving hook displaces the ball');
const capture=new ClawSplit({count:1,gravity:0});
while(!capture.pocket()||capture.pocket().clearance<=10){capture.ticks++;capture.time=capture.ticks/120;}
const pocket=capture.pocket();assert.ok(pocket&&pocket.clearance>10);
Object.assign(capture.balls[0],{x:pocket.x,y:pocket.y,vx:0,vy:0});
capture.step();assert.equal(capture.balls[0].trapped,true);assert.equal(capture.splits,0,'enclosure alone does not split until the pocket shrinks');
while(capture.splits===0&&capture.time<10)capture.step();
assert.ok(capture.balls.every(b=>b.vy>0),'all fragments launch downward');assert.equal(capture.splits,1,'closing pocket crushes the trapped ball');assert.equal(capture.balls.length,2);assert.ok(Math.hypot(capture.balls[0].x-capture.balls[1].x,capture.balls[0].y-capture.balls[1].y)>capture.settings.radius*2,'siblings leave from separate positions');assert.notEqual(capture.balls[0].vx,-capture.balls[1].vx,'release is not a mirrored repeating orbit');
for(let i=0;i<10;i++)capture.step();assert.equal(capture.splits,1,'fragments escape without repeat splitting');
const outside=new ClawSplit({count:1,gravity:0});outside.ticks=145;outside.time=145/120;Object.assign(outside.balls[0],{x:270,y:485,vx:0,vy:0});while(outside.time<1.5)outside.step();assert.equal(outside.splits,0,'closing empty hooks do not split a ball outside');
const wall=new ClawSplit({count:1,gravity:0});Object.assign(wall.balls[0],{x:499,y:485,vx:100,vy:0});wall.step();assert.ok(wall.balls[0].vx<0);
const run=()=>{const game=new ClawSplit();for(let i=0;i<120*240&&game.state!=='finished';i++)game.step();assert.equal(game.state,'finished',JSON.stringify({time:game.time,fill:game.fill,count:game.balls.length,fullSince:game.fullSince}));return game;};const a=run(),b=run();assert.deepEqual(a.balls,b.balls);assert.equal(a.balls.length,a.settings.count+a.splits);assert.ok(a.fill>=.80);assert.ok(a.balls.length>1000);assert.ok(a.finalTime>=4);assert.ok(a.time>=58.9);assert.ok(a.time-a.fullSince>=19.9);assert.ok(a.balls.length<=a.settings.limit);assert.ok(a.rpm>a.settings.rpm);
for(const ball of a.balls){assert.ok([ball.x,ball.y,ball.vx,ball.vy].every(Number.isFinite));assert.ok(Math.hypot(ball.x-270,ball.y-485)<=CLAW_RING.r);}
console.log(JSON.stringify({deterministic:true,touchDoesNotSplit:true,enclosure:true,crushSplit:true,fragmentRelease:true,reflection:true,contained:true,finalBalls:a.balls.length,rpm:a.rpm}));

// Dense scenes retain finite, contained motion and bounded effects.
for(const count of [600,1700]){
 const dense=new ClawSplit({limit:count,duration:180,rpm:72});
 dense.balls=Array.from({length:count},(_,i)=>{const a=i*2.3999632297,r=210*Math.sqrt((i+.5)/count);return {x:270+Math.cos(a)*r,y:485+Math.sin(a)*r,vx:Math.cos(a)*200,vy:Math.sin(a)*200,cooldown:0,trapped:false,capture:null};});
 for(let i=0;i<180;i++)dense.step();
 assert.equal(dense.radius,dense.settings.radius);assert.equal(dense.balls.length,count);assert.ok(dense.particles.length<=90);
 for(const ball of dense.balls){assert.ok([ball.x,ball.y,ball.vx,ball.vy].every(Number.isFinite));assert.ok(Math.hypot(ball.x-270,ball.y-485)<=CLAW_RING.r-dense.radius+1e-6);}
}
const rotation=new ClawSplit();for(const time of [1,30,180]){const delta=.00001,rate=(rotation.rotation(time+delta).turn-rotation.rotation(time).turn)/delta;assert.ok(Math.abs(rate-rotation.rotation(time).rpm*Math.PI/30)<.00001);assert.ok(rotation.rotation(time).rpm<=30);}
const timed=new ClawSplit({duration:10});for(let i=0;i<1200;i++)timed.step();assert.equal(timed.state,'running','time limit cannot end an unfilled arena');
assert.ok(Math.hypot(capture.balls[1].x-270,capture.balls[1].y-485)<70,'new fragment starts in the center');
const pair=new ClawSplit({gravity:0});pair.balls=[{x:264,y:485,vx:100,vy:0,trapped:false},{x:272,y:485,vx:-100,vy:0,trapped:false}];pair.separateBalls();assert.ok(pair.balls[0].vx<0&&pair.balls[1].vx>0,'collision exchanges momentum');assert.ok(pair.balls[1].x-pair.balls[0].x>9.9,'overlapping balls separate');
const free=new ClawSplit({gravity:0});Object.assign(free.balls[0],{x:270,y:485,vx:10,vy:20});free.step();assert.equal(free.balls[0].vx,10);assert.equal(free.balls[0].vy,20,'no artificial orbit force');
let overlaps=0;for(let i=0;i<a.balls.length;i++)for(let j=i+1;j<a.balls.length;j++){if(Math.hypot(a.balls[i].x-a.balls[j].x,a.balls[i].y-a.balls[j].y)<a.radius*1.6)overlaps++;}assert.ok(overlaps<a.balls.length*.12,'filled scene must not be an overlapping pile');
assert.ok(a.balls.length<=a.capacity);console.log('Physical packing, pair collisions, free motion and rotation continuity passed', {overlaps,capacity:a.capacity,fill:a.fill,time:a.time});
