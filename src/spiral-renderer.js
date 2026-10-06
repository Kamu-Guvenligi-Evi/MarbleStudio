import { SPIRAL_THEMES } from './spiral-themes.js';
import { gatePoint } from './spiral.js';
import { ballImage } from './ball-images.js';
import { ICE_THICKNESS } from './spiral-ice.js';

const iceTextures=new WeakMap();
function iceTexture(ice,theme){
  let entry=iceTextures.get(ice);
  if(!entry){
    const canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;
    entry={canvas,revision:-1,cut:0,fallen:0};iceTextures.set(ice,entry);
    const ctx=canvas.getContext('2d');ctx.beginPath();
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
  }
  if(entry.revision!==ice.revision){
    const ctx=entry.canvas.getContext('2d');
    while(entry.cut<ice.cuts.length){
      const polygon=ice.cuts[entry.cut++];ctx.beginPath();polygon.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
      ctx.globalCompositeOperation='source-atop';ctx.strokeStyle=theme.chip[0];ctx.lineWidth=2;ctx.stroke();
      ctx.globalCompositeOperation='destination-out';ctx.fill();ctx.globalCompositeOperation='source-over';
    }
    while(entry.fallen<ice.fallen.length){const p=ice.fallen[entry.fallen++];ctx.clearRect(p.x-2,p.y-2,6,6);}
    if(!ice.remaining)ctx.clearRect(0,0,540,960);
    entry.revision=ice.revision;
  }
  return entry.canvas;
}

export function renderSpiral(ctx,race,{countdown=0,paused=false}={}){
  const w=ctx.canvas.width,h=ctx.canvas.height,theme=SPIRAL_THEMES[race.theme]||SPIRAL_THEMES.ice;
  ctx.save();ctx.setTransform(w/540,0,0,h/960,0,0);
  const background=ctx.createRadialGradient(270,450,60,270,480,530);
  background.addColorStop(0,theme.background[0]);background.addColorStop(1,theme.background[1]);
  ctx.fillStyle=background;ctx.fillRect(0,0,540,960);
  ctx.textAlign='center';ctx.fillStyle='#fff';

  if(theme.effect==='star'){
    ctx.save();ctx.fillStyle='#d8d0ff';
    for(let i=0;i<65;i++){
      ctx.globalAlpha=.15+.25*(1+Math.sin(race.time*.7+i))/2;
      ctx.beginPath();ctx.arc((i*173+31)%540,(i*257+47)%960,i%3===0?1.2:.6,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  ctx.drawImage(iceTexture(race.ice,theme),0,0);
  ctx.beginPath();
  for(let i=0;i<=2500;i++){
    const angle=i/2500*Math.PI*12,radius=260-angle*41/(Math.PI*2);
    const x=270+Math.cos(angle)*radius,y=480+Math.sin(angle)*radius;
    if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
  }
  ctx.strokeStyle=theme.rail;ctx.lineWidth=3;ctx.lineCap='round';ctx.stroke();
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
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle='hsl('+bh+' 90% 76%)';ctx.lineWidth=.8;ctx.stroke();
  }
  ctx.save();ctx.translate(gatePoint.x,gatePoint.y);
  ctx.beginPath();ctx.arc(0,0,19,0,Math.PI*2);ctx.fillStyle='#101820';ctx.fill();ctx.strokeStyle=theme.edge;ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle='#f2f7fa';ctx.font='600 14px Arial';ctx.fillText('×'+race.multiplier,0,5);ctx.restore();
  for(const p of race.particles){
    ctx.save();ctx.globalAlpha=Math.min(1,p.life*2);ctx.translate(p.x,p.y);ctx.rotate(p.rotation);
    ctx.beginPath();ctx.moveTo(-p.size,-p.size*.6);ctx.lineTo(p.size*.7,-p.size);ctx.lineTo(p.size*.4,p.size*.7);ctx.lineTo(-p.size*.8,p.size*.3);ctx.closePath();
    if(theme.effect==='bubble'){ctx.beginPath();ctx.arc(0,0,p.size*.8,0,Math.PI*2);}
    if(theme.effect==='flake'){ctx.beginPath();ctx.rect(-p.size,-p.size*.35,p.size*2,p.size*.7);}
    if(theme.effect==='ember'){ctx.beginPath();ctx.ellipse(0,0,p.size*.35,p.size*1.5,0,0,Math.PI*2);}
    if(theme.effect==='star'){
      ctx.beginPath();
      for(let i=0;i<8;i++){const a=i*Math.PI/4,r=p.size*(i%2?.3:1);if(i)ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.moveTo(r,0);}
      ctx.closePath();
    }
    ctx.fillStyle=p.white?theme.chip[0]:theme.chip[1];ctx.fill();ctx.strokeStyle=theme.chip[0];ctx.lineWidth=.5;ctx.stroke();ctx.restore();
  }
  if(countdown>0||paused){
    ctx.fillStyle='#0008';ctx.fillRect(0,245,540,490);ctx.fillStyle='#fff';ctx.font='bold 42px Arial';ctx.fillText(paused?'Duraklatıldı':Math.ceil(countdown),270,490);
  }
  ctx.restore();
}

