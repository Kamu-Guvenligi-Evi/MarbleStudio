import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK='#35392f';
function pens(g){
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.5;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();};
  return {line,poly,oval};
}
export function drawPacificArmor(g,p){
  if(!['maoriFiberWrap','ahuUla'].includes(p.armor))return false;
  const {line,poly}=pens(g);
  poly(p.skin,[[-4,-22],[4,-22],[5,-16],[3,-8],[-4,-8],[-5,-16]]);
  if(p.armor==='maoriFiberWrap'){
    poly('#ad9c77',[[-5,-22],[1,-19],[4,-17],[2,-12],[-5,-16],[-8,-12],[-8,-19]]);
    for(let i=0;i<12;i++){const x=-7+i*.85,y=-20+i*.45;line(i%2?'#d3c5a1':'#786b51',.7,[[x,y],[x-1,y+6+(i%3)]]);}
    poly('#b5a17a',[[-4,-11],[4,-11],[6,-5],[1,-4],[0,-6],[-1,-4],[-6,-5]]);
    for(let x=-4;x<5;x++)line('#746b50',.55,[[x,-10],[x*1.2,-5]]);
    line('#64543d',1.2,[[-4,-11],[4,-11]]);
  }else{
    // Feather cloak: broad yellow border and curved bands, following FE000327.
    poly('#c14e30',[[-4,-23],[-8,-20],[-13,-6],[-10,-3],[-4,-5],[-2,-15],[2,-22]]);
    line('#dfbd57',1.4,[[-7,-21],[-12,-6],[-10,-4],[-5,-6]]);
    line('#e2c164',1.6,[[-7,-17],[-6,-14],[-4,-13]]);
    line('#e2c164',1.2,[[-9,-12],[-8,-9],[-5,-8]]);
    for(let y=-20;y<-6;y+=2)line('#d36337',.55,[[-6-(y+20)*.3,y],[-5-(y+20)*.3,y+.3]]);
    poly('#d0b88b',[[-4,-10],[4,-10],[3,-7],[1,-7],[2,-3],[-2,-3],[-1,-7],[-4,-7]]);
    line('#9b7855',.7,[[-4,-9],[4,-9]]);
  }
  return true;
}
export function drawPacificHead(g,p){
  if(!['maoriTopknot','mahiole'].includes(p.head))return false;
  const {line,poly,oval}=pens(g);
  oval(p.skin,.4,-26,3.2,4);
  if(p.head==='maoriTopknot'){
    poly('#37372c',[[-3,-25],[-4,-28],[-2,-31],[2,-31],[3,-28],[0,-29],[-2,-28]]);
    oval('#37372c',-2.5,-32.2,2.2,1.7);line('#b8a37d',.7,[[-4,-32],[-1,-33]]);
    for(let i=0;i<3;i++)line('#d5cbb1',.65,[[-3+i*.6,-33],[-6+i*1.3,-38+i*.5]]);
    poly('#527c61',[[-3,-25],[-2,-25],[-2,-21],[-3,-21]]);
  }else{
    // A feather-covered basketry cap and arched crest, not a metal helmet.
    poly('#c75e32',[[-4,-28],[-4,-31],[-1,-33],[3,-32],[4,-28]]);
    poly('#d06432',[[-4,-30],[-7,-33],[-7,-36],[-5,-39],[-2,-41],[1,-40],[3,-37],[4,-32],[3,-30],[1,-34],[-1,-36],[-3,-35]]);
    line('#e1ba62',.9,[[-4,-28],[-1,-29],[4,-28]]);
    for(let i=0;i<7;i++)line(i%2?'#e08b40':'#b8462e',.75,[[-5+i,-36-Math.sin(i*.45)*3],[-4.6+i,-34-Math.sin(i*.45)*3]]);
  }
  line(INK,.6,[[1,-26],[2.3,-26]]);line('#72563e',.6,[[1,-23.7],[2,-23.7]]);
  return true;
}
export function drawPacificWeapon(g,p,action,phase){
  if(!['taiaha','ihe'].includes(p.weapon))return false;
  const {line,poly,oval}=pens(g),attack=action==='attack'?Math.sin(phase*Math.PI):0;
  const taiaha=p.weapon==='taiaha',pose=weaponMotion(p.weapon,action,phase,Math.PI/2-(taiaha?.62:.24)),angle=pose.angle-Math.PI/2;
  const ox=7+pose.x,oy=-15+pose.y;
  const point=x=>[ox+Math.cos(angle)*x,oy+Math.sin(angle)*x];
  const a=point(-4),b=point(5);
  for(const [shoulder,elbow,hand] of [[[-3,-20],[-1,-14],a],[[3,-20],[6,-18],b]]){
    line(INK,3.2,[shoulder,elbow,hand]);line(p.skin,2.5,[shoulder,elbow,hand]);
  }
  g.save();g.translate(ox,oy);g.rotate(angle);
  line(INK,2.2,[[-18,0],[25,0]]);line('#75543a',1.35,[[-18,0],[25,0]]);
  if(taiaha){
    poly('#694d38',[[12,-.8],[24,-1.5],[27,-.7],[27,.7],[24,1.5],[12,.8]]);
    line('#a28a60',.5,[[15,-.2],[25,-.4]]);
    poly('#624c36',[[-17,-1],[-19,-1.5],[-21,-.9],[-26,0],[-21,.9],[-19,1.5],[-17,1]]);
    oval('#cfccb1',-19,-.55,.6,.45);oval('#cfccb1',-19,.55,.6,.45);
    line('#a18b63',.4,[[-21,0],[-24,0]]);
    for(let i=0;i<5;i++)line(i%2?'#b9a073':'#94794f',.7,[[-16+i*.4,-1],[-13+i*.7,3+i%2]]);
  }else{
    // Bishop Museum's ihe: a wooden point, without a steel socket.
    poly('#785437',[[22,-.7],[29,0],[22,.7]]);
    for(const x of [22.5,24])poly('#785437',[[x,-.5],[x-1.5,-1.5],[x+1,-.4]]);
    line('#b08c57',.45,[[-15,-.3],[24,-.2]]);
  }
  g.restore();oval(p.skin,...a,1.2,1.1);oval(p.skin,...b,1.2,1.1);
  return true;
}
