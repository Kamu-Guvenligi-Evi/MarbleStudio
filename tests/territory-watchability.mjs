import assert from 'node:assert/strict';
import {TerritoryBattle} from '../src/territory.js';
import {territoryHighlights} from '../src/territory-renderer.js';
// A growing field, a protected opening, and deterministic ownership on the new tall grid.
const durations=[];
for(const count of [8,12])for(const seed of [2048,42,7,63]){
 const r=new TerritoryBattle({arenaShape:'portrait',count,seed}),copy=new TerritoryBattle({arenaShape:'portrait',count,seed});
 assert.ok(r.valid.length*36/(540*960)>.5);r.start();copy.start();
 while(r.state==='running'){
  r.step(1000/60);copy.step(1000/60);
  if(r.time<2.5){assert.equal(r.totalCuts,0);assert.ok(r.balls.every(b=>b.area>=9));}
  if(Math.abs(r.time-10)<.001)assert.ok(r.balls.filter(b=>b.eliminatedAt===null).length>=4);
 }
 // A successful interception can end a risky crowded match early. Keep the
 // opening readable and typical matches substantial without forcing a survivor.
 durations.push(r.time);assert.ok(r.time>=15);assert.ok(r.totalClaims>=12);assert.ok(r.totalCuts>0);
 if(r.time<25)assert.equal(r.totalCuts,count-1,'An early ending requires a real last-player-standing win');
 assert.deepEqual(r.cells,copy.cells);assert.deepEqual(r.winners.map(b=>b.id),copy.winners.map(b=>b.id));
 assert.equal(r.balls.reduce((n,b)=>n+b.area,0),r.valid.filter(i=>r.cells[i]>=0).length);
}
assert.ok(durations.filter(t=>t>=25).length>=6,'Most seeded matches must retain a sustained middle game');
assert.ok(durations.reduce((sum,t)=>sum+t,0)/durations.length>=30);
const r=new TerritoryBattle({arenaShape:'square',count:3});r.time=4;
const [attacker,victim]=r.balls;victim.trail=[victim.cell];const lost=victim.area;
assert.ok(r.eliminate(victim,attacker));const elimination=r.events[0];
assert.equal(elimination.changedCells.length,lost);assert.equal(elimination.trail.length,1);assert.ok(Number.isFinite(elimination.position.x));
r.events.unshift({type:'claim',owner:2,time:4.1,cells:10});r.time=5.5;
assert.equal(territoryHighlights(r).headline,elimination,'A capture cannot hide the recent elimination');
r.events.unshift({...elimination,owner:2,time:5.4});assert.equal(territoryHighlights(r).feed.length,2,'Simultaneous cuts retain their own feed entries');
console.log('PASS: portrait occupancy, protected homes, readable opening and match duration, captures, replay, area accounting, effect payloads and elimination priority.');
