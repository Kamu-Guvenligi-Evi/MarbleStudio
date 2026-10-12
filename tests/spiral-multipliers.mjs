import assert from 'node:assert/strict';
import {Spiral,spiralMultiplierLayout,spiralPoint,spiralLength,SPIRAL,gateDistance} from '../src/spiral.js';
import {normalizeSnapshot} from '../src/studio-transfer.js';
import {sourceRecipe,structure} from '../src/factory-recipes.js';
import {contentKeys} from '../scripts/repetition-guard.mjs';
const layouts=new Set(),values=new Set();
for(let seed=1;seed<=100;seed++){
  const gates=spiralMultiplierLayout(seed);assert.deepEqual(gates,spiralMultiplierLayout(seed));
  assert.ok(gates.length>=4&&gates.length<=6);
  for(const [i,g] of gates.entries()){
    assert.ok(g.value>=2&&g.value<=5);values.add(g.value);
    assert.ok(g.distance>gateDistance+100&&g.distance<spiralLength);
    assert.deepEqual(g.point,spiralPoint(g.distance));
    if(i)assert.ok(g.distance-gates[i-1].distance>100);
  }
  layouts.add(JSON.stringify(gates));
}
assert.equal(layouts.size,100);assert.equal(values.size,4);
const race=new Spiral({seed:2048});race.ice.clear();race.start();
const ball=race.balls[0],gate=race.multipliers[0];
Object.assign(ball,{airborne:false,multiplied:true,distance:gate.distance-1,release:0});ball.body.position=spiralPoint(ball.distance);
race.step(1000/240);assert.equal(race.balls.length,gate.value);assert.equal(gate.hits,1);
assert.ok(race.balls.every(b=>b.passedMultipliers.has(gate.id)));
assert.ok(race.balls.some(b=>b.release>race.time));
race.step(100);assert.equal(gate.hits,1,'Queued copies cannot retrigger their source gate');
const next=race.multipliers[1];ball.distance=next.distance-1;ball.body.position=spiralPoint(ball.distance);
race.step(1000/240);assert.equal(next.hits,1);assert.ok(ball.passedMultipliers.has(next.id));
const capped=new Spiral({seed:2048});capped.ice.clear();capped.start();
while(capped.balls.length<SPIRAL.limit-1)capped.addBall(100);
const first=capped.balls[0],capGate=capped.multipliers[0];
Object.assign(first,{airborne:false,multiplied:true,distance:capGate.distance-1,release:0});first.body.position=spiralPoint(first.distance);
capped.step(1000/240);assert.equal(capped.balls.length,SPIRAL.limit);assert.equal(capGate.hits,1);
const snapshot=normalizeSnapshot({mode:'spiral',project:{count:1,seed:2048,sequence:[]}}),r=sourceRecipe(snapshot,2048);
assert.deepEqual(new Spiral(r).multipliers.map(({hits,activatedAt,...g})=>g),spiralMultiplierLayout(2048));
assert.notEqual(structure(r),structure({...r,seed:2049}));assert.notEqual(contentKeys(r).similar,contentKeys({...r,seed:2049}).similar);
console.log('PASS: 100 distinct reproducible layouts, safe spacing, varied factors, actual crossing multiplication, queued copies, downstream gates, 64-ball cap, export replay and content identity.');
