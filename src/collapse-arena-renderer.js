import {CW,CH,CX,CY} from './collapse-arena.js';
import {drawChannelWatermark} from './channel-branding.js';
export function renderCollapse(ctx,game,{channel='',paused=false}={}){
  const scale=ctx.canvas.width/CW;ctx.setTransform(scale,0,0,scale,0,0);
  ctx.fillStyle='#080a0d';ctx.fillRect(0,0,CW,CH);
  const glow=ctx.createRadialGradient(CX,CY,20,CX,CY,450);glow.addColorStop(0,'#141921');glow.addColorStop(1,'#050608');ctx.fillStyle=glow;ctx.fillRect(0,0,CW,CH);
  ctx.textAlign='center';ctx.fillStyle='#f4f4f6';ctx.font='500 20px system-ui';
  const words=game.settings.title.split(/\s+/);let line='',lines=[];for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>450&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
  lines.slice(0,3).forEach((s,i)=>ctx.fillText(s,CX,133+i*29));
  ctx.fillStyle='#969da8';ctx.font='14px system-ui';ctx.fillText('Bigger balls. One sharp point.',CX,133+lines.slice(0,3).length*29+7);
  const polygon=(vertices,fill)=>{if(!vertices.length)return;ctx.beginPath();vertices.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#101216';ctx.lineWidth=1.1;ctx.stroke();};
  if(game.phase!=='burst'){
    const collapseScale=game.phase==='collapse'?Math.max(0,1-(game.time-game.phaseTime)/1.5):1;
    const drawShards=()=>{for(const shard of game.shards){ctx.globalAlpha=1;polygon(collapseScale===1?shard.vertices:shard.vertices.map(v=>({x:shard.position.x+(v.x-shard.position.x)*collapseScale,y:shard.position.y+(v.y-shard.position.y)*collapseScale})),`hsl(${shard.hue} 100% ${shard.light}%)`);}ctx.globalAlpha=1;};
    if(game.phase==='arena'){
      game.trail.forEach((p,i)=>{ctx.globalAlpha=i/game.trail.length*.10;ctx.beginPath();ctx.arc(p.x,p.y,p.radius??12,0,Math.PI*2);ctx.fillStyle=`hsl(${p.hue} 100% 50%)`;ctx.fill();});ctx.globalAlpha=1;
      const b=game.ball;if(b){ctx.beginPath();ctx.arc(b.position.x,b.position.y,b.circleRadius,0,Math.PI*2);ctx.fillStyle=`hsl(${b.hue} 100% 50%)`;ctx.fill();ctx.strokeStyle=`hsl(${b.hue} 100% 78%)`;ctx.lineWidth=1.3;ctx.stroke();}
      drawShards();
      // Draw the actual collider so visible and physical contact agree.
      polygon(game.spike.vertices,'#11141a');ctx.strokeStyle='#fafafa';ctx.lineWidth=2;ctx.stroke();
    }
    if(game.phase!=='arena')drawShards();
    ctx.beginPath();ctx.arc(CX,CY,Math.max(.1,game.radius),0,Math.PI*2);ctx.strokeStyle=game.flash?'#fff9e6':'#f2f3f5';ctx.lineWidth=2.5;ctx.stroke();
  }else{
    const elapsed=game.time-game.phaseTime;
    for(const p of game.sparks){if(p.x<-80||p.x>CW+80||p.y<-80||p.y>CH+80)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);polygon(p.poly,`hsl(${p.hue} 100% ${p.light}%)`);ctx.restore();}
    const halo=ctx.createRadialGradient(CX,CY,0,CX,CY,75);halo.addColorStop(0,'#ffffff');halo.addColorStop(.15,'#fffdf0');halo.addColorStop(.3,'#ffdc65');halo.addColorStop(.45,'#fa5dff');halo.addColorStop(.6,'#35e7ff');halo.addColorStop(1,'#33aaff00');ctx.fillStyle=halo;ctx.fillRect(CX-75,CY-75,150,150);
    for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(CX,CY,11+i*5+Math.sin(elapsed*8-i)*2,0,Math.PI*2);ctx.strokeStyle=`hsl(${i*45+elapsed*65} 100% 65%)`;ctx.lineWidth=2;ctx.stroke();}
  }
  ctx.textAlign='center';ctx.fillStyle='#b0b5bd';ctx.font='13px system-ui';
  ctx.fillText(game.phase==='arena'?'Every wall hit makes the ball bigger.':game.phase==='collapse'?'Everything becomes one.':'A new universe?',CX,815);
  ctx.fillStyle='#697482';ctx.font='12px system-ui';ctx.fillText(`${game.broken} BROKEN  ·  ${Math.round(game.radius/230*100)}% ARENA`,CX,844);
  if(channel)drawChannelWatermark(ctx,channel,CW,CH);
  if(paused){ctx.fillStyle='#080a0d99';ctx.fillRect(0,0,CW,CH);ctx.fillStyle='#fff';ctx.font='600 24px system-ui';ctx.fillText('Paused',CX,CY);}
}
