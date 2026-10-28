import assert from 'node:assert/strict';
import {createMergeSound} from '../src/merge-sound.js';
import {directedSamples} from '../src/game-sound-director.js';
const direct=createMergeSound();
const pulses=Array.from({length:16},(_,i)=>direct({type:'spawn'},i*.37));
assert.deepEqual(pulses.slice(0,8).map(e=>e.cue.degree),pulses.slice(8).map(e=>e.cue.degree));
assert.equal(direct({type:'spawn'},5.56),null);
const low=direct({type:'merge',level:1},6),high=direct({type:'merge',level:4},7);
assert.ok(high.cue.degree>low.cue.degree);
assert.equal(direct({type:'merge',level:4},7.01),null);
assert.equal(direct({type:'merge',level:5},8),null);
const final=direct({type:'final'},8);
assert.equal(final.originalType,'complete');
assert.equal(direct({type:'spawn'},9),null);
assert.equal(direct({type:'final'},10),null);
for(const cue of [pulses[0],low,high,final]){
 const samples=directedSamples(cue,24000);
 let peak=0,energy=0;
 for(const n of samples){assert.ok(Number.isFinite(n));peak=Math.max(peak,Math.abs(n));energy+=n*n;}
 assert.ok(peak<1&&energy>0);
 assert.ok(samples.length/24000<1.9);
 assert.ok(Math.abs(samples[0])<.001&&Math.abs(samples.at(-1))<.001);
}
console.log('Merge audio passed: repeating motif, rising rewards, rate limits, single ending, finite non-clipping PCM and faded edges.');
