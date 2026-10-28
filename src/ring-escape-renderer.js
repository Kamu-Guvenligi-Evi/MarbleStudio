import {canvasLayer} from './canvas-layer.js';
import {drawChannelTitle} from './channel-branding.js';
const TAU=Math.PI*2;
const palettes=new WeakMap();
const clamp=v=>Math.max(0,Math.min(1,v));
function arc(c,x,y,r,start,end,color,width){c.beginPath();c.arc(x,y,Math.max(1,r),start,end);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function text(c,value,x,y,size,color,weight=600){c.fillStyle=color;c.font=weight+' '+size+'px "Segoe UI",sans-serif';c.fillText(value,x,y);}
function dot(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
function blend(a,b,t){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');}
function palette(c,p){
  const key=p.ring+p.accent;let cached=palettes.get(c);
  if(cached?.key!==key){cached={key,colors:Array.from({length:64},(_,i)=>blend(p.ring,p.accent,i/63))};palettes.set(c,cached);}
  return cached.colors;
}
function background(c,p,x,y){
  c.fillStyle=p.background;c.fillRect(0,0,540,960);
  const glow=c.createRadialGradient(x,y,32,x,y,365);
  glow.addColorStop(0,p.ring+'1a');glow.addColorStop(.65,p.ring+'18');glow.addColorStop(1,p.ring+'00');
  c.fillStyle=glow;c.fillRect(0,110,540,710);
  const wash=c.createLinearGradient(0,0,540,960);
  wash.addColorStop(0,p.accent+'18');wash.addColorStop(.4,'#00000000');wash.addColorStop(1,'#00000070');
  c.fillStyle=wash;c.fillRect(0,0,540,960);
  // Sparse fixed stars, outside the play field only. No noisy grid or moving wallpaper.
  for(let i=0;i<52;i++){
    const sx=18+(i*137.508)%504,sy=135+(i*83.731)%580;
    if(Math.hypot(sx-x,sy-y)<259)continue;
    dot(c,sx,sy,i%7===0?1.2:.65,i%3===0?p.accent+'70':p.ring+'48');
  }
  arc(c,x,y,258,0,TAU,p.ring+'18',1);
  for(let i=0;i<72;i++){
    const a=i*TAU/72,major=i%6===0;
    c.beginPath();c.moveTo(x+Math.cos(a)*260,y+Math.sin(a)*260);
    c.lineTo(x+Math.cos(a)*(major?266:263),y+Math.sin(a)*(major?266:263));
    c.strokeStyle=major?p.ring+'55':p.ring+'22';c.lineWidth=1;c.stroke();
  }
  // One recessed panel holds the counters without competing with the arena.
  c.beginPath();c.roundRect(38,741,464,153,24);c.fillStyle='#00000038';c.fill();
  c.strokeStyle=p.ring+'20';c.lineWidth=1;c.stroke();
  const rule=c.createLinearGradient(130,0,410,0);
  rule.addColorStop(0,p.ring+'00');rule.addColorStop(.5,p.ring+'a0');rule.addColorStop(1,p.accent+'00');
  c.fillStyle=rule;c.fillRect(130,120,280,2);
}
function ballPath(c,b,shape){
  c.beginPath();
  if(shape==='diamond'){
    c.moveTo(b.x,b.y-b.r*1.35);c.lineTo(b.x+b.r*1.35,b.y);
    c.lineTo(b.x,b.y+b.r*1.35);c.lineTo(b.x-b.r*1.35,b.y);c.closePath();
  }else c.arc(b.x,b.y,b.r,0,TAU);
}
export function renderRingEscape(c,g,{paused=false,image=null,channel}={}){
  const p=g.settings,w=c.canvas.width,h=c.canvas.height,progress=clamp(g.broken/p.count);
  const colors=palette(c,p),x=g.cx,y=g.cy;
  c.save();c.scale(w/540,h/960);c.lineCap='butt';c.textBaseline='alphabetic';
  c.drawImage(canvasLayer(c,['ring-neon-1',p.background,p.ring,p.accent,x,y].join('|'),540,960,layer=>background(layer,p,x,y)),0,0,540,960);
  c.textAlign='center';drawChannelTitle(c,channel,270,49);
  c.save();c.font='800 30px "Segoe UI",sans-serif';c.fillStyle='#f5fbff';
  c.fillText(p.title&&p.title!=='SON HALKADAN KAÇ'?p.title:'RING ESCAPE',270,99,480);c.restore();

  // A quiet clock and matching completion rail frame the moving tunnel.
  c.beginPath();c.roundRect(443,149,66,31,15);c.fillStyle=p.ring+'12';c.fill();
  text(c,Math.ceil(g.secondsLeft).toString().padStart(2,'0')+' s',476,170,15,g.secondsLeft<=5?p.accent:'#eef8ff',700);
  arc(c,x,y,253,-Math.PI/2,TAU-Math.PI/2,p.ring+'20',2);
  if(progress>0){
    arc(c,x,y,253,-Math.PI/2,TAU*progress-Math.PI/2,p.accent+'25',7);
    arc(c,x,y,253,-Math.PI/2,TAU*progress-Math.PI/2,p.accent,2.5);
    dot(c,x+Math.cos(TAU*progress-Math.PI/2)*253,y+Math.sin(TAU*progress-Math.PI/2)*253,3,'#ffffff');
  }

  // Bound visible detail to ~65 layers even with 5,000 simulated rings.
  // Sample by stable ring id so the artwork does not flicker on each break.
  const stride=Math.max(1,Math.ceil(3.3/g.spacing));
  let visible=g.rings.length;
  if(g.dynamic){visible=0;while(visible<g.rings.length&&g.rings[visible].r<=247)visible++;}
  const sheen=c.createLinearGradient(x-210,y-220,x+210,y+220);
  sheen.addColorStop(0,'#ffffffa0');sheen.addColorStop(.32,'#ffffff12');sheen.addColorStop(.6,'#ffffff00');sheen.addColorStop(1,'#ffffff50');
  for(let i=visible-1;i>=0;i--){
    const ring=g.rings[i];if(i>0&&ring.id%stride!==0)continue;
    const start=ring.angle+ring.gap/2,end=ring.angle+TAU-ring.gap/2;
    const band=(Math.sin(ring.id*g.spacing*.065)+1)*.5;
    const color=colors[Math.round(band*63)],active=i===0;
    const edge=g.dynamic?clamp((247-ring.r)/11):1;
    const width=active?2.6:Math.min(2.2,g.spacing*stride*.6);
    c.globalAlpha=edge;
    // Dark lower bevel + colored body + directional highlight, without per-ring blur.
    arc(c,x,y+.8,ring.r,start,end,'#00000080',width+1.3);
    arc(c,x,y,ring.r,start,end,active?p.ring:color,width);
    arc(c,x,y-.45,ring.r,start,end,active?'#ffffff':sheen,active?1.25:.65);
    if(active){
      c.globalAlpha=edge*.14;arc(c,x,y,ring.r,start,end,p.ring,10);c.globalAlpha=edge;
    }
    for(const a of [start,end]){
      const px=x+Math.cos(a)*ring.r,py=y+Math.sin(a)*ring.r;
      if(active)dot(c,px,py,5,p.accent+'28');
      dot(c,px,py,active?2.7:1.35,active?'#ffffff':blend(color,'#ffffff',.45));
    }
  }
  c.globalAlpha=1;
  if(g.state==='running'&&g.impact>0&&g.rings.length){
    c.globalAlpha=clamp(g.impact/.12);
    arc(c,x,y,g.rings[0].r,g.impactAngle-.14,g.impactAngle+.14,p.accent,4);c.globalAlpha=1;
  }
  if(p.particles){
    for(const ripple of g.ripples){
      c.globalAlpha=clamp(ripple.life/.32)*.4;
      arc(c,x,y,ripple.r,0,TAU,p.accent,1.2);
    }
    c.lineCap='round';c.lineWidth=1.6;
    for(const pt of g.particles){
      c.globalAlpha=clamp(pt.life/pt.total)*.85;c.strokeStyle=p.accent;
      c.beginPath();c.moveTo(pt.x,pt.y);c.lineTo(pt.x-pt.vx*.035,pt.y-pt.vy*.035);c.stroke();
    }
    c.globalAlpha=1;
  }
  const b=g.ball;
  if(g.state!=='won'){
    if(p.trail&&b.trail.length>1){
      c.lineCap='round';
      for(let i=1;i<b.trail.length;i++){
        const a=b.trail[i-1],d=b.trail[i],t=i/b.trail.length;
        c.globalAlpha=t*t*.7;c.strokeStyle=t>.72?p.ball:p.ring;
        c.lineWidth=p.shape==='comet'?1+t*b.r*1.4:1+t*2;
        c.beginPath();c.moveTo(a.x,a.y);c.lineTo(d.x,d.y);c.stroke();
      }
      c.globalAlpha=1;
    }
    const aura=c.createRadialGradient(b.x,b.y,b.r*.5,b.x,b.y,b.r*3.8);
    aura.addColorStop(0,p.ball+'85');aura.addColorStop(.4,p.ring+'24');aura.addColorStop(1,p.ring+'00');
    dot(c,b.x,b.y,b.r*3.8,aura);
    const pearl=c.createRadialGradient(b.x-b.r*.35,b.y-b.r*.4,.2,b.x,b.y,b.r*1.25);
    pearl.addColorStop(0,'#ffffff');pearl.addColorStop(.5,p.ball);pearl.addColorStop(1,blend(p.ball,p.ring,.55));
    ballPath(c,b,p.shape);c.fillStyle=pearl;c.fill();
    if(image?.complete&&image.naturalWidth){
      c.save();ballPath(c,b,p.shape);c.clip();c.drawImage(image,b.x-b.r,b.y-b.r,b.r*2,b.r*2);c.restore();
    }else dot(c,b.x-b.r*.25,b.y-b.r*.3,b.r*.23,'#ffffff');
  }
  if(g.state==='won'){
    const bloom=c.createRadialGradient(x,y,30,x,y,210);
    bloom.addColorStop(0,p.accent+'20');bloom.addColorStop(1,p.accent+'00');dot(c,x,y,210,bloom);
    arc(c,x,y,110,0,TAU,p.ring+'45',1);arc(c,x,y,120,-2.4,.25,p.accent,3);arc(c,x,y,120,.75,2.8,p.ring,3);
    // The victory uses a fixed simulation-time composition in both preview and export.
    for(let i=0;i<32;i++){
      const a=i*TAU/32,r=139+(i*29)%66;
      dot(c,x+Math.cos(a)*r,y+Math.sin(a)*r,i%4===0?2.5:1,i%2?p.ring:p.accent);
    }
    text(c,'ESCAPED!',x,y+7,47,'#f5fbff',800);
    text(c,p.count.toLocaleString('en-US')+' RINGS CLEARED',x,y+39,11,p.accent,700);
  }
  const chain=g.combo>=3&&g.time-g.lastBreak<1.25;
  if(chain&&g.state==='running'){
    c.beginPath();c.roundRect(201,714,138,23,11);c.fillStyle=p.accent+'18';c.fill();
    text(c,'×'+g.combo+' COMBO',270,730,13+g.flash/.32,p.accent,800);
  }
  text(c,g.state==='won'?'COMPLETE':g.remaining.toLocaleString('en-US'),270,797,g.state==='won'?32:49,'#f5fbff',800);
  text(c,g.state==='won'?'ALL RINGS CLEARED':g.state==='timeout'?'TIME UP':'RINGS LEFT',270,817,10,p.ring,700);
  c.lineCap='round';c.lineWidth=4;c.strokeStyle=p.ring+'20';c.beginPath();c.moveTo(65,840);c.lineTo(475,840);c.stroke();
  if(progress>0){c.strokeStyle=p.accent;c.beginPath();c.moveTo(65,840);c.lineTo(65+410*progress,840);c.stroke();}
  c.textAlign='left';text(c,g.broken.toLocaleString('en-US')+' / '+p.count.toLocaleString('en-US'),65,871,12,p.ring,700);
  c.textAlign='right';text(c,'BEST  ×'+g.bestCombo,475,871,12,p.accent,700);c.textAlign='center';
  if(paused){
    c.fillStyle='#020714b8';c.fillRect(0,0,540,960);
    c.beginPath();c.roundRect(184,421,172,62,22);c.fillStyle=p.background;c.fill();c.strokeStyle=p.ring+'55';c.lineWidth=1;c.stroke();
    text(c,'PAUSED',270,460,22,'#f4fff8',700);
  }
  c.restore();
}
