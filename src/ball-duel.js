import {normalizeBallImages} from './ball-images.js';

export const DUEL_KEY='marble-studio-ball-duel-v1';
export const WEAPONS={
  blaster:{name:'Blaster',color:'#ffe49b',interval:1.15,speed:520,damage:1,life:6},
  burst:{name:'Seri atış',color:'#8edcff',interval:.48,speed:610,damage:1,life:7},
  scatter:{name:'Saçma',color:'#ffb273',interval:1.5,speed:490,damage:1,life:7},
  rocket:{name:'Roket',color:'#ff718d',interval:1.65,speed:360,damage:3,life:8},
  blade:{name:'Kılıç',color:'#b9a1ff',interval:.65,speed:0,damage:2,life:7},
};
export function normalizeDuel(raw={}){
  const p=raw.project??raw,seed=Number(p.seed??42),hp=Number(p.hp??15),playbackSpeed=Number(p.playbackSpeed??1);
  if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new Error('Düello tohumu geçersiz.');
  if(![10,15,20].includes(hp)||![1,1.5,2].includes(playbackSpeed))throw new Error('Düello ayarı geçersiz.');
  const ballImages=normalizeBallImages(p.ballImages??[]).slice(0,2);
  const names=[0,1].map(i=>String(p.names?.[i]??['Brazil','Argentina'][i]).trim().slice(0,32)||`Top ${i+1}`);
  const colors=[0,1].map(i=>/^#[a-f\d]{6}$/i.test(p.colors?.[i])?p.colors[i]:['#8ce6aa','#80caff'][i]);
  return {mode:'ball-duel',project:{name:'Top Düellosu',seed,hp,playbackSpeed,ballImages,names,colors,theme:['midnight','gold','chrome','aurora'].includes(p.theme)?p.theme:'midnight',sound:p.sound!==false}};
}
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const CRUISE_SPEED=185,MAX_SPEED=320;
export class BallDuel {
  constructor(settings={}){
    this.settings=normalizeDuel(settings).project;this.random=rng(this.settings.seed);
    this.arena={x:300,y:514,r:257};this.time=0;this.state='running';this.winner=null;this.hits=0;this.shots=0;
    this.bullets=[];this.pickups=[{x:300,y:514,weapon:'blaster',until:9}];this.particles=[];this.nextPickup=2.8;this.contactCooldown=0;this.collisions=0;this.onEvent=null;
    this.balls=[0,1].map(i=>{const a=i*Math.PI,v=a+Math.PI+(this.random()-.5)*.24;return {id:i,x:300+Math.cos(a)*200,y:514,vx:Math.cos(v)*CRUISE_SPEED,vy:Math.sin(v)*CRUISE_SPEED,speed:CRUISE_SPEED,speedBoost:0,kx:0,ky:0,r:28,hp:this.settings.hp,weapon:null,weaponUntil:0,cooldown:0,invulnerable:0,flash:0,trail:[],angle:0};});
    this.heartRandom=rng(this.settings.seed^0x4a17c9e3);this.heart=null;this.heartsSpawned=0;this.nextHeart=12+this.heartRandom()*6;
  }
  event(type,x,y,owner,strength=1){this.onEvent?.({type,x,y,owner,strength,time:this.time});}
  spark(x,y,owner,n=9){for(let i=0;i<n;i++){const a=this.random()*Math.PI*2,s=35+this.random()*140;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.25+this.random()*.3,owner});}if(this.particles.length>110)this.particles.splice(0,this.particles.length-110);}
  damage(target,amount,owner,direction){
    if(this.state!=='running'||target.hp<=0||target.invulnerable>0)return false;
    target.hp=Math.max(0,target.hp-amount);target.invulnerable=.13;target.flash=.16;this.hits++;
    // Rebound the component moving into a hit, then add damage-scaled momentum.
    // Head-on hits reverse travel instead of cancelling it into a lingering crawl.
    const attacker=this.balls[owner],dx=direction?.x??target.x-attacker.x,dy=direction?.y??target.y-attacker.y,length=Math.hypot(dx,dy);
    const nx=length>1e-8?dx/length:Math.cos(target.angle),ny=length>1e-8?dy/length:Math.sin(target.angle);
    const incoming=target.vx*nx+target.vy*ny;
    if(incoming<0){target.vx-=1.55*incoming*nx;target.vy-=1.55*incoming*ny;}
    target.vx+=nx*amount*185;target.vy+=ny*amount*185;
    const velocity=Math.hypot(target.vx,target.vy);
    target.speed=clamp(velocity,110,MAX_SPEED);
    target.speedBoost=Math.max(0,target.speed-CRUISE_SPEED);
    if(velocity>1e-8){target.vx*=target.speed/velocity;target.vy*=target.speed/velocity;}
    else{target.vx=nx*target.speed;target.vy=ny*target.speed;}
    target.kx+=nx*amount*65;target.ky+=ny*amount*65;
    const kick=Math.hypot(target.kx,target.ky);if(kick>260){target.kx*=260/kick;target.ky*=260/kick;}
    this.spark(target.x,target.y,owner);this.event('hit',target.x,target.y,owner,amount);
    if(target.hp===0){this.state='finished';this.winner=owner;this.spark(target.x,target.y,owner,24);}
    return true;
  }
  contain(ball){
    const dx=ball.x-this.arena.x,dy=ball.y-this.arena.y,d=Math.hypot(dx,dy),limit=this.arena.r-ball.r;
    if(d<=limit)return;
    const nx=dx/d,ny=dy/d;ball.x=this.arena.x+nx*limit;ball.y=this.arena.y+ny*limit;
    const dot=ball.vx*nx+ball.vy*ny;
    if(dot>0){ball.vx-=2*dot*nx;ball.vy-=2*dot*ny;this.event('wall',ball.x,ball.y,ball.id,.2);}
    const kick=ball.kx*nx+ball.ky*ny;if(kick>0){ball.kx-=1.4*kick*nx;ball.ky-=1.4*kick*ny;}
  }
  collide(){
    const [a,b]=this.balls;
    // Resolve overlap against both the opponent and arena, including contacts at the rim.
    for(let pass=0;pass<6;pass++){
      const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=a.r+b.r;
      if(d>=min)break;
      const nx=d>1e-8?dx/d:1,ny=d>1e-8?dy/d:0,shift=(min-d)/2+.01;
      a.x-=nx*shift;a.y-=ny*shift;b.x+=nx*shift;b.y+=ny*shift;
      if(pass===0){
        const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
        if(rel<0){
          a.vx+=rel*nx;a.vy+=rel*ny;b.vx-=rel*nx;b.vy-=rel*ny;
          const boost=this.contactCooldown===0?1.14:1;
          // Preserve exchanged momentum: the faster ball can launch the slower one and slow down.
          for(const ball of this.balls){const speed=Math.hypot(ball.vx,ball.vy);ball.speed=Math.min(MAX_SPEED,speed*boost);ball.speedBoost=Math.max(0,ball.speed-CRUISE_SPEED);if(speed>1e-8){ball.vx*=ball.speed/speed;ball.vy*=ball.speed/speed;}}
          if(this.contactCooldown===0){
            this.collisions++;this.contactCooldown=.2;
            this.spark((a.x+b.x)/2,(a.y+b.y)/2,0,5);this.event('bounce',(a.x+b.x)/2,(a.y+b.y)/2,0,.5);
          }
        }
        for(const [ball,sign] of [[a,1],[b,-1]]){const into=(ball.kx*nx+ball.ky*ny)*sign;if(into>0){ball.kx-=into*nx*sign;ball.ky-=into*ny*sign;}}
      }
      this.contain(a);this.contain(b);
    }
  }
  spawnPickup(){
    const a=this.random()*Math.PI*2,r=Math.sqrt(this.random())*(this.arena.r-75);
    const kinds=Object.keys(WEAPONS);
    this.pickups.push({x:300+Math.cos(a)*r,y:514+Math.sin(a)*r,weapon:kinds[Math.floor(this.random()*kinds.length)],until:this.time+9});
    if(this.pickups.length>3)this.pickups.shift();
  }
  updateHeart(){
    // A separate, sparse schedule keeps healing from flooding the weapon drops.
    if(this.time>=this.nextHeart&&this.heartsSpawned<2){
      const angle=this.heartRandom()*Math.PI*2,r=Math.sqrt(this.heartRandom())*(this.arena.r-65);
      this.heart={x:this.arena.x+Math.cos(angle)*r,y:this.arena.y+Math.sin(angle)*r,until:this.time+7};
      this.heartsSpawned++;this.nextHeart=this.time+18+this.heartRandom()*8;
    }
    if(!this.heart)return;
    if(this.time>=this.heart.until){this.heart=null;return;}
    for(const ball of this.balls){
      if(ball.hp<=0||ball.hp>=this.settings.hp||Math.hypot(ball.x-this.heart.x,ball.y-this.heart.y)>=ball.r+16)continue;
      ball.hp=Math.min(this.settings.hp,ball.hp+1);ball.heal=.65;
      this.heart=null;this.event('heal',ball.x,ball.y,ball.id);break;
    }
  }
  fire(b,target){
    const w=WEAPONS[b.weapon];if(!w)return;
    const dx=target.x-b.x,dy=target.y-b.y,d=Math.hypot(dx,dy);
    // Aim at the current position. Projectiles keep their launch direction, so movement can evade them.
    b.angle=Math.atan2(dy,dx);
    if(b.weapon==='blade'){
      if(d<b.r+target.r+68){this.damage(target,w.damage,b.id);b.swing=.2;this.event('shot',b.x,b.y,b.id);}
      b.cooldown=w.interval;return;
    }
    const offsets=b.weapon==='scatter'?[-.18,0,.18]:[0];
    for(const offset of offsets){const a=b.angle+offset;this.bullets.push({x:b.x+Math.cos(a)*34,y:b.y+Math.sin(a)*34,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,owner:b.id,weapon:b.weapon,r:b.weapon==='rocket'?6:3.5,damage:w.damage,life:2});this.shots++;}
    b.cooldown=w.interval;this.event('shot',b.x,b.y,b.id);
  }
  step(dt){
    if(!Number.isFinite(dt)||dt<=0)return;
    // Consumers advance at a fixed 120 Hz; subdivide larger calls for collision safety.
    if(dt>1/120+.000001){let remaining=Math.min(dt,.25);while(remaining>1e-8){const part=Math.min(1/120,remaining);this.step(part);remaining-=part;}return;}
    for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
    this.particles=this.particles.filter(p=>p.life>0);
    if(this.state!=='running')return;
    this.time+=dt;this.contactCooldown=Math.max(0,this.contactCooldown-dt);
    for(const b of this.balls){
      b.flash=Math.max(0,b.flash-dt);b.invulnerable=Math.max(0,b.invulnerable-dt);b.swing=Math.max(0,(b.swing??0)-dt);b.cooldown-=dt;
      b.heal=Math.max(0,(b.heal??0)-dt);
      if(b.weapon&&this.time>=b.weaponUntil)b.weapon=null;
      const target=this.balls[1-b.id];b.angle=Math.atan2(target.y-b.y,target.x-b.x);
      // Extra impact speed fades; slow contestants stay slow and the new heading persists.
      const boost=b.speedBoost??0,remainingBoost=boost*Math.exp(-dt/1.1);
      b.speed-=boost-remainingBoost;b.speedBoost=remainingBoost;
      // Weapons aim independently; only walls, contact and damage change the heading.
      const speed=Math.hypot(b.vx,b.vy)||1;b.vx*=b.speed/speed;b.vy*=b.speed/speed;
      const decay=Math.exp(-dt/.15),slide=.15*(1-decay);
      b.x+=b.vx*dt+b.kx*slide;b.y+=b.vy*dt+b.ky*slide;b.kx*=decay;b.ky*=decay;
      this.contain(b);
      b.trail.push({x:b.x,y:b.y});if(b.trail.length>16)b.trail.shift();
    }
    this.collide();
    if(this.time>=this.nextPickup){this.spawnPickup();this.nextPickup=this.time+2.8;}
    this.pickups=this.pickups.filter(p=>{if(p.until<=this.time)return false;for(const ball of this.balls)if(Math.hypot(p.x-ball.x,p.y-ball.y)<ball.r+18){ball.weapon=p.weapon;ball.weaponUntil=this.time+WEAPONS[p.weapon].life;ball.cooldown=.3;this.spark(p.x,p.y,ball.id,12);this.event('pickup',p.x,p.y,ball.id);return false;}return true;});
    this.updateHeart();
    for(const ball of this.balls){if(this.state==='running'&&ball.cooldown<=0)this.fire(ball,this.balls[1-ball.id]);}
    for(const bullet of this.bullets){
      if(this.state!=='running')break;
      const target=this.balls[1-bullet.owner],sx=bullet.x,sy=bullet.y,ux=bullet.vx*dt,uy=bullet.vy*dt;
      const t=clamp(((target.x-sx)*ux+(target.y-sy)*uy)/(ux*ux+uy*uy||1),0,1);
      bullet.x+=ux;bullet.y+=uy;bullet.life-=dt;
      if(Math.hypot(sx+ux*t-target.x,sy+uy*t-target.y)<target.r+bullet.r){this.damage(target,bullet.damage,bullet.owner,{x:bullet.vx,y:bullet.vy});bullet.life=0;}
      if(Math.hypot(bullet.x-300,bullet.y-514)>this.arena.r)bullet.life=0;
    }
    this.bullets=this.bullets.filter(p=>p.life>0);
    // A rare stalemate is a draw, never an invented winner.
    if(this.time>=90&&this.state==='running'){this.state='finished';this.winner=null;}
  }
}
export function probeDuel(recipe){
  const game=new BallDuel(recipe);let steps=0,first=null,last=0,quiet=0;
  game.onEvent=e=>{if(e.type==='hit'){const t=game.time/game.settings.playbackSpeed;first??=t;quiet=Math.max(quiet,t-last);last=t;}};
  while(game.state==='running'&&steps<10810){game.step(1/120);steps++;}
  const seconds=steps/120/(recipe.playbackSpeed??1);
  return {complete:game.state==='finished',simulationSeconds:seconds,winner:game.winner===null?'Draw':game.settings.names[game.winner],finite:game.balls.every(b=>Number.isFinite(b.x+b.y)),hits:game.hits,rescues:0,score:100,coverTime:seconds*.55,firstEventSeconds:first??seconds,longestQuietSeconds:Math.max(quiet,seconds-last)};
}
