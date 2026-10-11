import assert from 'node:assert/strict';
import {PiCollisions,PiSession,analyzePi,normalizePi} from '../src/pi-collisions.js';
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
const automatic=analyzePi({digits:1,autoIncrease:true});
assert.equal(automatic.complete,true);assert.equal(automatic.hits,3489);
assert.deepEqual(automatic.rounds.map(r=>r.mass),[1,100,10000,1000000]);
assert.deepEqual(automatic.rounds.map(r=>r.collisions),[3,31,314,3141]);
for(const dt of [1/30,.75,100]){
  const times=[],session=new PiSession({digits:1,autoIncrease:true,onHit:e=>times.push(e.time)});session.start();
  for(let i=0;i<10000&&session.state!=='finished';i++)session.step(dt);
  assert.equal(session.state,'finished');assert.deepEqual(session.rounds,automatic.rounds);
  assert.ok(Math.abs(session.time-automatic.simulationSeconds)<1e-7);
  assert.equal(times.length,3489);assert.ok(times.every((t,i)=>i===0||t>=times[i-1]));
}
const hold=new PiSession({digits:1,autoIncrease:true});
for(let i=0;i<3;i++)hold.nextCollision();
assert.equal(hold.transitioning,true);hold.step(1);assert.equal(hold.mass,1);
hold.step(1);assert.equal(hold.mass,100);assert.equal(hold.collisions,0);
assert.deepEqual(analyzePi({digits:3,autoIncrease:true}).rounds.map(r=>r.collisions),[314,3141]);
assert.equal(analyzePi({digits:4,autoIncrease:true}).rounds.length,1);
assert.equal(analyzePi({digits:1}).rounds.length,1);
assert.notEqual(contentKeys({mode:'pi',digits:1,speed:1}).exact,contentKeys({mode:'pi',digits:1,speed:1,autoIncrease:true}).exact);
const autoSource=normalizeSnapshot({mode:'pi',project:{digits:1,autoIncrease:true}});
assert.equal(sourceRecipe(autoSource,1).autoIncrease,true);
console.log('Pi: exact physics, automatic mass sequence, round holds, audio timeline, snapshots and export validation passed.');
