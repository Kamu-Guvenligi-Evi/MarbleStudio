import {mergeImage,mergeImageInfo} from './merge-images.js';
import {ARENA} from './merge-evolution.js';
import {drawChannelTitle} from './channel-branding.js';
const sprites=new Map();
const unit=v=>Math.max(0,Math.min(1,v));
// Stay inside the arena: replay the final contact slowly, then hold the result.
function finalMerge(ctx,game,winner,age){
 const dissolve=unit(age/.55),ease=dissolve*dissolve*(3-2*dissolve);
 for(const parent of game.finalMerge?.parents??[]){
  const x=parent.x+(winner.x-parent.x)*ease,y=parent.y+(winner.y-parent.y)*ease;
  const radius=parent.r*(1-ease*.7);
  ctx.save();ctx.globalAlpha=1-ease;ctx.translate(x,y);ctx.rotate(parent.angle*(1-ease));
  ctx.drawImage(emblem(game.theme,parent.level),-radius,-radius,radius*2,radius*2);ctx.restore();
 }
 const appear=unit((age-.18)/.42),size=winner.r*(.55+.45*appear);
 ctx.save();ctx.globalAlpha=appear;ctx.translate(winner.x,winner.y);ctx.rotate(winner.angle);
 // The alpha silhouette supplies the light; there is no enclosing circle.
 ctx.shadowColor='#fff1bd';ctx.shadowBlur=28*Math.sin(appear*Math.PI);
 ctx.drawImage(emblem(game.theme,winner.level),-size,-size,size*2,size*2);ctx.restore();
}
function emblem(theme,level){
 const photo=mergeImage(theme,level);const key=theme.id+':'+level+':'+(mergeImageInfo(theme,level)?.src??theme.stages[level].icon)+(photo?':photo':'');if(sprites.has(key))return sprites.get(key);
 const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;
 const c=canvas.getContext('2d'),s=theme.stages[level];c.translate(96,96);
 if(photo){
  c.save();const info=mergeImageInfo(theme,level);
  if(info.reference){c.beginPath();c.arc(0,0,96,0,Math.PI*2);c.clip();}
  const [bx,by,bw,bh]=info.bounds??[0,0,1,1];
  const w=photo.naturalWidth*bw,h=photo.naturalHeight*bh,scale=Math.min(184/w,184/h);
  c.drawImage(photo,bx*photo.naturalWidth,by*photo.naturalHeight,w,h,-w*scale/2,-h*scale/2,w*scale,h*scale);c.restore();
  sprites.set(key,canvas);return canvas;
 }
 if(theme.category==='Elementler'){
  c.globalAlpha=.35;for(let i=0;i<3;i++){c.save();c.rotate(i*Math.PI/3);c.beginPath();c.ellipse(0,0,76,28,0,0,Math.PI*2);c.stroke();c.restore();}c.globalAlpha=1;
 }
 if(theme.id==='planets'){
  const colors=['#bcb0a1','#e2bb6c','#438ee9','#d66845','#ddad80','#e7d393','#81dbdc','#4368e5'];
  c.fillStyle=colors[level];c.beginPath();c.arc(0,0,59,0,Math.PI*2);c.fill();c.save();c.clip();
  if(level===2){c.fillStyle='#74ba68';c.beginPath();c.moveTo(-40,-35);c.lineTo(20,-40);c.lineTo(35,0);c.lineTo(0,38);c.lineTo(-20,10);c.fill();}
  else{c.strokeStyle='#ffffff44';c.lineWidth=9;for(let y=-40;y<60;y+=22){c.beginPath();c.moveTo(-65,y);c.bezierCurveTo(-20,y+14,20,y-12,65,y+6);c.stroke();}}
  c.fillStyle='#0003';c.beginPath();c.ellipse(35,0,30,65,0,0,Math.PI*2);c.fill();c.restore();
  if(level===5){c.strokeStyle='#e5c990';c.lineWidth=10;c.beginPath();c.ellipse(0,0,82,23,-.35,0,Math.PI*2);c.stroke();}
 }else{
  c.textAlign='center';c.textBaseline='middle';c.fillStyle=s.color;
  c.font=`bold ${s.icon.length>3?66:100}px "Segoe UI Emoji", "Segoe UI Symbol", Arial`;c.fillText(s.icon,0,5,145);
 }
 sprites.set(key,canvas);return canvas;
}
export function renderMerge(ctx,game,{channel,interpolation=1}={}){
 const {x,y,r}=ARENA,theme=game.theme;ctx.save();ctx.scale(ctx.canvas.width/540,ctx.canvas.height/960);
 ctx.fillStyle='#000';ctx.fillRect(0,0,540,960);ctx.textAlign='center';ctx.textBaseline='middle';
 drawChannelTitle(ctx,channel,270,22,15);
 const age=game.finalAt===null?null:(game.time-game.finalAt)/game.settings.speed;
 const winner=age===null?null:game.balls.find(b=>b.id===game.finalMerge?.id);
 ctx.save();ctx.beginPath();ctx.rect(0,40,540,715);ctx.clip();
 if(winner){const zoom=1+.16*(1-(1-unit(age/.7))**3);ctx.translate(winner.x,winner.y);ctx.scale(zoom,zoom);ctx.translate(-winner.x,-winner.y);}
 // Rainbow circle with a real 34 px opening, matching the recorded funnel.
 const neck=50,opening=Math.asin(neck/r);
 const ringStart=-Math.PI/2+opening,ringSweep=Math.PI*2-opening*2;
 const rainbow=ctx.createConicGradient(ringStart,x,y);for(let i=0;i<=12;i++)rainbow.addColorStop(i/12*ringSweep/(Math.PI*2),`hsl(${i*30+game.time*20} 90% 62%)`);
 ctx.lineWidth=3;ctx.strokeStyle=rainbow;ctx.beginPath();ctx.arc(x,y,r,ringStart,ringStart+ringSweep);ctx.stroke();
 ctx.strokeStyle='#f7f7ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-neck,y-r-200);ctx.lineTo(x-neck,y-r*Math.cos(opening));ctx.moveTo(x+neck,y-r-200);ctx.lineTo(x+neck,y-r*Math.cos(opening));ctx.stroke();
 for(const p of game.pulses){if(winner&&p.id===winner.id)continue;const age=(game.time-p.time)/.5;if(age>=1)continue;const body=game.balls.find(b=>b.id===p.id);ctx.globalAlpha=(1-age)*.65;ctx.strokeStyle='#e5e5df';ctx.lineWidth=1;ctx.beginPath();ctx.arc(body?.x??p.x,body?.y??p.y,p.r*(1+age*1.5),0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
 for(const b of game.balls){if(winner&&b.id===winner.id)continue;ctx.save();if(winner)ctx.globalAlpha=1-.25*unit(age/.5);const blend=winner?1:unit(interpolation),px=b.previousX??b.x,py=b.previousY??b.y,pa=b.previousAngle??b.angle;ctx.translate(px+(b.x-px)*blend,py+(b.y-py)*blend);ctx.rotate(pa+(b.angle-pa)*blend);ctx.drawImage(emblem(theme,b.level),-b.r,-b.r,b.r*2,b.r*2);ctx.restore();}
 if(winner)finalMerge(ctx,game,winner,age);ctx.restore();
 ctx.fillStyle='#fff';ctx.font='bold 23px Arial';const title=game.settings.title;const words=title.split(' ');let lines=[''];for(const word of words){const i=lines.length-1;if(ctx.measureText(lines[i]+word).width>460)lines.push(word+' ');else lines[i]+=word+' ';}lines.slice(0,3).forEach((line,i)=>ctx.fillText(line.trim(),270,773+i*28,480));
 const count=theme.stages.length,gap=49,start=270-(count-1)*gap/2;
 theme.stages.forEach((s,i)=>{ctx.globalAlpha=i<=game.highest?1:.32;ctx.drawImage(emblem(theme,i),start+i*gap-23,855,46,46);if(i<count-1){ctx.fillStyle='#586074';ctx.font='14px Arial';ctx.fillText('›',start+i*gap+25,878);}});ctx.globalAlpha=1;
 ctx.font='600 14px Arial';ctx.fillStyle=game.outcome==='final'?'#baf88a':'#989eaf';
 const label=game.outcome==='final'?`FINAL FORM · ${theme.stages.at(-1).name}`:game.outcome==='timeout'?`TIME UP · ${theme.stages[game.highest].name}`:`${theme.stages[game.highest].name}  ·  ${game.highest+1}/${count}`;ctx.fillText(label,270,922,490);

 ctx.restore();
}
