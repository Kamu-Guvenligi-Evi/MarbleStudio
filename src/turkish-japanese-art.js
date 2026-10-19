import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK='#343a32';
function pens(g){
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.5;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();};
  return {line,poly,oval};
}
export function drawTurkishJapaneseArmor(g,p){
  if(!['ashigaruBlack','ashigaruRed','akinciKaftan','azapDolman'].includes(p.armor))return false;
  const {line,poly}=pens(g),ash=p.armor.startsWith('ashigaru');
  if(ash){
    const red=p.armor==='ashigaruRed',metal=red?'#884a35':'#363b36',edge=red?'#b56c49':'#6b7264';
    poly(p.cloth,[[-5,-22],[5,-22],[6,-14],[-6,-14]]);
    poly(metal,[[-4,-21],[4,-21],[5,-16],[4,-10],[-4,-10],[-5,-16]]);
    line('#c0a479',.9,[[-3,-22],[-3,-19]]);line('#c0a479',.9,[[3,-22],[3,-19]]);
    if(!red)for(let y=-18;y<-10;y+=2)line(edge,.55,[[-4,y],[4,y]]);
    else line(edge,.7,[[-3,-19],[-3.5,-15],[-3,-12]]);
    for(const x of [-4,-1,2]){
      line('#788a9f',.7,[[x+.8,-11],[x+.8,-9]]);
      poly(metal,[[x,-9],[x+2,-9],[x+3,-4],[x-.7,-4]]);
      for(let y=-7.5;y<-4;y+=1.4)line(edge,.4,[[x-.2,y],[x+2.5,y]]);
    }
  }else{
    const azap=p.armor==='azapDolman';
    poly(p.cloth,[[-5,-22],[4,-22],[5,-13],[8,-3],[1,-2],[0,-7],[-1,-2],[-7,-3],[-5,-13]]);
    if(azap){
      poly('#a48a6c',[[-5,-22],[-8,-20],[-8,-15],[-4,-14],[-3,-19]]);
      line('#cfb58c',.8,[[-7,-15],[-4,-14]]);
      for(let y=-20;y<-12;y+=1.7){line('#c8b38b',.8,[[-2,y],[2,y]]);line('#d4bc8f',.8,[[.3,y-.3],[.3,y+.3]]);}
      line('#c4a878',1.8,[[-4,-11],[4,-11]]);
      line('#473e33',2.1,[[-5,-10],[-10,-3]]);line('#b6a16c',.8,[[-5,-10],[-3,-12]]);
    }else{
      poly('#c6a15c',[[-4,-22],[0,-21],[3,-12],[-2,-12]]);
      line('#e1c88e',.7,[[-3,-21],[2,-12],[2,-4]]);
      line('#8d493c',2,[[-4,-11],[4,-11]]);
      for(let y=-19;y<-12;y+=2)line('#574b36',.7,[[0,y],[1,y]]);
    }
    line('#5b4d3d',.6,[[0,-10],[0,-5]]);
  }
  return true;
}
export function drawTurkishJapaneseHead(g,p){
  if(!['ashigaruJingasa','akinciWrap','azapWrap'].includes(p.head))return false;
  const {line,poly,oval}=pens(g);oval(p.skin,.5,-26,3,3.8);
  if(p.head==='ashigaruJingasa'){
    line('#393c32',.7,[[-3,-28],[-2,-23],[2,-23],[3,-28]]);
    poly('#303a35',[[-7,-28],[-1,-33],[6,-28],[2,-27],[-3,-27]]);
    line('#828778',.6,[[-6,-28],[-1,-32],[4,-28]]);
  }else if(p.head==='akinciWrap'){
    poly('#ac8546',[[-4,-28],[-3,-32],[0,-33],[3,-31],[4,-28]]);
    line('#d9c394',1.7,[[-4,-28],[-2,-30],[2,-30],[4,-28]]);
    line('#eee5c6',1,[[-1,-32],[-3,-38],[-2.5,-40]]);
    poly('#564739',[[-3,-25],[-2,-22],[1,-21],[3,-24],[1,-23],[-1,-24]]);
  }else{
    poly('#cec1a0',[[-4,-27],[-4,-30],[-2,-32],[2,-32],[5,-30],[4,-28],[0,-28],[-1,-26]]);
    for(let y=-31;y<-28;y++)line('#8d8168',.55,[[-2,y],[3,y+.3]]);
    poly('#4e4437',[[-2,-24],[-1,-22],[1,-21],[3,-23],[1,-23],[0,-24]]);
  }
  line(INK,.6,[[1,-26],[2.4,-26]]);return true;
}
export function drawTurkishJapaneseWeapon(g,p,action,phase){
  if(p.weapon!=='ashigaruYari')return false;
  const {line,poly,oval}=pens(g),thrust=action==='attack'?Math.sin(phase*Math.PI):0;
  const pose=weaponMotion(p.weapon,action,phase,Math.PI/2-1.02),angle=action==='charge'?-.35:pose.angle-Math.PI/2;
  const ox=7+pose.x,oy=-16+pose.y,point=x=>[ox+Math.cos(angle)*x,oy+Math.sin(angle)*x];
  const a=point(-5),b=point(5);
  for(const [s,e,h] of [[[-3,-20],[-2,-14],a],[[3,-20],[6,-19],b]]){line(INK,3.5,[s,e,h]);line(p.cloth,2.7,[s,e,h]);}
  g.save();g.translate(ox,oy);g.rotate(angle);
  line(INK,2,[[-22,0],[28,0]]);line('#896a43',1.3,[[-22,0],[28,0]]);
  line('#535b52',1.8,[[24,0],[28,0]]);
  poly('#b8c2b4',[[27,-1],[34,0],[27,1]]);line('#e3e6cb',.5,[[28,0],[32,0]]);
  g.restore();oval(p.skin,...a,1.2,1.1);oval(p.skin,...b,1.2,1.1);return true;
}
