const TAU=Math.PI*2;
const surfaces=new Map(),lightLayers=new Map(),materialPath=[];
let materialLength=0;
for(let i=0;i<=2600;i++){
  const angle=Math.PI/2+(239.5/(41/TAU)-Math.PI/2)*i/2600,radius=239.5-angle*41/TAU;
  const p={x:270+Math.cos(angle)*radius,y:480+Math.sin(angle)*radius,angle,s:0};
  if(i)materialLength+=Math.hypot(p.x-materialPath[i-1].x,p.y-materialPath[i-1].y);
  p.s=materialLength;materialPath.push(p);
}
function random(seed){let state=seed>>>0;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
function trace(ctx,points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));}
function line(ctx,points,color,width=1){trace(ctx,points);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function polygon(ctx,points,color){trace(ctx,points);ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function gradient(ctx,colors,x=0,y=230,ex=0,ey=750){const g=ctx.createLinearGradient(x,y,ex,ey);colors.forEach((color,i)=>g.addColorStop(i/(colors.length-1),color));return g;}
function grain(ctx,rng,alpha=.06){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const c=canvas.getContext('2d'),data=c.createImageData(128,128);
  for(let i=0;i<data.data.length;i+=4){const v=Math.floor(rng()*255);data.data[i]=data.data[i+1]=data.data[i+2]=v;data.data[i+3]=255;}
  c.putImageData(data,0,0);ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=ctx.createPattern(canvas,'repeat');ctx.fillRect(0,0,540,960);ctx.restore();
}
function fractures(ctx,rng,count,color,width=1){
  for(let i=0;i<count;i++){
    let x=15+rng()*510,y=240+rng()*490;const points=[[x,y]],angle=rng()*TAU;
    for(let n=0;n<4;n++){const a=angle+(rng()-.5)*1.4;x+=Math.cos(a)*(8+rng()*20);y+=Math.sin(a)*(8+rng()*20);points.push([x,y]);}
    line(ctx,points,color,width);
    if(i%3===0)line(ctx,[points[1],[points[1][0]+rng()*28-14,points[1][1]+rng()*28-14]],color,width*.6);
  }
}
function ice(ctx,rng){
  for(let i=0;i<95;i++){
    const x=rng()*540,y=235+rng()*500,w=14+rng()*55,h=12+rng()*42;
    polygon(ctx,[[x,y],[x+w,y+h*.35],[x+w*.4,y+h]],i%3===0?'#e5fbff2c':'#1d617d18');
  }
  fractures(ctx,rng,140,'#e4fcff66',.7);fractures(ctx,rng,28,'#184b663b',.8);
  for(let i=0;i<170;i++){
    const x=rng()*540,y=235+rng()*500,r=.4+rng()*2.7;
    ctx.beginPath();ctx.ellipse(x,y,r,r*.7,-.4,0,TAU);ctx.strokeStyle='#dbfaff66';ctx.lineWidth=.6;ctx.stroke();
    line(ctx,[[x-r*.4,y-r*.35],[x+r*.1,y-r*.45]],'#ffffff8c',.5);
  }
  ctx.fillStyle=gradient(ctx,['#ffffff00','#edfcff44','#ffffff00','#1a4a6333'],20,250,520,680);ctx.fillRect(0,0,540,960);
}
function lava(ctx,rng){
  for(let i=0;i<230;i++){
    const x=rng()*540,y=235+rng()*500,r=3+rng()*16;
    polygon(ctx,[[x-r,y],[x-r*.2,y-r],[x+r,y-r*.25],[x+r*.6,y+r],[x-r*.4,y+r*.6]],i%2?'#55302888':'#090a0ca6');
  }
  ctx.save();ctx.shadowColor='#ff4b0d';ctx.shadowBlur=11;
  fractures(ctx,rng,115,'#ff4214',2.2);ctx.shadowBlur=0;
  fractures(ctx,rng,75,'#ffd36c',.85);ctx.restore();
  for(let i=0;i<90;i++){
    const x=rng()*540,y=240+rng()*490,r=1+rng()*4;
    const g=ctx.createRadialGradient(x,y,0,x,y,r*3);g.addColorStop(0,'#ffc44dbb');g.addColorStop(1,'#fa360000');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*3,0,TAU);ctx.fill();
  }
}
function aurora(ctx,rng){
  const colors=['#71ffaf','#22efbd','#7cd6ff','#a079ff','#f889d8'];
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.7;ctx.filter='blur(2px)';
  for(let i=0;i<58;i++){
    const x=i*11-45,top=225+Math.sin(i*.14)*48,bottom=715+Math.cos(i*.16)*22;
    const g=ctx.createLinearGradient(x,top,x,bottom);g.addColorStop(0,colors[Math.floor(i/12)%5]+'00');g.addColorStop(.28,colors[Math.floor(i/12)%5]+'c4');g.addColorStop(.67,colors[(Math.floor(i/12)+1)%5]+'80');g.addColorStop(1,'#5e68bf00');
    ctx.beginPath();ctx.moveTo(x,top);ctx.bezierCurveTo(x+70,top+120,x-70,bottom-140,x+Math.sin(i*.1)*85,bottom);
    ctx.strokeStyle=g;ctx.lineWidth=20+Math.sin(i*.25)*7;ctx.stroke();
  }
  ctx.restore();fractures(ctx,rng,35,'#bafde72e',.5);
}
function facets(ctx,rng){
  const colors=['#ffc8f4','#ff86df','#e64bc7','#b42c99','#f75db7','#fdb0e9'],rows=[];
  for(let y=210;y<820;y+=48){const row=[];for(let x=-60;x<640;x+=54)row.push([x+(rng()-.5)*30,y+(rng()-.5)*26]);rows.push(row);}
  for(let y=1;y<rows.length;y++)for(let x=1;x<rows[y].length;x++){
    const a=rows[y-1][x-1],b=rows[y-1][x],c=rows[y][x],d=rows[y][x-1];
    polygon(ctx,[a,b,c],gradient(ctx,[colors[Math.floor(rng()*colors.length)],colors[Math.floor(rng()*colors.length)]],...a,...c));
    polygon(ctx,[a,c,d],gradient(ctx,[colors[Math.floor(rng()*colors.length)],colors[Math.floor(rng()*colors.length)]],...d,...a));
    line(ctx,[b,a,c],'#ffe1ff66',.7);if(rng()>.7)line(ctx,[a,b],'#fff2ffc9',1.5);
  }
}
function candy(ctx,rng){
  ctx.fillStyle=gradient(ctx,['#fffdf1','#ffe9e9','#e6bfc8']);ctx.fillRect(0,0,540,960);
  for(let s=0;s<materialLength;s+=38){
    let lo=0,hi=materialPath.length-1;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(materialPath[mid].s<s)lo=mid;else hi=mid;}
    const p=materialPath[lo],a=p.angle,nx=Math.cos(a),ny=Math.sin(a),tx=-ny,ty=nx,x=p.x,y=p.y;
    polygon(ctx,[[x+nx*20-tx*15,y+ny*20-ty*15],[x+nx*20+tx,y+ny*20+ty],[x-nx*20+tx*17,y-ny*20+ty*17],[x-nx*20+tx,y-ny*20+ty]],gradient(ctx,['#ff5d7d','#d92b50','#b92344'],x-20,y-20,x+20,y+20));
    line(ctx,[[x+nx*18-tx*13,y+ny*18-ty*13],[x-nx*18+tx*2,y-ny*18+ty*2]],'#ff9bac',1);
  }
  for(let i=0;i<190;i++){ctx.fillStyle='#ffffff3d';ctx.fillRect(rng()*540,235+rng()*500,.7,.7);}
}
function gold(ctx,rng){
  ctx.fillStyle=gradient(ctx,['#8a4f13','#f2c55a','#fff4bc','#b67820','#e8b64a','#71410f'],20,250,490,620);ctx.fillRect(0,0,540,960);
  for(let i=0;i<430;i++){const y=230+rng()*510;line(ctx,[[0,y],[540,y+rng()*2]],i%3?'#5e390b16':'#fff1b333',.3+rng()*.5);}
  for(let i=0;i<60;i++){const x=rng()*540,y=235+rng()*500;polygon(ctx,[[x,y],[x+25,y+8],[x+11,y+34]],'#fff7c427');line(ctx,[[x,y],[x+25,y+8]],'#fff3b88c',.6);}
}
function wood(ctx,rng){
  const x=267,y=477;
  for(let ring=0;ring<38;ring++){
    const radius=ring*7.6+4,points=[];
    for(let i=0;i<=240;i++){const a=i/240*TAU,r=radius+Math.sin(a*5+ring*.21)*2.3+Math.sin(a*11+ring*.14)*.8;points.push([x+Math.cos(a)*r,y+Math.sin(a)*r*.98]);}
    line(ctx,points,ring%4===0?'#633719b3':'#75432470',1.2+ring%3*.3);
    line(ctx,points.map(([px,py])=>[px+1.8,py+1.8]),'#ffe0a343',.7);
  }
  for(let i=0;i<13;i++){
    const a=rng()*TAU,r=85+rng()*165;
    line(ctx,[[x+Math.cos(a)*r,y+Math.sin(a)*r],[x+Math.cos(a+.018)*(r+35),y+Math.sin(a+.018)*(r+35)],[x+Math.cos(a-.02)*(r+70),y+Math.sin(a-.02)*(r+70)]],'#4b2d1870',.7+rng()*1.2);
  }
  grain(ctx,rng,.09);
}
function honey(ctx,rng){
  const r=15;
  for(let row=0;row<23;row++)for(let col=0;col<22;col++){
    const x=col*r*1.73+(row%2)*r*.865,y=224+row*r*1.5;
    const points=Array.from({length:6},(_,i)=>[x+Math.cos(i/6*TAU+Math.PI/6)*r,y+Math.sin(i/6*TAU+Math.PI/6)*r]);
    polygon(ctx,points,gradient(ctx,['#a35c1d','#eda432','#ffd65f'],x-r,y-r,x+r,y+r));
    trace(ctx,points);ctx.closePath();ctx.strokeStyle='#ffe8a0b3';ctx.lineWidth=2;ctx.stroke();
    if(rng()>.73){ctx.beginPath();ctx.ellipse(x+3,y-3,3,1.5,-.6,0,TAU);ctx.fillStyle='#fff4cfbb';ctx.fill();}
  }
}
function marble(ctx,rng){
  for(let i=0;i<34;i++){
    const x=rng()*540,y=230+rng()*500;
    ctx.beginPath();ctx.moveTo(x-90,y-85);ctx.bezierCurveTo(x+35,y-45,x-60,y+30,x+90,y+95);
    ctx.strokeStyle=i%6===0?'#bb945276':'#6779834d';ctx.lineWidth=.5+rng()*2;ctx.stroke();fractures(ctx,rng,3,'#71808b30',.55);
  }
  ctx.fillStyle=gradient(ctx,['#ffffff00','#ffffff50','#ffffff00'],0,280,530,660);ctx.fillRect(0,0,540,960);
}
function copper(ctx,rng){
  for(let i=0;i<120;i++){
    const x=rng()*540,y=235+rng()*500,r=7+rng()*35;
    const points=Array.from({length:9},(_,n)=>{const a=n/9*TAU,s=r*(.5+rng()*.5);return [x+Math.cos(a)*s,y+Math.sin(a)*s];});
    polygon(ctx,points,i%3?'#2b8d80a3':'#63b9a07a');ctx.beginPath();ctx.ellipse(x,y,r*.15,r*.1,0,0,TAU);ctx.fillStyle='#e8ad7980';ctx.fill();
  }
  for(let i=0;i<240;i++){const x=rng()*540,y=235+rng()*500;line(ctx,[[x,y],[x+8+rng()*25,y-2]],'#ffcf9c35',.4);}
}
function sand(ctx,rng){
  for(let i=0;i<53;i++){
    const y=230+i*10,points=[];
    for(let x=0;x<=540;x+=5)points.push([x,y+Math.sin(x*.013+i*.2)*9+Math.sin(x*.031+i*.31)*2]);
    line(ctx,points,['#f7d5a18c','#79412840','#b86d3b77','#ffe9bc80'][i%4],2+i%3);
  }
  grain(ctx,rng,.19);
  for(let i=0;i<1200;i++){ctx.fillStyle=i%3?'#7a4a2833':'#fff0c880';ctx.fillRect(rng()*540,235+rng()*500,.6+rng(),.6+rng());}
}
function coral(ctx,rng){
  for(let i=0;i<58;i++){
    const x=rng()*540,y=240+rng()*490,h=12+rng()*35;
    line(ctx,[[x,y],[x+4,y-h],[x+12,y-h-10]],i%2?'#ffcab26b':'#98235266',3+rng()*3);
    line(ctx,[[x+2,y-h*.5],[x-9,y-h*.8],[x-13,y-h]],'#ffb89c7a',2.5);
  }
  for(let i=0;i<660;i++){
    const x=rng()*540,y=235+rng()*500,r=.7+rng()*1.7;
    ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle='#95395480';ctx.fill();ctx.beginPath();ctx.arc(x-.4,y-.5,r*.55,0,TAU);ctx.strokeStyle='#ffc8aa88';ctx.lineWidth=.5;ctx.stroke();
  }
}
const painters={ice,lava,aurora,crystal:facets,candy,gold,wood,honey,marble,copper,sand,coral};

