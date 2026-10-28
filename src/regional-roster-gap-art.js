import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK='#30332b', IRON='#b4b9ab';
function pens(g) {
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.55;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();};
  return {line,poly,oval};
}
export function drawRegionalGapShield(g,p) {
  if(p.shield!=='rggOvalShield')return false;
  const {line,oval}=pens(g);
  oval(INK,0,0,7,11);oval('#8d674a',0,0,6.4,10.4);oval('#c0a27a',0,0,5.7,9.7);oval('#766b50',0,0,5.1,9.1);
  for(const s of [-1,1])line('#c3ae79',.7,[[s*2,-7],[s*4,-4],[s*2,-1],[s*4,3],[s*2,7]]);
  oval('#7d887c',0,0,2.3,3);oval(IRON,.3,-.4,1.1,1.8);return true;
}
export function drawRegionalGapArmor(g,p) {
  if(!p.armor?.startsWith('rgg'))return false;
  const {line,poly,oval}=pens(g),c=p.cloth;
  if(p.armor==='rggThracianTunic') {
    poly(c,[[-5,-23],[5,-23],[8,-19],[4,-17],[4,-12],[7,-4],[-7,-4],[-4,-12],[-4,-17],[-8,-19]]);
    line('#dfb681',1.2,[[-6,-5],[6,-5]]);line('#64503b',1.8,[[-4,-12],[4,-12]]);
    line('#cbb78a',.7,[[-2,-22],[-1,-15],[2,-14]]);
    for(const x of [-3,3])poly('#aa925c',[[x-1.5,-2],[x+1.5,-2],[x+1,4],[x-1,4]]);
  } else if(p.armor==='rggFlaxWrap'||p.armor==='rggMalo') {
    poly(p.skin,[[-4,-23],[4,-23],[5,-19],[3,-12],[-3,-12],[-5,-19]]);
    line('#805a40',.6,[[-3,-19],[0,-18],[3,-19]]);
    if(p.armor==='rggFlaxWrap') {
      poly(c,[[-4,-13],[4,-13],[7,-4],[-7,-4]]);
      for(let x=-5;x<=5;x+=1.3)line(x%2?'#c3ad7e':'#786646',.8,[[x*.6,-12],[x,-4]]);
      line('#514436',1.6,[[-4,-12],[4,-12]]);
    } else {
      poly(c,[[-4,-12],[4,-12],[3,-10],[2,-3],[-2,-4],[-3,-10]]);
      line('#785939',1.6,[[-4,-12],[4,-12]]);line('#e1c699',.6,[[0,-10],[0,-4]]);
      oval('#685139',-5,-10,2.3,3);line('#d3b987',.7,[[-6,-12],[-4,-12]]);
    }
  } else if(p.armor==='rggLeineMantle') {
    poly('#645c46',[[-5,-24],[-9,-20],[-9,-7],[-4,-9],[0,-21]]);
    poly(c,[[-5,-23],[4,-23],[7,-19],[4,-16],[4,-12],[7,-3],[-6,-3],[-4,-12],[-6,-17],[-8,-19]]);
    for(const x of [-3,0,3])line('#8c7a50',.6,[[x,-10],[x*1.5,-4]]);
    line('#755334',1.6,[[-4,-12],[4,-12]]);line('#695239',1.3,[[-3,-23],[4,-12]]);
    poly('#73573b',[[-7,-13],[-9,-4],[-6,-3],[-4,-12]]);
    for(const x of [-7,-5.5]){line('#c4a67a',.65,[[x,-8],[x+1,-20]]);line('#dad0af',1.2,[[x+.7,-18],[x+1,-21]]);}
    oval('#b9a16c',-3,-22,1,1);
  } else {
    poly('#656d63',[[-5,-24],[-10,-19],[-9,-2],[-4,-5],[1,-23]]);
    poly(c,[[-5,-23],[5,-23],[6,-17],[4,-12],[6,-3],[2,-3],[0,-6],[-2,-3],[-6,-3],[-4,-12],[-6,-17]]);
    line('#614a34',1.7,[[-4,-12],[4,-12]]);
    line('#d0c4a6',.8,[[0,-22],[0,-15]]);line('#7b7c69',.6,[[-3,-10],[-4,-5]]);
  }
  return true;
}
export function drawRegionalGapHead(g,p) {
  if(!p.head?.startsWith('rgg'))return false;
  const {line,poly,oval}=pens(g);
  oval(p.skin,0,-24,3,3.5);poly(p.skin,[[2,-25],[4,-23.5],[3,-23],[3,-21],[0,-20.5]]);
  if(p.head==='rggPhrygianHelm') {
    poly('#aa925d',[[-5,-27],[-4,-31],[-1,-35],[3,-35],[5,-32],[2,-32],[3,-27]]);
    poly('#c0a871',[[-4,-27],[-2,-27],[-1,-23],[-3,-22]]);
    line('#e1c58e',.8,[[-4,-27],[3,-27]]);line('#6e6140',.6,[[-2,-31],[0,-33],[3,-33]]);
  } else if(p.head==='rggMaoriKnot') {
    oval('#302b25',-1,-28,3.4,2.2);oval('#302b25',-2,-31,2,2);
    line('#c5b082',.9,[[-3.5,-30],[-.5,-30]]);
  } else if(p.head==='rggHawaiianHair') {
    oval('#302b25',-.6,-27.8,3.4,2);poly('#302b25',[[-4,-28],[-3,-23],[-2,-25],[0,-28]]);
    line('#514233',.6,[[-2,-29],[1,-29]]);
  } else if(p.head==='rggGlibHair') {
    poly('#785439',[[-4,-28],[-2,-30],[2,-29],[4,-26],[3,-23],[1,-26],[-1,-27],[-2,-23],[-4,-22]]);
    line('#b58c5c',.7,[[-2,-28],[1,-28],[3,-25]]);
  } else {
    poly('#68543d',[[-3,-24],[-3,-21],[0,-19],[3,-21],[3,-22],[0,-21],[-1,-24]]);
    poly('#927e5a',[[-5,-27],[-3,-32],[0,-33],[4,-31],[3,-29],[1,-30],[3,-27]]);
    line('#c2aa7d',.8,[[-4,-27],[3,-27]]);
  }
  oval(INK,2.5,-24,.4,.4);return true;
}
export function drawRegionalGapWeapon(g,p,action,phase) {
  if(!p.weapon?.startsWith('rgg'))return false;
  const {line,poly,oval}=pens(g),sling=p.weapon==='rggSling',two=p.weapon==='rggRhomphaia';
  const pose=weaponMotion(two?'spear':p.weapon==='rggPatu'?'spear':p.weapon,action,phase,two?.35:.2);
  const hx=7+pose.x,hy=-17+pose.y;
  const arm=pts=>{line(INK,3.1,pts);line(['rggDacianTunic'].includes(p.armor)?p.cloth:p.skin,2.2,pts);const[x,y]=pts.at(-1);oval(p.skin,x,y,1.1,1.1);};
  if(sling) {
    const a=action==='attack'?phase*Math.PI*2-.6:-1.1, sx=hx+Math.cos(a)*12,sy=hy+Math.sin(a)*12;
    line('#d4bf90',.8,[[hx-.6,hy],[sx-1,sy],[hx+.6,hy]]);
    oval('#765f40',sx,sy,2,1.2);
    if(action!=='attack'||phase<.5)oval('#a9a696',sx,sy,.9,.8);
    arm([[3,-20],[5,-15],[hx,hy]]);arm([[-3,-20],[-6,-15],[-5,-11]]);return true;
  }
  g.save();g.translate(hx,hy);g.rotate(pose.angle);
  if(two) {
    // Long straight single-edged blade, not the curved Dacian falx.
    poly(IRON,[[-.9,-8],[-.9,-28],[.8,-31],[1.4,-28],[1.4,-8]]);
    line('#e1dfc7',.5,[[1,-9],[1,-28]]);line('#504633',2,[[0,-8],[0,7]]);
    line('#907d56',.7,[[-.8,-7],[.8,-7]]);
  } else if(p.weapon==='rggPatu') {
    poly('#d3c9a6',[[-1,3],[-1,-1],[-3,-5],[-3.5,-9],[-2,-12],[1,-13],[3,-11],[3.2,-7],[1,-1],[1,3]]);
    line('#eee1bc',.6,[[1,-10],[1.5,-7],[0,-3]]);oval('#695a42',0,2,.4,.5);
    line('#9b8057',.7,[[0,2],[3,4],[2,6],[0,5],[0,2]]);
  } else {
    line('#97734b',1.5,[[0,11],[0,-27]]);poly(IRON,[[-1.3,-27],[0,-33],[1.3,-27],[0,-25]]);
  }
  g.restore();
  arm([[3,-20],[5,-14],[hx,hy]]);
  if(two) {
    // Follow the lower grip in every pose so the second hand never floats.
    const x=hx-Math.sin(pose.angle)*6,y=hy+Math.cos(pose.angle)*6;
    arm([[-3,-20],[-2,-13],[x,y]]);
  } else if(!p.shield)arm([[-3,-20],[-5,-15],[-6,-13]]);
  return true;
}
