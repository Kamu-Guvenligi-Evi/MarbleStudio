// World-space artwork. The original battlefield renderer still draws all soldiers and arrows.
function path(g, points, fill, stroke) {
  g.beginPath(); points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.closePath();
  if(fill){g.fillStyle=fill;g.fill();} if(stroke){g.strokeStyle=stroke;g.stroke();}
}
function beam(g,x,y,w,h){g.fillStyle='#382d22';g.fillRect(x+2,y+3,w,h);g.fillStyle='#92764e';g.fillRect(x,y,w,h);g.fillStyle='#bda174';g.fillRect(x,y,w,2);}
function wheel(g,x,y,t){
  g.save();g.translate(x,y);g.scale(1,.6);g.fillStyle='#282920';g.beginPath();g.arc(0,0,12,0,Math.PI*2);g.fill();
  g.strokeStyle='#a58b60';g.lineWidth=3;g.beginPath();g.arc(0,0,9,0,Math.PI*2);g.stroke();g.rotate(t);
  for(let i=0;i<4;i++){g.rotate(Math.PI/4);g.beginPath();g.moveTo(-9,0);g.lineTo(9,0);g.stroke();}g.restore();
}
export function drawRam(g,b){
  const r=b.ram;g.save();g.translate(r.x,r.y);
  g.fillStyle='#101b1760';g.beginPath();g.ellipse(12,20,64,44,0,0,Math.PI*2);g.fill();
  if(r.hp<=0){
    for(let i=0;i<8;i++){g.save();g.translate((i%4)*24-40,Math.floor(i/4)*30-20);g.rotate(i*.7);beam(g,-22,-4,44,8);g.restore();}
    wheel(g,-30,35,1);wheel(g,38,-20,2);g.restore();return;
  }
  for(const y of [-31,31])for(const x of [-34,35])wheel(g,x,y,r.x*.12);
  beam(g,-48,-26,98,8);beam(g,-48,22,98,8);
  for(const x of [-32,32])beam(g,x,-25,8,52);
  const swing=r.x<=158&&r.crew>=4?Math.sin((4.5-r.cooldown)/4.5*Math.PI*2)*9:0;
  beam(g,-61+swing,-5,105,12);g.fillStyle='#85877a';g.fillRect(-67+swing,-7,16,16);
  g.fillStyle='#b6b7a3';g.fillRect(-67+swing,-7,3,16);
  for(const x of [-30,28]){g.strokeStyle='#282b23';g.lineWidth=2;g.beginPath();g.moveTo(x,-22);g.lineTo(x+swing,4);g.stroke();}
  path(g,[[-47,-32],[46,-32],[54,-6],[-53,-6]],'#76624a','#302f25');
  path(g,[[-53,-6],[54,-6],[46,20],[-47,20]],'#4e4836','#302f25');
  beam(g,-53,-8,107,5);
  for(const x of [-40,-12,16,42]){g.strokeStyle='#ab987449';g.lineWidth=2;g.beginPath();g.moveTo(x,-30);g.lineTo(x,-7);g.lineTo(x+2,18);g.stroke();}
  path(g,[[-10,-29],[15,-29],[19,18],[-7,18]],'#743d33');
  g.strokeStyle='#ccb478';g.lineWidth=2;g.beginPath();g.moveTo(3,-23);g.lineTo(3,10);g.moveTo(-3,-15);g.lineTo(10,-15);g.stroke();
  if(r.hp<r.maxHp*.5){g.fillStyle='#1b211daa';g.fillRect(-39,-23,19,8);g.fillRect(21,0,22,9);}
  if(r.impact){g.strokeStyle=`rgba(221,197,146,${r.impact})`;g.lineWidth=3;for(let i=0;i<5;i++){g.beginPath();g.moveTo(-67,-18+i*9);g.lineTo(-76-r.impact*15,-24+i*12);g.stroke();}}
  if(r.hp<r.maxHp){g.fillStyle='#20291e';g.fillRect(-43,47,86,5);g.fillStyle='#b4a06b';g.fillRect(-42,48,84*r.hp/r.maxHp,3);}
  g.restore();
}
function drawLadder(g,l,b){
  const carriers=b.units.filter(u=>u.hp>0&&!u.wall&&u.x>100&&u.duty==='ladder'&&u.ladderId===l.id).sort((a,z)=>Math.hypot(a.x-l.x,a.y-l.y)-Math.hypot(z.x-l.x,z.y-l.y));
  const carrier=carriers[0],carrying=l.hp>0&&!l.build&&carrier&&Math.hypot(carrier.x-l.x,carrier.y-l.y)>48;
  if(l.hp>0&&!l.build&&!carrier)return;
  g.save();g.translate(carrying?carrier.x+35:l.x,carrying?carrier.y:l.y);
  if(l.hp<=0){for(let i=0;i<5;i++){g.save();g.translate(i*9-25,i%2*13);g.rotate(i*.8);beam(g,-17,-2,34,4);g.restore();}g.restore();return;}
  const ready=l.build>=l.required;
  g.rotate(carrying?.15:ready?0:(1-l.build/l.required)*.33);
  g.fillStyle='#1b261c5c';g.fillRect(-80,8,98,22);
  for(const y of [-12,12])beam(g,-78,y,96,4);
  for(let x=-70;x<14;x+=11)beam(g,x,-9,3,22);
  for(const x of [-72,-18,12]){g.fillStyle='#c4b58e';g.fillRect(x,-14,3,7);g.fillRect(x,11,3,7);}
  if(!ready&&!carrying){g.fillStyle='#18251d';g.fillRect(-52,29,66,4);g.fillStyle='#c2ad79';g.fillRect(-52,29,66*l.build/l.required,4);}
  g.restore();
  if(ready){g.fillStyle='#d0be8c';g.globalAlpha=.45+.2*Math.sin(b.time*2);g.beginPath();g.moveTo(127,l.y-5);g.lineTo(118,l.y);g.lineTo(127,l.y+5);g.fill();g.globalAlpha=1;}
}
export function drawSiegeEquipment(g,b){
  for(const l of b.ladders)drawLadder(g,l,b);
  drawRam(g,b);
  for(const h of b.hazards){
    g.save();g.translate(h.x,h.y);
    if(h.warning>0){
      g.strokeStyle='#d2a16b';g.lineWidth=2;g.setLineDash([5,7]);g.beginPath();g.arc(0,0,h.radius,0,Math.PI*2);g.stroke();g.setLineDash([]);
      g.fillStyle='#bf8c4c22';g.fill();
    }else{
      g.fillStyle='#29251c88';g.beginPath();g.ellipse(0,3,h.radius,h.radius*.85,0,0,Math.PI*2);g.fill();
      for(let i=0;i<22;i++){
        const a=i*2.4,r=10+(i%5)*10,x=Math.cos(a)*r,y=Math.sin(a)*r;
        const flicker=9+Math.sin(b.time*11+i*2)*5;
        path(g,[[x-5,y],[x-3,y-flicker],[x+1,y-flicker*1.6],[x+5,y-4],[x+3,y+3]],i%2?'#b97639cc':'#d6a24cdd');
        g.fillStyle='#b8b09c35';g.beginPath();g.ellipse(x+Math.sin(b.time+i)*8,y-18-((b.time*12+i*7)%30),6,11,0,0,Math.PI*2);g.fill();
      }
    }g.restore();
  }
  if(b.defense.repair>0){g.strokeStyle='#adc7ab';g.lineWidth=3;g.beginPath();g.arc(67,480,22,-Math.PI/2,-Math.PI/2+b.defense.repair/12*Math.PI*2);g.stroke();}
}

