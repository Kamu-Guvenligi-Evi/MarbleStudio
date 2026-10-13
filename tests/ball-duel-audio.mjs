import assert from 'node:assert/strict';
import {createDuelSoundEvents} from '../src/ball-duel-audio.js';
import {effectSamples} from '../src/impact-audio.js';
import {productionAudio} from '../scripts/factory-audio.mjs';

const game={balls:[{weapon:'blaster'},{weapon:'rocket'}]},signatures=new Set();
const events=[];
for(const sound of ['wall','bounce','hit','blaster','burst','scatter','rocket','blade','laser','pickup','heal']){
  game.balls[0].weapon=sound;
  const type=['blaster','burst','scatter','rocket','blade','laser'].includes(sound)?'shot':sound;
  const event=createDuelSoundEvents()({type,time:0,x:300,owner:0,strength:1},game);
  assert.equal(event.duelSound,sound);
  const samples=effectSamples(event);
  assert.deepEqual(samples,effectSamples(event));
  assert.ok(samples.every(Number.isFinite)&&samples.every(s=>Math.abs(s)<1));
  assert.ok(samples.some(s=>Math.abs(s)>.15),'each effect has an audible signal');
  assert.ok(Math.abs(samples.at(-1))<.01);
  signatures.add(JSON.stringify([...samples.slice(100,120)]));events.push({...event,time:events.length*.5});
}
assert.equal(signatures.size,11);
const gate=createDuelSoundEvents(),wall={type:'wall',time:0,x:300,owner:0};
assert.ok(gate(wall,game,0));assert.equal(gate(wall,game,.01),null);assert.ok(gate(wall,game,.1));
assert.ok(gate({...wall,type:'hit'},game,.1));assert.ok(gate({...wall,type:'heal'},game,.1));
assert.ok(gate({...wall,owner:1},game,.1));
const hit={type:'duel',duelSound:'hit',strength:3};
assert.notDeepEqual(effectSamples(hit),effectSamples({...hit,strength:1}));
assert.ok(effectSamples(hit).every(s=>Math.abs(s)<1));
const options={events:{effects:events,leaders:[]},recipe:{},duration:6,audio:'effects'};
const {buffer}=await productionAudio(options);
for(const event of events){
  const samples=effectSamples(event),start=Math.floor(event.time*48000);
  for(let i=0;i<samples.length;i++)assert.ok(Math.abs(buffer.readInt16LE(44+(start+i)*2)-Math.round(Math.tanh(samples[i]*.35)*30000))<=1);
}
const muted=await productionAudio({...options,audio:'none'});
assert.ok(muted.buffer.subarray(44).every(b=>b===0));
console.log('PASS: 11 distinct duel effects, bounded deterministic samples, separate event channels, damage strength and matching export audio.');
