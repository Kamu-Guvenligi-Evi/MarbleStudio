const INK='#30362e',SKIN='#ad8866';
function pens(g){
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.55;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.45;g.stroke();};
  return {line,poly,oval};
}
export function drawMexicaRankArmor(g,p){
  if(!['cuachicSuit','otomiSuit'].includes(p.armor))return false;
  const {line,poly,oval}=pens(g),shorn=p.armor==='cuachicSuit';
  // Two different back devices in Mendoza 64r, not a generic feather cape.
  line('#785d3b',1.3,[[-5,-12],[-7,-34]]);
  if(shorn){
    poly('#a84f4d',[[-10,-16],[-6,-16],[-6,-35],[-10,-35]]);
    for(let y=-33;y<-21;y+=2.5)for(const x of [-9,-7])oval('#ddd3b7',x,y,.55,.65);
    for(let y=-23;y<-16;y+=2)line('#e4d9b9',.9,[[-9.7,y],[-6.3,y]]);
  }else{
    poly('#c9b36d',[[-12,-15],[-5,-15],[-7.5,-34],[-9,-34]]);
    poly('#4b745b',[[-10.5,-16],[-6.5,-16],[-8,-32]]);
    for(let y=-28;y<-16;y+=2)oval('#d9cc95',-8.5,y,.6,.7);
  }
  oval(shorn?'#cbb45e':'#5d9d9d',-8,-35,1.7,1.8);
  line('#c3a35c',1.5,[[-10,-37],[-6,-37]]);
  for(let i=0;i<6;i++){
    const x=-19+i*1.8,y=-44+(i%3)*1.5;
    poly(i%2?'#487454':'#66875c',[[-8,-37],[x,y],[x+2,y+4],[-7,-37]]);
  }
  poly(p.cloth,[[-5,-22],[4,-22],[6,-17],[4,-10],[5,-7],[-5,-7],[-5,-15],[-7,-18]]);
  line(shorn?'#e1c967':'#85a57a',.7,[[-3,-21],[-3,-12]]);
  for(let y=-19;y<-8;y+=3)for(let x=-2;x<4;x+=2)line(shorn?'#b79a45':'#4c7656',.45,[[x,y],[x+.7,y+1]]);
  line('#e7d6ad',1.3,[[-3,-22],[0,-20],[3,-22]]);
  line('#b96c5a',1.3,[[-5,-9],[5,-9]]);
  return true;
}
export function drawMexicaRankHead(g,p){
  if(!['cuachicShorn','otomiBoundHair'].includes(p.head))return false;
  const {line,poly,oval}=pens(g),shorn=p.head==='cuachicShorn';
  if(!shorn){
    poly('#363a32',[[-4,-30],[1,-32],[3,-30],[2,-23],[-3,-19],[-5,-22]]);
    poly('#35392f',[[-3,-30],[-5,-35],[-3,-36],[-1,-31]]);
    line('#b35449',1.1,[[-4.5,-33],[-2,-34]]);
  }
  oval(SKIN,.4,-26,3.3,4);
  if(shorn){
    // Closely cut crown with a small remaining side lock, following the miniature.
    poly('#454236',[[-3,-27],[-3,-30],[-1,-31],[2,-30],[3,-28],[1,-29],[-1,-29],[-1,-26]]);
    for(let x=-2;x<3;x++)line('#6b5a45',.5,[[x,-29],[x+.1,-28.2]]);
    line('#454236',1,[[-3,-27],[-3,-24]]);
  }else{
    poly('#363a32',[[-3,-29],[-2,-31],[2,-30],[3,-28],[0,-28],[-2,-26]]);
    line('#a45549',.7,[[-3,-30],[2,-30]]);
  }
  oval('#d3bd74',-2.7,-25,1,1.2);
  line(INK,.65,[[1,-26],[2.2,-26]]);line('#d7caa6',.7,[[2,-23],[3.2,-23]]);
  return true;
}
export function drawMexicaRankShield(g,p){
  if(!['xicalcoliuhqui','otomiChimalli'].includes(p.shield))return false;
  const {line,poly,oval}=pens(g),shorn=p.shield==='xicalcoliuhqui';
  // Hanging feather fringe belongs to the shield, not an armour skirt.
  for(let i=0;i<9;i++){
    const x=-5+i*1.25;
    line('#ba9c48',1.7,[[x,3],[x*1.3,7]]);
    line('#b25d54',1.8,[[x*1.3,7],[x*1.35,8.5]]);
    line('#568260',1.7,[[x*1.35,8.5],[x*1.4,9.7]]);
  }
  oval('#d0b55f',0,0,6.1,6.1);oval(shorn?'#bc9f43':'#e0d8b5',0,0,5.2,5.2);
  if(shorn){
    line('#3d6250',1.25,[[-4,3],[-4,-2],[-1,-2],[-1,1],[1,1],[1,-3],[4,-3],[4,3],[1,3]]);
  }else{
    oval('#4e8f97',0,0,4.7,4.7);oval('#e0d8b5',0,0,3.8,3.8);
    for(let i=0;i<4;i++){
      g.save();g.rotate(i*Math.PI/2);
      poly('#518d94',[[-.7,0],[.7,-.8],[1.3,-2.5],[3.4,-2.5],[3,-3.4],[.2,-3.2],[-1,-1.3]]);
      g.restore();
    }
    oval('#c8ad62',0,0,.8,.8);
  }
  return true;
}
