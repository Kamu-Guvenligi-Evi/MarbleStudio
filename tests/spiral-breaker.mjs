import assert from 'node:assert/strict';
import {SpiralBreaker,WIDTH,COLS,ROWS,CELL,BALL_LIMIT,DRAIN_Y,WALL} from '../src/spiral-breaker.js';
const game=new SpiralBreaker();
assert.ok(game.initialBlocks>6000);
assert.equal(game.balls.length,1);assert.equal(game.bonuses.length,0);
// Gray walls reflect from every side; colored material breaks on contact.
for(const type of [WALL,2,3,4])for(const [x,y,vx,vy] of [[102.5,110,0,-410],[102.5,95,0,410],[95,102.5,410,0],[110,102.5,-410,0]]){
  game.reset();game.automatic=false;game.cells.fill(0);game.cells[20*COLS+20]=type;
  Object.assign(game.ball,{x,y,vx,vy});
  game.step(1/120);
  const destroyed=Number(type!==WALL);
  assert.equal(game.broken,destroyed,'Only colored material breaks');
  assert.equal(game.cells[20*COLS+20],destroyed?0:WALL);
  assert.equal(game.bonuses.length,destroyed,'Only destruction drops a buff');
  assert.ok(game.ball.vx*vx+game.ball.vy*vy<0,'Ball reflects away from impact');
  game.breakCell(20*COLS+20);assert.equal(game.broken,destroyed,'No duplicate score or wall removal');
}
// Clearing the bottom row leaves open space, never an invisible entrance wall.
// A ball fits through a 15px hole, but cannot tunnel through a 5px slit.
for(const gapRows of [3,1]){
  game.reset();game.automatic=false;game.cells.fill(0);
  for(let row=10;row<32;row++)for(let col=20;col<22;col++){
    if(row<21||row>=21+gapRows)game.cells[row*COLS+col]=WALL;
  }
  const y=(21+gapRows/2)*CELL,target=Math.floor(y/CELL)*COLS+25;
  game.cells[target]=3;
  Object.assign(game.ball,{x:90,y,vx:410,vy:0});game.step(.1);
  assert.equal(game.broken,gapRows===3?1:0,'Passage must fit the physical ball');
  assert.equal(game.cells[20*COLS+20],WALL,'Entering a hole does not damage its rim');
}
game.reset();game.automatic=false;game.cells.fill(0);
Object.assign(game.ball,{x:100,y:554,vx:0,vy:-410});game.step(.05);
assert.ok(game.ball.y<ROWS*CELL&&game.ball.vy<0);assert.equal(game.hits,0);

// Falling buffs ignore balls and are consumed only by the paddle.
game.reset();game.automatic=false;
const buff=game.spawnBonus('multiply');assert.ok(buff.y<0);
buff.x=100;buff.y=600;Object.assign(game.ball,{x:100,y:600,vx:0,vy:0});game.step(.05);
assert.equal(game.balls.length,1);assert.ok(buff.y>600);assert.equal(buff.collected,false);
buff.x=game.paddle.x;buff.y=game.paddle.y-17;game.step(.05);
assert.equal(game.balls.length,3);assert.equal(game.bonuses.length,0);
game.collectBonus(buff);assert.equal(game.balls.length,3,'Consumed buff is single-use.');
assert.ok(new Set(game.balls.map(b=>Math.round(b.vx))).size===3,'Clones spread into distinct directions');
const clone=game.balls[1];game.cells.fill(0);game.cells[109*COLS+20]=3;const prior=game.broken;
Object.assign(clone,{x:102.5,y:554,vx:0,vy:-410});game.moveBall(clone,1/120);
assert.equal(game.broken,prior,'New clones cannot break the underside from outside');
assert.ok(clone.vy>0);
Object.assign(clone,{x:102.5,y:540,vx:0,vy:410});game.moveBall(clone,1/120);
assert.ok(game.broken>prior,'Clones can break the same tile from inside');
const missed=game.spawnBonus('multiply');missed.x=15;missed.y=game.paddle.y-17;game.step(.05);
assert.equal(missed.collected,false);assert.equal(game.balls.length,3);
missed.y=980;game.step(.05);assert.ok(!game.bonuses.includes(missed));
game.collectBonus(game.spawnBonus('add'));assert.equal(game.balls.length,6);
game.collectBonus(game.spawnBonus('wide'));assert.equal(game.paddle.width,172);
game.collectBonus(game.spawnBonus('shrink'));assert.equal(game.paddle.width,146);
for(let i=0;i<10;i++)game.collectBonus(game.spawnBonus('multiply'));
assert.equal(game.balls.length,BALL_LIMIT);

