// Original canvas ornaments inspired by floral and scrolling ceramic motifs.
// Cache at 2x export resolution; facet clips remove the decoration with the glass.
const cache=new Map();
const colors={
  sahlale:['#18366e','#2b70a5','#f5eed7','#21998f'],
  yesilturbe:['#123e57','#10ae9b','#f2dfac','#187867'],
  dantel:['#142c62','#23518c','#fff7df','#436da0'],
  revzen:['#173e50','#25bda9','#f1dca5','#2487ab'],
  rosewindow:['#32345e','#c470a6','#f6deb1','#4caeb5'],
  lattice:['#165b57','#29ac95','#e1efd5','#6abfbb'],
  rumi:['#112b66','#14b6aa','#effaf1','#063f54'],
  hatayi:['#124f69','#de657c','#fff3df','#159f96'],
  tulip:['#135744','#d94c48','#fff3d8','#2caa8e'],
  penc:['#493567','#9f77bc','#fff4e7','#31a9a4'],
  cintemani:['#163e73','#2bbbc1','#f2e2b2','#0e747c']
};
function flower(c,x,y,r,n,p){
  c.save();c.translate(x,y);c.strokeStyle=p[0];c.lineWidth=1;
  const spread=Math.min(.48,1.9/n);
  for(let k=0;k<n;k++){
    c.save();c.rotate(k*2*Math.PI/n);c.fillStyle=k%2?p[1]:p[3];
    c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-r*spread,-r*.4,-r*spread,-r,0,-r);c.bezierCurveTo(r*spread,-r,r*spread,-r*.4,0,0);c.fill();c.stroke();
    c.strokeStyle=p[2];c.beginPath();c.moveTo(0,-r*.3);c.quadraticCurveTo(-r*.12,-r*.6,0,-r*.78);c.stroke();c.restore();
  }
  c.fillStyle=p[2];c.beginPath();c.arc(0,0,r*.22,0,Math.PI*2);c.fill();c.stroke();
  c.fillStyle=p[0];c.beginPath();c.arc(0,0,r*.09,0,Math.PI*2);c.fill();c.restore();
}
function leaf(c,x,y,a,s,p){
  c.save();c.translate(x,y);c.rotate(a);c.scale(s,s);c.fillStyle=p[3];c.strokeStyle=p[0];c.lineWidth=.8;
  c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-13,-8,-10,-24,0,-32);c.bezierCurveTo(10,-21,12,-9,0,0);c.fill();c.stroke();
  c.strokeStyle=p[2];c.beginPath();c.moveTo(0,-4);c.lineTo(0,-25);c.stroke();c.restore();
}
function ornament(c,kind,p){
  c.lineCap='round';c.lineJoin='round';
  if(kind==='sahlale'){
    c.translate(270,440);
    // Fine continuous white tendrils under large sweeping saz-shaped fields.
    for(let row=-5;row<6;row++)for(let col=-5;col<6;col++){
      c.save();c.translate(col*44+(row%2)*22,row*44);
      c.beginPath();c.moveTo(0,0);c.bezierCurveTo(44,-36,49,41,22,44);c.bezierCurveTo(-7,47,-1,11,15,15);c.bezierCurveTo(30,20,19,32,11,25);c.strokeStyle=p[2];c.lineWidth=1.3;c.stroke();
      leaf(c,31,6,.7,.38,[p[2],p[2],p[0],p[2]]);flower(c,0,0,6,5,[p[0],p[2],p[2],p[2]]);c.restore();
    }
    for(let k=0;k<8;k++){
      c.save();c.rotate(k*Math.PI/4);
      c.beginPath();c.moveTo(0,-42);c.bezierCurveTo(-63,-73,-43,-145,20,-181);c.bezierCurveTo(-4,-143,62,-99,0,-42);c.closePath();c.fillStyle=p[2];c.fill();c.strokeStyle=p[0];c.lineWidth=2;c.stroke();
      c.beginPath();c.moveTo(0,-55);c.bezierCurveTo(-34,-78,-24,-120,12,-159);c.bezierCurveTo(-2,-116,33,-88,0,-55);c.closePath();c.fillStyle=p[0];c.fill();
      c.save();c.clip();
      for(let row=0;row<9;row++)for(let col=-3;col<4;col++){
        const x=col*12+(row%2)*6,y=-60-row*12;c.beginPath();c.moveTo(x,y-12);c.quadraticCurveTo(x-11,y-2,x,y+3);c.quadraticCurveTo(x+11,y-2,x,y-12);c.fillStyle=row%2?p[1]:p[3];c.fill();c.strokeStyle='#91cdd1';c.lineWidth=.6;c.stroke();
      }c.restore();
      for(let n=0;n<6;n++)leaf(c,-15-n*1.7,-64-n*12,-.7,.38,p);
      flower(c,0,-55,10,6,[p[0],'#bb3f3d','#e8d3a0',p[3]]);c.restore();
    }
    flower(c,0,0,35,12,p);
    for(const r of [191,202]){c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.strokeStyle=p[2];c.lineWidth=3;c.stroke();}
    for(let k=0;k<64;k++){c.save();c.rotate(k*Math.PI/32);c.beginPath();c.moveTo(-5,-193);c.lineTo(0,-200);c.lineTo(5,-193);c.strokeStyle=p[0];c.lineWidth=1.8;c.stroke();c.restore();}
    return;
  }
  if(kind==='dantel'){
    c.translate(270,440);
    // Nested scalloped fields and shared radial vines, inspired by lace ceramics.
    for(const [radius,count] of [[178,24],[139,16],[94,12]]){
      c.beginPath();
      for(let k=0;k<count*2;k++){
        const a=k*Math.PI/count,r=k%2?radius-15:radius;
        k?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);
      }
      c.closePath();c.fillStyle=p[0];c.fill();c.strokeStyle=p[2];c.lineWidth=3;c.stroke();
      for(let k=0;k<count;k++){
        c.save();c.rotate(k*Math.PI*2/count);
        c.beginPath();c.moveTo(0,-radius+5);c.bezierCurveTo(-23,-radius+30,-17,-radius+42,0,-radius+51);c.bezierCurveTo(17,-radius+42,23,-radius+30,0,-radius+5);
        c.fillStyle=p[2];c.fill();flower(c,0,-radius+29,17,7,p);
        c.beginPath();c.moveTo(0,-radius+50);c.bezierCurveTo(18,-radius+65,26,-radius+38,37,-radius+31);c.strokeStyle=p[2];c.lineWidth=1.4;c.stroke();
        leaf(c,-10,-radius+41,-.7,.38,p);leaf(c,10,-radius+41,.7,.38,p);c.restore();
      }
    }
    flower(c,0,0,43,12,p);
    for(const [r,color,width] of [[187,'#943c37',14],[178,p[2],2],[196,p[0],3],[203,p[0],2]]){
      c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=width;c.stroke();
    }
    for(let k=0;k<48;k++){
      c.save();c.rotate(k*Math.PI/24);
      c.beginPath();c.moveTo(0,-187);c.bezierCurveTo(5,-197,19,-178,24.4,-185.4);c.strokeStyle=p[2];c.lineWidth=1;c.stroke();
      flower(c,0,-187,4,5,[p[2],p[2],'#943c37',p[2]]);leaf(c,0,-201,0,.24,p);c.restore();
    }
    return;
  }
  if(kind==='yesilturbe'){
    // A continuous ogee lattice: every tip is the neighboring repeat's root.
    c.save();c.translate(270,440);c.scale(.75,.75);c.translate(-270,-440);
    for(let row=-3;row<7;row++)for(let col=-3;col<7;col++){
      c.save();c.translate(78+col*128+(row%2)*64,232+row*112);
      c.beginPath();c.moveTo(0,-56);c.bezierCurveTo(-10,-26,-64,-28,-64,0);c.bezierCurveTo(-64,28,-10,26,0,56);c.bezierCurveTo(10,26,64,28,64,0);c.bezierCurveTo(64,-28,10,-26,0,-56);
      c.fillStyle=p[0];c.fill();c.strokeStyle=p[2];c.lineWidth=2;c.stroke();
      for(const side of [-1,1]){
        c.save();c.scale(side,1);
        c.beginPath();c.moveTo(0,56);c.bezierCurveTo(4,20,46,27,43,0);c.bezierCurveTo(39,-24,13,-8,17,7);c.bezierCurveTo(22,23,36,5,29,0);
        c.strokeStyle=p[2];c.lineWidth=1.7;c.stroke();
        leaf(c,25,-12,-.6,.7,p);leaf(c,19,34,.75,.55,p);
        c.beginPath();c.moveTo(0,-56);c.bezierCurveTo(16,-59,26,-65,32,-56);c.bezierCurveTo(38,-47,50,-52,64,0);c.strokeStyle=p[2];c.lineWidth=1.2;c.stroke();c.restore();
      }
      flower(c,0,-10,25,8,p);flower(c,0,56,10,6,p);c.restore();
    }
    c.restore();
    c.save();c.translate(270,440);
    for(const r of [197,204]){c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.strokeStyle=p[2];c.lineWidth=2;c.stroke();}
    for(let k=0;k<60;k++){c.save();c.rotate(k*Math.PI/30);flower(c,0,-200,2.5,4,p);c.restore();}c.restore();
    return;
  }
  if(['revzen','rosewindow','lattice'].includes(kind)){
    c.translate(270,440);
    const lead=()=>{c.strokeStyle=p[0];c.lineWidth=4;c.stroke();c.strokeStyle=p[2];c.lineWidth=.8;c.stroke();};
    if(kind==='rosewindow'){
      // A continuous rose-window skeleton with colored lancet-shaped panes.
      for(let ring=0;ring<2;ring++)for(let k=0;k<12;k++){
        c.save();c.rotate(k*Math.PI/6+ring*Math.PI/12);
        const inner=ring?105:28,outer=ring?194:118;
        c.beginPath();c.moveTo(0,-inner);c.bezierCurveTo(-38,-inner-25,-26,-outer+12,0,-outer);c.bezierCurveTo(26,-outer+12,38,-inner-25,0,-inner);c.closePath();
        c.fillStyle=[p[1],p[3],'#9694d0','#e4b97c'][k%4];c.fill();lead();c.restore();
      }
      for(const r of [28,119,197,204]){c.beginPath();c.arc(0,0,r,0,Math.PI*2);lead();}
      flower(c,0,0,25,8,p);
    }else if(kind==='revzen'){
      const arch=(x,w,top,bottom)=>{c.beginPath();c.moveTo(x-w,bottom);c.lineTo(x-w,top+50);c.bezierCurveTo(x-w,top+25,x-12,top+9,x,top);c.bezierCurveTo(x+12,top+9,x+w,top+25,x+w,top+50);c.lineTo(x+w,bottom);c.closePath();};
      for(let k=-2;k<=2;k++){
        const x=k*77,top=-175+Math.abs(k)*35;
        arch(x,35,top,205);c.fillStyle=k%2?p[3]:p[1];c.fill();lead();
        c.save();c.clip();
        for(let y=-110;y<230;y+=64){
          c.beginPath();c.moveTo(x,y-30);c.quadraticCurveTo(x+37,y,x,y+30);c.quadraticCurveTo(x-37,y,x,y-30);c.fillStyle='#b8e3c9';c.fill();lead();flower(c,x,y,12,6,p);
          c.beginPath();c.moveTo(x-35,y+32);c.lineTo(x+35,y+32);lead();
        }c.restore();
      }
      arch(0,198,-205,218);lead();arch(0,205,-215,220);lead();
    }else{
      // Shared star vertices and diamond panes form a continuous window grille.
      for(let row=-4;row<=4;row++)for(let col=-4;col<=4;col++){
        const x=col*64,y=row*64;c.beginPath();
        for(let k=0;k<16;k++){const a=k*Math.PI/8,r=k%2?17.3:32,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;k?c.lineTo(px,py):c.moveTo(px,py);}
        c.closePath();c.fillStyle=(row+col)%2?p[1]:p[3];c.fill();lead();
        c.beginPath();c.moveTo(x+32,y);c.lineTo(x+64,y+32);c.lineTo(x+32,y+64);c.lineTo(x,y+32);c.closePath();c.fillStyle='#bfdfb7';c.fill();lead();
        flower(c,x,y,9,4,p);
      }
      c.beginPath();c.arc(0,0,202,0,Math.PI*2);lead();
    }
    return;
  }
  if(kind==='hatayi'){
    // A full plate-sized medallion instead of a field of tiny repeated icons.
    c.translate(270,440);
    for(const radius of [192,202]){c.strokeStyle=p[0];c.lineWidth=radius===202?5:1.5;c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.stroke();}
    // Each curling branch meets the next sector, making one continuous arabesque.
    for(let k=0;k<12;k++){
      c.save();c.rotate(k*Math.PI/6);
      c.beginPath();c.moveTo(0,-48);c.bezierCurveTo(-54,-78,-46,-142,0,-190);
      c.bezierCurveTo(65,-160,76,-122,52.5,-90.93);
      c.bezierCurveTo(24,-73,16,-67,0,-48);
      c.strokeStyle=p[0];c.lineWidth=4;c.stroke();c.strokeStyle=p[2];c.lineWidth=1.4;c.stroke();
      c.beginPath();c.moveTo(0,-105);c.bezierCurveTo(4,-146,57,-144,52.5,-90.93);c.strokeStyle=p[3];c.lineWidth=2;c.stroke();
      leaf(c,-22,-99,-.65,.85,p);leaf(c,23,-152,.7,.8,p);c.restore();
    }
    flower(c,0,0,59,12,p);
    for(let k=0;k<12;k++){
      c.save();c.rotate(k*Math.PI/6);c.strokeStyle=p[0];c.lineWidth=1.6;
      c.beginPath();c.moveTo(0,-63);c.bezierCurveTo(52,-92,-43,-141,0,-188);c.stroke();
      flower(c,0,-105,26,8,p);leaf(c,0,-148,-.55,.9,p);leaf(c,3,-173,.65,.65,p);
      flower(c,0,-195,6,5,p);c.restore();
    }
    return;
  }
  const step=kind==='tulip'?88:80;
  // Staggered lattice nodes are shared by neighboring repeats. Draw the vines
  // first, so flowers grow out of their junctions instead of floating in a grid.
  const anchor=kind==='tulip'?38:kind==='rumi'?-20:kind==='cintemani'?3:0;
  for(let row=-2;row<8;row++)for(let col=-2;col<8;col++){
    const x=62+col*step+(row%2)*step/2,y=235+row*step+anchor;
    for(const side of [-1,1]){
      c.beginPath();c.moveTo(x,y);
      c.bezierCurveTo(x+side*step*.58,y+step*.12,x-side*step*.12,y+step*.8,x+side*step/2,y+step);
      c.strokeStyle=p[0];c.lineWidth=kind==='rumi'?5:kind==='cintemani'?3.8:2.5;c.stroke();
      c.strokeStyle=kind==='rumi'?p[2]:p[3];c.lineWidth=kind==='rumi'?1.7:1;c.stroke();
      if(kind!=='cintemani'){
        leaf(c,x+side*step*.216,y+step*.359,side*.85,kind==='rumi'?.85:.65,p);
      }
    }
    if(kind==='cintemani'){
      for(const offset of [23,32]){
        c.beginPath();c.moveTo(x,y+offset);c.bezierCurveTo(x+step*.3,y+offset-16,x+step*.7,y+offset+16,x+step,y+offset);
        c.strokeStyle=offset===23?p[0]:p[3];c.lineWidth=2.6;c.stroke();
      }
    }
  }
  for(let row=-1;row<7;row++)for(let col=-1;col<7;col++){
    c.save();c.translate(62+col*step+(row%2)*step/2,235+row*step);
    c.strokeStyle=p[0];c.lineWidth=1.3;
    if(kind==='rumi'){
      for(const side of [-1,1]){
        c.save();c.scale(side,1);c.fillStyle=p[0];
        c.beginPath();c.moveTo(0,37);c.bezierCurveTo(43,22,38,-13,13,-30);c.bezierCurveTo(30,-1,9,4,4,-10);c.bezierCurveTo(-5,7,31,12,0,37);c.fill();
        c.strokeStyle=p[2];c.lineWidth=1;c.beginPath();c.moveTo(6,28);c.bezierCurveTo(33,13,21,-5,17,-10);c.stroke();
        leaf(c,26,-11,.55,.5,p);c.restore();
      }
      flower(c,0,-20,14,5,p);
    }else if(kind==='tulip'){
      c.beginPath();c.moveTo(0,38);c.bezierCurveTo(-8,7,8,-1,0,-15);c.stroke();
      leaf(c,-1,29,-.85,1.1,p);leaf(c,1,18,.9,.85,p);
      c.fillStyle=p[1];c.beginPath();c.moveTo(0,-7);c.bezierCurveTo(-21,-13,-18,-29,-16,-39);c.lineTo(-5,-26);c.lineTo(0,-45);c.lineTo(5,-26);c.lineTo(16,-39);c.bezierCurveTo(18,-23,18,-12,0,-7);c.fill();c.stroke();
      c.strokeStyle=p[2];c.lineWidth=1.2;c.beginPath();c.moveTo(0,-12);c.quadraticCurveTo(-6,-23,-9,-30);c.moveTo(3,-13);c.lineTo(5,-24);c.stroke();
      flower(c,34,9,8,5,[p[0],p[2],p[1],p[2]]);
    }else if(kind==='penc'){
      c.beginPath();c.moveTo(-40,0);c.bezierCurveTo(-18,-42,18,42,40,0);c.stroke();
      flower(c,0,0,25,5,p);leaf(c,28,12,.8,.65,p);leaf(c,-28,-12,Math.PI+.8,.65,p);
      flower(c,40,40,9,5,[p[0],p[2],p[1],p[3]]);
    }else{
      for(const [x,y] of [[0,-19],[-13,3],[13,3]]){
        c.fillStyle=p[0];c.beginPath();c.arc(x,y,10,0,Math.PI*2);c.fill();
        c.fillStyle=p[1];c.beginPath();c.arc(x,y,6.5,0,Math.PI*2);c.fill();
        c.fillStyle=p[2];c.beginPath();c.arc(x-1,y-1,2.3,0,Math.PI*2);c.fill();
      }
    }
    c.restore();
  }
}
export function drawTilePattern(c,kind,cell){
  let tile=cache.get(kind);
  if(!tile){
    tile=document.createElement('canvas');tile.width=864;tile.height=864;
    const ctx=tile.getContext('2d');ctx.scale(2,2);ctx.translate(-54,-224);
    ornament(ctx,kind,colors[kind]);cache.set(kind,tile);
  }
  const xs=cell.poly.map(p=>p.x),ys=cell.poly.map(p=>p.y);
  const x=Math.max(54,Math.floor(Math.min(...xs))-1),y=Math.max(224,Math.floor(Math.min(...ys))-1);
  const w=Math.min(486,Math.ceil(Math.max(...xs))+1)-x,h=Math.min(656,Math.ceil(Math.max(...ys))+1)-y;
  if(w>0&&h>0)c.drawImage(tile,(x-54)*2,(y-224)*2,w*2,h*2,x,y,w,h);
}
