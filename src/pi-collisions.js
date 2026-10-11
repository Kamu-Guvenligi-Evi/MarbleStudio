// Galperin's elastic collisions: a heavy block, a 1 kg block and a fixed wall.
// Advance to each exact collision time, so fast blocks cannot tunnel at high mass ratios.
export const PI_KEY='marble-studio-pi-v1';
export function normalizePi(raw={}){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Pi ayarları geçersiz.');
  const digits=Number(raw.digits??3),speed=Number(raw.speed??1);
  if(![1,2,3,4].includes(digits))throw new Error('Pi basamak sayısı 1–4 olmalı.');
  if(![.25,.5,1,2].includes(speed))throw new Error('Pi oynatma hızı geçersiz.');
  return {name:String(raw.name??'Pi Çarpışmaları').trim().slice(0,80)||'Pi Çarpışmaları',digits,speed,sound:raw.sound!==false};
}

export class PiCollisions{
  constructor(options={}){
    this.options=normalizePi(options);this.mass=100**(this.options.digits-1);
    this.wall=444;this.heavy={x:250,width:40+(this.options.digits-1)*16,v:26};
    this.light={x:380,width:30,v:0};this.time=0;this.collisions=0;this.state='ready';
    this.lastHit=null;this.onHit=options.onHit??(()=>{});
  }
  start(){if(this.state==='ready')this.state='running';}
  get energy(){return (this.mass*this.heavy.v**2+this.light.v**2)/2;}
  get approximation(){return String(this.collisions/10**(this.options.digits-1));}
  nextEvent(){
    const h=this.heavy,l=this.light;
    const blocks=h.v>l.v?Math.max(0,(l.x-h.x-h.width)/(h.v-l.v)):Infinity;
    const wall=l.v>0?Math.max(0,(this.wall-l.x-l.width)/l.v):Infinity;
    return blocks<=wall?{type:'blocks',dt:blocks}:{type:'wall',dt:wall};
  }
  advance(dt){this.heavy.x+=this.heavy.v*dt;this.light.x+=this.light.v*dt;this.time+=dt;}
  collide(type){
    const h=this.heavy,l=this.light,M=this.mass;
    if(type==='wall'){l.x=this.wall-l.width;l.v=-l.v;}
    else{
      h.x=l.x-h.width;
      const u=h.v,v=l.v;
      h.v=((M-1)*u+2*v)/(M+1);l.v=(2*M*u+(1-M)*v)/(M+1);
    }
    this.collisions++;this.lastHit={type,time:this.time,x:type==='wall'?this.wall:l.x};
    this.onHit(this.lastHit);
    if(!Number.isFinite(this.nextEvent().dt))this.state='finished';
  }
  step(seconds){
    if(this.state!=='running'||!Number.isFinite(seconds)||seconds<=0)return;
    let remaining=seconds;
    while(remaining>0&&this.state==='running'){
      const event=this.nextEvent();
      if(!Number.isFinite(event.dt)){this.state='finished';break;}
      if(event.dt>remaining){this.advance(remaining);break;}
      this.advance(event.dt);remaining=Math.max(0,remaining-event.dt);this.collide(event.type);
    }
  }
  nextCollision(){
    this.start();if(this.state!=='running')return;
    const event=this.nextEvent();if(!Number.isFinite(event.dt)){this.state='finished';return;}
    this.advance(event.dt);this.collide(event.type);
  }
  dispose(){}
}

export function analyzePi(options){
  const race=new PiCollisions(options);race.start();
  for(let i=0;i<4000&&race.state!=='finished';i++)race.nextCollision();
  return {complete:race.state==='finished',simulationSeconds:race.time/race.options.speed,hits:race.collisions,
    collisions:race.collisions,winner:null,rescues:0,finite:[race.heavy.x,race.light.x,race.energy].every(Number.isFinite),
    score:100,coverTime:race.time/race.options.speed*.6};
}
