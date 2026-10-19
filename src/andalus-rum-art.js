import { weaponMotion } from './crown-battle-weapon-motion.js';
// Period objects guide the silhouettes, not a claim of fixed guard uniforms.
const INK = '#302e29', SKIN = '#c19c7b';
function pens(g) {
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.6;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.45;g.stroke();};
  return {line,poly,oval};
}
export function drawAndalusRumArmor(g,p) {
  if(!['rumReliefArmor','cordobaTunic'].includes(p.armor))return false;
  const {line,poly,oval}=pens(g);
  if(p.armor==='rumReliefArmor') {
    poly(p.cloth,[[-5,-22],[5,-22],[6,-12],[7,-5],[2,-3],[0,-7],[-2,-3],[-7,-5],[-6,-12]]);
    poly('#84928c',[[-5,-22],[5,-22],[6,-12],[5,-9],[-5,-9],[-6,-12]]);
    // Vertical panel rhythm seen on Konya inv. 2540; material is uncertain.
    for(let y=-21;y<-9;y+=3)for(let x=-4.5;x<5;x+=1.8){
      line('#465852',.65,[[x,y],[x,y+2]]);line('#c8cbbb',.5,[[x+.7,y],[x+.7,y+2]]);
    }
    for(let x=-5;x<6;x+=2)line('#a9b6a5',.7,[[x,-8],[x*1.15,-4.5]]);
    line('#6a4c31',1.7,[[-5,-11],[5,-11]]);oval('#c1a46c',0,-11,1,.8);
    // Visible scabbard balances the shield on the other side.
    line(INK,2.3,[[5,-11],[8,-1]]);line('#70573d',1.5,[[5,-11],[8,-1]]);
  } else {
    poly(p.cloth,[[-5,-22],[5,-22],[6,-15],[4,-12],[7,-5],[3,-3],[-3,-3],[-7,-5],[-4,-12],[-6,-15]]);
    line('#e3cf9d',1,[[-4,-21],[4,-21]]);
    for(let x=-3;x<4;x+=2)line('#d9bc87',.65,[[x,-20],[x,-13]]);
    for(let x=-4;x<=4;x+=2)line('#765a3d',.65,[[x*.65,-11],[x*1.3,-4.5]]);
    line('#e0c798',1,[[-6,-5],[-2,-3.8],[2,-3.8],[6,-5]]);
    line('#574330',1.5,[[-4.5,-12],[4.5,-12]]);oval('#b9a16b',1,-12,1,.7);
  }
  return true;
}
export function drawAndalusRumHead(g,p) {
  if(!['rumPointHelmet','cordobaCap'].includes(p.head))return false;
  const {line,poly,oval}=pens(g);
  oval(SKIN,.4,-25,3,3.8);
  if(p.head==='rumPointHelmet') {
    poly('#78877f',[[-4,-27],[-2,-26],[-2,-22],[-4,-21],[-5,-23]]);
    for(let x=-4;x<-1;x+=1)line('#c0c5b2',.5,[[x,-26],[x,-22.5]]);
    poly('#9ba9a0',[[-4,-27],[-3,-30],[0,-34],[3,-30],[4,-27]]);
    line('#e2debd',.7,[[0,-33],[0,-28]]);line('#5b6a62',1,[[-4,-27],[4,-27]]);
    line('#d4d5bb',.8,[[3,-28],[3,-25.5]]);
  } else {
    poly('#6f4936',[[-3.5,-26],[-4,-28],[-2,-30],[1,-30.5],[3,-29],[4,-27],[1,-27]]);
    line('#c5a478',.75,[[-3,-28],[3,-28]]);
    line('#5a4030',1,[[-2,-26],[-2,-23]]);
    line('#5a4030',.7,[[0,-23],[2,-23]]);
  }
  line(INK,.55,[[1.6,-25],[2.5,-25]]);
  return true;
}
export function drawAndalusRumShield(g,p) {
  if(!['rumReliefShield','cordobaRound'].includes(p.shield))return false;
  const {line,poly,oval}=pens(g);
  if(p.shield==='rumReliefShield') {
    poly('#8b7660',[[-3,-6],[2,-6],[4,-3],[3,2],[0,7],[-3,5],[-5,1],[-5,-3]]);
    line('#c5b48e',1,[[-3,-5],[1.5,-5],[3,-2],[2,2],[0,5],[-2,4],[-4,0],[-4,-3],[-3,-5]]);
    oval('#afa68c',-.5,-.5,1.5,2);
  } else {
    oval('#d2bc87',0,0,5.8,6.2);oval('#886b45',0,0,5.1,5.5);
    oval('#b39963',0,0,4.4,4.8);oval('#877c62',0,0,1.5,1.7);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;oval('#dac798',Math.cos(a)*4.7,Math.sin(a)*5.1,.3,.3);}
  }
  return true;
}
export function drawAndalusRumWeapon(g,p,action,phase) {
  if(!['rumSword','cordobaSword'].includes(p.weapon))return false;
  const {line,poly,oval}=pens(g),rum=p.weapon==='rumSword';
  const pose=weaponMotion(p.weapon,action,phase,rum?.1:.4),hx=9+pose.x,hy=-19+pose.y;
  const swing=action==='attack'?Math.sin(phase*Math.PI):0;
  line(INK,3.7,[[3,-20],[7,-16],[hx,hy]]);
  line(rum?'#89958b':p.cloth,3,[[3,-20],[7,-16],[hx,hy]]);
  if(rum)for(let i=0;i<4;i++)line('#d0d1b8',.55,[[3.6+i,-19.8+i*.65],[3.2+i,-18.6+i*.65]]);
  oval(SKIN,hx,hy,1.2,1.2);
  g.save();g.translate(hx,hy);g.rotate(pose.angle);
  line('#6a4731',1.5,[[0,3],[0,-2]]);oval('#b5ae8c',0,3.7,1.1,.8);
  line('#bab79c',1.2,[[-3,-2],[3,-2]]);
  poly('#b4c4bb',[[-1,-3],[-.9,-20],[0,-22],[.9,-20],[1,-3]]);
  line('#f0edcc',.55,[[.6,-4],[.5,-19],[0,-21]]);
  g.restore();return true;
}
