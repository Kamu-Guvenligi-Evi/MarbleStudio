import {SPIRAL_VARIANTS,spiralVariant} from './spiral-variants.js';
import { SPIRAL_THEMES, normalizeSpiralTheme } from './spiral-themes.js';
import { NAMES, random } from './physics.js';

import {SpiralIce} from './spiral-ice.js';
const TAU=Math.PI*2;
export const SPIRAL={x:270,y:480,width:37,limit:64,pitch:41,radius:260,ballRadius:10};
const points=[];
let length=0;
const endAngle=245/(41/TAU);
for(let i=0;i<=3200;i++){
  const angle=i/3200*endAngle,radius=245-angle*41/TAU;
  const p={x:270+Math.cos(angle)*radius,y:480+Math.sin(angle)*radius,angle,radius,s:0};
  if(i)length+=Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y);
  p.s=length;points.push(p);
}
export const spiralPath=points;
export const spiralLength=length;
export function spiralPoint(distance,offset=0){
  const s=Math.max(0,Math.min(length,distance));let lo=0,hi=points.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(points[mid].s<s)lo=mid;else hi=mid;}
  const a=points[lo],b=points[hi],t=(s-a.s)/(b.s-a.s||1),angle=a.angle+(b.angle-a.angle)*t;
  const radius=a.radius+(b.radius-a.radius)*t+offset;
  return {x:270+Math.cos(angle)*radius,y:480+Math.sin(angle)*radius};
}
const distanceAtAngle=angle=>points.find(p=>p.angle>=angle).s;
export const initialFront=distanceAtAngle(Math.PI/2);
export const gateDistance=distanceAtAngle(1.87);
export const gatePoint={x:200,y:697};
const GRAVITY=650,ENTRY_SPEED=Math.sqrt(650*650+2*GRAVITY*(480-276));
const BALL_HUES=[336,28,54,134,170,214,258,286];

