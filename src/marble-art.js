import { ballImage } from './ball-images.js';

// Shared by the race and podium. The marble keeps its physical radius.
export function drawMarble(ctx,ball,x,y,r) {
  ctx.save();
  const circle=radius=>{ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);};
  const glow=ctx.createRadialGradient(x,y,r*.65,x,y,r*1.65);
  glow.addColorStop(0,ball.color+'55');glow.addColorStop(1,ball.color+'00');
  ctx.fillStyle=glow;ctx.fillRect(x-r*1.65,y-r*1.65,r*3.3,r*3.3);
  const shell=ctx.createRadialGradient(x-r*.35,y-r*.45,r*.05,x+r*.22,y+r*.3,r*1.35);
  shell.addColorStop(0,'#ffffff');shell.addColorStop(.25,ball.color);shell.addColorStop(.65,ball.color);shell.addColorStop(1,'#11182e');
  circle(r);ctx.fillStyle=shell;ctx.fill();ctx.strokeStyle=ball.color;ctx.lineWidth=1;ctx.stroke();
  const portrait=ballImage(ball.imageSrc);
  if(portrait) {
    ctx.save();circle(r);ctx.clip();const s=Math.min(portrait.naturalWidth,portrait.naturalHeight);
    ctx.drawImage(portrait,(portrait.naturalWidth-s)/2,(portrait.naturalHeight-s)/2,s,s,x-r,y-r,r*2,r*2);ctx.restore();
    circle(r-.5);ctx.strokeStyle=ball.color;ctx.lineWidth=1;ctx.stroke();
  }else {
    ctx.save();circle(r-1);ctx.clip();ctx.translate(x,y);ctx.rotate((ball.body?.angle??0)+ball.id*.7);
    ctx.strokeStyle='#ffffff60';ctx.lineWidth=r*.22;ctx.beginPath();
    ctx.ellipse(0,0,r*.46,r*1.1,.55,0,Math.PI*2);ctx.stroke();ctx.restore();
    circle(r*.49);ctx.fillStyle='#0c1835b0';ctx.fill();
    ctx.font=`800 ${r*.73}px "Segoe UI",sans-serif`;ctx.textAlign='center';ctx.fillStyle='#ffffff';ctx.fillText(String((ball.entrantId??ball.id)+1),x,y+r*.26);
    ctx.beginPath();ctx.ellipse(x-r*.3,y-r*.55,r*.28,r*.12,-.45,0,Math.PI*2);ctx.fillStyle='#ffffffb0';ctx.fill();
  }
  if(!portrait){ctx.beginPath();ctx.arc(x,y,r-.8,Math.PI*1.08,Math.PI*1.77);ctx.strokeStyle='#ffffffa0';ctx.lineWidth=1.1;ctx.stroke();}
  ctx.restore();
}
