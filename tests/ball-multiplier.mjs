import assert from 'node:assert/strict';
import {BallMultiplier,CIRCLE,normalizeMultiplier} from '../src/ball-multiplier.js';
import {probeMultiplier} from '../src/ball-multiplier-video.js';
import {validateBatch,sourceRecipe,copyFor} from '../src/factory-recipes.js';

const run=settings=>{const g=new BallMultiplier(settings);while(g.state==='running')g.step();return g;};
const source={mode:'ball-multiplier',project:{count:2,seed:42,limit:100,duration:15}};
const options=validateBatch({source,strategy:'exact'});
assert.equal(options.fps,144);
assert.throws(()=>validateBatch({source,strategy:'variations'}));
const recipe=sourceRecipe(options.source,42);
assert.equal(recipe.mode,source.mode);
assert.ok(copyFor(recipe,'en').description.includes('\n'));
assert.equal(normalizeMultiplier(null).limit,2000);
assert.equal(normalizeMultiplier({limit:9999}).limit,3000);
assert.deepEqual(normalizeMultiplier({soundOverrides:{bounce:'bonk',wall:'off',complete:'invalid'}}).soundOverrides,{bounce:'bonk',wall:'off'});

const opening=new BallMultiplier({count:2,gravity:0,limit:100});
while(opening.births===0&&opening.time<1)opening.step();
assert.equal(opening.births,1,'one collision creates exactly one new ball');
assert.equal(opening.collisions,1);
const newborn=opening.balls[2];
assert.ok(Math.hypot(newborn.x-CIRCLE.x,newborn.y-(CIRCLE.y-75))>50,'births appear independently of the collision position');
for(const b of opening.balls.slice(0,2))assert.ok(Math.hypot(newborn.x-b.x,newborn.y-b.y)>newborn.r+b.r,'newborn has free space');

for(const spawnOn of ['balls','every-bounce']){
  const game=new BallMultiplier({count:2,gravity:0,spawnOn});
  Object.assign(game.balls[0],{x:CIRCLE.x+CIRCLE.r-7-.2,y:CIRCLE.y,vx:200,vy:0});
  Object.assign(game.balls[1],{x:CIRCLE.x,y:CIRCLE.y-120,vx:0,vy:0});
  game.step();
  assert.equal(game.births,spawnOn==='balls'?0:1,'wall births are opt-in');
}
const resting=new BallMultiplier({count:2,gravity:0});
Object.assign(resting.balls[0],{x:263,y:550,vx:0,vy:0});
Object.assign(resting.balls[1],{x:277,y:550,vx:0,vy:0});
for(let i=0;i<120;i++)resting.step();
assert.equal(resting.births,0,'resting contacts never produce a stream of births');

const a=run(recipe),b=run(recipe);
assert.deepEqual(a.balls,b.balls,'replay and export use deterministic physics');
assert.ok(a.balls.length<=100);
const analysis=probeMultiplier(recipe);
assert.equal(analysis.balls,a.balls.length);
assert.equal(probeMultiplier({...recipe,speed:2}).simulationSeconds,analysis.simulationSeconds/2);

const started=performance.now(),dense=new BallMultiplier();
let peak=0,surgeSteps=0,bloomSteps=0,finalEvents=0,finalEventTime=0;
dense.onEvent=e=>{if(e.type==='complete'){finalEvents++;finalEventTime=dense.time;}};
while(dense.state==='running'){
  dense.step();peak=Math.max(peak,dense.balls.length);
  if(dense.phase==='surge')surgeSteps++;
  if(dense.phase==='bloom')bloomSteps++;
  if(dense.phase!=='multiply')assert.equal(dense.balls.length,dense.finalePopulation,'finale preserves every coloured ball');
  for(const b of dense.balls)assert.ok([b.x,b.y,b.r,b.vx,b.vy].every(Number.isFinite));
}
assert.equal(peak,2000,'population reaches the raised limit before the finale');
assert.ok(surgeSteps>100&&bloomSteps>100,'distinct vortex and bloom stages');
assert.equal(dense.balls.length,2000);assert.equal(new Set(dense.balls.map(b=>b.color)).size,8);
assert.equal(finalEvents,1);assert.ok(dense.time-finalEventTime>.8,'completion sound lands before the ending holds');
assert.ok(dense.time<=45+1/120);assert.equal(dense.finaleProgress,1);
assert.equal(new Set(dense.balls.map(b=>b.x+','+b.y)).size,2000,'every marble has a distinct finishing position');
assert.ok(dense.balls.every(b=>b.vx===0&&b.vy===0),'final frame has settled');
// Sample the entire arena: a full finish, not a sparse pile or a central blob.
let covered=0,samples=0;
for(let y=-230;y<=230;y+=10)for(let x=-230;x<=230;x+=10){
  if(x*x+y*y>CIRCLE.r*CIRCLE.r)continue;samples++;
  if(dense.balls.some(b=>(b.x-CIRCLE.x-x)**2+(b.y-CIRCLE.y-y)**2<=b.r*b.r))covered++;
}
assert.ok(covered/samples>.98,'marbles cover the circular arena');
const maximum=new BallMultiplier({limit:3000});let maxPeak=0;
while(maximum.state==='running'){maximum.step();maxPeak=Math.max(maxPeak,maximum.balls.length);}
assert.equal(maxPeak,3000,'maximum population is reachable');assert.equal(maximum.balls.length,3000);
for(const settings of [{radius:12,limit:800},{radius:5,count:2,gravity:0,duration:5},{limit:50,speed:2}]){
  const g=run(settings);assert.equal(g.balls.length,g.finalePopulation);assert.equal(g.finaleProgress,1);
  assert.ok(g.balls.every(b=>[b.x,b.y,b.r].every(Number.isFinite)));
}
const musical=sourceRecipe(validateBatch({source:{mode:'ball-multiplier',project:{music:{track:'monkeys',volume:27},soundStyle:'melodic-piano'}},strategy:'exact'}).source,42);
assert.equal(musical.music.track,'monkeys');assert.equal(musical.music.volume,27);assert.equal(musical.soundStyle,'melodic-piano');
console.log('PASS multiplier: birth rules, deterministic vortex, full-colour ending, music export',JSON.stringify({peak,coverage:covered/samples,seconds:dense.time,computeMs:Math.round(performance.now()-started)}));
