import assert from 'node:assert/strict';
import path from 'node:path';
import {recipe,sourceRecipe,structure,validateBatch} from '../src/factory-recipes.js';
import {normalizeSnapshot} from '../src/studio-transfer.js';
import {planAutomatic,automaticCandidate,automaticKind,leastRecent,outputQuality} from '../scripts/production-automation.mjs';
const root=path.resolve('.');
for(const mode of ['arena','spiral']){
 const before=new Set(),after=new Set();
 for(let seed=1;seed<=1000;seed++){
  const r=recipe(seed,mode),source=normalizeSnapshot({mode,project:{...r,sequence:[],spiralTheme:r.theme}});
  before.add(structure(r));after.add(structure(sourceRecipe(source,seed)));
 }
 assert.equal(before.size,24);assert.equal(after.size,24);
}
assert.throws(()=>normalizeSnapshot({mode:'spiral',project:{variant:'bad'}}));
assert.throws(()=>normalizeSnapshot({mode:'arena',project:{energy:99}}));
assert.equal(leastRecent(['a','b'],['a'],()=>0),'b');
assert.equal(outputQuality({hits:10,firstEventSeconds:8,longestQuietSeconds:20,visibleRatio:.2,idleRatio:.8},1).accepted,false);
const history=[];
for(let i=0;i<18;i++){
 const options=await planAutomatic(validateBatch({automatic:true,automaticMode:'auto',count:1}),history,root);
 const r=automaticCandidate(options,i*400+7,history),previous=history.at(-1);
 if(previous){assert.notEqual(automaticKind({mode:options.modes[0],recipe:r}),automaticKind(previous));assert.notEqual(r.music.track,previous.recipe.music.track);}
 const candidates=[];for(let k=0;k<5;k++)candidates.push(automaticCandidate(options,i*400+k+10,history,candidates));
 assert.equal(new Set(candidates.map(structure)).size,5);
 history.push({id:'auto-'+i,mode:options.modes[0],options,recipe:r});
}
assert.equal(new Set(history.map(j=>j.recipe.music.track)).size,3);
assert.equal(new Set(history.map(j=>j.options.automation.rosterCategory)).size,4);
const stats=[];
for(let i=0;i<11;i++){
 const options=await planAutomatic(validateBatch({automatic:true,automaticMode:'statistics',count:1}),stats,root);
 const r=sourceRecipe(options.source,1);assert.ok(r.statistics.dataset.sources.length);
 if(stats.length)assert.notEqual(r.statistics.dataset.id,stats.at(-1).recipe.statistics.dataset.id);
 stats.push({id:'stat-'+i,mode:'statistics',options,recipe:r});
}
await assert.rejects(planAutomatic(validateBatch({automatic:true,automaticMode:'statistics',count:1}),stats,root),e=>e.code==='REPETITION_LIMIT');
assert.equal(new Set(stats.slice(0,11).map(j=>j.recipe.statistics.dataset.id)).size,11);
// Planning after a saved history roundtrip must retain repetition protection.
const persisted=JSON.parse(JSON.stringify(history));const next=await planAutomatic(validateBatch({automatic:true,count:1}),persisted,root);
assert.notEqual(next.arenaGame==='territory'?'territory':next.modes[0],automaticKind(persisted.at(-1)));
console.log('PASS: 24/24 arena and spiral combinations preserved; 18 history-aware plans, three music tracks, four roster styles, five distinct candidates per job, 11 topics then repeat blocked, persisted history and quality gates.');
