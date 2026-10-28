import Matter from 'matter-js';
const {Engine,Bodies,Body,Composite,Events}=Matter;
export const CW=540,CH=960,CX=270,CY=490,INITIAL_RADIUS=230,DT=1/120;
const TAU=Math.PI*2;
const numeric=(v,d,a,b)=>Number.isFinite(Number(v))?Math.max(a,Math.min(b,Number(v))):d;
export function normalizeCollapse(p={}){
  p=p&&typeof p==='object'?p:{};
  return {name:'Çöken Arena',seed:Math.round(numeric(p.seed,42,0,0xffffffff)),playbackSpeed:numeric(p.playbackSpeed,1,.5,3),growth:numeric(p.growth,5,3,10),fragments:Math.round(numeric(p.fragments,16,8,24)),sound:p.sound!==false,soundStyle:'balanced',soundOverrides:{},title:String(p.title??'The ball grows with every wall hit').slice(0,100)};
}
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function clip(poly,nx,ny,limit){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=a.x*nx+a.y*ny-limit,db=b.x*nx+b.y*ny-limit;if(da<=0)out.push(a);if((da<0)!==(db<0)){const t=da/(da-db);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}return out;}
// Exact circle geometry, including the path between frames. Matter's low-sided
// circle polygon becomes visibly inaccurate when a small ball is scaled up.
export function sweepSpike(from,to,r,vertices){
  const dx=to.x-from.x,dy=to.y-from.y,speed2=dx*dx+dy*dy;let first=Infinity;
  if(Matter.Vertices.contains(vertices,from))return 0;
  for(let i=0;i<vertices.length;i++){
    const a=vertices[i],b=vertices[(i+1)%vertices.length],ex=b.x-a.x,ey=b.y-a.y,len=Math.hypot(ex,ey),ux=ex/len,uy=ey/len;
    const px=from.x-a.x,py=from.y-a.y,along=px*ux+py*uy,nearest=Math.max(0,Math.min(len,along));
    if(Math.hypot(px-nearest*ux,py-nearest*uy)<=r+1e-8)return 0;
    const normal=px*(-uy)+py*ux,rate=dx*(-uy)+dy*ux;
    if(Math.abs(rate)>1e-10)for(const side of [-r,r]){const t=(side-normal)/rate,q=along+t*(dx*ux+dy*uy);if(t>=0&&t<=1&&q>=0&&q<=len)first=Math.min(first,t);}
    if(speed2>1e-12){const dot=px*dx+py*dy,disc=dot*dot-speed2*(px*px+py*py-r*r);if(disc>=0){const t=(-dot-Math.sqrt(disc))/speed2;if(t>=0&&t<=1)first=Math.min(first,t);}}
  }
  return first;
}
export function fractureDisc(radius,count,random){
  const outline=Array.from({length:40},(_,i)=>({x:Math.cos(i/40*TAU)*radius,y:Math.sin(i/40*TAU)*radius}));
  const sites=Array.from({length:count},(_,i)=>{const a=i*2.3999632297+(random()-.5)*.8,r=radius*Math.sqrt((i+.5)/count)*.88;return{x:Math.cos(a)*r,y:Math.sin(a)*r};});
  return sites.map(a=>{let poly=outline;for(const b of sites){if(a===b)continue;poly=clip(poly,b.x-a.x,b.y-a.y,(b.x*b.x+b.y*b.y-a.x*a.x-a.y*a.y)/2);}return poly;}).filter(p=>p.length>=3);
}
export class CollapseArena{
  constructor(settings={}){this.settings=normalizeCollapse(settings);this.reset();}
  reset(settings=this.settings){
    if(this.engine){Events.off(this.engine);Engine.clear(this.engine);Composite.clear(this.engine.world,false);}
    this.settings=normalizeCollapse(settings);this.random=rng(this.settings.seed);this.seed=this.settings.seed;
    this.engine=Engine.create({enableSleeping:true,positionIterations:4,velocityIterations:3});this.engine.gravity.y=1;this.engine.gravity.scale=.001;
    this.time=0;this.ticks=0;this.state='running';this.phase='arena';this.radius=INITIAL_RADIUS;this.targetRadius=INITIAL_RADIUS;this.broken=0;this.hits=0;this.shards=[];this.sparks=[];this.trail=[];this.ball=null;this.pendingBreak=false;this.flash=0;this.escaped=0;this.phaseTime=0;
    this.ballRadius=12;this.wallHits=0;this.wallArmed=true;this.shardArea=0;this.nextFillCheck=0;this.fillRatio=0;
    // One closed collision boundary; visual outline remains a smooth circle.
    this.walls=Array.from({length:72},(_,i)=>{const a=i/72*TAU;const b=Bodies.rectangle(CX+Math.cos(a)*(this.radius+7),CY+Math.sin(a)*(this.radius+7),30,16,{isStatic:true,angle:a+Math.PI/2,restitution:.2,friction:.02,label:'boundary'});b.arenaAngle=a;return b;});
    this.spike=Bodies.fromVertices(CX,CY+this.radius-24,[[{x:-33,y:23},{x:0,y:-46},{x:33,y:23}]],{isStatic:true,label:'spike',friction:0});
    Composite.add(this.engine.world,[...this.walls,this.spike]);
    this.spawn();
  }
  event(type,x=CX,energy=200){this.onEvent?.({type,x,time:this.time,energy});}
  spawn(){
    if(this.phase!=='arena')return;
    if(this.isFull()){this.startCollapse();return;}
    const r=Math.min(this.ballRadius,this.radius*.8);
    const angle=this.random()*TAU,d=Math.min(this.radius-r-4,this.radius*.43);
    this.ball=Bodies.circle(CX+Math.cos(angle)*d,CY-Math.abs(Math.sin(angle))*d,180,{restitution:.2,friction:.005,frictionStatic:0,frictionAir:.001,density:.009,label:'active-ball',collisionFilter:{category:2,mask:4}},32);
    Body.scale(this.ball,r/180,r/180);
    if(sweepSpike(this.ball.position,this.ball.position,r,this.spike.vertices)!==Infinity)Body.setPosition(this.ball,{x:CX,y:CY-d});
    this.wallArmed=true;
    this.ball.hue=(this.broken*32)%360;this.ball.born=this.time;this.trail=[];
    Body.setVelocity(this.ball,{x:(this.random()<.5?-1:1)*(3+this.random()*2),y:2+this.random()*2});Composite.add(this.engine.world,this.ball);
  }
  breakBall(){
    if(!this.ball||this.phase!=='arena')return;
    const ball=this.ball,{x,y}=ball.position,velocity={...ball.velocity};
    const polygons=fractureDisc(ball.circleRadius,this.settings.fragments,this.random);
    Composite.remove(this.engine.world,ball);this.ball=null;
    for(const poly of polygons){
      // Matter recenters vertices at their area centroid; retain each shard's original location.
      const center=Matter.Vertices.centre(poly),offset={x:center.x,y:center.y};
      const shard=Bodies.fromVertices(x+offset.x,y+offset.y,[poly],{restitution:.2,friction:.005,frictionStatic:0,frictionAir:.006,sleepThreshold:30,density:.00015,label:'shard',collisionFilter:{category:4,mask:7}},true,.001,.1,.001);
      if(!shard)continue;shard.hue=ball.hue;shard.light=47+this.random()*10;shard.born=this.time;
      shard.fragmentShape=shard.vertices.map(v=>({x:v.x-shard.position.x,y:v.y-shard.position.y}));
      const norm=Math.hypot(offset.x,offset.y)||1;
      Body.setVelocity(shard,{x:velocity.x*.5+offset.x/norm*(2+this.random()*2),y:velocity.y*.3+offset.y/norm*3-3});Body.setAngularVelocity(shard,(this.random()-.5)*.18);
      this.shards.push(shard);this.shardArea+=shard.area;Composite.add(this.engine.world,shard);
    }
    this.broken++;this.hits++;this.flash=.22;this.targetRadius=Math.max(0,INITIAL_RADIUS-this.broken*.35);
    // Fragments persist and keep colliding with the wall and each other.
    this.event('break',x);this.spawnAt=this.time+.24;
    if(this.isFull())this.startCollapse();
  }
  growOnWall(){
    if(!this.ball||this.pendingBreak)return;
    const b=this.ball,r=Math.min(b.circleRadius+this.settings.growth*.2,this.radius*.8);
    const dx=b.position.x-CX,dy=b.position.y-CY,d=Math.hypot(dx,dy),bound=this.radius-r-2;
    const next=d>bound?{x:CX+dx/d*bound,y:CY+dy/d*bound}:{...b.position};
    // Never enlarge or reposition a ball through the visible triangle.
    if(sweepSpike(b.position,next,r,this.spike.vertices)===Infinity){
      Body.scale(b,r/b.circleRadius,r/b.circleRadius);Body.setPosition(b,next);this.ballRadius=r;
    }
    this.wallHits++;
    this.event('bounce',b.position.x,b.speed);
  }
  isFull(){
    if(this.time<this.nextFillCheck)return this.fillRatio>=.9;
    this.nextFillCheck=this.time+.5;
    const r=this.radius,available=Math.PI*r*r-this.spike.area;
    if(this.shardArea<available*.85){this.fillRatio=0;return false;}
    // Sample the visible union: overlapping fragments count only once.
    // Rasterize each polygon's bounding box, twice a second, not every physics tick.
    const n=40,cell=2*r/n,occupied=new Uint8Array(n*n);
    const left=CX-r,top=CY-r;
    for(const s of this.shards){
      const x0=Math.max(0,Math.ceil((s.bounds.min.x-left)/cell-.5)),x1=Math.min(n-1,Math.floor((s.bounds.max.x-left)/cell-.5));
      const y0=Math.max(0,Math.ceil((s.bounds.min.y-top)/cell-.5)),y1=Math.min(n-1,Math.floor((s.bounds.max.y-top)/cell-.5));
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        const index=y*n+x;
        if(!occupied[index]&&Matter.Vertices.contains(s.vertices,{x:left+(x+.5)*cell,y:top+(y+.5)*cell}))occupied[index]=1;
      }
    }
    let total=0,covered=0;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const point={x:left+(x+.5)*cell,y:top+(y+.5)*cell};
      if(Math.hypot(point.x-CX,point.y-CY)>r||Matter.Vertices.contains(this.spike.vertices,point))continue;
      total++;covered+=occupied[y*n+x];
    }
    this.fillRatio=total?covered/total:0;
    return this.fillRatio>=.9;
  }
  startCollapse(){
    if(this.phase!=='arena')return;this.phase='collapse';this.phaseTime=this.time;this.startRadius=this.radius;
    if(this.ball){Composite.remove(this.engine.world,this.ball);this.ball=null;}
    Composite.remove(this.engine.world,[...this.walls,this.spike]);
    this.collapseOrigins=this.shards.map(s=>({x:s.position.x,y:s.position.y,angle:s.angle}));this.event('wave');
  }
  explode(){
    this.phase='burst';this.phaseTime=this.time;this.radius=0;this.event('complete');
    // Reuse the accumulated shard geometry; the ending is made from the broken balls.
    this.sparks=this.shards.map((s,i)=>{const a=i*2.3999632297+this.random()*.4,speed=25+this.random()*220;return{x:CX+(this.random()-.5)*8,y:CY+(this.random()-.5)*8,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-80,hue:s.hue,light:s.light,angle:s.angle,spin:(this.random()-.5)*12,poly:s.fragmentShape};});
    Composite.clear(this.engine.world,false);this.shards=[];
  }
  step(dt=DT){
    if(this.state!=='running')return;
    // Callers use a fixed step. Clamp externally supplied intervals to protect collisions.
    dt=Math.min(DT,Math.max(0,Number(dt)||0));if(!dt)return;this.time+=dt;this.ticks++;this.flash=Math.max(0,this.flash-dt);
    if(this.phase==='collapse'){
      const u=Math.min(1,(this.time-this.phaseTime)/1.5),scale=(1-u)**2;this.radius=this.startRadius*scale;
      this.shards.forEach((s,i)=>{const o=this.collapseOrigins[i],a=u*8,dx=(o.x-CX)*scale,dy=(o.y-CY)*scale;Body.setPosition(s,{x:CX+dx*Math.cos(a)-dy*Math.sin(a),y:CY+dx*Math.sin(a)+dy*Math.cos(a)});Body.setAngle(s,o.angle+u*8);});
      if(u>=1)this.explode();return;
    }
    if(this.phase==='burst'){
      for(const s of this.sparks){s.vy+=60*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.angle+=s.spin*dt;}
      if(this.time-this.phaseTime>=4){this.state='won';}return;
    }
    this.radius+=(this.targetRadius-this.radius)*Math.min(1,dt*12);
    if(this.isFull()){this.startCollapse();return;}
    for(const wall of this.walls){const a=wall.arenaAngle;Body.setPosition(wall,{x:CX+Math.cos(a)*(this.radius+7),y:CY+Math.sin(a)*(this.radius+7)});}
    Body.setPosition(this.spike,{x:CX,y:CY+this.radius-24});
    // Gravity and collision impulses determine motion; no recurring speed boost
    // or hard speed clamp that makes successive bounces look identical.
    const before=this.ball?{...this.ball.position}:null;
    Engine.update(this.engine,dt*1000);
    if(this.ball){
      const b=this.ball,t=sweepSpike(before,b.position,b.circleRadius,this.spike.vertices);
      if(t!==Infinity){Body.setPosition(b,{x:before.x+(b.position.x-before.x)*t,y:before.y+(b.position.y-before.y)*t});this.pendingBreak=true;}
      else{
        const dx=b.position.x-CX,dy=b.position.y-CY,d=Math.hypot(dx,dy),bound=this.radius-b.circleRadius;
        if(d<bound-3)this.wallArmed=true;
        if(d>=bound&&d){
          const outward=(b.velocity.x*dx+b.velocity.y*dy)/d;
          const projected={x:CX+dx/d*bound,y:CY+dy/d*bound},contact=sweepSpike(b.position,projected,b.circleRadius,this.spike.vertices);
          if(contact!==Infinity){Body.setPosition(b,{x:b.position.x+(projected.x-b.position.x)*contact,y:b.position.y+(projected.y-b.position.y)*contact});this.pendingBreak=true;}
          else{Body.setPosition(b,projected);
            if(outward>0){
              // Slow contacts settle/slide instead of bouncing on every gravity step.
              const restitution=outward>.5?.8:0;
              Body.setVelocity(b,{x:b.velocity.x-(1+restitution)*outward*dx/d,y:b.velocity.y-(1+restitution)*outward*dy/d});
              if(this.wallArmed&&outward>.5){this.wallArmed=false;this.growOnWall();}
            }
          }
        }
      }
      this.trail.push({...b.position,radius:b.circleRadius,hue:b.hue});if(this.trail.length>18)this.trail.shift();
    }
    if(this.pendingBreak){this.pendingBreak=false;this.breakBall();}
    if(!this.ball&&this.phase==='arena'&&this.time>=this.spawnAt)this.spawn();
  }
  snapshot(){return{state:this.state,phase:this.phase,time:this.time,broken:this.broken,radius:this.radius,shards:this.shards.length,escaped:this.escaped,seed:this.seed,ball:this.ball?{x:this.ball.position.x,y:this.ball.position.y,radius:this.ball.circleRadius}:null};}
}
