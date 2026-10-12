import assert from 'node:assert/strict';
import {TerritoryBattle,TERRITORY_SHAPES,TERRITORY_BUFFS} from '../src/territory.js';
import {normalizeSnapshot,createBackup,parseBackup} from '../src/studio-transfer.js';

const make=options=>new TerritoryBattle({arenaShape:'square',count:2,...options});
const battle=make(),[attacker,victim]=battle.balls;
const next=battle.neighbors(attacker.cell)[0];
victim.trail=[next];battle.trailOwners[next]=victim.id;victim.shieldUntil=5;
attacker.route=[next];battle.advance(attacker);
assert.equal(victim.eliminatedAt,null,'Invincibility protects an exposed trail');
assert.deepEqual(victim.trail,[next],'Crossing a shielded trail does not erase it');
const before=attacker.area+victim.area;battle.time=5;
assert.equal(battle.eliminate(victim,attacker),true,'Protection expires exactly on time');
assert.equal(attacker.area,before);assert.equal(victim.area,0);
assert.equal(battle.trailOwners[next],-1);assert.deepEqual(victim.route,[]);
assert.equal(battle.eliminate(victim,attacker),false,'A victim can only be eliminated once');
battle.start();battle.step();assert.equal(battle.state,'finished');assert.deepEqual(battle.winners,[attacker]);

const contact=make(),[hunter,greedy]=contact.balls;
const hit=contact.neighbors(hunter.cell)[0];
greedy.cell=hit;greedy.trail=[contact.neighbors(hit)[0]];hunter.route=[hit];
contact.advance(hunter);assert.equal(greedy.eliminatedAt,0,'Touching an exposed body also eliminates it');
const safe=make(),[visitor,defender]=safe.balls;
visitor.route=[defender.cell];safe.advance(visitor);
assert.equal(defender.eliminatedAt,null,'A player inside their own territory is safe');

const pickup=make(),runner=pickup.balls[0];
pickup.pickups=[{type:'speed',cell:runner.cell},{type:'shield',cell:runner.cell}];
pickup.time=2;pickup.collectPickups(runner);
assert.equal(TERRITORY_BUFFS.speed.duration,2);assert.equal(TERRITORY_BUFFS.shield.duration,1.5);
assert.equal(runner.speedUntil,4);assert.equal(runner.shieldUntil,3.5);assert.equal(pickup.pickups.length,0);
pickup.time=3.49;assert.equal(pickup.protected(runner),true);
pickup.time=3.5;assert.equal(pickup.protected(runner),false);assert.equal(pickup.speed(runner),1.8);
pickup.time=4;assert.equal(pickup.speed(runner),1);
assert.ok(TERRITORY_BUFFS.speed.multiplier>1);
const plain=make(),fast=make();
for(const race of [plain,fast]){
  const b=race.balls[0],start=40*80+30;
  b.cell=start;b.body.position=race.position(start);b.route=Array.from({length:20},(_,i)=>start+i+1);
  for(let i=0;i<=20;i++)race.setOwner(start+i,b.id);
  race.balls[1].cell=race.balls[1].home;race.start();
}
fast.balls[0].speedUntil=5;plain.step(140);fast.step(140);
assert.ok(fast.balls[0].cell>plain.balls[0].cell,'The speed pickup changes actual movement');
plain.time=6;fast.time=6;plain.balls[0].phase=0;fast.balls[0].phase=0;
const p0=plain.balls[0].cell,f0=fast.balls[0].cell;plain.step(70);fast.step(70);
assert.equal(plain.balls[0].cell-p0,fast.balls[0].cell-f0,'Normal speed resumes after expiry');

const shieldedLoss=make(),[conqueror,protectedRunner]=shieldedLoss.balls;
protectedRunner.shieldUntil=5;
for(const i of shieldedLoss.valid)if(shieldedLoss.cells[i]===protectedRunner.id)shieldedLoss.setOwner(i,conqueror.id);
protectedRunner.lastConqueror=conqueror.id;shieldedLoss.start();shieldedLoss.step(100);
assert.equal(protectedRunner.eliminatedAt,null);shieldedLoss.time=5;shieldedLoss.step();
assert.notEqual(protectedRunner.eliminatedAt,null,'A shield postpones elimination after losing all land');

for(const arenaShape of Object.keys(TERRITORY_SHAPES))for(const count of [2,3,20]){
  const race=make({arenaShape,count});assert.equal(race.balls.length,count);
  assert.equal(race.balls.reduce((sum,b)=>sum+b.area,0),count*9,'Starting territories do not overlap');
  const snapshot=normalizeSnapshot({mode:'arena',project:{arenaGame:'territory',arenaShape,count,sequence:[]}});
  assert.equal(snapshot.project.count,count);assert.equal(snapshot.project.arenaShape,arenaShape);
  race.start();while(race.state==='running')race.step(1000/30);
  for(const b of race.balls){assert.equal(b.area,race.valid.filter(i=>race.cells[i]===b.id).length);if(b.eliminatedAt!==null){assert.equal(b.area,0);assert.equal(b.trail.length,0);}}
  assert.ok(race.valid.every(i=>race.cells[i]<0||race.balls[race.cells[i]].eliminatedAt===null));
}
for(const count of [1,21,2.5])assert.throws(()=>normalizeSnapshot({mode:'arena',project:{arenaGame:'territory',count}}));
assert.throws(()=>normalizeSnapshot({mode:'arena',project:{arenaGame:'links',count:3}}));
const entry=JSON.stringify({mode:'arena',arenaGame:'territory',arenaShape:'turkey',count:3,sequence:[]});
const storage={length:1,key:()=> 'marble-studio-territory-v1',getItem:()=>entry};
assert.equal(parseBackup(JSON.stringify(createBackup(storage))).entries['marble-studio-territory-v1'],entry);
console.log('PASS: exposed body contact, home safety, shields, expiry, speed, early victory, map spawning, ownership accounting, 2–20 players and backup.');
