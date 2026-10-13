import assert from 'node:assert/strict';
import {RockPaperScissors,TYPES,BEATS,ARENA,RPS_MAPS,normalizeRps,resolveTypes} from '../src/rock-paper-scissors.js';
assert.equal(normalizeRps({count:500,seed:-1,speed:99}).count,20);
assert.equal(normalizeRps({seed:-1}).seed,42);
for(const winner of TYPES){
  assert.equal(resolveTypes(winner,winner),null);
  for(const reversed of [false,true]){
    const g=new RockPaperScissors(),a={...g.pieces[0],type:winner,x:200,y:400,vx:92,vy:0},b={...g.pieces[1],type:BEATS[winner],x:220,y:400,vx:-92,vy:0};
    const events=[];g.onEvent=e=>events.push(e);g.contact(...(reversed?[b,a]:[a,b]));
    assert.equal(a.type,winner);assert.equal(b.type,winner);assert.equal(g.conversions,1);
    assert.equal(events[0].previous,BEATS[winner]);assert.ok(a.vx<0&&b.vx>0,'contact bounces');
  }
}
// A last surviving piece can grow again; victory depends on all pieces, not the lead.
const comeback=new RockPaperScissors({count:10});
for(const p of comeback.pieces)p.type='scissors';
comeback.pieces[0].type='rock';comeback.pieces[0].x=200;comeback.pieces[0].y=400;
comeback.pieces[1].x=220;comeback.pieces[1].y=400;
comeback.contact(comeback.pieces[0],comeback.pieces[1]);assert.equal(comeback.counts().rock,2);
for(const p of comeback.pieces)p.type='paper';
let finals=0;comeback.onEvent=e=>{if(e.type==='win')finals++;};comeback.step(1/120);comeback.step(1);
assert.equal(comeback.winner,'paper');assert.equal(finals,1);
const first=new RockPaperScissors({seed:42}),replay=new RockPaperScissors({seed:42});
for(let i=0;i<1800;i++){first.step(1/120);replay.step(1/120);}
assert.deepEqual(first.pieces,replay.pieces);assert.equal(first.conversions,replay.conversions);assert.ok(first.conversions>0);
assert.notDeepEqual(new RockPaperScissors({seed:43}).pieces,new RockPaperScissors({seed:42}).pieces);
const outcomes=[];
function obstacleDistance(p,o){
  if(o.shape==='circle')return Math.hypot(p.x-o.x,p.y-o.y)-o.r;
  if(o.shape==='capsule'){
    const along=(p.x-o.x)*Math.cos(o.angle)+(p.y-o.y)*Math.sin(o.angle);
    const across=-(p.x-o.x)*Math.sin(o.angle)+(p.y-o.y)*Math.cos(o.angle);
    return Math.hypot(Math.max(0,Math.abs(along)-o.half),across)-o.r;
  }
  return Math.hypot(p.x-Math.max(o.x,Math.min(o.x+o.width,p.x)),p.y-Math.max(o.y,Math.min(o.y+o.height,p.y)));
}
for(const [map,definition] of Object.entries(RPS_MAPS))if(definition.moving){
  const a=new RockPaperScissors({map}),b=new RockPaperScissors({map}),start=structuredClone(a.obstacles);
  for(let i=0;i<600;i++){a.step(1/120);b.step(1/120);}
  assert.notDeepEqual(a.obstacles,start,`${map} moves`);assert.deepEqual(a.pieces,b.pieces);assert.deepEqual(a.obstacles,b.obstacles);
}
for(const map of Object.keys(RPS_MAPS))for(const count of [10,20,30])for(const seed of [1,42,987]){
  const g=new RockPaperScissors({seed,count,map});
  for(const p of g.pieces)for(const o of g.obstacles)assert.ok(obstacleDistance(p,o)>=p.r,`${map}: clear spawn`);
  while(g.state==='running'){
    g.step(1/60);
    assert.equal(Object.values(g.counts()).reduce((a,b)=>a+b,0),count*3);
    for(const p of g.pieces){
      assert.ok(Number.isFinite(p.x+p.y+p.vx+p.vy));assert.ok(p.x>=ARENA.x+p.r&&p.x<=ARENA.x+ARENA.size-p.r&&p.y>=ARENA.y+p.r&&p.y<=ARENA.y+ARENA.size-p.r);
      for(const o of g.obstacles){
        const distance=obstacleDistance(p,o);
        assert.ok(distance>=p.r-1e-6,`${map}: piece stays outside obstacle`);
      }
    }
  }
  assert.ok(g.time<181);if(g.winner)assert.equal(g.counts()[g.winner],count*3);
  outcomes.push({map,count,seed,winner:g.winner,seconds:Math.round(g.time),conversions:g.conversions});
}
const timeout=new RockPaperScissors();timeout.time=180;timeout.step(1/120);assert.equal(timeout.state,'timeout');assert.equal(timeout.winner,null);
const circleGame=new RockPaperScissors({map:'orbit'}),obstacle=circleGame.obstacles[0];
const p={x:270,y:obstacle.y-obstacle.r-9,r:10.5,vx:0,vy:90};circleGame.obstacleContact(p,obstacle);assert.ok(p.vy<0);
console.log(`PASS: conversion directions, bounce, comeback, victory, timeout, deterministic moving maps, clear spawn, fixed population, arena/obstacle bounds, ${outcomes.length} full matches across ${Object.keys(RPS_MAPS).length} maps.`);
console.log(JSON.stringify(Object.keys(RPS_MAPS).map(map=>{const games=outcomes.filter(g=>g.map===map);return {map,matches:games.length,draws:games.filter(g=>!g.winner).length,shortest:Math.min(...games.map(g=>g.seconds)),longest:Math.max(...games.map(g=>g.seconds))};})));
