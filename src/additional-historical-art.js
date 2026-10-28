import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK='#30392f',STEEL='#a5b0a7';
function pens(g){
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.55;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();};
  return {line,poly,oval};
}
export function drawAdditionalArmor(g,p){
  if(!p.armor?.startsWith('ah'))return false;
  const {line,poly,oval}=pens(g),c=p.cloth,s=p.skin||'#be9976';
  if(p.armor==='ahDomaru'){
    poly(c,[[-6,-23],[5,-23],[5,-13],[7,-5],[2,-4],[0,-9],[-2,-4],[-7,-5],[-5,-13]]);
    for(const [x,y,w,h] of [[-5,-22,10,10],[-7,-23,3,7],[4,-23,4,7],[-6,-11,4,6],[1,-11,5,6]]){
      poly('#434b43',[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
      for(let dy=1;dy<h;dy+=1.8){line('#b39b6b',.6,[[x,y+dy],[x+w,y+dy]]);for(let dx=1;dx<w;dx+=2)line(c,.9,[[x+dx,y+dy-.5],[x+dx,y+dy+.6]]);}
    }
    line('#bca579',1.1,[[-5,-12],[5,-12]]);
  }else if(p.armor==='ahKnight'){
    poly(c,[[-6,-22],[5,-22],[6,-4],[1,-3],[0,-7],[-2,-3],[-6,-4]]);
    poly(STEEL,[[-4,-22],[3,-22],[5,-18],[4,-12],[-4,-12],[-5,-18]]);
    line('#e1dfc5',.8,[[0,-21],[1,-17],[0,-13]]);
    for(const x of [-6,4])oval(STEEL,x,-21,2.2,2);
    for(let y=-11;y<-6;y+=1.8)line('#a2aaa0',1,[[-4,y],[4,y]]);
    line('#705338',1.3,[[-5,-12],[4,-12]]);
  }else if(p.armor==='ahPhalangite'){
    poly(c,[[-5,-22],[4,-22],[5,-5],[-5,-5]]);
    poly('#b7a574',[[-4,-22],[3,-22],[4,-12],[-4,-12]]);
    for(const x of [-4,-1,2])poly('#d5c9a4',[[x,-12],[x+2,-12],[x+2,-6],[x,-6]]);
    line('#806840',1,[[-4,-13],[4,-13]]);line('#c3b27e',2,[[-4,-22],[4,-12]]);
    // Small shield suspended on the left forearm/strap, leaving both hands free.
    oval('#796a44',-6,-16,5.3,5.6);oval('#bca46e',-6,-16,4.6,4.9);oval('#d0b779',-6,-16,2,2);
  }else if(p.armor==='ahTunic'){
    poly(c,[[-6,-22],[5,-22],[5,-14],[7,-3],[1,-2],[0,-6],[-2,-2],[-6,-3],[-4,-14]]);
    line('#d5c7a0',.9,[[-3,-22],[0,-19],[2,-22]]);line('#5b4836',1.8,[[-5,-12],[5,-12]]);
    line('#c4ac79',1,[[-5,-4],[-2,-3],[0,-6],[1,-3],[6,-4]]);
    poly('#69543b',[[-6,-12],[-3,-12],[-3,-7],[-7,-7]]);
  }else if(p.armor==='ahSampot'){
    poly(s,[[-5,-22],[4,-22],[4,-12],[-4,-12]]);line('#835b3c',.65,[[-3,-19],[0,-18],[3,-19]]);
    // Bayon relief: decorated shoulder collar, crossed chest straps, open abdomen.
    poly('#9a7954',[[-6,-23],[-2,-22],[1,-23],[5,-22],[6,-18],[2,-19],[0,-21],[-3,-18],[-6,-19]]);
    for(const x of [-4,3]){oval('#ccb17e',x,-21,.65,.65);oval('#ccb17e',x,-19.5,.45,.45);}
    line('#c1a474',.8,[[-3,-20],[3,-13]]);line('#c1a474',.8,[[3,-20],[-3,-13]]);
    poly(c,[[-4,-12],[4,-12],[6,-7],[2,-4],[0,-7],[-3,-4],[-6,-7]]);
    line('#d1b478',1,[[-4,-12],[4,-12]]);poly('#c29d6b',[[1,-12],[3,-11],[1,-3],[-2,-5]]);
    poly('#70523b',[[-7,-14],[-4,-14],[-4,-7],[-7,-7]]);
    for(const x of [-6,-5])line('#c7ac78',.65,[[x,-17],[x,-10]]);
  }else if(p.armor==='ahLeine'){
    poly(c,[[-6,-22],[5,-22],[5,-13],[7,-2],[-6,-2],[-4,-13]]);
    for(const x of [-4,-1,2,4])line('#9a8b65',.55,[[x,-12],[x+1,-3]]);
    poly('#7a795c',[[-6,-23],[3,-23],[6,-19],[4,-17],[1,-19],[-5,-17],[-7,-19]]);
    line('#d2c6a4',.7,[[-6,-21],[-3,-19],[2,-21]]);line('#756145',1,[[-4,-13],[4,-13]]);
  }
  return true;
}
export function drawAdditionalHead(g,p){
  if(!p.head?.startsWith('ah'))return false;
  const {line,poly,oval}=pens(g),s=p.skin||'#be9976';
  oval(s,0,-24,3.5,4);poly(s,[[2,-26],[4.3,-24],[3,-22],[0,-21]]);
  if(p.head==='ahKabuto'){
    poly('#465149',[[-5,-27],[4,-27],[6,-22],[3,-21],[-4,-22],[-6,-25]]);
    for(const y of [-26,-24,-22])line('#b7a177',.6,[[-5,y],[4,y]]);
    poly('#535c50',[[-4,-28],[-3,-31],[0,-33],[3,-31],[4,-28]]);
    for(const x of [-2,0,2])line('#a9a17d',.6,[[0,-32],[x,-28]]);
    line('#7f744f',1.6,[[-4,-28],[5,-28]]);line('#b5a476',1,[[1,-29],[1,-33]]);
  }else if(p.head==='ahBascinet'){
    poly('#7f8e84',[[-4,-26],[3,-26],[5,-20],[-5,-20]]);
    for(let y=-25;y<-20;y+=1.4)line('#bcc3ac',.6,[[-4,y],[4,y]]);
    poly(STEEL,[[-4,-26],[-3,-31],[0,-34],[3,-31],[4,-27],[7,-25],[3,-22],[-3,-23]]);
    line('#293a30',.9,[[1,-27],[4,-27]]);line('#d3d8c1',.6,[[0,-32],[2,-29],[6,-25]]);
    for(const x of [1,3,4])oval('#536158',x,-24,.35,.35);
  }else if(p.head==='ahHellenistic'){
    poly('#b39f70',[[-4,-27],[-4,-30],[-1,-33],[2,-32],[4,-28],[5,-27]]);
    poly('#b39f70',[[-4,-27],[-2,-26],[-2,-21],[-5,-22]]);poly('#b39f70',[[3,-27],[4,-26],[3,-22],[1,-22]]);
    line('#d7c793',.8,[[-3,-28],[4,-28]]);
  }else if(p.head==='ahClothCap'){
    poly('#73684e',[[-4,-26],[-4,-29],[-2,-31],[2,-31],[4,-28],[4,-26]]);line('#c3b18a',1,[[-4,-26],[4,-26]]);
    poly('#5c4935',[[-3,-23],[-2,-20],[1,-18],[3,-21],[3,-22],[0,-21]]);
  }else if(p.head==='ahKhmerHair'){
    poly('#3e3c2c',[[-4,-24],[-4,-28],[-1,-30],[3,-29],[4,-26],[1,-27],[-2,-26],[-2,-23]]);
    line('#bda06a',1.1,[[-4,-27],[3,-27]]);
  }else if(p.head==='ahKernHair'){
    poly('#806b42',[[-4,-24],[-4,-28],[-2,-30],[2,-30],[4,-28],[4,-23],[2,-24],[1,-27],[-1,-24],[-2,-27],[-3,-23]]);
    for(const x of [-2,0,2])line('#c0aa73',.55,[[x,-29],[x+1,-26]]);
  }
  if(p.head!=='ahBascinet')oval('#293b2c',2.3,-24,.4,.4);
  return true;
}
export function drawAdditionalWeapon(g,p,action,phase){
  if(!p.weapon?.startsWith('ah'))return false;
  const {line,poly,oval}=pens(g),w=p.weapon,s=p.skin||'#be9976',swing=action==='attack'?Math.sin(phase*Math.PI):0;
  const arm=pts=>{line(INK,3.5,pts);line(w==='ahCrossbow'?s:p.cloth,2.7,pts);const [x,y]=pts.at(-1);oval(s,x,y,1,1.1);};
  if(w==='ahOdachi'){
    // Keep the long blade inside the shared sprite at full extension.
    const pose=weaponMotion(w,action,phase,.4),angle=pose.angle,hx=8+pose.x;
    g.save();g.translate(hx,-15+pose.y);g.rotate(angle);
    line('#463e30',2.2,[[0,5],[0,-5]]);for(let y=-4;y<5;y+=2)line('#baa77a',.6,[[-1,y],[1,y+1]]);
    oval('#a38d58',0,-5,3,1);poly(STEEL,[[-.8,-6],[-.7,-29],[.4,-36],[2,-38],[1.5,-29],[1,-6]]);
    line('#e3e3c6',.7,[[1,-7],[1,-29],[2,-37]]);g.restore();
    const grip=y=>[hx-Math.sin(angle)*y,-15+pose.y+Math.cos(angle)*y];
    arm([[-2,-19],[2,-12],grip(3)]);arm([[3,-19],[6,-16],grip(-2)]);
  }else if(w==='ahCrossbow'){
    const reload=action==='attack'&&phase>.5;
    arm([[-2,-19],[2,-16],[10,-16]]);arm([[3,-19],[6,-13],[reload?7:3,reload?-11:-15]]);
    g.save();g.translate(9,-16);g.rotate(reload?-.5:0);
    line('#795735',2.5,[[-7,1],[13,0]]);
    line('#a67c47',2,[[9,-9],[13,-5],[14,0],[13,5],[9,9]]);
    line('#dbc9a0',.6,[[9,-9],[reload?11:1,0],[9,9]]);
    if(!reload){line('#c5b27d',.75,[[0,-1],[19,-1]]);poly(STEEL,[[19,-2],[22,-1],[19,0]]);}g.restore();
  }else{
    const sarissa=w==='ahSarissa',menav=w==='ahMenavlion',len=sarissa?39:menav?26:25;
    const pose=weaponMotion('spear',action,phase,sarissa?.5:.18),hx=(sarissa?3:9)+pose.x,hy=-16+pose.y;
    arm([[-2,-19],[1,-13],[hx-Math.sin(pose.angle)*5,hy+Math.cos(pose.angle)*5]]);arm([[3,-19],[7,-18],[hx,hy]]);
    g.save();g.translate(hx,hy);g.rotate(pose.angle);
    line('#805e3b',menav?2.4:1.6,[[0,sarissa?22:19],[0,-len]]);
    poly(STEEL,[[0,-len-(menav?9:5)],[-(menav?1.8:1.2),-len],[0,-len+2],[menav?1.8:1.2,-len]]);
    line('#d7dbc1',.6,[[0,-len-(menav?8:4)],[0,-len]]);g.restore();
  }
  return true;
}
