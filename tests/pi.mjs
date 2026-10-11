import assert from 'node:assert/strict';
import {PiCollisions,analyzePi,normalizePi} from '../src/pi-collisions.js';
import {normalizeSnapshot,parseBackup} from '../src/studio-transfer.js';
import {validateBatch,sourceRecipe,copyFor} from '../src/factory-recipes.js';
import {contentKeys} from '../scripts/repetition-guard.mjs';

for(const [digits,count] of [[1,3],[2,31],[3,314],[4,3141]]){
  const race=new PiCollisions({digits}),energy=race.energy;
  for(let i=0;i<4000&&race.state!=='finished';i++){
    race.nextCollision();
    assert.ok(Math.abs(race.energy/energy-1)<1e-10,'Elastic collisions conserve energy');
    assert.ok(race.heavy.x>=0&&race.heavy.x+race.heavy.width<=race.light.x+1e-7);
    assert.ok(race.light.x+race.light.width<=race.wall+1e-7);
  }
  assert.equal(race.collisions,count);assert.equal(race.state,'finished');
  for(const dt of [1/30,1/120,.75]){
    const stepped=new PiCollisions({digits});stepped.start();
    for(let i=0;i<20000&&stepped.state!=='finished';i++)stepped.step(dt);
    assert.equal(stepped.collisions,count);assert.ok(Math.abs(stepped.time-race.time)<1e-7);
  }
  assert.equal(analyzePi({digits,speed:.5}).simulationSeconds,race.time*2);
  const source=normalizeSnapshot({mode:'pi',project:{digits,speed:.5,sound:false}});
  const batch=validateBatch({source});assert.equal(batch.strategy,'exact');assert.deepEqual(batch.modes,['pi']);
  const recipe=sourceRecipe(source,1);assert.equal(recipe.digits,digits);assert.equal(copyFor(recipe,'tr').language,'tr');
  assert.throws(()=>validateBatch({source,strategy:'variations'}));
}
assert.throws(()=>normalizePi({digits:5}));assert.throws(()=>normalizePi({speed:0}));assert.throws(()=>normalizePi(null));
assert.throws(()=>validateBatch({modes:['pi']}));
assert.throws(()=>parseBackup(JSON.stringify({format:'marble-studio-backup',version:1,entries:{'marble-studio-pi-v1':'{"digits":0}'}})));
assert.notEqual(contentKeys({mode:'pi',digits:2,speed:1}).exact,contentKeys({mode:'pi',digits:3,speed:1}).exact);
console.log('Pi: 3/31/314/3141 collisions, energy, bounds, time-step independence, snapshots and export validation passed.');
