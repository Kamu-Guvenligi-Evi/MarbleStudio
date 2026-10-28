import { WALLS, TOWERS, BUILDINGS, CASTLE, GATE, ATTACKERS } from './crown-siege.js';
import { drawSiegeEquipment, drawSiegeCamp } from './crown-siege-equipment-art.js';

// The detailed masonry is cached in world space; soldiers retain their original art.
let masonry;
function polygon(g, points, fill, stroke) {
  g.beginPath(); points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.closePath();
  if(fill){g.fillStyle=fill;g.fill();} if(stroke){g.strokeStyle=stroke;g.stroke();}
}
function line(g,x,y,x2,y2,color,width=1){
  g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();
}
function banner(g,x,y,red=false,size=1,time=0){
  g.save();g.translate(x,y);g.scale(size,size);
  line(g,0,4,0,-72,'#302c24',4);line(g,-1,3,-1,-72,'#b5a47b');
  const wave=Math.sin(time*2+x)*3;
  polygon(g,[[2,-70],[37,-66+wave],[31,-32+wave],[2,-39]],red?'#824538':'#3e6470','#273e40');
  line(g,5,-67,32,-63+wave,'#d0bc8144');
  polygon(g,[[13,-59],[25,-58],[24,-47],[19,-42],[13,-48]],'#c9b783');
  line(g,19,-56,19,-47,'#496472',2);
  g.fillStyle='#bca77a';g.beginPath();g.arc(0,-74,3,0,Math.PI*2);g.fill();g.restore();
}

