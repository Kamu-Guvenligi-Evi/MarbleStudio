import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK = '#30332b', BRONZE = '#b49a5e';
function pens(g) {
  const path = pts => { g.beginPath(); pts.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); };
  const line = (c,w,pts) => { path(pts); g.strokeStyle=c; g.lineWidth=w; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
  const poly = (c,pts) => { path(pts); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.55; g.stroke(); };
  const oval = (c,x,y,rx,ry) => { g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fillStyle=c; g.fill(); };
  return { line, poly, oval };
}
export function drawReliefGapShield(g,p) {
  if(!p.shield?.startsWith('rrg')) return false;
  const {line,poly,oval}=pens(g);
  if(p.shield==='rrgAssyrianRound') {
    oval(INK,0,0,7.8,8); oval('#b1a179',0,0,7.2,7.4); oval('#75694e',0,0,5.9,6.1);
    for(let y=-4;y<=4;y+=2) line('#b8a478',.6,[[-5,y],[5,y]]);
    oval(BRONZE,0,0,1.6,1.6);
  } else if(p.shield==='rrgKhmerShield') {
    poly('#77583c',[[-4,-10],[3,-9],[5,-5],[5,8],[1,10],[-4,8],[-5,-5]]);
    line('#bd9b62',1,[[-3,-8],[-3,7],[1,8],[3,6],[3,-7]]);
    line('#594531',1.1,[[0,-7],[0,7]]);
  } else {
    for(let y=-8;y<=8;y+=2) {
      line(y%4===0?'#d5bc75':'#799a81',1.8,[[-5,y],[-7,y+1]]);
      line(y%4===0?'#d5bc75':'#799a81',1.8,[[5,y],[7,y+1]]);
    }
    poly('#9d7250',[[-5,-9],[5,-9],[5,9],[-5,9]]);
    poly('#68999a',[[-3,-7],[3,-7],[3,7],[-3,7]]);
    line('#d4bd8b',.8,[[-3,0],[3,0]]);
  }
  return true;
}
export function drawReliefGapArmor(g,p) {
  if(!p.armor?.startsWith('rrg')) return false;
  const {line,poly,oval}=pens(g), skin=p.skin||'#b68c65', c=p.cloth;
  if(p.armor==='rrgCrossStraps') {
    poly(c,[[-5,-23],[4,-23],[5,-13],[6,-4],[-6,-4],[-4,-13]]);
    line('#72563c',1.8,[[-4,-22],[4,-13]]); line('#72563c',1.8,[[4,-22],[-4,-13]]);
    oval(BRONZE,0,-18,1,1); line('#77593c',1.4,[[-4,-12],[4,-12]]);
    for(let x=-4;x<=4;x+=2) line('#e4cf9b',.7,[[x,-10],[x,-5]]);
    line('#8e7050',1,[[-6,-4],[6,-4]]);
  } else if(p.armor==='rrgScaleCoat') {
    poly(c,[[-5,-23],[5,-23],[5,-13],[7,-4],[2,-3],[0,-7],[-2,-3],[-7,-4],[-5,-13]]);
    poly('#827a5d',[[-5,-23],[5,-23],[5,-12],[-5,-12]]);
    for(let y=-21;y<-12;y+=2.5) for(let x=-3;x<=3;x+=2.5) {
      poly('#aba078',[[x-1,y-1],[x+1,y-1],[x+1,y],[x,y+1.3],[x-1,y]]);
    }
    line('#d5bb7e',1,[[-5,-12],[5,-12]]);
    for(let x=-5;x<=5;x+=2) line('#d2a777',.7,[[x,-6],[x,-3]]);
  } else if(p.armor==='rrgSampot') {
    poly(skin,[[-4,-23],[3,-23],[5,-19],[3,-12],[-3,-12],[-5,-19]]);
    line('#835b3b',.6,[[-3,-19],[0,-18],[3,-19]]);
    poly(c,[[-4,-12],[4,-12],[6,-5],[1,-3],[-1,-6],[-4,-3],[-6,-6]]);
    poly('#d7b471',[[-3,-12],[2,-11],[3,-5],[1,-4],[-1,-10]]);
    line('#63472f',1,[[-4,-12],[4,-12]]);
  } else if(p.armor==='rrgQuiltedSuit') {
    poly(c,[[-5,-23],[4,-23],[6,-18],[4,-12],[5,-5],[-5,-5],[-4,-13],[-6,-18]]);
    for(let y=-21;y<-5;y+=3) line('#b1c3ad',.5,[[-4,y],[4,y]]);
    for(let x=-3;x<=3;x+=2) line('#386971',.5,[[x,-22],[x,-6]]);
    line('#b45c42',2,[[-4,-12],[4,-12]]);
    poly('#b45c42',[[-2,-12],[2,-12],[3,-2],[-2,-3]]);
  } else {
    poly(c,[[-6,-23],[5,-23],[6,-6],[-6,-6]]);
    poly('#56483a',[[-2,-23],[2,-23],[0,-19]]);
    line('#915b43',2,[[-5,-9],[5,-9]]);
    for(let x=-4;x<=4;x+=2) poly('#d8bc7d',[[x,-10],[x+1,-9],[x,-8],[x-1,-9]]);
    line('#d5c093',.7,[[-5,-6],[5,-6]]);
  }
  return true;
}
export function drawReliefGapHead(g,p) {
  if(!p.head?.startsWith('rrg')) return false;
  const {line,poly,oval}=pens(g),skin=p.skin||'#b68c65';
  oval(skin,.5,-24,3,3.5); poly(skin,[[2,-25],[4,-23.5],[3,-23],[3,-21],[0,-20.5]]);
  if(p.head==='rrgCrestHelmet'||p.head==='rrgPointedHelmet') {
    const crest=p.head==='rrgCrestHelmet';
    poly('#9e9473',[[-5,-26],[-4,-30],[0,crest?-32:-36],[3,-30],[4,-26]]);
    line('#d1c08a',.8,[[-4,-26],[4,-26]]);
    if(crest) poly('#714d39',[[-5,-27],[-6,-31],[-4,-35],[0,-35],[2,-33],[-2,-32],[-4,-29]]);
    poly('#3f342a',[[-3,-24],[-1,-22],[2,-22],[3,-20],[0,-17],[-3,-20]]);
    for(let y=-21;y<=-18;y+=1.3) line('#776147',.6,[[-2,y],[1,y]]);
  } else if(p.head==='rrgTiedHair') {
    poly('#39342b',[[-4,-23],[-5,-28],[-2,-31],[2,-29],[3,-26],[-1,-27],[-2,-23]]);
    oval('#39342b',-2,-32,2,2.6); line('#cfad6d',.8,[[-4,-30],[0,-30]]);
  } else if(p.head==='rrgConicalCap') {
    poly('#8b7953',[[-5,-27],[0,-36],[5,-27]]);
    line('#d1b67c',1.4,[[-5,-27],[5,-27]]);
    oval('#d1b67c',-3,-24,1.5,1.8); oval('#715d40',-3,-24,.65,.9);
  } else {
    poly('#3d342c',[[-4,-23],[-4,-28],[-1,-30],[2,-29],[3,-26],[-2,-26],[-2,-22]]);
    line('#ac5441',1.8,[[-4,-27],[3,-27]]);
    line('#d1ac69',.6,[[-4,-27],[3,-27]]);
    line('#ac5441',1.4,[[-4,-27],[-6,-24],[-5,-20]]);
  }
  oval(INK,2.5,-24,.4,.4); return true;
}
export function drawReliefGapWeapon(g,p,action,phase) {
  if(!p.weapon?.startsWith('rrg')) return false;
  const {line,poly,oval}=pens(g),skin=p.skin||'#b68c65';
  const pose=weaponMotion(p.weapon,action,phase,.22),hx=7+pose.x,hy=-17+pose.y;
  g.save(); g.translate(hx,hy); g.rotate(pose.angle);
  if(p.weapon==='rrgBronzeAxe') {
    // One-sided curved edge and raised bindings follow Met 1987.394.401.
    line(BRONZE,2.4,[[0,4],[0,-20]]);
    poly(BRONZE,[[0,-16],[3,-17],[2,-20],[6,-18],[9,-15],[9,-12],[7,-9],[3,-7],[4,-11],[0,-12]]);
    line('#e0c38b',.7,[[6,-18],[8,-15],[8,-12],[6,-9]]);
    for(const y of [-17,-16,-15,-2,0,2,4]) line('#776844',.7,[[-1,y],[1,y-.5]]);
  } else {
    line('#8b6842',1.4,[[0,11],[0,-27]]);
    const stone=p.weapon==='rrgStoneSpear';
    poly(stone?'#787a6a':'#a4afa4',[[-1.5,-27],[0,-33],[1.5,-27],[0,-26]]);
    if(stone) { line('#d1b681',.7,[[-1,-26],[1,-25],[-1,-24],[1,-23]]); line('#b4b6a4',.5,[[0,-31],[0,-27]]); }
  }
  g.restore();
  const arm=pts=>{line(INK,3.2,pts);line(p.armor==='rrgQuiltedSuit'?p.cloth:skin,2.3,pts);const[x,y]=pts.at(-1);oval(skin,x,y,1.1,1.1);};
  arm([[3,-20],[5,-14],[hx,hy]]); arm([[-3,-20],[-5,-14],[-6,-13]]);
  return true;
}
