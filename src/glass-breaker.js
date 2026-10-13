export const WIDTH=540, HEIGHT=960, CX=270, CY=440, GLASS_RADIUS=207, ARENA_RADIUS=238, BALL_LIMIT=100;
export const BALL_RADIUS=9, GRAVITY=420, DROP_X=CX+ARENA_RADIUS-BALL_RADIUS-1, DROP_Y=CY-100;
export const BOWL_END=Math.PI*3;
const TAU=Math.PI*2, STEP=1/240, SPACING=30;
export const spiralPoint=angle=>({x:CX+Math.cos(angle)*(ARENA_RADIUS-angle*5),y:CY+Math.sin(angle)*(ARENA_RADIUS-angle*5)});
export const WALL=Array.from({length:361},(_,i)=>spiralPoint(i/360*BOWL_END));
const GLASS_OUTLINE=Array.from({length:241},(_,i)=>spiralPoint(Math.PI+i/240*TAU));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function randomSeed(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function clip(poly,nx,ny,limit){
  const out=[];
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],da=a.x*nx+a.y*ny-limit,db=b.x*nx+b.y*ny-limit;
    if(da<=.00001)out.push(a);
    if((da<0)!==(db<0)){const t=da/(da-db);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
  }
  return out;
}
function area(poly){let a=0;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length];a+=p.x*q.y-q.x*p.y;}return Math.abs(a)/2;}
function makeGlass(random){
  const sites=[],lookup=new Map(),range=Math.ceil(GLASS_RADIUS/SPACING)+1;
  for(let row=-range;row<=range;row++)for(let col=-range;col<=range;col++){
    const s={x:CX+(col+(random()-.5)*.85)*SPACING,y:CY+(row+(random()-.5)*.85)*SPACING,row,col};
    sites.push(s);lookup.set(`${col},${row}`,s);
  }
  const disc=GLASS_OUTLINE;
  const cells=[];
  for(const s of sites){
    if(Math.hypot(s.x-CX,s.y-CY)>ARENA_RADIUS+SPACING)continue;
    let poly=disc;
    for(let dr=-2;dr<=2&&poly.length;dr++)for(let dc=-2;dc<=2&&poly.length;dc++){
      const b=lookup.get(`${s.col+dc},${s.row+dr}`);if(!b||b===s)continue;
      poly=clip(poly,b.x-s.x,b.y-s.y,(b.x*b.x+b.y*b.y-s.x*s.x-s.y*s.y)/2);
    }
    const size=area(poly);if(poly.length<3||size<.1)continue;
    const x=poly.reduce((n,p)=>n+p.x,0)/poly.length,y=poly.reduce((n,p)=>n+p.y,0)/poly.length;
    const hue=((Math.atan2(y-CY,x-CX)*180/Math.PI+145)%360+360)%360;
    // Triangular facets fracture individually, retaining their real geometry.
    for(let i=0;i<poly.length;i++){
      const triangle=[{x,y},poly[i],poly[(i+1)%poly.length]],tx=triangle.reduce((n,p)=>n+p.x,0)/3,ty=triangle.reduce((n,p)=>n+p.y,0)/3;
      const triangleArea=area(triangle);if(triangleArea<.05)continue;
      cells.push({id:cells.length,poly:triangle,x:tx,y:ty,area:triangleArea,hue,light:40+random()*21,broken:false,stress:0,radius:Math.max(...triangle.map(p=>Math.hypot(p.x-tx,p.y-ty)))});
    }
  }
  return cells;
}
// Circle/convex polygon contact, including a ball whose center crossed an edge.
function contact(ball,cell){
  if(Math.hypot(ball.x-cell.x,ball.y-cell.y)>cell.radius+ball.radius)return null;
  let best=Infinity,point=null,inside=true,edge=null;
  for(let i=0;i<cell.poly.length;i++){
    const a=cell.poly[i],b=cell.poly[(i+1)%cell.poly.length],dx=b.x-a.x,dy=b.y-a.y;
    if(dx*(ball.y-a.y)-dy*(ball.x-a.x)<-1e-7)inside=false;
    const t=clamp(((ball.x-a.x)*dx+(ball.y-a.y)*dy)/(dx*dx+dy*dy),0,1);
    const p={x:a.x+t*dx,y:a.y+t*dy},d=Math.hypot(ball.x-p.x,ball.y-p.y);
    if(d<best){best=d;point=p;edge={x:dy,y:-dx};}
  }
  if(!inside&&best>ball.radius)return null;
  let nx=inside?point.x-ball.x:ball.x-point.x,ny=inside?point.y-ball.y:ball.y-point.y;
  if(best<1e-7){nx=edge.x;ny=edge.y;}const length=Math.hypot(nx,ny)||1;
  return {x:point.x,y:point.y,nx:nx/length,ny:ny/length};
}
export class GlassBreaker {
  constructor({seed=42,onImpact=()=>{},onWave=()=>{}}={}){this.onImpact=onImpact;this.onWave=onWave;this.reset(seed);}
  reset(seed=this.seed){
    this.seed=seed>>>0;this.random=randomSeed(this.seed);this.cells=makeGlass(this.random);this.balls=[];this.shards=[];
    this.totalArea=this.cells.reduce((n,c)=>n+c.area,0);this.brokenArea=0;this.broken=0;this.hits=0;this.time=0;this.accumulator=0;
    this.automatic=true;this.state='running';this.revision=0;this.wave=1;this.serial=0;this.nextWaveAt=Infinity;this.waveStarted=0;this.lastImpact=0;this.spawnBall();
    this.grid=new Map();
    for(const c of this.cells)for(let row=Math.floor((c.y-c.radius)/32);row<=Math.floor((c.y+c.radius)/32);row++)for(let col=Math.floor((c.x-c.radius)/32);col<=Math.floor((c.x+c.radius)/32);col++){
      const key=`${col},${row}`;if(!this.grid.has(key))this.grid.set(key,[]);this.grid.get(key).push(c);
    }
    this.wallGrid=new Map();
    for(let i=1;i<WALL.length;i++){
      const a=WALL[i-1],b=WALL[i];
      for(let row=Math.floor((Math.min(a.y,b.y)-BALL_RADIUS)/32);row<=Math.floor((Math.max(a.y,b.y)+BALL_RADIUS)/32);row++)for(let col=Math.floor((Math.min(a.x,b.x)-BALL_RADIUS)/32);col<=Math.floor((Math.max(a.x,b.x)+BALL_RADIUS)/32);col++){
        const key=`${col},${row}`;if(!this.wallGrid.has(key))this.wallGrid.set(key,[]);this.wallGrid.get(key).push([a,b]);
      }
    }
  }
  get progress(){return this.brokenArea/this.totalArea;}
  spawnBall(){
    if(this.balls.length>=BALL_LIMIT||this.state==='won')return false;
    if(!this.balls.length){this.nextWaveAt=Infinity;this.waveStarted=this.time;}
    // Every ball is released from rest above the bowl's open right end.
    // Rapid manual additions form a vertical queue instead of overlapping.
    let y=DROP_Y;
    for(const b of this.balls)if(Math.abs(b.x-DROP_X)<BALL_RADIUS*2&&b.y<=DROP_Y+BALL_RADIUS*2)y=Math.min(y,b.y-BALL_RADIUS*2-2);
    this.balls.push({id:this.serial++,x:DROP_X,y,vx:0,vy:0,radius:BALL_RADIUS,hue:(this.balls.length*360/Math.max(1,this.wave)+this.wave*13-13)%360,trail:[],age:0,rest:0,launched:false,entered:false,returnTime:0});
    return true;
  }
  collideBowl(b){
    let touching=false;
    for(const [a,c] of this.wallGrid.get(`${Math.floor(b.x/32)},${Math.floor(b.y/32)}`)??[]){
      const dx=c.x-a.x,dy=c.y-a.y,t=clamp(((b.x-a.x)*dx+(b.y-a.y)*dy)/(dx*dx+dy*dy),0,1);
      const px=a.x+t*dx,py=a.y+t*dy,d=Math.hypot(b.x-px,b.y-py);if(d>=b.radius||d<1e-9)continue;
      const nx=(b.x-px)/d,ny=(b.y-py)/d;b.x=px+nx*b.radius;b.y=py+ny*b.radius;
      touching=true;
      const dot=b.vx*nx+b.vy*ny;if(dot<0){b.vx-=dot*nx;b.vy-=dot*ny;}
    }
    return touching;
  }
  startNextWave(){
    if(this.balls.length||this.broken===this.cells.length||this.wave>=BALL_LIMIT){this.nextWaveAt=Infinity;return;}
    this.wave=this.wave===1?2:this.wave===2?5:Math.min(BALL_LIMIT,this.wave+5);
    for(let i=0;i<this.wave;i++)this.spawnBall();
    // Keep the glass between attempts. Give a batch time to reach the glass;
    // do not delete its leading balls halfway through their approach.
    this.waveStarted=this.time;this.lastImpact=this.time;this.nextWaveAt=Infinity;
    this.onWave();
  }
  breakCell(cell,ball){
    if(cell.broken)return;
    cell.broken=true;this.broken++;this.brokenArea+=cell.area;this.revision++;
    // Each shard keeps the actual glass polygon's shape and color.
    const shard={x:cell.x,y:cell.y,points:cell.poly.map(p=>({x:p.x-cell.x,y:p.y-cell.y})),vx:ball.vx*.25+(this.random()-.5)*90,vy:ball.vy*.2-35-this.random()*70,angle:0,spin:(this.random()-.5)*12,life:.28+this.random()*.2,hue:cell.hue};
    shard.maxLife=shard.life;this.shards.push(shard);
    if(this.shards.length>180)this.shards.splice(0,this.shards.length-180);
    // Stress propagates visually into adjacent glass; only actual impacts remove it.
    for(const c of this.nearby(cell.x,cell.y,36)){
      if(!c.broken&&c.stress<1&&Math.hypot(c.x-cell.x,c.y-cell.y)<32){c.stress=Math.min(1,c.stress+.4);this.revision++;}
    }
    if(this.broken===this.cells.length)this.brokenArea=this.totalArea;
  }
  nearby(x,y,radius){
    const found=new Set();for(let row=Math.floor((y-radius)/32);row<=Math.floor((y+radius)/32);row++)for(let col=Math.floor((x-radius)/32);col<=Math.floor((x+radius)/32);col++)for(const c of this.grid.get(`${col},${row}`)??[])found.add(c);
    return found;
  }
  step(seconds){
    if(this.state!=='running')return;
    this.accumulator+=clamp(seconds,0,.5);
    while(this.accumulator+1e-10>=STEP&&this.state==='running'){this.tick(STEP);this.accumulator-=STEP;}
  }
  tick(dt){
    this.time+=dt;
    if(this.automatic&&!this.balls.length&&this.time>=this.nextWaveAt)this.startNextWave();
    for(const b of this.balls){
      if(b.launched||b.y>=DROP_Y){b.launched=true;b.age+=dt;}
      b.y+=b.vy*dt+.5*GRAVITY*dt*dt;b.vy+=GRAVITY*dt;b.x+=b.vx*dt;
      const touching=this.collideBowl(b);
      if(b.x<CX-140&&b.y<CY+20)b.entered=true;
      // A missed attempt is complete once the marble has crossed the entrance
      // and returned to the bottom. Finish it with a short, individual fade.
      if(b.entered&&b.y>CY+140&&b.vy>0)b.returnTime+=dt;
      // A missed marble can keep rolling in the cleared channel. Let it lose
      // momentum and visibly settle instead of deleting the entire batch.
      const returning=b.age>4&&b.y>CY+140;
      if(touching&&returning){const drag=Math.exp(-3*dt);b.vx*=drag;b.vy*=drag;}
      // Rest can be supported by another marble as well as the channel wall.
      b.rest=returning&&Math.hypot(b.vx,b.vy)<18?b.rest+dt:0;
      b.opacity=1-Math.max(clamp((b.rest-.2)/.2,0,1),clamp((b.returnTime-.15)/.25,0,1));
      if(b.rest>=.4||b.returnTime>=.4)b.spent=true;
      let first=null,firstCell=null;
      for(const cell of this.nearby(b.x,b.y,b.radius)){
        if(cell.broken)continue;const hit=contact(b,cell);if(!hit)continue;
        if(!first){first=hit;firstCell=cell;}
      }
      if(first){
        // The reference spends each marble on impact. Its local fracture spreads
        // into nearby facets; subsequent marbles can travel through that opening.
        for(const cell of this.nearby(first.x,first.y,35))if(!cell.broken&&Math.hypot(cell.x-first.x,cell.y-first.y)<35)this.breakCell(cell,b);
        this.breakCell(firstCell,b);
        b.spent=true;
        this.lastImpact=this.time;
        this.hits++;this.onImpact({x:first.x,y:first.y,energy:Math.hypot(b.vx,b.vy),hue:b.hue});
      }
      if(b.y>HEIGHT+b.radius)b.spent=true;
      b.trail.push({x:b.x,y:b.y});if(b.trail.length>20)b.trail.shift();
    }
    this.balls=this.balls.filter(b=>!b.spent);
    if(!this.balls.length&&this.nextWaveAt===Infinity&&this.wave<BALL_LIMIT)this.nextWaveAt=this.time+.25;
    for(let iteration=0;iteration<6;iteration++){
    for(let i=0;i<this.balls.length;i++)for(let j=i+1;j<this.balls.length;j++){
      const a=this.balls[i],b=this.balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),r=a.radius+b.radius;
      if(d>=r)continue;const nx=d>.0001?dx/d:1,ny=d>.0001?dy/d:0,overlap=(r-d)/2;
      a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;
      const approach=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
      if(approach<0){a.vx+=approach*.95*nx;a.vy+=approach*.95*ny;b.vx-=approach*.95*nx;b.vy-=approach*.95*ny;}
    }
    for(const b of this.balls)this.collideBowl(b);
    }
    for(const s of this.shards){s.life-=dt;s.vy+=300*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.angle+=s.spin*dt;}
    this.shards=this.shards.filter(s=>s.life>0);
    if(this.broken===this.cells.length&&!this.balls.length&&!this.shards.length)this.state='won';
  }
}
