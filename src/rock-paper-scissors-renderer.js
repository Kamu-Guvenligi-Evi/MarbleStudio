import {ARENA,TYPES,NAMES,randomFrom} from './rock-paper-scissors.js';
export const COLORS={rock:'#9d8aff',scissors:'#f281ce',paper:'#e5deff'};
function path(ctx,points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
// Drawn locally at export resolution: no platform emoji or remote image dependency.
export function drawRpsIcon(ctx,type,x,y,size){
  ctx.save();ctx.translate(x,y);ctx.scale(size/64,size/64);ctx.lineJoin='round';ctx.lineCap='round';
  if(type==='rock'){
    const outline=[[-27,13],[-23,-8],[-9,-24],[9,-26],[26,-7],[29,14],[14,25],[-12,24]];
    const fill=ctx.createLinearGradient(-18,-25,16,25);fill.addColorStop(0,'#c2b4ff');fill.addColorStop(.32,'#8172c9');fill.addColorStop(1,'#332958');
    path(ctx,outline);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#a698de';ctx.lineWidth=1.4;ctx.stroke();
    for(const [points,color] of [
      [[[-23,-8],[-9,-24],[0,-6],[-13,7]],'#a698e5'],
      [[[-9,-24],[9,-26],[17,-9],[0,-6]],'#c4b7f2'],
      [[[0,-6],[17,-9],[26,-7],[12,8]],'#8876c7'],
      [[[-13,7],[0,-6],[12,8],[3,23],[-12,24]],'#6858a2'],
      [[[12,8],[26,-7],[29,14],[14,25],[3,23]],'#403366'],
      [[[-27,13],[-23,-8],[-13,7],[-12,24]],'#7769b3']
    ]){path(ctx,points);ctx.fillStyle=color;ctx.fill();}
    ctx.strokeStyle='#ddd4ff80';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-21,-8);ctx.lineTo(-9,-21);ctx.lineTo(8,-23);ctx.stroke();
  }else if(type==='paper'){
    const fill=ctx.createLinearGradient(-21,-28,23,28);fill.addColorStop(0,'#fffaff');fill.addColorStop(.6,'#ddd6fa');fill.addColorStop(1,'#a69bcf');
    path(ctx,[[-22,-28],[6,-28],[23,-10],[23,28],[-22,28]]);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#f7f1ff';ctx.lineWidth=1.4;ctx.stroke();
    path(ctx,[[6,-28],[6,-10],[23,-10]]);ctx.fillStyle='#9884c8';ctx.fill();
    path(ctx,[[6,-28],[9,-13],[23,-10]]);ctx.fillStyle='#eee7ff';ctx.fill();
    ctx.strokeStyle='#8878b366';ctx.lineWidth=2;for(const [yy,w] of [[-2,26],[6,24],[14,17]]){ctx.beginPath();ctx.moveTo(-13,yy);ctx.lineTo(-13+w,yy);ctx.stroke();}
    ctx.fillStyle='#ffffff77';ctx.fillRect(-20,-26,2,50);
  }else{
    const metal=ctx.createLinearGradient(-19,-6,20,30);metal.addColorStop(0,'#ffffff');metal.addColorStop(.35,'#d3dcf7');metal.addColorStop(.55,'#727caa');metal.addColorStop(.75,'#e7eaff');metal.addColorStop(1,'#a8acd6');
    for(const side of [-1,1]){path(ctx,[[side*-9,-12],[side*23,29],[side*18,30],[side*-2,3],[side*-15,-6]]);ctx.fillStyle=metal;ctx.fill();ctx.strokeStyle='#d2c9ef';ctx.lineWidth=.7;ctx.stroke();}
    ctx.lineWidth=5.6;ctx.strokeStyle='#773166';for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*14,-17,9,10,side*.32,0,Math.PI*2);ctx.stroke();}
    ctx.lineWidth=3.5;ctx.strokeStyle='#f17dc9';for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*14,-18,9,10,side*.32,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle='#5f527f';ctx.beginPath();ctx.arc(0,1,3.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f3eaff';ctx.beginPath();ctx.arc(-.8,0,1.4,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
const sprites=new Map(),backgrounds=new Map();
function sprite(type){if(!sprites.has(type)){const c=document.createElement('canvas');c.width=c.height=128;drawRpsIcon(c.getContext('2d'),type,64,64,100);sprites.set(type,c);}return sprites.get(type);}
function icon(ctx,type,x,y,size){ctx.drawImage(sprite(type),x-size*.64,y-size*.64,size*1.28,size*1.28);}
function background(mode){
  if(backgrounds.has(mode))return backgrounds.get(mode);
  const c=document.createElement('canvas');c.width=540;c.height=960;const ctx=c.getContext('2d');ctx.fillStyle='#050409';ctx.fillRect(0,0,540,960);
  if(mode!=='minimal'){
    const random=randomFrom(7283);
    for(let i=0;i<75;i++){
      const t=random(),x=60+t*440+(random()-.5)*170,y=-20+t*1050,r=45+random()*120;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%3===0?'#716a8520':'#68529010');g.addColorStop(1,'#05040900');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
    }
    for(let i=0;i<135;i++){ctx.globalAlpha=.08+random()*.36;ctx.fillStyle='#e2d5ff';ctx.beginPath();ctx.arc(random()*540,random()*960,.3+random()*.65,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    const vignette=ctx.createRadialGradient(270,480,90,270,480,570);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#000000bd');ctx.fillStyle=vignette;ctx.fillRect(0,0,540,960);
  }
  backgrounds.set(mode,c);return c;
}
function text(ctx,value,x,y,size,color='#f4efff',weight=500){ctx.font=`${weight} ${size}px "Segoe UI", Arial, sans-serif`;ctx.fillStyle=color;ctx.fillText(value,x,y);}
export function drawRpsObstacles(ctx,obstacles){
  ctx.save();
  if(obstacles.some(o=>o.motion==='orbit')){
    ctx.strokeStyle='#c2a8ff24';ctx.lineWidth=1;ctx.setLineDash([4,9]);ctx.beginPath();ctx.arc(270,508,96,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  }
  for(const o of obstacles){
    ctx.save();
    const accent=o.bumper?'#97e7e1':o.motion?'#efb7ee':'#cfadf0';
    if(o.shape==='capsule'){ctx.translate(o.x,o.y);ctx.rotate(o.angle);}
    const yy=o.shape==='capsule'?0:o.y;
    const gradient=ctx.createLinearGradient(0,yy-25,0,yy+35);gradient.addColorStop(0,o.flash>0?'#b88ccc':'#463052');gradient.addColorStop(1,'#1b1129');
    ctx.fillStyle=gradient;ctx.strokeStyle=accent;ctx.lineWidth=1.4;ctx.shadowColor=accent;ctx.shadowBlur=o.flash>0?22:9;ctx.beginPath();
    if(o.shape==='circle')ctx.arc(o.x,o.y,o.r,0,Math.PI*2);
    else if(o.shape==='capsule')ctx.roundRect(-o.half-o.r,-o.r,2*(o.half+o.r),o.r*2,o.r);
    else ctx.roundRect(o.x,o.y,o.width,o.height,3);
    ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.strokeStyle=accent+'55';ctx.lineWidth=1;
    if(o.shape==='circle'){
      ctx.beginPath();ctx.arc(o.x,o.y,o.r-5,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=accent;ctx.beginPath();ctx.arc(o.x,o.y,o.bumper?3:2,0,Math.PI*2);ctx.fill();
    }else if(o.shape==='capsule'){
      ctx.beginPath();ctx.moveTo(-o.half+12,0);ctx.lineTo(o.half-12,0);ctx.stroke();
      if(o.motion){const pivot=o.motion==='pendulum'?-o.half:0;ctx.fillStyle='#1c122c';ctx.beginPath();ctx.arc(pivot,0,o.r+3,0,Math.PI*2);ctx.fill();ctx.strokeStyle=accent;ctx.stroke();ctx.fillStyle=accent;ctx.beginPath();ctx.arc(pivot,0,2.5,0,Math.PI*2);ctx.fill();}
    }else if(o.motion==='gate'){
      const edge=o.side<0?o.x+o.width-8:o.x+8;
      ctx.strokeStyle=accent;ctx.beginPath();ctx.moveTo(edge,o.y+4);ctx.lineTo(edge,o.y+o.height-4);ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}
export function drawRpsMapPreview(ctx,game){
  const size=ctx.canvas.width;ctx.save();ctx.scale(size/480,ctx.canvas.height/480);ctx.translate(12-ARENA.x,12-ARENA.y);
  ctx.fillStyle='#100a1b';ctx.fillRect(ARENA.x-12,ARENA.y-12,480,480);ctx.strokeStyle='#b9a1ff66';ctx.lineWidth=2;ctx.strokeRect(ARENA.x,ARENA.y,ARENA.size,ARENA.size);
  drawRpsObstacles(ctx,game.obstacles);
  for(const [type,x,y] of [['rock',125,350],['scissors',410,350],['paper',270,666]])icon(ctx,type,x,y,40);
  ctx.restore();
}
export function renderRps(ctx,game,settings,{paused=false}={}){
  const {width,height}=ctx.canvas;ctx.save();ctx.scale(width/540,height/960);ctx.drawImage(background(settings.background),0,0);ctx.textAlign='center';ctx.textBaseline='middle';
  text(ctx,'M A R B L E  /  S T U D I O',270,58,9,'#c2add982',600);
  const counts=game.counts(),total=game.pieces.length;
  TYPES.forEach((type,i)=>{
    const x=95+i*175;ctx.globalAlpha=counts[type]===0?.28:1;
    ctx.fillStyle='#191220bf';ctx.strokeStyle=COLORS[type]+'32';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x-68,111,136,65,13);ctx.fill();ctx.stroke();
    icon(ctx,type,x-33,143,30);text(ctx,String(counts[type]).padStart(2,'0'),x+20,138,27,COLORS[type],650);text(ctx,NAMES[type].toLocaleUpperCase('tr'),x+20,161,8,'#aaa0b9',600);ctx.globalAlpha=1;
  });
  let fontSize=25;ctx.font=`600 ${fontSize}px "Segoe UI", Arial, sans-serif`;while(ctx.measureText(settings.title).width>490&&fontSize>12){fontSize--;ctx.font=`600 ${fontSize}px "Segoe UI", Arial, sans-serif`;}
  text(ctx,settings.title,270,220,fontSize,'#f7f1ff',600);
  const {x,y,size}=ARENA;
  ctx.fillStyle='#04030769';ctx.fillRect(x,y,size,size);ctx.strokeStyle='#b9a1ff';ctx.lineWidth=1.8;ctx.shadowColor='#9871ff';ctx.shadowBlur=13;ctx.strokeRect(x,y,size,size);ctx.shadowBlur=0;
  ctx.strokeStyle='#e6d7ff37';ctx.lineWidth=.6;ctx.strokeRect(x+4,y+4,size-8,size-8);
  ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,size-2,size-2);ctx.clip();
  drawRpsObstacles(ctx,game.obstacles);
  for(const f of game.flashes){ctx.globalAlpha=f.life/.24*.45;ctx.strokeStyle=COLORS[f.type];ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(f.x,f.y,12+(1-f.life/.24)*15,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
  for(const p of game.pieces){if(p.flash>0){ctx.globalAlpha=p.flash/.24*.2;ctx.fillStyle=COLORS[p.type];ctx.beginPath();ctx.arc(p.x,p.y,16,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}icon(ctx,p.type,p.x,p.y,23);}
  ctx.restore();
  let barX=x;TYPES.forEach(type=>{const w=size*counts[type]/total;ctx.fillStyle=COLORS[type];ctx.fillRect(barX,y+24+size,w,3);barX+=w;});
  if(game.state!=='running'){
    ctx.fillStyle='#08050deb';ctx.beginPath();ctx.roundRect(98,405,344,194,20);ctx.fill();ctx.strokeStyle='#cfb5ff64';ctx.lineWidth=1;ctx.stroke();
    if(game.winner){icon(ctx,game.winner,270,452,52);text(ctx,`${NAMES[game.winner].toLocaleUpperCase('tr')} KAZANDI`,270,510,28,COLORS[game.winner],700);text(ctx,'Bütün arena aynı tarafta.',270,553,15,'#c7bad9');}
    else{text(ctx,'DENGE BOZULMADI',270,475,25,'#eee4ff',650);text(ctx,'Süre doldu · Berabere',270,526,15,'#c7bad9');}
  }else if(paused){ctx.fillStyle='#0d071bd9';ctx.beginPath();ctx.roundRect(191,487,158,42,12);ctx.fill();text(ctx,'Ⅱ DURAKLATILDI',270,508,12,'#e9ddff',600);}
  ctx.restore();
}
