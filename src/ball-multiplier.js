import {normalizeSoundStyle} from './game-sound-director.js';
import {normalizeSoundOverrides} from './game-sound-settings.js';
export const MULTIPLIER_KEY='marble-studio-ball-multiplier-v1';
export const CIRCLE={x:270,y:550,r:235};
export const BALL_COLORS=['#ff2458','#ff793d','#47ff42','#35ed91','#435fff','#bb20ff','#ffe440','#20dfff'];
const number=(value,fallback,min,max)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;
export function normalizeMultiplier(raw={}){
  raw=raw&&typeof raw==='object'?raw:{};
  return {name:'Ball Multiplier',title:String(raw.title??'Every bounce = new ball 🤯').slice(0,70),
    count:Math.round(number(raw.count,5,2,20)),radius:number(raw.radius,7,5,12),
    limit:Math.round(number(raw.limit,2000,50,3000)),duration:number(raw.duration,45,5,120),
    speed:number(raw.speed,1,.5,2),gravity:number(raw.gravity,180,0,400),
    spawnOn:raw.spawnOn==='every-bounce'?'every-bounce':'balls',seed:number(raw.seed,42,0,4294967295)>>>0,
    sound:raw.sound!==false,soundStyle:normalizeSoundStyle(raw.soundStyle??'melodic-marimba'),
    soundOverrides:normalizeSoundOverrides('ball-multiplier',raw.soundOverrides),
    music:{mode:'fixed',track:String(raw.music?.track??'').slice(0,100),volume:number(raw.music?.volume,35,0,100),roster:[]}};
}
function randomFrom(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}