export class Spiral{
  constructor({variant='classic',theme='ice',seed=2048,count=1,ballImages=[],ballNames=[],onHit=()=>{}}={}){
    this.variant=spiralVariant(variant);this.dynamics=SPIRAL_VARIANTS[this.variant];this.theme=normalizeSpiralTheme(theme);this.palette=SPIRAL_THEMES[this.theme].hues||BALL_HUES;this.mode='spiral';this.seed=seed;this.rng=random(seed);this.onHit=onHit;
    this.time=0;this.state='ready';this.finished=[];this.balls=[];this.particles=[];
    this.sectionCount=1;this.sections=[];this.sequence=[];this.finishY=960;
    this.cleared=initialFront;this.lastSpawn=-10;this.totalBreaks=0;
    this.ice=new SpiralIce();
    this.nextMultiplier=2;this.nextBallId=0;this.totalConsumed=0;this.round=1;this.respawnAt=null;
    this.images=ballImages;this.names=ballNames;
    for(let i=0;i<Math.max(1,Math.min(20,count));i++)this.addBall(1/60+i*.18);
  }
  get multiplier(){return this.nextMultiplier;}
  addBall(delay=0){
    const id=this.nextBallId++;
    const ball={id,name:this.names[id%Math.max(1,this.names.length)]||NAMES[id%NAMES.length],
      imageSrc:this.images[id%Math.max(1,this.images.length)],hue:this.palette[id%this.palette.length],color:'hsl('+this.palette[id%this.palette.length]+' 95% 60%)',
      distance:0,velocity:650,entrySpeed:ENTRY_SPEED,airborne:true,multiplied:false,release:this.time+delay,
      trail:[],finishedAt:null,body:{position:{x:515,y:276},circleRadius:10}};
    this.balls.push(ball);return ball;
  }
  get progress(){return 1-this.ice.remaining/this.ice.initial;}
  ranking(){return [...this.balls].sort((a,b)=>b.distance-a.distance||a.id-b.id);}
  sound(type,strength,x,seed=17){this.onHit(strength,x,{type,theme:this.theme,seed});}
  start(){if(this.state==='ready'){this.state='running';this.sound('drop',3,515);}}
  step(ms=1000/120){
    let remaining=ms/1000;
    while(remaining>1e-8&&this.state==='running'){
      const dt=Math.min(remaining,1/240);this.tick(dt);remaining-=dt;
    }
  }
  shatter(ball,p){
    const hue=ball.hue;
    this.totalBreaks++;
    this.cleared=Math.max(this.cleared,ball.distance);this.ice.chip(p,this.rng,(ball.multiplied?1.2:1)*this.dynamics.chip);
    for(let i=0;i<13;i++){
      const angle=this.rng()*TAU,speed=45+this.rng()*190;
      this.particles.push({x:p.x+(this.rng()-.5)*22,y:p.y+(this.rng()-.5)*22,
        vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-65,life:1.1+this.rng()*1.1,
        rotation:this.rng()*TAU,spin:(this.rng()-.5)*10,size:2+this.rng()*3.5,
        color:i%3===0?'#777078':'hsl('+hue+' 65% 60%)',white:i%3===0});
    }
    this.sound('ice',5,p.x,this.totalBreaks*31+1);
  }
  tick(dt){
    this.time+=dt;
    if(this.respawnAt!==null&&this.time>=this.respawnAt){
      this.respawnAt=null;this.round++;this.addBall();this.sound('drop',3,515,this.round);
    }
    const consumed=new Set();
    for(const b of [...this.balls]){
      if(this.time<b.release)continue;
      if(b.airborne){
        b.velocity+=GRAVITY*dt;b.body.position.y+=b.velocity*dt;
        if(b.body.position.y>=480){this.sound('impact',3,515,b.id+1);b.airborne=false;b.distance=b.body.position.y-480;b.velocity=ENTRY_SPEED;b.body.position=spiralPoint(b.distance);}
        continue;
      }
      b.velocity=Math.sqrt(Math.max(10000,b.entrySpeed**2+2*GRAVITY*(b.body.position.y-480)));
      b.distance+=b.velocity*dt;
      b.distance=Math.min(length,b.distance);b.body.position=spiralPoint(b.distance);
      const contact=this.ice.contact(b.body.position.x,b.body.position.y,b.body.circleRadius);
      if(contact){
        this.shatter(b,contact);consumed.add(b.id);this.totalConsumed++;continue;
      }
      if(b.distance>=length){
        this.ice.clear();b.finishedAt=this.time;this.finished=[b];this.state='finished';this.sound('complete',7,270);break;
      }
      if(!b.multiplied&&Math.hypot(b.body.position.x-gatePoint.x,b.body.position.y-gatePoint.y)<26){
        b.multiplied=true;b.entrySpeed=this.dynamics.speed;
        const extra=Math.min(this.multiplier-1,SPIRAL.limit-this.balls.length);
        // Release the multiplied group from the gate in a spaced stream.
        // Reserved balls stay in the group until their release time, so a new
        // outside ball cannot arrive while part of this group is still pending.
        for(let i=0;i<extra;i++){
          const copy=this.addBall((i+1)*this.dynamics.gap);copy.airborne=false;copy.multiplied=true;copy.entrySpeed=this.dynamics.speed;
          copy.distance=b.distance;copy.velocity=b.velocity;copy.body.position=spiralPoint(b.distance);
        }
        this.nextMultiplier=Math.min(SPIRAL.limit,this.nextMultiplier+1);
        this.lastSpawn=this.time;this.sound('multiply',7,gatePoint.x,this.nextMultiplier);
      }
    }
    this.balls=this.balls.filter(b=>!consumed.has(b.id));
    if(this.state==='running'&&!this.balls.length&&this.respawnAt===null)this.respawnAt=this.time+1/60;
    this.particles=this.particles.filter(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=75*dt;p.rotation+=p.spin*dt;return p.life>0;}).slice(-600);
  }
  dispose(){}
}

