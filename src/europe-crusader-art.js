import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK='#303931',STEEL='#9caaa4';
function pens(g){
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.55;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();};
  return {line,poly,oval};
}
export function drawEuropeCrusaderShield(g,p){
  if(!['ecPavise','ecHungarianPavise'].includes(p.shield))return false;
  const {poly,line}=pens(g);
  if(p.shield==='ecHungarianPavise') {
    // Rounded shoulders and a broad rib distinguish this equipment adaptation.
    poly('#bea978',[[-8,-12],[-7,-16],[-3,-18],[3,-18],[7,-16],[8,-12],[7,11],[-7,11]]);
    poly(p.shieldColor,[[-6,-12],[-5,-15],[0,-16],[5,-15],[6,-12],[5,9],[-5,9]]);
    poly('#ae9366',[[-2,-16],[1,-16],[2,10],[-2,10]]);
    line('#decfa5',.6,[[-6,-11],[-5,9],[5,9],[6,-11]]);
    return true;
  }
  poly('#bea978',[[-7,-13],[-5,-16],[4,-16],[7,-13],[7,10],[-7,10]]);
  poly(p.shieldColor,[[-5,-12],[-4,-14],[3,-14],[5,-12],[5,8],[-5,8]]);
  // Raised central spine; no unsupported city heraldry.
  poly('#b59c6e',[[-1.3,-15],[.8,-15],[1.4,9],[-1.6,9]]);
  line('#decfa5',.6,[[-6,-12],[-6,9],[6,9]]);
  return true;
}
export function drawEuropeCrusaderArmor(g,p){
  if(!['ecJack','ecLongJack','ecBrigandine','ecChiton'].includes(p.armor))return false;
  const {poly,line,oval}=pens(g),c=p.cloth;
  if(p.armor==='ecChiton'){
    poly(c,[[-4,-22],[2,-22],[5,-19],[4,-12],[7,-4],[-6,-4],[-4,-12]]);
    line('#e0d2ad',.7,[[-4,-21],[1,-18],[3,-21]]);
    for(const x of [-3,0,3])line('#776950',.55,[[x,-10],[x+1,-5]]);
    line('#6b4d30',1.3,[[-4,-12],[4,-12]]);
    if(p.weapon==='ecSling'){poly('#745339',[[3,-11],[7,-11],[8,-7],[4,-6]]);line('#c2a57b',.7,[[4,-10],[7,-10]]);}
    return true;
  }
  const long=p.armor==='ecLongJack',bottom=long?-2:-7;
  poly(c,[[-5,-22],[4,-22],[5,-14],[6,bottom],[1,bottom],[0,bottom-3],[-1,bottom],[-6,bottom],[-5,-14]]);
  for(let x=-3;x<=3;x+=2)line('#6f6755',.55,[[x,-20],[x,bottom-1]]);
  line('#584533',1.3,[[-5,-11],[5,-11]]);
  if(p.armor==='ecBrigandine'){
    poly('#5b655e',[[-4,-21],[4,-21],[4,-13],[-4,-13]]);
    for(let y=-20;y<-13;y+=2)for(let x=-3;x<4;x+=2)oval('#c2bd96',x,y,.35,.35);
    for(const x of [-5,4])poly(STEEL,[[x-1,-21],[x+2,-21],[x+3,-17],[x-1,-17]]);
  }
  return true;
}
export function drawEuropeCrusaderHead(g,p){
  if(!p.head?.startsWith('ec'))return false;
  const {poly,line,oval}=pens(g),skin=p.skin||'#be9976';
  oval(skin,.5,-24,3,3.7);poly(skin,[[2,-25],[4.2,-23.7],[3,-23],[3,-21],[0,-20.5]]);
  if(p.head==='ecKettle'){
    poly('#777e76',[[-4,-27],[-3,-30],[1,-31],[4,-28],[5,-26]]);
    poly(STEEL,[[-7,-26],[-3,-28],[3,-28],[7,-26],[6,-24],[-6,-24]]);
    line('#d5d8bf',.65,[[-5,-26],[5,-26]]);line('#65503a',.65,[[-3,-24],[0,-20],[3,-24]]);
  }else if(p.head==='ecSallet'){
    poly(STEEL,[[-7,-23],[-5,-28],[-3,-31],[1,-32],[4,-30],[5,-25],[3,-23],[0,-25],[-3,-24]]);
    line('#27392f',.9,[[0,-26],[4,-26]]);line('#e0e2cf',.6,[[-3,-30],[1,-31],[3,-29]]);
  }else if(p.head==='ecPilos'){
    // Met 08.2.4: round conical crown with a separate-looking lower band.
    poly('#a68e57',[[-4,-26],[-2.5,-31],[0,-35],[1,-35],[3,-30],[4,-26]]);
    poly('#bca06b',[[-4,-27],[4,-27],[4,-25],[-4,-25]]);
    line('#dbc28b',.6,[[0,-34],[-2,-28]]);
  }else if(p.head==='ecBand'){
    poly('#514336',[[-3,-23],[-4,-27],[-1,-29],[2,-28],[3,-26],[0,-27],[-1,-23]]);
    line('#e1d6b7',1,[[-3,-26],[3,-26]]);line('#b9ac87',.9,[[-3,-26],[-5,-24],[-6,-21]]);
  }else if(p.head==='ecClothCap'){
    poly('#bcae8c',[[-4,-25],[-3,-30],[0,-31],[3,-29],[4,-26],[1,-26],[-2,-25],[-3,-21],[-5,-21]]);
    line('#e0d1ae',.7,[[-3,-28],[0,-29],[2,-28]]);
  }
  oval('#2b342c',2.3,-24,.4,.4);return true;
}
export function drawEuropeCrusaderWeapon(g,p,action,phase){
  if(!p.weapon?.startsWith('ec'))return false;
  const {poly,line,oval}=pens(g),attack=action==='attack',swing=attack?Math.sin(phase*Math.PI):0,skin=p.skin||'#be9976';
  const arm=(x,y,far=false)=>{line(INK,3.5,[[far?-2:3,-19],[far?1:6,-15],[x,y]]);line(p.armor==='ecChiton'?skin:p.armor==='plate'?STEEL:p.cloth,2.8,[[far?-2:3,-19],[far?1:6,-15],[x,y]]);oval(skin,x,y,1.1,1.1);};
  if(['ecCrossbow','ecEarlyCrossbow','ecHungarianCrossbow'].includes(p.weapon)){
    const early=p.weapon==='ecEarlyCrossbow',hungarian=p.weapon==='ecHungarianCrossbow',reload=attack&&phase>.5;
    g.save();g.translate(8,-16);g.rotate(reload?-.6:0);
    line('#493d2a',2.8,[[-6,2],[13,-1]]);line('#b59b67',1.1,[[-6,1.4],[13,-1.6]]);
    if(hungarian) {
      // Plain period-equipment adaptation: shaped tiller and loading stirrup.
      poly('#826342',[[-9,1],[-6,-.5],[4,-1],[4,1],[-5,4],[-9,4]]);
      line(STEEL,1.1,[[14,-3],[18,-4],[21,-2],[21,1],[18,3],[14,1]]);
    }
    line(early?'#8d6d42':STEEL,1.6,[[10,-9],[13,-5],[14,-1],[13,3],[10,7]]);
    line('#d5caab',.5,[[10,-9],[reload?11:3,0],[10,7]]);
    line('#30372e',.7,[[0,0],[11,-1]]);
    if(!reload){line('#c5b27d',.7,[[2,-.5],[17,-1.5]]);poly('#bfc8bb',[[17,-2.4],[20,-1.8],[17,-.8]]);}
    line('#444a3d',.8,[[-1,2],[-1,4],[-3,4]]);g.restore();
    arm(7,-15,true);arm(reload?8:4,reload?-11:-14);
  }else if(p.weapon==='ecSling'){
    const a=attack?phase*Math.PI*3:-.8,hx=8+swing*3,hy=-21-swing*3;
    arm(hx,hy);arm(2,-12,true);
    const px=hx+Math.cos(a)*13,py=hy+Math.sin(a)*13;
    line('#c3af7a',.7,[[hx,hy],[px,py],[hx+1.5,hy+1]]);
    line('#684b31',1.9,[[px-1,py-.5],[px+1,py+.5]]);
    if(!attack||phase<.55)oval('#727c76',px,py,1,.65);
  }else{
    const poll=p.weapon==='ecPollaxe',len=poll?20:30;
    const pose=weaponMotion(p.weapon,action,phase,.25),hx=9+pose.x,hy=-17+pose.y;
    g.save();g.translate(hx,hy);g.rotate(pose.angle);
    line('#493e2b',2,[[0,11],[0,-len]]);line('#ab8d5c',.85,[[-.3,10],[-.3,-len]]);
    if(p.weapon==='ecHalberd'){
      poly(STEEL,[[0,-len-8],[1,-len],[6,-len-3],[5,-len+5],[1,-len+1],[-4,-len],[-1,-len-2]]);
      line('#e5e3cf',.6,[[6,-len-3],[5,-len+5]]);
      line('#7d8f85',1,[[0,-len],[0,-len+10]]);
    }else if(p.weapon==='ecBill'){
      poly(STEEL,[[0,-len-7],[1,-len-1],[4,-len-4],[6,-len-3],[6,-len],[4,-len+1],[4,-len-1],[2,-len+1],[1,-len+6],[-1,-len+5],[-1,-len]]);
      line('#d8dfd0',.6,[[5,-len-3],[5,-len],[2,-len+2]]);
    }else{
      poly(STEEL,[[0,-len-5],[1,-len],[5,-len-2],[6,-len+3],[1,-len+2],[-4,-len+2],[-4,-len],[-1,-len]]);
      line('#e1e4d5',.65,[[5,-len-2],[6,-len+3]]);
    }
    g.restore();arm(hx,hy);arm(hx-Math.sin(pose.angle)*5,hy+Math.cos(pose.angle)*5,true);
  }
  return true;
}
