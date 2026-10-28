import assert from 'node:assert/strict';
import {createGameSoundDirector,GAME_SOUND_STYLES} from '../src/game-sound-director.js';
import {createDuelSoundEvents} from '../src/ball-duel-audio.js';
import {effectSamples} from '../src/impact-audio.js';
import {productionAudio} from '../scripts/factory-audio.mjs';
import {normalizeBreaker} from '../src/breaker-video.js';
import {BallDuel,normalizeDuel} from '../src/ball-duel.js';
import {sourceRecipe,validateBatch} from '../src/factory-recipes.js';
import {GoalArena} from '../src/goal-arena.js';
import {GOAL_SOUND_DURATION} from '../src/goal-arena-audio.js';

for(const mode of ['glass-breaker','spiral-breaker','ball-duel'])for(const style of Object.keys(GAME_SOUND_STYLES).filter(style=>style!=='original')){
  const decide=createGameSoundDirector(mode,style),events=[];
  const type=mode==='glass-breaker'?'ice':mode==='spiral-breaker'?'brick':'wall';
  for(let i=0;i<1500;i++){const event=decide({type},i/1500);if(event)events.push(event);}
  assert.ok(events.length>0&&events.length<=19,'Only very close contacts are merged, independent of clip length');
  const ending=decide({type:'won'},1.001);assert.ok(ending&&ending.priority===3,'Final bypasses reaction cooldown');
  assert.equal(decide({type:'won'},2),null,'Final happens once');
  assert.equal(decide({type},2),null,'Late contacts cannot mask the final');
  for(const event of [...events,ending]){
    const samples=effectSamples(event);assert.deepEqual(samples,effectSamples(event));
    assert.ok(samples.length&&samples.every(Number.isFinite));assert.ok(samples.some(s=>Math.abs(s)>.02));
    assert.ok(samples.every(s=>Math.abs(s)<1));
  }
  const source={mode,project:{sound:true,soundStyle:style}};
  assert.equal(sourceRecipe(validateBatch({source}).source,42).soundStyle,style,'Sound style survives video queue');
}
const direct=createGameSoundDirector('spiral-breaker');
assert.ok(direct({type:'brick'},0));
assert.equal(direct({type:'brick'},.01),null);
assert.equal(direct({type:'multiply'},.01).cue.reason,'Bonus ve ilerleme','Rewards remain audible during collisions');
assert.equal(direct({type:'finish'},.01).priority,2);
const glass=createGameSoundDirector('glass-breaker');assert.equal(glass({type:'ice'},0).cue.voice,'glass');assert.equal(glass({type:'wave'},.01).priority,2);
const duel=createDuelSoundEvents('reactions'),game={balls:[{weapon:'laser'}]};
assert.equal(duel({type:'shot',owner:0,time:0,x:300},game).duelSound,'laser','Keep weapon identity');
assert.equal(duel({type:'pickup',owner:0,time:.01,x:300},game).cue.voice,'anime-wow');
assert.equal(duel({type:'win',owner:0,time:.02,x:300},game).cue.voice,'yippee');
const physics=new BallDuel({seed:42}),finals=[];physics.onEvent=e=>{if(['win','timeout'].includes(e.type))finals.push(e);};
while(physics.state==='running')physics.step(1/120);assert.equal(finals.length,1,'Real duel emits exactly one final');
assert.equal(normalizeDuel({soundStyle:'bad'}).project.soundStyle,'balanced');
assert.equal(normalizeBreaker({mode:'glass-breaker',project:{soundStyle:'bad'}}).project.soundStyle,'balanced');

