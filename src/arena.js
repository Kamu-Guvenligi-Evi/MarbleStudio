import {COLORS,NAMES,random} from './physics.js';
import {ballImageColor,normalizeBallImages} from './ball-images.js';
import {normalizeNames} from './presentation.js';
import {TerritoryBattle} from './territory.js';

export const ARENA={x:270,y:510,radius:238};
const WALL_SPEED_GAIN=.0025;
export function pointSegmentDistance(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
  return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);
}
export class Arena {
  constructor({seed=2048,count=12,energy=1,ballImages=[],ballNames=[],rule='elimination',duration=60,onHit=()=>{},arenaGame='links',arenaShape='triangle',territoryDuration=45}={}){
    if(arenaGame==='territory')return new TerritoryBattle({seed,count,ballImages,ballNames,onHit,arenaShape,territoryDuration});
    this.mode='arena';this.seed=seed;this.rule=rule;this.duration=duration;this.onHit=onHit;
    this.time=0;this.state='ready';this.finished=[];this.particles=[];this.links=[];this.events=[];this.totalCuts=0;
    this.sectionCount=1;this.sections=[];this.sequence=[];this.finishY=960;this.isCustom=true;
    this.ballNames=normalizeNames(ballNames);this.ballImages=normalizeBallImages(ballImages);
    const rng=random(seed);this.fx=random(seed^0x14511);
    this.balls=Array.from({length:Math.max(6,Math.min(20,count))},(_,id)=>{
      const angle=id/count*Math.PI*2+rng()*.1,heading=rng()*Math.PI*2,speed=(165+rng()*35)*1.08*Math.max(.85,Math.min(1.15,Number(energy)||1));
      return {id,name:this.ballNames[id]??NAMES[id],imageSrc:this.ballImages[id],get color(){return ballImageColor(this.imageSrc,COLORS[id]);},
        body:{position:{x:270+Math.cos(angle)*150,y:510+Math.sin(angle)*150},velocity:{x:Math.cos(heading)*speed,y:Math.sin(heading)*speed},circleRadius:20},
        speed,initialSpeed:speed,trail:[],finishedAt:null,eliminatedAt:null,cuts:0,lastWall:-1};
    });
    if(rule==='elimination')for(const ball of this.balls)for(let j=0;j<3;j++)this.addLink(ball,ball.id/count*Math.PI*2+(j-1)*.15);
  }
  addLink(ball,angle){this.links.push({owner:ball.id,x:270+Math.cos(angle)*238,y:510+Math.sin(angle)*238,born:this.time});}
  linkCount(ball){return this.links.reduce((n,l)=>n+(l.owner===ball.id),0);}
  ranking(){return [...this.balls].sort((a,b)=>(a.eliminatedAt!==null)-(b.eliminatedAt!==null)||(a.eliminatedAt!==null&&b.eliminatedAt!==null?b.eliminatedAt-a.eliminatedAt:0)||this.linkCount(b)-this.linkCount(a)||b.cuts-a.cuts||a.id-b.id);}
  start(){if(this.state==='ready')this.state='running';}
  spark(x,y,color){for(let i=0;i<7&&this.particles.length<180;i++)this.particles.push({x,y,vx:(this.fx()-.5)*150,vy:(this.fx()-.5)*150,life:1,color});}
  step(ms=1000/120){
    if(this.state!=='running')return;
    // Small fixed steps prevent fast balls skipping thin links.
    let remaining=ms/1000;while(remaining>1e-8&&this.state==='running'){const dt=Math.min(remaining,1/120);this.tick(dt);remaining-=dt;}
  }
  tick(dt){
    this.time+=dt;const active=this.balls.filter(b=>b.eliminatedAt===null);
    for(const ball of active){const p=ball.body.position,v=ball.body.velocity;p.x+=v.x*dt;p.y+=v.y*dt;
      const dx=p.x-270,dy=p.y-510,d=Math.hypot(dx,dy),limit=238-ball.body.circleRadius;
      if(d>=limit){const nx=dx/d,ny=dy/d,dot=v.x*nx+v.y*ny;p.x=270+nx*(limit-.01);p.y=510+ny*(limit-.01);
        if(dot>0){
          v.x-=2*dot*nx;v.y-=2*dot*ny;
          // Add 0.25% of starting speed per impact, keeping the increase gradual and linear.
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
    const cut=new Set();
    if(this.time>1.5)for(const link of this.links){
      if(this.time-link.born<.2)continue;
      const owner=this.balls[link.owner],p=owner.body.position,dx=link.x-p.x,dy=link.y-p.y,d=Math.hypot(dx,dy);
      if(d<25)continue;
      const from={x:p.x+dx/d*25,y:p.y+dy/d*25};
      // Detect all cuts against the same frame before applying eliminations.
      const cutter=active.find(b=>b.id!==owner.id&&pointSegmentDistance(b.body.position,from,link)<b.body.circleRadius);
      if(cutter){cut.add(link);cutter.cuts++;this.totalCuts++;this.spark(cutter.body.position.x,cutter.body.position.y,owner.color);this.onHit(6,cutter.body.position.x);this.events.unshift({cutter:cutter.id,owner:owner.id,time:this.time});}
    }
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
