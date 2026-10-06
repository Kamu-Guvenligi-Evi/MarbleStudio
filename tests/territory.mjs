import assert from 'node:assert/strict';
import {Arena} from '../src/arena.js';
import {TerritoryBattle,TERRITORY_SHAPES} from '../src/territory.js';
import {normalizeSnapshot} from '../src/studio-transfer.js';
import {sourceRecipe,structure} from '../src/factory-recipes.js';
import {contentKeys} from '../scripts/repetition-guard.mjs';

const create=options=>new Arena({arenaGame:'territory',count:6,...options});
const fence=create({arenaShape:'square'}),b=fence.balls[0];
for(const i of fence.valid)fence.setOwner(i,-1);
for(let y=20;y<=30;y++)fence.setOwner(y*80+20,b.id);
for(let x=21;x<=30;x++){b.trail.push(20*80+x,30*80+x);}
for(let y=21;y<30;y++)b.trail.push(y*80+30);
for(const i of b.trail)fence.trailOwners[i]=b.id;
fence.setOwner(25*80+25,1);fence.capture(b);
assert.equal(fence.cells[25*80+25],0,'An enclosed rival cell changes hands');
assert.equal(b.area,121,'Only the closed 11 by 11 region is filled');
assert.equal(fence.balls[1].area,0);assert.equal(b.trail.length,0);
const fight=create({arenaShape:'square'}),attacker=fight.balls[0],victim=fight.balls[1],target=fight.neighbors(attacker.cell)[0];
victim.trail=[target];fight.trailOwners[target]=victim.id;attacker.route=[target];fight.advance(attacker);
assert.equal(attacker.cuts,1);assert.equal(victim.trail.length,0);assert.equal(victim.eliminatedAt,null,'A cut cancels the excursion; the racer stays in the battle');
for(const shape of Object.keys(TERRITORY_SHAPES))for(const count of [6,20]){
 const a=create({arenaShape:shape,count,territoryDuration:30}),replay=create({arenaShape:shape,count,territoryDuration:30});
 assert.ok(a instanceof TerritoryBattle);const mask=[...a.cells].map(x=>x===-2);a.start();replay.start();
 while(a.state==='running'){
  a.step(1000/30);replay.step(1000/30);
  for(const ball of a.balls){assert.notEqual(a.cells[ball.cell],-2);assert.ok(Number.isFinite(ball.body.position.x));assert.ok(Number.isFinite(ball.body.position.y));}
 }
 assert.equal(a.time,30);assert.ok(a.totalClaims>0);assert.ok(a.winners.length>0);
 assert.equal(a.winners[0].area,Math.max(...a.balls.map(b=>b.area)));
 assert.deepEqual(a.cells,replay.cells);assert.deepEqual(a.balls.map(b=>b.body.position),replay.balls.map(b=>b.body.position));
 assert.deepEqual([...a.cells].map(x=>x===-2),mask,'The shape boundary never changes');
 assert.equal(a.balls.reduce((n,b)=>n+b.area,0),a.valid.filter(i=>a.cells[i]>=0).length);
 assert.ok(a.balls.reduce((n,b)=>n+a.share(b),0)<=100.00001);
 const frozen=structuredClone(a.balls.map(b=>b.body.position));a.step(1000);assert.deepEqual(a.balls.map(b=>b.body.position),frozen);
 const source=normalizeSnapshot({mode:'arena',project:{sequence:[],name:'Territory',seed:2048,count,arenaGame:'territory',arenaShape:shape,territoryDuration:30,ballNames:['Our racer']}}),r=sourceRecipe(source,2048);
 assert.equal(r.arenaShape,shape);assert.equal(r.territoryDuration,30);assert.equal(r.ballNames[0],'Our racer');assert.equal(structure(r),structure({...r,arenaShape:shape}));
 assert.notEqual(contentKeys(r).similar,contentKeys({...r,arenaGame:'links'}).similar);
}
assert.throws(()=>normalizeSnapshot({mode:'arena',project:{arenaGame:'territory',arenaShape:'bad'}}));
assert.throws(()=>normalizeSnapshot({mode:'arena',project:{arenaGame:'territory',territoryDuration:999}}));
console.log('PASS: enclosed capture, stolen land, interrupted trails, five bounded shapes, 6/20 racers, deterministic replay, timed winners and export roundtrip.');
