import { weaponMotion } from './crown-battle-weapon-motion.js';
// Distinct silhouettes reconstructed from period equipment, not asserted uniforms.
const INK = '#28302d', STEEL = '#9daaa2';
function pens(g) {
  const path = pts => { g.beginPath(); pts.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); };
  const line = (c,w,pts) => { path(pts); g.strokeStyle=c; g.lineWidth=w; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
  const poly = (c,pts) => { path(pts); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.5; g.stroke(); };
  const oval = (c,x,y,rx,ry) => { g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.4; g.stroke(); };
  return { line, poly, oval };
}
function plates(g,x,y,w,h,tall=false) {
  const {line,poly}=pens(g),dy=tall?4:2.2;
  for(let yy=y;yy<y+h;yy+=dy)for(let xx=x;xx<x+w;xx+=2){
    poly(STEEL,[[xx,yy],[xx+1.8,yy],[xx+1.8,yy+dy-.3],[xx,yy+dy-.3]]);
    line('#c6b58d',.4,[[xx+.4,yy+.6],[xx+1.3,yy+1.2]]);
  }
}
export function drawTurkicArmor(g,p) {
  const {line,poly}=pens(g),c=p.cloth;
  if(!['boriLamellar','karakhanidKaftan','karakhanidLamellar'].includes(p.armor))return false;
  poly(c,[[-5,-22],[4,-22],[4,-14],[7,-5],[1,-4],[0,-9],[-2,-4],[-7,-6],[-4,-14]]);
  if(p.armor==='boriLamellar'){
    plates(g,-4,-22,8,12,true); plates(g,-6,-10,6,4,true);plates(g,1,-10,6,4,true);
    plates(g,-7,-22,2,5,true);plates(g,4,-22,2,5,true);
    line(p.trim,1,[[-5,-11],[5,-11]]);
  }else if(p.armor==='karakhanidKaftan'){
    poly('#788983',[[-4,-22],[3,-22],[2,-18],[-2,-17],[-4,-19]]);
    for(let y=-21;y<-18;y+=1)line('#b5c0af',.4,[[-3,y],[2,y]]);
    poly('#ad7855',[[-3,-21],[2,-17],[-1,-12],[-4,-14]]);
    line(p.trim,.7,[[-3,-21],[2,-17],[-1,-12],[1,-6]]);
    line('#493d31',1.6,[[-4,-12],[4,-12]]);
    for(let x=-3;x<4;x+=1.5)line(p.trim,.8,[[x,-12.5],[x,-11.5]]);
    line(p.trim,.8,[[-6,-6],[-2,-5]]);line(p.trim,.8,[[2,-5],[6,-6]]);
  }else{
    plates(g,-4,-21,8,8);
    poly('#9d885d',[[-4,-13],[4,-13],[4,-11],[-4,-11]]);
    line(p.trim,.8,[[0,-11],[3,-5],[6,-6]]);
    line('#383c33',1,[[-3,-22],[4,-14]]);
  }
  return true;
}
export function drawTurkicHead(g,p) {
  if(!['boriSegmented','karakhanidCap','karakhanidCone'].includes(p.head))return false;
  const {line,poly,oval}=pens(g),skin='#be9976';
  oval(skin,0,-24,3.1,3.8);
  poly(skin,[[1,-26],[3,-25],[4,-23.5],[3,-23],[3,-21],[0,-21]]);
  if(p.head==='karakhanidCap'){
    poly('#bda477',[[-4,-26],[-3,-30],[0,-32],[3,-29],[4,-26]]);
    line('#594b35',1.6,[[-4,-26],[3,-26]]);
    line('#e0c48b',.6,[[0,-31],[0,-27]]);
    line('#40392d',1.3,[[-3,-24],[-3,-21],[-1,-20]]);
  }else{
    poly('#687b73',[[-4,-26],[-4,-20],[-2,-18],[-1,-23]]);
    if(p.head==='boriSegmented'){
      poly(STEEL,[[-4,-26],[-3,-30],[0,-33],[3,-30],[4,-26]]);
      for(const x of [-2,0,2])line('#d2c6a0',.5,[[0,-32],[x,-29],[x*1.5,-26]]);
      for(let y=-25;y<-20;y+=1.5)line('#a6afa0',.6,[[-4,y],[-2,y+.7]]);
      line('#3e3629',1.3,[[-4,-22],[-6,-18],[-5,-14]]);
    }else{
      poly(STEEL,[[-4,-26],[-2,-30],[0,-34],[2,-30],[4,-26]]);
      line('#d8d8bc',.6,[[0,-32],[1,-27]]);
      for(let y=-25;y<-19;y+=1.2)line('#bac2b2',.4,[[-4,y],[-2,y]]);
      line('#414034',1.1,[[0,-22],[2,-22]]);
    }
    line(p.trim,.9,[[-4,-26],[4,-26]]);
  }
  line(INK,.55,[[2,-24],[2.7,-24]]);
  return true;
}
export function drawTurkicWeapon(g,p,action,phase) {
  if(p.weapon!=='earlySabre')return false;
  const {line,poly,oval}=pens(g),attack=action==='attack'?Math.sin(phase*Math.PI):0;
  const pose=weaponMotion(p.weapon,action,phase,.25),hx=9+pose.x,hy=-19+pose.y;
  line(INK,3.7,[[3,-19],[7,-15],[hx,hy]]);line(p.cloth,3,[[3,-19],[7,-15],[hx,hy]]);
  oval('#be9976',hx,hy,1.2,1.2);
  g.save();g.translate(hx,hy);g.rotate(pose.angle);
  line('#675138',1.6,[[0,3],[0,-2]]);line('#b79e70',1,[[-2,-2],[2,-2]]);
  poly('#a7b8b0',[[-.8,-3],[-.7,-12],[.7,-19],[2.2,-22],[1.5,-17],[.8,-11],[.8,-3]]);
  line('#e0e4cc',.45,[[.8,-3],[.8,-11],[1.5,-17],[2.2,-22]]);
  g.restore();return true;
}
