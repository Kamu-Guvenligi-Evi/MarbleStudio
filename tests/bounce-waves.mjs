import assert from 'node:assert/strict';
import {BounceWaves,normalizeWaves,WAVE_MODES,probeWaves} from '../src/bounce-waves.js';
import {normalizeSnapshot} from '../src/studio-transfer.js';
import {validateBatch,sourceRecipe,structure} from '../src/factory-recipes.js';
assert.deepEqual(normalizeWaves(null),normalizeWaves());
const invalid=normalizeWaves({count:Infinity,height:NaN,variant:'unknown',palette:'__proto__',music:{volume:350}});
assert.equal(invalid.count,4200);assert.equal(invalid.palette,'aurora');assert.equal(invalid.music.volume,100);
const shapes=[];
for(const variant of Object.keys(WAVE_MODES))for(const count of [800,1400,2600,4200,6000,8000]){
  const game=new BounceWaves({variant,count});
  assert.ok(game.balls.length>count*.9&&game.balls.length<=count*1.05);
  const release=game.balls.map(b=>b.height);
  assert.ok(game.balls.every(b=>b.height>0&&b.height<=240&&b.velocity===0),'release from rest above the floor');
  assert.ok(Math.max(...release)-Math.min(...release)>60,'the opening already carries the wave shape');
  game.seek(.3);const falling=game.balls.map(b=>b.height);
  game.seek(.5);assert.ok(game.balls.every((b,i)=>b.height>0&&b.height<falling[i]&&falling[i]<release[i]),'first motion is downward');
  assert.ok(game.balls.every((b,i)=>Math.abs(release[i]-b.height-.5*game.gravity*.5*.5)<1e-9),'every ball falls the same distance under shared gravity');
  for(const b of game.balls.filter((_,i)=>i%101===0)){
    game.seek(Math.sqrt(2*release[game.balls.indexOf(b)]/game.gravity));
    assert.ok(b.height<1e-8,'first impact follows the release height');
    game.seek(b.period);
    assert.ok(Math.abs(b.height-release[game.balls.indexOf(b)])<1e-8&&Math.abs(b.velocity)<1e-8,'elastic rebound returns to its own release height');
  }
  for(let t=0;t<=30;t+=.13){game.seek(t);assert.ok(game.balls.every(b=>Number.isFinite(b.height)&&b.height>=0&&b.height<=240&&b.color>=0&&b.color<=95&&b.r<=.98));}
  game.seek(9.125);const pose=game.balls.map(b=>b.height);
  game.seek(25);game.seek(9.125);assert.deepEqual(game.balls.map(b=>b.height),pose,'seeking is deterministic and independent of frame rate');
  if(count===1400)shapes.push(pose.join(','));
  game.seek(30);assert.equal(game.state,'finished');assert.ok(game.balls.every(b=>b.height===0));
  game.seek(0);assert.equal(game.state,'running');
  assert.deepEqual(game.balls.map(b=>b.height),release,'replay restores the shaped release');
}
assert.equal(new Set(shapes).size,Object.keys(WAVE_MODES).length,'distinct wave shapes');
// Measure acceleration from positions (including the closing seconds), not
// from the engine's velocity field. Only floor contacts may change velocity.
let freeFlightChecks=0;
for(const variant of Object.keys(WAVE_MODES))for(const [height,duration] of [[120,15],[240,30],[300,90]]){
  const game=new BounceWaves({variant,height,duration,count:500});
  const energy=game.balls.map(b=>game.gravity*b.height);
  const sample=game.balls.filter((_,i)=>i%37===0),epsilon=.001;
  const gravity=2*height/(.825*.825),maxSpeed=Math.sqrt(2*gravity*height);
  for(let t=.1;t<duration-epsilon;t+=.137){
    game.seek(t-epsilon);const before=sample.map(b=>b.height);
    game.seek(t);
    for(const [i,b] of game.balls.entries()){
      const actualEnergy=game.gravity*b.height+.5*b.velocity*b.velocity;
      assert.ok(actualEnergy<=energy[i]+1e-7,'floor never adds energy');
      if(t<duration-1.65)assert.ok(Math.abs(actualEnergy-energy[i])<1e-7,'release energy is conserved through repeated bounces');
    }
    const middle=sample.map(b=>({height:b.height,velocity:b.velocity}));
    game.seek(t+epsilon);
    for(let i=0;i<sample.length;i++){
      if(middle[i].height<=maxSpeed*epsilon*2)continue;
      const acceleration=(sample[i].height-2*middle[i].height+before[i])/(epsilon*epsilon);
      assert.ok(Math.abs(acceleration+gravity)<.0001,variant+': constant downward acceleration in free flight');
      const velocity=(sample[i].height-before[i])/(2*epsilon);
      assert.ok(Math.abs(velocity-middle[i].velocity)<.00001,variant+': velocity matches movement');
      freeFlightChecks++;
    }
  }
  // Floor contact is continuous on both sides, including the final shortened hop.
  const ball=sample.at(-1);
  for(const contact of [ball.dropTime,ball.dropTime+ball.period,ball.dropTime+2*ball.period,duration]){
    game.seek(contact-epsilon);const before=ball.height;
    game.seek(contact);assert.ok(ball.height<1e-8,'contact is at the floor');
    game.seek(contact+epsilon);
    assert.ok(before<maxSpeed*epsilon&&ball.height<maxSpeed*epsilon,'no position jump at an impact');
  }
  // Different frame cadences, skipped frames and backwards seeks agree exactly.
  const target=duration-1.123,direct=new BounceWaves({variant,height,duration,count:500}).seek(target);
  for(const fps of [15,30,60,144]){
    game.seek(0);for(let frame=1;frame/fps<target;frame++)game.seek(frame/fps);
    game.seek(target);assert.deepEqual(game.balls.map(b=>[b.height,b.velocity]),direct.balls.map(b=>[b.height,b.velocity]));
  }
}
assert.ok(freeFlightChecks>40000);
console.log('PASS measured ballistic acceleration, continuous floor contacts, release energy conservation, physical finale and frame cadence parity:',freeFlightChecks);
const source=normalizeSnapshot({mode:'bounce-waves',project:{variant:'spiral',palette:'custom',colorA:'#ff793d',colorB:'#20dfff',speed:2,music:{track:'monkeys',volume:27}}});
const options=validateBatch({source,channel:'Clipverseuni'}),recipe=sourceRecipe(options.source,1);
assert.equal(options.fps,144);assert.equal(recipe.music.volume,27);assert.equal(probeWaves(recipe).simulationSeconds,15);
assert.equal(recipe.palette,'custom');assert.equal(recipe.presentation.outro,0);
assert.notEqual(structure(recipe),structure({...recipe,palette:'aurora'}));
assert.throws(()=>validateBatch({source,strategy:'variations'}));
console.log('PASS wave bounds, deterministic seeking, all distinct modes, finale, settings and export recipe');
