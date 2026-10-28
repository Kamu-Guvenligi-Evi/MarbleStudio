import assert from 'node:assert/strict';
import {GoalArena,FIELD,GOAL_TIMING,normalizeGoalArena} from '../src/goal-arena.js';
import {probeGoalArena} from '../src/goal-arena-video.js';
import {normalizeSnapshot} from '../src/studio-transfer.js';
import {sourceRecipe,validateBatch} from '../src/factory-recipes.js';
const run=settings=>{const g=new GoalArena(settings);while(g.state==='running')g.step();return g;};
const first=run({}),second=run({});assert.deepEqual(first.goals,second.goals);assert.deepEqual(first.scores,second.scores);
assert.equal(first.minute,90);assert.equal(first.matchTicks/120,37.5);assert.ok(first.goals.length>=4);
assert.ok(Math.abs(first.time-(37.5+first.goals.length*GOAL_TIMING.total))<1e-8);
assert.equal(first.scores.reduce((a,b)=>a+b),first.goals.length);
const snapshot=normalizeSnapshot({mode:'goal-arena',project:{home:'Test',soundOverrides:{goal:'coin'},music:{track:'monkeys',volume:24}}});
const options=validateBatch({source:snapshot,strategy:'exact'});assert.equal(options.fps,144);assert.equal(options.count,1);
const recipe=sourceRecipe(snapshot,snapshot.project.seed);assert.equal(recipe.music.track,'monkeys');assert.equal(recipe.soundOverrides.goal,'coin');
const base=probeGoalArena(recipe),fast=probeGoalArena({...recipe,speed:2});
assert.equal(fast.simulationSeconds,base.simulationSeconds/2);assert.deepEqual(fast.goals,base.goals);
assert.throws(()=>validateBatch({source:snapshot,strategy:'variations'}));
assert.equal(normalizeGoalArena(null).home,'LASK');assert.equal(normalizeGoalArena({ballSpeed:Infinity}).ballSpeed,300);

