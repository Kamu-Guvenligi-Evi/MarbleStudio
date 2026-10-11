export function renderPi(ctx,session,{language='en',paused=false}={}){
  const race=session.current??session,tr=language==='tr',w=ctx.canvas.width,h=ctx.canvas.height;
  const auto=session.options.autoIncrease,finished=race.state==='finished',digits=race.options.digits;
  const mass=new Intl.NumberFormat(tr?'tr-TR':'en-US').format(race.mass);
  ctx.save();ctx.setTransform(w/540,0,0,h/960,0,0);
  const bg=ctx.createLinearGradient(0,0,540,960);bg.addColorStop(0,'#111d2c');bg.addColorStop(.55,'#060c15');bg.addColorStop(1,'#101e29');
  ctx.fillStyle=bg;ctx.fillRect(0,0,540,960);
  const glow=ctx.createRadialGradient(270,310,10,270,310,280);glow.addColorStop(0,'#18e5c510');glow.addColorStop(1,'#18e5c500');ctx.fillStyle=glow;ctx.fillRect(0,0,540,640);
  const text=(value,x,y,size,color='#eaf5fa',weight=500,align='center')=>{ctx.font=weight+' '+size+'px "Segoe UI", sans-serif';ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(String(value),x,y,480);};
  const box=(x,y,width,height,radius,fill,stroke)=>{ctx.beginPath();ctx.roundRect(x,y,width,height,radius);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}};
  const accent=ctx.createLinearGradient(80,0,455,0);accent.addColorStop(0,'#5be8ff');accent.addColorStop(1,'#9bffb1');
  text('MARBLE / STUDIO',32,43,12,'#9fb1c2',650,'left');
  text('PHYSICS LAB  ·  01',508,43,11,'#6f869b',600,'right');
  ctx.fillStyle='#233446';ctx.fillRect(32,62,476,1);
  text(tr?'Çarpışmalardan π’ye':'Count your way to π',270,127,38,accent,750);
  text(tr?'İki blok. Bir duvar. Sonsuz bir sayı.':'Two blocks. One wall. An infinite number.',270,160,16,'#93a8bb');
  const levels=['1 kg','100 kg',tr?'10.000 kg':'10,000 kg','1M kg',tr?'100 milyon kg':'100M kg',tr?'10 milyar kg':'10B kg'];
  for(let i=0;i<levels.length;i++){
    const active=digits===i+1,done=(session.rounds??[]).some(round=>round.digits===i+1),x=34+(i%3)*160,y=185+Math.floor(i/3)*37;
    box(x,y,152,30,9,active?'#173d42':'#101c29',active?'#59e1c8':'#293847');
    text((done?'✓ ':'')+levels[i],x+76,y+20,13,active?'#adffe7':done?'#75bba9':'#778b9e',650);
  }
  text(tr?'ÇARPIŞMA SAYISI':'COLLISIONS',270,275,12,'#96b3bc',650);
  ctx.save();ctx.shadowColor='#60e8c966';ctx.shadowBlur=25;text(race.collisions,270,364,88,'#b6ffe4',700);ctx.restore();
  text(mass+' kg  /  1 kg',270,405,17,'#aac4d3',600);
  const floor=640,wall=race.wall;
  ctx.strokeStyle='#31435840';ctx.lineWidth=1;
  for(let x=32;x<wall;x+=28){ctx.beginPath();ctx.moveTo(x,459);ctx.lineTo(x,floor);ctx.stroke();}
  for(let y=472;y<floor;y+=28){ctx.beginPath();ctx.moveTo(32,y);ctx.lineTo(wall,y);ctx.stroke();}
  const bricks=ctx.createLinearGradient(wall,0,540,0);bricks.addColorStop(0,'#40566b');bricks.addColorStop(1,'#233344');
  ctx.fillStyle=bricks;ctx.fillRect(wall,457,540-wall,floor-457);
  ctx.save();ctx.beginPath();ctx.rect(wall,457,540-wall,floor-457);ctx.clip();ctx.strokeStyle='#96b4c44a';
  for(let row=0;row<10;row++){
    const y=457+row*21;ctx.beginPath();ctx.moveTo(wall,y);ctx.lineTo(540,y);ctx.stroke();
    for(let x=wall+(row%2?21:0);x<540;x+=42){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+21);ctx.stroke();}
  }
  ctx.restore();ctx.fillStyle='#83afc5';ctx.fillRect(wall,457,3,floor-457);
  ctx.fillStyle='#203b48';ctx.fillRect(0,floor,540,17);
  ctx.save();ctx.shadowColor='#63edcc';ctx.shadowBlur=12;ctx.fillStyle='#92d5c8';ctx.fillRect(0,floor,540,2);ctx.restore();
  ctx.fillStyle='#0a101a';ctx.fillRect(0,floor+17,540,8);
  function block(b,top,bottom,label){
    const size=b.width,y=floor-size,fill=ctx.createLinearGradient(b.x,y,b.x+size,y+size);fill.addColorStop(0,top);fill.addColorStop(1,bottom);
    ctx.save();ctx.shadowColor=bottom;ctx.shadowBlur=18;box(b.x,y,size,size,5,fill);ctx.restore();
    box(b.x+.5,y+.5,size-1,size-1,5,'#ffffff00','#ffffff60');ctx.fillStyle='#ffffff40';ctx.fillRect(b.x+5,y+4,size-10,2);
    text(label,b.x+size/2,y+size/2+5,Math.min(14,size*.34),'#ffffff',750);ctx.fillStyle='#00000018';ctx.fillRect(b.x+4,y+size-5,size-8,3);
  }
  block(race.heavy,'#5ac8ff','#2460c3',({1:'1 kg',100:'100 kg',10000:'10⁴ kg',1000000:'10⁶ kg',100000000:'10⁸ kg',10000000000:'10¹⁰ kg'})[race.mass]);
  block(race.light,'#e298ff','#9542c7','1 kg');
  if(!finished&&race.lastHit&&race.time-race.lastHit.time<.16){
    const strength=1-(race.time-race.lastHit.time)/.16,x=race.lastHit.x,y=floor-16;ctx.strokeStyle='rgba(185,255,227,'+strength+')';ctx.lineWidth=2;
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*7,y+Math.sin(a)*7);ctx.lineTo(x+Math.cos(a)*23,y+Math.sin(a)*23);ctx.stroke();}
  }
  box(32,714,476,133,18,'#111f2d','#2d4050');
  text(finished?(tr?'BİR BASAMAK DAHA KEŞFEDİLDİ':'ANOTHER DIGIT REVEALED'):(tr?'SAYILARIN ARDINDAKİ SIR':'THE PATTERN BEHIND THE NUMBERS'),270,747,11,'#94afbd',650);
  text(finished?'π ≈ '+race.approximation:'π = 3.14159265358…',270,791,finished?37:30,accent,650);
  text(finished?race.collisions+(tr?' çarpışma · ':' collisions · ')+mass+' kg':(tr?'Her çarpışma, sayıya bir adım daha.':'Every collision brings us one step closer.'),270,821,13,'#a2b8c9');
  const status=paused?(tr?'DURAKLATILDI':'PAUSED'):session.transitioning?(tr?'KÜTLE ×100 · SONRAKİ TUR':'MASS ×100 · NEXT ROUND'):session.state==='finished'?(tr?'DENEY TAMAMLANDI':'EXPERIMENT COMPLETE'):auto?(tr?'OTOMATİK KÜTLE ARTIŞI':'AUTOMATIC MASS INCREASE'):(tr?'TAM ESNEK ÇARPIŞMALAR':'PERFECTLY ELASTIC COLLISIONS');
  text(status,270,891,12,'#82c8b5',650);
  if(session.transitioning){const progress=1-session.holdRemaining/2;box(170,908,200,3,1,'#243d46');if(progress>0)box(170,908,200*progress,3,1,'#79e8c5');}
  text('π',270,943,17,'#4a6275',600);ctx.restore();
}
