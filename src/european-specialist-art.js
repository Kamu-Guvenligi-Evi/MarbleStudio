import { weaponMotion } from './crown-battle-weapon-motion.js';
// Equipment silhouettes are drawn into the existing cached sprite sheets.
const INK='#30332e', SKIN='#bd9978';
function pens(g) {
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.6;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.45;g.stroke();};
  return {line,poly,oval};
}
function mail(g,x,y,w,h) {
  const {line}=pens(g);
  for(let yy=y;yy<y+h;yy+=1.6)for(let xx=x;xx<x+w;xx+=1.8)line('#b4b8a9',.45,[[xx,yy],[xx+.5,yy+.6],[xx+1,yy]]);
}
export function drawEuropeanSpecialistArmor(g,p) {
  if(!['welshLiveryJack','hussarMailCoat','hussitePaddedCoat'].includes(p.armor))return false;
  const {line,poly,oval}=pens(g);
  if(p.armor==='welshLiveryJack') {
    poly('#d3c9a8',[[-6,-22],[6,-22],[7,-17],[5,-15],[5,-6],[-5,-6],[-5,-15],[-7,-17]]);
    for(let x=-5;x<6;x+=2)line('#a89e81',.6,[[x,-21],[x,-7]]);
    poly('#55745a',[[-4,-22],[0,-22],[0,-5],[-5,-5],[-4,-13]]);
    poly('#e0d9bd',[[0,-22],[4,-22],[4,-13],[5,-5],[0,-5]]);
    // Hood resting around the shoulders; no fictitious coat of arms.
    poly('#4c6952',[[-3,-23],[3,-23],[6,-20],[3,-18],[-4,-19],[-6,-20]]);
    line('#c0b798',.6,[[-2,-22],[0,-20],[3,-22]]);
    line('#784633',1.4,[[-5,-11],[5,-11]]);
    line('#c7ae77',.7,[[-1,-11],[1,-11]]);
    // Small buckler hangs at the belt, leaving both hands free for the bow.
    line('#784633',.8,[[-4,-11],[-5,-8]]);oval('#9ca69f',-5,-5.7,3.2,3.4);
    oval('#c9cabc',-5,-5.7,2.55,2.75);oval('#78877f',-5,-5.7,1.3,1.45);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;line('#626e65',.5,[[-5+Math.cos(a)*1.8,-5.7+Math.sin(a)*1.9],[-5+Math.cos(a)*2.3,-5.7+Math.sin(a)*2.4]]);}
    poly('#bdb397',[[-7,-9],[-9,-7],[-8,0],[-5,-1],[-4,-8]]); // belt arrow bag
    for(let x=-8;x<-5;x++)line('#b4a074',.55,[[x,-5],[x-1,-15]]);
  } else if(p.armor==='hussarMailCoat') {
    poly('#78827a',[[-5,-22],[5,-22],[6,-15],[5,-11],[7,-2],[2,-1],[0,-7],[-2,-1],[-7,-2],[-5,-11],[-6,-15]]);
    mail(g,-4.5,-21,9,10);mail(g,-5,-9,10,6);
    line('#b0b29d',.7,[[-5,-22],[5,-22]]);
    line('#9b4a38',2,[[-5,-11],[5,-11]]);
    line('#b99d69',.8,[[-1,-11],[1,-11]]);
    // Sheathed secondary sabre. The primary attack remains a lance.
    line('#4d4032',2,[[-4,-10],[-7,-4],[-7,2]]);
    line('#c4a56e',.8,[[-5,-9],[-7,-10]]);
  } else {
    poly(p.cloth,[[-5,-22],[5,-22],[6,-15],[5,-10],[6,-3],[1,-2],[0,-7],[-1,-2],[-6,-3],[-5,-10],[-6,-15]]);
    for(let y=-19;y<-3;y+=3)line('#b1a17d',.6,[[-4,y],[4,y]]);
    for(let x=-3;x<4;x+=3)line('#6b6049',.6,[[x,-21],[x,-12],[x*1.4,-4]]);
    line('#d0c2a0',.9,[[0,-21],[0,-12]]);
    for(let y=-19;y<-12;y+=2)line('#4c4837',.7,[[-.7,y],[.7,y]]);
    line('#534736',1.5,[[-5,-11],[5,-11]]);
    poly('#675340',[[-5,-10],[-7,-8],[-7,-4],[-4,-3],[-3,-8]]);
  }
  return true;
}
export function drawEuropeanSpecialistHead(g,p) {
  if(!['welshCoifHelmet','earlyHussarHelmet','hussiteFeltCap'].includes(p.head))return false;
  const {line,poly,oval}=pens(g);
  if(p.head==='welshCoifHelmet') {
    poly('#d9d2b9',[[-4,-28],[4,-28],[4,-24],[2,-22],[-3,-22],[-4,-25]]);
    oval(SKIN,.5,-25.2,2.5,3);
    poly('#8f9b92',[[-4,-28],[-3,-31],[0,-33],[3,-31],[4,-28]]);
    line('#d3d6bf',.65,[[0,-32],[2,-30]]);line('#c4c5af',.7,[[-4,-28],[4,-28]]);
    line('#e6dfc6',.8,[[-2,-24],[0,-22],[2,-23]]);
  } else if(p.head==='earlyHussarHelmet') {
    poly('#7a857d',[[-4,-29],[4,-29],[4,-24],[6,-21],[-5,-21],[-4,-25]]);mail(g,-4,-27,8,6);
    oval(SKIN,.8,-25.2,2.6,3.1);
    poly('#939d91',[[-4,-28],[-3,-32],[0,-36],[3,-32],[4,-28]]);
    line('#d5d4bb',.7,[[0,-35],[1.5,-31],[2,-29]]);
    line('#c1aa74',.9,[[-4,-28],[4,-28]]);
    line('#a9b2a2',.8,[[1,-28],[1,-24]]);
    line('#584537',.65,[[-.3,-23],[1,-23.3],[2.4,-23]]);
  } else {
    oval(SKIN,.3,-25,2.9,3.4);
    poly('#574b3a',[[-4,-27],[-4,-30],[-1,-32],[3,-31],[4,-28],[3,-27]]);
    line('#9b8763',1,[[-4,-28],[3.7,-28]]);
    line('#9b8763',.6,[[-2,-31],[1,-30]]);
    poly('#755740',[[-2,-24],[-1,-22],[1,-21.5],[2,-23],[0,-22.5]]);
  }
  line(INK,.6,[[1,-25.2],[2.2,-25.2]]);return true;
}
export function drawEuropeanSpecialistShield(g,p) {
  if(p.shield!=='hungarianWingShield')return false;
  const {line,poly}=pens(g);
  // Raised rear edge protects the rider's neck; the front stays below the face.
  poly('#a74231',[[-5,-21],[-1,-13],[4,-8],[5,5],[3,8],[-3,9],[-5,6],[-6,-5]]);
  poly('#cbb98b',[[-5,-21],[-1,-13],[3,-9],[-2,-11],[-4,-9]]);
  line('#40372d',1.4,[[1,-8],[0,5],[-1,7]]);
  line('#dbbc82',.55,[[2,-8],[1,5],[0,7]]);
  line('#e0bf80',.65,[[-5,-19],[-4,5],[-3,7],[2,7],[4,5]]);
  for(let y=-16;y<5;y+=3)line('#6d3b2b',.6,[[-4.9,y],[-4.1,y+1]]);
  return true;
}
export function drawEuropeanSpecialistWeapon(g,p,action,phase) {
  if(p.weapon!=='warFlail')return false;
  const {line,poly,oval}=pens(g),swing=action==='attack'?Math.sin(phase*Math.PI):0;
  const pose=weaponMotion(p.weapon,action,phase,.08),angle=pose.angle;
  // The hands rotate with one rigid handle. Only the short hinged beater articulates.
  const grip=(y)=>[7+pose.x-Math.sin(angle)*y,-15+pose.y+Math.cos(angle)*y];
  const a=grip(-3),b=grip(4);
  for(const [shoulder,elbow,hand] of [[[-3,-20],[0,-14],b],[[3,-20],[6,-17],a]]){
    line(INK,3.5,[shoulder,elbow,hand]);line(p.cloth,2.8,[shoulder,elbow,hand]);
  }
  g.save();g.translate(7+pose.x,-15+pose.y);g.rotate(angle);
  line(INK,2.3,[[0,13],[0,-23]]);line('#9d7e4c',1.4,[[0,13],[0,-23]]);
  line('#4b4f46',1.2,[[0,-20],[0,-23]]);
  g.translate(0,-23);g.rotate(-.42-swing*1.15);
  // Two small links connect the wooden beater to the handle.
  oval('#91978a',0,1.1,.7,1.1);oval('#626e62',0,2.5,.7,1);
  poly('#80653f',[[-1.3,3],[1.3,3],[1.6,13],[-1.6,13]]);
  for(const x of [-1,0,1])line('#51594d',.65,[[x,3.5],[x,12.5]]);
  for(const y of [4,8,12]){
    line('#9a9e8c',1.3,[[-1.5,y],[1.5,y]]);
    poly('#747e70',[[1.5,y-.5],[3,y],[1.5,y+.5]]);
  }
  g.restore();oval(SKIN,...a,1.1,1.1);oval(SKIN,...b,1.1,1.1);
  return true;
}
