import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK = '#30362e', STEEL = '#a6b3ac', BRONZE = '#b7a16a';
function pens(g) {
  const path = pts => { g.beginPath(); pts.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); };
  const line = (c,w,pts) => { path(pts); g.strokeStyle=c; g.lineWidth=w; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
  const poly = (c,pts) => { path(pts); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.55; g.stroke(); };
  const oval = (c,x,y,rx,ry) => { g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fillStyle=c; g.fill(); };
  return { line, poly, oval };
}
export function drawRosterGapShield(g,p) {
  if(p.shield!=='wrgAndeanShield') return false;
  const {poly,line}=pens(g);
  poly('#896440',[[-4.5,-5],[3,-5],[4,3],[0,6],[-4,3]]);
  line('#c9ac74',.7,[[-3,-4],[-3,2],[0,4],[2.7,2],[2,-4]]);
  line('#b65536',2,[[-3,-1],[3,-1]]);
  return true;
}
export function drawRosterGapArmor(g,p) {
  if(!p.armor?.startsWith('wrg')) return false;
  const {poly,line,oval}=pens(g), c=p.cloth, skin=p.skin||'#be9976';
  if(p.armor==='wrgCottonVest') {
    poly(c,[[-5,-22],[4,-22],[4,-12],[-4,-12]]);
    for(let y=-20;y<-12;y+=2) line('#998b69',.6,[[-4,y],[4,y]]);
    for(let x=-3;x<4;x+=2) line('#a79876',.45,[[x,-21],[x,-12]]);
    poly('#d6c89e',[[-4,-12],[4,-12],[4,-7],[-4,-7]]);
    poly('#e3d4ad',[[-1,-10],[2,-10],[2,-3],[-2,-3]]);
    line('#88513b',1.1,[[-4,-12],[4,-12]]);
  } else if(p.armor==='wrgLoincloth') {
    poly(skin,[[-4,-22],[3,-22],[5,-18],[3,-11],[-4,-11],[-5,-17]]);
    line('#8d6249',.5,[[-3,-19],[0,-18],[3,-19]]);
    poly('#ddd0a2',[[-4,-12],[4,-12],[4,-8],[-4,-8]]);
    poly(c,[[-2,-10],[2,-10],[3,-3],[-1,-4]]);
    line('#8b5035',1.1,[[-4,-11],[4,-11]]);
    line('#c5b890',.7,[[-4,-22],[5,-12]]);
    poly('#78583c',[[3,-13],[7,-12],[8,-6],[4,-5],[2,-8]]);
    oval('#b3a58a',5,-11,1.4,1);
  } else if(p.armor==='wrgArcherJack'||p.armor==='wrgRidingJack') {
    const rider=p.armor==='wrgRidingJack';
    if(!rider) poly('#536451',[[-5,-22],[-8,-19],[-10,-5],[-3,-6],[1,-14]]);
    poly(c,[[-5,-22],[4,-22],[5,-13],[6,rider?-7:-4],[1,rider?-7:-3],[0,-8],[-2,rider?-6:-3],[-6,rider?-8:-5],[-4,-14]]);
    for(let x=-3;x<=3;x+=1.5) line('#b4a589',.55,[[x,-20],[x+.5,-8]]);
    for(let y=-19;y<-8;y+=3) line('#675e47',.45,[[-4,y],[4,y]]);
    line('#624b35',1.3,[[-4,-12],[4,-12]]);
    if(rider) {
      poly('#777d70',[[-6,-22],[-3,-23],[-2,-18],[-6,-18]]);
      line('#bebc9d',.7,[[-5,-21],[-3,-21]]);
      line('#6d5238',2,[[-4,-12],[-7,-4]]);
    } else {
      poly('#b3a68a',[[-5,-23],[-3,-20],[3,-21],[4,-23],[0,-24]]);
      poly('#806143',[[4,-12],[7,-12],[7,-4],[4,-5]]);
    }
  } else if(p.armor==='wrgUncu') {
    poly('#dfd1a5',[[-6,-22],[5,-22],[6,-5],[-6,-5]]);
    for(let y=-18,row=0;y<-5;y+=3,row++) for(let x=-5,col=0;x<5;x+=2.5,col++) if((row+col)%2===0) {
      g.fillStyle='#453d31';g.fillRect(x,y,2.5,Math.min(3,-5-y));
    }
    poly('#a75035',[[-6,-22],[5,-22],[0,-14]]);
    line('#cab17c',.6,[[-5,-21],[0,-15],[4,-21]]);
    line('#80623f',.7,[[-5,-6],[5,-6]]);
  } else if(p.armor==='wrgTangCuirass') {
    poly(c,[[-5,-23],[4,-23],[6,-7],[-6,-7]]);
    for(const s of [-1,1]) {
      poly('#77817a',[[s*.5,-22],[s*4,-23],[s*5,-15],[s*.7,-14]]);
      line('#c3c5a5',.7,[[s*1.5,-21],[s*3,-21],[s*3.8,-16]]);
      poly('#68776d',[[s*.5,-13],[s*5,-14],[s*8,-4],[s*2,-2]]);
      for(let y=-11;y<-3;y+=2) line('#a7ad93',.55,[[s*2,y],[s*(6+(y+10)*.15),y-1]]);
      poly('#828c7b',[[s*3,-23],[s*7,-22],[s*8,-17],[s*5,-16]]);
    }
    for(let y=-21;y<-14;y+=2) line('#d3bd8c',.65,[[-1,y],[1,y+1]]);
    line('#b69a68',1.3,[[-5,-13],[5,-13]]);
  }
  return true;
}
export function drawRosterGapHead(g,p) {
  if(!p.head?.startsWith('wrg')) return false;
  const {poly,line,oval}=pens(g), skin=p.skin||'#be9976';
  oval(skin,.5,-24,3,3.5); poly(skin,[[2,-25],[4,-23.5],[3,-23],[3,-21],[0,-20.5]]);
  if(p.head==='wrgBoundHair') {
    poly('#37352d',[[-4,-23],[-5,-28],[-2,-30],[2,-29],[3,-26],[0,-27],[-2,-26],[-2,-23]]);
    oval('#37352d',-4,-30,2.2,2.3);line('#c7b087',.85,[[-6,-29],[-3,-28]]);
  } else if(p.head==='wrgHeadband') {
    poly('#3f372b',[[-4,-23],[-4,-29],[0,-30],[3,-28],[3,-26],[-2,-26],[-2,-22]]);
    line('#c7ae76',1.4,[[-4,-27],[3,-27]]);
    poly('#c7ae76',[[-4,-27],[-7,-24],[-6,-20],[-4,-23]]);
  } else if(p.head==='wrgCoif') {
    poly('#b9b39c',[[-5,-24],[-4,-29],[-1,-31],[2,-30],[4,-27],[1,-27],[-1,-25],[-1,-22],[-3,-20],[-5,-21]]);
    line('#e0d7b9',.6,[[-3,-28],[-1,-30],[1,-29]]);
    line('#b9b39c',.65,[[-1,-22],[1,-20],[3,-21]]);
  } else if(p.head==='wrgIronCap') {
    poly(STEEL,[[-5,-26],[-4,-29],[-2,-31],[1,-31],[3,-29],[4,-26]]);
    line('#d6d7be',.7,[[-4,-26],[4,-26]]);
    line('#716f5a',.7,[[-3,-25],[-1,-21],[2,-21],[3,-24]]);
  } else if(p.head==='wrgAndeanCap') {
    poly('#88744f',[[-5,-26],[-4,-30],[-1,-32],[2,-31],[4,-26]]);
    line('#c2a373',1.1,[[-4,-27],[3,-27]]);
    poly('#9d764e',[[-5,-26],[-3,-25],[-3,-22],[-5,-22]]);
  } else if(p.head==='wrgTangHelmet') {
    poly('#66766b',[[-5,-23],[-5,-29],[-2,-32],[1,-33],[4,-29],[4,-26],[0,-26],[-2,-24],[-2,-19],[-5,-20]]);
    poly('#a7ad90',[[-2,-31],[0,-34],[1,-31],[1,-27],[-1,-27]]);
    line('#d0b47f',.8,[[-4,-26],[4,-26]]);
    for(let y=-24;y<-19;y+=1.5) line('#a2aa91',.5,[[-4.5,y],[-2.5,y]]);
  }
  oval(INK,2.5,-24,.4,.4);
  return true;
}
export function drawRosterGapWeapon(g,p,action,phase) {
  if(!p.weapon?.startsWith('wrg')) return false;
  const {line,poly,oval}=pens(g), skin=p.skin||'#be9976';
  const arm=pts=>{line(INK,3.3,pts);line(p.bareLegs?skin:p.cloth,2.4,pts);const [x,y]=pts.at(-1);oval(skin,x,y,1.1,1.1);};
  if(p.weapon==='wrgSelfBow') {
    const released=action==='attack'&&phase>=.5;
    const draw=action==='attack'&&!released?Math.sin(phase*Math.PI)*5:0, nock=6-draw;
    arm([[3,-20],[8,-18],[13,-19]]);arm([[-3,-20],[0,-15],[nock,-20]]);
    g.beginPath();g.moveTo(10,-35);g.quadraticCurveTo(17,-19,10,-3);g.strokeStyle='#a77e4a';g.lineWidth=1.6;g.stroke();
    line('#d6c59a',.45,[[10,-35],[released?10:nock,-20],[10,-3]]);
    if(!released) {line('#bc9c6d',.7,[[nock,-20],[24,-20]]);poly('#504c40',[[24,-21],[27,-20],[24,-19]]);}
  } else {
    const long=p.weapon==='wrgLongSpear', len=long?35:25;
    const pose=weaponMotion(p.weapon,action,phase,.25), hx=7+pose.x,hy=-17+pose.y;
    g.save();g.translate(hx,hy);g.rotate(pose.angle);
    line('#886642',1.4,[[0,11],[0,-len]]);
    poly(long?STEEL:BRONZE,[[-1.3,-len],[0,-len-5],[1.3,-len],[0,-len+1]]);
    line('#d2c098',.65,[[0,-len-3],[0,-len+.5]]);g.restore();
    arm([[3,-20],[5,-14],[hx,hy]]);
    if(long) arm([[-3,-21],[-2,-15],[hx-Math.sin(pose.angle)*7,hy+Math.cos(pose.angle)*7]]);
    else arm([[-3,-20],[-5,-14],[-6,-13]]);
  }
  return true;
}
