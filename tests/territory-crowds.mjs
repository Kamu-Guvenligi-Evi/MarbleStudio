import assert from 'node:assert/strict';
import {TerritoryBattle,TERRITORY_SHAPES} from '../src/territory.js';

let matches=0,worstDelay=0;
for(const arenaShape of Object.keys(TERRITORY_SHAPES))for(const count of [12,20])for(const seed of [2048,42,7]){
  const race=new TerritoryBattle({arenaShape,count,seed,territoryDuration:30});
  const anchors=race.balls.map(b=>({position:{...b.body.position},time:0}));
  race.start();
  while(race.state==='running'){
    const before=race.balls.map(b=>({...b.body.position}));race.step();
    const live=race.balls.filter(b=>b.eliminatedAt===null);
    for(const b of live){
      const label=`${arenaShape}/${count}/${seed}, player ${b.id} at ${race.time.toFixed(2)}s`;
      const p=b.body.position,anchor=anchors[b.id];
      assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y),label);
      assert.ok(Math.hypot(p.x-before[b.id].x,p.y-before[b.id].y)<=race.cellSize*1.8/race.cellSeconds/120+1e-7,`No teleport: ${label}`);
      if(Math.hypot(p.x-anchor.position.x,p.y-anchor.position.y)>12){anchor.position={...p};anchor.time=race.time;}
      const delay=race.time-anchor.time;worstDelay=Math.max(worstDelay,delay);
      assert.ok(delay<4,`Player keeps retrying a blocked route: ${label}, ${delay.toFixed(2)}s`);
      for(const other of live)if(other.id>b.id){
        const q=other.body.position;
        assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=b.body.circleRadius+other.body.circleRadius+4-1e-7,`Visible bodies overlap: ${label}/${other.id}`);
      }
    }
  }
  assert.equal(race.balls.reduce((sum,b)=>sum+b.area,0),race.valid.filter(i=>race.cells[i]>=0).length);
  assert.ok(race.winners.length>0);matches++;
}
console.log(`PASS: ${matches} crowded matches, 12/20 players, all maps, no overlapping outlines or teleports; longest stay within 12px: ${worstDelay.toFixed(2)}s.`);
