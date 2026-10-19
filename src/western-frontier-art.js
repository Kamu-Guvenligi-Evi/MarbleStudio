import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK = '#30312c', STEEL = '#afb5af';
function pens(g) {
  const path = pts => { g.beginPath(); pts.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); };
  const line = (c,w,pts) => { path(pts); g.strokeStyle=c; g.lineWidth=w; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
  const poly = (c,pts) => { path(pts); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.55; g.stroke(); };
  const oval = (c,x,y,rx,ry) => { g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fillStyle=c; g.fill(); };
  return { line,poly,oval };
}
export function drawWesternShield(g,p) {
  if(!p.shield?.startsWith('wf')) return false;
  const {line,oval}=pens(g), metal=p.shield==='wfRodela', small=p.shield==='wfSmallShield', r=small?6.4:metal?8:9;
  oval(INK,0,0,r+.6,r+.6); oval(metal?STEEL:'#98784d',0,0,r,r);
  if(metal) {
    oval('#737e7c',-.6,.8,r-1,r-1); oval('#a6afab',.6,-.4,r-2,r-2);
    for(let a=0;a<Math.PI*2;a+=Math.PI/4)oval('#d8d6bb',Math.cos(a)*(r-1),Math.sin(a)*(r-1),.45,.45);
    line('#dce1d4',.6,[[-4,-3],[-2,-5],[1,-5]]);
  } else {
    for(const x of [-4,-1,2,5])line('#5d4e39',.55,[[x,-Math.sqrt(r*r-x*x)+1],[x,Math.sqrt(r*r-x*x)-1]]);
    line(small?'#725b40':'#4e6253',2,[[-r+1,0],[r-1,0]]);
  }
  oval('#565f5c',0,0,2.6,2.6); oval(STEEL,.5,-.4,1.8,1.8); return true;
}
export function drawWesternArmor(g,p) {
  if(!p.armor?.startsWith('wf')) return false;
  const {line,poly,oval}=pens(g), c=p.cloth;
  if(p.armor==='wfScaleCoat') {
    poly('#7a827a',[[-5,-24],[5,-24],[7,-18],[5,-15],[7,-1],[1,1],[0,-7],[-1,1],[-7,-1],[-5,-15],[-7,-18]]);
    for(let y=-22;y<-1;y+=2.5)for(let x=-4;x<5;x+=2.4) {
      poly('#adb09b',[[x,y],[x+2,y],[x+1.7,y+1.6],[x+1,y+2],[x+.3,y+1.6]]);
    }
    line('#695038',1.6,[[-5,-12],[5,-12]]);
    poly('#6b4e39',[[-7,-13],[-5,-13],[-3,0],[-5,1]]);
  } else if(p.armor==='wfHalfPlate') {
    poly(c,[[-5,-23],[5,-23],[7,-18],[4,-14],[7,-4],[-6,-4],[-4,-14],[-7,-18]]);
    poly('#8e9996',[[-4,-23],[4,-23],[5,-18],[4,-12],[-4,-12],[-5,-18]]);
    line('#d0d4c4',1,[[-2,-22],[-3,-17],[-2,-13]]);
    for(let y=-11;y<-6;y+=1.8)poly(STEEL,[[-4,y],[4,y],[5,y+1.7],[-5,y+1.7]]);
    line('#574c3c',1,[[-4,-12],[4,-12]]);
  } else {
    if(p.armor==='wfShoulderCloak')poly('#65594e',[[-4,-24],[-11,-20],[-12,-8],[-7,-5],[-4,-16],[3,-23]]);
    poly(c,[[-5,-23],[5,-23],[7,-17],[4,-16],[4,-12],[7,-2],[-6,-2],[-4,-12],[-5,-17],[-7,-18]]);
    if(p.armor==='wfQuilt') {
      for(let x=-3;x<4;x+=1.8)line('#786b50',.7,[[x,-21],[x,-5]]);
      line('#d5c29a',1,[[-4,-22],[0,-20],[4,-22]]);
      poly('#878c7e',[[-7,-18],[-5,-18],[-5,-14],[-7,-14]]);
    } else {
      line('#c7b287',1,[[-5,-3],[6,-3]]); line('#ccbb95',.8,[[-3,-23],[0,-20],[3,-23]]);
      if(p.armor==='wfFrankTunic') { poly('#66503a',[[-7,-12],[-5,-12],[-3,-2],[-5,-1]]); oval('#bca06b',-2,-12,1.6,1.3); }
    }
    line('#614b32',1.5,[[-4,-12],[4,-12]]);
  }
  return true;
}
export function drawWesternHead(g,p) {
  if(!p.head?.startsWith('wf'))return false;
  const {line,poly,oval}=pens(g);
  oval(p.skin,0,-24,3,3.6); poly(p.skin,[[2,-25],[4,-23.5],[3,-23],[3,-21],[0,-21]]);
  if(p.head==='wfKettle') {
    poly('#919b96',[[-4,-27],[-4,-30],[-2,-32],[2,-32],[4,-30],[4,-27]]);
    poly(STEEL,[[-7,-27],[-4,-28],[4,-28],[7,-26],[2,-25],[-7,-26]]);
    line('#e0deca',.8,[[-3,-30],[0,-31],[2,-30]]);line('#5b5445',.7,[[-3,-25],[-2,-21],[1,-20],[3,-23]]);
  } else if(p.head==='wfFrankHair') {
    poly('#785838',[[-4,-20],[-5,-25],[-4,-29],[-1,-31],[2,-30],[4,-27],[2,-26],[-1,-27],[-2,-23],[-2,-20]]);
    line('#ad8a53',.7,[[-3,-28],[-4,-24],[-3,-21]]);
    poly('#785838',[[-1,-22],[1,-21],[3,-22],[2,-19],[0,-19]]);
  } else if(p.head==='wfClothCap') {
    poly('#c1b59a',[[-4,-23],[-5,-28],[-3,-31],[1,-31],[4,-28],[3,-26],[-1,-27],[-2,-23]]);
    line('#857965',.8,[[-2,-30],[-3,-27],[-3,-24]]);line('#8b7b61',.7,[[-2,-23],[0,-20],[3,-23]]);
  } else if(p.head==='wfSegmentHelmet') {
    poly('#89968f',[[-4,-25],[-4,-29],[0,-34],[4,-29],[4,-25]]);
    line('#c8b58a',1.1,[[0,-33],[0,-26]]);line('#c8b58a',1,[[-4,-26],[4,-26]]);
    poly('#818c7f',[[-4,-25],[-1,-25],[-1,-21],[-4,-20]]);
    for(const y of [-24,-22])line('#c2c3a7',.7,[[-4,y],[-2,y]]);
  } else {
    poly('#8c9997',[[-4,-26],[-4,-29],[-2,-32],[1,-34],[2,-31],[4,-28],[4,-26]]);
    line('#d4d9cc',.8,[[1,-33],[-1,-29],[-1,-27]]);poly(STEEL,[[-5,-26],[5,-26],[4,-25],[-5,-25]]);
    line('#645140',.7,[[-3,-25],[-2,-21],[1,-20],[3,-23]]);
  }
  oval(INK,2.5,-24,.4,.4);return true;
}
export function drawWesternWeapon(g,p,action,phase) {
  if(!p.weapon?.startsWith('wf'))return false;
  const {line,poly,oval}=pens(g), w=p.weapon, jav=w==='wfAngon', lance=w==='wfKontos', club=w==='wfGoedendag', axe=w==='wfFrancisca';
  const arm=pts=>{line(INK,3,pts);line(p.skin,2.1,pts);const [x,y]=pts.at(-1);oval(p.skin,x,y,1.1,1.1);};
  const pose=weaponMotion(lance||club?'spear':axe?'axe':'sword',action,phase,lance?1.12:.25);
  let hx=7+pose.x,hy=-17+pose.y,angle=pose.angle;
  if(jav) { const t=action==='attack'?Math.sin(phase*Math.PI):0;hx=6+t*5;hy=-23-t*3;angle=1.1+t*.6; }
  if(lance)angle=action==='charge'?1.48:action==='charge-ready'?1.12+.36*phase*8/7:angle;
  if(!jav||action!=='attack'||phase<.5||phase>=.875) {
    g.save();g.translate(hx,hy);g.rotate(angle);
    if(club) {
      poly('#916b40',[[-1,11],[1,11],[2.4,-17],[-2.4,-17]]);
      poly('#6f7870',[[-2.7,-18],[2.7,-18],[2.7,-14],[-2.7,-14]]);
      poly(STEEL,[[-1,-18],[0,-25],[1,-18]]);line('#cbd0bb',.7,[[-2,-17],[2,-17]]);
    } else if(lance) {
      line('#9d7950',1.7,[[0,17],[0,-34]]);poly(STEEL,[[-1.2,-34],[0,-40],[1.2,-34],[0,-32]]);
    } else if(jav) {
      line('#8e6b43',1.4,[[0,10],[0,-8]]);line(STEEL,1,[[0,-8],[0,-23]]);
      poly(STEEL,[[0,-27],[-2,-22],[-1,-23],[0,-24],[1,-23],[2,-22]]);
    } else if(axe) {
      line('#8c6840',1.8,[[0,7],[-.8,-12],[0,-16]]);
      poly('#909c96',[[-1,-16],[2,-17],[7,-19],[6.4,-16],[7,-13],[4,-11],[1,-14],[-1,-14]]);
      line('#d6dccb',.8,[[7,-19],[6.4,-16],[7,-13],[4,-11]]);
    } else {
      line('#6d4d34',1.7,[[0,4],[0,-2]]);line(STEEL,1.1,[[-3,-2],[3,-2]]);
      poly(STEEL,[[-1,-3],[-.8,-20],[0,-24],[.8,-20],[1,-3]]);
      line('#e4e6d5',.5,[[0,-3],[0,-22]]);oval('#b9bca4',0,4,1.3,1.3);
      line('#aeb9ae',.8,[[2,-2],[3,0],[2,2],[0,2]]);
    }
    g.restore();
  }
  arm([[3,-20],[4,-15],[hx,hy]]);
  if(lance||club) {
    const offset=lance?8:7;
    arm([[-3,-20],[-2,-13],[hx-Math.sin(angle)*offset,hy+Math.cos(angle)*offset]]);
  }
  return true;
}
