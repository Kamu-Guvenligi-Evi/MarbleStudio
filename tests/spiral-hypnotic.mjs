import assert from 'node:assert/strict';
import {CONFIG,quantizeNote,createNotePlanner} from '../src/spiral-hypnotic-audio.js';
import {Spiral} from '../src/spiral.js';
import {normalizeSnapshot} from '../src/studio-transfer.js';
import {serializeProject,parseProject} from '../src/projects.js';
import {sourceRecipe} from '../src/factory-recipes.js';
import {productionAudio} from '../scripts/factory-audio.mjs';

const originalBpm=CONFIG.bpm;
for(const bpm of [60,65,70]){
  CONFIG.bpm=bpm;
  for(let time=0;time<10;time+=.007){const note=quantizeNote(time);assert.ok(note.when>=time);assert.ok(note.delay<=CONFIG.maxDelay+1e-9);}
}
CONFIG.bpm=originalBpm;
const planner=createNotePlanner(),scale=new Set([0,2,4,7,9]);
for(let i=0;i<=100;i++){
  const note=planner.plan({progress:i/100,x:540},i);
  assert.ok(scale.has(note.midi%12));assert.ok(note.midi>=48&&note.midi<=84);assert.equal(note.pan,.6);
}
planner.reset();const arpeggio=Array.from({length:4},(_,i)=>planner.plan({progress:0,x:0},i*.035));
assert.equal(arpeggio[0].pan,-.6);for(let i=1;i<4;i++)assert.ok(arpeggio[i].midi>arpeggio[i-1].midi);
planner.reset();assert.equal(planner.plan({progress:1,x:270},0).midi,84);
const snapshot=normalizeSnapshot({mode:'spiral',project:{seed:2048,count:1,sequence:[],spiralHypnotic:true,spiralHypnoticMuted:false}});
assert.equal(parseProject(serializeProject(snapshot.project)).spiralHypnotic,true);
assert.equal(sourceRecipe(snapshot,2048).spiralHypnotic,true);
assert.equal(normalizeSnapshot({mode:'spiral',project:{count:1,sequence:[]}}).project.spiralHypnotic,false);
assert.throws(()=>normalizeSnapshot({mode:'spiral',project:{count:1,sequence:[],spiralHypnotic:'true'}}));
assert.throws(()=>normalizeSnapshot({mode:'spiral',project:{count:1,sequence:[],spiralHypnoticMuted:1}}));
const silence=await productionAudio({events:{effects:[],leaders:[]},recipe:{mode:'spiral',spiralHypnotic:true,spiralHypnoticMuted:true},duration:1,audio:'all'});
assert.ok(silence.buffer.subarray(44).every(value=>value===0));
await assert.rejects(productionAudio({events:{effects:[],leaders:[]},recipe:{mode:'spiral',spiralHypnotic:true},duration:1,audio:'all'}),/Web Audio/);
// Identical physics with/without a sound observer; never touch the simulation.
const pitches=createNotePlanner(),plain=new Spiral({seed:2048}),observed=new Spiral({seed:2048,onHit:(_strength,x,event)=>{if(event.type==='ice')pitches.plan({x,progress:observed.progress},observed.time);}});
plain.start();observed.start();for(let i=0;i<2400;i++){plain.step();observed.step();}
assert.equal(observed.totalBreaks,plain.totalBreaks);assert.equal(observed.totalConsumed,plain.totalConsumed);
assert.deepEqual(observed.balls.map(b=>b.body.position),plain.balls.map(b=>b.body.position));assert.deepEqual(observed.ice.cells,plain.ice.cells);
console.log('PASS: pentatonic three-octave pitch range, rising bursts, 60–70 BPM timing below 120 ms, panning, saved/exported settings, mute and unchanged spiral simulation.');
