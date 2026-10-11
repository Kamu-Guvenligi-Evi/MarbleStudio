export function renderPi(ctx,race,{language='en',paused=false}={}){
  const tr=language==='tr',w=ctx.canvas.width,h=ctx.canvas.height;
  ctx.save();ctx.setTransform(w/540,0,0,h/960,0,0);
  ctx.fillStyle='#000';ctx.fillRect(0,0,540,960);
  const gradient=ctx.createLinearGradient(95,0,445,0);gradient.addColorStop(0,'#00dcf4');gradient.addColorStop(1,'#37fa51');
  const text=(value,x,y,size,color,weight=500,font='Segoe UI')=>{ctx.font=`${weight} ${size}px ${font}`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(value,x,y,490);};
  text('MARBLE STUDIO',270,62,11,'#555d65',600);
  text(tr?'Biraz bekle… π?':'Wait for it… π?',270,214,43,gradient,700);
  text(tr?'Çarpışmalar':'Collisions',270,296,23,'#7ded79',500,'Georgia');
  text(String(race.collisions),270,362,72,'#46e641',500,'Georgia');
  const floor=610,wall=race.wall;
  ctx.fillStyle='#85480f';ctx.fillRect(wall,430,540-wall,floor-430);
  ctx.save();ctx.beginPath();ctx.rect(wall,430,540-wall,floor-430);ctx.clip();
  ctx.strokeStyle='#d6b084';ctx.lineWidth=.8;
  for(let row=0;row<15;row++){
    const y=430+row*13;ctx.beginPath();ctx.moveTo(wall,y);ctx.lineTo(540,y);ctx.stroke();
    for(let x=wall+(row%2?13:0);x<=540;x+=26){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+13);ctx.stroke();}
  }
  ctx.restore();
  ctx.strokeStyle='#d6b084';ctx.strokeRect(wall,430,540-wall,floor-430);
  ctx.fillStyle='#bfc0c2';ctx.fillRect(0,floor,540,29);ctx.fillStyle='#ededed';ctx.fillRect(0,floor,540,2);
  function block(b,color,label){
    const size=b.width,y=floor-size;
    ctx.fillStyle=color;ctx.fillRect(b.x,y,size,size);
    ctx.strokeStyle='#ffffff66';ctx.lineWidth=1;ctx.strokeRect(b.x+.5,y+.5,size-1,size-1);
    ctx.fillStyle='#ffffff19';ctx.fillRect(b.x+1,y+1,size-2,5);
    text(label,b.x+size/2,y+size/2+5,Math.min(15,size*.36),'#fff',700,'Georgia');
  }
  block(race.heavy,'#438bd2',({1:'1 kg',100:'100 kg',10000:'10⁴ kg',1000000:'10⁶ kg'})[race.mass]);
  block(race.light,'#bd4edf','1 kg');
  if(race.state!=='finished'&&race.lastHit&&race.time-race.lastHit.time<.14){
    const strength=1-(race.time-race.lastHit.time)/.14;
    ctx.strokeStyle=`rgba(239,255,201,${strength*.8})`;ctx.lineWidth=2;
    const x=race.lastHit.x,y=floor-16;
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*5,y+Math.sin(a)*5);ctx.lineTo(x+Math.cos(a)*16,y+Math.sin(a)*16);ctx.stroke();}
  }
  text('π = 3.14159265358…',270,692,31,gradient,500,'Georgia');
  if(race.state==='finished'){
    text(tr?`${race.collisions} çarpışma`:`${race.collisions} collisions`,270,775,24,'#f4f6f4',600);
    text(`π ≈ ${race.approximation}`,270,819,36,gradient,600,'Georgia');
    text(tr?'Enerji korunur. Sayılar ortaya çıkar.':'Energy conserved. Digits revealed.',270,867,15,'#8a929a');
  }else{
    text(paused?(tr?'DURAKLATILDI':'PAUSED'):(tr?'İKİ BLOK. BİR DUVAR.':'TWO BLOCKS. ONE WALL.'),270,839,12,'#666e76',600);
    text(`${new Intl.NumberFormat('en-US').format(race.mass)} : 1`,270,871,17,'#949aa1',500,'Georgia');
  }
  ctx.restore();
}