// Every visible buff applies through a falling collision, not just direct calls.
for(const [type,balls,width] of [['multiply',3,128],['add',4,128],['wide',1,172],['shrink',1,102]]){
  game.reset();game.automatic=false;
  const falling=game.spawnBonus(type,game.paddle.x,game.paddle.y-17);
  game.step(.05);
  assert.equal(falling.collected,true,`${type}: collected on contact`);
  assert.equal(game.balls.length,balls);assert.equal(game.paddle.width,width);
  assert.equal(game.bonusCount,1);
  game.step(.05);assert.equal(game.bonusCount,1,'Falling buffs apply once');
}
for(const [type,width] of [['wide',240],['shrink',64]]){
  game.reset();game.automatic=false;game.movePaddle(535);
  for(let i=0;i<20;i++)game.collectBonus(game.spawnBonus(type));
  assert.equal(game.paddle.width,width);
  assert.ok(game.paddle.x+width/2<=WIDTH-5,'Resizing stays within the arena');
}
// Width changes affect the real catch area as well as the drawn paddle.
for(const type of ['wide','shrink']){
  game.reset();game.automatic=false;
  const x=game.paddle.x+(type==='wide'?80:60);
  game.collectBonus(game.spawnBonus(type));
  Object.assign(game.ball,{x,y:game.paddle.y-5,vx:0,vy:410});game.step(.05);
  assert.equal(game.returns,type==='wide'?1:0,`${type}: catch area follows width`);
}

// Closely spaced arrivals on opposite sides can escape the automatic paddle.
game.reset();game.movePaddle(100);
Object.assign(game.ball,{x:100,y:690,vx:0,vy:410});
game.launch();const escaping=game.balls[1];
Object.assign(escaping,{x:300,y:650,vx:0,vy:410});
for(let i=0;i<60;i++)game.step(1/120);
assert.equal(game.returns,1,'The nearer ball is caught');
assert.ok(!game.balls.includes(escaping),'The paddle cannot instantly save the next ball');
assert.equal(game.state,'running');

// Missing the paddle removes the ball permanently.
{
  game.reset();game.automatic=false;
  const missedBall=game.ball;
  Object.assign(missedBall,{x:20,y:DRAIN_Y-5,vx:0,vy:410});
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
assert.ok(Math.abs(Math.hypot(game.ball.vx,game.ball.vy)-410)<1e-6,'Paddle preserves speed');
// Side-wall reflections and a paddle starting on the opposite side are catchable.
for(const x of [20,520]){
  game.reset();game.movePaddle(WIDTH-x);
  Object.assign(game.ball,{x,y:560,vx:x<WIDTH/2?-240:240,vy:330});
  for(let i=0;i<90&&!game.returns;i++)game.step(1/120);
  assert.equal(game.returns,1);assert.ok(game.ball.vy<0);
}

game.reset();let firstBreak=null,peakBalls=1;
for(let i=0;i<60*60;i++){
  game.step(1/60);
  peakBalls=Math.max(peakBalls,game.balls.length);
  if(game.broken&&firstBreak===null)firstBreak=game.time;
  if(!game.broken){assert.equal(game.bonuses.length,0);assert.equal(game.balls.length,1);}
  assert.ok(game.balls.length<=BALL_LIMIT);
}
assert.ok(firstBreak>0&&firstBreak<25,'Ball reaches breakable material through a small opening.');
assert.ok(game.broken>30);assert.ok(peakBalls>1);assert.ok(game.returns>0);
for(const b of game.balls)assert.ok(Number.isFinite(b.x)&&Number.isFinite(b.y)&&b.x>=0&&b.x<=WIDTH&&b.y-b.radius<=DRAIN_Y);
assert.equal(game.cells.reduce((n,v)=>n+Number(v>WALL),0),game.initialBlocks-game.broken);
assert.equal(game.state,'running');assert.ok(game.balls.length>1,'Automatic catches keep the game alive.');
game.reset();game.state='paused';const frozen=JSON.stringify({balls:game.balls,buffs:game.bonuses});game.step(.1);
assert.equal(JSON.stringify({balls:game.balls,buffs:game.bonuses}),frozen);
console.log(`PASS: permanent walls and hole entry (first break ${firstBreak.toFixed(1)}s), falling buffs, paddle catches, permanent ball loss, game over and pause.`);
// A valid hit on the last remaining tile still completes a level.
game.reset();game.automatic=false;game.cells.fill(0);game.cells[0]=WALL;game.cells[20*COLS+20]=3;game.initialBlocks=1;
Object.assign(game.ball,{x:102.5,y:110,vx:0,vy:-410});game.step(.05);
assert.equal(game.broken,game.initialBlocks);
assert.equal(game.cells[0],WALL,'Winning does not require destroying permanent walls');
assert.equal(game.state,'won');game.reset();assert.equal(game.broken,0);assert.equal(game.balls.length,1);
