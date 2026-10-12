import {getBreakerMap} from './breaker-maps.js';
export const WIDTH=540, HEIGHT=960, CELL=5, ROWS=110, COLS=108;
export const BALL_LIMIT=1500, DRAIN_Y=808;
export const SPIRAL_PATH=getBreakerMap('spiral').path;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function pathDistance(x,y,path){
  let result=Infinity;
  for(let i=1;i<path.length;i++){
    const [ax,ay]=path[i-1],[bx,by]=path[i],dx=bx-ax,dy=by-ay;
    const t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy),0,1);
    result=Math.min(result,Math.max(Math.abs(x-ax-dx*t),Math.abs(y-ay-dy*t)));
  }
  return result;
}
export class SpiralBreaker {
  constructor({onBreak=()=>{},onHit=()=>{},onBonus=()=>{},mapId='spiral'}={}){this.onBreak=onBreak;this.onHit=onHit;this.onBonus=onBonus;this.reset(mapId);}
  reset(mapId=this.map?.id){
    this.map=getBreakerMap(mapId);this.path=this.map.path;
    this.cells=new Uint8Array(COLS*ROWS);this.broken=0;this.hits=0;this.time=0;this.accumulator=0;this.state='running';this.automatic=true;this.returns=0;this.bonusCount=0;this.nextId=0;this.balls=[];
    this.paddle={x:337,y:716,width:106,height:8};this.particles=[];
    for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){
      const x=col*CELL+CELL/2,y=row*CELL+CELL/2,d=pathDistance(x,y,this.path),edge=Math.min(x,WIDTH-x,y);
      const type=d<14?0:d<25?1:d<35?2:3;
      this.cells[row*COLS+col]=edge<11?1:edge<21?2:type;
    }
    // Red flecks belong to the field and obey the same route requirement.
    (this.map.targets??[]).forEach(([x,y])=>{
      for(let r=0;r<2;r++)for(let c=0;c<2;c++){
        const index=(Math.floor(y/CELL)+r)*COLS+Math.floor(x/CELL)+c;
        this.cells[index]=4;
      }
    });
    // Preserve the original entrance even after blocks above it are cleared.
    this.entranceWall=this.cells.slice((ROWS-1)*COLS);
    this.bonuses=[];this.bonusSerial=0;this.nextDropAt=1;this.lastDropTime=-1;
    this.initialBlocks=this.cells.reduce((n,v)=>n+Number(v>0),0);
    this.launch();
  }
  get ball(){return this.balls[0];}
  launch(){const vx=this.map.launchVx;this.balls.push({id:this.nextId++,x:this.path[0][0],y:650,radius:3.2,vx,vy:-Math.sqrt(410**2-vx**2),routeIndex:0,armed:false});}
  movePaddle(x){this.paddle.x=clamp(x,this.paddle.width/2+5,WIDTH-this.paddle.width/2-5);}
  breakCell(index){
    const type=this.cells[index];if(!type)return;
    this.cells[index]=0;this.broken++;this.onBreak(index,type);
    if(this.broken===this.initialBlocks)this.state='won';
    const x=index%COLS*CELL+CELL/2,y=Math.floor(index/COLS)*CELL+CELL/2;
    // Buffs are released by destroyed tiles, then fall through the maze.
    if(this.broken>=this.nextDropAt&&this.time-this.lastDropTime>=.45&&this.bonuses.length<24){
      this.spawnBonus(undefined,x,y);this.lastDropTime=this.time;
      this.nextDropAt=this.broken+48;
    }
    for(let i=0;i<3;i++)this.particles.push({x,y,vx:Math.sin(index+i*2)*65,vy:-35-i*20,life:.5,type});
    if(this.particles.length>180)this.particles.splice(0,this.particles.length-180);
  }
  spawnBonus(type,x=WIDTH/2,y=-18){
    const id=this.bonusSerial++;
    const bonus={id,x:clamp(x,18,WIDTH-18),y,vy:100,type:type??['multiply','wide','multiply','shrink','multiply','add','multiply'][id%7],collected:false};
    this.bonuses.push(bonus);return bonus;
  }
  collectBonus(bonus){
    if(bonus.collected)return;
    bonus.collected=true;this.bonusCount++;
    if(bonus.type==='wide')this.paddle.width=Math.min(240,this.paddle.width+44);
    if(bonus.type==='shrink')this.paddle.width=Math.max(64,this.paddle.width-26);
    if(bonus.type==='multiply'||bonus.type==='add'){
      const amount=Math.min(BALL_LIMIT-this.balls.length,bonus.type==='multiply'?this.balls.length*2:3);
      for(let i=0;i<amount;i++){
        const angle=-Math.PI/2+Math.sin(this.nextId*2.39996)*1.1;
        this.balls.push({id:this.nextId++,x:this.paddle.x,y:this.paddle.y-5,radius:3.2,vx:Math.cos(angle)*410,vy:Math.sin(angle)*410,routeIndex:0,armed:false});
      }
    }
    this.movePaddle(this.paddle.x);this.onBonus(bonus.type,this.balls.length);this.onHit('bonus');
  }
  step(seconds){
    if(this.state!=='running')return;
    this.accumulator+=clamp(seconds,0,.1);
    while(this.accumulator>=1/120&&this.state==='running'){this.tick(1/120);this.accumulator-=1/120;}
  }
  tick(dt){
    this.time+=dt;const p=this.paddle;
    if(this.automatic&&this.balls.length){
      // Follow the next ball reaching the paddle; missed balls fall out of play.
      let b=this.ball,soonest=Infinity;
      for(const candidate of this.balls){if(candidate.vy<=0||candidate.y>=p.y)continue;const arrival=(p.y-candidate.y)/candidate.vy;if(arrival<soonest){soonest=arrival;b=candidate;}}
      let aim=b.x;
      if(b.vy>0&&b.y>552){
        const projected=b.x+b.vx*(p.y-b.y)/b.vy;
        const folded=((projected-b.radius)%(2*(WIDTH-2*b.radius))+2*(WIDTH-2*b.radius))%(2*(WIDTH-2*b.radius));
        aim=b.radius+Math.min(folded,2*(WIDTH-2*b.radius)-folded)-Math.sin(this.returns*2.3)*20;
      }
      const falling=this.bonuses.find(bonus=>!bonus.collected&&bonus.y<p.y&&bonus.y>p.y-160);
      if(falling)aim=falling.x;
      this.movePaddle(p.x+clamp(aim-p.x,-760*dt,760*dt));
    }
    for(const bonus of this.bonuses){
      const previousBottom=bonus.y+16;bonus.y+=bonus.vy*dt;
      if(!bonus.collected&&previousBottom<=p.y&&bonus.y+16>=p.y&&Math.abs(bonus.x-p.x)<=p.width/2+16)this.collectBonus(bonus);
    }
    this.bonuses=this.bonuses.filter(bonus=>!bonus.collected&&bonus.y<HEIGHT+20);
    // New clones join on the next physics tick, keeping each tick bounded.
    const count=this.balls.length;
    for(let i=0;i<count;i++)this.moveBall(this.balls[i],dt);
    this.balls=this.balls.filter(b=>b.y-b.radius<=DRAIN_Y);
    if(!this.balls.length&&this.state==='running'){this.state='lost';this.onHit('lost');}
    for(const particle of this.particles){particle.life-=dt;particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.vy+=120*dt;}
    this.particles=this.particles.filter(p=>p.life>0);
  }
  moveBall(b,dt){
    const p=this.paddle;
    const previousY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.x<b.radius){b.x=b.radius;b.vx=Math.abs(b.vx);}if(b.x>WIDTH-b.radius){b.x=WIDTH-b.radius;b.vx=-Math.abs(b.vx);}
    if(b.y<b.radius){b.y=b.radius;b.vy=Math.abs(b.vy);}
    if(b.vy>0&&previousY+b.radius<=p.y&&b.y+b.radius>=p.y&&Math.abs(b.x-p.x)<=p.width/2+b.radius){
      const angle=clamp((b.x-p.x)/(p.width/2),-.92,.92)*1.12;
      b.vx=Math.sin(angle)*410;b.vy=-Math.cos(angle)*410;b.y=p.y-b.radius-.01;this.returns++;this.onHit('paddle');
    }
    if(!b.armed){
      if(b.y>560)b.routeIndex=0;
      const waypoint=b.y>560?undefined:this.path[b.routeIndex];
      // Cover the full bend so grazing a corner cannot skip route progress.
      if(waypoint&&Math.hypot(b.x-waypoint[0],b.y-waypoint[1])<24){
        b.routeIndex++;
        if(b.routeIndex===this.path.length){b.armed=true;this.onHit('finish');}
      }
    }
    const outside=previousY>=ROWS*CELL;
    let collision=null;
    for(let row=Math.max(0,Math.floor((b.y-b.radius)/CELL));row<=Math.min(ROWS-1,Math.floor((b.y+b.radius)/CELL));row++){
      for(let col=Math.max(0,Math.floor((b.x-b.radius)/CELL));col<=Math.min(COLS-1,Math.floor((b.x+b.radius)/CELL));col++){
        const index=row*COLS+col;
        const entranceBarrier=outside&&row===ROWS-1&&this.entranceWall[col];
        if(!this.cells[index]&&!entranceBarrier)continue;
        const nx=b.x-clamp(b.x,col*CELL,(col+1)*CELL),ny=b.y-clamp(b.y,row*CELL,(row+1)*CELL),distance=Math.hypot(nx,ny);
        if(distance>=b.radius)continue;
        // An unlocked ball still has to re-enter through the original hole.
        // Underside impacts only bounce; they never damage tiles or drop buffs.
        if(b.armed&&!outside)this.breakCell(index);
        if(!collision||distance<collision.distance)collision={nx,ny,distance};
      }
    }
    if(collision){
      let {nx,ny,distance}=collision;
      if(distance<.0001){const speed=Math.hypot(b.vx,b.vy);nx=speed?-b.vx/speed:0;ny=speed?-b.vy/speed:-1;distance=1;}else{nx/=distance;ny/=distance;}
      const dot=b.vx*nx+b.vy*ny;
      if(dot<0){b.vx-=2*dot*nx;b.vy-=2*dot*ny;}
      b.x+=nx*(b.radius-collision.distance+.01);b.y+=ny*(b.radius-collision.distance+.01);
      // A slight deflection prevents perfectly vertical or horizontal cycles.
      if(Math.abs(b.vx)<28)b.vx=(b.vx<0?-1:1)*28;
      if(Math.abs(b.vy)<65)b.vy=(b.vy<0?-1:1)*65;
      const speed=Math.hypot(b.vx,b.vy);b.vx=b.vx/speed*410;b.vy=b.vy/speed*410;
      this.hits++;this.onHit('brick');
    }
  }
}
