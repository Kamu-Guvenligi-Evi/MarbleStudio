import {drawChannelWatermark} from './channel-branding.js';
import { SPIRAL_THEMES } from './spiral-themes.js';
import { gatePoint } from './spiral.js';
import { ballImage } from './ball-images.js';
import { ICE_THICKNESS } from './spiral-ice.js';
import {spiralRail,spiralRailPoint,spiralGuide} from './spiral-guide.js';
import {spiralMaterial,drawMaterialAmbience,drawMaterialLight,drawMaterialParticle} from './spiral-materials.js';

function drawSpiralGuide(ctx,time){
  const {head,distance,tailStart,tailOpacity,glow}=spiralGuide(time);
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  if(distance>0&&tailOpacity>0){
    const segments=28;let previous=spiralRailPoint(tailStart);
    for(let i=1;i<=segments;i++){
      const t=i/segments,point=spiralRailPoint(tailStart+(distance-tailStart)*t);
      ctx.beginPath();ctx.moveTo(previous.x,previous.y);ctx.lineTo(point.x,point.y);
      ctx.strokeStyle=`rgba(94,224,255,${t*t*tailOpacity*.8})`;ctx.lineWidth=4;ctx.stroke();
      previous=point;
    }
  }
  const halo=ctx.createRadialGradient(head.x,head.y,0,head.x,head.y,19);
  halo.addColorStop(0,`rgba(202,250,255,${.85*glow})`);
  halo.addColorStop(.25,`rgba(80,220,255,${.55*glow})`);
  halo.addColorStop(1,'rgba(80,220,255,0)');
  ctx.fillStyle=halo;ctx.beginPath();ctx.arc(head.x,head.y,19,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#73e7ff';ctx.beginPath();ctx.arc(head.x,head.y,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(head.x,head.y,2.1,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

const iceTextures=new WeakMap();
function iceTexture(ice,theme){
  let variants=iceTextures.get(ice);
  if(!variants){variants=new Map();iceTextures.set(ice,variants);}
  let entry=variants.get(theme);
  if(!entry){
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
    entry={canvas,revision:-1,cut:0,fallen:0};variants.set(theme,entry);
    const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.beginPath();
    const begin=Math.PI/2,end=239.5/(41/(Math.PI*2));
    for(let i=0;i<=2600;i++){
      const angle=begin+(end-begin)*i/2600,radius=239.5-angle*41/(Math.PI*2);
      const x=270+Math.cos(angle)*radius,y=480+Math.sin(angle)*radius;
      if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
    }
    const material=ctx.createLinearGradient(0,220,0,740);
    material.addColorStop(0,theme.surface[0]);material.addColorStop(.48,theme.surface[1]);material.addColorStop(1,theme.surface[2]);
    ctx.lineJoin='round';ctx.lineCap='butt';ctx.strokeStyle=theme.edge;ctx.lineWidth=ICE_THICKNESS;ctx.stroke();
    ctx.strokeStyle=material;ctx.lineWidth=ICE_THICKNESS-2;ctx.stroke();
    ctx.beginPath();ctx.arc(270,480,14,0,Math.PI*2);ctx.fillStyle=material;ctx.fill();
    ctx.globalCompositeOperation='source-atop';ctx.drawImage(spiralMaterial(theme),0,0,540,960);ctx.globalCompositeOperation='source-over';
  }
  if(entry.revision!==ice.revision){
    const ctx=entry.canvas.getContext('2d');
    while(entry.cut<ice.cuts.length){
      const polygon=ice.cuts[entry.cut++];ctx.beginPath();polygon.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
      ctx.save();ctx.globalCompositeOperation='source-atop';ctx.strokeStyle=theme.chip[0];ctx.lineWidth=theme.material==='lava'?2.8:1.5;
      if(theme.material==='lava'){ctx.shadowColor='#ff4b15';ctx.shadowBlur=5;}
      ctx.stroke();ctx.restore();
      ctx.globalCompositeOperation='destination-out';ctx.fill();ctx.globalCompositeOperation='source-over';
    }
    while(entry.fallen<ice.fallen.length){const p=ice.fallen[entry.fallen++];ctx.clearRect(p.x-2,p.y-2,6,6);}
    if(!ice.remaining)ctx.clearRect(0,0,540,960);
    entry.revision=ice.revision;
  }
  return entry.canvas;
}

export function renderSpiral(ctx,race,{countdown=0,paused=false,channel}={}){
  const w=ctx.canvas.width,h=ctx.canvas.height,theme=SPIRAL_THEMES[race.theme]||SPIRAL_THEMES.ice;
  ctx.save();ctx.setTransform(w/540,0,0,h/960,0,0);
  const background=ctx.createRadialGradient(270,450,60,270,480,530);
  background.addColorStop(0,theme.background[0]);background.addColorStop(1,theme.background[1]);
  ctx.fillStyle=background;ctx.fillRect(0,0,540,960);
  ctx.textAlign='center';ctx.fillStyle='#fff';

  drawMaterialAmbience(ctx,theme,race.time);
  const texture=iceTexture(race.ice,theme);
  ctx.drawImage(texture,0,0,540,960);drawMaterialLight(ctx,texture,theme,race.time);
  ctx.beginPath();
  spiralRail.forEach((point,i)=>i?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y));
  ctx.strokeStyle=theme.rail;ctx.lineWidth=3;ctx.lineCap='round';ctx.stroke();
  drawSpiralGuide(ctx,race.time);
  drawChannelWatermark(ctx,channel,540,960,theme===SPIRAL_THEMES.ice?'#526781':'#ffffff');
  for(const b of race.balls){
    if(race.time<b.release&&!b.airborne)continue;
    const {x,y}=b.body.position,r=b.body.circleRadius,bh=b.hue;
    const surface=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.08,x,y,r);
    surface.addColorStop(0,'hsl('+bh+' 100% 80%)');
    surface.addColorStop(.35,'hsl('+bh+' 95% 60%)');
    surface.addColorStop(1,'hsl('+bh+' 85% 40%)');
    ctx.save();ctx.shadowColor='#020812';ctx.shadowBlur=5;ctx.shadowOffsetY=2;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=surface;ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    const img=ballImage(b.imageSrc);if(img){ctx.clip();ctx.drawImage(img,x-r,y-r,r*2,r*2);}ctx.restore();
    if(!img){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle='hsl('+bh+' 90% 76%)';ctx.lineWidth=.8;ctx.stroke();}
  }
  ctx.save();ctx.translate(gatePoint.x,gatePoint.y);
  ctx.beginPath();ctx.arc(0,0,19,0,Math.PI*2);ctx.fillStyle='#101820';ctx.fill();ctx.strokeStyle=theme.edge;ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle='#f2f7fa';ctx.font='600 14px Arial';ctx.fillText('×'+race.multiplier,0,5);ctx.restore();
  for(const gate of race.multipliers){
    const flash=gate.activatedAt!==null&&race.time-gate.activatedAt<.35;
    ctx.save();ctx.translate(gate.point.x,gate.point.y);
    ctx.shadowColor='#ffdc75';ctx.shadowBlur=flash?16:5;
    ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fillStyle=flash?'#654614':'#14202eee';ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle='#ffdc75';ctx.lineWidth=flash?2.5:1.5;ctx.stroke();
    ctx.fillStyle='#fff0b3';ctx.font='700 11px Arial';ctx.fillText('×'+gate.value,0,4);ctx.restore();
  }
  for(const p of race.particles)drawMaterialParticle(ctx,p,theme);
  if(countdown>0||paused){
    ctx.fillStyle='#0008';ctx.fillRect(0,245,540,490);ctx.fillStyle='#fff';ctx.font='bold 42px Arial';ctx.fillText(paused?'Paused':Math.ceil(countdown),270,490);
  }
  ctx.restore();
}

