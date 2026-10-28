import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK = '#30312b', METAL = '#b3b4a5';
function pens(g) {
  const path = pts => { g.beginPath(); pts.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); };
  const line = (c,w,pts) => { path(pts); g.strokeStyle=c; g.lineWidth=w; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
  const poly = (c,pts) => { path(pts); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.55; g.stroke(); };
  const oval = (c,x,y,rx,ry) => { g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fillStyle=c; g.fill(); };
  return { line,poly,oval };
}
export function drawImperialAuxShield(g,p) {
  if(!p.shield?.startsWith('ia'))return false;
  const {line,oval}=pens(g);
  if(p.shield==='iaHollowShield') {
    oval(INK,0,0,9,10);oval('#b49b61',0,0,8.5,9.5);oval('#6a6347',0,0,6.5,7.5);oval('#8a8057',.5,.7,5.8,6.7);
    line('#e2c68a',.8,[[-6,-6],[-3,-8],[1,-8],[5,-6]]);
  } else {
    oval(INK,0,0,7.6,11.8);oval('#c6b583',0,0,7,11.2);oval('#75584c',0,0,6,10.2);
    line('#c9b889',1.2,[[0,-10],[0,10]]);line('#c9b889',1.2,[[-6,0],[6,0]]);
    oval('#5d615a',0,0,2.2,2.5);oval(METAL,.4,-.3,1.6,1.9);
  }
  return true;
}
export function drawImperialAuxArmor(g,p,gait=0) {
  if(!p.armor?.startsWith('ia'))return false;
  const {line,poly,oval}=pens(g), c=p.cloth;
  if(p.armor==='iaGoatskinCorselet') {
    poly('#806c50',[[-4,-24],[-10,-23],[-12,-18],[-10,-16],[-12,-12],[-9,-10],[-10,-7],[-6,-8],[-4,-16],[2,-22]]);
    for(const y of [-22,-19,-16,-13])line('#baa581',.8,[[-8,y],[-10,y+2]]);
  }
  poly(c,[[-5,-23],[5,-23],[7,-17],[4,-16],[4,-12],[7,-2],[-6,-2],[-4,-12],[-5,-17],[-7,-18]]);
  if(['iaMarineCorselet','iaGoatskinCorselet'].includes(p.armor)) {
    poly(p.armor==='iaMarineCorselet'?'#9e916d':'#a08b5e',[[-4,-23],[4,-23],[5,-17],[4,-11],[-4,-11],[-5,-17]]);
    line('#d3bc85',1,[[-3,-22],[-3,-14],[3,-14],[3,-22]]);
    for(const x of [-4,-2,0,2,4])poly('#b7a37b',[[x-1,-11],[x+1,-11],[x+1,-6],[x-1,-6]]);
    if(p.armor==='iaGoatskinCorselet') {
      for(const [x,d] of [[-2.7,-1],[2.8,1]]) { const dx=gait*d*2.7; poly('#b19a67',[[x+dx-1.4,-6],[x+dx+1.3,-6],[x+dx*.8+1,-1],[x+dx*.8-1,-1]]);line('#dec793',.6,[[x+dx,-5],[x+dx*.8,-2]]); }
      // Shoulder hide remains visible above the corselet.
      poly('#ac9875',[[-5,-24],[-1,-24],[1,-21],[-1,-19],[-3,-20],[-5,-17],[-6,-21]]);
    }
  } else if(p.armor==='iaBactrianCoat') {
    poly('#5f654d',[[-5,-23],[-1,-23],[3,-12],[0,-2],[-6,-2],[-4,-13]]);
    line('#cfb88d',1,[[-1,-22],[3,-12],[0,-3]]);
    for(const y of [-19,-16,-8,-5])line('#c8b07e',.7,[[-4,y],[-2,y]]);
  } else {
    const trim=p.armor==='iaSlingTunic'?'#465b54':'#7c5143';
    for(const x of [-2.5,2.5])line(trim,1.3,[[x,-22],[x,-4]]);
    for(const x of [-4,4]){oval(trim,x,-5,1.4,1.4);oval('#c9b88f',x,-5,.65,.65);}
    line(trim,1,[[-5,-2],[6,-2]]);
    if(p.armor==='iaSlingTunic') {
      poly('#725b40',[[-7,-13],[-4,-12],[-3,-7],[-7,-6],[-8,-9]]);
    }
  }
  line('#614b32',1.4,[[-4,-12],[4,-12]]);oval('#b9a06a',1,-12,.8,.8);return true;
}
export function drawImperialAuxHead(g,p) {
  if(!p.head?.startsWith('ia'))return false;
  const {line,poly,oval}=pens(g);
  oval(p.skin,0,-24,3,3.6);poly(p.skin,[[2,-25],[4,-23.5],[3,-23],[3,-21],[0,-21]]);
  if(p.head==='iaWovenCap') {
    poly('#bba270',[[-4,-26],[-4,-29],[-2,-32],[1,-32],[4,-29],[4,-26]]);
    for(const y of [-30,-28,-26])line('#6d6144',.6,[[-3,y],[3,y]]);
    for(const x of [-2,0,2])line('#dec493',.7,[[x,-31],[x,-26]]);
    line('#d7bc89',1.2,[[-4,-26],[4,-26]]);
  } else if(p.head==='iaFeatherCap') {
    poly('#776a52',[[-4,-26],[-4,-30],[-1,-32],[2,-31],[4,-28],[4,-26]]);
    for(const [x,y,d] of [[-4,-27,-3],[-2,-30,-2],[1,-30,1],[3,-27,3]]) {
      line('#76674e',.7,[[x,y],[x+d,y-7]]);
      poly('#d5ccb1',[[x,y-2],[x+d-1,y-7],[x+d,y-9],[x+d+1,y-7]]);
    }
    line('#b29561',1,[[-4,-26],[4,-26]]);
  } else if(p.head==='iaSoftHood') {
    poly('#b5aa85',[[-5,-20],[-5,-28],[-3,-32],[0,-33],[3,-30],[4,-27],[1,-27],[-2,-28],[-2,-24],[-3,-20]]);
    line('#e1cf9e',.7,[[-2,-31],[-3,-28],[-3,-23]]);
    poly('#66523d',[[-1,-22],[1,-21],[3,-22],[2,-19],[-1,-19]]);
  } else if(p.head==='iaPannonianCap') {
    poly('#8c7559',[[-4,-27],[-4,-32],[3,-32],[4,-30],[4,-27]]);
    oval('#b19a72',0,-32,3.6,1);line('#cfb88d',1,[[-4,-27],[4,-27]]);
  } else {
    poly('#574535',[[-4,-25],[-4,-28],[-2,-30],[1,-30],[4,-28],[4,-26],[1,-27],[-2,-27],[-2,-24]]);
    line('#937550',.6,[[-2,-29],[1,-29],[3,-28]]);
  }
  oval(INK,2.5,-24,.4,.4);return true;
}
export function drawImperialAuxWeapon(g,p,action,phase) {
  if(!p.weapon?.startsWith('ia'))return false;
  const {line,poly,oval}=pens(g), w=p.weapon;
  const arm=pts=>{line(INK,3,pts);line(['iaRomanDartTunic','iaSlingTunic','iaBactrianCoat'].includes(p.armor)?p.cloth:p.skin,2.1,pts);const [x,y]=pts.at(-1);oval(p.skin,x,y,1.1,1.1);};
  if(w==='iaCornelBow') {
    const pull=action==='attack'?Math.sin(phase*Math.PI)*5:1;
    g.beginPath();g.moveTo(10,-35);g.bezierCurveTo(21,-29,21,-15,11,-8);g.strokeStyle='#7e5039';g.lineWidth=1.8;g.stroke();
    line('#ddd3b4',.65,[[10,-35],[10-pull,-22],[11,-8]]);
    if(action!=='attack'||phase<.625){line('#c1a77a',.8,[[6-pull,-22],[26,-22]]);poly(METAL,[[26,-23],[29,-22],[26,-21]]);}
    arm([[-3,-20],[3,-17],[18,-22]]);arm([[3,-20],[0,-16],[10-pull,-22]]);return true;
  }
  if(w==='iaSling') {
    const t=action==='attack'?phase*Math.PI*2-.7:-.85, hx=8,hy=-20,sx=hx+Math.cos(t)*13,sy=hy+Math.sin(t)*13;
    line('#c6b58c',.7,[[hx-.5,hy],[sx-1,sy],[hx+.5,hy]]);oval('#776044',sx,sy,2,1.1);
    if(action!=='attack'||phase<.5)oval('#b3b1a2',sx,sy,.9,.8);
    arm([[3,-20],[4,-15],[hx,hy]]);arm([[-3,-20],[-7,-16],[-6,-11]]);return true;
  }
  const dart=w==='iaPlumbata', pose=weaponMotion('spear',action,phase,.25);
  let hx=7+pose.x,hy=-17+pose.y,angle=pose.angle;
  if(dart){const t=action==='attack'?Math.sin(phase*Math.PI):0;hx=7+t*5;hy=-24-t*3;angle=1.1+t*.7;}
  if(!dart||action!=='attack'||phase<.5||phase>=.875) {
    g.save();g.translate(hx,hy);g.rotate(angle);
    if(dart) {
      line('#a28b60',1,[[0,7],[0,-5]]);line(METAL,.8,[[0,-5],[0,-10]]);
      oval('#696d67',0,-5,1.6,2);poly(METAL,[[-.8,-10],[0,-13],[.8,-10]]);
      for(const d of [-1,1])poly('#c8baa0',[[0,2],[d*2.4,5],[d*2.4,8],[0,6]]);
    } else {
      const len=w==='iaShortSpear'?19:28;
      line('#987447',1.5,[[0,11],[0,-len]]);poly(METAL,[[-1.2,-len],[0,-len-4],[1.2,-len],[0,-len+1]]);
    }
    g.restore();
  }
  arm([[3,-20],[4,-15],[hx,hy]]);return true;
}
