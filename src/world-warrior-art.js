import { weaponMotion } from './crown-battle-weapon-motion.js';
// Equipment silhouettes for the world-warrior set. Rendered only into cached sprites.
const INK = '#242b29', STEEL = '#aebcba';
function pens(g) {
  const path = pts => { g.beginPath(); pts.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); };
  const line = (c,w,pts) => { path(pts); g.strokeStyle=c; g.lineWidth=w; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
  const poly = (c,pts) => { path(pts); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.55; g.stroke(); };
  const oval = (c,x,y,rx,ry) => { g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.45; g.stroke(); };
  return {line,poly,oval};
}
function plates(g, x,y,w,h,colour,step=2) {
  const {line,poly}=pens(g);
  for(let yy=y;yy<y+h;yy+=2.5)for(let xx=x;xx<x+w-.5;xx+=step){
    poly(colour,[[xx,yy],[xx+step-.2,yy],[xx+step-.2,yy+2.1],[xx,yy+2.1]]);
    line('#d0b58a',.35,[[xx+.5,yy+.4],[xx+.5,yy+1]]);
  }
}
export function drawWorldArmor(g,p,gait=0) {
  const {line,poly,oval}=pens(g),c=p.cloth,skin=p.skin||'#be9976';
  switch(p.armor){
    case 'mocheTunic':
      poly('#c49665',[[-6,-10],[-8,-3],[-3,-2],[-2,-10]]);
      poly('#d5b17b',[[-5,-22],[4,-22],[6,-7],[-6,-7]]);
      poly(c,[[-5,-22],[4,-22],[5,-17],[-5,-17]]);
      line('#4d4331',1,[[-5,-8],[5,-8]]);line('#6c5035',.9,[[-4,-15],[4,-15]]);
      break;
    case 'scythianJacket':
      poly(c,[[-4,-22],[3,-22],[5,-15],[5,-6],[0,-5],[-1,-8],[-2,-5],[-5,-7],[-4,-15]]);
      line('#d4b887',1,[[-2,-21],[1,-17],[0,-8]]);
      line('#69462e',1.6,[[-4,-13],[4,-13]]);
      for(const y of [-19,-16,-10])line('#e2cda2',.6,[[-3,y],[-2,y+1],[-1,y]]);
      break;
    case 'qinPlates':
      poly(c,[[-5,-22],[4,-22],[6,-5],[-6,-5]]);
      plates(g,-4,-21,8,10,'#666f66',2.5);
      plates(g,-5,-11,10,5,'#72796b',2.5);
      poly('#777d70',[[-6,-22],[-3,-22],[-3,-18],[-6,-18]]);
      poly('#777d70',[[3,-22],[6,-22],[6,-18],[3,-18]]);
      line('#ae9272',.8,[[-4,-13],[4,-13]]);
      break;
    case 'thracianZeira':
      // Spare javelins behind the pelta, separate from the throwing arm.
      for(const x of [-8,-5.5]) {
        line('#9d7d4e',1.1,[[x,-3],[x,-28]]);
        poly(STEEL,[[x-1,-28],[x,-32],[x+1,-28]]);
      }
      poly('#d6c29b',[[-4,-22],[4,-21],[5,-7],[-5,-7]]);
      poly('#a45b44',[[-5,-22],[1,-20],[-2,-12],[-7,-3],[-10,-5],[-9,-15]]);
      for(const y of [-18,-12,-6]){
        line('#e4c48c',1,[[-8,y],[-5,y+1],[-3,y+2]]);
        line('#393d32',.65,[[-8,y-2],[-7,y-3],[-6,y-2],[-5,y-3],[-4,y-2]]);
      }
      for(const [x,d] of [[-2.7,-1],[2.8,1]]){const dx=gait*d*2.7;line('#79563b',3,[[x+dx,-5],[x+dx*.8,-1]]);line('#b29867',.6,[[x+dx-1,-5],[x+dx+1,-3],[x+dx*.8-1,-2]]);}
      break;
    case 'dacianTunic':
      poly('#c5b797',[[-4,-22],[4,-21],[4,-14],[6,-6],[-6,-6],[-4,-14]]);
      poly(c,[[-4,-22],[-1,-21],[0,-13],[-4,-11]]);
      line('#67513b',1.5,[[-4,-12],[4,-12]]);line('#786d56',.6,[[0,-20],[0,-13]]);
      break;
    case 'swissCorselet':
      poly(c,[[-5,-22],[4,-22],[5,-8],[-5,-8]]);
      poly('#a6b4ac',[[-4,-22],[3,-22],[5,-18],[3,-11],[-3,-11],[-5,-18]]);
      line('#d6ded0',.8,[[0,-21],[1,-17],[0,-12]]);
      for(const y of [-11,-9])poly('#8e9b96',[[-4,y],[4,y],[4.5,y+1.7],[-4.5,y+1.7]]);
      for(const [x,d,c] of [[-2.7,-1,'#8b3f36'],[2.8,1,'#c4bba2']])line(c,2.5,[[x,-8],[x+gait*d*2.7,-4],[x+gait*d*2.16,-1]]);
      break;
    case 'tibetanLamellar':
      poly('#716151',[[-5,-22],[4,-22],[8,-5],[1,-4],[0,-10],[-1,-4],[-7,-5]]);
      plates(g,-4,-21,8,10,'#646d64',1.7);
      plates(g,-5,-11,10,5,'#6d7166',1.7);
      plates(g,-7,-21,3,5,'#70786c',1.5);plates(g,4,-21,3,5,'#70786c',1.5);
      line('#b49b72',1,[[-5,-6],[-1,-5],[0,-10],[1,-5],[6,-6]]);
      line('#9d754c',1.3,[[-4,-13],[4,-13]]);
      break;
    case 'mixtecWrap':
      poly(skin,[[-4,-22],[3,-22],[5,-17],[3,-10],[-4,-10],[-5,-17]]);
      poly('#e6d0a0',[[-4,-13],[4,-13],[4,-8],[-4,-8]]);
      poly('#a04c37',[[-1,-12],[2,-12],[3,-4],[-1,-4]]);
      line('#e7c578',.8,[[0,-11],[0,-5],[2,-5]]);
      for(let x=-3;x<4;x+=1.5)oval('#5f9b8f',x,-20,1,.8);
      break;
    case 'nubianKilt':
      poly(skin,[[-4,-22],[3,-22],[5,-17],[3,-10],[-4,-10],[-5,-17]]);
      line('#ab7852',.5,[[-2,-18],[0,-17],[2,-18]]);
      poly('#c39363',[[-4,-12],[4,-12],[5,-6],[-5,-6]]);
      poly('#984f35',[[-4,-12],[4,-12],[1,-7],[-1,-7]]);
      line('#dfbf87',.8,[[-4,-12],[4,-12]]);
      break;
    default:return false;
  }
  return true;
}
export function drawWorldHead(g,p) {
  const {line,poly,oval}=pens(g),h=p.head;
  if(!['mocheCrescent','scythianCap','qinKnot','thracianCap','dacianCap','tibetanHelm','mixtecBand','nubianCurls'].includes(h))return false;
  const skin=p.skin||'#be9976';
  oval(skin,0,-24.2,3.2,3.8);poly(skin,[[1,-26],[3,-25],[4.4,-23.5],[3,-23],[3,-21],[0,-21]]);
  if(h==='mocheCrescent'){
    poly('#b3945a',[[-4,-26],[0,-33],[4,-26]]);
    // A crescent finial above the cone, not two horns on a helmet.
    poly('#c5a465',[[-6,-36],[-3,-33],[0,-32],[3,-33],[6,-36],[4,-31],[0,-30],[-4,-31]]);
    line('#68513a',.8,[[-3,-26],[-2,-21],[2,-20],[3,-25]]);
  }else if(h==='scythianCap'){
    poly('#bd9661',[[-4,-25],[-4,-29],[-6,-32],[-9,-31],[-11,-32],[-9,-34],[-5,-35],[-1,-33],[2,-30],[4,-26],[1,-25],[0,-21],[-3,-21]]);
    line('#e6c695',.7,[[-8,-33],[-5,-33],[-2,-31],[0,-28]]);
  }else if(h==='qinKnot'){
    poly('#32392f',[[-3,-23],[-4,-27],[-2,-29],[2,-28],[3,-26],[-1,-26],[-1,-23]]);
    oval('#30382e',-2.5,-30,1.8,2.3);line('#956e4a',.7,[[-4,-30],[-1,-30]]);
  }else if(h==='thracianCap'){
    poly('#8e6f4a',[[-4,-24],[-5,-28],[-2,-31],[1,-31],[4,-27],[4,-25],[0,-26],[-1,-22],[-4,-20]]);
    line('#d7c196',.8,[[-4,-26],[0,-28],[3,-26]]);
  }else if(h==='dacianCap'){
    poly('#807759',[[-4,-26],[-3,-30],[0,-32],[3,-31],[1,-29],[4,-26]]);
    poly('#67513d',[[-3,-24],[-2,-20],[0,-19],[3,-21],[2,-22],[0,-21],[-1,-24]]);
  }else if(h==='tibetanHelm'){
    poly('#89968a',[[-4,-26],[-3,-30],[0,-33],[3,-30],[4,-26]]);
    for(const x of [-2,0,2])line('#c5c7aa',.5,[[0,-32],[x,-27]]);
    oval('#ae9464',0,-33.5,.8,1);
    plates(g,-4,-26,3,6,'#69776c',1.5);line('#ceba87',.6,[[-4,-26],[4,-26]]);
  }else if(h==='mixtecBand'){
    poly('#35372e',[[-4,-22],[-4,-28],[0,-30],[3,-28],[2,-25],[-1,-25],[-2,-21]]);
    line('#c6a65a',1.8,[[-4,-26],[3,-26]]);
    oval('#639c8b',-3,-23,1.5,1.8);oval('#d4b66b',-3,-23,.65,.85);
    for(const [x,y] of [[-4,-35],[-1,-37],[2,-34]]){line('#e4c58a',.65,[[-2,-28],[x,y]]);line('#5b8e70',1.8,[[x,y],[x+.3,y+4]]);}
  }else if(h==='nubianCurls'){
    oval('#282e28',-1,-27,3.3,2.2);
    for(let y=-29;y<=-26;y+=1.3)for(let x=-3;x<=1;x+=1.3)oval('#3b382d',x,y,.65,.65);
  }
  line(INK,.55,[[1.6,-24],[2.5,-24]]);
  return true;
}
export function drawWorldShield(g,p) {
  const {line,poly,oval}=pens(g);
  if(p.shield==='pelta'){
    // Crescent notch and rounded wicker body, rather than a heater-shield outline.
    g.beginPath(); g.moveTo(-6,-6);
    g.quadraticCurveTo(0,1,6,-6);
    g.bezierCurveTo(9,1,6,6,0,6);
    g.bezierCurveTo(-6,6,-9,1,-6,-6);
    g.closePath(); g.fillStyle='#b6965d'; g.fill();
    g.strokeStyle=INK; g.lineWidth=.6; g.stroke();
    g.beginPath(); g.moveTo(-5,-4);
    g.quadraticCurveTo(0,2,5,-4);
    g.bezierCurveTo(7,1,5,5,0,5);
    g.bezierCurveTo(-5,5,-7,1,-5,-4);
    g.strokeStyle='#ead49f'; g.lineWidth=.8; g.stroke();
    line('#655437',.7,[[-2,-1],[0,2],[2,-1]]);
  }else if(p.shield==='mocheSmall'){
    oval('#b39a62',0,0,3.4,3.6);oval('#d6be88',0,0,2.6,2.8);
    line('#734d31',1,[[0,-2],[0,2]]);
  }else if(p.shield==='mixtecDisk'){
    oval('#dfc181',0,0,4.7,4.7);oval('#91523e',0,0,3.8,3.8);
    oval('#d7b35c',0,0,2.4,2.4);oval('#567e73',0,0,1.2,1.2);
    for(const x of [-2,0,2])line('#d6c89c',1,[[x,4],[x,6.5]]);
  }else return false;
  return true;
}
export function drawWorldWeapon(g,p,action,phase,team) {
  const w=p.weapon;
  if(!['crossbow','falx','halberd','mocheMace','mixtecAxe','tibetanSword'].includes(w))return false;
  const {line,poly,oval}=pens(g),skin=p.skin||'#be9976',attack=action==='attack'?Math.sin(phase*Math.PI):0;
  const pose=weaponMotion(p.weapon,action,phase,.2),hx=9+pose.x,hy=-19+pose.y;
  const arm=(pts)=>{line(INK,3.5,pts);line(['mocheTunic','mixtecWrap'].includes(p.armor)?skin:p.cloth,2.8,pts);const [x,y]=pts.at(-1);oval(skin,x,y,1.15,1.15);};
  if(w==='crossbow'){
    const released=action==='attack'&&phase>=.5;
    arm([[-2,-19],[1,-15],[8,-18]]);arm([[3,-19],[7,-15],[16,-18]]);
    line('#694b32',2.4,[[3,-16],[24,-19]]);line('#b49a68',.7,[[6,-17],[23,-19]]);
    // Transverse bow, stock and bronze trigger: held horizontally in both hands.
    line('#a38a57',1.5,[[17,-24],[22,-23],[24,-20],[26,-17],[27,-14]]);
    line('#e1d0a3',.45,[[17,-24],[released?22:10,-18],[27,-14]]);
    poly('#af9560',[[7,-17],[10,-17],[10,-15],[8,-15]]);
    if(!released){line('#ddc79d',.7,[[10,-18],[24,-20]]);poly('#8b9b95',[[24,-21],[27,-20.5],[24,-19]]);}
  }else{
    const two=w==='falx'||w==='halberd';
    arm([[3,-19],[7,-15],[hx,hy]]);if(two)arm([[-2,-19],[2,-13],[hx-Math.sin(pose.angle)*4,hy+Math.cos(pose.angle)*4]]);
    g.save();g.translate(hx,hy);g.rotate(pose.angle);
    if(w==='falx'){
      line('#805d39',1.9,[[0,8],[0,-12]]);
      poly('#aab6ae',[[-.9,-12],[-.7,-22],[1,-27],[5,-31],[9,-32],[6,-28],[3,-24],[1,-12]]);
      line('#e3e3cf',.65,[[1,-12],[3,-24],[6,-28],[9,-32]]);
    }else if(w==='halberd'){
      line('#8c6b42',1.6,[[0,10],[0,-29]]);
      poly(STEEL,[[-1,-25],[0,-34],[1,-25]]);
      poly('#929e99',[[0,-26],[4,-27],[8,-29],[8,-19],[4,-20],[1,-22],[0,-22]]);
      poly('#aeb7aa',[[0,-25],[-5,-24],[-6,-20],[-3,-22],[0,-22]]);
      line('#e4e3cc',.65,[[8,-29],[8,-19]]);
    }else if(w==='mocheMace'){
      line('#795536',1.8,[[0,4],[0,-15]]);oval('#9c957c',0,-15,2.6,3.1);
      line('#ded1ac',.65,[[-1,-17],[-1,-13]]);
    }else if(w==='mixtecAxe'){
      line('#8c613c',1.7,[[0,5],[0,-17]]);
      poly('#90947b',[[0,-16],[5,-19],[7,-18],[7,-12],[4,-11],[0,-14]]);
      line('#d1c7a0',.7,[[7,-18],[7,-12]]);line('#c3a16a',.8,[[-1,-16],[1,-14],[-1,-14]]);
    }else{
      line('#795538',1.5,[[0,4],[0,-2]]);line('#ba9a68',1,[[-2,-2],[2,-2]]);
      poly(STEEL,[[-1,-3],[-1,-20],[.7,-22],[1,-3]]);line('#e4dfcb',.5,[[.7,-3],[.5,-20]]);
    }
    g.restore();
  }
  line(team?'#dc7764':'#64b7cb',1.4,[[3,-19],[4,-17]]);
  return true;
}