export function drawSiegeCamp(g){
  for(const [x,y] of [[860,230],[1020,300],[920,700],[1090,760]]){
    g.fillStyle='#17221945';g.beginPath();g.ellipse(x+15,y+28,65,36,0,0,Math.PI*2);g.fill();
    path(g,[[x-44,y+26],[x-28,y-24],[x+27,y-24],[x+47,y+26]],'#a18c67','#514a35');
    path(g,[[x-44,y+26],[x,y-26],[x+47,y+26]],'#c4b38c');
    path(g,[[x-11,y+26],[x,y-14],[x+13,y+26]],'#3d3c2e');
    path(g,[[x-6,y-23],[x+4,y-26],[x+9,y-9],[x-1,y-7]],'#884b3b');
    for(const dx of [-56,58]){g.strokeStyle='#8f8463';g.lineWidth=1.5;g.beginPath();g.moveTo(x+dx,y+37);g.lineTo(x+dx*.48,y-22);g.stroke();beam(g,x+dx,y+33,3,10);}
  }
  for(let i=0;i<9;i++){
    const x=915+(i%3)*19,y=470+Math.floor(i/3)*23;
    g.fillStyle='#594c34';g.fillRect(x,y,15,18);g.strokeStyle='#978056';g.strokeRect(x+1,y+1,13,16);
  }
  for(const y of [240,780]){
    // Interior stair landing corresponds to the permitted descent point.
    g.fillStyle='#343a2d';g.fillRect(-15,y-22,57,44);
    for(let i=0;i<7;i++){g.fillStyle=i%2?'#95937b':'#777b67';g.fillRect(-13+i*7,y-20,6,40);}
  }
}
