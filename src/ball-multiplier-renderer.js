import {CIRCLE,BALL_COLORS} from './ball-multiplier.js';
import {drawChannelTitle} from './channel-branding.js';
import {paintMultiplierBalls} from './ball-multiplier-raster.js';

const layers=new WeakMap();

export function renderMultiplier(ctx,game,{channel,alpha=1}={}){
  const p=game.finaleProgress??0;
  let cached=layers.get(ctx.canvas);
  if(!cached){cached={canvas:document.createElement('canvas'),settled:false};layers.set(ctx.canvas,cached);}
  const layer=cached.canvas;
  if(layer.width!==ctx.canvas.width||layer.height!==ctx.canvas.height){layer.width=ctx.canvas.width;layer.height=ctx.canvas.height;cached.settled=false;}
  const paintBalls=!cached.settled||cached.game!==game||p<.84;
  ctx.save();ctx.scale(ctx.canvas.width/540,ctx.canvas.height/960);
  ctx.fillStyle='#000';ctx.fillRect(0,0,540,960);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.font='700 23px Arial, sans-serif';
  ctx.fillText(game.settings.title,270,190,490);
  const release=Math.max(0,Math.min(1,(p-.82)/.18)),impact=Math.sin(Math.PI*release);
  ctx.save();ctx.beginPath();ctx.arc(CIRCLE.x,CIRCLE.y,CIRCLE.r-1,0,Math.PI*2);ctx.clip();
  // Seal the tiny interstitial gaps during the final bloom, preserving every
  // marble's colour. This backing is confined to the arena, never a screen flash.
  if(p>.6){
    const backing=ctx.createLinearGradient(60,340,470,760);
    backing.addColorStop(0,'#7138ca');backing.addColorStop(.5,'#1c8d9f');backing.addColorStop(1,'#b54165');
    ctx.globalAlpha=Math.min(1,(p-.6)/.22);ctx.fillStyle=backing;ctx.fillRect(35,315,470,470);ctx.globalAlpha=1;
  }
  // One glow stroke per new birth; no expensive per-ball canvas shadows.
  for(const p of game.pulses){const age=(game.time-p.time)/.25;ctx.globalAlpha=(1-age)*.5;ctx.strokeStyle=p.color;ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,game.settings.radius+age*9,0,Math.PI*2);ctx.stroke();}
  ctx.globalAlpha=1;
  if(paintBalls){
    paintMultiplierBalls(cached,game,alpha);cached.game=game;cached.settled=p>=.84;
  }
  // Apply the circular mask once to the finished pixel layer.
  ctx.drawImage(layer,0,0,540,960);
  if(p>.4&&p<.82){
      const wave=Math.min(1,(p-.4)/.42)*CIRCLE.r*1.25;
      const glow=ctx.createRadialGradient(CIRCLE.x,CIRCLE.y,Math.max(0,wave-26),CIRCLE.x,CIRCLE.y,wave+2);
      glow.addColorStop(0,'#ffffff00');glow.addColorStop(.8,'#ffffff38');glow.addColorStop(1,'#ffffff00');
      ctx.fillStyle=glow;ctx.fillRect(35,315,470,470);
  }
  ctx.restore();
  ctx.strokeStyle=impact>.05?'#e5ddff':'#9292ed';ctx.lineWidth=2+impact*2;
  ctx.beginPath();ctx.arc(CIRCLE.x,CIRCLE.y,CIRCLE.r,0,Math.PI*2);ctx.stroke();
  if(release>0&&release<1){
    ctx.globalAlpha=impact*.55;ctx.strokeStyle='#bdb4ff';ctx.lineWidth=2*(1-release)+.5;
    ctx.beginPath();ctx.arc(CIRCLE.x,CIRCLE.y,CIRCLE.r+release*28,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<24;i++){
      const a=i*Math.PI/12,dist=CIRCLE.r+7+release*(22+i%3*8);
      ctx.fillStyle=BALL_COLORS[i%8];ctx.beginPath();ctx.arc(CIRCLE.x+Math.cos(a)*dist,CIRCLE.y+Math.sin(a)*dist,1.8*(1-release)+.4,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  drawChannelTitle(ctx,channel,270,872,13);
  ctx.restore();
}