const effect=createGameSoundDirector('glass-breaker','meme')({type:'won'},.1);
const options={events:{effects:[effect],leaders:[]},recipe:{},duration:3,audio:'effects'};
const {buffer}=await productionAudio(options),samples=effectSamples(effect),start=Math.floor(effect.time*48000);
for(let i=0;i<samples.length&&start+i<3*48000;i++)assert.ok(Math.abs(buffer.readInt16LE(44+(start+i)*2)-Math.round(Math.tanh(samples[i]*.35)*30000))<=1,'Export uses the exact directed PCM');
const mute=await productionAudio({...options,audio:'none'});assert.ok(mute.buffer.subarray(44).every(b=>b===0));
const crowded=await productionAudio({...options,events:{effects:[createGameSoundDirector('glass-breaker','reactions')({type:'wave'},0),effect],leaders:[]}});
assert.deepEqual(crowded.buffer.subarray(44+start*2),buffer.subarray(44+start*2),'Final interrupts older voices in exported audio');
for(const style of Object.keys(GAME_SOUND_STYLES)){
  const decide=createGameSoundDirector('goal-arena',style);
  decide({type:'wall'},1);
  const goal=decide({type:'goal',owner:0},1.001);
  assert.equal(goal?.cue.voice,'goal-horn','Every automatic style celebrates goals immediately after contact');
  assert.equal(decide({type:'goal',owner:0},1.002),null,'Duplicate goal notifications stay silent');
  assert.equal(decide({type:'goal',owner:1},4).cue.voice,'goal-horn','Both teams and subsequent goals celebrate');
}
assert.equal(createGameSoundDirector('goal-arena','melodic-marimba',{goal:'off'})({type:'goal'},0),null);
assert.equal(createGameSoundDirector('goal-arena','melodic-marimba',{goal:'coin'})({type:'goal'},0).cue.voice,'coin','Manual selection wins');
assert.equal(createGameSoundDirector('goal-arena','balanced',{goal:'goal-horn'})({type:'goal'},0).cue.voice,'goal-horn','Horn is available in sound menu');
const match=new GoalArena(),goalCues=[],goalDirector=createGameSoundDirector('goal-arena',match.settings.soundStyle);
match.onEvent=e=>{const cue=goalDirector(e);if(cue?.originalType==='goal')goalCues.push(cue);};
while(match.state==='running')match.step();
assert.ok(goalCues.length>0);assert.equal(goalCues.length,match.goals.length,'Exactly one celebration per actual goal');
const goalEffect={...goalCues[0],time:.1},goalSamples=effectSamples(goalEffect);
assert.deepEqual(goalSamples,effectSamples(goalEffect),'Goal audio is deterministic');
assert.ok(GOAL_SOUND_DURATION>2.9&&GOAL_SOUND_DURATION<3.1,'Keep the complete official goal shout instead of the short match-end notification');
assert.ok(goalSamples.every(s=>Number.isFinite(s)&&Math.abs(s)<1));
assert.ok(goalSamples.some(s=>Math.abs(s)>.2));
for(const rate of [44100,48000]){
  const pcm=effectSamples(goalEffect,rate);
  assert.equal(pcm.length,Math.ceil(rate*GOAL_SOUND_DURATION));
  assert.ok(Math.abs(pcm[0])<.001&&Math.abs(pcm.at(-1))<.001,'Smooth attack and release');
}
const goalOptions={events:{effects:[goalEffect],leaders:[]},recipe:{},duration:goalEffect.time+GOAL_SOUND_DURATION+.2,audio:'effects'};
const goalExport=await productionAudio(goalOptions),goalStart=Math.floor(goalEffect.time*48000);
for(let i=0;i<goalSamples.length;i++)assert.ok(Math.abs(goalExport.buffer.readInt16LE(44+(goalStart+i)*2)-Math.round(Math.tanh(goalSamples[i]*.35)*30000))<=1,'Video includes the same goal sound at the scoring instant');
assert.ok((await productionAudio({...goalOptions,audio:'none'})).buffer.subarray(44).every(b=>b===0));
console.log('PASS: game sound styles, goal celebrations, contact cooldown, overrides, real match, deterministic PCM, video audio and mute.');
