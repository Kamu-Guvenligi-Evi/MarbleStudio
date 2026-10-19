import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK='#303931',STEEL='#9caea6';
function pens(g){
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.55;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();};
  return {line,poly,oval};
}
function mail(g,x,y,w,h){
  const {line}=pens(g);
  for(let j=0;j<h;j+=1.7)for(let i=0;i<w-1;i+=1.7)line('#536960',.55,[[x+i+(j%3.4?0:.6),y+j],[x+i+.6,y+j+.6],[x+i+1,y+j]]);
}
export function drawRusFrenchArmor(g,p){
  if(!p.armor?.startsWith('rf')&&!p.rfJupon)return false;
  const {poly,line,oval}=pens(g),c=p.cloth;
  if(p.armor==='rfLongMail'){
    poly(STEEL,[[-5,-22],[4,-22],[5,-16],[6,-3],[1,-3],[0,-7],[-1,-3],[-6,-3],[-5,-16]]);
    mail(g,-4,-21,8,17);line('#705239',1.6,[[-5,-11],[5,-11]]);
  }else if(p.armor==='rfTunic'){
    poly(c,[[-5,-22],[4,-22],[4,-15],[7,-4],[1,-3],[0,-7],[-2,-3],[-7,-4],[-4,-15]]);
    line('#c5ae7a',.9,[[-3,-21],[0,-18],[2,-21]]);
    line('#574932',1.6,[[-4,-12],[4,-12]]);line('#a78b5d',1,[[1,-12],[2,-7]]);
    line('#c5ae7a',.7,[[-6,-5],[-2,-4],[0,-7],[1,-4],[6,-5]]);
  }else if(p.armor==='rfJack'){
    poly(c,[[-5,-22],[4,-22],[5,-17],[5,-11],[7,-6],[2,-5],[0,-8],[-2,-5],[-7,-6],[-5,-12]]);
    for(let x=-3;x<=3;x+=2)line('#857656',.65,[[x,-21],[x,-11],[x*1.5,-7]]);
    line('#e1d1a6',.6,[[-3,-20],[2,-20]]);line('#665036',1.2,[[-5,-11],[5,-11]]);
    // Sidearm listed with the bow, jaque and sallet in the 1448 equipment.
    line('#524c3d',1.4,[[-4,-12],[-8,-1]]);line('#aaa58b',1,[[-6,-12],[-2,-10]]);
  }else{
    poly(STEEL,[[-5,-22],[4,-22],[6,-6],[-6,-6]]);mail(g,-5,-20,10,14);
    const bottom=p.rfJupon?-8:-9;
    poly(c,[[-4,-22],[3,-22],[4,-16],[4,-12],[5,bottom],[-5,bottom],[-4,-12]]);
    line('#b09c6c',.7,[[-4,bottom],[5,bottom]]);line('#5a4736',1.3,[[-4,-12],[4,-12]]);
    for(const y of [-19,-17,-15])oval('#c9b884',.5,y,.35,.35);
    if(p.rfJupon)for(const x of [-5,4]){
      poly(STEEL,[[x-1,-22],[x+2,-21],[x+2,-18],[x-1,-18]]);
      line('#e0e3ce',.65,[[x-1,-21],[x+1,-20]]);
    }
  }
  return true;
}
export function drawRusFrenchHead(g,p){
  if(!p.head?.startsWith('rf'))return false;
  const {poly,line,oval}=pens(g),skin=p.skin||'#be9976';
  oval(skin,.5,-24,3,3.7);poly(skin,[[2,-25],[4.2,-23.7],[3,-23],[3,-21],[0,-20.5]]);
  if(p.head==='rfFeltCap'){
    poly('#63513a',[[-4,-26],[-3,-29],[0,-31],[3,-29],[4,-26]]);
    line('#c3ab7d',1.5,[[-4,-26],[4,-26]]);
    poly('#574431',[[-3,-24],[-2,-21],[1,-18],[3,-21],[3,-22],[0,-22]]);
  }else if(p.head==='rfNasalCone'||p.head==='rfOpenCone'){
    const nasal=p.head==='rfNasalCone';
    poly('#85978e',[[-4,-25],[-3,-28],[0,-34],[1,-34],[4,-28],[4,-25]]);
    line('#d4dbbf',.8,[[0,-32],[-1,-27]]);line('#c4b58b',1,[[-4,-26],[4,-26]]);
    if(nasal){line(STEEL,1.2,[[2,-26],[2,-22]]);poly('#86978c',[[-4,-25],[-2,-24],[-2,-21],[-4,-20]]);mail(g,-4,-24,2,4);}
    else poly('#574431',[[-3,-24],[-2,-21],[0,-18],[3,-20],[3,-22],[0,-22]]);
  }else{
    // Bascinet with mail aventail; visor differentiates the close-combat kit.
    poly('#8d9f96',[[-4,-27],[-4,-22],[-6,-19],[0,-18],[4,-20],[3,-27]]);mail(g,-4,-24,7,5);
    poly(STEEL,[[-4,-25],[-4,-29],[-2,-33],[0,-35],[3,-31],[4,-27],[3,-25],[0,-27],[-1,-23],[-3,-23]]);
    line('#d6decb',.75,[[-2,-31],[0,-33],[2,-30]]);
    if(p.head==='rfVisoredBascinet'){
      poly('#a4b5ad',[[0,-28],[4,-28],[8,-24],[4,-22],[0,-23]]);
      line('#263c33',.85,[[1,-27],[4,-26]]);
      for(const x of [3,4.5,6])oval('#4f665c',x,-24,.35,.35);
      oval('#bdc6b4',-.3,-27, .65,.65);
      return true;
    }
  }
  oval('#263b30',2.3,-24,.4,.4);return true;
}
export function drawRusFrenchWeapon(g,p,action,phase){
  if(!p.weapon?.startsWith('rf'))return false;
  const {poly,line,oval}=pens(g),swing=action==='attack'?Math.sin(phase*Math.PI):0,skin=p.skin||'#be9976';
  const pose=weaponMotion(p.weapon,action,phase,.2),hx=9+pose.x,hy=-19+pose.y;
  const arm=(points)=>{line(INK,3.5,points);line(['mail','plate'].includes(p.armor)?STEEL:p.cloth,2.7,points);const [x,y]=points.at(-1);oval(p.armor==='plate'?STEEL:skin,x,y,1.1,1.1);};
  if(p.weapon==='rfCompositeBow'){
    const released=action==='attack'&&phase>=.5,nock=released?11:6-swing*5;
    arm([[3,-19],[7,-18],[14,-19]]);arm([[-2,-19],[1,-16],[nock,-20]]);
    // Short recurved limbs and angled stiff tips, distinct from the longbow.
    line('#6d5034',2,[[13,-33],[10,-30],[11,-26],[14,-22],[14,-18],[11,-14],[10,-10],[13,-7]]);
    line('#ceac70',.8,[[13,-33],[10,-30],[11,-26],[14,-22],[14,-18],[11,-14],[10,-10],[13,-7]]);
    line('#e1d6b2',.5,[[13,-33],[nock,-20],[13,-7]]);
    line('#5a4230',2,[[14,-22],[14,-18]]);
    if(!released){line('#cabc90',.65,[[nock,-20],[25,-20]]);poly(STEEL,[[25,-21],[28,-20],[25,-19]]);}
  }else{
    arm([[3,-19],[6,-15],[hx,hy]]);
    if(p.weapon==='rfArmingSword')arm([[-2,-19],[-4,-14],[-1,-12]]);
    g.save();g.translate(hx,hy);g.rotate(pose.angle);
    if(p.weapon==='rfBeardedAxe'){
      line('#785b36',1.7,[[0,6],[0,-17]]);
      // Novgorod type IV: narrow neck, descending beard and lateral cheek.
      poly(STEEL,[[-2,-18],[1,-18],[5,-19],[8,-21],[hx,hy],[9,-14],[7,-11],[5,-12],[4,-15],[1,-16],[-2,-16]]);
      line('#e2e4cd',.75,[[8,-21],[hx,hy],[9,-14],[7,-11]]);
      oval('#42594c',5.8,-16,.5,.5);line('#74897c',.8,[[0,-18],[0,-15]]);
    }else{
      line('#725339',1.6,[[0,4],[0,-2]]);oval('#c4b98b',0,4.7,1.5,1.5);
      line('#b5bba5',1.2,[[-3.5,-1],[0,-2],[3.5,-1]]);
      poly(STEEL,[[-1.4,-3],[-1,-19],[0,-24],[1,-19],[1.4,-3]]);
      line('#e5e8d1',.6,[[0,-3],[0,-22]]);
    }
    g.restore();
  }
  return true;
}
