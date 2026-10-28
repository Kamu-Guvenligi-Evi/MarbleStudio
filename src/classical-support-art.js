import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK='#30322b', METAL='#b9bdaf';
function pens(g) {
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.55;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();};
  return {line,poly,oval};
}
export function drawClassicalShield(g,p) {
  if(!p.shield?.startsWith('cs'))return false;
  const {line,poly,oval}=pens(g);
  if(p.shield==='csScutum') {
    oval(INK,0,0,6.9,12.4);oval('#a26d47',0,0,6.3,11.8);oval('#694e38',0,0,5.7,11.2);
    line('#bf9a66',1.2,[[0,-10],[0,10]]);oval('#9d9e88',0,0,2.4,3.4);oval('#c7c4a4',.5,-.5,1.2,1.8);
  } else if(p.shield==='csParma') {
    oval(INK,0,0,6.7,6.7);oval('#bf9c60',0,0,6.1,6.1);oval('#947647',0,0,5.4,5.4);
    for(const y of [-3,0,3])line('#b79558',.6,[[-4,y],[4,y]]);
    oval(METAL,0,0,1.9,1.9);oval('#797e6f',-.5,.5,.9,.9);
  } else {
    poly('#9b804f',[[-6,6],[-7,0],[-5,-6],[-2,-7],[-1,-3],[2,-3],[4,-7],[6,-5],[7,1],[5,6],[0,8]]);
    for(const y of [-1,1,3,5])line('#c7ae77',.6,[[-5,y],[5,y]]);
    line('#584734',1,[[-4,5],[-4,-2],[-2,-5]]);
  }
  return true;
}
export function drawClassicalArmor(g,p) {
  if(!p.armor?.startsWith('cs'))return false;
  const {line,poly,oval}=pens(g),c=p.cloth;
  if(p.armor==='csCuirass') {
    poly('#705750',[[-5,-24],[-11,-21],[-15,-7],[-6,-10],[1,-22]]);
    poly('#b0965e',[[-5,-23],[5,-23],[4,-18],[5,-13],[3,-10],[-4,-10],[-5,-14],[-4,-18]]);
    line('#dbc08a',.8,[[-3,-21],[0,-20],[3,-21]]);line('#786341',.7,[[0,-19],[0,-12]]);
    for(let x=-5;x<5;x+=2)poly('#bcad86',[[x,-11],[x+1.8,-11],[x+2.3,-6],[x-.4,-6]]);
    line('#695039',1.2,[[-5,-11],[5,-11]]);
  } else if(p.armor==='csMail') {
    poly(c,[[-5,-22],[5,-22],[5,-12],[7,-3],[-7,-3],[-5,-12]]);
    poly('#727d74',[[-5,-23],[5,-23],[7,-18],[4,-16],[5,-7],[-5,-7],[-4,-16],[-7,-18]]);
    for(let y=-21;y<-7;y+=1.7)for(let x=-3;x<=3;x+=1.8)line('#b3b5a0',.6,[[x,y],[x+.7,y+.7],[x+1.1,y]]);
    line('#64482f',1.7,[[-4,-12],[4,-12]]);
    for(const x of [-3,3])poly('#b29b68',[[x-1.5,-2],[x+1.5,-2],[x+1,5],[x-1,5]]);
  } else if(p.armor==='csCotton') {
    poly(p.skin,[[-4,-23],[4,-23],[5,-18],[3,-12],[-3,-12],[-5,-18]]);
    poly(c,[[-4,-23],[-1,-24],[4,-14],[2,-11],[-2,-17],[-4,-18]]);
    poly(c,[[-4,-13],[4,-13],[6,-3],[1,-1],[-2,-4],[-6,-3]]);
    line('#9b8d6a',1.1,[[-4,-12],[4,-12]]);line('#eee1c1',.8,[[0,-11],[2,-4],[0,-2]]);
    line('#826544',1.3,[[-3,-22],[4,-13]]);
    poly('#735b3b',[[-8,-22],[-5,-22],[-5,-9],[-8,-8]]);
    for(const x of [-7,-5.7]){line('#c5a366',.6,[[x,-18],[x,-26]]);line('#d3ceb1',1,[[x,-24],[x-.6,-26]]);}
  } else {
    if(p.armor==='csAgrianTunic')poly('#674e40',[[-5,-24],[-10,-20],[-10,-7],[-5,-10],[0,-22]]);
    poly(c,[[-5,-23],[4,-23],[7,-18],[4,-17],[4,-12],[7,-4],[-6,-4],[-4,-12],[-5,-17],[-7,-19]]);
    line('#6d5036',1.6,[[-4,-12],[4,-12]]);line('#d4c4a2',.8,[[-5,-5],[6,-5]]);
    if(p.armor==='csVelesTunic') {
      poly('#584633',[[-7,-13],[-5,-13],[-4,-4],[-6,-3]]);
      line('#9f8c66',.7,[[-7,-13],[-4,-13]]);
    }
  }
  return true;
}
export function drawClassicalHead(g,p) {
  if(!p.head?.startsWith('cs'))return false;
  const {line,poly,oval}=pens(g);
  oval(p.skin,0,-24,3,3.5);poly(p.skin,[[2,-25],[4,-23.5],[3,-23],[3,-21],[0,-21]]);
  if(p.head==='csTriplePlume') {
    poly('#aa925c',[[-4,-26],[-4,-29],[-2,-31],[2,-31],[4,-28],[4,-26]]);
    poly('#c3a96c',[[-4,-26],[-1,-26],[-1,-22],[-3,-21]]);
    for(const [x,top] of [[-2,-38],[0,-39],[2,-38]]){line('#5b4a30',.7,[[x,-30],[x,top+2]]);poly('#8d4d37',[[x-.6,top+4],[x-.7,top],[x+.3,top-1],[x+.8,top+2],[x+.5,top+5]]);}
    poly('#74685a',[[-2,-22],[0,-20],[3,-22],[2,-19],[-1,-19]]);
  } else if(p.head==='csWolfHood') {
    poly('#767467',[[-5,-22],[-5,-28],[-4,-32],[-2,-30],[0,-31],[2,-32],[3,-29],[5,-28],[5,-26],[1,-26],[-1,-27],[-3,-24],[-3,-20]]);
    poly('#b5ae94',[[-1,-29],[2,-29],[5,-27],[2,-26],[-1,-27]]);oval(INK,4.6,-27,.7,.5);oval(INK,1.5,-29,.5,.4);
    line('#d3c9ac',.6,[[-4,-28],[-4,-24]]);
  } else if(p.head==='csFeltCap') {
    poly('#9a7855',[[-4,-27],[-3,-31],[0,-32],[3,-30],[4,-27]]);
    line('#d0b88b',1.1,[[-4,-27],[4,-27]]);line('#4c4030',1,[[-3,-26],[-3,-22]]);
  } else if(p.head==='csBoeotian') {
    poly('#b49b64',[[-6,-25],[-5,-28],[-3,-31],[1,-32],[4,-30],[5,-27],[7,-25],[4,-24],[2,-26],[-1,-26],[-3,-24]]);
    line('#e0c58b',.8,[[-5,-26],[-2,-28],[2,-28],[5,-26]]);line('#6f5f3f',.7,[[-3,-24],[-2,-22]]);
  } else {
    poly('#302c25',[[-4,-23],[-4,-28],[-2,-30],[2,-30],[4,-27],[2,-26],[-1,-27],[-2,-23]]);
    oval('#302c25',-4,-28,1.7,2);line('#bb9e6a',.8,[[-4,-27],[-2,-27]]);
  }
  oval(INK,2.5,-24,.4,.4);return true;
}
export function drawClassicalWeapon(g,p,action,phase) {
  if(!p.weapon?.startsWith('cs'))return false;
  const {line,poly,oval}=pens(g);
  const arm=pts=>{line(INK,3,pts);line(p.skin,2.1,pts);const[x,y]=pts.at(-1);oval(p.skin,x,y,1.1,1.1);};
  if(p.weapon==='csCaneBow') {
    const pull=action==='attack'?Math.sin(phase*Math.PI)*5:1;
    line('#b09b5d',1.6,[[10,-34],[14,-29],[16,-21],[15,-13],[12,-7]]);
    for(const [x,y] of [[11.5,-32],[15,-25],[15.6,-18],[14,-10]])line('#6f6c3d',.7,[[x-1,y],[x+1,y]]);
    line('#ddd3b4',.65,[[10,-34],[10-pull,-21],[12,-7]]);
    if(action!=='attack'||phase<.625){line('#bca372',.8,[[7-pull,-21],[24,-21]]);poly(METAL,[[24,-22],[27,-21],[24,-20]]);}
    arm([[-3,-20],[3,-17],[15,-21]]);arm([[3,-20],[0,-16],[10-pull,-21]]);return true;
  }
  const jav=p.weapon==='csJavelin',cav=p.weapon==='csCavalrySpear';
  const pose=weaponMotion('spear',action,phase,cav?.8:.25);
  let hx=7+pose.x,hy=-17+pose.y,angle=pose.angle;
  if(jav) {
    const t=action==='attack'?Math.sin(phase*Math.PI):0;
    hx=6+t*5;hy=-23-t*3;angle=1.15+t*.55;
    for(const x of [-7,-5]){line('#94734b',1,[[x,-6],[x+1,-30]]);poly(METAL,[[x,-30],[x+1.2,-34],[x+2,-30]]);}
  } else if(cav)angle=action==='charge'?1.48:action==='charge-ready'?.8+.68*phase*8/7:angle;
  // The thrown shaft disappears for the release frames; it is rendered by projectile physics.
  if(!jav||action!=='attack'||phase<.5||phase>=.875) {
    g.save();g.translate(hx,hy);g.rotate(angle);
    const len=jav?20:cav?30:29;
    line('#92734a',jav?1.1:1.5,[[0,jav?10:12],[0,-len]]);
    poly(METAL,[[-1.1,-len],[0,-len-(jav?3:5)],[1.1,-len],[0,-len+1]]);
    g.restore();
  }
  arm([[3,-20],[4,-15],[hx,hy]]);
  if(cav)arm([[-3,-20],[-2,-14],[5,-12]]);
  return true;
}
