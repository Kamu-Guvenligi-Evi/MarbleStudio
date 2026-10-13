import assert from 'node:assert/strict';
import {TerritoryBattle,TERRITORY_SHAPES} from '../src/territory.js';

function separated(race){
  const live=race.balls.filter(b=>b.eliminatedAt===null);
  for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){
    const a=live[i].body.position,b=live[j].body.position;
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=live[i].body.circleRadius+live[j].body.circleRadius+4-1e-7,`${race.arenaShape}: players ${live[i].id}/${live[j].id} overlap at ${race.time}`);
  }
}
function place(race,b,cell){b.cell=cell;b.body.position=race.position(cell);b.phase=0;b.route=[];}

// A protected body is a physical obstacle; the mover must get around it.
const blocked=new TerritoryBattle({arenaShape:'square',count:2});
const [mover,obstacle]=blocked.balls,start=40*80+30,goal=start+16;
place(blocked,mover,start);place(blocked,obstacle,start+8);
for(const b of blocked.balls)b.shieldUntil=100;
blocked.plan=()=>{};
mover.route=Array.from({length:16},(_,i)=>start+i+1);
for(let i=0;i<360;i++){
  const before={...mover.body.position};blocked.time+=1/120;blocked.move(mover,1/120);
  separated(blocked);
  assert.ok(Math.hypot(mover.body.position.x-before.x,mover.body.position.y-before.y)<=6/.035/120+1e-7,'Avoiding contact must not teleport a player');
}
assert.equal(mover.cell,goal,'A protected obstacle must not permanently stop movement');
assert.ok(blocked.balls.every(b=>b.eliminatedAt===null),'Protected bodies survive contact');

// Head-on players may retreat and reroute, but may never pass through each other.
for(const count of [2,3]){
const headOn=new TerritoryBattle({arenaShape:'square',count});
const left=headOn.balls[0],right=headOn.balls[count-1];
if(count===3)headOn.balls[1].eliminatedAt=0;
place(headOn,left,start);place(headOn,right,start+16);headOn.plan=()=>{};
left.route=Array.from({length:16},(_,i)=>start+i+1);
right.route=Array.from({length:16},(_,i)=>start+15-i);
for(const b of headOn.balls)b.shieldUntil=100;
for(let i=0;i<600;i++){
  headOn.time+=1/120;
  for(const b of [left,right])headOn.move(b,1/120);
  separated(headOn);
}
assert.equal(left.cell,start+16);assert.equal(right.cell,start);
}

// Check every simulation tick, including speed and shield pickups, on every arena.
for(const arenaShape of Object.keys(TERRITORY_SHAPES)){
  const race=new TerritoryBattle({arenaShape,count:20,territoryDuration:30});
  separated(race);race.start();
  while(race.state==='running'){race.step();separated(race);}
}
console.log(`PASS: protected obstacle detours, head-on passage, continuous movement and no overlapping survivors on all ${Object.keys(TERRITORY_SHAPES).length} arenas with 20 players.`);