function buildCastle(){
  const canvas=document.createElement('canvas');canvas.width=2160;canvas.height=2040;
  const g=canvas.getContext('2d');g.translate(720,520);
  let seed=1066;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  function stone(x,y,w,h,block=20,dark=0){
    g.fillStyle='#4b4d42';g.fillRect(x,y,w,h);g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
    for(let row=0;row<h/block;row++)for(let col=-1;col<w/(block*1.8);col++){
      const sx=x+col*block*1.8+(row%2)*block*.9,sy=y+row*block;
      const shade=Math.floor(120+random()*23-dark);
      g.fillStyle='rgb('+(shade+8)+','+(shade+6)+','+(shade-10)+')';g.fillRect(sx+1,sy+1,block*1.8-2,block-2);
      g.fillStyle='#e2d9b839';g.fillRect(sx+2,sy+1,block*1.8-4,2);
      g.fillStyle='#303b322b';g.fillRect(sx+2,sy+block-3,block*1.8-3,2);
      if(random()<.15)line(g,sx+7,sy+5,sx+16,sy+9,'#42493c40');
    }g.restore();
  }
  function mass(r,height=50){
    polygon(g,[[r.x,r.y+r.h],[r.x+r.w,r.y],[r.x+r.w+30,r.y+height],
      [r.x+r.w+30,r.y+r.h+height],[r.x+25,r.y+r.h+height]],'#15201950');
    stone(r.x,r.y+r.h,r.w,height,15,32);
    polygon(g,[[r.x+r.w-9,r.y],[r.x+r.w+9,r.y+14],
      [r.x+r.w+9,r.y+r.h+height],[r.x+r.w-9,r.y+r.h]],'#555747');
    stone(r.x,r.y,r.w,r.h);
    line(g,r.x,r.y+r.h+height,r.x+r.w,r.y+r.h+height,'#27302670',3);
    line(g,r.x+1,r.y+1,r.x+r.w-2,r.y+1,'#d4cdb36e',3);
  }
  function crenels(x,y,length,vertical=false){
    const count=Math.max(2,Math.floor(length/27)),step=length/count;
    for(let i=0;i<count;i++){
      const sx=x+(vertical?0:i*step),sy=y+(vertical?i*step:0);
      g.fillStyle='#242e2666';g.fillRect(sx+3,sy+5,vertical?13:17,vertical?17:13);
      stone(sx,sy,vertical?12:18,vertical?18:12,12);
    }
  }
  function parapet(r){
    g.fillStyle='#565d4d';g.fillRect(r.x+11,r.y+11,r.w-22,r.h-22);
    stone(r.x+17,r.y+17,r.w-34,r.h-34,14,15);
    crenels(r.x,r.y,r.w);crenels(r.x,r.y+r.h-12,r.w);
    crenels(r.x,r.y,r.h,true);crenels(r.x+r.w-12,r.y,r.h,true);
  }
  function slit(x,y){
    g.fillStyle='#b7ad8b';g.fillRect(x-2,y-2,9,19);
    g.fillStyle='#252d28';g.fillRect(x,y,4,14);g.fillRect(x-2,y+5,8,3);
  }
  function tower(r,gatehouse=false){
    mass(r,gatehouse?64:48);parapet(r);
    const s=gatehouse?36:30;
    g.fillStyle='#343c31';g.fillRect(r.x+r.w/2-s/2-3,r.y+r.h/2-s/2-3,s+6,s+6);
    stone(r.x+r.w/2-s/2,r.y+r.h/2-s/2,s,s,12,4);
    g.fillStyle='#3e4237';g.fillRect(r.x+20,r.y+25,12,24);
    for(let i=0;i<4;i++)line(g,r.x+21,r.y+28+i*5,r.x+30,r.y+28+i*5,'#a9a080');
    for(const x of [r.x+25,r.x+r.w-30])slit(x,r.y+r.h+16);
    for(const y of [r.y+32,r.y+r.h-32]){
      g.fillStyle='#282f26';g.fillRect(r.x+r.w-5,y,5,14);
      g.fillStyle='#d2c8a966';g.fillRect(r.x+r.w-7,y,2,14);
    }
    if(gatehouse){
      g.fillStyle='#365561';g.fillRect(r.x+45,r.y+r.h+7,27,34);
      polygon(g,[[r.x+45,r.y+r.h+41],[r.x+58,r.y+r.h+51],[r.x+72,r.y+r.h+41]],'#365561');
      g.fillStyle='#c5b079';g.fillRect(r.x+56,r.y+r.h+16,4,19);g.fillRect(r.x+51,r.y+r.h+22,14,4);
    }
  }
  function roof(r,slate=false){
    if(r.w>r.h){
      g.save();g.translate(r.x+r.w,r.y);g.rotate(Math.PI/2);
      roof({x:0,y:0,w:r.h,h:r.w},slate);g.restore();return;
    }
    const ridge=r.x+r.w*.46,top=r.y+4,bottom=r.y+r.h-4;
    const left=[[r.x-5,top+12],[ridge,top-12],[ridge,bottom+12],[r.x-5,bottom-12]];
    const right=[[ridge,top-12],[r.x+r.w+5,top+12],[r.x+r.w+5,bottom-12],[ridge,bottom+12]];
    polygon(g,left,slate?'#586467':'#7e7860');polygon(g,right,slate?'#38474b':'#5a5b49');
    g.save();
    polygon(g,[[r.x-5,top+12],[ridge,top-12],[r.x+r.w+5,top+12],
      [r.x+r.w+5,bottom-12],[ridge,bottom+12],[r.x-5,bottom-12]]);
    g.clip();
    for(let y=top-12;y<bottom+14;y+=9){
      line(g,r.x-6,y,r.x+r.w+6,y,slate?'#b1bdb12b':'#c4bb922b');
      for(let x=r.x+(Math.round(y/9)%2)*13;x<r.x+r.w;x+=26)line(g,x,y,x,y+8,'#202c2929');
    }g.restore();
    line(g,ridge,top-12,ridge,bottom+12,slate?'#a5b1a4':'#c2b693',4);
    line(g,r.x-5,top+12,ridge,top-12,'#ccc3a366',2);
    line(g,r.x-5,bottom-12,ridge,bottom+12,'#252f2b',3);
  }
  function chimney(x,y){
    g.fillStyle='#1c27214d';g.fillRect(x+9,y+11,24,36);stone(x,y,18,27,9,12);
    stone(x-3,y-3,24,12,9);g.fillStyle='#252a23';g.fillRect(x+2,y,14,5);
  }
  function crate(x,y){
    g.fillStyle='#292d2355';g.fillRect(x+5,y+6,24,26);g.fillStyle='#8b7751';g.fillRect(x,y,24,26);
    g.strokeStyle='#4c4936';g.lineWidth=2;g.strokeRect(x+1,y+1,22,24);
    line(g,x+2,y+3,x+22,y+23,'#c0a271',3);line(g,x+4,y+2,x+4,y+24,'#3b3d30');
  }
  function paving(x,y,w,h,size=24){
    g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
    for(let row=0;row<h/size;row++)for(let col=-1;col<w/(size*1.4);col++){
      const sx=x+col*size*1.4+(row%2)*size*.7,sy=y+row*size;
      g.fillStyle=random()>.5?'#b3ab8a65':'#7a7d685c';g.fillRect(sx+1,sy+1,size*1.4-2,size-2);
      line(g,sx+2,sy+1,sx+size*1.4-2,sy+1,'#d3c7a438');
    }g.restore();
  }

  // Worn approach and stone apron introduce no false impassable terrain.
  polygon(g,[[50,425],[530,400],[1420,280],[1420,690],[530,570],[50,535]],'#8d82604d');
  for(let i=0;i<900;i++){
    const x=100+random()*1320,y=430+random()*100+(x-100)*(random()-.5)*.14;
    g.fillStyle=random()>.5?'#b3a17b24':'#433e2e1f';g.fillRect(x,y,3+random()*9,2+random()*7);
  }
  const c=CASTLE;
  g.fillStyle='#4b504139';g.fillRect(c.left-16,c.top-14,c.right-c.left+40,c.bottom-c.top+40);
  const earth=g.createLinearGradient(c.left,0,c.right,0);
  earth.addColorStop(0,'#6d7159');earth.addColorStop(.55,'#88856b');earth.addColorStop(1,'#9a9277');
  g.fillStyle=earth;g.fillRect(c.left,c.top,c.right-c.left,c.bottom-c.top);
  for(let i=0;i<2600;i++){
    const x=c.left+random()*(c.right-c.left),y=c.top+random()*(c.bottom-c.top);
    g.fillStyle=random()>.45?'#d0c5a21c':'#393e3124';g.fillRect(x,y,3+random()*13,2+random()*8);
  }
  paving(-288,-285,110,1520);paving(-345,426,485,108);
  paving(-510,-85,334,58);paving(-510,985,334,58);
  paving(-290,340,275,280,30);
  g.strokeStyle='#c3b79473';g.lineWidth=7;g.beginPath();g.arc(-200,480,66,0,Math.PI*2);g.stroke();
  polygon(g,[[-200,426],[-188,468],[-146,480],[-188,492],[-200,534],[-212,492],[-254,480],[-212,468]],'#bfb18d5c');
  for(const r of WALLS){
    mass(r,36);parapet(r);
    const vertical=r.h>r.w;
    // Reinforcing piers remain inside the collision footprint.
    for(let k=90;k<(vertical?r.h:r.w)-35;k+=110){
      const x=vertical?r.x+r.w-13:r.x+k,y=vertical?r.y+k:r.y+r.h-13;
      stone(x,y,vertical?13:21,vertical?21:13,11,8);
    }
  }
  for(const r of BUILDINGS){
    if(r.kind==='well'){
      const x=r.x+r.w/2,y=r.y+r.h/2;
      g.fillStyle='#26302755';g.beginPath();g.ellipse(x+9,y+11,28,25,0,0,Math.PI*2);g.fill();
      g.fillStyle='#b0a78a';g.beginPath();g.arc(x,y,25,0,Math.PI*2);g.fill();
      g.fillStyle='#263b39';g.beginPath();g.arc(x,y,16,0,Math.PI*2);g.fill();
      for(let i=0;i<10;i++){const a=i*Math.PI/5;line(g,x+Math.cos(a)*17,y+Math.sin(a)*17,x+Math.cos(a)*25,y+Math.sin(a)*25,'#626656',2);}
      for(const dx of [-21,19]){g.fillStyle='#68583e';g.fillRect(x+dx,y-23,4,44);}
      line(g,x-21,y-22,x+23,y-22,'#b19a68',5);line(g,x,y-22,x,y+3,'#b4a27c',2);
      g.fillStyle='#887456';g.fillRect(x-5,y-2,10,9);continue;
    }
    if(r.kind==='keep'){
      mass(r,70);parapet(r);
      const hall={x:r.x+34,y:r.y+42,w:r.w-68,h:r.h-84};mass(hall,40);roof(hall,true);
      for(const x of [r.x,r.x+r.w-47])for(const y of [r.y,r.y+r.h-58])tower({x,y,w:47,h:58});
      for(let y=r.y+88;y<r.y+r.h-50;y+=49){
        g.fillStyle='#252c28';g.fillRect(r.x+r.w-24,y,8,16);
        line(g,r.x+r.w-25,y+17,r.x+r.w-14,y+17,'#b2aa8b',2);
      }
      g.fillStyle='#282c24';g.fillRect(r.x+r.w-15,r.y+r.h/2-24,15,48);
      for(let i=0;i<4;i++)line(g,r.x+r.w-14+i*3,r.y+r.h/2-22,r.x+r.w-14+i*3,r.y+r.h/2+22,'#8b846b');
      chimney(hall.x+15,hall.y+38);chimney(hall.x+15,hall.y+hall.h-50);
    }else{
      mass(r,27);roof(r);
      for(let x=r.x+25;x<r.x+r.w-12;x+=51)slit(x,r.y+r.h+5);
      g.fillStyle='#302f26';g.fillRect(r.x+r.w/2-11,r.y+r.h,22,25);
      line(g,r.x+r.w/2,r.y+r.h+1,r.x+r.w/2,r.y+r.h+24,'#938261',2);
      if(r.kind==='smithy')chimney(r.x+23,r.y+24);
      if(r.kind==='storehouse')for(let i=0;i<3;i++)crate(r.x+22+i*32,r.y+r.h-35);
    }
  }
  for(const r of TOWERS)tower(r,r.x===-16&&(r.y===300||r.y===540));
  // Guard galleries stop short of the clear gate passage.
  for(const y of [410,540]){
    stone(34,y,74,10,10);line(g,35,y,107,y,'#d3c8a0',2);
    for(let x=43;x<103;x+=15){g.fillStyle='#333b2e';g.fillRect(x,y+3,7,4);}
  }
  for(let i=0;i<8;i++)crate(-517+(i%4)*30,733+Math.floor(i/4)*31);
  for(let i=0;i<120;i++){
    g.fillStyle='#4b604335';g.fillRect(-590+random()*24,-270+random()*1500,3+random()*10,3+random()*6);
  }
  drawSiegeCamp(g);return canvas;
}

