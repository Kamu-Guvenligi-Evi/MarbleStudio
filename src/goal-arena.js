import {normalizeSoundStyle} from './game-sound-director.js';
import {normalizeSoundOverrides} from './game-sound-settings.js';
import {normalizeBallImages} from './ball-images.js';

export const GOAL_ARENA_KEY='marble-studio-goal-arena-v1';
export const FIELD={x:270,y:480,radius:202,ballRadius:28,postRadius:3,goalDepth:58};
export const GOAL_TIMING={hold:1.6,restart:.45,total:2.05};
const TAU=Math.PI*2,DT=1/120;
const clamp=(v,lo,hi,fallback)=>Number.isFinite(Number(v))?Math.max(lo,Math.min(hi,Number(v))):fallback;
const clean=(v,fallback,n)=>String(v??fallback).replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,n)||fallback;
const color=(v,fallback)=>/^#[0-9a-f]{6}$/i.test(v)?v:fallback;
export const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function normalizeGoalArena(raw={}){
  raw=raw&&typeof raw==='object'?raw:{};
  return {name:'Goal Arena',home:clean(raw.home,'LASK',24),away:clean(raw.away,'Liverpool',24),
    homeCode:clean(raw.homeCode,'LASK',5).toUpperCase(),awayCode:clean(raw.awayCode,'LIV',5).toUpperCase(),
    homeColor:color(raw.homeColor,'#e7edf5'),awayColor:color(raw.awayColor,'#ff334b'),
    duration:clamp(raw.duration,15,120,37.5),speed:clamp(raw.speed,.5,2,1),
    ballSpeed:clamp(raw.ballSpeed,150,360,300),goalSpeed:clamp(raw.goalSpeed,.35,1.3,.8),
    goalWidth:clamp(Number(raw.goalWidth)<112?132:raw.goalWidth,112,156,132),seed:Math.floor(clamp(raw.seed,0,4294967295,255)),
    ballImages:normalizeBallImages(raw.ballImages).slice(0,2),
    sound:raw.sound!==false,soundStyle:normalizeSoundStyle(raw.soundStyle??'melodic-marimba'),
    soundOverrides:normalizeSoundOverrides('goal-arena',raw.soundOverrides),
    music:{mode:'fixed',track:String(raw.music?.track??'').slice(0,100),volume:clamp(raw.music?.volume,0,100,35),roster:[]}};
}
export class GoalArena{
  constructor(raw={}){
    this.settings=normalizeGoalArena(raw);this.ticks=0;this.matchTicks=0;this.time=0;this.state='running';
    this.scores=[0,0];this.goals=[];this.hits=0;this.goalAngle=Math.PI/2;this.previousGoalAngle=this.goalAngle;
    this.halfOpening=Math.asin(this.settings.goalWidth/(2*FIELD.radius));
    this.lastScorer=null;this.celebrateUntil=0;this.lastGoalTime=-10;this.onEvent=null;
    this.randomState=this.settings.seed>>>0;this.kickoff();
  }
  random(){let t=this.randomState=(this.randomState+0x6D2B79F5)>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
  get minute(){return Math.min(90,Math.floor(this.matchTicks/(120*this.settings.duration)*90));}
  get goalAngularSpeed(){
    if(this.celebrateUntil)return 0;
    const cos=Math.cos(this.goalAngle),sin=Math.sin(this.goalAngle),half=this.settings.goalWidth/2;
    const line=Math.sqrt(FIELD.radius**2-half**2),r=FIELD.ballRadius;
    // Freeze an entry through the mouth, never a ball clipping either post.
    const occupied=this.balls.some(b=>{
      const dx=b.x-FIELD.x,dy=b.y-FIELD.y,u=dx*cos+dy*sin,v=-dx*sin+dy*cos;
      const postClearance=r+FIELD.postRadius;
      return u+r>line&&u-r<line+FIELD.goalDepth&&Math.abs(v)+r<half
        &&Math.hypot(u-line,v-half)>postClearance
        &&Math.hypot(u-line,v+half)>postClearance;
    });
    return occupied?0:this.settings.goalSpeed;
  }
  get phase(){return this.state==='finished'?'finished':!this.celebrateUntil?'playing':this.time-this.lastGoalTime<GOAL_TIMING.hold?'goal':'kickoff';}
  get winner(){return this.scores[0]===this.scores[1]?null:this.scores[0]>this.scores[1]?this.settings.home:this.settings.away;}
  emit(type,ball,energy=0){this.onEvent?.({type,time:this.time,id:ball?.id??0,owner:ball?.id??0,energy});}
  kickoff(){
    const heading=this.random()*TAU,spread=.45+this.random()*.45;
    this.balls=[0,1].map(id=>{
      const angle=heading+id*(Math.PI+spread),x=FIELD.x+(id?1:-1)*33,y=FIELD.y;
      return {id,x,y,px:x,py:y,vx:Math.cos(angle)*this.settings.ballSpeed,vy:Math.sin(angle)*this.settings.ballSpeed,trail:[]};
    });
  }
  score(ball){
    if(this.celebrateUntil||this.state!=='running')return;
    this.scores[ball.id]++;this.lastScorer=ball.id;this.lastGoalTime=this.time;
    this.goals.push({team:ball.id,minute:this.minute,time:this.time,x:ball.x,y:ball.y,angle:this.goalAngle});
    this.celebrateUntil=this.time+GOAL_TIMING.total;this.kickoffReady=false;
    this.previousGoalAngle=this.goalAngle;
    for(const b of this.balls){b.px=b.x;b.py=b.y;b.trail=[];}
    this.emit('goal',ball,300);
  }
  step(){
    if(this.state!=='running')return;
    this.ticks++;this.time=this.ticks*DT;
    this.previousGoalAngle=this.goalAngle;
    for(const b of this.balls){b.px=b.x;b.py=b.y;}
    if(this.celebrateUntil){
      if(!this.kickoffReady&&this.time-this.lastGoalTime>=GOAL_TIMING.hold){this.kickoff();this.kickoffReady=true;}
      if(this.time+1e-8>=this.celebrateUntil)this.celebrateUntil=0;
      return;
    }
    this.matchTicks++;
    if(this.matchTicks>=Math.ceil(this.settings.duration*120)){this.state='finished';this.emit('complete');return;}
    this.goalAngle+=DT*this.goalAngularSpeed;
    for(const b of this.balls){
      b.x+=b.vx*DT;b.y+=b.vy*DT;
      this.boundary(b);
      if(this.celebrateUntil)break;
    }
    if(!this.celebrateUntil)this.collideBalls();
    if(this.ticks%3===0)for(const b of this.balls){b.trail.push({x:b.x,y:b.y});if(b.trail.length>9)b.trail.shift();}
  }
  boundary(b){
    const {x:cx,y:cy,radius:R,ballRadius:r,postRadius:p}=FIELD;
    const goalSpeed=this.goalAngularSpeed;
    // Goal posts move with the goal. Resolve in their local velocity frame.
    for(const side of [-1,1]){
      const a=this.goalAngle+side*this.halfOpening,px=cx+Math.cos(a)*R,py=cy+Math.sin(a)*R;
      const dx=b.x-px,dy=b.y-py,d=Math.hypot(dx,dy),size=r+p;
      if(d>=size)continue;
      const nx=d>1e-8?dx/d:Math.cos(a),ny=d>1e-8?dy/d:Math.sin(a);
      b.x=px+nx*(size+.01);b.y=py+ny*(size+.01);
      const pvx=-Math.sin(a)*R*goalSpeed,pvy=Math.cos(a)*R*goalSpeed;
      const approach=(b.vx-pvx)*nx+(b.vy-pvy)*ny;
      if(approach<0){b.vx-=2*approach*nx;b.vy-=2*approach*ny;this.limitSpeed(b);this.hits++;this.emit('wall',b,-approach);}
    }
    const dx=b.x-cx,dy=b.y-cy,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
    const opening=Math.abs(angleDelta(a,this.goalAngle))<this.halfOpening;
    if(opening){
      // The sides/back of the rotating net contain a ball that has passed the
      // mouth but is still touching a post. Without these walls it can escape.
      if(d>R-r){
        const cos=Math.cos(this.goalAngle),sin=Math.sin(this.goalAngle);
        const u=dx*cos+dy*sin,v=-dx*sin+dy*cos;
        const half=this.settings.goalWidth/2,line=Math.sqrt(R*R-half*half);
        if(u>line&&Math.abs(v)>half-r){
          const side=Math.sign(v),target=side*(half-r),nx=-sin*side,ny=cos*side;
          b.x=cx+u*cos-target*sin;b.y=cy+u*sin+target*cos;
          const relative=b.vx*nx+b.vy*ny-goalSpeed*u*side;
          if(relative>0){b.vx-=2*relative*nx;b.vy-=2*relative*ny;this.limitSpeed(b);}
        }
        if(u>line+FIELD.goalDepth-r){
          const target=line+FIELD.goalDepth-r;
          b.x=cx+target*cos-v*sin;b.y=cy+target*sin+v*cos;
          const out=b.vx*cos+b.vy*sin;
          if(out>0){b.vx-=2*out*cos;b.vy-=2*out*sin;}
        }
      }
      // A goal requires the entire ball beyond the line, between the posts.
      const gx=b.x-cx,gy=b.y-cy,cos=Math.cos(this.goalAngle),sin=Math.sin(this.goalAngle);
      const u=gx*cos+gy*sin,v=-gx*sin+gy*cos,half=this.settings.goalWidth/2;
      const line=Math.sqrt(R*R-half*half);
      if(u-r>=line&&Math.abs(v)+r<half)this.score(b);
      return;
    }
    if(d<=R-r)return;
    const nx=dx/d,ny=dy/d,out=b.vx*nx+b.vy*ny;
    b.x=cx+nx*(R-r-.01);b.y=cy+ny*(R-r-.01);
    if(out>0){b.vx-=2*out*nx;b.vy-=2*out*ny;this.hits++;this.emit('wall',b,out);}
  }
  limitSpeed(b){
    const s=Math.hypot(b.vx,b.vy),target=Math.max(this.settings.ballSpeed*.8,Math.min(this.settings.ballSpeed*1.15,s));
    if(s>1e-6){b.vx*=target/s;b.vy*=target/s;}else{b.vx=this.settings.ballSpeed;b.vy=0;}
  }
  collideBalls(){
    const [a,b]=this.balls,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),diameter=FIELD.ballRadius*2;
    if(d>=diameter)return;
    const nx=d>1e-8?dx/d:1,ny=d>1e-8?dy/d:0,overlap=(diameter-d+.01)/2;
    a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;
    const approach=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
    if(approach<0){a.vx+=approach*nx;a.vy+=approach*ny;b.vx-=approach*nx;b.vy-=approach*ny;
      this.limitSpeed(a);this.limitSpeed(b);this.hits++;this.emit('bounce',a,-approach);}
  }
}
