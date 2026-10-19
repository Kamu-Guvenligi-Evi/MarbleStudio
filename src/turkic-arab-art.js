// Distinct equipment silhouettes on the shared native coordinate system.
const INK='#302d28', STEEL='#aab2ad', SKIN='#bb9574';
function pens(g){
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.6;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.45;g.stroke();};
  return {line,poly,oval};
}
export function drawTurkicArabArmor(g,p){
  if(!['khwarazmCoat','deliPelt','harasTunic','abnaKaftan'].includes(p.armor))return false;
  const {line,poly,oval}=pens(g);
  if(p.armor==='khwarazmCoat'){
    poly(p.cloth,[[-5,-22],[4,-22],[5,-14],[7,-4],[1,-5],[0,-10],[-2,-4],[-7,-5],[-5,-14]]);
    poly('#727d77',[[-5,-21],[4,-21],[5,-14],[4,-11],[-5,-11]]);
    for(let y=-20;y<-11;y+=1.7)for(let x=-4;x<4;x+=1.7)line('#b6bdb0',.45,[[x,y],[x+.5,y+.5],[x+1,y]]);
    line('#d1b780',1,[[-4,-22],[2,-15],[1,-5]]);line('#4a3d32',1.5,[[-5,-12],[5,-12]]);
    oval('#c3a262',1,-12,1,.8);
  }else if(p.armor==='deliPelt'){
    poly('#8b7853',[[-5,-22],[4,-22],[6,-14],[5,-7],[-5,-7],[-6,-14]]);
    poly('#c2a366',[[-6,-23],[-3,-24],[1,-21],[5,-23],[7,-20],[5,-16],[7,-10],[5,-6],[2,-8],[-2,-6],[-5,-8],[-6,-13],[-7,-18]]);
    for(const [x,y] of [[-4,-21],[4,-20],[-3,-17],[3,-16],[0,-14],[-4,-11],[4,-10],[0,-8]]){
      oval('#594532',x,y,.9,.7);oval('#b99a61',x+.15,y,.4,.3);
    }
    line('#63432e',1.6,[[-5,-12],[5,-12]]);
  }else if(p.armor==='harasTunic'){
    poly(p.cloth,[[-5,-22],[4,-22],[5,-15],[6,-4],[1,-4],[0,-8],[-1,-4],[-6,-4],[-5,-15]]);
    line('#746246',1,[[-4,-21],[-4,-6]]);line('#746246',1,[[3,-21],[4,-6]]);
    line('#d5c6a4',.8,[[0,-20],[0,-14]]);line('#634a33',1.5,[[-5,-12],[5,-12]]);
    line('#796a50',.6,[[-5,-5],[5,-5]]);
  }else{
    poly(p.cloth,[[-6,-22],[5,-22],[6,-16],[5,-12],[8,-5],[2,-3],[0,-8],[-2,-3],[-7,-5],[-5,-13]]);
    line('#b39d73',.85,[[-4,-22],[2,-15],[1,-5]]);
    for(const [x,y] of [[-3,-18],[2,-19],[-3,-14],[4,-8],[-4,-7]]){
      for(let i=0;i<4;i++){const a=i*Math.PI/2;oval('#8a7e64',x+Math.cos(a)*.65,y+Math.sin(a)*.65,.4,.4);}
    }
    line('#876542',1.5,[[-5,-12],[5,-12]]);oval('#b7a274',1,-12,1,.7);
  }
  return true;
}
export function drawTurkicArabHead(g,p){
  if(!['khwarazmHelmet','deliFurCap','harasCap','abnaCap'].includes(p.head))return false;
  const {line,poly,oval}=pens(g);
  oval(SKIN,.5,-25,3,3.8);line(INK,.55,[[2,-25],[3,-25]]);
  if(p.head==='khwarazmHelmet'){
    poly('#727d77',[[-4,-27],[-2,-26],[-2,-22],[3,-22],[4,-20],[-5,-21]]);
    for(let y=-25;y<=-21;y+=1.4)line('#acb5a6',.5,[[-4,y],[-2,y]]);
    poly(STEEL,[[-4,-27],[-2,-31],[0,-34],[2,-31],[4,-27]]);
    line('#d3d5bf',.7,[[0,-33],[1,-28]]);line('#87764e',1,[[-4,-27],[4,-27]]);
  }else if(p.head==='deliFurCap'){
    poly('#776247',[[-4,-27],[-4,-30],[-3,-33],[0,-34],[3,-32],[4,-28],[3,-27]]);
    for(let x=-3;x<4;x++)line('#b09b73',.6,[[x,-29],[x+.5,-31]]);
    for(const [x,y] of [[-7,-38],[-2,-41],[4,-39]]){
      poly('#a69e80',[[-1,-31],[x-1.8,y+4],[x-1.2,y+1],[x,y],[x+1.3,y+2],[x+1.5,y+4],[1,-31]]);
      line('#4e4a37',.5,[[-1,-31],[x,y+1]]);
      line('#d2c7a1',.45,[[x-1,y+3],[x,y+4],[x+1,y+3]]);
    }
    line('#493727',1,[[0,-23],[2,-22],[3,-23]]);
  }else if(p.head==='harasCap'){
    poly('#a79c7d',[[-4,-27],[-3,-30],[0,-31],[3,-30],[4,-27]]);
    line('#dfd2ae',1.5,[[-4,-27],[3,-27]]);
    poly('#c4b58e',[[-4,-27],[-2,-26],[-3,-20],[-5,-22]]);
    poly('#564332',[[-1,-23],[1,-22],[3,-23],[2,-20],[0,-20]]);
  }else{
    poly('#34332f',[[-3,-27],[-3,-32],[-1,-35],[2,-34],[3,-31],[3,-27]]);
    line('#98866b',.7,[[-3,-28],[3,-28]]);
    poly('#4d392c',[[-2,-24],[-1,-22],[2,-22],[3,-24],[3,-20],[0,-19],[-2,-21]]);
  }
  return true;
}
export function drawTurkicArabShield(g,p){
  if(p.shield!=='deliTekne')return false;
  const {line,poly}=pens(g);
  poly('#b09259',[[-4,-6],[1,-12],[4,-9],[5,5],[-3,8],[-5,4]]);
  poly('#80693f',[[-3,-5],[1,-10],[3,-8],[4,4],[-2,6],[-4,3]]);
  line('#d5bc81',.7,[[0,-8],[1,4]]);line('#564731',.8,[[-3,-2],[3,-3]]);
  return true;
}
