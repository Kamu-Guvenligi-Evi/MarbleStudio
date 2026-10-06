import {drawMarble} from './marble-art.js';
import {raceName} from './race-copy.js';

// Fixed broadcast overlay; the arena keeps its original scale.
export function drawLeaders(ctx,race) {
  const tr=race.language==='tr';
  const arena=race.mode==='arena',leaders=race.ranking().filter(b=>!arena||b.eliminatedAt===null).slice(0,3);
  if(!leaders.length)return;
  ctx.save();
  const wash=ctx.createLinearGradient(0,0,0,181);
  wash.addColorStop(0,'#060c1c');wash.addColorStop(.85,'#060c1cf5');wash.addColorStop(1,'#060c1c00');
  ctx.fillStyle=wash;ctx.fillRect(0,0,540,181);
  ctx.fillStyle='#8affcd';ctx.beginPath();ctx.arc(29,19,3,0,Math.PI*2);ctx.fill();
  ctx.textAlign='left';ctx.font='700 10px "Segoe UI",sans-serif';ctx.fillStyle='#c5d4e6';ctx.fillText(arena?(tr?'KALANLAR':'SURVIVORS'):(tr?'LİDERLER':'LIVE LEADERS'),39,23);
  ctx.textAlign='right';ctx.fillStyle='#72869e';ctx.fillText(arena?`${race.balls.filter(b=>b.eliminatedAt===null).length} ${tr?'KALDI':'LEFT'}`:(tr?'İLK 3':'TOP 3'),514,23);
  leaders.forEach((ball,i)=>{
    const x=22+i*168,center=x+80,color=i===0?'#ffe29a':'#91aac6';
    ctx.beginPath();ctx.roundRect(x,34,160,127,12);
    const fill=ctx.createLinearGradient(x,34,x+160,161);
    fill.addColorStop(0,i===0?'#2d2931':'#172236');fill.addColorStop(1,'#0c1525');
    ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=i===0?'#d4ae6480':'#8eaac329';ctx.lineWidth=1;ctx.stroke();
    drawMarble(ctx,ball,center,77,i===0?32:29);
    ctx.beginPath();ctx.arc(center+25,98,11,0,Math.PI*2);ctx.fillStyle=i===0?'#ffe29a':'#263a51';ctx.fill();
    ctx.textAlign='center';ctx.font='800 12px "Segoe UI",sans-serif';ctx.fillStyle=i===0?'#1a1b26':'#e6f0ff';ctx.fillText(String(i+1),center+25,102);
    ctx.font='600 13px "Segoe UI",sans-serif';ctx.fillStyle='#f1f5ff';
    const words=raceName(race,ball).split(/\s+/),lines=[''];
    for(const word of words){const n=lines.length-1,candidate=lines[n]?lines[n]+' '+word:word;if(ctx.measureText(candidate).width>142&&lines[n]&&n===0)lines.push(word);else lines[n]=candidate;}
    lines.slice(0,2).forEach((line,j)=>{
      while(ctx.measureText(line).width>142&&line.length>1)line=line.slice(0,-2)+'…';
      ctx.fillText(line,center,(lines.length>1?127+j*16:134)-(arena?8:0));
    });
    if(arena){ctx.font='600 10px "Segoe UI",sans-serif';ctx.fillStyle='#bfd0df';ctx.fillText(`${race.linkCount(ball)} ${tr?'BAĞ':'LINKS'} · ${ball.cuts} ${tr?'KESİŞ':'CUTS'}`,center,149);}
    ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(center-20,157,40,2,1);ctx.fill();
  });
  ctx.restore();
}
