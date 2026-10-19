import { weaponMotion } from './crown-battle-weapon-motion.js';
// Native canvas details share the existing sprite scale and animation cache.
const INK='#282f2c', STEEL='#b8c4c1', SKIN='#c2a184';
function pens(g){
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.6;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.55;g.stroke();};
  return {line,poly,oval};
}
export function drawItalianEnglishArmor(g,p){
  const {line,poly,oval}=pens(g);
  if(p.armor==='genoeseJack'){
    // Large pavise carried behind the left shoulder; no separate shield bearer.
    poly('#d8cbb0',[[-14,-1],[-14,-23],[-12,-26],[-7,-25],[-5,-22],[-5,-1]]);
    line('#a14136',2,[[-10,-24],[-10,-2]]);line('#a14136',1.6,[[-13,-18],[-6,-18]]);
    line('#aa9a7b',.7,[[-8,-23],[-7,-3]]);
    poly(p.cloth,[[-4,-22],[4,-22],[5,-10],[-5,-10]]);
    for(let x=-3;x<=3;x+=2)line('#6e4036',.6,[[x,-21],[x,-11]]);
    line('#463d31',1.3,[[-5,-12],[5,-12]]);
    return true;
  }
  if(p.armor==='stradiotCoat'){
    poly(p.cloth,[[-4,-22],[4,-22],[5,-15],[7,-4],[2,-3],[0,-9],[-2,-3],[-7,-4],[-5,-15]]);
    line('#dfcda0',1,[[0,-21],[1,-14],[3,-5]]);
    line('#684937',.7,[[-3,-15],[-5,-5]]);line('#684937',.7,[[3,-15],[5,-6]]);
    line('#614b38',1.8,[[-5,-13],[5,-13]]);
    return true;
  }
  if(p.milanese){
    poly(STEEL,[[-4,-22],[3,-22],[5,-18],[4,-14],[-4,-14],[-5,-18]]);
    oval('#cbd3cb',-4,-20,4,3.5);oval('#9facaa',4,-20,2.5,2.6);
    line('#eff0da',.8,[[-2,-21],[0,-20],[2,-17]]);
    for(let y=-13;y<=-10;y+=1.5)poly('#94a6a2',[[-4,y-1],[4,y-1],[5,y+1],[-5,y+1]]);
    for(const x of [-3,3])poly(STEEL,[[x-2,-10],[x+2,-10],[x+1.5,-6],[x-1.5,-6]]);
    return true;
  }
  if(p.armor==='cheshireJack'){
    poly(p.cloth,[[-5,-22],[4,-22],[5,-16],[4,-8],[-4,-8],[-5,-16]]);
    for(let x=-3;x<=3;x+=2)line('#514e3c',.55,[[x,-21],[x,-9]]);
    line('#d2c4a2',.7,[[0,-21],[0,-14]]);
    for(const y of [-19,-17,-15])oval('#d2c4a2',0,y,.35,.35);
    line('#463f32',1.2,[[-4,-12],[4,-12]]);
    return true;
  }
  if(p.armor==='tudorLivery'){
    poly('#e7e1c9',[[-5,-22],[4,-22],[5,-15],[7,-5],[1,-4],[0,-8],[-1,-4],[-7,-5],[-5,-15]]);
    poly(p.cloth,[[0,-22],[4,-22],[5,-15],[7,-5],[1,-4],[0,-8]]);
    line('#bca568',1.1,[[-4,-22],[0,-20],[4,-22]]);
    line('#bca568',.7,[[-6,-6],[-1,-5]]);line('#bca568',.7,[[2,-5],[6,-6]]);
    oval('#b09b5c',0,-17,2.1,2.1);
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;oval('#a33e39',Math.cos(a),-17+Math.sin(a),.8,.8);}
    oval('#d6b768',0,-17,.5,.5);line('#5e5238',1,[[-5,-12],[5,-12]]);
    return true;
  }
  return false;
}
export function drawItalianEnglishHead(g,p){
  if(!['genoeseKettle','stradiotCap','milanArmet','cheshireBascinet','tudorCap'].includes(p.head))return false;
  const {line,poly,oval}=pens(g);
  oval(SKIN,.4,-25,3,3.6);line(INK,.6,[[2,-25],[3,-25]]);
  if(p.head==='genoeseKettle'){
    poly('#a3b0aa',[[-4,-27],[-2,-30],[2,-30],[4,-27]]);
    poly(STEEL,[[-6,-27],[-3,-28],[3,-28],[6,-27],[4,-26],[-4,-26]]);
    line('#5e5849',.65,[[-2,-26],[-1,-22],[2,-23]]);
  }else if(p.head==='stradiotCap'){
    poly('#725a43',[[-3,-28],[-2,-31],[0,-34],[2,-30],[3,-27]]);
    line('#b69f75',1.4,[[-3,-27],[3,-27]]);
    poly('#4d3f31',[[-2,-24],[0,-23],[3,-24],[2,-20],[-1,-21]]);
  }else if(p.head==='milanArmet'){
    oval(STEEL,0,-26,3.7,4);poly('#a7b6b1',[[0,-29],[3,-28],[4.8,-25],[3,-23],[0,-22],[-2,-24]]);
    line(INK,.65,[[1,-26.5],[4,-26]]);line('#70847d',.6,[[-1,-28],[-1,-24],[2,-23]]);
    for(const y of [-25,-24])line('#586e65',.5,[[2,y],[3,y]]);
    oval('#d2d9cd',-1,-26,.6,.6);poly('#929f96',[[-3,-23],[2,-22],[3,-20],[-4,-21]]);
  }else if(p.head==='cheshireBascinet'){
    poly('#97a59d',[[-4,-24],[-3,-29],[0,-32],[3,-29],[3,-27],[0,-27],[-1,-24]]);
    line('#d2d8ca',.7,[[0,-31],[1,-28]]);
    poly('#737e75',[[-4,-25],[-2,-24],[-2,-21],[2,-21],[3,-19],[-5,-20]]);
    for(const y of [-23,-21])line('#a5ada0',.5,[[-4,y],[-2,y]]);
  }else{
    oval('#423f32',0,-29,4.8,1.8);line('#a79a72',.7,[[-3,-28],[3,-28]]);
    line('#604b38',1,[[-3,-26],[-3,-23]]);
  }
  return true;
}
export function drawItalianEnglishWeapon(g,p,action,phase){
  if(!['genoeseCrossbow','tudorHalberd'].includes(p.weapon))return false;
  const {line,poly,oval}=pens(g),swing=action==='attack'?Math.sin(phase*Math.PI):0;
  if(p.weapon==='genoeseCrossbow'){
    line(p.cloth,3,[[-4,-19],[1,-15],[8,-16]]);line(p.cloth,3,[[4,-19],[8,-13],[16,-17]]);
    const pull=action==='attack'&&phase<.5?3:0;
    poly('#83613e',[[4,-17],[22,-20],[23,-18],[4,-15]]);
    line('#c0ab7c',1.6,[[16,-26],[21,-23],[24,-19],[26,-14]]);
    line('#ded0a6',.5,[[16,-26],[14-pull,-18],[26,-14]]);
    line('#d7d0b5',.7,[[10,-18],[25,-20]]);
    line('#808e83',.9,[[24,-21],[28,-21],[29,-18],[26,-17]]);
    oval(SKIN,8,-16,1.3,1.3);oval(SKIN,16,-17,1.3,1.3);
  }else{
    const pose=weaponMotion(p.weapon,action,phase,-.15),angle=pose.angle;
    const hand=y=>[10+pose.x-Math.sin(angle)*y,-15+pose.y+Math.cos(angle)*y];
    line(p.cloth,3,[[-4,-19],[1,-15],hand(1)]);
    line(p.cloth,3,[[4,-19],[7,-11],hand(6)]);
    g.save();g.translate(10+pose.x,-15+pose.y);g.rotate(angle);
    line('#82623d',1.5,[[0,17],[0,-22]]);
    poly(STEEL,[[0,-28],[-1,-22],[1,-22]]);
    poly(STEEL,[[0,-22],[4,-24],[5,-18],[1,-17],[0,-19]]);
    poly('#9caaa3',[[0,-22],[-4,-20],[0,-19]]);
    line('#7f9186',.7,[[0,-22],[0,-15]]);
    oval(SKIN,0,1,1.3,1.3);oval(SKIN,0,6,1.3,1.3);g.restore();
  }
  return true;
}
