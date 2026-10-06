import {drawMarble} from './marble-art.js';
import {drawSpace} from './space-art.js';
import {raceName} from './race-copy.js';

export function drawFinale(ctx,race) {
  const winner=race.finished[0];if(!winner)return;
  const text=(value,x,y,size,fill='#eef0f1',align='center',width=420)=>{
    ctx.font=`600 ${size}px "Segoe UI",sans-serif`;ctx.fillStyle=fill;ctx.textAlign=align;
    let str=String(value);while(ctx.measureText(str).width>width&&size>14){size--;ctx.font=`600 ${size}px "Segoe UI",sans-serif`;}
    if(ctx.measureText(str).width>width){while(str.length&&ctx.measureText(str+'…').width>width)str=str.slice(0,-1);str+='…';}
    ctx.fillText(str,x,y);
  };
  const portrait=(ball,x,y,r)=>drawMarble(ctx,ball,x,y,r);
  ctx.save();
  if(race.state==='finished') {
    ctx.fillStyle='#080e20';ctx.fillRect(0,0,540,960);
    drawSpace(ctx,0,race.time);
    const halo=ctx.createRadialGradient(270,315,20,270,315,390);
    halo.addColorStop(0,winner.color+'40');halo.addColorStop(1,winner.color+'00');ctx.fillStyle=halo;ctx.fillRect(0,0,540,960);
    for(let i=0;i<40;i++) {
      const x=40+(i*137)%460,y=90+(i*97)%690;
      ctx.save();ctx.translate(x,y);ctx.rotate(i*1.7);ctx.fillStyle=i%2?winner.color+'75':'#e4f6ff60';ctx.fillRect(-2,-4,4,8);ctx.restore();
    }
    for(const radius of [90,108]) {ctx.beginPath();ctx.arc(270,315,radius,0,Math.PI*2);ctx.strokeStyle=winner.color+'55';ctx.lineWidth=1;ctx.stroke();}
    text(race.language==='tr'?'Y A R I Ş I N  K A Z A N A N I':'R A C E  W I N N E R',270,175,15,winner.color);portrait(winner,270,315,68);
    text(raceName(race,winner),270,425,34);text(`${winner.finishedAt.toFixed(2)} s`,270,458,16,winner.color);
    race.finished.slice(1,3).forEach((ball,index)=>{
      const y=568+index*90;
      ctx.fillStyle='#14243be0';ctx.fillRect(53,y-34,434,73);ctx.fillStyle=ball.color;ctx.fillRect(53,y-34,3,73);
      text(index+2,76,y+6,18,'#a7adb2');portrait(ball,126,y,23);
      text(raceName(race,ball),167,y-2,19,'#eef0f1','left',275);
      text(`${ball.finishedAt.toFixed(2)} s`,167,y+22,13,'#a7adb2','left');
    });
  }else {
    ctx.fillStyle='#080e20ee';ctx.fillRect(27,0,486,67);ctx.fillStyle=winner.color;ctx.fillRect(27,65,486,2);portrait(winner,50,34,18);
    text(`${race.language==='tr'?'Kazanan':'Winner'} · ${raceName(race,winner)}`,80,40,16,'#eef0f1','left',405);
  }
  ctx.restore();
}
