import { weaponMotion } from './crown-battle-weapon-motion.js';
// Equipment references and reconstruction limits live alongside the unit data.
const INK='#292c29', SKIN='#bf9977';
function pens(g) {
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.6;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.45;g.stroke();};
  return {line,poly,oval};
}
export function drawMedievalSpecialistArmor(g,p) {
  if(!['lewisAketon','almogavarCoat','soheiRobe'].includes(p.armor))return false;
  const {line,poly}=pens(g);
  if(p.armor==='lewisAketon') {
    poly(p.cloth,[[-5,-22],[5,-22],[6,-12],[7,-1],[2,-.5],[0,-4],[-2,-.5],[-7,-1],[-6,-12]]);
    for(let x=-4;x<=4;x+=2)line('#d2b282',.65,[[x,-20],[x,-12],[x*1.3,-2]]);
    for(let y=-19;y<-2;y+=3)line('#644f36',.6,[[-5,y],[5,y]]);
    line('#564232',1.5,[[-5,-11],[5,-11]]);
  } else if(p.armor==='almogavarCoat') {
    poly(p.cloth,[[-5,-22],[4,-22],[6,-17],[4,-12],[5,-7],[0,-6],[-5,-7],[-4,-12],[-6,-17]]);
    poly('#c7ac83',[[-2,-22],[2,-22],[1,-17]]);
    line('#5e4532',.7,[[-3,-19],[-2,-14],[-3,-8]]);
    line('#d7bc90',.7,[[3,-20],[2,-14],[3,-8]]);
    line('#47382b',1.6,[[-4,-12],[4,-12]]);
    // The large coltell is sheathed at the belt, not a second active attack.
    line(INK,2.8,[[-4,-11],[-7,-2]]);line('#6c4530',1.8,[[-4,-11],[-7,-2]]);
    line('#c1aa80',1.4,[[-3,-14],[-4,-11]]);
    poly('#7c6446',[[2,-12],[5,-12],[6,-8],[2,-8]]);
  } else {
    poly(p.cloth,[[-6,-22],[5,-22],[7,-14],[6,-11],[9,-2],[1,0],[-8,-2],[-6,-11],[-8,-15]]);
    poly('#a8aaa0',[[-2,-22],[2,-22],[3,-13],[-2,-13]]);
    for(let y=-21;y<-13;y+=2)line('#454e48',.65,[[-2,y],[2.5,y]]);
    poly('#444a46',[[-6,-22],[-2,-22],[2,-13],[-2,-11],[-6,-14]]);
    line('#d2d0b8',1.3,[[-5,-12],[5,-12]]);
    for(const x of [-4,0,4])line('#77796b',.7,[[x*.7,-10],[x*1.5,-2]]);
    line('#d7d4bc',1,[[-7,-2],[0,-.5],[8,-2]]);
    line(INK,2.4,[[3,-12],[10,-10]]);line('#867951',.8,[[4,-12],[10,-10]]);
  }
  return true;
}
export function drawMedievalSpecialistHead(g,p) {
  if(!['lewisHelmet','almogavarNet','soheiHood'].includes(p.head))return false;
  const {line,poly,oval}=pens(g);
  if(p.head==='soheiHood')poly('#d9d8c5',[[-5,-28],[-4,-32],[1,-33],[5,-29],[4,-24],[7,-21],[1,-18],[-7,-21],[-4,-25]]);
  oval(SKIN,.3,-25,3,3.8);
  if(p.head==='lewisHelmet') {
    poly('#93978a',[[-4,-27],[-3,-31],[0,-34],[3,-31],[4,-27]]);
    poly('#777f75',[[-4,-27],[-2,-27],[-2,-22],[-4,-21]]);
    line('#d2d0b4',.7,[[0,-33],[0,-28]]);
    line('#c0b997',.9,[[-4,-27],[4,-27]]);
    line('#6d5139',1.1,[[-1,-23],[1,-23],[2,-22.5]]);
  } else if(p.head==='almogavarNet') {
    poly('#5d4935',[[-4,-26],[-4,-29],[-2,-31],[1,-31],[4,-28],[3,-26]]);
    for(let x=-3;x<3;x+=1.5)line('#b49b75',.5,[[x,-29],[x+1.7,-26.5]]);
    for(let x=-2;x<4;x+=1.5)line('#b49b75',.5,[[x,-29],[x-1.5,-26.5]]);
    line('#6b4f36',1,[[-2,-24],[-1,-21],[2,-22]]);
  } else {
    poly('#e9e7d3',[[-4,-28],[-3,-31],[2,-31],[4,-28]]);
    poly('#d9d8c5',[[-4,-28],[-2,-28],[-2,-23],[3,-21],[5,-23],[7,-21],[1,-19],[-5,-22]]);
    line('#8f978c',.6,[[-4,-23],[0,-21],[4,-21]]);
  }
  line(INK,.6,[[1,-25],[2.3,-25]]);return true;
}
export function drawMedievalSpecialistShield(g,p) {
  if(p.shield!=='lewisKite')return false;
  const {line,poly}=pens(g);
  poly('#6d704d',[[-4,-13],[1,-14],[4,-11],[3,0],[0,9],[-3,3],[-5,-8]]);
  line('#cfb384',1,[[-3.5,-12],[1,-13],[3,-10],[2,0],[0,7],[-2,2],[-4,-8],[-3.5,-12]]);
  line('#a29a6e',.7,[[0,-12],[0,6]]);return true;
}
export function drawMedievalSpecialistWeapon(g,p,action,phase) {
  if(!['lewisSword','almogavarSpear','soheiNaginata'].includes(p.weapon))return false;
  const {line,poly,oval}=pens(g),swing=action==='attack'?Math.sin(phase*Math.PI):0;
  const pose=weaponMotion(p.weapon,action,phase,p.weapon==='lewisSword'?.12:.28);
  if(p.weapon==='lewisSword') {
    const hx=9+pose.x,hy=-20+pose.y;line(INK,4,[[3,-20],[7,-17],[hx,hy]]);line(p.cloth,3,[[3,-20],[7,-17],[hx,hy]]);oval(SKIN,hx,hy,1.1,1.1);
    g.save();g.translate(hx,hy);g.rotate(pose.angle);
    line('#69513a',1.8,[[0,2],[0,-2]]);line('#b1ac8d',1.2,[[-3,-2],[3,-2]]);
    poly('#b5c1b9',[[-1,-3],[-.8,-19],[0,-21],[.8,-19],[1,-3]]);
    line('#e9e5cc',.55,[[.4,-4],[.4,-18]]);g.restore();
  } else {
    const sohei=p.weapon==='soheiNaginata',x=7+pose.x,y=-13+pose.y;
    line(INK,4,[[3,-20],[5,-15],[x,y]]);line(p.cloth,3,[[3,-20],[5,-15],[x,y]]);
    if(sohei)poly(p.cloth,[[2,-21],[6,-19],[8,-13],[3,-12],[1,-17]]);
    g.save();g.translate(x,y);g.rotate(pose.angle);
    line(INK,2.2,[[0,17],[0,-23]]);line(sohei?'#635139':'#97764e',1.4,[[0,17],[0,-23]]);
    if(sohei) {
      poly('#bbc8c0',[[0,-21],[-.8,-26],[0,-31],[2,-35],[1.7,-29],[1.7,-25],[1,-21]]);
      line('#e9ead8',.6,[[2,-34],[1,-28],[1,-22]]);
      line('#b9a877',1,[[0,-21],[0,-18]]);
    } else poly('#b9c5bb',[[-1,-23],[-1.5,-27],[0,-32],[1.5,-27],[1,-23]]);
    g.restore();oval(SKIN,x,y,1.2,1.2);
    const sx=x-Math.sin(pose.angle)*4,sy=y+Math.cos(pose.angle)*4;line(p.cloth,2.5,[[-4,-19],[-2,-15],[sx,sy]]);oval(SKIN,sx,sy,1.1,1.1);
  }
  return true;
}
