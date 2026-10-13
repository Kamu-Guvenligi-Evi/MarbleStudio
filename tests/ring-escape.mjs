import assert from 'node:assert/strict';
import {RingEscape,normalizeRing,FLOW_PRESETS,angleDifference} from '../src/ring-escape.js';
const legacy={layout:'aligned',count:28,duration:30,seed:92};

const wall=new RingEscape(legacy);
Object.assign(wall.ball,{x:270-33,y:452,vx:-180,vy:0});
wall.step(1/240);
assert.equal(wall.broken,0,'a solid wall must not break');
assert.ok(wall.ball.vx>0,'solid walls reflect the marble');

const gate=new RingEscape(legacy),angle=gate.rings[0].angle;
Object.assign(gate.ball,{x:270+44*Math.cos(angle),y:452+44*Math.sin(angle),vx:100*Math.cos(angle),vy:100*Math.sin(angle)});
gate.step(1/240);
assert.equal(gate.broken,1,'only the fully crossed ring breaks');
assert.equal(gate.rings[0].id,1);
const outer=gate.rings[0];
Object.assign(gate.ball,{x:270-outer.r+4,y:452,vx:-180,vy:0});
gate.step(1/240);
assert.equal(gate.broken,1,'the next solid ring still holds the marble');
assert.ok(gate.ball.vx>0);

