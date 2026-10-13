export const RING_KEY='marble-studio-ring-escape-v1';
export const FLOW_PRESETS={
  vortex:{name:'Sonsuz Spiral',hint:'1.200 halka · dönen tünel',count:1200,duration:45,seed:24},
  pulse:{name:'Dalga Tüneli',hint:'1.800 halka · akan geçitler',count:1800,duration:45,seed:10},
  rush:{name:'Zincir Yağmuru',hint:'2.400 halka · uzun seriler',count:2400,duration:45,seed:3},
};
export const THEMES={
  studio:{name:'Studio',background:'#081512',ring:'#79e9bb',accent:'#e4bd74',ball:'#f4fff8'},
  rose:{name:'Referans',background:'#09090b',ring:'#e7a0d9',accent:'#f4cb86',ball:'#ffffff'},
  aurora:{name:'Aurora',background:'#0b1021',ring:'#92a5ff',accent:'#74f2dc',ball:'#ffffff'},
  ember:{name:'Gün batımı',background:'#1c1015',ring:'#ff987c',accent:'#ffd78e',ball:'#fff5df'},
};
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const number=(v,d,a,b)=>Number.isFinite(Number(v))?clamp(Number(v),a,b):d;
export function normalizeRing(raw={}){
  const theme=Object.hasOwn(THEMES,raw.theme)?raw.theme:'studio',p=THEMES[theme];
  const color=(v,d)=>/^#[\da-f]{6}$/i.test(v)?v:d;
  return {theme,background:color(raw.background,p.background),ring:color(raw.ring,p.ring),accent:color(raw.accent,p.accent),ball:color(raw.ball,p.ball),
    title:typeof raw.title==='string'?raw.title.slice(0,44):'SON HALKADAN KAÇ',
    experienceVersion:8,seed:number(raw.seed,24,1,4294967295)>>>0,count:Math.round(number(raw.count,1200,8,5000)),duration:number(raw.duration,45,15,90),speed:number(raw.speed,1,.5,2),
    layout:['vortex','pulse','rush','aligned','twist','alternating'].includes(raw.layout)?raw.layout:'vortex',
    shape:['marble','comet','diamond'].includes(raw.shape)?raw.shape:'comet',trail:raw.trail!==false,particles:raw.particles!==false,
    image:typeof raw.image==='string'&&/^data:image\/(?:png|jpeg|webp);base64,/.test(raw.image)&&raw.image.length<1500000?raw.image:null,
    music:['reference','ambient','adaptive','off'].includes(raw.music)?raw.music:'reference',musicVolume:number(raw.musicVolume,.55,0,1),effectsVolume:number(raw.effectsVolume,.28,0,1),sound:raw.sound===true,soundOverrides:normalizeSoundOverrides('ring-escape',raw.soundOverrides),
  };
}
export function angleDifference(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
export class RingEscape{
  constructor(options={}){
    this.settings=normalizeRing(options);this.time=0;this.state='running';this.broken=0;this.hits=0;this.combo=0;this.lastBreak=-10;this.flash=0;this.onEvent=null;
    this.dynamic=Object.hasOwn(FLOW_PRESETS,this.settings.layout);
    this.randomState=this.settings.seed;this.cx=270;this.cy=452;this.inner=this.dynamic?48:38;this.spacing=this.dynamic?.18:(242-this.inner)/(this.settings.count-1);this.scroll=0;
    const angle=this.random()*TAU;
    this.ball={x:270,y:444,vx:Math.cos(angle)*(this.dynamic?200:172),vy:Math.sin(angle)*(this.dynamic?200:172),r:this.dynamic?5.6:4.2,trail:[]};
    this.rings=Array.from({length:this.settings.count},(_,i)=>{
      // Adjacent openings form a continuous channel, including after a break.
      const twist=this.settings.layout==='rush'?.004:.006;
      const baseAngle=.3+(this.dynamic?i*twist+(this.settings.layout==='pulse'?Math.sin(i*.018)*.06:0):this.settings.layout==='twist'?i*.16:0);
      return {id:i,r:this.inner+i*this.spacing,baseAngle,angle:baseAngle,omega:this.dynamic?1.1:this.settings.layout==='alternating'&&i%2?.86:-.86,gap:this.dynamic?1.3:.43};
    });
    this.particles=[];this.trailTick=0;this.ripples=[];this.impact=0;this.bestCombo=0;this.phase=0;
  }
  random(){let t=this.randomState+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
  emit(type,extra={}){this.onEvent?.({type,time:this.time,...extra});}
  get remaining(){return this.rings.length;}
  get secondsLeft(){return Math.max(0,this.settings.duration-this.time);}
  inGap(ring,angle,margin=0){return Math.abs(angleDifference(angle,ring.angle))<ring.gap/2-margin;}
  breakRing(ring){
    this.rings.shift();this.broken++;this.combo=this.time-this.lastBreak<(this.dynamic?.85:.55)?this.combo+1:1;this.bestCombo=Math.max(this.bestCombo,this.combo);this.lastBreak=this.time;this.flash=.32;
    // A visual accent per short burst keeps thousands of real breaks readable.
    // Cosmetic randomness must never consume the physics/seed generator.
    if(this.time-(this.lastBurst??-1)>.045){
      this.lastBurst=this.time;this.ripples.push({r:ring.r,life:.32});if(this.ripples.length>4)this.ripples.shift();
      if(this.settings.particles){for(let i=0;i<12;i++){const a=ring.angle+(i/11-.5)*ring.gap,speed=30+(i*17%43);this.particles.push({x:this.cx+Math.cos(a)*ring.r,y:this.cy+Math.sin(a)*ring.r,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:.3+(i%3)*.07,total:.44,size:1.3});}if(this.particles.length>240)this.particles.splice(0,this.particles.length-240);}
    }
    this.emit('break',{combo:this.combo,x:this.ball.x,y:this.ball.y});
    if(!this.rings.length){this.state='won';this.emit('win');}
  }
  step(dt){
    if(!Number.isFinite(dt)||dt<=0)return;
    // Substeps keep narrow gates and the fast cascade from tunnelling through walls.
    let left=Math.min(dt,.1);while(left>1e-8){const h=Math.min(left,1/240);this.tick(h);left-=h;}
  }
  tick(dt){
    this.flash=Math.max(0,this.flash-dt);
    this.impact=Math.max(0,this.impact-dt);
    for(const ripple of this.ripples){ripple.life-=dt;ripple.r+=65*dt;}this.ripples=this.ripples.filter(r=>r.life>0);
    for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);
    if(this.state!=='running')return;
    this.time+=dt;
    if(this.time>=this.settings.duration){this.time=this.settings.duration;this.state='timeout';this.emit('timeout');return;}
    this.phase=this.broken/this.settings.count;
    if(this.dynamic){
      // Feed slowly only into free space. A passed opening must not snap back
      // underneath the marble or carry the marble inward with the stack.
      const target=this.broken*this.spacing,rate=24;
      const clearance=this.rings[0].r-Math.hypot(this.ball.x-this.cx,this.ball.y-this.cy)-this.ball.r-2;
      const shift=Math.min(Math.max(0,target-this.scroll),rate*dt,Math.max(0,clearance));
      this.scroll+=shift;
    }
    for(let i=0;i<this.rings.length;i++){
      const ring=this.rings[i];
      if(this.dynamic){
        ring.angle=(ring.baseAngle+ring.omega*this.time+(this.settings.layout==='pulse'?Math.sin(this.time*1.4-ring.id*.035)*.06:0))%TAU;
        ring.r=this.inner+ring.id*this.spacing-this.scroll;
      }else{
        ring.angle=(ring.angle+ring.omega*dt)%TAU;
        ring.r=Math.max(this.inner+i*this.spacing,ring.r-155*dt);
      }
    }
    const b=this.ball;b.vy+=(this.dynamic?400:105)*dt;
    const speed=Math.hypot(b.vx,b.vy),target=this.dynamic?240+this.phase*40:Math.min(300,185+this.broken*2.6);
    const factor=1+(target/Math.max(1,speed)-1)*Math.min(1,dt*1.2);b.vx*=factor;b.vy*=factor;b.x+=b.vx*dt;b.y+=b.vy*dt;
    let guard=0;
    while(this.rings.length&&guard++<this.settings.count+1){
      const ring=this.rings[0],dx=b.x-this.cx,dy=b.y-this.cy,d=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),margin=Math.asin(Math.min(.95,(b.r+1)/ring.r));
      if(d<ring.r-b.r-1)break;
      if(this.inGap(ring,angle,margin)){
        // Dense flows break on the center crossing, in this same substep.
        // Waiting for the trailing edge leaves a visibly passed ring intact.
        if(d>ring.r+(this.dynamic?0:b.r+1)){this.breakRing(ring);continue;}break;
      }
      const nx=dx/(d||1),ny=dy/(d||1),vn=b.vx*nx+b.vy*ny;
      b.x=this.cx+nx*(ring.r-b.r-1.05);b.y=this.cy+ny*(ring.r-b.r-1.05);
      if(vn>0){b.vx-=2*vn*nx;b.vy-=2*vn*ny;this.hits++;this.impact=.12;this.impactAngle=angle;this.emit('hit',{x:b.x,y:b.y,note:this.hits});}
      // A contracting wall pushes inward rather than trapping the marble on its edge.
      else if(ring.r>this.inner+.1){b.vx-=nx*20*dt;b.vy-=ny*20*dt;}
      break;
    }
    this.trailTick+=dt;if(this.trailTick>=1/120){this.trailTick=0;b.trail.push({x:b.x,y:b.y});if(b.trail.length>(this.dynamic?28:55))b.trail.shift();}
  }
}
import {normalizeSoundOverrides} from './game-sound-settings.js';
