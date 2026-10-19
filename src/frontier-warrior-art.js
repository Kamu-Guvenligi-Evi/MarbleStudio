import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK='#30332e', SKIN='#bd9978';
function pens(g) {
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.6;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.45;g.stroke();};
  return {line,poly,oval};
}
function mail(g,x,y,w,h) {
  const {line}=pens(g);
  for(let yy=y;yy<y+h;yy+=1.7)for(let xx=x;xx<x+w;xx+=1.8)line('#b3b7a7',.45,[[xx,yy],[xx+.5,yy+.6],[xx+1,yy]]);
}
export function drawFrontierArmor(g,p) {
  if(p.armor==='byzantinePaddedArmor') {
    const {line,poly}=pens(g);
    poly('#7e8274',[[-6,-23],[6,-23],[7,-16],[5,-10],[7,-2],[1,-1],[0,-7],[-1,-1],[-7,-2],[-5,-10],[-7,-16]]);
    for(let y=-22;y<-1;y+=2.4){line('#b3ae8d',.65,[[-5,y],[5,y]]);for(let x=-4;x<5;x+=2)line('#414b42',.45,[[x,y],[x,y+1.6]]);}
    poly(p.cloth,[[-5,-23],[5,-23],[4,-15],[5,-10],[6,-3],[1,-2],[0,-8],[-1,-2],[-6,-3],[-5,-10],[-4,-15]]);
    // Quilted epilorikion over the lamellar body, with a split riding skirt.
    for(let y=-21;y<-4;y+=4)for(let x=-3;x<4;x+=3)line('#b07a62',.5,[[x,y-1.4],[x+1.4,y],[x,y+1.4],[x-1.4,y],[x,y-1.4]]);
    line('#4d392e',1.7,[[-5,-11],[5,-11]]);line('#baab7e',.8,[[-1,-11],[1,-11]]);
    line('#575a51',2,[[-5,-9],[-8,-1]]);line('#b5aa84',.65,[[-5,-9],[-8,-1]]);
    return true;
  }
  if(!['sogdLongArmor','scotsAketon','mingShortCoat'].includes(p.armor))return false;
  const {line,poly}=pens(g);
  if(p.armor==='sogdLongArmor') {
    poly('#777f78',[[-5,-22],[5,-22],[6,-16],[5,-11],[7,-2],[1,-2],[0,-8],[-1,-2],[-7,-2],[-5,-11],[-6,-16]]);
    mail(g,-4.5,-21,9,9);
    for(let y=-11;y<-2;y+=2.5){line('#b5b39a',.7,[[-5,y],[5,y]]);for(let x=-4;x<5;x+=2)line('#4c554f',.5,[[x,y],[x,y+2]]);}
    poly(p.cloth,[[-5,-22],[-2,-22],[0,-16],[3,-22],[5,-22],[4,-11],[-4,-11]]);
    line('#e0bb80',.7,[[-2,-22],[0,-17],[3,-22]]);
    line('#5b4433',1.5,[[-5,-11],[5,-11]]);
    line('#c8b17e',.8,[[-1,-11],[1,-11]]);
  } else if(p.armor==='scotsAketon') {
    poly(p.cloth,[[-5,-22],[5,-22],[6,-15],[5,-10],[6,-3],[1,-2],[0,-6],[-1,-2],[-6,-3],[-5,-10],[-6,-15]]);
    for(let x=-4;x<5;x+=2)line('#b5b293',.7,[[x,-20],[x,-12],[x*1.15,-3]]);
    line('#554b37',1.6,[[-5,-11],[5,-11]]);
    line('#76654a',.8,[[0,-19],[0,-12],[1,-6]]);
    for(let y=-18;y<-12;y+=2)line('#4f4c37',.8,[[-.6,y],[.6,y]]);
    line('#473d30',2,[[-4,-11],[-7,-5]]);
  } else {
    poly(p.cloth,[[-6,-22],[5,-22],[7,-17],[5,-13],[6,-7],[1,-6],[0,-10],[-1,-6],[-6,-7],[-5,-13],[-7,-17]]);
    line('#d0c5a1',.9,[[-2,-22],[2,-16],[2,-12]]);
    line('#ded1ae',1.7,[[-5,-12],[5,-12]]);
    line('#d0c5a1',.7,[[-5,-7],[-1,-6],[0,-10],[1,-6],[5,-7]]);
    line('#534e3c',.65,[[-3,-19],[-4,-14]]);
    line('#d3c6a5',.8,[[4,-11],[7,-7],[6,-5]]);
  }
  return true;
}
export function drawFrontierHead(g,p) {
  if(p.head==='byzantineMailHelm') {
    const {line,poly}=pens(g);
    poly('#68716b',[[-4,-28],[4,-28],[4,-22],[6,-20],[-5,-20],[-4,-25]]);mail(g,-4,-27,8,7);
    poly('#777f76',[[-4,-28],[-3,-32],[1,-35],[3,-32],[4,-28]]);
    line('#bdba9f',.65,[[1,-34],[2,-31],[3,-29]]);
    line('#beb494',1,[[-4,-28],[4,-28]]);
    line(SKIN,1.1,[[-2,-26],[2.6,-26]]);line(INK,.6,[[.4,-26],[1.2,-26]]);
    return true;
  }
  if(!['sogdAventail','bannockburnBascinet','mingHeadwrap'].includes(p.head))return false;
  const {line,poly,oval}=pens(g);
  if(p.head!=='mingHeadwrap') {
    poly('#727c76',[[-4,-29],[4,-29],[4,-23],[6,-20],[3,-18],[-5,-20],[-4,-25]]);
    mail(g,-4,-27,8,6);
  }
  oval(SKIN,.5,-25,2.8,3.3);
  if(p.head==='sogdAventail') {
    poly('#90958a',[[-4,-28],[-3,-31],[0,-33],[3,-31],[4,-28]]);
    line('#b7b499',.8,[[0,-33],[0,-36]]);
    poly('#79847d',[[-3,-24],[-1,-23],[3,-24],[3,-20],[-3,-21]]);mail(g,-2,-23,4,2);
    line('#c5b68e',.6,[[-4,-28],[4,-28]]);
  } else if(p.head==='bannockburnBascinet') {
    poly('#a6aa9c',[[-4,-27],[-3,-31],[0,-33],[3,-30],[4,-27],[2,-28],[-2,-28]]);
    line('#ded9be',.65,[[0,-32],[2,-29]]);
  } else {
    poly('#45453a',[[-4,-27],[-3,-30],[1,-31],[4,-29],[4,-27]]);
    poly('#d5cbae',[[-4,-29],[-3,-31],[3,-30],[4,-28],[3,-27],[-2,-29]]);
    line('#d5cbae',1.4,[[-3,-29],[-6,-28],[-7,-25]]);
    line('#64513d',.7,[[0,-22.5],[2,-22.5]]);
  }
  line(INK,.65,[[1,-25],[2.3,-25]]);return true;
}
export function drawFrontierShield(g,p) {
  if(p.shield==='mingLongShield') {
    const {line,poly}=pens(g);
    poly('#a18a5b',[[-5,-15],[-3,-17],[4,-17],[5,-15],[5,10],[-5,10]]);
    poly('#c0aa77',[[-4,-14],[4,-14],[4,9],[-4,9]]);
    for(const x of [-2,0,2])line('#8b744b',.55,[[x,-14],[x,9]]);
    for(const y of [-10,4])line('#695b41',1.2,[[-4.5,y],[4.5,y]]);
    return true;
  }
  if(p.shield!=='mingRattan')return false;
  const {line,oval}=pens(g);
  oval('#b99b60',0,-2,7.4,8.4);
  for(let r=1;r<7;r+=1.05){g.beginPath();g.ellipse(0,-2,r,r*1.14,0,0,Math.PI*2);g.strokeStyle=r%2<1?'#dac18b':'#7c663e';g.lineWidth=.6;g.stroke();}
  for(let i=0;i<20;i++){const a=i*Math.PI/10;line('#8b7446',.45,[[Math.cos(a)*1.2,-2+Math.sin(a)*1.4],[Math.cos(a)*7,-2+Math.sin(a)*8]]);}
  oval('#d4b780',0,-2,.8,.9);return true;
}
export function drawFrontierWeapon(g,p,action,phase) {
  if(p.weapon==='byzantineMace') {
    const {line,poly,oval}=pens(g);
    const swing=action==='attack'?Math.sin(phase*Math.PI):0;
    const pose=weaponMotion(p.weapon,action,phase,-.4),hx=9+pose.x,hy=-18+pose.y;line('#788278',3.2,[[4,-21],[7,-17],[hx,hy]]);
    line('#c2b69b',.7,[[6,-20],[8,-18]]);
    g.save();g.translate(hx,hy);g.rotate(pose.angle);
    line(INK,2,[[0,3],[0,-16]]);line('#9b9c89',1,[[0,-1],[0,-14]]);
    poly('#818c81',[[-2,-14],[-2.8,-17],[-1.5,-20],[1.5,-20],[2.8,-17],[2,-14]]);
    line('#d2d0b3',.65,[[0,-19],[0,-15]]);
    for(let y=0;y<3;y++)line('#b2a37d',.6,[[-.8,y],[.8,y]]);
    g.restore();oval(SKIN,hx,hy,1.1,1.1);
    return true;
  }
  if(!['sogdLance','schiltronSpear','langxian','mingDao','mingSupportDao'].includes(p.weapon))return false;
  const {line,poly,oval}=pens(g),swing=action==='attack'?Math.sin(phase*Math.PI):0;
  const pose=weaponMotion(p.weapon==='langxian'?'spear':p.weapon,action,phase,p.weapon==='sogdLance'?.7:.22),x=7+pose.x,y=-16+pose.y;
  const angle=action==='charge'?1.35:action==='charge-ready'?.7+phase*.65:pose.angle;
  line(INK,4,[[3,-20],[5,-15],[x,y]]);line(p.cloth,3,[[3,-20],[5,-15],[x,y]]);
  if(p.weapon==='sogdLance')line('#a4aca0',2.6,[[5,-15],[x,y]]);
  g.save();g.translate(x,y);
  if(p.weapon==='mingDao'||p.weapon==='mingSupportDao') {
    g.rotate(pose.angle);
    if(p.weapon==='mingSupportDao')g.scale(1.18,1.12);
    line('#634832',1.7,[[0,3],[0,-2]]);line('#a38c57',1.3,[[-2,-2],[2,-2]]);
    poly('#c1cbc0',[[-1,-3],[-1.2,-13],[-3,-20],[-1,-18],[1.2,-13],[1,-3]]);
    line('#e7e4cb',.55,[[-2.6,-19],[.6,-13],[.6,-4]]);
  } else {
    const lang=p.weapon==='langxian',sogd=p.weapon==='sogdLance';

    g.rotate(angle);
    const len=lang?27:sogd?28:34;
    line(INK,2.2,[[0,18],[0,-len]]);line(lang?'#858951':'#927448',1.4,[[0,18],[0,-len]]);
    if(lang)for(let y=-7;y>-27;y-=3.5){const spread=5.5-(Math.abs(y)-7)*.12;for(const d of [-1,1]){line('#5a6542',1.05,[[0,y],[d*spread,y-2],[d*(spread+.5),y-4]]);line('#b0a46b',.45,[[0,y],[d*spread,y-2]]);}line('#c4b680',.8,[[-.8,y],[.8,y]]);}
    poly('#bec8bc',[[-1,-len],[0,-len-5],[1,-len],[0,-len+1]]);
  }
  g.restore();oval(SKIN,x,y,1.1,1.1);
  if(p.weapon!=='mingDao'){const gripAngle=p.weapon==='mingSupportDao'?pose.angle:angle,grip=p.weapon==='mingSupportDao'?3:5;const sx=x-Math.sin(gripAngle)*grip,sy=y+Math.cos(gripAngle)*grip;line(p.cloth,2.6,[[-3,-19],[-1,-15],[sx,sy]]);oval(SKIN,sx,sy,1,1);}
  return true;
}

// Separate head/neck and split lower covering keep the horse's legs visible.
export function drawFrontierHorseArmor(g,p) {
  if(!p.byzantineBarding)return;
  const {line,poly,oval}=pens(g);
  const sections=[
    [[-17,-21],[8,-23],[13,-18],[12,-9],[7,-8],[3,-13],[0,-8],[-7,-10],[-16,-7]],
    [[7,-22],[12,-30],[16,-34],[20,-29],[24,-27],[23,-24],[19,-25],[16,-20],[13,-12],[7,-15]],
  ];
  for(const pts of sections){
    poly('#79634b',pts);g.save();g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.clip();
    for(let y=-34;y<-7;y+=2.8){line('#b59c72',.7,[[-18,y],[24,y]]);for(let x=-17;x<25;x+=2.5){line('#493f33',.5,[[x,y+.3],[x,y+2.1]]);line('#b39c78',.45,[[x+.8,y+.8],[x+1.5,y+.8]]);}}
    g.restore();
  }
  oval('#282d29',18.5,-29,1,.75);oval('#292c26',23,-25.4,.6,.5);
  line('#c0a87c',.8,[[15,-32],[17,-26],[21,-24]]);
}
