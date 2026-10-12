import assert from 'node:assert/strict';
import {BREAKER_MAPS} from '../src/breaker-maps.js';
import {SpiralBreaker,COLS,CELL,ROWS} from '../src/spiral-breaker.js';

for(const map of BREAKER_MAPS){
  const g=new SpiralBreaker({mapId:map.id});
  assert.equal(g.map.id,map.id);
  assert.equal(g.cells[109*COLS+Math.floor(map.path[0][0]/CELL)],0,`${map.id}: entrance open`);
  const endpoint=map.path.at(-1);
  Object.assign(g.ball,{x:endpoint[0],y:endpoint[1],vx:0,vy:0});g.step(1/120);
  assert.equal(g.ball.armed,false,'Endpoint alone must not unlock destruction');
  // Test every solid underside column, including after its tile is cleared.
  for(const armed of [false,true])for(const cleared of [false,true]){
    g.reset();g.automatic=false;
    if(cleared)g.cells.fill(0,(ROWS-1)*COLS);
    for(let col=0;col<COLS;col++){
      if(!g.entranceWall[col])continue;
      Object.assign(g.ball,{x:(col+.5)*CELL,y:554,vx:0,vy:-410,armed});
      for(let step=0;step<6;step++)g.moveBall(g.ball,1/120);
      assert.equal(g.broken,0,`${map.id}: underside cannot be broken`);
      assert.equal(g.bonuses.length,0,`${map.id}: underside cannot release buffs`);
      assert.ok(g.ball.vy>0&&g.ball.y>=ROWS*CELL,`${map.id}: no entry through cleared underside`);
    }
    Object.assign(g.ball,{x:map.path[0][0],y:554,vx:0,vy:-410,armed});
    for(let step=0;step<6;step++)g.moveBall(g.ball,1/120);
    assert.ok(g.ball.y<ROWS*CELL&&g.ball.vy<0,`${map.id}: original entrance admits every ball`);
  }
  g.reset();let firstBreak;
  for(let i=0;i<60*60&&g.state==='running';i++){
    g.step(1/60);
    if(g.broken&&!firstBreak){firstBreak=g.time;assert.ok(g.ball.armed);}
    if(!g.broken){assert.equal(g.bonuses.length,0);assert.equal(g.balls.length,1);}
  }
  assert.ok(firstBreak>5&&firstBreak<40,`${map.id}: first break ${firstBreak}`);
  assert.ok(g.broken>0,`${map.id}: valid route starts destruction`);
  assert.ok(g.state==='running'||g.state==='lost'||g.state==='won');
  if(g.state==='lost')assert.equal(g.balls.length,0);
  assert.equal(g.cells.reduce((n,v)=>n+Number(v>0),0),g.initialBlocks-g.broken);
  assert.ok(g.bonusCount>0);
  console.log(`PASS ${map.id}: entrance protection, first break ${firstBreak.toFixed(1)}s, ${g.state}, ${g.balls.length} surviving balls`);
  g.reset(BREAKER_MAPS[(BREAKER_MAPS.indexOf(map)+1)%BREAKER_MAPS.length].id);
  assert.equal(g.broken,0);assert.equal(g.balls.length,1);assert.equal(g.bonuses.length,0);assert.equal(g.ball.armed,false);
}
