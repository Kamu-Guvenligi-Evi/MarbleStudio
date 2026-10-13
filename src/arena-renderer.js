import {drawChannelTitle,drawChannelWatermark} from './channel-branding.js';
import {drawArenaMarble} from './marble-art.js';
import {drawMarbleTrail} from './marble-trail.js';
import {drawLeaders} from './race-leaders.js';
import {raceName} from './race-copy.js';
import {renderTerritory} from './territory-renderer.js';
import {arenaStringWidth} from './arena.js';
export function renderArena(ctx,arena,{countdown=0,paused=false,trails=true,channel,resultElapsed=0}={}){
  if(arena.arenaGame==='territory')return renderTerritory(ctx,arena,{countdown,paused,trails,channel,resultElapsed});
  const tr=false;
  const speedGain=ball=>`+${Math.max(0,Math.round((ball.speed/ball.initialSpeed-1)*100))}%`;
  const scale=ctx.canvas.width/540;
  ctx.setTransform(scale,0,0,scale,0,0);ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.setLineDash([]);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.fillStyle='#05070b';ctx.fillRect(0,0,540,960);
  const text=(s,x,y,size=16,color='#e8f5ff')=>{ctx.font=`600 ${size}px "Segoe UI",sans-serif`;ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(s,x,y,480);};
  drawLeaders(ctx,arena,drawArenaMarble);
  text('ORBIT • LINK BATTLE',270,204,18);
  text(`${arena.rule==='timed'?Math.ceil(Math.max(0,arena.duration-arena.time)):Math.floor(arena.time)}s  /  ${arena.rule==='timed'?('MOST LINKS WINS'):('LAST BALL STANDING')}`,270,231,12,'#93adc6');
  ctx.beginPath();ctx.arc(270,510,238,0,Math.PI*2);ctx.fillStyle='#000000';ctx.fill();ctx.save();ctx.clip();
  drawChannelWatermark(ctx,channel);
  const fan=arena.arenaLinkMode==='prelinked';
  // Fade tightly converging rays before they become subpixel stripes in the preview.
  const linksByOwner=arena.balls.map(()=>[]);
  for(const link of arena.links)linksByOwner[link.owner].push(link);
  ctx.lineWidth=arenaStringWidth(arena);
  for(const ball of arena.balls){
    const links=linksByOwner[ball.id];if(!links.length)continue;
    const p=ball.body.position,color=ball.color;
    if(fan){
      const paint=ctx.createRadialGradient(p.x,p.y,ball.body.circleRadius,p.x,p.y,180);
      paint.addColorStop(0,color+'18');paint.addColorStop(.35,color+'30');
      paint.addColorStop(.7,color+'80');paint.addColorStop(1,color+'d9');ctx.strokeStyle=paint;
    }else ctx.strokeStyle=color+'a0';
    // One stroke per owner avoids re-rasterizing a gradient for every string.
    ctx.beginPath();
    for(const link of links){ctx.moveTo(link.x,link.y);ctx.lineTo(p.x,p.y);}
    ctx.stroke();
    if(!fan){
      ctx.fillStyle=color;ctx.beginPath();
      for(const link of links){ctx.moveTo(link.x+4,link.y);ctx.arc(link.x,link.y,4,0,Math.PI*2);}
      ctx.fill();
    }
  }
  if(trails)for(const ball of arena.balls){if(ball.eliminatedAt!==null)continue;drawMarbleTrail(ctx,ball);}
  for(const p of arena.particles){ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(p.x-2,p.y-2,4,4);}ctx.globalAlpha=1;
  for(const ball of arena.balls)if(ball.eliminatedAt===null)drawArenaMarble(ctx,ball,ball.body.position.x,ball.body.position.y,ball.body.circleRadius);
  // Draw the accumulated gain after the marbles so other balls cannot cover the labels.
  for(const ball of arena.balls){
    if(ball.eliminatedAt!==null)continue;
    const label=speedGain(ball),p=ball.body.position;
    let x=p.x,y=p.y-ball.body.circleRadius-14;
    const dx=x-270,dy=y-510,d=Math.hypot(dx,dy),limit=204;
    if(d>limit){x=270+dx/d*limit;y=510+dy/d*limit;}
    ctx.save();ctx.font='700 11px "Segoe UI",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    const width=ctx.measureText(label).width+12;
    ctx.fillStyle='#080e20eb';ctx.beginPath();ctx.roundRect(x-width/2,y-9,width,18,5);ctx.fill();
    ctx.fillStyle=ball.color;ctx.fillText(label,x,y);ctx.restore();
  }
  ctx.restore();drawChannelTitle(ctx,channel,270,175);ctx.beginPath();ctx.arc(270,510,238,0,Math.PI*2);ctx.strokeStyle='#e6edf5';ctx.lineWidth=1.5;ctx.stroke();
  text(`${arena.links.length} LINKS  ·  ${arena.totalCuts} CUTS  ·  ${arena.balls.filter(b=>b.eliminatedAt===null).length} BALLS`,270,786,14,'#a9c7dd');
  if(arena.events.length){const e=arena.events[0];text(`${raceName(arena,arena.balls[e.cutter])} cut ${raceName(arena,arena.balls[e.owner])}'s link`,270,821,13,'#c5d7e5');}
  if(arena.state==='finished'){
    ctx.fillStyle='#080e20ef';ctx.beginPath();ctx.roundRect(55,354,430,280,22);ctx.fill();
    const winner=arena.winners?.[0];
    text(arena.winners?.length===1?('WINNER'):('DRAW'),270,397,22,'#ffe29a');
    if(winner){drawArenaMarble(ctx,winner,270,459,43);text(raceName(arena,winner),270,534,25);text(`${arena.linkCount(winner)} links · ${winner.cuts} cuts · ${speedGain(winner)} speed`,270,569,17);}
    else text('No links left standing.',270,489,22);
    if(arena.winners?.length>1)text(arena.winners.map(b=>raceName(arena,b)).join(' / '),270,604,12);
  }
  if(countdown>0||paused){ctx.fillStyle='#080e20bb';ctx.beginPath();ctx.roundRect(165,465,210,85,15);ctx.fill();text(countdown>0?String(Math.ceil(countdown)):'Paused',270,521,countdown>0?48:22);}
}
