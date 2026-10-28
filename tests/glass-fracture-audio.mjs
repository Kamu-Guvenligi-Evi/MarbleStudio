import assert from 'node:assert/strict';
import {glassFractureSamples} from '../src/glass-fracture-audio.js';
import {createGameSoundDirector} from '../src/game-sound-director.js';
import {effectSamples} from '../src/impact-audio.js';

for(const rate of [44100,48000])for(const energy of [0,200,400,800])for(let degree=0;degree<4;degree++){
  const event={energy,cue:{degree}},pcm=glassFractureSamples(event,rate);
  assert.equal(pcm,glassFractureSamples(event,rate),'Repeated impacts reuse PCM');
  assert.ok(pcm.length>=rate*.36&&pcm.length<=rate*.436);
  assert.ok(pcm.every(Number.isFinite));
  const peak=pcm.reduce((a,b)=>Math.max(a,Math.abs(b)),0);
  assert.ok(peak>.1&&peak<.9,'Audible fracture with headroom');
  assert.equal(pcm[0],0);
  assert.ok(Math.abs(pcm.at(-1))<.00001,'Tail fades without a cut');
}
assert.notDeepEqual(glassFractureSamples({cue:{degree:0}}),glassFractureSamples({cue:{degree:1}}));
for(const style of ['balanced','original']){
  const event=createGameSoundDirector('glass-breaker',style)({type:'ice',energy:400},0);
  assert.deepEqual(effectSamples(event),glassFractureSamples(event),'Live and export use the fracture instrument');
}
const manual=createGameSoundDirector('glass-breaker','balanced',{ice:'glass'})({type:'ice'},0);
assert.notDeepEqual(effectSamples(manual),glassFractureSamples(manual),'Explicit instrument overrides remain available');
console.log('PASS: glass fracture variants, cache, headroom, fades and live/export routing.');
