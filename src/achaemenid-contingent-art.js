import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK = '#30302a', METAL = '#b6b8a9';
function pens(g) {
  const path = pts => { g.beginPath(); pts.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); };
  const line = (c,w,pts) => { path(pts); g.strokeStyle=c; g.lineWidth=w; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
  const poly = (c,pts) => { path(pts); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.55; g.stroke(); };
  const oval = (c,x,y,rx,ry) => { g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill(); };
  return { line,poly,oval };
}
export function drawContingentShield(g,p) {
  if(!p.shield?.startsWith('ac'))return false;
  const {line,oval}=pens(g);
  const hide=p.shield==='acHideShield', rx=hide?6:6.3,ry=hide?8.5:6.3;
  oval(INK,0,0,rx+.5,ry+.5);oval(hide?'#ad9875':'#827444',0,0,rx,ry);
  if(hide) {
    for(let i=0;i<14;i++){const a=i*Math.PI/7;line('#e0c89e',.65,[[Math.cos(a)*(rx-.4),Math.sin(a)*(ry-.4)],[Math.cos(a)*(rx-1.5),Math.sin(a)*(ry-1.5)]]);}
    line('#80674a',.7,[[-2,-6],[1,-3],[-1,1],[2,6]]);oval('#bca582',-2,-2,1.5,3);
  } else {
    line('#beac7c',1.4,[[-4,-4],[4,4]]);line('#beac7c',1.4,[[-4,4],[4,-4]]);
    oval('#675a39',0,0,1.7,1.7);
  }
  return true;
}
export function drawContingentArmor(g,p,gait=0) {
  if(!p.armor?.startsWith('ac'))return false;
  const {line,poly,oval}=pens(g);
  if(p.armor==='acPaintedHide') {
    poly(p.skin,[[-5,-23],[4,-23],[5,-16],[3,-10],[-4,-10],[-6,-18]]);
    poly('#d8d0b9',[[-5,-23],[-1,-23],[-1,-10],[-4,-10],[-6,-18]]);
    poly('#a65036',[[-1,-23],[4,-23],[5,-16],[3,-10],[-1,-10]]);
    poly('#b9985e',[[-5,-24],[-1,-23],[0,-18],[4,-14],[7,-5],[5,-3],[2,-5],[0,-2],[-2,-4],[-5,-3],[-6,-7],[-3,-14],[-5,-18]]);
    for(const [x,y] of [[-3,-22],[-3,-18],[-1,-15],[1,-12],[-3,-9],[3,-8],[0,-5],[5,-5]]){oval('#4f402d',x,y,1,.7);oval('#c5a46a',x,y,.4,.25);}
  } else if(p.armor==='acLeatherWrap') {
    // Spare fire-hardened shafts are visible behind the bare torso.
    for(const x of [-7,-5]){line('#9b774a',1,[[x+3,-3],[x,-32]]);poly('#54402b',[[x-.5,-32],[x-.1,-36],[x+.6,-32]]);}
    poly(p.skin,[[-5,-23],[4,-23],[5,-17],[3,-9],[-4,-9],[-6,-17]]);
    poly('#8d6845',[[-6,-24],[-2,-24],[1,-19],[-1,-17],[-4,-19],[-6,-16],[-8,-20]]);
    poly('#a07a4d',[[-4,-11],[4,-11],[6,-3],[2,-2],[0,-4],[-4,-2],[-6,-5]]);
    line('#d2b178',1,[[-4,-10],[4,-10]]);line('#60482e',.8,[[-2,-9],[0,-5],[3,-3]]);
  } else {
    poly(p.cloth,[[-5,-23],[5,-23],[7,-18],[4,-15],[4,-11],[6,-3],[-6,-3],[-4,-12],[-5,-17],[-7,-18]]);
    line('#d1bc8c',.9,[[-4,-11],[4,-11]]);
    if(p.armor==='acBootTunic') {
      line('#d0af70',1.1,[[-4,-22],[-1,-19],[3,-22]]);line('#644e34',1,[[-5,-4],[5,-4]]);
      for(const [x,d] of [[-2.7,-1],[2.8,1]]){const dx=gait*d*2.7;line(INK,3.6,[[x+dx,-5],[x+dx*.8,-.2]]);line('#6c5037',2.7,[[x+dx,-5],[x+dx*.8,-.2]]);line('#be9563',.7,[[x+dx-1,-5],[x+dx+1,-5]]);}
    } else {
      poly('#a39d7d',[[-5,-24],[-2,-24],[4,-18],[2,-16],[-2,-20],[-6,-19]]);
      for(const x of [-3,0,3])line('#c6bba0',.7,[[x,-8],[x+.5,-4]]);
      poly('#77593e',[[3,-12],[4,-12],[5,-6],[4,-5]]);line('#b5b3a3',1,[[3,-12],[3,-14]]);
    }
  }
  return true;
}
export function drawContingentHead(g,p) {
  if(!p.head?.startsWith('ac'))return false;
  const {line,poly,oval}=pens(g);
  if(p.head==='acPlaitedCap') {
    poly('#8e7750',[[-4,-26],[-3.5,-30],[-2,-33],[1,-34],[3,-31],[4,-26]]);
    for(const y of [-31,-29,-27])line('#d2ba81',.7,[[-3,y],[3,y+.7]]);
    for(const x of [-2,0,2])line('#bda16b',.6,[[x,-32],[x+.5,-26]]);
    line('#5f4f34',1,[[3,-26],[3,-22],[0,-21]]);
  } else if(p.head==='acWoodCap') {
    poly('#99774b',[[-5,-26],[-4,-32],[-2,-34],[2,-34],[4,-31],[5,-26]]);
    for(const x of [-3,0,3])line('#5d4a30',.8,[[x,-32],[x,-27]]);
    line('#d6b47c',.65,[[-1,-32],[-1,-28]]);line('#5f5239',1.2,[[-5,-26],[5,-26]]);
  } else if(p.head==='acTiedHair') {
    poly('#3d3227',[[-4,-25],[-5,-28],[-3,-30],[1,-30],[4,-27],[1,-27],[-2,-27],[-2,-24]]);
    oval('#45362a',-5,-29,2.2,1.7);line('#d5b37a',.7,[[-4,-28],[-3,-30]]);
  } else {
    for(const [x,y] of [[-3,-26],[-4,-28],[-2,-30],[0,-30],[2,-29],[3,-27]])oval('#302b24',x,y,1.8,1.5);
    line('#aea28b',.7,[[-2,-25],[1,-25]]);
  }
  oval(INK,2.5,-24,.4,.4);return true;
}
export function drawContingentWeapon(g,p,action,phase) {
  if(!p.weapon?.startsWith('ac'))return false;
  const {line,poly,oval}=pens(g),w=p.weapon;
  const arm=(pts,c=p.skin)=>{line(INK,3,pts);line(c,2.1,pts);const [x,y]=pts.at(-1);oval(p.skin,x,y,1.1,1.1);};
  if(w==='acPalmBow') {
    const pull=action==='attack'&&phase<.625?Math.sin(phase/.625*Math.PI)*5:0;
    g.beginPath();g.moveTo(10,-43);g.bezierCurveTo(24,-36,24,-7,10,0);g.strokeStyle=INK;g.lineWidth=2.4;g.stroke();g.strokeStyle='#a0824e';g.lineWidth=1.4;g.stroke();
    line('#d9cba4',.6,[[10,-43],[10-pull,-22],[10,0]]);
    if(action!=='attack'||phase<.5||phase>=.875){line('#c6ac77',.8,[[9-pull,-22],[24,-22]]);poly('#8d8171',[[24,-23],[27,-22],[24,-21]]);}
    arm([[-3,-20],[4,-18],[20,-22]],'#d8d0b9');arm([[3,-20],[0,-16],[10-pull,-22]],'#a65036');return true;
  }
  const throwing=w==='acWoodJavelin',pose=weaponMotion('spear',action,phase,.3);
  let hx=7+pose.x,hy=-18+pose.y,angle=pose.angle;
  if(throwing){const t=action==='attack'?Math.sin(phase*Math.PI):0;hx=7+t*5;hy=-25-t*3;angle=.9+t*1.1;}
  if(!throwing||action!=='attack'||phase<.5||phase>=.875){
    g.save();g.translate(hx,hy);g.rotate(angle);
    const len=throwing?19:w==='acColchianSpear'?21:18;
    line('#927045',1.4,[[0,10],[0,-len]]);
    poly(throwing?'#54402b':METAL,[[-.9,-len],[0,-len-4],[.9,-len],[0,-len+1]]);
    if(!throwing)line('#64543a',1.2,[[0,-len+1],[0,-len+3]]);
    g.restore();
  }
  arm([[3,-20],[4,-15],[hx,hy]],throwing?p.skin:p.cloth);return true;
}
