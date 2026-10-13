import assert from 'node:assert/strict';
import {Arena,sweptLinkContact} from '../src/arena.js';

const point=(x,y)=>({x,y});
const owner=point(0,0),anchor=point(200,0);
assert.equal(sweptLinkContact(point(100,-60),point(100,60),owner,owner,anchor,20,25),true,'A fast ball crosses the entire string between ticks');
assert.equal(sweptLinkContact(point(100,21),point(160,21),owner,owner,anchor,20,25),false,'A nearby parallel pass does not cut');
assert.equal(sweptLinkContact(point(220,0),point(220,0),owner,owner,anchor,20,25),true,'Contact with the wall anchor cuts');
assert.equal(sweptLinkContact(point(0,0),point(0,0),owner,owner,anchor,20,25),false,'The hidden section inside the owner is excluded');
assert.equal(sweptLinkContact(point(100,0),point(100,0),point(0,-100),point(0,100),anchor,10,25),true,'A moving string can sweep across a stationary ball');
assert.equal(sweptLinkContact(point(20,-50),point(20,150),point(0,-100),point(0,100),point(200,200),5,0),false,'Intersecting spatial sweeps at different times are not a contact');

function crossing({born=0,time=2,links=1}={}){
  const hits=[],arena=new Arena({count:3,rule:'timed',onHit:(...args)=>hits.push(args)});
  arena.start();arena.time=time;
  const positions=[point(270,510),point(380,450),point(150,600)];
  arena.balls.forEach((ball,i)=>{ball.body.position=positions[i];ball.body.velocity=point(0,i===1?14400:0);});
  arena.links=Array.from({length:links},(_,i)=>({owner:0,x:508,y:510+i*.01,born}));
  arena.step();return {arena,hits};
}
const {arena,hits}=crossing({links:100});
assert.equal(arena.links.length,0,'Every crossed string is removed');
assert.equal(arena.totalCuts,100);assert.equal(arena.balls[1].cuts,100);
assert.equal(hits.filter(([strength])=>strength===6).length,1,'A dense fan slice plays one cut sound');
assert.equal(arena.events.length,1);assert.equal(arena.particles.length,7,'A fan slice emits one particle burst');
assert.equal(crossing({born:1.9}).arena.links.length,0,'Recently created strings cut immediately on contact');
assert.equal(crossing({time:0}).arena.links.length,0,'Opening contacts are not ignored');
assert.equal(crossing().arena.totalCuts,1,'Fast crossing regression is fixed');
const edge=new Arena({count:3,rule:'timed'});edge.start();edge.time=2;
edge.balls.forEach((b,i)=>{b.body.position=[point(270,510),point(380,530.5),point(150,600)][i];b.body.velocity=point(0,0);});
edge.links=[{owner:0,x:508,y:510,born:2}];edge.step();
assert.equal(edge.totalCuts,1,'Visible string thickness is included in a grazing contact');
const justBorn=crossing({born:2+1/120});
assert.equal(justBorn.arena.totalCuts,0,'A string born at the end of a tick cannot cut a past crossing');
console.log('Arena swept cuts, moving strings, near misses, immediate contacts and bounded effects passed.');
