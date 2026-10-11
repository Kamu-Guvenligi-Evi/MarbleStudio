import assert from 'node:assert/strict';
import {Race} from '../src/physics.js';
import {EpisodeRace} from '../src/episode-race.js';
import {recipe} from '../src/factory-recipes.js';
import {withEpisode,EPISODE_FORMATS} from '../src/episode-plan.js';
import {fitTrackDuration,resizeTrack} from '../scripts/track-duration.mjs';

function probe(r){
  const race=r.episode?new EpisodeRace(r):new Race(r);race.start();
  try{
    while(race.time<240&&(r.episode?race.state!=='finished':!race.finished.length))race.step();
    return {simulationSeconds:race.time,complete:r.episode?race.state==='finished':race.finished.length>0,finite:race.balls.every(b=>Number.isFinite(b.body.position.y))};
  }finally{race.dispose();}
}
let runs=0,maxPasses=0;const counts={};
for(const format of ['plain',...EPISODE_FORMATS]){
  counts[format]=0;
  for(const target of [30,55,180])for(const seed of [1,2,3,4,5,17,2048,89271]){
    const base=recipe(seed,'track'),r=format==='plain'?base:withEpisode(base,format);
    const before=JSON.stringify(r),result=await fitTrackDuration(r,target,probe);
    assert.equal(JSON.stringify(r),before);assert.equal(result.recipe.seed,r.seed);
    assert.ok(result.timing.duration>=30&&result.timing.duration<=180);
    assert.equal(result.timing.speed,1);assert.deepEqual(probe(result.recipe),result.analysis);
    if(r.episode)assert.equal(result.recipe.episode.format,format);
    maxPasses=Math.max(maxPasses,result.passes.length);runs++;counts[format]++;
  }
}
const r=recipe(99,'track');
assert.deepEqual(resizeTrack(r,[24]).sequence.slice(0,12),resizeTrack(r,[12]).sequence);
const long=await fitTrackDuration(r,55,async r=>({simulationSeconds:r.sequence.length*15,complete:true,finite:true}));
assert.ok(long.passes.length>1);assert.ok(long.timing.duration<=180);
const short=await fitTrackDuration(r,30,async r=>({simulationSeconds:r.sequence.length*1.3,complete:true,finite:true}));
assert.ok(short.passes.length>1);assert.ok(short.timing.duration>=30);assert.equal(short.recipe.seed,r.seed);
await assert.rejects(()=>fitTrackDuration(r,55,async()=>({simulationSeconds:10,complete:true,finite:true})),/ayarlanamadı/);
let checks=0;await assert.rejects(()=>fitTrackDuration(r,55,probe,{check:()=>{checks++;throw Error('Cancelled');}}),/Cancelled/);assert.equal(checks,1);
console.log(`PASS: ${runs}/${runs} seeds/targets fit at 1x without replacement seeds; maximum ${maxPasses} simulation passes. ${JSON.stringify(counts)}`);
