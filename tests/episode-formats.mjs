import assert from 'node:assert/strict';
import path from 'node:path';
import {EpisodeRace} from '../src/episode-race.js';
import {EPISODE_FORMATS,withEpisode} from '../src/episode-plan.js';
import {recipe,validateBatch,copyFor} from '../src/factory-recipes.js';
import {planAutomatic,automaticCandidate} from '../scripts/production-automation.mjs';
import {contentKeys,createRepetitionGuard,repetitionEntry} from '../scripts/repetition-guard.mjs';

function simulate(r){
  const race=new EpisodeRace(r),sizes=[race.balls.length];race.start();
  try{
    for(let i=0;i<120*240&&race.state!=='finished';i++){
      const round=race.round;race.step();if(round!==race.round)sizes.push(race.balls.length);
      assert.ok(race.balls.every(b=>Number.isFinite(b.body.position.y)));
    }
    assert.equal(race.state,'finished');
    return {...race.summary(),sizes};
  }finally{race.dispose();}
}
for(const format of EPISODE_FORMATS){
  for(const seed of [11,7654,54127,984735]){
    const r=withEpisode({...recipe(seed,'track'),language:'tr'},format),result=simulate(r);
    assert.deepEqual(simulate(JSON.parse(JSON.stringify(r))),result,'Preview and export must agree');
    if(format==='elimination'){
      assert.deepEqual(result.sizes,[12,8,4]);
      assert.deepEqual(result.rounds.map(h=>h.finishers.length),[8,4,1]);
      for(let i=1;i<3;i++)assert.ok(result.rounds[i].finishers.every(id=>result.rounds[i-1].finishers.includes(id)));
    }
    if(format==='championship'){
      assert.equal(result.rounds.length,3);
      assert.equal(result.standings.reduce((sum,e)=>sum+e.points,0),63);
      for(const e of result.standings)assert.equal(e.points,result.rounds.reduce((sum,h)=>sum+(h.finishers.includes(e.id)?6-h.finishers.indexOf(e.id):0),0));
      assert.equal(result.winner,result.standings[0].name);
    }
    if(format==='teams'){
      assert.equal(result.standings.reduce((sum,e)=>sum+e.points,0),21);
      for(const team of result.standings)assert.equal(team.points,result.rounds[0].finishers.reduce((sum,id,i)=>sum+(id%3===team.id?6-i:0),0));
      assert.equal(result.winner,result.standings[0].name);
    }
    assert.ok(copyFor(r,'tr').description.length>10);
    const cosmetic={...r,music:{track:'other'},language:'en'};
    assert.deepEqual(contentKeys(r),contentKeys(cosmetic));
    const seeded=JSON.parse(JSON.stringify(r));seeded.seed++;seeded.episode.heats.forEach(h=>h.seed++);
    assert.equal(contentKeys(r).similar,contentKeys(seeded).similar);
    assert.notEqual(contentKeys(r).exact,contentKeys(seeded).exact);
  }
}
const options=validateBatch({automatic:true,automaticMode:'track',count:1}),history=[];
for(let i=0;i<12;i++){
  const plan=await planAutomatic(options,history,path.resolve('.'));
  const r=automaticCandidate(plan,7000+i,history);
  if(history.length)assert.notEqual(r.episode.format,history.at(-1).recipe.episode.format);
  history.push({id:String(i),mode:'track',recipe:r,options:plan});
}
for(const format of EPISODE_FORMATS)assert.equal(history.filter(h=>h.recipe.episode.format===format).length,3);
const ledger=history.map(h=>repetitionEntry(h));
const afterArchive=createRepetitionGuard([],ledger);
const next=await planAutomatic(options,[],path.resolve('.'),afterArchive);
assert.notEqual(next.automation.episodeFormat,history.at(-1).recipe.episode.format);
const tie=new EpisodeRace(withEpisode(recipe(11,'track'),'championship'));
tie.results=[{}, {}, {}];tie.entrants[0].points=9;tie.entrants[1].points=9;
tie.entrants[0].places=[0,3,99];tie.entrants[1].places=[1,2,99];
assert.equal(tie.standings()[0].id,1,'Tied non-finishers count back to preceding stage');tie.dispose();
console.log('PASS: four real formats, 32 deterministic runs, qualification, individual/team scoring, tie countback, content identities and persistent balanced planning.');
