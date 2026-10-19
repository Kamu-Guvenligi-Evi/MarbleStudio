import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK = '#30362e', STEEL = '#a6b3ac', BRONZE = '#b5a06b';
function pens(g) {
  const path = pts => { g.beginPath(); pts.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); };
  const line = (c,w,pts) => { path(pts); g.strokeStyle=c; g.lineWidth=w; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
  const poly = (c,pts) => { path(pts); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.55; g.stroke(); };
  const oval = (c,x,y,rx,ry) => { g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fillStyle=c; g.fill(); };
  return { line, poly, oval };
}
export function drawGapShield(g,p) {
  if(!p.shield?.startsWith('gap')) return false;
  const {poly,line,oval}=pens(g);
  if(p.shield==='gapRomanOval') {
    oval(INK,0,-1,6.6,10.8); oval('#8d4937',0,-1,6,10.2);
    line('#cbb077',.8,[[0,-10],[0,8]]);
    for(const s of [-1,1]) line('#d4ba7d',.7,[[s*1.4,-5],[s*4,-3],[s*2,-1],[s*4,2],[s*1.4,5]]);
    oval(STEEL,0,-1,2.2,2.6); oval('#e1d4ad',-.5,-1.5,.7,.9);
  } else {
    poly('#987952',[[-5,-8],[4,-8],[5,7],[-4,8]]);
    for(let x=-3;x<=3;x+=2) line('#64563e',.55,[[x,-7],[x+.5,7]]);
    line('#bca173',1,[[-4,-6],[4,-6]]); line('#bca173',1,[[-3.8,5],[4.5,5]]);
    oval('#6e7059',0,0,1.8,2);
  }
  return true;
}
export function drawGapArmor(g,p) {
  if(!p.armor?.startsWith('gap')) return false;
  const {poly,line,oval}=pens(g), c=p.cloth;
  if(p.armor==='gapArcherCoat') {
    // Long curved wicker shield is carried to the rear, leaving both bow hands free.
    poly('#9f8d59',[[-9,-26],[-6,-27],[-4,-23],[-4,-5],[-7,-3],[-10,-6]]);
    for(let y=-24;y<-5;y+=2) line('#d2bc7d',.55,[[-9,y],[-5,y-.6]]);
  }
  const long=['gapArcherCoat','gapPayganTunic','gapTangCoat'].includes(p.armor);
  poly(c,[[-5,-22],[4,-22],[5,-13],[long?7:5,long?-3:-8],[0,long?-1:-7],[-6,long?-4:-8],[-4,-14]]);
  if(p.armor==='gapTangCoat') {
    poly('#e0c29b',[[-3,-22],[0,-18],[3,-22],[1,-16]]);
    line('#e0c29b',.7,[[1,-16],[3,-5]]); line('#513b2c',1.4,[[-4,-12],[4,-12]]);
    poly('#70553c',[[-5,-12],[-7,-7],[-5,-3],[-3,-5]]);
  } else if(p.armor==='gapArcherCoat'||p.armor==='gapPayganTunic') {
    line('#dfc396',.8,[[-3,-22],[1,-19],[3,-21]]);
    line('#63543d',1.3,[[-4,-12],[4,-12]]);
    line('#d2bb88',.65,[[-5,-4],[0,-2],[6,-4]]);
    if(p.armor==='gapArcherCoat') line('#786048',1.2,[[-4,-22],[4,-13]]);
  } else if(p.armor==='gapSongLamellar') {
    poly('#4b5952',[[-5,-22],[4,-22],[5,-9],[-5,-9]]);
    for(let y=-21;y<-9;y+=2.4) for(let x=-4;x<4;x+=2) {
      poly('#7f8d7e',[[x,y],[x+1.7,y],[x+1.5,y+2],[x,y+2]]);
      oval('#cab58b',x+.8,y+.5,.25,.25);
    }
    poly('#718274',[[-7,-22],[-4,-23],[-3,-18],[-7,-18]]);
    line('#b09a6b',1,[[-4,-12],[4,-12]]);
  } else if(p.armor==='gapSwissQuilt'||p.armor==='gapHussiteVest') {
    const h=p.armor==='gapHussiteVest';
    if(h) poly('#a69c7d',[[-4,-21],[3,-21],[4,-11],[-4,-11]]);
    for(let x=-3;x<=3;x+=1.5) line(h?'#6e6a51':'#673e32',.5,[[x,-20],[x+.4,-9]]);
    if(!h) for(let y=-18;y<-8;y+=3) line('#c18e65',.5,[[-4,y],[4,y]]);
    line('#594533',1.6,[[-4,-12],[4,-12]]);
    poly('#735039',[[3,-12],[7,-10],[7,-3],[3,-4]]);
    for(let x=4;x<7;x++) line('#d5c699',.5,[[x,-9],[x,-15]]);
    if(h) for(const x of [-2,0]) line(STEEL,.85,[[x,-12],[x,-8],[x+1,-7],[x+1.7,-8]]);
  } else if(p.armor==='gapRomanMail') {
    poly('#75837b',[[-5,-23],[4,-23],[5,-10],[-5,-10]]);
    for(let y=-22;y<-10;y+=1.5) for(let x=-4;x<5;x+=1.7) oval('#b2bbb0',x+(y%3?.5:0),y,.45,.45);
    poly('#829087',[[-6,-22],[-3,-23],[-2,-18],[-6,-18]]);
    line('#674432',1.5,[[-5,-11],[4,-11]]);
    for(let x=-3;x<=3;x+=1.5) {line('#79543b',.8,[[x,-10],[x,-5]]);oval('#c5ad71',x,-6,.45,.45);}
  } else if(p.armor==='gapGreekCuirass') {
    poly(BRONZE,[[-5,-22],[4,-22],[4,-13],[2,-11],[-3,-11],[-5,-14]]);
    line('#e0ca89',.7,[[-3,-20],[-1,-18],[1,-19],[3,-20]]);
    line('#776443',.6,[[0,-17],[0,-13]]);
    for(let x=-4;x<=3;x+=1.7) poly('#d9c7a2',[[x,-12],[x+1.4,-12],[x+2,-6],[x,-6]]);
  }
  return true;
}
export function drawGapHead(g,p) {
  if(!p.head?.startsWith('gap')) return false;
  const {poly,line,oval}=pens(g), skin='#be9976';
  oval(skin,.5,-24,3,3.5); poly(skin,[[2,-25],[4,-23.5],[3,-23],[3,-21],[0,-20.5]]);
  if(p.head==='gapBoeotian') {
    poly(BRONZE,[[-5,-27],[-3,-31],[0,-32],[3,-31],[4,-27],[7,-26],[4,-25],[1,-27],[-3,-25],[-7,-26]]);
    line('#e4d195',.7,[[-3,-29],[0,-31],[2,-30]]);
  } else if(p.head==='gapSwissHelm') {
    poly(STEEL,[[-6,-26],[-3,-28],[-2,-31],[1,-32],[4,-29],[4,-27],[6,-26],[4,-25],[-6,-25]]);
    line('#e2dfc8',.6,[[-2,-29],[0,-31],[2,-29]]);
  } else if(p.head==='gapRomanHelm') {
    poly(STEEL,[[-5,-24],[-4,-29],[-1,-31],[2,-30],[4,-27],[4,-26],[-2,-26],[-2,-23]]);
    poly('#8b9a91',[[-3,-26],[-1,-26],[0,-22],[-2,-20],[-4,-22]]);
    line('#ccb983',.8,[[-4,-27],[4,-27]]);
  } else if(p.head==='gapSongHelm') {
    poly('#53645c',[[-5,-25],[-4,-29],[0,-33],[3,-30],[4,-26],[1,-26],[-2,-25],[-2,-20],[-5,-21]]);
    line('#c1b38e',.7,[[0,-32],[1,-27],[4,-27]]);
    for(let y=-24;y<-20;y+=1.5) line('#a8b0a0',.5,[[-5,y],[-3,y]]);
  } else if(p.head==='gapHood') {
    poly('#807451',[[-6,-19],[-5,-29],[-2,-32],[1,-31],[4,-27],[1,-27],[-1,-25],[-1,-21],[3,-20],[4,-17],[-2,-18]]);
    line('#b5a17b',.6,[[-4,-28],[-2,-30],[0,-29]]);
  } else if(p.head==='gapTangCap') {
    poly('#333b31',[[-4,-26],[-4,-29],[-2,-33],[1,-35],[2,-32],[3,-29],[3,-27]]);
    line('#b09765',.7,[[-4,-27],[3,-27]]);
    line('#333b31',1.4,[[-4,-27],[-6,-23],[-5,-20]]);
  } else {
    const tall=p.head==='gapPersianCap';
    poly(tall?'#975942':'#9d8c68',[[-4,-26],[-4,-29],[-2,tall?-34:-31],[1,tall?-33:-31],[3,-29],[4,-26]]);
    line('#dbc39a',1,[[-4,-26],[4,-26]]);
    poly('#493e2e',[[-3,-24],[-3,-21],[0,-18],[3,-21],[3,-22],[0,-21]]);
  }
  oval(INK,2.4,-24,.4,.4);
  return true;
}
export function drawGapWeapon(g,p,action,phase) {
  if(!p.weapon?.startsWith('gap')) return false;
  const {line,poly,oval}=pens(g), skin='#be9976';
  const arm=pts=>{line(INK,3.4,pts);line(p.cloth,2.5,pts);const [x,y]=pts.at(-1);oval(skin,x,y,1.1,1.1);};
  if(p.weapon==='gapKopis') {
    const pose=weaponMotion(p.weapon,action,phase), hx=8+pose.x,hy=-18+pose.y;
    arm([[3,-20],[6,-15],[hx,hy]]); arm([[-3,-20],[-5,-14],[0,-12]]);
    g.save();g.translate(hx,hy);g.rotate(pose.angle);
    line('#735336',1.8,[[0,3],[0,-3]]);line(BRONZE,1,[[-2,-3],[2,-3]]);
    poly(STEEL,[[-.7,-3],[-1.4,-10],[-.5,-17],[3,-22],[3.8,-17],[2.3,-10],[.8,-3]]);
    line('#e0e2cc',.6,[[.8,-4],[2.3,-11],[3.5,-17],[3,-21]]);g.restore();
  } else {
    const firing=action==='attack', released=firing&&phase>=.5, draw=firing&&!released?Math.sin(phase*Math.PI):0;
    const recoil=released?-Math.sin((phase-.5)*Math.PI*2)*1.6:0;
    arm([[-3,-20],[2,-15],[7+recoil,-16]]); arm([[3,-20],[8,-19],[15+recoil,-19]]);
    g.save();g.translate(recoil,0);
    line('#725333',2.6,[[1,-14],[21,-21]]);
    const steel=p.weapon==='gapSteelCrossbow', song=p.weapon==='gapSongCrossbow';
    const top=song?-32:-30,bottom=song?-8:-10;
    line(steel?STEEL:'#b69b65',steel?1.2:1.6,[[17,top],[21,-25],[22,-21],[21,-16],[17,bottom]]);
    line('#d3c9a6',.5,[[17,top],[released?20:10-draw,-17],[17,bottom]]);
    if(!released) {line('#dbcda6',.7,[[8,-16.5],[26,-23]]);poly(STEEL,[[25,-24],[29,-24],[26,-21.8]]);}
    // Stirrup at the stock nose; visible belt hooks are on the Hussite vest.
    line(STEEL,.75,[[21,-22],[25,-23],[26,-21],[22,-19]]);
    line('#c9af73',.9,[[7,-16],[8,-14]]);g.restore();
  }
  return true;
}
