import assert from 'node:assert/strict';
import {SpiralBreaker,WIDTH,COLS,ROWS,CELL,BALL_LIMIT,DRAIN_Y,SPIRAL_PATH} from '../src/spiral-breaker.js';

const game=new SpiralBreaker();
assert.ok(game.initialBlocks>8000);
assert.equal(game.balls.length,1);assert.equal(game.bonuses.length,0);
assert.equal(game.cells[Math.floor(530/CELL)*COLS+Math.floor(304/CELL)],0,'Entrance stays open.');
// Ordinary impacts must bounce without destroying any tiles.
game.automatic=false;Object.assign(game.ball,{x:100,y:554,vx:0,vy:-410});game.step(.05);
assert.equal(game.broken,0);assert.ok(game.ball.vy>0);
// The endpoint alone is insufficient without traversing the entrance and route.
Object.assign(game.ball,{x:195,y:202,vx:0,vy:0});game.step(1/120);
assert.equal(game.ball.armed,false);assert.equal(game.broken,0);
game.reset();game.automatic=false;
let firstDestroyed;game.onBreak=index=>{firstDestroyed??=index;};
for(const [i,[x,y]] of SPIRAL_PATH.entries()){
  Object.assign(game.ball,{x,y,vx:0,vy:0});game.step(1/120);
  assert.equal(game.ball.armed,i===SPIRAL_PATH.length-1);
  if(i<SPIRAL_PATH.length-1)assert.equal(game.broken,0);
}
const beforeUnderside=game.broken,buffsBeforeUnderside=game.bonuses.length;
Object.assign(game.ball,{x:100,y:554,vx:0,vy:-410});game.step(.05);
assert.equal(game.broken,beforeUnderside,'Even a route-completed ball cannot break the underside.');
assert.equal(game.bonuses.length,buffsBeforeUnderside);assert.ok(game.ball.vy>0);
Object.assign(game.ball,{x:220,y:202,vx:0,vy:-410});game.step(.05);
assert.ok(game.broken>beforeUnderside,'The completed ball can still break tiles from inside.');
const released=game.bonuses[0];
assert.ok(released&&released.y>0&&released.y<550,'A destroyed block releases the first buff inside the field.');
assert.equal(released.x,(firstDestroyed%COLS)*CELL+CELL/2,'The buff drops from the destroyed block.');
const unlocked=game.ball;
game.launch();const ordinary=game.balls[1],before=game.broken;
Object.assign(ordinary,{x:450,y:554,vx:0,vy:-410});
game.moveBall(ordinary,.02);
assert.equal(game.broken,before,'Finishing one ball does not unlock damage for another.');
assert.equal(unlocked.armed,true);assert.equal(ordinary.armed,false);
// Leaving the entrance before completion discards partial progress.
game.reset();Object.assign(game.ball,{x:304,y:570,routeIndex:3});game.step(1/120);assert.equal(game.ball.routeIndex,0);

// Falling buffs ignore balls and are consumed only by the paddle.
game.reset();game.automatic=false;
const buff=game.spawnBonus('multiply');assert.ok(buff.y<0);
buff.x=100;buff.y=600;Object.assign(game.ball,{x:100,y:600,vx:0,vy:0});game.step(.05);
assert.equal(game.balls.length,1);assert.ok(buff.y>600);assert.equal(buff.collected,false);
buff.x=game.paddle.x;buff.y=game.paddle.y-17;game.step(.05);
assert.equal(game.balls.length,3);assert.equal(game.bonuses.length,0);
game.collectBonus(buff);assert.equal(game.balls.length,3,'Consumed buff is single-use.');
assert.ok(game.balls.every(b=>!b.armed&&b.routeIndex===0),'Clones must complete their own route.');
const missed=game.spawnBonus('multiply');missed.x=15;missed.y=game.paddle.y-17;game.step(.05);
assert.equal(missed.collected,false);assert.equal(game.balls.length,3);
missed.y=980;game.step(.05);assert.ok(!game.bonuses.includes(missed));
game.collectBonus(game.spawnBonus('add'));assert.equal(game.balls.length,6);
game.collectBonus(game.spawnBonus('wide'));assert.equal(game.paddle.width,150);
game.collectBonus(game.spawnBonus('shrink'));assert.equal(game.paddle.width,124);
for(let i=0;i<10;i++)game.collectBonus(game.spawnBonus('multiply'));
assert.equal(game.balls.length,BALL_LIMIT);

