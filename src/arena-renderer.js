import {drawSpace} from './space-art.js';
import {drawMarble} from './marble-art.js';
import {drawLeaders} from './race-leaders.js';
import {raceName} from './race-copy.js';
import {renderTerritory} from './territory-renderer.js';
export function renderArena(ctx,arena,{countdown=0,paused=false,trails=true}={}){
  if(arena.arenaGame==='territory')return renderTerritory(ctx,arena,{countdown,paused,trails});
  const tr=arena.language==='tr';
  ctx.setTransform(2,0,0,2,0,0);ctx.fillStyle='#080e20';ctx.fillRect(0,0,540,960);drawSpace(ctx,0,arena.time);
  const text=(s,x,y,size=16,color='#e8f5ff')=>{ctx.font=`600 ${size}px "Segoe UI",sans-serif`;ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(s,x,y,480);};
  drawLeaders(ctx,arena);
  text(tr?'ARENA • BAĞ MÜCADELESİ':'ORBIT • LINK BATTLE',270,204,18);
  text(`${arena.rule==='timed'?Math.ceil(Math.max(0,arena.duration-arena.time)):Math.floor(arena.time)}s  /  ${arena.rule==='timed'?(tr?'EN ÇOK BAĞ KAZANIR':'MOST LINKS WINS'):(tr?'SON KALAN KAZANIR':'LAST BALL STANDING')}`,270,231,12,'#93adc6');
  const sphere=ctx.createRadialGradient(190,410,5,270,510,238);sphere.addColorStop(0,'#1c345c');sphere.addColorStop(.72,'#101e38');sphere.addColorStop(1,'#233b58');
  ctx.beginPath();ctx.arc(270,510,238,0,Math.PI*2);ctx.fillStyle=sphere;ctx.fill();ctx.save();ctx.clip();
  ctx.strokeStyle='#9cd9ff0c';ctx.lineWidth=1;
  for(const r of [80,155,225]){ctx.beginPath();ctx.ellipse(270,510,r,238,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(270,510,238,r,0,0,Math.PI*2);ctx.stroke();}
  for(const link of arena.links){const ball=arena.balls[link.owner];ctx.strokeStyle=ball.color+'a0';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(link.x,link.y);ctx.lineTo(ball.body.position.x,ball.body.position.y);ctx.stroke();ctx.fillStyle=ball.color;ctx.beginPath();ctx.arc(link.x,link.y,4,0,Math.PI*2);ctx.fill();}
  if(trails)for(const ball of arena.balls){if(ball.eliminatedAt!==null)continue;ctx.strokeStyle=ball.color+'45';ctx.lineWidth=5;ctx.beginPath();ball.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
  for(const p of arena.particles){ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(p.x-2,p.y-2,4,4);}ctx.globalAlpha=1;
  for(const ball of arena.balls)if(ball.eliminatedAt===null)drawMarble(ctx,ball,ball.body.position.x,ball.body.position.y,ball.body.circleRadius);
  ctx.restore();ctx.beginPath();ctx.arc(270,510,238,0,Math.PI*2);ctx.strokeStyle='#85dfff';ctx.lineWidth=2;ctx.shadowColor='#60cfff';ctx.shadowBlur=14;ctx.stroke();ctx.shadowBlur=0;
  text(`${arena.links.length} ${tr?'BAĞ':'LINKS'}  ·  ${arena.totalCuts} ${tr?'KESİŞ':'CUTS'}  ·  ${arena.balls.filter(b=>b.eliminatedAt===null).length} ${tr?'TOP':'BALLS'}`,270,786,14,'#a9c7dd');
  if(arena.events.length){const e=arena.events[0];text(tr?`${raceName(arena,arena.balls[e.cutter])}, ${raceName(arena,arena.balls[e.owner])} bağını kesti`:`${raceName(arena,arena.balls[e.cutter])} cut ${raceName(arena,arena.balls[e.owner])}'s link`,270,821,13,'#c5d7e5');}
  text(tr?'BAĞ KUR. RAKİBİNİN BAĞINI KES. HAYATTA KAL.':'TOUCH THE WALL. BUILD LINKS. CUT YOUR RIVALS.',270,904,11,'#819cb9');
  if(arena.state==='ready'&&!countdown)text('Pick your contender.',270,856,19);
  if(arena.state==='finished'){
    ctx.fillStyle='#080e20ef';ctx.beginPath();ctx.roundRect(55,354,430,280,22);ctx.fill();
    const winner=arena.winners?.[0];
    text(arena.winners?.length===1?(tr?'KAZANAN':'WINNER'):(tr?'BERABERE':'DRAW'),270,397,22,'#ffe29a');
    if(winner){drawMarble(ctx,winner,270,459,43);text(raceName(arena,winner),270,534,25);text(`${arena.linkCount(winner)} ${tr?'bağ':'links'} · ${winner.cuts} ${tr?'kesiş':'cuts'}`,270,569,17);}
    else text('No links left standing.',270,489,22);
    if(arena.winners?.length>1)text(arena.winners.map(b=>raceName(arena,b)).join(' / '),270,604,12);
  }
  if(countdown>0||paused){ctx.fillStyle='#080e20bb';ctx.beginPath();ctx.roundRect(165,465,210,85,15);ctx.fill();text(countdown>0?String(Math.ceil(countdown)):'Paused',270,521,countdown>0?48:22);}
}
