import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK = '#30362c', BRONZE = '#ab8e54';
function pens(g) {
  const path = pts => { g.beginPath(); pts.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); };
  const line = (c,w,pts) => { path(pts); g.strokeStyle=c; g.lineWidth=w; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
  const poly = (c,pts) => { path(pts); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.55; g.stroke(); };
  const oval = (c,x,y,rx,ry) => { g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fillStyle=c; g.fill(); };
  return { line, poly, oval };
}
export function drawAncientShield(g,p) {
  if(p.shield !== 'agHide') return false;
  const {poly,line,oval}=pens(g);
  poly('#a9553b',[[-5,8],[-5,-2],[-4,-6],[-2,-9],[0,-11],[3,-8],[5,-4],[5,8]]);
  poly('#e5dcc3',[[-4.2,7],[-4.2,-2],[-3.2,-6],[0,-10],[2.5,-7],[4.2,-4],[4.2,7]]);
  for(const [x,y,rx,ry] of [[0,-7,1.3,1.7],[-2,-3,1.5,1],[2,0,1.3,2],[-1,3,1.6,1.8],[2.5,6,1.3,1],[-3,6,.8,1.5]]) oval('#3c392d',x,y,rx,ry);
  line('#cbb58a',.35,[[-4.6,7],[-4.6,-3],[-2.7,-7]]);
  return true;
}
export function drawAncientArmor(g,p) {
  if(!p.armor?.startsWith('ag')) return false;
  const {poly,line,oval}=pens(g), c=p.cloth, skin=p.skin||'#be9976';
  if(p.armor==='agEgyptKilt') {
    poly(skin,[[-5,-22],[4,-22],[4,-13],[-4,-13]]);
    line('#79553c',.45,[[-3,-19],[0,-18],[3,-19]]);
    poly(c,[[-4,-13],[4,-13],[6,-4],[-5,-4]]);
    poly('#eee1bf',[[3,-12],[0,-4],[5,-4]]);
    line('#9b865e',1,[[-4,-13],[4,-13]]);
    if(p.sash) line('#806444',1.4,[[-4,-22],[4,-14]]);
  } else {
    poly(c,[[-5,-22],[4,-22],[5,-14],[6,-4],[1,-2],[0,-6],[-2,-2],[-6,-4],[-4,-14]]);
    if(p.armor==='agHanTunic') {
      line('#c1ae87',1.1,[[-3,-22],[2,-16],[-3,-13]]);
      line('#414f43',1.6,[[-4,-12],[4,-12]]);
      line('#b8a37e',.6,[[-4,-3],[-2,-3]]);
    } else {
      const persian=p.armor==='agPersianScale';
      poly(persian?'#92876b':'#555c50',[[-4,-22],[4,-22],[4,-11],[-4,-11]]);
      for(let y=-21;y<-11;y+=2) for(let x=-3.5;x<4;x+=2) {
        if(persian) { line('#c3ae7a',.55,[[x,y],[x+.3,y+1.4],[x+1.4,y+1.4],[x+1.6,y]]); }
        else { poly('#7a8070',[[x,y],[x+1.5,y],[x+1.5,y+1.6],[x,y+1.6]]); oval('#b9a270',x+.7,y+.4,.23,.23); }
      }
      line('#7c5b3c',1.2,[[-4,-11],[4,-11]]);
      if(!persian) { poly('#626c5d',[[-6,-22],[-3,-23],[-3,-18],[-6,-18]]); line('#b8a37e',.6,[[-5,-21],[-5,-19]]); }
    }
  }
  return true;
}
export function drawAncientHead(g,p) {
  if(!p.head?.startsWith('ag')) return false;
  const {poly,line,oval}=pens(g), skin=p.skin||'#be9976';
  oval(skin,.5,-24,3,3.6); poly(skin,[[2,-25],[4,-23.5],[3,-23],[3,-21],[0,-20.5]]);
  if(p.head==='agPersianHelm') {
    poly(BRONZE,[[-4,-26],[-4,-28],[-2,-31],[1,-32],[3,-30],[4,-27],[4,-26]]);
    line('#dbca8f',.7,[[-3,-28],[-1,-30],[1,-30]]);
    poly('#4b3b2c',[[-3,-25],[-3,-22],[0,-18],[3,-20],[3,-22],[0,-21]]);
    line('#7c653f',.6,[[-2,-22],[0,-20],[2,-21]]);
  } else {
    poly('#34372e',[[-4,-25],[-4,-29],[-1,-30],[3,-29],[4,-26],[0,-26],[-2,-25],[-2,-23]]);
    if(p.head==='agHanKnot') { oval('#34372e',0,-32,2.6,1.6); line('#ac8a5a',.8,[[-2,-31],[2,-31]]); }
    else { line('#c3ac80',1.6,[[-4,-27],[4,-27]]); line('#8e7754',1,[[-4,-27],[-6,-24],[-5,-21]]); }
  }
  oval(INK,2.5,-24,.4,.4);
  return true;
}
export function drawAncientWeapon(g,p,action,phase) {
  if(!p.weapon?.startsWith('ag')) return false;
  const {line,poly,oval}=pens(g), spear=p.weapon==='agBronzeSpear', axe=p.weapon==='agCrescentAxe';
  const pose=weaponMotion(p.weapon,action,phase,spear?.12:.28), hx=7+pose.x, hy=-17+pose.y;
  const skin=p.skin||'#be9976', arm=pts=>{line(INK,3.5,pts);line((spear||axe)&&!p.weaponSleeves?skin:p.cloth,2.6,pts);const [x,y]=pts.at(-1);oval(skin,x,y,1.1,1.1);};
  arm([[3,-20],[6,-15],[hx,hy]]); arm([[-3,-20],[-5,-15],[-2,-12]]);
  g.save(); g.translate(hx,hy); g.rotate(pose.angle);
  if(spear) {
    line('#8d6d43',1.5,[[0,17],[0,-23]]);
    poly(BRONZE,[[0,-29],[-1.6,-23],[0,-21],[1.6,-23]]);
    line('#d4bc78',.55,[[0,-28],[0,-23]]);
  } else if(axe) {
    line('#785c3c',1.8,[[0,8],[0,-19]]);
    // Crescent edge with two openings; the museum's shaft/lashings are restored.
    g.beginPath();g.moveTo(0,-18);g.bezierCurveTo(8,-15,8,-7,0,-3);g.lineTo(0,-6);g.bezierCurveTo(4,-8,4,-10,0,-10);g.lineTo(0,-12);g.bezierCurveTo(4,-13,3,-15,0,-16);g.closePath();
    g.fillStyle=BRONZE;g.fill();g.strokeStyle=INK;g.lineWidth=.55;g.stroke();
    for(const y of [-17,-5]) for(const dy of [0,.7,1.4]) line('#d2bb84',.5,[[-1,y+dy],[1.3,y+dy]]);
  } else {
    line('#72563a',1.7,[[0,3],[0,-3]]);oval('#b99c64',0,3,1.4,.7);
    poly('#b9bfb2',[[-1,-4],[-1,-19],[0,-24],[1,-19],[1,-4]]);
    line('#e1dec7',.5,[[0,-5],[0,-22]]);line('#a68b58',1,[[-2.4,-4],[2.4,-4]]);
  }
  g.restore(); return true;
}
