import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK = '#30332b', IRON = '#929b91', BRONZE = '#b39b64';
function pens(g) {
  const path = pts => { g.beginPath(); pts.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); };
  const line = (c,w,pts) => { path(pts); g.strokeStyle=c; g.lineWidth=w; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
  const poly = (c,pts) => { path(pts); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.55; g.stroke(); };
  const oval = (c,x,y,rx,ry) => { g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fillStyle=c; g.fill(); };
  return { line, poly, oval };
}
export function drawUnderrepresentedShield(g,p) {
  if(p.shield!=='urgCaneShield') return false;
  const {line,oval}=pens(g);
  oval(INK,0,0,8.5,8.5); oval('#9f8456',0,0,8,8);
  for(let r=2;r<8;r+=1.3) { g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.strokeStyle='#d1b17a';g.lineWidth=.55;g.stroke(); }
  for(let a=0;a<Math.PI*2;a+=Math.PI/4) line('#505a53',1.1,[[Math.cos(a)*2,Math.sin(a)*2],[Math.cos(a)*7.5,Math.sin(a)*7.5]]);
  oval(IRON,0,0,2,2); return true;
}
export function drawUnderrepresentedArmor(g,p) {
  if(!p.armor?.startsWith('urg')) return false;
  const {line,poly,oval}=pens(g), c=p.cloth,skin=p.skin;
  if(p.armor==='urgTurkLamellar'||p.armor==='urgTibetLamellar') {
    const tibet=p.armor==='urgTibetLamellar';
    poly(c,[[-5,-23],[5,-23],[6,-16],[5,-11],[7,-3],[1,-3],[0,-7],[-2,-3],[-7,-3],[-5,-13]]);
    poly(tibet?'#545c53':'#636d68',[[-5,-23],[5,-23],[5,-11],[6,-6],[-6,-6],[-5,-12]]);
    for(let y=-21;y<=-8;y+=3) for(let x=-3.5;x<5;x+=2.5) {
      poly(tibet?'#84846e':'#a0a69a',[[x-1,y-1],[x+1,y-1],[x+1,y+1],[x-1,y+1]]);
      line('#d1b581',.5,[[x-.5,y-.7],[x+.5,y+.7]]);
    }
    line('#81523b',1.7,[[-5,-12],[5,-12]]);
    if(tibet) { poly('#927d53',[[-7,-23],[-3,-24],[-3,-19],[-7,-18]]);poly('#927d53',[[3,-24],[7,-23],[7,-18],[3,-19]]); }
    else { poly('#a1a99d',[[-6,-24],[-2,-24],[-3,-21],[-7,-21]]); line('#d3c09a',.8,[[-6,-4],[-2,-4],[0,-7],[2,-4],[6,-4]]); }
  } else if(p.armor==='urgBellTunic') {
    poly(c,[[-5,-23],[5,-23],[5,-12],[7,-4],[-7,-4],[-5,-12]]);
    for(let y=-20;y<=-7;y+=4) for(let x=-3;x<=3;x+=3) {
      poly('#bd9b61',[[x,y-1],[x+1,y+1],[x-1,y+1]]);oval('#4e4333',x,y+1,.4,.4);
    }
    line('#715439',1.7,[[4,-23],[-4,-10]]);line('#c27856',2,[[-3,-23],[0,-21],[3,-23]]);
    poly('#60462f',[[-5,-12],[-7,-5],[-6,-2],[-4,-5],[-3,-12]]);
  } else if(p.armor==='urgBackflapTunic') {
    poly(BRONZE,[[-5,-13],[-10,-10],[-9,-4],[-4,-5]]);
    for(let x=-9;x<=-5;x+=2) poly('#cfb16c',[[x,-4],[x+1,-2],[x-1,-2]]);
    poly(c,[[-5,-23],[5,-23],[6,-12],[-5,-12]]);
    poly('#984f3c',[[-3,-12],[3,-12],[2,-3],[-2,-3]]);
    line('#d6b77a',1.5,[[-5,-12],[5,-12]]);
    for(let x=-4;x<=4;x+=2) poly(BRONZE,[[x-1,-13],[x+1,-13],[x,-10]]);
    line('#6a5438',1,[[-4,-22],[4,-22]]);
  } else if(p.armor==='urgKermaWrap') {
    poly(skin,[[-4,-23],[4,-23],[5,-19],[3,-12],[-3,-12],[-5,-19]]);
    line('#b0855c',.6,[[-3,-19],[0,-18],[3,-19]]);
    poly(c,[[-4,-12],[4,-12],[5,-4],[-5,-4]]);
    poly('#e0cba1',[[-3,-12],[3,-11],[1,-3],[-2,-4]]);
    line('#77583e',1.2,[[-4,-12],[4,-12]]);
    line('#9b825c',.6,[[-3,-10],[-4,-5]]);
  } else {
    poly(c,[[-6,-23],[4,-23],[6,-20],[4,-12],[6,-5],[1,-3],[-5,-5],[-4,-13]]);
    line('#d1ad73',1.2,[[1,-23],[-2,-17],[-1,-6]]);
    line('#5c4532',1.5,[[-4,-13],[4,-13]]);
    for(let y=-21;y<-7;y+=3) { oval('#c4a36e',-3,y,.55,.6); oval('#c4a36e',3,y,.55,.6); }
    poly('#69513a',[[-5,-12],[-6,-4],[-4,-3],[-3,-11]]);
  }
  return true;
}
export function drawUnderrepresentedHead(g,p) {
  if(!p.head?.startsWith('urg')) return false;
  const {line,poly,oval}=pens(g),skin=p.skin;
  oval(skin,.5,-24,3,3.5);poly(skin,[[2,-25],[4,-23.5],[3,-23],[3,-21],[0,-20.5]]);
  if(p.head==='urgTurkHelm'||p.head==='urgTibetHelm') {
    const tibet=p.head==='urgTibetHelm';
    poly('#686e61',[[-5,-27],[-5,-21],[-3,-19],[-2,-26]]);
    poly(IRON,[[-5,-27],[-4,-31],[0,tibet?-34:-33],[3,-31],[4,-27]]);
    for(let x=-2;x<=2;x+=2) line('#525d57',.6,[[0,-33],[x,-30],[x*1.5,-27]]);
    line('#c4b37b',1,[[-5,-27],[4,-27]]);
    if(tibet) {oval(BRONZE,0,-34,1,1);line('#71523d',1,[[0,-35],[-2,-37]]);}
    else { poly('#9ba398',[[-4,-26],[-2,-26],[-2,-22],[-4,-22]]);line('#514032',1,[[1,-22],[3,-22.5]]); }
  } else if(p.head==='urgBeninHelm') {
    for(const x of [-4,3]) { line('#322c27',1.8,[[x,-27],[x,-22],[x-1,-19]]);oval(BRONZE,x-1,-19,1,1.4); }
    poly('#8a8970',[[-5,-27],[-4,-30],[-2,-32],[1,-32],[4,-30],[5,-27]]);
    oval(BRONZE,0,-32.5,1.3,1.3);line('#bdb185',.8,[[-4,-27],[4,-27]]);
  } else if(p.head==='urgSteppedCrescent') {
    poly('#825e3c',[[-4,-27],[-4,-30],[3,-30],[4,-27]]);
    for(const s of [-1,1]) poly(BRONZE,[[s*3,-29],[s*3,-32],[s*5,-32],[s*5,-35],[s*7,-35],[s*7,-28]]);
    // Crescent cutout follows the ornament; the stepped sides separate it from the mace warrior.
    poly('#c7ac65',[[-4,-35],[-2,-32],[0,-31],[2,-32],[4,-35],[3,-30],[0,-29],[-3,-30]]);
    line('#ad8f55',.7,[[-3,-27],[-2,-21],[2,-21],[3,-27]]);
    oval(BRONZE,-3,-24,1.6,1.6);oval('#5e4b35',-3,-24,.7,.7);
  } else if(p.head==='urgKermaHair') {
    oval('#312c26',-.4,-28,3.7,2.3);
    for(const[x,y]of[[-3,-27],[-2,-29],[0,-30],[2,-29],[-3,-25]]) oval('#41382b',x,y,1.1,1);
  } else {
    poly('#b39463',[[-5,-27],[-3,-32],[-1,-38],[1,-35],[4,-27]]);
    poly('#9b7b4e',[[-5,-27],[-4,-23],[-2,-23],[-2,-27]]);
    line('#d2b782',.9,[[-4,-27],[3,-27]]);
  }
  oval(INK,2.5,-24,.4,.4);return true;
}
export function drawUnderrepresentedWeapon(g,p,action,phase) {
  if(!p.weapon?.startsWith('urg')) return false;
  const {line,poly,oval}=pens(g);
  const dart=p.weapon==='urgAtlatlJavelin', attacking=action==='attack';
  const pose=dart ? {angle:attacking?-.8+Math.sin(Math.PI*phase)*2.2:.3,x:attacking?Math.sin(Math.PI*phase)*3:0,y:attacking?-5:0} : weaponMotion(p.weapon,action,phase,p.weapon==='urgLance'?.8:.2);
  if(p.weapon==='urgLance'&&(action==='charge'||action==='charge-ready')) pose.angle=1.4;
  const hx=7+pose.x,hy=-17+pose.y;
  g.save();g.translate(hx,hy);g.rotate(pose.angle);
  if(p.weapon==='urgLance') {
    line('#876342',1.6,[[0,12],[0,-29]]);poly(IRON,[[-1.4,-29],[0,-35],[1.4,-29],[0,-27]]);
    line('#d2bd91',.7,[[-1,-27],[1,-26],[-1,-25]]);
  } else if(p.weapon==='urgRalSword') {
    poly('#bac1ae',[[-1.1,0],[-1,-20],[.5,-23],[1.6,-20],[1.6,0]]);
    line('#e1dcc6',.5,[[.7,-1],[.7,-20]]);line(BRONZE,1.3,[[-2,0],[3,0]]);line('#72543a',1.9,[[0,1],[0,5]]);oval(BRONZE,0,5,1.4,1);
  } else if(p.weapon==='urgSagarisAxe') {
    line('#8a6845',2,[[0,5],[0,-22]]);
    poly('#969e91',[[-4,-20],[0,-21],[4,-23],[5,-18],[1,-18],[-4,-19]]);
    line('#d1d3be',.6,[[4,-22],[4.7,-18.5]]);
  } else if(p.weapon==='urgDagger') {
    poly(BRONZE,[[-1.8,-1],[-1.4,-10],[0,-17],[1.4,-10],[1.8,-1]]);
    line('#debd7e',.6,[[0,-2],[0,-15]]);line('#513c2b',2,[[0,0],[0,4]]);oval('#d4bf91',0,4.5,2,1.3);
  } else {
    line('#86613b',2,[[0,3],[0,-9],[-1,-10]]);
    if(!attacking||phase<.5||phase>.875) {
      line('#c6aa70',1.1,[[1,-8],[1,-32]]);poly('#8b9282',[[0,-32],[1,-36],[2,-32]]);
      line('#d2bc89',1.5,[[1,-9],[3,-11]]);
    }
  }
  g.restore();
  const arm=pts=>{line(INK,3.1,pts);line(p.armor==='urgSakaCoat'?p.cloth:p.skin,2.2,pts);const[x,y]=pts.at(-1);oval(p.skin,x,y,1.1,1.1);};
  arm([[3,-20],[5,-14],[hx,hy]]);arm([[-3,-20],[-5,-15],[-6,-13]]);return true;
}
