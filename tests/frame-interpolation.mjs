import assert from 'node:assert/strict';
import {FrameInterpolation} from '../src/frame-interpolation.js';
import {Race} from '../src/physics.js';
import {Arena} from '../src/arena.js';
import {Spiral} from '../src/spiral.js';
import {TerritoryBattle} from '../src/territory.js';
import {validateBatch} from '../src/factory-recipes.js';

for(const fps of [30,60,90,120,144,165,240,360,480])assert.equal(validateBatch({fps}).fps,fps);
assert.equal(validateBatch().fps,240);
for(const fps of [0,-1,NaN,Infinity,59.5,'bad'])assert.throws(()=>validateBatch({fps}));
const state=race=>JSON.stringify({bodies:[...race.balls.map(b=>b.body),...(race.obstacles??[])].map(b=>({position:b.position,velocity:b.velocity,angle:b.angle,vertices:b.vertices?.map(v=>({x:v.x,y:v.y}))})),particles:race.particles});
for(const Type of [Race,Arena,Spiral,TerritoryBattle]){
  const a=new Type({seed:2048}),b=new Type({seed:2048}),interpolation=new FrameInterpolation();a.start();b.start();
  for(let step=0;step<240;step++){
    interpolation.capture(a);a.step();b.step();
    const before=state(a),time=a.time;
    // Several visual frames within each physics step must leave the solver untouched.
    for(const alpha of [0,.25,.5,.75,1])interpolation.draw(a,alpha,()=>assert.ok(a.balls.every(ball=>Number.isFinite(ball.body.position.x))));
    assert.equal(state(a),before);assert.equal(a.time,time);
  }
  assert.deepEqual(a.balls.map(ball=>ball.body.position),b.balls.map(ball=>ball.body.position));
  assert.deepEqual(a.finished.map(ball=>ball.id),b.finished.map(ball=>ball.id));
  a.dispose();b.dispose();
}
const body={position:{x:0,y:0}},particle={x:0,y:0,life:1},race={time:0,balls:[{body}],particles:[particle]},interpolation=new FrameInterpolation();
interpolation.capture(race);body.position={x:8,y:4};particle.x=8;race.time=1/120;
const frames=[0,.25,.5,.75,1].map(alpha=>interpolation.draw(race,alpha,()=>body.position.x));
assert.deepEqual(frames,[0,2,4,6,8]);
assert.throws(()=>interpolation.draw(race,.5,()=>{throw new Error('render failed');}));
assert.deepEqual(body.position,{x:8,y:4});assert.equal(particle.x,8);assert.equal(race.time,1/120);
body.position.x=1000;assert.equal(interpolation.draw(race,.5,()=>body.position.x),1000);
console.log('PASS: distinct intermediate frames, unchanged physics across all race modes, restoration on errors, respawns, and unrestricted positive integer export FPS.');
