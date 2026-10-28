import assert from 'node:assert/strict';
import {videoTiming} from '../scripts/video-timing.mjs';

for(const [seconds,target,expected] of [[10.2,55,13],[24.7,55,27],[27,55,29],[28,55,30],[178,55,180],[72.5,30,75],[123.2,55,126],[250,30,252]]){
  const timing=videoTiming(seconds,target);
  assert.equal(timing?.duration??null,expected);
  if(timing)assert.equal(timing.speed,1);
}
assert.deepEqual(videoTiming(10.2,55,{exact:true,intro:3,outro:4}),{duration:18,speed:1});
assert.deepEqual(videoTiming(179,55),{duration:181,speed:1});
assert.deepEqual(videoTiming(10,55,{exact:true,bounded:true}),{duration:12,speed:1});
assert.deepEqual(videoTiming(179,55,{exact:true,bounded:true}),{duration:181,speed:1});
assert.deepEqual(videoTiming(28,55,{exact:true,bounded:true}),{duration:30,speed:1});
for(const invalid of [0,-1,NaN,Infinity])assert.throws(()=>videoTiming(invalid));
console.log('PASS: short and long videos keep their original duration and 1x speed; legacy target durations are ignored.');
