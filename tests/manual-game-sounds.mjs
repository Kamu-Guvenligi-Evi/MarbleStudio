import assert from 'node:assert/strict';
import {createGameSoundDirector} from '../src/game-sound-director.js';
import {createDuelSoundEvents,duelEffectSamples} from '../src/ball-duel-audio.js';
import {normalizeSoundOverrides,originalGlassSamples} from '../src/game-sound-settings.js';
import {effectSamples} from '../src/impact-audio.js';
import {normalizeRing} from '../src/ring-escape.js';
import {sourceRecipe,validateBatch} from '../src/factory-recipes.js';
import {productionAudio} from '../scripts/factory-audio.mjs';
import {RECORDED_SOUNDS,recordedSamples} from '../src/recorded-sounds.js';
import {VOICES,VOICE_NAMES,cueSamples} from '../src/sound-plan.js';

for(const [id,clip] of Object.entries(RECORDED_SOUNDS)){
  assert.ok(VOICES.includes(id));assert.equal(VOICE_NAMES[id],clip.name);
  assert.deepEqual(normalizeSoundOverrides('glass-breaker',{wave:id}),{wave:id});
  assert.deepEqual(cueSamples({}, {voice:id,gain:.5},24000),recordedSamples(id,24000).map(sample=>sample*.5));
}

assert.deepEqual(normalizeSoundOverrides('glass-breaker',{ice:'off',wave:'bonk',won:'original',other:'bonk'}),{ice:'off',wave:'bonk',won:'original'});
const original=createGameSoundDirector('glass-breaker','original',{wave:'anime-wow'});
const glass=original({type:'ice',energy:300},0);
assert.equal(glass.type,'original');assert.deepEqual(effectSamples(glass),originalGlassSamples({energy:300},48000));
assert.equal(original({type:'wave'},.01).cue.voice,'anime-wow');
assert.equal(original({type:'won'},1),null,'Do not invent a final in the original glass soundtrack');
assert.equal(original({type:'ice'},2),null);
const manual=createGameSoundDirector('spiral-breaker','reactions',{brick:'off',multiply:'resolve',paddle:'original'});
assert.equal(manual({type:'brick'},0),null);
assert.equal(manual({type:'multiply'},0).cue.voice,'resolve','Manual choice wins over preset');
assert.equal(manual({type:'paddle'},.2).type,'original');
assert.equal(manual({type:'won'},.21).cue.voice,'yippee','Unassigned events inherit preset');
const game={balls:[{weapon:'laser'}]},shot={type:'shot',owner:0,x:300,time:1};
const legacy=createDuelSoundEvents()(shot,game),preserved=createDuelSoundEvents('original',{heal:'meme-meow'})(shot,game);
assert.deepEqual(duelEffectSamples(preserved),duelEffectSamples(legacy),'Original weapon samples stay unchanged');
assert.equal(createDuelSoundEvents('meme',{shot:'pluck'})(shot,game).cue.voice,'pluck','Manual override can replace a weapon');
assert.equal(createDuelSoundEvents('original',{shot:'off'})(shot,game),null);
assert.equal(createDuelSoundEvents('original')({type:'win',time:2},game),null,'Original duel had no final cue');
for(const [mode,event] of [['glass-breaker','wave'],['spiral-breaker','multiply'],['ball-duel','heal']]){
  const source={mode,project:{sound:true,soundStyle:'original',soundOverrides:{[event]:'bonk'},referenceMapping:{multiply:'effect-4'}}};
  const recipe=sourceRecipe(validateBatch({source}).source,42);
  assert.equal(recipe.soundStyle,'original');assert.equal(recipe.soundOverrides[event],'bonk');
  if(mode==='spiral-breaker')assert.equal(recipe.referenceMapping.multiply,'effect-4');
}
assert.deepEqual(normalizeRing({soundOverrides:{hit:'original',break:'off',win:'yippee'}}).soundOverrides,{hit:'original',break:'off',win:'yippee'});
const project=process.cwd(),options={events:{effects:[{type:'reference',clip:'effect-4',gain:.4,time:.1}],leaders:[]},recipe:{},duration:2,audio:'effects',project};
const reference=await productionAudio(options);assert.ok(reference.buffer.subarray(44).some(b=>b!==0),'Reference WAV actually appears in exported PCM');
const silent=await productionAudio({...options,audio:'none'});assert.ok(silent.buffer.subarray(44).every(b=>b===0));
await assert.rejects(()=>productionAudio({...options,events:{effects:[{type:'reference',clip:'../../wrong',time:0}],leaders:[]}}),/Geçersiz/);
console.log('PASS: partial overrides, original instruments, silence, preset precedence, queue persistence and reference WAV export.');
