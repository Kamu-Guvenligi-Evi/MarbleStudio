import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {COLLISION_SOUNDS,collisionEvent,effectSamples} from '../src/impact-audio.js';
import {normalizeProject,serializeProject,parseProject} from '../src/projects.js';
import {normalizeSnapshot} from '../src/studio-transfer.js';
import {sourceRecipe} from '../src/factory-recipes.js';
import {productionAudio} from '../scripts/factory-audio.mjs';

const signatures=new Set();
for(const sound of Object.keys(COLLISION_SOUNDS)){
  const event=collisionEvent({type:'impact',x:270,seed:42},sound),samples=effectSamples(event);
  assert.deepEqual(samples,effectSamples(event));
  assert.ok(samples.every(Number.isFinite));
  assert.ok(samples.some(s=>Math.abs(s)>.03));
  assert.ok(samples.every(s=>Math.abs(s)<1));
  assert.ok(Math.abs(samples.at(-1))<.01);
  signatures.add(createHash('sha256').update(new Uint8Array(samples.buffer,samples.byteOffset,samples.byteLength)).digest('hex'));
  const project=normalizeProject({name:'Ses denemesi',sequence:[],sound:true,collisionSound:sound});
  assert.equal(parseProject(serializeProject(project)).collisionSound,sound);
  const recipe=sourceRecipe(normalizeSnapshot({mode:'track',project}),2048);
  assert.equal(recipe.collisionSound,sound);
  const piRecipe=sourceRecipe(normalizeSnapshot({mode:'pi',project:{digits:1,sound:true,collisionSound:sound}}),2048);
  assert.equal(piRecipe.collisionSound,sound,'Pi snapshots and video recipes preserve the chosen effect');
  const {buffer}=await productionAudio({events:{effects:[{time:0,type:'impact',x:270,seed:42}],leaders:[]},recipe,duration:Math.max(1,samples.length/48000+.02),audio:'effects'});
  for(let i=0;i<samples.length;i++)assert.ok(Math.abs(buffer.readInt16LE(44+i*2)-Math.round(Math.tanh(samples[i]*.35)*30000))<=1);
  assert.deepEqual(effectSamples(collisionEvent({type:'complete'},sound)),effectSamples({type:'complete'}));
}
assert.equal(signatures.size,Object.keys(COLLISION_SOUNDS).length);
assert.equal(normalizeProject({sequence:[]}).collisionSound,'classic');
assert.equal(normalizeProject({sequence:[],collisionSound:'invalid'}).collisionSound,'classic');
for(const sound of ['cash-register','minecraft-villager']){
  const wave=await readFile('public/audio/youtube/'+sound+'.wav'),recorded=effectSamples(collisionEvent({type:'impact'},sound),24000);
  assert.equal(wave.readUInt32LE(24),24000);assert.equal(recorded.length,wave.readUInt32LE(40)/2);
  for(let i=0;i<recorded.length;i++)assert.equal(recorded[i],wave.readInt16LE(44+i*2)/32768,'Live and exported effects contain the downloaded recording');
  for(const rate of [44100,48000]){
    const converted=effectSamples(collisionEvent({type:'impact'},sound),rate);
    assert.ok(Math.abs(converted.length/rate-recorded.length/24000)<1/rate);
    assert.ok(converted.every(Number.isFinite));assert.ok(converted.some(s=>Math.abs(s)>.5));
  }
}
console.log('PASS: distinct collision sounds, bounded audio, project round trips and matching MP4 audio, including the first recorded effect at time zero.');
