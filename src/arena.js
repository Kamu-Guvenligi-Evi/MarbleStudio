import {COLORS,NAMES,random} from './physics.js';
import {ballImageColor,normalizeBallImages} from './ball-images.js';
import {normalizeNames} from './presentation.js';
import {TerritoryBattle} from './territory.js';

export const ARENA={x:270,y:510,radius:238};
export const arenaStringWidth=arena=>arena.arenaLinkMode==='prelinked'?1.15:1.5;
const WALL_SPEED_GAIN=.01;
export function pointSegmentDistance(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
  return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);
}
// Test both bodies at the same instant: a string moves with its owner.
// The trimmed endpoint cannot move faster than the owner, so the sum of
// both displacements bounds how much the separation can change in a step.
export function sweptLinkContact(start,end,ownerStart,ownerEnd,anchor,radius,clearance){
  if(Math.max(start.x,end.x)+radius<Math.min(ownerStart.x,ownerEnd.x,anchor.x)||
    Math.min(start.x,end.x)-radius>Math.max(ownerStart.x,ownerEnd.x,anchor.x)||
    Math.max(start.y,end.y)+radius<Math.min(ownerStart.y,ownerEnd.y,anchor.y)||
    Math.min(start.y,end.y)-radius>Math.max(ownerStart.y,ownerEnd.y,anchor.y))return false;
  const vx=end.x-start.x,vy=end.y-start.y,ox=ownerEnd.x-ownerStart.x,oy=ownerEnd.y-ownerStart.y;
  const travel=Math.hypot(vx,vy)+Math.hypot(ox,oy);
  const distanceAt=t=>{
    const px=start.x+vx*t,py=start.y+vy*t,ax=ownerStart.x+ox*t,ay=ownerStart.y+oy*t;
    const dx=anchor.x-ax,dy=anchor.y-ay,length=Math.hypot(dx,dy);
    const trim=Math.min(1,clearance/(length||1)),fx=ax+dx*trim,fy=ay+dy*trim;
    const sx=anchor.x-fx,sy=anchor.y-fy;
    const u=Math.max(0,Math.min(1,((px-fx)*sx+(py-fy)*sy)/(sx*sx+sy*sy||1)));
    return Math.hypot(px-fx-sx*u,py-fy-sy*u);
  };
  const first=distanceAt(0),last=distanceAt(1);
  if(first<=radius||last<=radius)return true;
  const intersects=(lo,hi,a,b,depth)=>{
    const span=travel*(hi-lo);
    if(a+b>2*radius+span)return false;
    const mid=(lo+hi)/2,d=distanceAt(mid);
    if(d<=radius)return true;
    // Subpixel tolerance bounds work for grazing contacts without deep recursion.
    if(span<.01||depth===20)return d<=radius+.01;
    return intersects(lo,mid,a,d,depth+1)||intersects(mid,hi,d,b,depth+1);
  };
  return intersects(0,1,first,last,0);
}
export class Arena {
  constructor({seed=2048,count=12,energy=1,ballImages=[],ballNames=[],rule='elimination',duration=60,onHit=()=>{},arenaGame='links',arenaLinkMode='wall',arenaInitialLinks=15,arenaShape='triangle',territoryDuration=60}={}){
    if(arenaGame==='territory')return new TerritoryBattle({seed,count,ballImages,ballNames,onHit,arenaShape,territoryDuration});
    this.mode='arena';this.seed=seed;this.rule=rule;this.duration=duration;this.onHit=onHit;
    this.arenaLinkMode=arenaLinkMode==='prelinked'?'prelinked':'wall';
    this.arenaInitialLinks=Number.isInteger(arenaInitialLinks)&&arenaInitialLinks>=1&&arenaInitialLinks<=150?arenaInitialLinks:15;
    this.time=0;this.state='ready';this.finished=[];this.particles=[];this.links=[];this.events=[];this.totalCuts=0;
    this.sectionCount=1;this.sections=[];this.sequence=[];this.finishY=960;this.isCustom=true;
    this.ballNames=normalizeNames(ballNames);this.ballImages=normalizeBallImages(ballImages);
    const rng=random(seed);this.fx=random(seed^0x14511);
    const ballCount=Math.max(2,Math.min(20,count)),fan=this.arenaLinkMode==='prelinked';
    const radius=fan?30:20;
    const sector=Math.PI*2/ballCount,spawnRadius=fan?Math.max(80,(radius+1)/Math.sin(Math.PI/ballCount)):150;
    this.balls=Array.from({length:ballCount},(_,id)=>{
      const jitter=rng()*.1,angle=id*sector+(fan?-Math.PI/2:jitter),heading=rng()*Math.PI*2,speed=(165+rng()*35)*1.08*Math.max(.85,Math.min(1.15,Number(energy)||1));
      return {id,name:this.ballNames[id]??NAMES[id],imageSrc:this.ballImages[id],get color(){return ballImageColor(this.imageSrc,COLORS[id]);},
        body:{position:{x:270+Math.cos(angle)*spawnRadius,y:510+Math.sin(angle)*spawnRadius},velocity:{x:Math.cos(heading)*speed,y:Math.sin(heading)*speed},circleRadius:radius},
        speed,initialSpeed:speed,trail:[],finishedAt:null,eliminatedAt:null,cuts:0,lastWall:-1};
    });
    const initialLinks=this.arenaLinkMode==='prelinked'?this.arenaInitialLinks:rule==='elimination'?3:0;
    for(const ball of this.balls)for(let j=0;j<initialLinks;j++){
      // Each fan owns one continuous arc. Half-step spacing avoids shared anchors.
      const offset=fan?-Math.PI/2-sector/2+(j+.5)/initialLinks*sector:(j-1)*.15;
      this.addLink(ball,ball.id*sector+offset);
    }
  }
  addLink(ball,angle){this.links.push({owner:ball.id,x:270+Math.cos(angle)*238,y:510+Math.sin(angle)*238,born:this.time});}
  linkCount(ball){return this.links.reduce((n,l)=>n+(l.owner===ball.id),0);}
  ranking(){
    const counts=new Uint32Array(this.balls.length);for(const link of this.links)counts[link.owner]++;
    return [...this.balls].sort((a,b)=>(a.eliminatedAt!==null)-(b.eliminatedAt!==null)||(a.eliminatedAt!==null&&b.eliminatedAt!==null?b.eliminatedAt-a.eliminatedAt:0)||counts[b.id]-counts[a.id]||b.cuts-a.cuts||a.id-b.id);
  }
  start(){if(this.state==='ready')this.state='running';}
  spark(x,y,color){for(let i=0;i<7&&this.particles.length<180;i++)this.particles.push({x,y,vx:(this.fx()-.5)*150,vy:(this.fx()-.5)*150,life:1,color});}
  step(ms=1000/120){
    if(this.state!=='running')return;
    // Fixed physics steps plus swept contacts keep fast cuts consistent.
    let remaining=ms/1000;while(remaining>1e-8&&this.state==='running'){const dt=Math.min(remaining,1/120);this.tick(dt);remaining-=dt;}
  }
  tick(dt){
    this.time+=dt;const active=this.balls.filter(b=>b.eliminatedAt===null);
    const previous=this.balls.map(b=>({...b.body.position}));
    for(const ball of active){const p=ball.body.position,v=ball.body.velocity;p.x+=v.x*dt;p.y+=v.y*dt;
      const dx=p.x-270,dy=p.y-510,d=Math.hypot(dx,dy),limit=238-ball.body.circleRadius;
      if(d>=limit){const nx=dx/d,ny=dy/d,dot=v.x*nx+v.y*ny;p.x=270+nx*(limit-.01);p.y=510+ny*(limit-.01);
        if(dot>0){
          v.x-=2*dot*nx;v.y-=2*dot*ny;
          // Add 1% of starting speed per impact, keeping the increase gradual and linear.
          ball.speed+=ball.initialSpeed*WALL_SPEED_GAIN;
          if(this.time-ball.lastWall>.12){this.addLink(ball,Math.atan2(ny,nx));ball.lastWall=this.time;this.onHit(4,p.x);this.spark(270+nx*238,510+ny*238,ball.color);}
        }
      }
    }
    for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
      const a=active[i].body,b=active[j].body,dx=b.position.x-a.position.x,dy=b.position.y-a.position.y,d=Math.hypot(dx,dy),limit=a.circleRadius+b.circleRadius;
      if(d<limit){const nx=d?dx/d:1,ny=d?dy/d:0,push=(limit-d)/2+.01;a.position.x-=nx*push;a.position.y-=ny*push;b.position.x+=nx*push;b.position.y+=ny*push;
        const relative=(a.velocity.x-b.velocity.x)*nx+(a.velocity.y-b.velocity.y)*ny;
        if(relative>0){a.velocity.x-=relative*nx;a.velocity.y-=relative*ny;b.velocity.x+=relative*nx;b.velocity.y+=relative*ny;}
      }
    }
    for(const ball of active){const p=ball.body.position,v=ball.body.velocity,s=Math.hypot(v.x,v.y)||1;v.x=v.x/s*ball.speed;v.y=v.y/s*ball.speed;
      const d=Math.hypot(p.x-270,p.y-510),limit=238-ball.body.circleRadius;if(d>limit){p.x=270+(p.x-270)/d*limit;p.y=510+(p.y-510)/d*limit;}
      ball.trail.push({...p});if(ball.trail.length>16)ball.trail.shift();
    }
    const cut=new Set(),cutEffects=new Map();
    for(const link of this.links){
      const owner=this.balls[link.owner],p=owner.body.position;
      const clearance=owner.body.circleRadius;
      // Detect all cuts against the same frame before applying eliminations.
      // Newly created strings exist only at the end of this step, not along its past path.
      const fresh=link.born===this.time;
      const cutter=active.find(b=>b.id!==owner.id&&sweptLinkContact(fresh?b.body.position:previous[b.id],b.body.position,fresh?p:previous[owner.id],p,link,b.body.circleRadius+arenaStringWidth(this)/2,clearance));
      if(cutter){cut.add(link);cutter.cuts++;this.totalCuts++;cutEffects.set(cutter.id*this.balls.length+owner.id,{cutter,owner});}
    }
    // A fan slice may cut dozens of strings; emit one burst per pair, keeping every cut.
    for(const {cutter,owner} of cutEffects.values()){
      this.spark(cutter.body.position.x,cutter.body.position.y,owner.color);
      this.events.unshift({cutter:cutter.id,owner:owner.id,time:this.time});
    }
    if(cutEffects.size)this.onHit(6,cutEffects.values().next().value.cutter.body.position.x);
    this.links=this.links.filter(l=>!cut.has(l));this.events=this.events.filter(e=>this.time-e.time<2.5).slice(0,3);
    if(this.rule==='elimination'&&this.time>1.5){for(const ball of active)if(!this.linkCount(ball)){ball.eliminatedAt=this.time;this.spark(ball.body.position.x,ball.body.position.y,ball.color);}}
    for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt*2;}this.particles=this.particles.filter(p=>p.life>0);
    if((this.rule==='timed'&&this.time>=this.duration)||(this.rule==='elimination'&&this.balls.filter(b=>b.eliminatedAt===null).length<=1)){
      if(this.rule==='timed')this.time=Math.min(this.time,this.duration);this.state='finished';this.finished=this.ranking();
      this.finished.forEach(b=>b.finishedAt=this.time);
      const first=this.finished[0];this.winners=this.finished.filter(b=>b.eliminatedAt===null&&this.linkCount(b)===this.linkCount(first)&&b.cuts===first.cuts);
    }
  }
  dispose(){}
}
