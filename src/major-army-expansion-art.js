import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK = '#30352d', STEEL = '#b7c0b0';
function pens(g) {
  const path = pts => { g.beginPath(); pts.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); };
  const line = (c,w,pts) => { path(pts); g.strokeStyle=c; g.lineWidth=w; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
  const poly = (c,pts) => { path(pts); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.55; g.stroke(); };
  const oval = (c,x,y,rx,ry) => { g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fillStyle=c; g.fill(); };
  return { line, poly, oval };
}
export function drawMajorExpansionShield(g,p) {
  if (!['maChirwah','maTallShield'].includes(p.shield)) return false;
  const {line,poly,oval}=pens(g);
  if(p.shield==='maChirwah') {
    oval(INK,0,0,5.3,5.8); oval('#a79265',0,0,4.8,5.3); oval('#514a36',0,0,4.2,4.7);
    for(const x of [-1.7,1.7]) for(const y of [-1.9,1.9]) oval('#b8aa7b',x,y,.75,.75);
    line('#776c4e',.6,[[-3,-1],[-2.7,2],[-1.4,3.4]]);
  } else {
    poly('#6b573b',[[-5,11],[-6,-7],[-4,-12],[0,-13],[4,-12],[6,-7],[5,11],[0,13]]);
    poly('#a78e5c',[[-4.3,10],[-5,-7],[-3.3,-11],[0,-12],[3.3,-11],[5,-7],[4.3,10],[0,11.8]]);
    line('#d0b782',1,[[0,-10],[0,10]]);
    for(const y of [-7,6])line('#685639',1.1,[[-4.5,y],[4.5,y]]);
    oval('#756c4e',0,-1,2,2.4); oval('#b5ab86',.4,-1.4,1.1,1.4);
  }
  return true;
}
export function drawMajorExpansionArmor(g,p) {
  if(p.armor!=='maQuilted')return false;
  const {line,poly}=pens(g);
  poly(p.cloth,[[-5,-23],[4,-23],[7,-18],[4,-16],[5,-8],[7,-2],[1,-2],[0,-5],[-1,-2],[-6,-2],[-4,-9],[-4,-17],[-7,-18]]);
  for(const x of [-3,-1,1,3])line('#736b50',.6,[[x,-21],[x,-11],[x*1.4,-4]]);
  line('#cebd91',.7,[[-4,-22],[0,-20],[4,-22]]);
  line('#5e4832',1.8,[[-4.5,-11],[4.5,-11]]);
  return true;
}
export function drawMajorExpansionWeapon(g,p,action,phase) {
  if(!['maNaginata','maTalwar'].includes(p.weapon))return false;
  const {line,poly,oval}=pens(g), long=p.weapon==='maNaginata';
  const pose=weaponMotion(p.weapon,action,phase,long?.28:.2), hx=8+pose.x,hy=-17+pose.y;
  const arm=pts=>{line(INK,3.3,pts);line(p.cloth,2.6,pts);oval(p.skin,...pts.at(-1),1.15,1.15);};
  arm([[3,-20],[5,-14],[hx,hy]]);
  if(long)arm([[-3,-20],[0,-13],[hx-Math.sin(pose.angle)*6,hy+Math.cos(pose.angle)*6]]);
  else arm([[-3,-20],[-5,-14],[-3,-11]]);
  g.save();g.translate(hx,hy);g.rotate(pose.angle);
  if(long) {
    line('#73573b',1.6,[[0,15],[0,-20]]);
    line('#c1ab79',1.1,[[0,-18],[0,-21]]);
    // Curved cutting blade, visibly distinct from the straight yari point.
    poly(STEEL,[[-.8,-20],[-.9,-26],[-2,-30],[-4,-33],[-1.2,-31.5],[1,-28.5],[1.5,-24],[.8,-20]]);
    line('#e7e5cb',.55,[[.7,-22],[.7,-26],[-.4,-29.5],[-2.8,-32]]);
    line('#343b32',1.9,[[0,13],[0,15]]);
  } else {
    line('#59422f',1.6,[[0,4],[0,-2]]);
    oval('#ab9b66',0,4,2,.65);line('#ab9b66',1.2,[[-2.7,-2],[2.7,-2]]);
    poly(STEEL,[[-.8,-3],[-.7,-12],[-2,-18],[-5,-23],[-1.9,-21],[1,-16],[1.5,-10],[.9,-3]]);
    line('#e8e7cd',.55,[[.5,-4],[.8,-11],[-.5,-17],[-3.8,-22]]);
  }
  g.restore();return true;
}
