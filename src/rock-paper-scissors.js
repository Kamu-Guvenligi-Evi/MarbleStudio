export const RPS_KEY='marble-studio-rock-paper-scissors-v1';
export const TYPES=['rock','scissors','paper'];
export const NAMES={rock:'Taş',paper:'Kâğıt',scissors:'Makas'};
export const BEATS={rock:'scissors',scissors:'paper',paper:'rock'};
export const ARENA={x:42,y:280,size:456};
export const RPS_MAPS={
  classic:{name:'Klasik arena',obstacles:[]},
  orbit:{name:'Merkez ada',obstacles:[{shape:'circle',x:270,y:498,r:54}]},
  pillars:{name:'Dört sütun',obstacles:[{shape:'circle',x:166,y:452,r:22},{shape:'circle',x:374,y:452,r:22},{shape:'circle',x:166,y:554,r:22},{shape:'circle',x:374,y:554,r:22}]},
  gates:{name:'Dar geçit',obstacles:[{shape:'rect',x:42,y:493,width:164,height:16},{shape:'rect',x:334,y:493,width:164,height:16}]},
  rotor:{name:'Çark',moving:true,description:'Dönen kol, karşılaşmaları her turda başka bir yöne savurur.',obstacles:[{shape:'capsule',x:270,y:508,half:110,r:9,angle:0,motion:'spin'}]},
  binary:{name:'İkiz yörünge',moving:true,description:'İki uydu merkezin çevresinde dolaşır; grupların arasına girip düzeni bozar.',obstacles:[{shape:'circle',x:270,y:508,r:16},{shape:'circle',x:366,y:508,r:24,motion:'orbit',phase:0},{shape:'circle',x:174,y:508,r:24,motion:'orbit',phase:Math.PI}]},
  pulse:{name:'Nefes alan geçit',moving:true,description:'Geçit daralıp genişler. Biriken gruplar açılan aralıktan karşı tarafa geçer.',obstacles:[{shape:'rect',x:42,y:493,width:164,height:16,motion:'gate',side:-1},{shape:'rect',x:334,y:493,width:164,height:16,motion:'gate',side:1}]},
  pinball:{name:'Langırt',description:'Işıklı tamponlar art arda sekmeler ve beklenmedik yön değişiklikleri yaratır.',obstacles:[...Array.from({length:4},(_,i)=>({shape:'circle',x:120+i*100,y:459,r:17,bumper:true})),...Array.from({length:3},(_,i)=>({shape:'circle',x:170+i*100,y:548,r:17,bumper:true}))]},
  chicane:{name:'Şikan',description:'Zıt yönlerden uzanan bariyerler, grupları zikzak bir rotada buluşturur.',obstacles:[{shape:'capsule',x:178,y:452,half:98,r:9,angle:0},{shape:'capsule',x:362,y:554,half:98,r:9,angle:0}]},
  pendulum:{name:'Sarkaç',moving:true,description:'Sağa sola salınan kol, arenanın iki tarafını sırayla süpürür.',obstacles:[{shape:'capsule',x:270,y:415,half:105,r:8,angle:Math.PI/2,motion:'pendulum'}]},
};
export function randomFrom(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function normalizeRps(raw={}){
  const integer=(n,f,min,max)=>Number.isInteger(Number(n))&&Number(n)>=min&&Number(n)<=max?Number(n):f;
  return {seed:integer(raw.seed,42,0,4294967295),count:[10,20,30].includes(Number(raw.count))?Number(raw.count):20,
    speed:[1,1.5,2].includes(Number(raw.speed))?Number(raw.speed):1,
    title:String(raw.title??'Who will win: Rock, Paper, or Scissors?').trim().slice(0,70),
    sound:raw.sound!==false,soundStyle:raw.soundStyle??'balanced',soundOverrides:raw.soundOverrides??{wall:'off',bounce:'off'},
    background:raw.background==='minimal'?'minimal':'nebula',map:Object.hasOwn(RPS_MAPS,raw.map)?raw.map:'classic'};
}
// A contact changes only the losing piece's type. Nobody is removed or spawned.
export function resolveTypes(a,b){if(a===b)return null;return BEATS[a]===b?a:b;}
export class RockPaperScissors{
  constructor(settings={}){
    this.settings=normalizeRps(settings);this.random=randomFrom(this.settings.seed);this.time=0;this.state='running';this.winner=null;this.conversions=0;this.flashes=[];this.onEvent=null;
    this.obstacles=RPS_MAPS[this.settings.map].obstacles.map(o=>({...o}));
    this.updateObstacles(0);
    const n=this.settings.count,columns=Math.ceil(Math.sqrt(n)),spacing=27;
    const centers={rock:{x:136,y:361},scissors:{x:404,y:361},paper:{x:270,y:636}};
    this.pieces=TYPES.flatMap((type,group)=>Array.from({length:n},(_,i)=>{
      const angle=this.random()*Math.PI*2,center=centers[type],row=Math.floor(i/columns),col=i%columns;
      return {id:group*n+i,type,x:center.x+(col-(columns-1)/2)*spacing+(this.random()-.5)*3,y:center.y+(row-(Math.ceil(n/columns)-1)/2)*spacing+(this.random()-.5)*3,vx:Math.cos(angle)*92,vy:Math.sin(angle)*92,r:10.5,cooldown:0,flash:0};
    }));
  }
  counts(){const counts={rock:0,scissors:0,paper:0};for(const p of this.pieces)counts[p.type]++;return counts;}
  updateObstacles(dt){
    for(const o of this.obstacles){
      o.flash=Math.max(0,(o.flash??0)-dt);o.vx=0;o.vy=0;o.omega=0;
      if(o.motion==='spin'){o.angle=this.time*.7;o.omega=.7;}
      else if(o.motion==='orbit'){
        const angle=this.time*.65+o.phase;o.x=270+96*Math.cos(angle);o.y=508+96*Math.sin(angle);o.vx=-96*.65*Math.sin(angle);o.vy=96*.65*Math.cos(angle);
      }else if(o.motion==='gate'){
        const gap=136+80*Math.sin(this.time*.7),velocity=56*Math.cos(this.time*.7);
        o.x=o.side<0?42:270+gap/2;o.width=(456-gap)/2;o.vx=o.side*velocity/2;
      }else if(o.motion==='pendulum'){
        o.angle=Math.PI/2+.85*Math.sin(this.time*.85);o.omega=.85*.85*Math.cos(this.time*.85);
        o.x=270+o.half*Math.cos(o.angle);o.y=310+o.half*Math.sin(o.angle);
        o.vx=-o.half*Math.sin(o.angle)*o.omega;o.vy=o.half*Math.cos(o.angle)*o.omega;
      }
    }
  }
  event(type,x,y,extra={}){this.onEvent?.({type,x,y,time:this.time,...extra});}
  contact(a,b){
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),size=a.r+b.r;
    if(d>=size)return;
    const nx=d>1e-8?dx/d:1,ny=d>1e-8?dy/d:0,overlap=(size-d)/2+.01;
    a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;
    const closing=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
    if(closing>0){a.vx-=closing*nx;a.vy-=closing*ny;b.vx+=closing*nx;b.vy+=closing*ny;}
    const winner=resolveTypes(a.type,b.type);
    if(winner&&a.cooldown<=0&&b.cooldown<=0){
      const loser=a.type===winner?b:a,previous=loser.type;
      loser.type=winner;loser.flash=.24;a.cooldown=b.cooldown=.075;this.conversions++;
      this.flashes.push({x:loser.x,y:loser.y,type:winner,life:.24});
      this.event('hit',loser.x,loser.y,{winner,previous});
    }else if(!winner&&closing>0)this.event('bounce',(a.x+b.x)/2,(a.y+b.y)/2);
  }
  bounds(p,emit=true){
    const minX=ARENA.x+p.r,maxX=ARENA.x+ARENA.size-p.r,minY=ARENA.y+p.r,maxY=ARENA.y+ARENA.size-p.r;
    let hit=false;
    if(p.x<minX){p.x=minX;p.vx=Math.abs(p.vx);hit=true;}if(p.x>maxX){p.x=maxX;p.vx=-Math.abs(p.vx);hit=true;}
    if(p.y<minY){p.y=minY;p.vy=Math.abs(p.vy);hit=true;}if(p.y>maxY){p.y=maxY;p.vy=-Math.abs(p.vy);hit=true;}
    if(hit&&emit)this.event('wall',p.x,p.y);
  }
  obstacleContact(p,obstacle,emit=true){
    let nx,ny,penetration;
    if(obstacle.shape==='circle'||obstacle.shape==='capsule'){
      let x=obstacle.x,y=obstacle.y;
      if(obstacle.shape==='capsule'){
        const cos=Math.cos(obstacle.angle),sin=Math.sin(obstacle.angle),projection=Math.max(-obstacle.half,Math.min(obstacle.half,(p.x-x)*cos+(p.y-y)*sin));
        x+=projection*cos;y+=projection*sin;
      }
      const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy),radius=p.r+obstacle.r;
      if(d>=radius)return;
      nx=d>1e-8?dx/d:obstacle.shape==='capsule'?-Math.sin(obstacle.angle):1;ny=d>1e-8?dy/d:obstacle.shape==='capsule'?Math.cos(obstacle.angle):0;penetration=radius-d;
    }else{
      const x=Math.max(obstacle.x,Math.min(obstacle.x+obstacle.width,p.x)),y=Math.max(obstacle.y,Math.min(obstacle.y+obstacle.height,p.y));
      const dx=p.x-x,dy=p.y-y,d=Math.hypot(dx,dy);
      if(d>=p.r)return;
      if(d>1e-8){nx=dx/d;ny=dy/d;penetration=p.r-d;}
      else{
        const edges=[{distance:p.x-obstacle.x,nx:-1,ny:0},{distance:obstacle.x+obstacle.width-p.x,nx:1,ny:0},{distance:p.y-obstacle.y,nx:0,ny:-1},{distance:obstacle.y+obstacle.height-p.y,nx:0,ny:1}];
        const edge=edges.reduce((a,b)=>a.distance<b.distance?a:b);nx=edge.nx;ny=edge.ny;penetration=p.r+edge.distance;
      }
    }
    p.x+=nx*(penetration+.001);p.y+=ny*(penetration+.001);
    // Reflect in the obstacle's moving frame, including the rotating contact point.
    const surfaceX=(obstacle.vx??0)-(obstacle.omega??0)*(p.y-ny*p.r-obstacle.y);
    const surfaceY=(obstacle.vy??0)+(obstacle.omega??0)*(p.x-nx*p.r-obstacle.x);
    const dot=(p.vx-surfaceX)*nx+(p.vy-surfaceY)*ny;
    if(dot<0){p.vx-=2*dot*nx;p.vy-=2*dot*ny;obstacle.flash=.18;if(emit)this.event('wall',p.x,p.y);}
  }
  step(dt){
    if(this.state!=='running'||!Number.isFinite(dt)||dt<=0)return;
    // Bound substeps so large external time steps cannot tunnel through opponents.
    if(dt>1/120+1e-8){const steps=Math.ceil(dt*120);for(let i=0;i<steps;i++)this.step(dt/steps);return;}
    this.time+=dt;
    this.updateObstacles(dt);
    for(const p of this.pieces){
      p.cooldown=Math.max(0,p.cooldown-dt);p.flash=Math.max(0,p.flash-dt);
      const speed=Math.hypot(p.vx,p.vy),target=Math.max(62,Math.min(125,speed));
      if(speed>1e-8){p.vx*=target/speed;p.vy*=target/speed;}
      else{const angle=this.random()*Math.PI*2;p.vx=Math.cos(angle)*92;p.vy=Math.sin(angle)*92;}
      p.x+=p.vx*dt;p.y+=p.vy*dt;this.bounds(p);
      for(const obstacle of this.obstacles)this.obstacleContact(p,obstacle);
    }
    for(let i=0;i<this.pieces.length;i++)for(let j=i+1;j<this.pieces.length;j++)this.contact(this.pieces[i],this.pieces[j]);
    for(const p of this.pieces){for(const obstacle of this.obstacles)this.obstacleContact(p,obstacle,false);this.bounds(p,false);}
    this.flashes=this.flashes.filter(f=>(f.life-=dt)>0);
    const counts=this.counts(),alive=TYPES.filter(type=>counts[type]>0);
    if(alive.length===1){this.state='won';this.winner=alive[0];this.event('win',270,508,{winner:this.winner});}
    else if(this.time>=180){this.state='timeout';this.event('timeout',270,508);}
  }
}
