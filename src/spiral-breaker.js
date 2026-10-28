import {getBreakerMap} from './breaker-maps.js';
export const WIDTH=540, HEIGHT=960, CELL=5, ROWS=110, COLS=108;
export const BALL_LIMIT=240, DRAIN_Y=808;
export const WALL=1, GATE_WIDTH=15;
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
    this.paddle={x:337,y:716,width:128,height:8};this.particles=[];
    this.autoAim=this.paddle.x;this.nextAutoAimAt=0;
    for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){
      const x=col*CELL+CELL/2,y=row*CELL+CELL/2,d=pathDistance(x,y,this.path),edge=Math.min(x,WIDTH-x,y);
      const type=d<17?0:d<25?1:d<35?2:3;
      this.cells[row*COLS+col]=edge<11?1:edge<21?2:type;
    }
    // The corridor has one exit at its inner tip. No side shortcuts expose
    // the block field before a ball has travelled through the maze.
    const [ex,ey]=this.path.at(-1),[px,py]=this.path.at(-2);
    const tx=Math.sign(ex-px),ty=Math.sign(ey-py);
    // Place the pocket on the free side of the inner tip, never across a
    // neighbouring turn. The corridor still has just one narrow exit.
    const directions=[[tx,ty],[-ty,tx],[ty,-tx]];
    const clearance=([dx,dy])=>{
      const x=ex+dx*56,y=ey+dy*56;
      return Math.min(pathDistance(x,y,this.path),x-11,WIDTH-11-x,y-11,ROWS*CELL-11-y);
    };
    directions.sort((a,b)=>clearance(b)-clearance(a));
    const [dx,dy]=directions[0];
    const gx=dy?(Math.floor(ex/CELL)+.5)*CELL:ex;
    const gy=dx?(Math.floor(ey/CELL)+.5)*CELL:ey;
    this.gates=[{x:gx+dx*25,y:gy+dy*25,vertical:dy===0}];
    this.entryPocket={x:gx+dx*56,y:gy+dy*56,radius:27};
    for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){
      const x=(col+.5)*CELL-gx,y=(row+.5)*CELL-gy;
      const along=x*dx+y*dy,across=x*dy-y*dx;
      const passage=along>=0&&along<60&&Math.abs(across)<GATE_WIDTH/2;
      const chamber=Math.hypot(along-56,across)<27;
      if(passage||chamber)this.cells[row*COLS+col]=0;
      else if(along>56&&Math.hypot(along-56,across)<32&&this.cells[row*COLS+col]>WALL)this.cells[row*COLS+col]=4;
    }
    // Keep the lower enclosure visible and solid; only its entrance admits balls.
    for(let row=ROWS-2;row<ROWS;row++)for(let col=0;col<COLS;col++){
      if(this.cells[row*COLS+col])this.cells[row*COLS+col]=WALL;
    }
    this.bonuses=[];this.bonusSerial=0;this.nextDropAt=1;this.lastDropTime=-1;
    this.initialBlocks=this.cells.reduce((n,v)=>n+Number(v>WALL),0);
    this.launch();
  }
  get ball(){return this.balls[0];}
  launch(){const ball={id:this.nextId++,x:this.path[0][0],y:650,radius:4,vx:0,vy:-410};this.aimAtOpening(ball,this.map.launchAngle??.12);this.balls.push(ball);}
  movePaddle(x){this.paddle.x=clamp(x,this.paddle.width/2+5,WIDTH-this.paddle.width/2-5);}
  launchUpward(ball,angle){
    ball.vx=Math.sin(angle)*410;ball.vy=-Math.cos(angle)*410;
  }
  aimAtOpening(ball,angle){
    // Use actual empty bottom cells: destroyed tiles must never leave a hidden wall.
    const distance=ball.y-ROWS*CELL,preferred=ball.x+Math.tan(angle)*distance;
    let target=null,best=Infinity;
    for(let col=0;col<COLS;){
      if(this.cells[(ROWS-1)*COLS+col]){col++;continue;}
      const start=col;while(col<COLS&&!this.cells[(ROWS-1)*COLS+col])col++;
      const margin=ball.radius+3,left=start*CELL+margin,right=col*CELL-margin;
      if(left>right)continue;
      const x=clamp(preferred,left,right),score=Math.abs(x-preferred);
      if(score<best){target=x;best=score;}
    }
    this.launchUpward(ball,target===null?angle:Math.atan2(target-ball.x,distance));
  }
  breakCell(index){
    const type=this.cells[index];if(!type||type===WALL)return;
    this.cells[index]=0;this.broken++;this.onBreak(index,type);
    if(this.broken===this.initialBlocks)this.state='won';
    const x=index%COLS*CELL+CELL/2,y=Math.floor(index/COLS)*CELL+CELL/2;
    // Buffs are released by destroyed tiles, then fall through the maze.
    if(this.broken>=this.nextDropAt&&this.time-this.lastDropTime>=1&&this.bonuses.length<12){
      this.spawnBonus(undefined,x,y);this.lastDropTime=this.time;
      this.nextDropAt=this.broken+(this.balls.length<10?6:36);
    }
    for(let i=0;i<3;i++)this.particles.push({x,y,vx:Math.sin(index+i*2)*65,vy:-35-i*20,life:.5,type});
    if(this.particles.length>180)this.particles.splice(0,this.particles.length-180);
  }
  spawnBonus(type,x=WIDTH/2,y=-18){
    const id=this.bonusSerial++;
    const bonus={id,x:clamp(x,18,WIDTH-18),y,vy:140,type:type??['multiply','wide','add','multiply','shrink','multiply','add'][id%7],collected:false};
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
        const x=this.paddle.x+Math.sin(this.nextId*2.39996)*Math.min(20,this.paddle.width/4);
        const ball={id:this.nextId++,x,y:this.paddle.y-5,radius:4,vx:0,vy:-410};
        this.aimAtOpening(ball,Math.sin(ball.id*2.39996)*.95);this.balls.push(ball);
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
      // A finite travel speed and reaction interval let separated balls escape.
      // Catches still depend on physical contact, never a random miss roll.
      const speed=this.balls.length<=3?1050:900;
      if(this.time>=this.nextAutoAimAt){
        this.nextAutoAimAt=this.time+.1;
        // Predict only balls below the field: maze walls still change those inside.
        let soonest=Infinity,aim=this.path[0][0];
        for(const b of this.balls){
          if(b.vy<=0||b.y<ROWS*CELL+b.radius||b.y+b.radius>p.y)continue;
          const arrival=(p.y-b.radius-b.y)/b.vy;
          if(arrival>=soonest)continue;
          soonest=arrival;
          const span=WIDTH-2*b.radius,projected=b.x+b.vx*arrival-b.radius;
          const folded=((projected%(2*span))+2*span)%(2*span);
          aim=b.radius+Math.min(folded,2*span-folded);
        }
        // A buff is worth a detour only when there is time to return for the ball.
        let buffTime=Infinity,buff=null;
        for(const bonus of this.bonuses){
          if(bonus.collected||bonus.y+16>p.y||bonus.y<p.y-160)continue;
          const arrival=(p.y-16-bonus.y)/bonus.vy;
          const catchX=clamp(bonus.x,p.width/2+5,WIDTH-p.width/2-5);
          if(arrival<buffTime&&Math.abs(catchX-p.x)/speed<=arrival&&arrival+Math.abs(catchX-aim)/speed+.12<soonest){buffTime=arrival;buff=bonus;}
        }
        if(buff)aim=buff.x;
        this.autoAim=aim;
      }
      this.movePaddle(p.x+clamp(this.autoAim-p.x,-speed*dt,speed*dt));
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
    const previousX=b.x,previousY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.x<b.radius){b.x=b.radius;b.vx=Math.abs(b.vx);}if(b.x>WIDTH-b.radius){b.x=WIDTH-b.radius;b.vx=-Math.abs(b.vx);}
    if(b.y<b.radius){b.y=b.radius;b.vy=Math.abs(b.vy);}
    if(b.vy>0&&previousY+b.radius<=p.y&&b.y+b.radius>=p.y&&Math.abs(b.x-p.x)<=p.width/2+b.radius){
      b.paddleHits=(b.paddleHits??0)+1;
      const offset=(b.x-p.x)/(p.width/2);
      const variation=this.automatic?Math.sin(b.id*2.39996+b.paddleHits*1.4)*.35:0;
      const angle=clamp(offset*1.12+variation,-1.1,1.1);
      b.y=p.y-b.radius-.01;
      if(this.automatic)this.aimAtOpening(b,angle);else this.launchUpward(b,angle);
      this.returns++;this.onHit('paddle');
    }
    let collision=null;
    for(let row=Math.max(0,Math.floor((b.y-b.radius)/CELL));row<=Math.min(ROWS-1,Math.floor((b.y+b.radius)/CELL));row++){
      for(let col=Math.max(0,Math.floor((b.x-b.radius)/CELL));col<=Math.min(COLS-1,Math.floor((b.x+b.radius)/CELL));col++){
        const index=row*COLS+col;
        if(!this.cells[index])continue;
        const nx=b.x-clamp(b.x,col*CELL,(col+1)*CELL),ny=b.y-clamp(b.y,row*CELL,(row+1)*CELL),distance=Math.hypot(nx,ny);
        if(distance>=b.radius)continue;
        const wall=this.cells[index]===WALL;
        // Outside impacts and permanent maze walls never release material.
        if(previousY+b.radius<=ROWS*CELL)this.breakCell(index);
        if(!collision||(wall&&!collision.wall)||(wall===collision.wall&&distance<collision.distance))collision={nx,ny,distance,wall};
      }
    }
    if(collision){
      let {nx,ny,distance}=collision;
      if(distance<.0001){const speed=Math.hypot(b.vx,b.vy);nx=speed?-b.vx/speed:0;ny=speed?-b.vy/speed:-1;distance=1;}else{nx/=distance;ny/=distance;}
      const dot=b.vx*nx+b.vy*ny;
      if(dot<0){b.vx-=2*dot*nx;b.vy-=2*dot*ny;}
      // Restore the last free position at a solid wall. Pushing out of only one
      // tile can otherwise push the ball through the opposite rim of a slit.
      if(collision.wall){b.x=previousX;b.y=previousY;}
      else{b.x+=nx*(b.radius-collision.distance+.01);b.y+=ny*(b.radius-collision.distance+.01);}
      // A slight deflection prevents perfectly vertical or horizontal cycles.
      if(Math.abs(b.vx)<28)b.vx=(b.vx<0?-1:1)*28;
      if(Math.abs(b.vy)<65)b.vy=(b.vy<0?-1:1)*65;
      // A bounded outward deflection stops repeated corridor loops while
      // preserving speed. Finding an opening still requires physical contact.
      if(collision.wall){
        const angle=Math.atan2(b.vy,b.vx)+Math.sin(b.id*2.39996+this.hits*1.7)*.32;
        const vx=Math.cos(angle)*410,vy=Math.sin(angle)*410;
        if(vx*nx+vy*ny>0){b.vx=vx;b.vy=vy;}
      }
      const speed=Math.hypot(b.vx,b.vy);b.vx=b.vx/speed*410;b.vy=b.vy/speed*410;
      this.hits++;this.onHit('brick');
    }
    // Browser and server trigonometry can differ in their last few bits.
    // Bound that drift before crowded ricochets amplify it in video exports.
    b.x=Math.round(b.x*1e6)/1e6;b.y=Math.round(b.y*1e6)/1e6;
    b.vx=Math.round(b.vx*1e6)/1e6;b.vy=Math.round(b.vy*1e6)/1e6;
  }
}
