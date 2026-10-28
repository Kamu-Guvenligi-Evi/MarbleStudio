import assert from 'node:assert/strict';
import {EscapeMultiply,normalizeEscape,ESCAPE_RING} from '../src/escape-multiply.js';
assert.equal(normalizeEscape(null).addition,3);
const g=new EscapeMultiply({gravity:0,rotation:0});
const b=g.balls[0],a=g.angle,d=ESCAPE_RING.r+g.settings.radius+1;
Object.assign(b,{x:ESCAPE_RING.x+Math.cos(a)*d,y:ESCAPE_RING.y+Math.sin(a)*d,vx:Math.cos(a)*100,vy:Math.sin(a)*100});
g.step();assert.equal(g.created,4);assert.equal(g.escaped,1);
for(const newborn of g.balls.filter(b=>!b.outside)){assert.equal(newborn.x,ESCAPE_RING.x);assert.equal(newborn.y,ESCAPE_RING.y);}
assert.equal(new Set(g.balls.filter(b=>!b.outside).map(b=>Math.atan2(b.vy,b.vx))).size,3,'births fan out from the common center');
g.step();assert.equal(g.created,4,'one escape cannot create twice');
const wall=new EscapeMultiply({gravity:0,rotation:0});Object.assign(wall.balls[0],{x:449,y:500,vx:100,vy:0});wall.step();assert.equal(wall.created,1);assert.ok(wall.balls[0].vx<0);
// A ball already passing the tip must not hit an imaginary inward wall.
for(const rotation of [-2,0,2]){
  const exit=new EscapeMultiply({gravity:0,rotation});
  const angle=exit.angle+exit.halfGap-.02,distance=184.8,ball=exit.balls[0];
  Object.assign(ball,{x:270+Math.cos(angle)*distance,y:500+Math.sin(angle)*distance,vx:Math.cos(angle)*100,vy:Math.sin(angle)*100});
  const before={...ball};exit.collideRing(ball);exit.separate();
  assert.equal(ball.x,before.x);assert.equal(ball.y,before.y);
  for(let i=0;i<6;i++)exit.step();
  assert.equal(ball.outside,true,'clear endpoint passage escapes without snapping inward');
  assert.equal(exit.escaped,1,'escape counted once');
}
const tip=new EscapeMultiply({gravity:0,rotation:0}),tipAngle=tip.angle+tip.halfGap;
const tipBall=tip.balls[0],tx=270+180*Math.cos(tipAngle),ty=500+180*Math.sin(tipAngle);
Object.assign(tipBall,{x:tx-4*Math.cos(tipAngle),y:ty-4*Math.sin(tipAngle),vx:100*Math.cos(tipAngle),vy:100*Math.sin(tipAngle)});
tip.collideRing(tipBall);
assert.ok(tipBall.vx*Math.cos(tipAngle)+tipBall.vy*Math.sin(tipAngle)<0,'real endpoint contact still bounces');
assert.ok(Math.hypot(tipBall.x-tx,tipBall.y-ty)>=5.8,'ball separated from rounded tip');
const pair=new EscapeMultiply({gravity:0});pair.balls=[{x:260,y:500,vx:100,vy:0,outside:false},{x:268,y:500,vx:-100,vy:0,outside:false}];pair.separate();assert.ok(Math.hypot(pair.balls[0].x-pair.balls[1].x,pair.balls[0].y-pair.balls[1].y)>=10);assert.ok(pair.balls[0].vx<0&&pair.balls[1].vx>0);
const run=s=>{const game=new EscapeMultiply(s);while(game.state==='running'&&game.time<240){game.step();assert.equal(game.created-game.escaped,game.balls.filter(b=>!b.outside).length,'inside count matches actual bodies');if(game.ticks%120===0)for(const b of game.balls)assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));}assert.equal(game.state,'finished');return game;};

const first=run(),second=run();
assert.deepEqual([first.created,first.escaped,first.time],[second.created,second.escaped,second.time]);
assert.equal(first.releaseReason,'full');assert.ok(first.releaseFill>=.97);
assert.equal(first.created,first.escaped);assert.equal(first.balls.length,0);
assert.ok(first.time>first.releaseAt+2);
const legacy=run({limit:100,duration:10});assert.ok(legacy.created>100);assert.equal(legacy.releaseReason,'full');
const sparse=new EscapeMultiply({gravity:0,rotation:0,duration:10,limit:100});
Object.assign(sparse.balls[0],{vx:0,vy:0});sparse.created=100;
for(let i=0;i<2400;i++)sparse.step();assert.equal(sparse.finalizing,false,'count and timeout cannot start a sparse finale');
const pile=new EscapeMultiply();pile.balls=[];
for(let y=500;y<675;y+=5)for(let x=100;x<440;x+=5)pile.balls.push({x,y,outside:false});
assert.ok(pile.measureFill()<.1,'dense bottom with empty top must not count as full');
console.log(JSON.stringify({deterministic:true,fullRingRequired:true,legacyLimitsIgnored:true,created:first.created,escaped:first.escaped,remaining:first.balls.length,releaseFill:first.releaseFill}));

// Final drainage preserves horizontal momentum without invisible screen walls.
const drain=new EscapeMultiply({gravity:0});drain.releaseAt=0;drain.ticks=240;drain.time=2;
drain.balls=[{x:270,y:500,vx:100,vy:0,outside:false},{x:537,y:700,vx:200,vy:0,outside:true}];
drain.step();assert.equal(drain.balls[0].vx,100);assert.equal(drain.balls[1].vx,200);
assert.ok(drain.balls[1].x>537);assert.equal(drain.balls[0].vy,drain.balls[1].vy);
while(drain.state==='running'&&drain.time<30)drain.step();assert.equal(drain.state,'finished','zero-gravity preset must still drain completely');

// The full-ring transition keeps the existing exit open from its first frame.
const flow=new EscapeMultiply();flow.opening=.18;flow.time=12;flow.ticks=1440;
const initialGap=flow.halfGap,initialAngle=flow.angle;flow.releaseAt=flow.time;
assert.equal(flow.bursting,true);assert.equal(flow.halfGap,initialGap);assert.equal(flow.angle,initialAngle);
const exit=initialAngle,distance=186;
flow.balls=[{x:270+Math.cos(exit)*distance,y:500+Math.sin(exit)*distance,vx:Math.cos(exit)*100,vy:Math.sin(exit)*100,outside:false}];
flow.step();assert.equal(flow.escaped,1,'a ball at the open exit leaves on the first finale frame');
let previous=flow.halfGap;for(let i=0;i<120;i++){flow.step();assert.ok(flow.halfGap>=previous,'exit never closes during transition');previous=flow.halfGap;}
console.log('Continuous finale exit: passed');
