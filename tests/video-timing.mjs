import assert from 'node:assert/strict';
import {videoTiming} from '../scripts/video-timing.mjs';

for(const [seconds,target,expected] of [[10.2,55,null],[24.7,55,null],[27,55,null],[28,55,30],[178,55,180],[72.5,30,75],[123.2,55,126]]){
  const timing=videoTiming(seconds,target);
  assert.equal(timing?.duration??null,expected);
  if(timing)assert.equal(timing.speed,1);
}
assert.deepEqual(videoTiming(10.2,55,{exact:true,intro:3,outro:4}),{duration:18,speed:1});
assert.equal(videoTiming(179,55),null);
assert.equal(videoTiming(10,55,{exact:true,bounded:true}),null);
assert.equal(videoTiming(179,55,{exact:true,bounded:true}),null);
assert.deepEqual(videoTiming(28,55,{exact:true,bounded:true}),{duration:30,speed:1});
console.log('PASS: automatic videos keep 1x simulation speed');