// Missing the paddle removes that ball permanently, including armed balls.
for(const armed of [false,true]){
  game.reset();game.automatic=false;
  const missedBall=game.ball;
  Object.assign(missedBall,{x:20,y:DRAIN_Y-5,vx:0,vy:410,armed});
  game.launch();const survivor=game.balls[1];Object.assign(survivor,{vx:0,vy:0});
  game.step(.1);
  assert.ok(missedBall.vy>0&&missedBall.y>DRAIN_Y,'No floor bounce');
  assert.deepEqual(game.balls,[survivor]);assert.equal(game.state,'running');
  Object.assign(survivor,{y:DRAIN_Y+2,vy:410});game.step(.1);
  assert.equal(game.balls.length,0);assert.equal(game.state,'lost');
  const stoppedTime=game.time;game.step(.1);
  assert.equal(game.time,stoppedTime);assert.equal(game.balls.length,0,'No automatic respawn');
}
game.reset();game.automatic=false;
Object.assign(game.ball,{x:game.paddle.x,y:game.paddle.y-5,vx:0,vy:410});game.step(.05);
assert.ok(game.ball.vy<0);assert.equal(game.balls.length,1,'Paddle still returns a caught ball');

// A distant buff must never pull the automatic paddle away from an arriving ball.
game.reset();game.movePaddle(80);
Object.assign(game.ball,{x:80,y:650,vx:0,vy:410});
game.spawnBonus('multiply',450,690);
for(let i=0;i<24;i++)game.step(1/120);
assert.equal(game.returns,1);assert.ok(game.ball.vy<0);
assert.equal(game.bonusCount,0,'Saving the ball takes priority over the buff');
const entranceX=game.ball.x+game.ball.vx*(ROWS*CELL+game.ball.radius-game.ball.y)/game.ball.vy;
assert.ok(Math.abs(entranceX-game.path[0][0])<=6,'Caught ball is aimed through the opening');
// Side-wall reflections and a paddle starting on the opposite side are catchable.
for(const x of [20,520]){
  game.reset();game.movePaddle(WIDTH-x);
  Object.assign(game.ball,{x,y:560,vx:x<WIDTH/2?-240:240,vy:330});
  for(let i=0;i<90&&!game.returns;i++)game.step(1/120);
  assert.equal(game.returns,1);assert.ok(game.ball.vy<0);
}

game.reset();let firstBreak=null,peakBalls=1;
for(let i=0;i<60*60;i++){
  const brokenBefore=game.broken,canBreak=game.balls.some(b=>b.armed);
  game.step(1/60);
  peakBalls=Math.max(peakBalls,game.balls.length);
  if(game.broken&&firstBreak===null){firstBreak=game.time;assert.ok(game.balls.some(b=>b.armed));}
  if(!game.broken){assert.equal(game.bonuses.length,0);assert.equal(game.balls.length,1);}
  if(!canBreak&&!game.balls.some(b=>b.armed))assert.equal(game.broken,brokenBefore);
  assert.ok(game.balls.length<=BALL_LIMIT);
}
assert.ok(firstBreak>0&&firstBreak<60,'A single ball completes the route before multiplication.');
assert.ok(game.broken>30);assert.ok(peakBalls>1);assert.ok(game.returns>0);
for(const b of game.balls)assert.ok(Number.isFinite(b.x)&&Number.isFinite(b.y)&&b.x>=0&&b.x<=WIDTH&&b.y-b.radius<=DRAIN_Y);
assert.equal(game.cells.reduce((n,v)=>n+Number(v>0),0),game.initialBlocks-game.broken);
assert.equal(game.state,'running');assert.ok(game.balls.length>1,'Automatic catches keep the game alive.');
game.reset();game.state='paused';const frozen=JSON.stringify({balls:game.balls,buffs:game.bonuses});game.step(.1);
assert.equal(JSON.stringify({balls:game.balls,buffs:game.bonuses}),frozen);
console.log(`PASS: route-gated destruction (first break ${firstBreak.toFixed(1)}s), falling buffs, paddle catches, permanent ball loss, game over and pause.`);
// A valid hit on the last remaining tile still completes a level.
game.reset();game.automatic=false;game.cells.fill(0);game.cells[20*COLS+20]=1;game.initialBlocks=1;
Object.assign(game.ball,{x:102.5,y:110,vx:0,vy:-410,armed:true});game.step(.05);
assert.equal(game.broken,game.initialBlocks);
assert.equal(game.state,'won');game.reset();assert.equal(game.broken,0);assert.equal(game.balls.length,1);