export function spiralMaterial(theme){
  if(surfaces.has(theme))return surfaces.get(theme);
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
  const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.fillStyle=gradient(ctx,theme.surface);ctx.fillRect(0,0,540,960);
  const seed=[...theme.material].reduce((hash,char)=>Math.imul(hash,31)+char.charCodeAt(0),41),rng=random(seed);
  painters[theme.material](ctx,rng);if(!['wood','sand'].includes(theme.material))grain(ctx,rng,.035);
  // Curved highlights and shaded edges make the material a thick spiral ribbon.
  const bevel=offset=>materialPath.map(p=>[p.x+Math.cos(p.angle)*offset,p.y+Math.sin(p.angle)*offset]);
  line(ctx,bevel(14),theme.material==='lava'?'#ff641950':'#ffffff66',1.5);line(ctx,bevel(-14),'#00000055',2);
  if(['ice','candy','gold','honey','crystal','marble','copper'].includes(theme.material))line(ctx,bevel(8),'#ffffff38',3);
  surfaces.set(theme,canvas);return canvas;
}

export function drawMaterialAmbience(ctx,theme,time){
  if(theme.material==='crystal'){
    ctx.save();ctx.fillStyle='#ffcff5';
    for(let i=0;i<65;i++){ctx.globalAlpha=.12+.22*(1+Math.sin(time*.7+i))/2;ctx.beginPath();ctx.arc((i*173+31)%540,(i*257+47)%960,i%3===0?1.2:.6,0,TAU);ctx.fill();}
    ctx.restore();
  }
}