function run(options,dt=1/120){
  const game=new RingEscape(options),events=[];let minY=game.ball.y,maxY=minY,maxRadius=0;
  game.onEvent=e=>events.push(e);
  while(game.state==='running'){
    game.step(dt);minY=Math.min(minY,game.ball.y);maxY=Math.max(maxY,game.ball.y);
    maxRadius=Math.max(maxRadius,Math.hypot(game.ball.x-game.cx,game.ball.y-game.cy));
  }
  return {game,events,verticalTravel:maxY-minY,maxRadius};
}
const {game,events}=run(legacy);
assert.equal(game.state,'won');assert.equal(game.broken,28);
assert.ok(game.time>28&&game.time<30,'default trajectory finishes near the countdown');
assert.equal(events.filter(e=>e.type==='break').length,28);
assert.equal(events.filter(e=>e.type==='win').length,1);
assert.ok(events.some(e=>e.type==='hit'));
assert.ok(game.particles.length<=1400);
const time=game.time;game.step(.1);assert.equal(game.time,time);
const noParticles=run({...legacy,particles:false},1/60).game;
assert.ok(Math.abs(time-noParticles.time)<.001,'render options and frame rate do not change physics');
for(const layout of ['aligned','twist','alternating']){
  const result=run({...legacy,seed:1,layout}).game;
  assert.ok(Number.isFinite(result.ball.x)&&Number.isFinite(result.ball.y));
  assert.equal(result.broken+result.remaining,28);
  if(result.state==='timeout')assert.ok(result.remaining>0,'timeout does not force rings to break');
}
const normalized=normalizeRing({count:9000,speed:99,ring:'bad',music:'bad',seed:NaN});
assert.equal(normalized.count,5000);assert.equal(normalized.speed,2);assert.equal(normalized.ring,'#79e9bb');assert.equal(normalized.music,'reference');assert.equal(normalized.seed,24);
const falling=new RingEscape();Object.assign(falling.ball,{x:falling.cx,y:falling.cy,vx:100,vy:0});
falling.broken=20;const initialX=falling.ball.x;
falling.step(1/60);
assert.ok(falling.ball.x>initialX,'feeding rings must not pull the marble back to the center');
assert.ok(falling.ball.vy>0&&falling.ball.y>falling.cy,'gravity visibly accelerates free flight downwards');
for(const [layout,preset] of Object.entries(FLOW_PRESETS)){
  const crossing=new RingEscape({...preset,layout});
  const opening=crossing.rings[0],a=opening.angle;
  Object.assign(crossing.ball,{x:crossing.cx+Math.cos(a)*(opening.r-.1),y:crossing.cy+Math.sin(a)*(opening.r-.1),vx:Math.cos(a)*200,vy:Math.sin(a)*200});
  let firstCrossing=null;crossing.onEvent=e=>{if(e.type==='break'&&!firstCrossing)firstCrossing={time:e.time,radius:Math.hypot(e.x-crossing.cx,e.y-crossing.cy)};};
  crossing.step(1/240);
  assert.ok(firstCrossing,'a center crossing breaks the opening in the same physics step');
  assert.ok(firstCrossing.radius>opening.r&&firstCrossing.radius<opening.r+crossing.ball.r,'do not wait for the trailing edge of the ball');
  assert.equal(firstCrossing.time,1/240);
  assert.ok(!crossing.rings.includes(opening),'the crossed opening is removed immediately');
  const continuous=new RingEscape({...preset,layout});
  assert.ok(continuous.inner<=50,'the starting central opening stays compact');
  assert.ok(continuous.rings.every((r,i)=>!i||Math.abs(angleDifference(r.baseAngle,continuous.rings[i-1].baseAngle))<.02),'neighboring openings never jump at group boundaries');
  continuous.time=3;continuous.step(1/240);
  continuous.breakRing(continuous.rings[0]);
  const survivor=continuous.rings[0],before={...survivor};
  continuous.step(1/240);
  assert.equal(survivor.gap,before.gap,'breaking does not close or resize the next opening');
  assert.ok(Math.abs(angleDifference(survivor.angle,before.angle))<1.25/240,'the next opening keeps rotating continuously');
  assert.ok(before.r-survivor.r<=24/240+1e-8,'a break cannot snap the next ring inward');
  const closed=new RingEscape({...preset,layout});
  assert.ok(Math.hypot(closed.ball.x-closed.cx,closed.ball.y-closed.cy)<10,'ball starts in the center');
  Object.assign(closed.ball,{x:closed.cx-closed.inner+closed.ball.r,y:closed.cy,vx:-245,vy:0});
  closed.step(1/240);
  assert.equal(closed.broken,0,'new flows retain solid walls');
  assert.ok(closed.ball.vx>0,'new flows bounce off closed walls');
  const options={...preset,layout},result=run(options),times=result.events.filter(e=>e.type==='break').map(e=>e.time);
  assert.equal(result.game.state,'won',layout+' completes');
  assert.equal(times.length,preset.count);
  assert.ok(result.verticalTravel>result.game.inner*1.5,layout+' marble visibly falls and rebounds across the smaller arena');
  assert.ok(result.maxRadius<240,layout+' marble stays in the viewing area');
  assert.ok(result.game.hits>=10,layout+' still escapes by bouncing');
  assert.equal(result.game.flowPoint,undefined,'no scripted marble route');
  assert.ok(times[0]<2,layout+' starts quickly');
  assert.ok(Math.max(...times.slice(1).map((t,i)=>t-times[i]))<4,layout+' avoids long lulls');
  assert.ok(result.game.time>7&&result.game.time<preset.duration,layout+' sustains a full sequence');
  assert.ok(result.game.bestCombo>=12,layout+' creates satisfying chains');
  assert.equal(run({...options,particles:false},1/60).game.time,result.game.time,'visual effects do not affect trajectory');
  for(const seed of [1,6,42,92]){
    const g=new RingEscape({...options,seed,count:800,particles:false}),rings=[...g.rings];let breaks=0;
    g.onEvent=e=>{if(e.type!=='break')return;const ring=rings[breaks++],dx=g.ball.x-g.cx,dy=g.ball.y-g.cy;
      assert.ok(Math.hypot(dx,dy)>ring.r,'the center must cross the ring through its opening');
      assert.ok(g.inGap(ring,Math.atan2(dy,dx),Math.asin(Math.min(.95,(g.ball.r+1)/ring.r))),'must cross its opening');
    };
    while(g.state==='running'){g.step(1/120);assert.ok(Number.isFinite(g.ball.x)&&Number.isFinite(g.ball.y));assert.equal(g.broken+g.remaining,800);assert.ok(g.rings.every(r=>r.gap<=1.3),'openings stay below 75 degrees');}
    assert.equal(breaks,g.broken);assert.ok(g.ripples.length<=10);
  }
}
console.log('PASS: solid walls, gate-only breaks, next-ring containment, deterministic finish, timeout and normalization.');
const dense=new RingEscape({count:5000,duration:90,particles:false});
while(dense.state==='running'){
  dense.step(1/60);assert.equal(dense.broken+dense.remaining,5000);
  assert.ok(Number.isFinite(dense.ball.x)&&Number.isFinite(dense.ball.y));
  if(dense.remaining>500)assert.ok(dense.rings.filter(r=>r.r<=247).length>=300,'dense tunnel stays filled as it feeds inward');
}
console.log('PASS: falling/rebounding motion, marble visibility and 5,000-ring capacity.');
