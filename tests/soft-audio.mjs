import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {SOFT_SOUNDS,SOFT_INSTRUMENTS,SOFT_PHRASES,isSoftNote,softSamples,createNoteClimb} from '../src/soft-audio.js';
import {cueSamples,frequency,softPlan,validatePlan} from '../src/sound-plan.js';
import {createGameSoundDirector} from '../src/game-sound-director.js';
import {collisionEvent,createCollisionNotes,effectSamples} from '../src/impact-audio.js';
import {productionAudio} from '../scripts/factory-audio.mjs';
import {ringSoundTrace} from '../src/ring-sound-trace.js';

const plan={root:48,scale:'pentatonic'},hashes=new Set();
for(const rate of [24000,44100,48000])for(const voice of Object.keys(SOFT_SOUNDS))for(const gain of [.42,.8]){
  const samples=cueSamples(plan,{voice,degree:0,gain},rate);
  assert(samples.length>rate*.3&&samples.length<rate*2);
  assert(samples.every(s=>Number.isFinite(s)&&Math.abs(s)<=gain));
  assert(samples.some(s=>Math.abs(s)>.05));
  assert(Math.abs(samples[0])<.0001&&Math.abs(samples.at(-1))<.0001,'Click-free endpoints');
  assert.deepEqual(samples,cueSamples(plan,{voice,degree:0,gain},rate));
  if(rate===48000&&gain===.42)hashes.add(createHash('sha256').update(Buffer.from(samples.buffer)).digest('hex'));
}
assert.equal(hashes.size,Object.keys(SOFT_SOUNDS).length,'Every sound has distinct PCM');
for(const [voice,phrase] of Object.entries(SOFT_PHRASES)){
  assert.equal(isSoftNote(voice),false,'A full phrase must not advance the contact counter');
  assert.equal(phrase.steps.length,phrase.times.length);
  assert.equal(phrase.times[0],0);
  assert(phrase.times.every((t,i)=>!i||t>phrase.times[i-1]));
  const degrees=[];
  softSamples(voice,d=>{degrees.push(d);return frequency(plan,d,1);},2,.42,24000);
  assert.deepEqual(degrees,phrase.steps.map(d=>d+2),'Phrase transposes entirely within the selected scale');
  const trace=ringSoundTrace({seed:6,speed:1}),score=softPlan(trace,'harp',voice);
  assert.deepEqual(validatePlan(score,trace),score);
  const accents=score.cues.filter(c=>c.voice===voice);
  assert(accents.length>0,'Selected motif is actually used');
  let previous=-Infinity;
  for(const cue of accents){const event=trace.events[cue.eventId];assert.equal(event.type,'break');assert(event.time-previous>=1.1);previous=event.time;}
  assert.equal(score.cues.at(-1).voice,'soft-resolve');
}
// Verify the strongest spectral peak follows the scale, not merely cue metadata.
for(const name of Object.keys(SOFT_INSTRUMENTS))for(let degree=0;degree<=10;degree++){
  const f=frequency(plan,degree,1),rate=24000,s=cueSamples(plan,{voice:'soft-'+name,degree,gain:.42},rate);
  const power=freq=>{let re=0,im=0;for(let i=0;i<Math.min(s.length,rate*.3);i++){re+=s[i]*Math.cos(2*Math.PI*freq*i/rate);im+=s[i]*Math.sin(2*Math.PI*freq*i/rate);}return re*re+im*im;};
  assert(power(f)>power(f*2**(1/12))*10&&power(f)>power(f*2**(-1/12))*10,'Fundamental is in tune');
}
const climb=createNoteClimb();
assert.deepEqual(Array.from({length:14},(_,i)=>climb(i*.15)),[0,1,2,3,4,5,6,7,8,9,10,10,10,10]);
assert.equal(climb(4),0,'Pause restarts phrase');assert.equal(climb(0),0,'Timeline rewind restarts');
for(const name of Object.keys(SOFT_INSTRUMENTS)){
  for(const mode of ['glass-breaker','spiral-breaker','ball-duel']){
    const decide=createGameSoundDirector(mode,'melodic-'+name),degrees=[];
    for(let i=0;i<8;i++)degrees.push(decide({type:'hit'},i*.15).cue.degree);
    assert.deepEqual(degrees,[0,1,2,3,4,5,6,7]);
    assert.equal(decide({type:'hit'},1.06),null,'Dense contacts do not overwhelm soft notes');
    assert.equal(decide({type:'win'},1.07).cue.voice,'soft-resolve','Final bypasses cooldown');
  }
  for(const speed of [.5,1,2]){
    const trace=ringSoundTrace({seed:6,speed}),score=softPlan(trace,name);
    assert.deepEqual(validatePlan(score,trace),score);assert(score.sections.every(s=>s.musicGain===0));
    assert.equal(score.cues.at(-1).eventId,trace.events.at(-1).id);
    assert(score.cues.every(c=>c.voice==='soft-'+name||c.voice==='soft-resolve'));
  }
}
const manual=createGameSoundDirector('ring-escape','original',{hit:'soft-piano'});
assert.equal(manual({type:'hit'},0).cue.degree,0);assert.equal(manual({type:'hit'},.2).cue.degree,1);
// Widely spaced contacts avoid voice stealing: compare the full export to live PCM.
const notes=createCollisionNotes(),events=[0,.8,1.6,3.5].map(time=>({type:'impact',time,x:270}));
const live=events.map(e=>notes(collisionEvent(e,'soft-marimba'),e.time));
assert.deepEqual(live.map(e=>e.noteDegree),[0,1,2,0]);
const {buffer}=await productionAudio({events:{effects:events,leaders:[]},recipe:{collisionSound:'soft-marimba'},duration:4.1,audio:'effects'});
for(const event of live){const pcm=effectSamples(event),start=Math.floor(event.time*48000);for(let i=0;i<pcm.length;i++)assert(Math.abs(buffer.readInt16LE(44+2*(start+i))-Math.round(Math.tanh(pcm[i]*.35)*30000))<=1,'Live/export notes match');}
console.log(`PASS: ${hashes.size} distinct soft sounds, 3 sample rates, measured tuning, gentle envelopes, 10 motif schedules, ascending/reset behavior, all instrument presets and live/export PCM parity.`);
