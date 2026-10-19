const INK = '#33362e';
function pens(g) {
  const path = pts => { g.beginPath(); pts.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); };
  const line = (c,w,pts) => { path(pts); g.strokeStyle=c; g.lineWidth=w; g.lineCap='round'; g.lineJoin='round'; g.stroke(); };
  const poly = (c,pts) => { path(pts); g.closePath(); g.fillStyle=c; g.fill(); g.strokeStyle=INK; g.lineWidth=.55; g.stroke(); };
  const oval = (c,x,y,rx,ry) => { g.beginPath(); g.ellipse(x,y,rx,ry,0,0,Math.PI*2); g.fillStyle=c; g.fill(); };
  return { line, poly, oval };
}
export function drawAlliedContingentArmor(g,p) {
  if (!['allyLinen','allyBronze','allyZeira','allyHide'].includes(p.armor)) return false;
  const {line,poly,oval}=pens(g);
  poly(p.cloth,[[-5,-22],[4,-22],[6,-16],[4,-11],[6,-2],[-6,-2],[-4,-11],[-6,-16]]);
  if(p.armor==='allyLinen') {
    poly('#d4c9a4',[[-4,-22],[4,-22],[5,-17],[4,-10],[-4,-10],[-5,-17]]);
    for(const x of [-4,-2,0,2,4]) poly('#c3b893',[[x-.8,-10],[x+.8,-10],[x+1,-5],[x-.8,-5]]);
    line('#8a7654',1,[[-4,-12],[4,-12]]);
    for(const x of [-3,3])line('#eee1b9',1.7,[[x,-23],[x,-18]]);
    line('#998b68',.6,[[-4,-17],[4,-17]]);
  } else if(p.armor==='allyBronze') {
    poly('#a88a50',[[-4,-23],[4,-23],[5,-19],[3.8,-13],[4.5,-10],[-4.5,-10],[-3.8,-13],[-5,-19]]);
    line('#d5b776',.9,[[-3,-20],[-1,-21],[1,-21],[3,-20]]);
    line('#79633d',.7,[[0,-19],[0,-14],[-3,-13]]);
    line('#d6bb7b',.8,[[1,-18],[1,-14],[3,-13]]);
    for(const x of [-3,-1,1,3])line('#ab8c59',1.5,[[x,-10],[x*1.4,-6]]);
  } else if(p.armor==='allyZeira') {
    // A patterned cloak changes the outline, not just the tunic colour.
    poly('#944f3b',[[-5,-23],[0,-22],[-1,-16],[-3,-6],[-7,0],[-11,-3],[-8,-12]]);
    for(const y of [-18,-12,-6])line('#d7ba7b',1,[[-7,y],[-5,y+2],[-3,y]]);
    line('#4a4937',1.4,[[-4,-10],[4,-10]]);
    oval('#cfb477',-2,-21,1.1,1.1);
  } else {
    line('#5b4933',1.8,[[-4,-10],[4,-10]]);
    poly('#75624b',[[-6,-23],[-3,-25],[1,-24],[5,-22],[6,-17],[4,-18],[3,-16],[1,-19],[-1,-17],[-3,-20],[-6,-18],[-7,-20]]);
    for(const [x,y] of [[-5,-22],[-2,-23],[1,-22],[3,-20],[-4,-20]])line('#b1a080',.7,[[x,y],[x+1,y+1.5]]);
    line('#bac09b',.6,[[-3,-15],[-3,-12]]);
  }
  return true;
}
export function drawAlliedContingentHead(g,p) {
  if(!['allyGreekHelmet','allyBoeotian','allyThracianCap','allyLigurianHair'].includes(p.head))return false;
  const {line,poly,oval}=pens(g);
  oval(p.skin,0,-25,4.5,5.2); oval(p.skin,4,-24,1.1,1.4);
  if(p.head==='allyGreekHelmet') {
    poly('#a58c58',[[-5,-25],[-5,-29],[-2,-33],[2,-32],[5,-28],[4,-26],[1,-27],[-2,-27],[-3,-21],[-5,-22]]);
    line('#d4bb7b',.9,[[-3,-29],[0,-31],[3,-29]]);
    line('#554633',.7,[[-2,-24],[0,-20],[3,-23]]);
  } else if(p.head==='allyBoeotian') {
    poly('#a99362',[[-7,-27],[-5,-30],[-3,-33],[2,-33],[5,-30],[7,-27],[4,-26],[2,-28],[-2,-28],[-4,-26]]);
    line('#dec58b',.8,[[-5,-29],[-2,-30],[2,-30],[5,-28]]);
    poly('#8f7c50',[[-5,-27],[-3,-27],[-3,-23],[-5,-24]]);
    line('#6b583c',.7,[[-3,-24],[-1,-20],[3,-23]]);
  } else if(p.head==='allyThracianCap') {
    poly('#aa7650',[[-5,-25],[-5,-29],[-3,-33],[0,-36],[4,-35],[2,-32],[4,-28],[4,-26],[-2,-27],[-3,-22],[-5,-22]]);
    line('#d6b17b',1,[[-4,-28],[3,-28]]);
    line('#6d4c35',.8,[[-2,-31],[0,-33],[2,-33]]);
  } else {
    poly('#514536',[[-5,-23],[-5,-28],[-3,-31],[0,-32],[3,-30],[4,-27],[2,-28],[-1,-28],[-3,-26],[-3,-22]]);
    line('#84735a',.7,[[-3,-29],[0,-30],[2,-29]]);
    poly('#65513b',[[-1,-23],[1,-22],[3,-23],[2,-19],[-1,-20]]);
  }
  line(INK,.8,[[2,-25],[3,-25]]);
  return true;
}
export function drawAlliedContingentShield(g,p) {
  if(!['allyAspis','allyLongShield'].includes(p.shield))return false;
  const {line,poly,oval}=pens(g);
  if(p.shield==='allyAspis') {
    oval(INK,0,0,7.9,8.8); oval('#b49a62',0,0,7.3,8.2); oval('#807f68',0,0,6.2,7.1);
    line('#c1b28b',1.2,[[-3,-4],[-4,0],[-2,4],[2,4],[4,1]]);
    oval('#aea382',0,0,1.2,1.2);
  } else {
    poly('#594b34',[[-3,-11],[3,-11],[5,-7],[5,7],[3,11],[-3,11],[-5,7],[-5,-7]]);
    poly('#a58f61',[[-2.7,-10],[2.7,-10],[4,-6],[4,6],[2.7,10],[-2.7,10],[-4,6],[-4,-6]]);
    line('#726044',.6,[[-2,-9],[-2,9]]);line('#726044',.6,[[2,-9],[2,9]]);
    line('#c9b481',1.8,[[0,-8],[0,8]]);
    oval('#786b4c',0,0,1.8,2.6);
  }
  return true;
}