// Controlled mouth crossing: ball still on the line, entirely through, then
// exactly one score and a kickoff. It must be the entering ball's own team.
const g=new GoalArena({goalSpeed:.35});g.goalAngle=0;const b=g.balls[1];
const line=Math.sqrt(FIELD.radius**2-(g.settings.goalWidth/2)**2);
// The goal stops during entry, before the whole ball crosses the goal line.
const entering=new GoalArena();entering.goalAngle=0;
Object.assign(entering.balls[0],{x:FIELD.x+line-FIELD.ballRadius+1,y:FIELD.y,vx:300,vy:0});
assert.equal(entering.goalAngularSpeed,0);
for(let i=0;i<10;i++){entering.step();assert.equal(entering.goalAngle,0);assert.equal(entering.goals.length,0);}
while(!entering.goals.length)entering.step();
assert.equal(entering.goalAngle,0);assert.equal(entering.previousGoalAngle,0);
while(entering.celebrateUntil){entering.step();assert.equal(entering.goalAngle,0);}
entering.step();assert.ok(entering.goalAngle>0);
const retreating=new GoalArena();retreating.goalAngle=0;
Object.assign(retreating.balls[0],{x:FIELD.x+line-FIELD.ballRadius+1,y:FIELD.y,vx:-300,vy:0});
retreating.step();assert.equal(retreating.goalAngle,0);assert.equal(retreating.goals.length,0);
retreating.step();assert.ok(retreating.goalAngle>0,'rotation resumes after a missed entry');
Object.assign(b,{x:FIELD.x+line+FIELD.ballRadius-1,y:FIELD.y,vx:300,vy:0});g.boundary(b);assert.equal(g.goals.length,0);
b.x+=2;g.boundary(b);assert.equal(g.goals.length,1);assert.deepEqual(g.scores,[0,1]);
const frozen=g.balls.map(b=>[b.x,b.y]);let goalEvents=0;
g.onEvent=e=>{if(e.type==='goal')goalEvents++;};
g.score(g.balls[0]);assert.equal(goalEvents,0);assert.equal(g.goals.length,1);
for(let i=0;i<180;i++)g.step();
assert.equal(g.phase,'goal');assert.equal(g.goalAngle,0);assert.equal(g.matchTicks,0);
assert.deepEqual(g.balls.map(b=>[b.x,b.y]),frozen);
for(let i=0;i<24;i++)g.step();assert.equal(g.phase,'kickoff');
assert.deepEqual(g.balls.map(b=>b.x),[FIELD.x-33,FIELD.x+33]);
const kickoff=g.balls.map(b=>[b.x,b.y,b.vx,b.vy]);
while(g.celebrateUntil)g.step();
assert.deepEqual(g.balls.map(b=>[b.x,b.y,b.vx,b.vy]),kickoff);
assert.equal(g.matchTicks,0);assert.equal(g.goalAngle,0);assert.equal(g.phase,'playing');
g.step();assert.equal(g.matchTicks,1);assert.ok(g.goalAngle>0);
// A last-tick goal must finish its celebration before full time.
const late=new GoalArena({duration:15});late.matchTicks=1799;late.score(late.balls[0]);
while(late.celebrateUntil){assert.equal(late.state,'running');late.step();}
assert.equal(late.matchTicks,1799);late.step();assert.equal(late.state,'finished');assert.equal(late.minute,90);
const wall=new GoalArena();wall.goalAngle=0;Object.assign(wall.balls[0],{x:FIELD.x-FIELD.radius+4,y:FIELD.y,vx:-300,vy:0});
wall.boundary(wall.balls[0]);assert.ok(wall.balls[0].vx>0);assert.equal(wall.goals.length,0);
// A post strike cannot be counted as crossing the mouth.
const post=new GoalArena();post.goalAngle=0;const a=post.halfOpening;
Object.assign(post.balls[0],{x:FIELD.x+Math.cos(a)*FIELD.radius-4,y:FIELD.y+Math.sin(a)*FIELD.radius,vx:300,vy:0});
post.boundary(post.balls[0]);assert.equal(post.goals.length,0);
// Inner-edge post contacts used to freeze the goal, even without a score.
// Cover both posts, rotated goals, all widths and a nearly fitting ball.
for(const goalWidth of [112,132,156])for(const angle of [0,.7,Math.PI,4.8])for(const side of [-1,1])for(const inset of [4,FIELD.ballRadius+1]){
  const game=new GoalArena({goalWidth});game.goalAngle=angle;
  const half=goalWidth/2,u=Math.sqrt(FIELD.radius**2-half**2)-4,v=side*(half-inset);
  const cos=Math.cos(angle),sin=Math.sin(angle);
  Object.assign(game.balls[0],{x:FIELD.x+u*cos-v*sin,y:FIELD.y+u*sin+v*cos,vx:300*cos,vy:300*sin});
  assert.equal(game.goalAngularSpeed,game.settings.goalSpeed,'Post contact must not lock rotation');
  game.step();
  assert.ok(game.goalAngle>angle,'Goal keeps moving during a post collision');
  assert.equal(game.goals.length,0,'Post contact is not a goal');
  assert.equal(game.celebrateUntil,0);
}
const touch=new GoalArena();Object.assign(touch.balls[0],{x:260,y:480,vx:300,vy:0});Object.assign(touch.balls[1],{x:280,y:480,vx:-300,vy:0});
touch.collideBalls();assert.ok(touch.balls[0].vx<0&&touch.balls[1].vx>0);
assert.ok(Math.hypot(touch.balls[1].x-touch.balls[0].x,touch.balls[1].y-touch.balls[0].y)>=FIELD.ballRadius*2);
assert.equal(normalizeGoalArena({goalWidth:88}).goalWidth,132,'old saved narrow goals migrate');
assert.throws(()=>normalizeGoalArena({ballImages:['https://example.com/image.png']}));
for(const width of [112,132,156]){
  const line=Math.sqrt(FIELD.radius**2-(width/2)**2);
  assert.ok(FIELD.goalDepth>FIELD.ballRadius*2,'whole ball fits into net');
  assert.ok(Math.hypot(line+FIELD.goalDepth,width/2)<FIELD.x-2,'rotating net stays in frame');
}

let totalGoals=0,maxDistance=0;const started=performance.now();
for(let seed=0;seed<300;seed++){
  const game=new GoalArena({seed,duration:seed%4===0?120:37.5,ballSpeed:[150,300,360][seed%3],goalSpeed:[.35,.8,1.3][seed%3],goalWidth:[112,132,156][seed%3]});
  let completes=0;game.onEvent=e=>{if(e.type==='complete')completes++;};
  while(game.state==='running'){
    game.step();for(const ball of game.balls){
      for(const k of ['x','y','vx','vy'])assert.ok(Number.isFinite(ball[k]),`finite ${seed}/${k}`);
      const d=Math.hypot(ball.x-FIELD.x,ball.y-FIELD.y);maxDistance=Math.max(maxDistance,d);
      assert.ok(d<FIELD.radius+FIELD.goalDepth,`contained seed ${seed}, time ${game.time}: ${d}`);
      assert.ok(ball.trail.length<=9);
    }
  }
  game.step();assert.equal(completes,1);assert.equal(game.minute,90);
  assert.equal(game.scores.reduce((a,b)=>a+b),game.goals.length);totalGoals+=game.goals.length;
}
console.log(JSON.stringify({pass:true,matches:300,totalGoals,maxDistance,physicsMilliseconds:Math.round(performance.now()-started),defaultScore:first.scores}));
