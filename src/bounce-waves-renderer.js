import {WAVE_PALETTES} from './bounce-waves.js';
import {drawChannelTitle} from './channel-branding.js';
import {drawWaveSpheres} from './bounce-waves-gpu.js';
const cache=new WeakMap();
const floors=new WeakMap();
const R=238,Y=637;
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
function sprites(game){
  const s=game.settings,colors=(s.palette==='custom'?[s.colorA,s.colorB]:WAVE_PALETTES[s.palette].colors).map(rgb);
  const key=colors.flat().join(',');
  if(cache.get(game)?.key===key)return cache.get(game);
  const atlas=document.createElement('canvas');atlas.width=32*96;atlas.height=32;
  const ctx=atlas.getContext('2d'),tints=[];
  for(let i=0;i<96;i++){
    const p=i/95*(colors.length-1),a=colors[Math.floor(p)],b=colors[Math.min(colors.length-1,Math.floor(p)+1)],f=p%1;
    const c=a.map((v,j)=>Math.round(v+(b[j]-v)*f)),css=`rgb(${c.join(',')})`;tints.push(css);
    const g=ctx.createRadialGradient(i*32+11,10,1,i*32+16,16,14);
    g.addColorStop(0,`rgb(${c.map(v=>Math.round(v+(255-v)*.65)).join(',')})`);
    g.addColorStop(.34,css);g.addColorStop(1,`rgb(${c.map(v=>Math.round(v*.48)).join(',')})`);
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(i*32+16,16,14,0,Math.PI*2);ctx.fill();
  }
  const result={key,atlas,tints,order:[...game.balls]};cache.set(game,result);return result;
}
function floor(game,width,height){
  const existing=floors.get(game);
  if(existing?.width===width&&existing?.height===height)return existing;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');ctx.scale(width/540,height/960);
  ctx.fillStyle='#06070d';ctx.fillRect(0,0,540,960);
  const halo=ctx.createRadialGradient(270,Y+20,20,270,Y+20,280);
  halo.addColorStop(0,'#37346336');halo.addColorStop(1,'#06070d00');
  ctx.fillStyle=halo;ctx.fillRect(0,340,540,570);
  const base=ctx.createLinearGradient(30,Y,510,Y+120);base.addColorStop(0,'#3b4054');base.addColorStop(.5,'#171b2a');base.addColorStop(1,'#363b52');
  ctx.fillStyle=base;ctx.beginPath();ctx.ellipse(270,Y+15,R+8,(R+8)*.49,0,0,Math.PI*2);ctx.fill();
  const top=ctx.createLinearGradient(0,Y-120,0,Y+120);top.addColorStop(0,'#282c40');top.addColorStop(1,'#141925');
  ctx.fillStyle=top;ctx.strokeStyle='#6e719a';ctx.lineWidth=1;
  ctx.beginPath();ctx.ellipse(270,Y,R+8,(R+8)*.49,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  // Fixed camera and vertical motion allow floor shadows to be rasterized once.
  ctx.fillStyle='#00000025';ctx.beginPath();
  for(const b of game.balls){const x=270+b.x*R,z=b.z*R;ctx.moveTo(x+game.radius,Y+z*.49);ctx.ellipse(x,Y+z*.49,game.radius,game.radius*.49,0,0,Math.PI*2);}ctx.fill();
  floors.set(game,canvas);return canvas;
}
export function renderWaves(ctx,game,{channel}={}){
  const {width,height}=ctx.canvas;ctx.save();ctx.scale(width/540,height/960);
  ctx.drawImage(floor(game,width,height),0,0,540,960);
  const {atlas,order}=sprites(game);
  // Orthographic camera preserves sphere size and keeps all modes in frame.
  for(const b of game.balls){
    const z=b.z*R;
    b.sx=270+b.x*R;b.sy=Y+z*.49-(b.height+game.radius)*.872;b.depth=z*.872+(b.height+game.radius)*.49;
  }
  order.sort((a,b)=>a.depth-b.depth);
  const d=game.radius*2*32/28;
  if(!drawWaveSpheres(ctx,order,atlas,d))for(const b of order)ctx.drawImage(atlas,b.color*32,0,32,32,b.sx-d/2,b.sy-d/2,d,d);
  // Only the chosen channel is printed into the video.
  drawChannelTitle(ctx,channel,270,162,15);
  ctx.restore();
}