export function drawMaterialLight(ctx,texture,theme,time){
  if(!['lava','aurora','crystal','coral'].includes(theme.material))return;
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.07+.04*(1+Math.sin(time*.9))/2;ctx.drawImage(texture,0,0,540,960);ctx.restore();
  if(!['aurora','crystal'].includes(theme.material))return;
  let layer=lightLayers.get(theme);
  if(!layer){layer=document.createElement('canvas');layer.width=1080;layer.height=1920;layer.getContext('2d').scale(2,2);lightLayers.set(theme,layer);}
  const light=layer.getContext('2d');light.clearRect(0,0,540,960);light.save();
  if(theme.material==='crystal'){
    for(let i=0;i<24;i++){
      const alpha=Math.max(0,Math.sin(time*1.5+i*2.4))**8;
      if(alpha<.04)continue;
      const x=25+(i*163)%490,y=245+(i*137)%460,r=2+alpha*3;
      light.globalAlpha=alpha*.8;light.strokeStyle='#fff3fd';light.lineWidth=.8;
      light.beginPath();light.moveTo(x-r,y);light.lineTo(x+r,y);light.moveTo(x,y-r);light.lineTo(x,y+r);light.stroke();
      const shine=light.createRadialGradient(x,y,0,x,y,r*2);shine.addColorStop(0,'#ffddf3c0');shine.addColorStop(1,'#ff5ec900');light.fillStyle=shine;light.beginPath();light.arc(x,y,r*2,0,TAU);light.fill();
    }
  }else{
    const colors=['#75ffb4','#7eceff','#cb9aff'];
    for(let i=0;i<3;i++){
      const x=90+i*160+Math.sin(time*.3+i)*35,g=light.createLinearGradient(x,230,x,730);
      g.addColorStop(0,colors[i]+'00');g.addColorStop(.35,colors[i]+'55');g.addColorStop(1,colors[i]+'00');
      light.beginPath();light.moveTo(x,245);light.bezierCurveTo(x+80,350,x-60,560,x+40,725);light.strokeStyle=g;light.lineWidth=25;light.stroke();
    }
  }
  light.restore();light.globalCompositeOperation='destination-in';light.drawImage(texture,0,0,540,960);light.globalCompositeOperation='source-over';
  ctx.save();ctx.globalCompositeOperation='screen';ctx.drawImage(layer,0,0,540,960);ctx.restore();
}