function drawGate(g,battle){
  const r=GATE,ratio=battle.gate.hp/battle.gate.maxHp;
  g.fillStyle='#252b2355';g.fillRect(r.x-8,r.y,r.w+23,r.h);
  if(ratio>0){
    g.fillStyle='#282b22';g.fillRect(r.x,r.y,r.w,r.h);
    const wood=g.createLinearGradient(r.x,0,r.x+r.w,0);
    wood.addColorStop(0,'#413c2b');wood.addColorStop(.55,'#85704b');wood.addColorStop(1,'#594b34');
    g.fillStyle=wood;g.fillRect(r.x+6,r.y+4,r.w-10,r.h-8);
    for(let y=r.y+7;y<r.y+r.h-3;y+=10){
      line(g,r.x+7,y,r.x+r.w-5,y,'#352f24',2);
      line(g,r.x+10,y+3,r.x+r.w-8,y+3,'#c0a26e36');
    }
    for(const x of [r.x+13,r.x+r.w-16]){
      g.fillStyle='#343e38';g.fillRect(x,r.y+4,6,r.h-8);
      line(g,x,r.y+5,x,r.y+r.h-5,'#a5ac97');
      for(let y=r.y+11;y<r.y+r.h-4;y+=16){g.fillStyle='#bdba98';g.fillRect(x+2,y,2,3);}
    }
    line(g,r.x+5,r.y+r.h/2,r.x+r.w-4,r.y+r.h/2,'#211e18',3);
    g.strokeStyle='#b2aa83';g.lineWidth=2;
    for(const y of [r.y+49,r.y+71]){g.beginPath();g.ellipse(r.x+33,y,4,5,0,0,Math.PI*2);g.stroke();}
    if(ratio<.7){
      line(g,98,440,73,462,'#211e18',4);line(g,73,462,86,490,'#211e18',4);line(g,86,490,64,520,'#211e18',4);
    }
    if(ratio<.35){
      polygon(g,[[77,460],[96,469],[86,485],[96,503],[71,498],[81,480]],'#1f251f');
      line(g,74,460,67,448,'#c7a875',3);line(g,71,497,61,509,'#c7a875',3);
    }
    if(ratio<1){g.fillStyle='#262c23';g.fillRect(117,430,5,100);g.fillStyle='#b49b65';g.fillRect(118,431,3,98*ratio);}
  }else{
    for(let i=0;i<18;i++){
      g.save();g.translate(40+(i%4)*22,425+i*6);g.rotate(i*.71);
      g.fillStyle=i%3?'#736044':'#3b4237';g.fillRect(-3,-13,6,26);
      g.fillStyle='#b49662';g.fillRect(-3,-13,2,22);g.restore();
    }
  }
}

export function drawSiege(g,battle){
  masonry ||= buildCastle();g.save();g.drawImage(masonry,-720,-520);
  for(const y of [-345,350,600,1300])banner(g,48,y,false,1,battle.time);
  banner(g,-440,345,false,1.5,battle.time);
  const c=battle.capture;
  g.strokeStyle=c.contested?'#ba9c67aa':'#d4c9a44d';g.lineWidth=2;g.setLineDash([8,12]);
  g.beginPath();g.arc(c.x,c.y,c.radius,0,Math.PI*2);g.stroke();g.setLineDash([]);
  if(c.progress){g.strokeStyle='#c0ad7e';g.lineWidth=5;g.beginPath();g.arc(c.x,c.y,c.radius,-Math.PI/2,-Math.PI/2+c.progress/c.required*Math.PI*2);g.stroke();}
  banner(g,c.x,c.y,battle.winner===ATTACKERS,1.2,battle.time);
  drawGate(g,battle);drawSiegeEquipment(g,battle);g.restore();
}

