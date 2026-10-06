import assert from 'node:assert/strict';
import {LeaderMusic} from '../src/leader-music.js';

const nodes=[];
const context={currentTime:0,destination:{},createGain:()=>({gain:{value:1},connect(){}}),createBufferSource(){
  const node={connect(){},disconnect(){},start(when,offset){this.offset=offset;this.started=when;},stop(){this.stopped=context.currentTime;}};
  nodes.push(node);return node;
}};
const music=new LeaderMusic(()=>({context,destination:{}}));
const track={src:'/test.mp3'};music.buffers.set(track.src,{duration:10});
music.switchTo('tr',track);context.currentTime=3;
music.switchTo('cn',track);
assert.equal(nodes[0].stopped,3);assert.equal(nodes[1].started,3);
assert.equal(nodes[1].offset,0,'Countries using the same file have separate positions');
context.currentTime=5;music.switchTo('tr',track);
assert.equal(nodes[2].offset,3,'Turkey resumes from its previous position');
const count=nodes.length;music.switchTo('tr',track);assert.equal(nodes.length,count);
context.currentTime=6;music.pause();context.currentTime=20;music.switchTo('tr',track);
assert.equal(nodes.at(-1).offset,4,'Paused time does not advance the cursor');
context.currentTime=29;music.switchTo('cn',track);assert.equal(nodes.at(-1).offset,2);
music.switchTo(null,undefined);assert.equal(music.current,null,'Unassigned leader stops previous music');
music.switchTo('tr',track);assert.equal(nodes.at(-1).offset,3,'Looped audio resumes modulo duration');
music.reset();music.switchTo('tr',track);assert.equal(nodes.at(-1).offset,0);
music.setVolume(.17);assert.equal(music.gain.gain.value,.17);
music.reset();music.buffers.set('/unused.mp3',{duration:5});music.retain([track]);
assert.ok(music.buffers.has(track.src));assert.ok(!music.buffers.has('/unused.mp3'));
console.log('PASS: immediate switches, independent country cursors, pause, looping, silence and new-race reset.');
