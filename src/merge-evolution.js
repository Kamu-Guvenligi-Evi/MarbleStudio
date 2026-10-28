import {normalizeThemeEdits,editedMergeTheme} from './merge-theme-editor.js';
import {getMergeTheme} from './merge-themes.js';
export const MERGE_KEY='marble-studio-merge-evolution-v1';
export const ARENA={x:270,y:490,r:250};
export const MERGE_FINALE_SECONDS=1.9;
const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
export function normalizeMerge(raw={}){raw=raw||{};return {theme:getMergeTheme(raw.theme).id,title:String(raw.title??'Will they reach the FINAL FORM?').slice(0,90),seed:Math.floor(clamp(raw.seed,1,4294967295,42)),speed:clamp(raw.speed,.25,4,1),duration:clamp(raw.duration,15,180,90),spawnInterval:clamp(raw.spawnInterval,.12,1.5,.3667),gravity:clamp(raw.gravity,100,900,320),bounce:clamp(raw.bounce,.65,1,.98),sound:raw.sound!==false,themeEdits:normalizeThemeEdits(raw.themeEdits)};}
export class MergeEvolution{
 constructor(settings){this.settings=normalizeMerge(settings);this.theme=editedMergeTheme(this.settings);this.balls=[];this.pulses=[];this.ticks=0;this.time=0;this.state='running';this.outcome=null;this.merges=0;this.spawned=0;this.highest=0;this.nextSpawn=0;this.nextId=1;this.seed=this.settings.seed;this.finalAt=null;this.onEvent=null;}
 random(){this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return this.seed/4294967296;}
 radius(level){const sizes=[20,29,34,46,58,74,110,152];return sizes[level];}
 add(level,x,y,vx=0,vy=0){const b={id:this.nextId++,level,x,y,vx,vy,r:this.radius(level),entered:level>0||y>=ARENA.y-ARENA.r+this.radius(level)+10,angle:0,spin:0};this.balls.push(b);return b;}
 event(type,data={}){this.onEvent?.({type,time:this.time,...data});}
 step(){
  if(this.state!=='running')return;
  this.ticks++;this.time=this.ticks/120;const dt=1/120,{x:cx,y:cy,r:R}=ARENA;
  // Hold the winning board while the shared renderer presents the finale.
  if(this.finalAt!==null){
   if((this.time-this.finalAt)/this.settings.speed>=MERGE_FINALE_SECONDS)this.state='finished';
   return;
  }
  if(this.finalAt===null&&this.time>=this.nextSpawn){
   // Feed continuously until the final form is actually created.
   {this.add(0,cx+(this.random()-.5)*8,cy-R-170,(this.random()-.5)*12,110);this.spawned++;this.event('spawn');}
   this.nextSpawn=this.time+this.settings.spawnInterval;
  }
  for(const b of this.balls){b.previousX=b.x;b.previousY=b.y;b.previousAngle=b.angle;b.vy+=this.settings.gravity*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.angle+=b.spin*dt;}
  const removed=new Set(),births=[];
  for(let i=0;i<this.balls.length;i++){
   const a=this.balls[i];if(removed.has(a)||!a.entered)continue;
   for(let j=i+1;j<this.balls.length;j++){
    const b=this.balls[j];if(removed.has(b)||!b.entered)continue;
    let dx=b.x-a.x,dy=b.y-a.y,distanceSquared=dx*dx+dy*dy,sum=a.r+b.r;if(distanceSquared>=sum*sum)continue;let d=Math.hypot(dx,dy);
    if(a.level===b.level&&a.level<this.theme.stages.length-1){removed.add(a);removed.add(b);births.push({parents:[{...a},{...b}],level:a.level+1,x:(a.x+b.x)/2,y:(a.y+b.y)/2,vx:(a.vx+b.vx)/2+(this.random()-.5)*100,vy:Math.min(-100,(a.vy+b.vy)/2-95)});break;}
    if(d<.00001){dx=1;dy=0;d=1;}const nx=dx/d,ny=dy/d,ia=1/(a.r*a.r),ib=1/(b.r*b.r),overlap=sum-d;
    a.x-=nx*overlap*ia/(ia+ib);a.y-=ny*overlap*ia/(ia+ib);b.x+=nx*overlap*ib/(ia+ib);b.y+=ny*overlap*ib/(ia+ib);
    const closing=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
    if(closing<0){const impulse=-(1+this.settings.bounce)*closing/(ia+ib);a.vx-=impulse*ia*nx;a.vy-=impulse*ia*ny;b.vx+=impulse*ib*nx;b.vy+=impulse*ib*ny;const tangent=(b.vx-a.vx)*-ny+(b.vy-a.vy)*nx;a.spin=Math.max(-2,Math.min(2,tangent/a.r*.12));b.spin=Math.max(-2,Math.min(2,-tangent/b.r*.12));}
   }
  }
  this.balls=this.balls.filter(b=>!removed.has(b));
  for(const birth of births){const b=this.add(birth.level,birth.x,birth.y,birth.vx,birth.vy);this.merges++;this.highest=Math.max(this.highest,b.level);this.pulses.push({id:b.id,x:b.x,y:b.y,r:b.r,level:b.level,time:this.time});this.event('merge',{level:b.level,energy:200});if(b.level===this.theme.stages.length-1&&this.finalAt===null){this.finalAt=this.time;this.finalMerge={id:b.id,parents:birth.parents};this.outcome='final';this.event('final',{level:b.level});}}
  // Resolve wall after collisions too, so a merge never leaves a large ball outside.
  for(const b of this.balls){
   // Only an incoming base token above the arena can use the narrow neck.
   if(!b.entered&&b.y<cy-R+b.r+10){b.x=Math.max(cx-50+b.r,Math.min(cx+50-b.r,b.x));continue;}b.entered=true;
   const dx=b.x-cx,dy=b.y-cy,d=Math.hypot(dx,dy),limit=R-b.r;
   if(d>limit){const nx=dx/d,ny=dy/d;b.x=cx+nx*limit;b.y=cy+ny*limit;const v=b.vx*nx+b.vy*ny;if(v>0){b.vx-=(1+this.settings.bounce)*v*nx;b.vy-=(1+this.settings.bounce)*v*ny;}}
   const v=Math.hypot(b.vx,b.vy);if(v>480){b.vx*=480/v;b.vy*=480/v;}
  }
  this.pulses=this.pulses.filter(p=>this.time-p.time<.65);

 }
}
export const normalizeMergeSnapshot=raw=>({mode:'merge-evolution',project:normalizeMerge(raw.project)});
export function probeMerge(recipe){const game=new MergeEvolution(recipe);let first=null,last=0,quiet=0;game.onEvent=e=>{if(e.type==='merge'){first??=e.time;quiet=Math.max(quiet,e.time-last);last=e.time;}};while(game.state==='running'&&game.time<1800)game.step();if(game.state!=='finished')throw new Error('Son forma henüz ulaşılamadı. Yarım kalan oyun video olarak dışa aktarılmadı; farklı bir tohum veya akış ayarı deneyin.');return {complete:true,simulationSeconds:game.time/game.settings.speed,winner:null,balls:game.balls.length,finite:game.balls.every(b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite)),hits:game.merges,rescues:0,score:game.outcome==='final'?100:70,coverTime:game.time/game.settings.speed*.8,firstEventSeconds:(first??game.time)/game.settings.speed,longestQuietSeconds:Math.max(quiet,game.time-last)/game.settings.speed,outcome:game.outcome};}
