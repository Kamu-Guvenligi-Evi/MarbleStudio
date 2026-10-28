import assert from 'node:assert/strict';
import {BREAKER_MAPS} from '../src/breaker-maps.js';
import {SpiralBreaker,COLS,CELL,ROWS,BALL_LIMIT,WALL} from '../src/spiral-breaker.js';
for(const map of BREAKER_MAPS){
  const g=new SpiralBreaker({mapId:map.id});
  assert.equal(g.cells[109*COLS+Math.floor(map.path[0][0]/CELL)],0);
  g.automatic=false;
  for(let col=0;col<COLS;col++){
    if(!g.cells[(ROWS-1)*COLS+col])continue;
    const before=g.broken;
    Object.assign(g.ball,{x:(col+.5)*CELL,y:554,vx:0,vy:-410});
    g.moveBall(g.ball,1/120);
    assert.equal(g.broken,before,map.id+': outside underside impacts cannot break');
    assert.ok(g.ball.vy>0,map.id+': outside impacts reflect');
    assert.equal(g.bonuses.length,0,'Protected impacts do not release buffs');
  }
  // The same bottom tile breaks from above; its empty space remains passable.
  g.cells.fill(0);const bottom=(ROWS-1)*COLS+20;g.cells[bottom]=3;
  Object.assign(g.ball,{x:102.5,y:540,vx:0,vy:410});g.moveBall(g.ball,1/120);
  assert.equal(g.cells[bottom],0,map.id+': inside hit breaks bottom tile');
  Object.assign(g.ball,{x:102.5,y:554,vx:0,vy:-410});
  for(let i=0;i<5;i++)g.moveBall(g.ball,1/120);
  assert.ok(g.ball.y<ROWS*CELL&&g.ball.vy<0,'Cleared bottom leaves no invisible wall');
  g.reset();let firstBreak,lost=0,at30=0,at60=0;
  const walls=Array.from(g.cells,(v,i)=>v===WALL?i:-1).filter(i=>i>=0);
  assert.equal(g.gates.length,1,map.id+': only the inner tip opens onto material');
  // Every exposed tile must belong to the inner pocket, not an early shortcut.
  const start=(ROWS-1)*COLS+Math.floor(map.path[0][0]/CELL),seen=new Set([start]),queue=[start];
  for(let head=0;head<queue.length;head++){
    const index=queue[head],row=Math.floor(index/COLS),col=index%COLS;
    for(const next of [row>0?index-COLS:-1,row<ROWS-1?index+COLS:-1,col>0?index-1:-1,col<COLS-1?index+1:-1]){
      if(next<0||seen.has(next))continue;
      if(g.cells[next]===0){seen.add(next);queue.push(next);}
      else if(g.cells[next]>WALL){
        const x=(next%COLS+.5)*CELL,y=(Math.floor(next/COLS)+.5)*CELL;
        assert.ok(Math.hypot(x-g.entryPocket.x,y-g.entryPocket.y)<g.entryPocket.radius+CELL*2,map.id+': first targets are at the inner pocket');
      }
    }
  }
  const gate=g.gates[0];
  for(const offset of [-5,0,5]){
    const x=gate.x+(gate.vertical?0:offset),y=gate.y+(gate.vertical?offset:0);
    assert.equal(g.cells[Math.floor(y/CELL)*COLS+Math.floor(x/CELL)],0,map.id+': full 15px slit is open');
  }
  let firstImpact;
  g.onBreak=index=>{firstImpact??=index;};
  for(let i=0;i<120*120&&g.state==='running';i++){
    const broken=g.broken,count=g.balls.length,spawned=g.nextId;
    g.step(1/120);lost+=count+g.nextId-spawned-g.balls.length;
    if(g.broken>broken)firstBreak??=g.time;
    if(i===3599)at30=g.broken;
    if(i===7199)at60=g.broken;
    assert.ok(g.balls.length<=BALL_LIMIT);
    for(const b of g.balls){
      assert.ok(Number.isFinite(b.x)&&Number.isFinite(b.y));
      assert.notEqual(g.cells[Math.floor(b.y/CELL)*COLS+Math.floor(b.x/CELL)],WALL,'Ball centers cannot enter solid walls');
    }
  }
  assert.ok(firstBreak>3&&firstBreak<15,map.id+': travels the corridor without an excessive wait');
  const hitX=(firstImpact%COLS+.5)*CELL,hitY=(Math.floor(firstImpact/COLS)+.5)*CELL;
  assert.ok(Math.hypot(hitX-g.entryPocket.x,hitY-g.entryPocket.y)<g.entryPocket.radius+CELL*2,map.id+': first break occurs inside');
  assert.ok(at30>0,map.id+': breaks inside within 30 seconds');
  assert.ok(at60>at30+30||g.state==='won',map.id+': cavity keeps expanding after entry');
  assert.ok(g.broken>at60+100||g.state==='won',map.id+': sustained outward destruction');
  for(const index of walls)assert.equal(g.cells[index],WALL,map.id+': maze walls remain intact');
  assert.ok(g.state==='running'||g.state==='won',map.id+': sustained automatic play');
  assert.ok(lost>0,map.id+': some balls escape');
  assert.equal(g.cells.reduce((n,v)=>n+Number(v>WALL),0),g.initialBlocks-g.broken);
  assert.ok(g.bonusCount>3);
  console.log('PASS '+map.id+': first hit '+firstBreak.toFixed(2)+'s, '+at30+' tiles at 30s, '+g.broken+' total, '+lost+' escaped, '+g.state);
  const live=new SpiralBreaker({mapId:map.id}),video=new SpiralBreaker({mapId:map.id});
  for(let i=0;i<900;i++)live.step(1/30);
  for(let i=0;i<3600;i++)video.step(1/120);
  assert.deepEqual(live.balls,video.balls);assert.deepEqual(live.cells,video.cells);
  g.reset();assert.equal(g.broken,0);assert.equal(g.balls.length,1);assert.equal(g.bonuses.length,0);
}
