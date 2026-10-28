import assert from 'node:assert/strict';
import {EffectVoicePlayer} from '../src/effect-voices.js';
let allocations=0,copies=0;const sources=[];
const node=()=>({connect(){},disconnect(){}});
const context={state:'running',currentTime:0,sampleRate:48000,
 createBuffer(channels,length,rate){allocations++;return {duration:length/rate,copyToChannel(){copies++;}};},
 createBufferSource(){const source={...node(),start(){},stop(){}};sources.push(source);return source;},
 createStereoPanner(){return {...node(),pan:{value:0}};},
 createGain(){return {...node(),gain:{cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}}};}
};
const player=new EffectVoicePlayer(context,node()),samples=new Float32Array(4800);
for(let i=0;i<100;i++){context.currentTime=i*.01;assert.equal(player.play({type:'hit'},samples),true);}
assert.equal(allocations,1);assert.equal(copies,1);assert.equal(new Set(sources).size,100);
assert.equal(new Set(sources.map(s=>s.buffer)).size,1);assert.ok(player.voices.size<=8);assert.ok(player.releasing.size<=8);
player.play({type:'other'},new Float32Array(2400));assert.equal(allocations,2);
player.stop();assert.equal(player.voices.size+player.releasing.size,0);
console.log('PASS: 100 retriggers share one PCM buffer with independent playback; different samples remain separate.');
