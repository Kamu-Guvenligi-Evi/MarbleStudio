import {drawMaterialScenery} from './spiral-material-scenery.js';
const TAU=Math.PI*2;
const wrap=(n,size)=>((n%size)+size)%size;
function stroke(ctx,color,width,points){
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
}
function glow(ctx,x,y,r,color){
  const g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,color+'99');g.addColorStop(1,color+'00');
  ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
}
// Simulation time keeps previews, pause and exported frames in sync. No physics RNG.
export function drawSpiralScenery(ctx,scene,time,progress=0){
  if(!scene)return;
  if(scene.startsWith('material:')){drawMaterialScenery(ctx,scene.slice(9),time);return;}
  ctx.save();ctx.lineCap='round';
  if(scene==='meteors'){
    for(let i=0;i<64;i++){
      ctx.globalAlpha=.2+.45*(1+Math.sin(time*.8+i*2))/2;
      ctx.fillStyle='#c3d5ff';ctx.fillRect((i*173+23)%540,(i*251+17)%960,1.5,1.5);
    }
    ctx.globalAlpha=.65;
    for(let i=0;i<5;i++){
      const phase=wrap(time*.13+i*.21,1),x=phase*830-160,y=90+i*157+phase*180;
      const g=ctx.createLinearGradient(x-85,y-35,x,y);g.addColorStop(0,'#7f9cff00');g.addColorStop(1,'#d9f4ff');
      stroke(ctx,g,2,[[x-85,y-35],[x,y]]);glow(ctx,x,y,8,'#b9ddff');
    }
    glow(ctx,440,165,100,'#745ad0');
  }else if(scene==='jellyfish'){
    for(let i=0;i<7;i++){
      const x=48+(i*157)%460+Math.sin(time*.35+i)*17,y=wrap(970+i*151-time*(9+i),1120)-80;
      const r=17+i%3*7,pulse=1+Math.sin(time*1.7+i)*.1;
      ctx.save();ctx.translate(x,y);ctx.scale(pulse,1/pulse);glow(ctx,0,0,r*2,'#4adfda');
      ctx.fillStyle='#63e5de40';ctx.strokeStyle='#a9fff390';ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(0,0,r,r*.7,0,Math.PI,TAU);ctx.closePath();ctx.fill();ctx.stroke();
      for(let j=0;j<5;j++){
        const points=[];for(let k=0;k<9;k++)points.push([(j-2)*r*.32+Math.sin(k*.7-time*2+i+j)*4,k*6]);
        stroke(ctx,'#80e8e360',1,points);
      }ctx.restore();
    }
    ctx.fillStyle='#9be8fa50';for(let i=0;i<25;i++){ctx.beginPath();ctx.arc((i*139)%540,wrap(i*97-time*18,960),1+i%3,0,TAU);ctx.fill();}
  }else if(scene==='fireflies'){
    for(let i=0;i<18;i++){
      const x=(i*137)%540,y=810+(i*53)%150;
      stroke(ctx,'#194b3960',2,[[x,960],[x+Math.sin(time*.4+i)*8,y]]);
    }
    for(let i=0;i<40;i++){
      const x=wrap(i*137+Math.sin(time*.35+i)*28,540),y=wrap(i*89+Math.cos(time*.45+i*3)*24,960);
      ctx.globalAlpha=.2+.7*Math.pow((1+Math.sin(time*1.5+i*2))/2,3);
      glow(ctx,x,y,11,'#c5ff70');ctx.fillStyle='#e6ffa0';ctx.fillRect(x-1,y-1,2,2);
    }
  }else if(scene==='storm'){
    for(let i=0;i<10;i++){
      const x=wrap(i*137+time*7,740)-100,y=105+(i*71)%170;
      glow(ctx,x,y,95,'#637b9b');
    }
    for(let i=0;i<65;i++){
      const x=wrap(i*131+time*36,580)-20,y=wrap(i*97+time*210,1000)-20;
      stroke(ctx,'#91b9df30',1,[[x,y],[x-5,y-15]]);
    }
    const phase=wrap(time,9);
    if(phase<.65){
      ctx.globalAlpha=Math.sin(phase/.65*Math.PI)*.65;
      const x=90+(Math.floor(time/9)*163)%360;
      stroke(ctx,'#cee9ff',2,[[x,130],[x-22,180],[x+9,176],[x-28,240],[x-8,215]]);
      glow(ctx,x,160,65,'#9dcaff');
    }
  }else if(scene==='dunes'){
    glow(ctx,405,145,62,'#ffca7a');
    for(let i=0;i<4;i++){
      ctx.fillStyle=['#9f653720','#ac78452a','#b5855030','#ce985b25'][i];
      ctx.beginPath();ctx.moveTo(0,960);
      for(let x=0;x<=550;x+=10)ctx.lineTo(x,800+i*36+Math.sin(x*.009+i+time*.035)*29);
      ctx.lineTo(540,960);ctx.closePath();ctx.fill();
    }
    for(let i=0;i<65;i++){
      const x=wrap(i*131+time*(22+i%7),580)-20,y=wrap(i*67+Math.sin(time*.4+i)*10,960);
      stroke(ctx,'#efc78c45',1,[[x,y],[x+3+i%5,y-1]]);
    }
  }else if(scene==='vortex'){
    ctx.translate(270,480);
    for(let i=0;i<9;i++){
      const r=30+wrap(i*48+time*14,440),alpha=(1-r/480)*.3;
      ctx.strokeStyle=`rgba(164,117,255,${alpha})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,r,r*.65,time*.08+i*.13,0,TAU);ctx.stroke();
    }
    for(let i=0;i<28;i++){
      const a=i*2.4+time*.12,r=70+(i*71)%400;
      glow(ctx,Math.cos(a)*r,Math.sin(a)*r*.8,4,'#bd8fff');
    }
  }
  ctx.restore();
}
