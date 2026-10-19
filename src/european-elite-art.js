import { weaponMotion } from './crown-battle-weapon-motion.js';
// Small native canvas details shared by selection cards and combat sprites.
const INK='#242b29', STEEL='#b8c3c3';
function pens(g) {
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.6;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.6;g.stroke();};
  return {line,poly,oval};
}
export function drawEuropeanArmor(g,p) {
  const {line,poly,oval}=pens(g);
  if(p.armor==='landsknechtBreastplate'){
    for(const x of [-5,5]){oval(p.cloth,x,-19,3,3.5);for(const dx of [-1,1])line(p.secondary,1,[[x+dx,-21],[x+dx,-17]]);}
    poly(STEEL,[[-3,-22],[3,-22],[4,-17],[2.8,-13],[-3,-13],[-4,-17]]);
    line('#e0e7db',.8,[[0,-21],[1,-15]]);
    for(const y of [-12,-10])poly('#8f9d99',[[-3,y-1],[3,y-1],[4,y+1],[-4,y+1]]);
    for(const x of [-3,3]){oval(p.cloth,x,-7,2.5,3);line(p.secondary,1,[[x,-9],[x,-5]]);}
    return true;
  }
  if(p.armor==='guardCoat'){
    poly(p.cloth,[[-5,-22],[4,-22],[5,-16],[4,-12],[6,-5],[1,-4],[0,-8],[-1,-4],[-6,-5],[-4,-13]]);
    // Pale livery with a red cross; illustrative, not a universal uniform.
    line('#993d36',1.5,[[0,-21],[0,-13]]);line('#993d36',1.5,[[-3,-18],[3,-18]]);
    line('#554b38',1.2,[[-4,-12],[4,-12]]);oval('#b99c65',0,-12,.7,.7);
    line('#a49a82',.55,[[-3,-10],[-4,-6]]);line('#a49a82',.55,[[3,-10],[4,-6]]);
    return true;
  }
  return false;
}
export function drawEuropeanHead(g,p) {
  if(!['frenchArmet','frenchKettle'].includes(p.head))return false;
  const {line,poly,oval}=pens(g);
  if(p.head==='frenchArmet'){
    poly('#81928f',[[-3,-25],[3,-25],[4,-21],[-4,-21]]);
    oval(STEEL,0,-26,3.8,4.2);
    poly('#bfcac7',[[0,-29],[3,-28],[5,-25],[2,-24],[3,-22],[-1,-22],[-2,-25]]);
    line(INK,.7,[[1,-26.5],[4,-26]]);line('#5e706e',.55,[[0,-28],[0,-23]]);
    oval('#697e7b',-1,-25,.6,.6);
  }else{
    oval('#c2a184',.5,-24,3,3.6);line(INK,.6,[[2,-24],[3,-24]]);
    poly('#8d9b99',[[-4,-27],[-2,-30],[2,-30],[4,-27]]);
    poly(STEEL,[[-6,-26.5],[-3,-28],[3,-28],[6,-26.5],[2,-25.6],[-4,-25.8]]);
    line('#665a44',.6,[[-2,-25],[-1,-21],[2,-22]]);
  }
  return true;
}
export function drawEuropeanWeapon(g,p,action,phase) {
  if(p.weapon!=='zweihander')return false;
  const {line,poly,oval}=pens(g),attack=action==='attack'?Math.sin(phase*Math.PI):0;
  const pose=weaponMotion(p.weapon,action,phase,.3),hx=9+pose.x,hy=-16+pose.y,grip=y=>[hx-Math.sin(pose.angle)*y,hy+Math.cos(pose.angle)*y];
  line(p.cloth,3,[[-4,-19],[1,-15],grip(-1)]);line(p.secondary,3,[[4,-19],[6,-13],grip(1.6)]);
  g.save();g.translate(hx,hy);g.rotate(pose.angle);
  line('#67513b',1.4,[[0,3],[0,-3]]);oval('#b7b1a2',0,3.5,1,1);
  line(STEEL,.95,[[-4,-3],[0,-3.7],[4,-3]]);
  poly(STEEL,[[-.9,-4],[-.8,-22],[0,-25],[.8,-22],[.9,-4]]);
  line('#697973',.5,[[0,-7],[0,-23]]);
  line(STEEL,1,[[-2,-8],[-1,-7],[1,-7],[2,-8]]);
  oval('#c2a184',0,-1,1.3,1.3);oval('#c2a184',0,1.6,1.2,1.2);g.restore();return true;
}