export function drawMaterialParticle(ctx,p,theme){
  const size=p.size,color=p.white?theme.chip[0]:theme.chip[1];
  ctx.save();ctx.globalAlpha=Math.min(1,p.life*2);ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.lineWidth=.55;ctx.strokeStyle=theme.chip[0];
  const shard=[[-size,-size*.6],[size*.7,-size],[size*.4,size*.7],[-size*.8,size*.3]];
  if(theme.effect==='coral'){
    ctx.lineCap='round';line(ctx,[[0,size],[0,-size],[size*.65,-size*1.5]],color,size*.7);line(ctx,[[0,0],[-size*.65,-size*.65]],theme.chip[0],size*.5);
  }else if(theme.effect==='splinter'){
    polygon(ctx,[[-size*.3,-size*1.7],[size*.35,-size],[size*.18,size*1.6],[-size*.25,size]],color);line(ctx,[[0,-size*1.3],[0,size*1.1]],'#5b351d99',.55);
  }else if(['crystal','aurora','ice'].includes(theme.effect)){
    const a=[0,-size*1.5],b=[size*.75,0],c=[0,size*1.1],d=[-size*.75,0];polygon(ctx,[a,b,c,d],color);polygon(ctx,[a,[0,0],d],theme.chip[0]);polygon(ctx,[[0,0],b,c],theme.edge);line(ctx,[a,[0,0],c],'#ffffffba',.65);
  }else if(theme.effect==='ember'){
    ctx.shadowColor='#ff4b0d';ctx.shadowBlur=5;polygon(ctx,shard,p.white?'#ffcf65':'#ff511c');ctx.shadowBlur=0;polygon(ctx,shard.map(([x,y])=>[x*.65,y*.65]),p.white?'#ffefb4':'#652219');
  }else if(theme.effect==='honey'){
    polygon(ctx,Array.from({length:6},(_,i)=>[Math.cos(i/6*TAU)*size,Math.sin(i/6*TAU)*size]),color);line(ctx,[[-size*.4,-size*.4],[size*.4,-size*.7]],'#fff5d7',.8);
  }else if(theme.effect==='candy'){
    ctx.beginPath();ctx.roundRect(-size,-size*.7,size*2,size*1.4,size*.35);ctx.fillStyle=theme.chip[0];ctx.fill();ctx.save();ctx.clip();line(ctx,[[-size,-size],[size,size]],theme.chip[1],size*.65);ctx.restore();line(ctx,[[-size*.5,-size*.5],[size*.5,-size*.5]],'#ffffffbb',.6);
  }else if(theme.effect==='dust'){
    polygon(ctx,shard.map(([x,y])=>[x*.7,y*.7]),color);ctx.fillStyle=theme.chip[0];ctx.fillRect(-size*.2,-size*.2,.6,.6);
  }else{
    polygon(ctx,shard,color);if(theme.effect==='stone')line(ctx,[[-size*.8,-size*.2],[0,size*.3],[size*.5,0]],'#71808b',.6);else polygon(ctx,[[0,0],shard[0],shard[1]],theme.chip[0]);
  }
  ctx.restore();
}
