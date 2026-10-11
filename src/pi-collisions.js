// Galperin's elastic collisions: a heavy block, a 1 kg block and a fixed wall.
// Advance to each exact collision time, so fast blocks cannot tunnel at high mass ratios.
export const PI_MAX_DIGITS=6;
export const PI_KEY='marble-studio-pi-v1';
export function normalizePi(raw={}){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Pi ayarları geçersiz.');
  const digits=Number(raw.digits??3),speed=Number(raw.speed??1);
  if(!Number.isInteger(digits)||digits<1||digits>PI_MAX_DIGITS)throw new Error(`Pi basamak sayısı 1–${PI_MAX_DIGITS} olmalı.`);
  if(![.25,.5,1,2,3].includes(speed))throw new Error('Pi oynatma hızı geçersiz.');
  return {name:String(raw.name??'Pi Çarpışmaları').trim().slice(0,80)||'Pi Çarpışmaları',digits,speed,sound:raw.sound!==false,autoIncrease:raw.autoIncrease===true};
}

export class PiCollisions{
  constructor(options={}){
    this.options=normalizePi(options);this.mass=100**(this.options.digits-1);
    this.wall=444;this.heavy={x:250,width:Math.min(104,40+(this.options.digits-1)*16),v:26};
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

// One shared timeline for the studio and exported video. Hold each result before
// advancing, and keep collision audio timestamps relative to the whole sequence.
export class PiSession{
  constructor(options={}){
    this.options=normalizePi(options);this.onHit=options.onHit??(()=>{});
    this.time=0;this.state='ready';this.rounds=[];this.holdRemaining=0;
    this.createRound(this.options.digits);
  }
  createRound(digits){
    const offset=this.time;
    this.current=new PiCollisions({...this.options,digits,onHit:event=>this.onHit({...event,time:offset+event.time})});
  }
  get mass(){return this.current.mass;}
  get collisions(){return this.current.collisions;}
  get energy(){return this.current.energy;}
  get heavy(){return this.current.heavy;}
  get light(){return this.current.light;}
  get approximation(){return this.current.approximation;}
  get transitioning(){return this.state==='running'&&this.current.state==='finished';}
  start(){if(this.state==='ready'){this.state='running';this.current.start();}}
  finishRound(){
    if(this.current.state!=='finished')return;
    this.rounds.push({digits:this.current.options.digits,mass:this.mass,collisions:this.collisions,approximation:this.approximation});
    if(this.options.autoIncrease&&this.current.options.digits<PI_MAX_DIGITS)this.holdRemaining=2;
    else this.state='finished';
  }
  advanceRound(){this.createRound(this.current.options.digits+1);this.current.start();}
  step(seconds){
    if(this.state!=='running'||!Number.isFinite(seconds)||seconds<=0)return;
    let remaining=seconds;
    while(remaining>1e-10&&this.state==='running'){
      if(this.transitioning){
        const elapsed=Math.min(remaining,this.holdRemaining);
        this.time+=elapsed;remaining-=elapsed;this.holdRemaining-=elapsed;
        if(this.holdRemaining<=1e-10)this.advanceRound();
      }else{
        const before=this.current.time;this.current.step(remaining);
        const elapsed=this.current.time-before;this.time+=elapsed;remaining=Math.max(0,remaining-elapsed);
        this.finishRound();
      }
    }
  }
  nextCollision(){
    this.start();if(this.state!=='running')return;
    if(this.transitioning){this.time+=this.holdRemaining;this.holdRemaining=0;this.advanceRound();}
    const before=this.current.time;this.current.nextCollision();this.time+=this.current.time-before;this.finishRound();
  }
  dispose(){this.current.dispose();}
}

export function analyzePi(options){
  const race=new PiSession(options);race.start();
  for(let i=0;i<4*10**(PI_MAX_DIGITS-1)&&race.state!=='finished';i++)race.nextCollision();
  return {complete:race.state==='finished',simulationSeconds:race.time/race.options.speed,hits:race.rounds.reduce((sum,round)=>sum+round.collisions,0),rounds:race.rounds,
    collisions:race.collisions,winner:null,rescues:0,finite:[race.heavy.x,race.light.x,race.energy].every(Number.isFinite),
    score:100,coverTime:race.time/race.options.speed*.6};
}
