import assert from 'node:assert/strict';
import {GlassBreaker,CX,CY,ARENA_RADIUS,BALL_LIMIT,BALL_RADIUS,DROP_X,DROP_Y,GRAVITY,WALL} from '../src/glass-breaker.js';
let firstImpact;
const falling=new GlassBreaker({onImpact:hit=>firstImpact??=hit});falling.automatic=false;
assert.deepEqual([falling.balls[0].x,falling.balls[0].y,falling.balls[0].vx,falling.balls[0].vy],[DROP_X,DROP_Y,0,0]);
falling.step(.25);
assert.equal(falling.balls[0].x,DROP_X,'Release is vertical');
assert.ok(Math.abs(falling.balls[0].y-(DROP_Y+.5*GRAVITY*.25**2))<1e-7,'Release obeys gravity');
assert.equal(falling.broken,0);
while(falling.time<1.3)falling.step(1/240);
assert.ok(falling.balls[0].y>CY+150,'Marble first follows the lower outside channel');
assert.equal(falling.broken,0,'Lower glass cannot be hit through the channel wall');
while(!firstImpact&&falling.time<4)falling.step(1/240);
assert.ok(firstImpact.x<CX-150&&firstImpact.y<CY+10,'First contact is the left entrance');
assert.ok(falling.time>2&&falling.time<2.7,'Reference first descent takes about 2.5 seconds');
assert.equal(falling.balls.length,0,'A marble is consumed on glass impact');
assert.ok(falling.broken>0&&falling.shards.length>0);
for(let i=0;i<600;i++)falling.step(1/120);
assert.equal(falling.wave,1,'Automatic toggle disables subsequent batches');
falling.spawnBall();assert.deepEqual([falling.balls[0].x,falling.balls[0].y],[DROP_X,DROP_Y]);
console.log('PASS: vertical drop, outside channel, left entrance, consumed marble and manual mode.');
const game=new GlassBreaker({seed:42});
assert.ok(game.cells.length>700&&game.cells.every(c=>c.poly.length===3),'Actual triangular glass facets');
const outer=ARENA_RADIUS-5*Math.PI,inner=ARENA_RADIUS-15*Math.PI;
const expectedArea=(outer**3-inner**3)/30;
assert.ok(Math.abs(game.totalArea-expectedArea)/expectedArea<.002,'Facets cover the spiral-shaped pane without gaps');
assert.ok(WALL[0].x>WALL.at(-1).x&&WALL.length>300);
const geometry=JSON.stringify(game.cells.map(c=>c.poly));
let lastProgress=0,lastWave=1;const waves=[1];
for(let i=0;i<120*100&&game.state==='running';i++){
  game.step(1/120);
  if(game.wave!==lastWave){waves.push(game.wave);lastWave=game.wave;}
  if(i%120===0){
    assert.ok(game.progress>=lastProgress&&game.progress<=1);lastProgress=game.progress;
    assert.ok(game.shards.length<=180&&game.balls.length<=BALL_LIMIT);
    for(const b of game.balls)assert.ok(Number.isFinite(b.x+b.y+b.vx+b.vy));
  }
}
assert.deepEqual(waves.slice(0,5),[1,2,5,10,15]);
assert.ok(game.progress>.5,'Successive attempts open a substantial part of the glass');
assert.equal(game.broken,game.cells.filter(c=>c.broken).length);
if(game.state==='won'){assert.equal(game.broken,game.cells.length);assert.equal(game.balls.length,0);assert.equal(game.shards.length,0);}
game.reset(42);assert.equal(JSON.stringify(game.cells.map(c=>c.poly)),geometry);assert.equal(game.broken,0);assert.equal(game.wave,1);
const time=game.time;game.state='paused';game.step(.5);assert.equal(game.time,time);
game.reset(43);assert.notEqual(JSON.stringify(game.cells.map(c=>c.poly)),geometry);
while(game.balls.length<BALL_LIMIT)assert.ok(game.spawnBall());assert.equal(game.spawnBall(),false);
for(let i=0;i<game.balls.length;i++)for(let j=i+1;j<game.balls.length;j++)assert.ok(Math.hypot(game.balls[i].x-game.balls[j].x,game.balls[i].y-game.balls[j].y)>=BALL_RADIUS*2);
console.log('PASS: spiral glass coverage, 1/2/5/10/15 batches, persistent fractures, bounded physics, pause, seeded reset and drop queue.');
const waiting=new GlassBreaker();waiting.time=6;const survivor=waiting.balls[0];
waiting.step(1/240);
assert.equal(waiting.wave,1,'A gap between impacts cannot end an active batch');
assert.equal(waiting.balls[0],survivor,'The existing marble must survive the former timeout');
waiting.nextWaveAt=waiting.time;waiting.step(1/240);
assert.equal(waiting.balls[0],survivor,'A stale wave timer cannot replace an active marble');
waiting.startNextWave();assert.equal(waiting.wave,1,'Direct batch advancement must also wait for marbles');
const queued=new GlassBreaker();queued.automatic=false;queued.balls[0].y=DROP_Y-1000;
queued.step(.5);assert.equal(queued.balls[0].age,0,'Waiting above the release point must not age an attempt');
assert.equal(queued.balls[0].opacity,1,'An incoming queued marble must remain fully visible');
const finishing=new GlassBreaker();
for(const cell of finishing.cells)finishing.breakCell(cell,finishing.balls[0]);
assert.equal(finishing.state,'running','Breaking the last facet must not freeze remaining marbles');
assert.equal(finishing.progress,1);
let sawFade=false;
while(finishing.state==='running'&&finishing.time<40){
  finishing.step(1/240);
  if(finishing.balls.some(b=>b.opacity<1&&b.opacity>0))sawFade=true;
}
assert.ok(sawFade,'A missed marble must visibly finish before removal');
assert.equal(finishing.state,'won','An empty pane must finish after its last marble completes its path');
assert.ok(finishing.time<10,'An empty pane must not wait for prolonged settling');
assert.equal(finishing.balls.length,0);assert.equal(finishing.shards.length,0);assert.equal(finishing.wave,1);
const effects=new GlassBreaker();effects.balls=[];
for(const cell of effects.cells)effects.breakCell(cell,{vx:0,vy:0});
effects.step(.1);assert.equal(effects.state,'running','Final debris must finish before the completion overlay');
effects.step(.5);assert.equal(effects.state,'won');
console.log('PASS: no premature batch replacement, surviving final marbles, visible settling and final debris completion.');
for(const seed of [42,43,7961]){
  const complete=new GlassBreaker({seed});
  while(complete.state==='running'&&complete.time<240){
    const wave=complete.wave,active=complete.balls.length;complete.step(1/120);
    if(complete.wave!==wave)assert.equal(active,0,'Every batch must drain before the next batch appears');
  }
  assert.equal(complete.state,'won',`Crowded marbles must finish for seed ${seed}`);
  assert.ok(complete.time<70,`Normal-speed play must finish promptly for seed ${seed}: ${complete.time}s`);
  assert.equal(complete.balls.length,0);assert.equal(complete.shards.length,0);
}
console.log('PASS: three complete seeded games drain every batch and finish without active marbles.');
