import assert from 'node:assert/strict';
import {MergeEvolution,normalizeMerge,probeMerge,ARENA} from '../src/merge-evolution.js';
import {MERGE_THEMES,MERGE_SOURCES} from '../src/merge-themes.js';
import {normalizeSnapshot} from '../src/studio-transfer.js';
import {validateBatch,sourceRecipe,structure,copyFor} from '../src/factory-recipes.js';
assert.equal(MERGE_THEMES.length,28);assert.equal(new Set(MERGE_THEMES.map(t=>t.id)).size,28);
assert.deepEqual(MERGE_THEMES.find(t=>t.id==='car-brands').stages.map(s=>s.name),['Renault','BMW','Mercedes-Benz','Porsche','Ferrari','Lamborghini','Bugatti']);
let finals=0,totalMerges=0;
for(const theme of MERGE_THEMES){
 assert.ok(theme.stages.length>=3&&theme.stages.length<=(theme.id==='car-brands'?7:6));for(const key of theme.sources)assert.ok(MERGE_SOURCES[key]);
 const g=new MergeEvolution({theme:theme.id});while(g.state==='running'){
  g.step();assert.equal(g.balls.reduce((sum,b)=>sum+2**b.level,0),g.spawned,'merge must conserve token value');
  for(const b of g.balls){assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));if(b.level>0||b.y>=ARENA.y-ARENA.r+b.r+10)assert.ok(Math.hypot(b.x-ARENA.x,b.y-ARENA.y)<=ARENA.r-b.r+1e-7);}
 }
 assert.equal(g.balls.length,g.spawned-g.merges);assert.ok(g.balls.length<=180);finals+=g.outcome==='final';totalMerges+=g.merges;
}
const a=new MergeEvolution({seed:77}),b=new MergeEvolution({seed:77});for(let i=0;i<9000;i++){a.step();b.step();}assert.deepEqual(a,b);
const pair=new MergeEvolution();pair.nextSpawn=Infinity;pair.add(0,250,490);pair.add(0,255,490);pair.step();assert.equal(pair.balls.length,1);assert.equal(pair.balls[0].level,1);
const different=new MergeEvolution();different.nextSpawn=Infinity;different.add(0,250,490);different.add(1,255,490);different.step();assert.equal(different.balls.length,2);assert.equal(different.merges,0);
const noCascade=new MergeEvolution();noCascade.nextSpawn=Infinity;for(let i=0;i<4;i++)noCascade.add(0,270,490);noCascade.step();assert.equal(noCascade.balls.length,2);assert.equal(noCascade.balls[0].level,1);
const ongoing=new MergeEvolution({theme:'planets',duration:15,spawnInterval:1.5});for(let i=0;i<120*20;i++)ongoing.step();assert.equal(ongoing.state,'running');assert.ok(ongoing.spawned>=13);while(ongoing.state==='running'&&ongoing.time<600)ongoing.step();assert.equal(ongoing.outcome,'final');assert.equal(ongoing.state,'finished');
for(const bounce of [.65,1])for(const seed of [1,2,100]){const g=new MergeEvolution({bounce,seed,gravity:900,spawnInterval:.12,duration:180});while(g.state==='running')g.step();assert.ok(g.balls.every(b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite)));}
assert.equal(normalizeMerge({theme:'unknown',speed:Infinity,seed:-1}).theme,MERGE_THEMES[0].id);
const source=normalizeSnapshot({mode:'merge-evolution',project:{theme:'planets'}});assert.equal(validateBatch({source}).source.project.theme,'planets');const recipe=sourceRecipe(source,42);assert.equal(recipe.mode,'merge-evolution');assert.ok(structure(recipe).includes('planets'));assert.ok(copyFor(recipe).tags.includes('merge'));assert.ok(probeMerge(recipe).finite);
console.log(JSON.stringify({themes:28,defaultFinals:finals,totalMerges,determinism:true,conservation:true,collisionRules:true,noPrematureTimeout:true,extremes:true,factoryIntegration:true}));