// Fixed 120 Hz physics, local neighbour queries and contact lifetimes keep births
// independent of display FPS. A continuing contact is never a second collision.
export class BallMultiplier{
  constructor(raw={}){
    this.settings=normalizeMultiplier(raw);this.random=randomFrom(this.settings.seed);
    this.time=0;this.ticks=0;this.state='running';this.balls=[];this.contacts=new Set();this.pending=[];this.pulses=[];
    this.births=0;this.collisions=0;this.absorbed=0;this.phase='multiply';this.finaleDuration=Math.min(6,this.settings.duration*.5);this.onEvent=null;this.cell=this.settings.radius*2+1;
    // Reuse a bounded spatial index instead of allocating thousands of bucket
    // arrays on every solver pass. Tail insertion preserves collision ordering.
    this.gridHeads=new Int32Array(32768);this.gridTails=new Int32Array(32768);
    this.gridNext=new Int32Array(this.settings.limit);this.gridHeads.fill(-1);
    for(let i=0;i<this.settings.count;i++){
      const angle=i*Math.PI*2/this.settings.count+.2,spread=i<2?46:115;
      const x=i<2?CIRCLE.x+(i?46:-46):CIRCLE.x+Math.cos(angle)*spread;
      const y=i<2?CIRCLE.y-75:CIRCLE.y+Math.sin(angle)*spread;
      const direction=i<2?(i?Math.PI:0):this.random()*Math.PI*2;
      this.add(x,y,direction,165+this.random()*35);
    }
    this.rebuild();
  }
  add(x,y,angle,speed){
    const ball={id:this.balls.length,x,y,px:x,py:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:this.ballRadius??this.settings.radius,color:BALL_COLORS[this.balls.length%BALL_COLORS.length],born:this.time};
    this.balls.push(ball);return ball;
  }
  key(x,y){return Math.floor(x/this.cell)+Math.floor(y/this.cell)*128;}
  insert(ball){
    const key=this.key(ball.x,ball.y),id=ball.id;this.gridNext[id]=-1;
    if(this.gridHeads[key]===-1)this.gridHeads[key]=id;else this.gridNext[this.gridTails[key]]=id;
    this.gridTails[key]=id;
  }
  rebuild(){this.gridHeads.fill(-1);for(const ball of this.balls)this.insert(ball);}
  neighbours(x,y,visit){
    const gx=Math.floor(x/this.cell),gy=Math.floor(y/this.cell);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)
      for(let id=this.gridHeads[gx+dx+(gy+dy)*128];id>=0;id=this.gridNext[id])visit(this.balls[id]);
  }
  free(x,y){
    const radius=this.ballRadius??this.settings.radius;
    if(Math.hypot(x-CIRCLE.x,y-CIRCLE.y)>CIRCLE.r-radius-1)return false;
    const gx=Math.floor(x/this.cell),gy=Math.floor(y/this.cell);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)
      for(let id=this.gridHeads[gx+dx+(gy+dy)*128];id>=0;id=this.gridNext[id]){
        const b=this.balls[id];if((b.x-x)**2+(b.y-y)**2<(b.r+radius+.4)**2)return false;
      }
    return true;
  }
  event(type,x){this.onEvent?.({type,x,time:this.time/this.settings.speed});}
  requestBirth(x,y){
    if(this.balls.length+this.pending.length>=this.settings.limit)return;
    this.pending.push({x,y});
  }
  spawnPending(){
    let attempts=Math.min(this.pending.length,12);
    while(attempts--){
      let spot=null;
      for(let i=0;i<80;i++){
        const angle=this.random()*Math.PI*2;
        const distance=Math.sqrt(this.random())*(CIRCLE.r-(this.ballRadius??this.settings.radius)-1);
        const x=CIRCLE.x+Math.cos(angle)*distance,y=CIRCLE.y+Math.sin(angle)*distance;
        if(this.free(x,y)){spot={x,y};break;}
      }
      if(!spot)break;
      this.pending.shift();const b=this.add(spot.x,spot.y,this.random()*Math.PI*2,180+this.random()*80);this.insert(b);
      this.births++;this.pulses.push({x:b.x,y:b.y,color:b.color,time:this.time});
      if(this.pulses.length>40)this.pulses.shift();
      this.event('multiply',b.x);
    }
  }
  wall(ball,produce){
    const dx=ball.x-CIRCLE.x,dy=ball.y-CIRCLE.y,bound=CIRCLE.r-ball.r;
    if(dx*dx+dy*dy<bound*bound)return;
    const d=Math.hypot(dx,dy);
    const nx=dx/d,ny=dy/d,outward=ball.vx*nx+ball.vy*ny;
    ball.x=CIRCLE.x+nx*(bound-.001);ball.y=CIRCLE.y+ny*(bound-.001);
    if(outward>0){
      ball.vx-=2*outward*nx;ball.vy-=2*outward*ny;
      if(produce){this.event('wall',ball.x);if(this.settings.spawnOn==='every-bounce')this.requestBirth(ball.x,ball.y);}
    }
  }
  startFinale(){
    this.phase='surge';this.finaleStart=this.time;this.finalePopulation=this.balls.length;
    this.pending=[];this.contacts.clear();this.pulses=[];this.finaleProgress=0;this.finaleBeat=-1;
    // A hexagonal packing gives every existing ball its own final position.
    // Sort by angle to avoid long crossing paths as the vortex finds its shape.
    const count=this.balls.length,extent=Math.ceil(Math.sqrt(count)),sites=[];
    for(let row=-extent;row<=extent;row++)for(let col=-extent;col<=extent;col++){
      const x=col+row*.5,y=row*Math.sqrt(3)/2;
      sites.push({x,y,d:Math.hypot(x,y),angle:Math.atan2(y,x)});
    }
    sites.sort((a,b)=>a.d-b.d||a.angle-b.angle);
    const packed=sites.slice(0,count),spacing=CIRCLE.r/(packed[count-1].d+.05);
    packed.sort((a,b)=>a.angle-b.angle||a.d-b.d);
    const ordered=[...this.balls].sort((a,b)=>Math.atan2(a.y-CIRCLE.y,a.x-CIRCLE.x)-Math.atan2(b.y-CIRCLE.y,b.x-CIRCLE.x)||a.id-b.id);
    ordered.forEach((b,i)=>{
      const site=packed[i],distance=site.d*spacing;
      b.closing={angle:Math.atan2(b.y-CIRCLE.y,b.x-CIRCLE.x),distance:Math.hypot(b.x-CIRCLE.x,b.y-CIRCLE.y),radius:b.r,
        angleDelta:Math.atan2(Math.sin(site.angle-Math.atan2(b.y-CIRCLE.y,b.x-CIRCLE.x)),Math.cos(site.angle-Math.atan2(b.y-CIRCLE.y,b.x-CIRCLE.x))),
        x:CIRCLE.x+site.x*spacing,y:CIRCLE.y+site.y*spacing,distanceTarget:distance,
        // The outermost balls extend under the circular clip to seal the rim.
        radiusTarget:spacing*(distance>CIRCLE.r*.85?.9:.62)};
    });
  }
  finale(dt){
    const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>v*v*(3-2*v);
    const p=clamp((this.time-this.finaleStart)/this.finaleDuration);
    this.finaleProgress=p;
    const surge=clamp(p/.4),turn=smooth(surge),bloom=clamp((p-.4)/.42);
    this.phase=p<.4?'surge':p<.82?'bloom':'settle';
    for(const b of this.balls){
      b.px=b.x;b.py=b.y;b.pr=b.r;
      const c=b.closing;
      if(p<.4){
        const angle=c.angle+c.angleDelta*turn+Math.PI*2*turn;
        const distance=(c.distance+(c.distanceTarget-c.distance)*turn)*(1-.22*Math.sin(Math.PI*surge));
        b.x=CIRCLE.x+Math.cos(angle)*distance;b.y=CIRCLE.y+Math.sin(angle)*distance;
        b.r=c.radius;b.bloom=0;
      }else{
        // A staggered spring pop travels from the centre to the rim.
        const local=clamp((bloom-.55*c.distanceTarget/CIRCLE.r)/.45);
        const ease=1-Math.pow(1-local,3),pop=Math.sin(Math.PI*local)*.16;
        b.x=c.x;b.y=c.y;b.r=c.radius+(c.radiusTarget-c.radius)*ease+c.radiusTarget*pop;
        b.bloom=Math.sin(Math.PI*local);
      }
      b.vx=(b.x-b.px)/dt;b.vy=(b.y-b.py)/dt;
    }
    // A short accelerating phrase follows the visible sweep. All cues use the
    // user's normal event mapping, including mute and manual sound selections.
    if(p<.82){
      const beat=Math.floor(p<.4?Math.pow(surge,1.5)*6:6+bloom*10);
      if(beat>this.finaleBeat){this.finaleBeat=beat;this.event(p<.4?'bounce':'multiply',270);}
    }else if(!this.finaleResolved){this.finaleResolved=true;this.event('complete',270);}
    if(p>=1-1e-8){this.finaleProgress=1;this.state='finished';}
  }
  step(dt=1/120){
    if(this.state!=='running'||!Number.isFinite(dt)||dt<=0)return;
    // Callers use fixed steps; split larger public steps to prevent tunnelling.
    if(dt>1/120+1e-10){let left=dt;while(left>1e-10&&this.state==='running'){const slice=Math.min(left,1/120);this.step(slice);left-=slice;}return;}
    this.time+=dt;this.ticks++;
    if(this.phase!=='multiply'){this.finale(dt);return;}
    // Make room gradually as the population grows, keeping the chosen opening size.
    this.ballRadius=Math.min(this.settings.radius,CIRCLE.r*Math.sqrt(.45/Math.min(this.settings.limit,this.balls.length*1.08)));
    this.cell=this.ballRadius*2+1;
    for(const b of this.balls){
      b.pr=b.r;b.r=this.ballRadius;b.px=b.x;b.py=b.y;b.vy+=this.settings.gravity*dt;
      if(b.vx*b.vx+b.vy*b.vy>360000){const speed=Math.hypot(b.vx,b.vy);b.vx*=600/speed;b.vy*=600/speed;}
      b.x+=b.vx*dt;b.y+=b.vy*dt;this.wall(b,true);
    }
    const active=new Set();
    for(let pass=0;pass<3;pass++){
      this.rebuild();
      for(const a of this.balls)this.neighbours(a.x,a.y,b=>{
        if(b.id<=a.id)return;
        const dx=b.x-a.x,dy=b.y-a.y,diameter=a.r+b.r;
        if(dx*dx+dy*dy>(diameter+.5)**2)return;
        const d=Math.hypot(dx,dy),key=a.id*this.settings.limit+b.id;
        if(this.contacts.has(key))active.add(key);
        if(d>diameter)return;
        const nx=d>1e-8?dx/d:1,ny=d>1e-8?dy/d:0;
        const approaching=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
        if(approaching<0){
          a.vx+=approaching*nx;a.vy+=approaching*ny;b.vx-=approaching*nx;b.vy-=approaching*ny;
          if(!this.contacts.has(key)&&!active.has(key)){
            this.collisions++;this.requestBirth((a.x+b.x)/2,(a.y+b.y)/2);this.event('bounce',(a.x+b.x)/2);
          }
        }
        active.add(key);
        const correction=(diameter-d+.01)/2;
        a.x-=nx*correction;a.y-=ny*correction;b.x+=nx*correction;b.y+=ny*correction;
      });
      for(const b of this.balls)this.wall(b,false);
    }
    this.contacts=active;this.rebuild();this.spawnPending();
    this.pulses=this.pulses.filter(p=>this.time-p.time<.25);
    if(this.balls.length>=this.settings.limit||this.time>=this.settings.duration-this.finaleDuration-1e-8)this.startFinale();
  }
}
