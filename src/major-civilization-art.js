import { weaponMotion } from './crown-battle-weapon-motion.js';
// Small, equipment-led silhouettes. Contemporary pictures and textual evidence
// have different limits; each catalogue entry records those limits explicitly.
const INK='#30392f',STEEL='#a4b0a4';
function pens(g){
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.55;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();};
  return {line,poly,oval};
}
function rows(g,x,y,w,h,color=STEEL){
  const {line,oval}=pens(g);
  for(let j=0;j<h;j+=2.4){line('#566258',.6,[[x,y+j],[x+w,y+j]]);for(let i=0;i<w;i+=2){line(color,.5,[[x+i,y+j+.4],[x+i,y+j+2]]);oval('#d6c598',x+i+.7,y+j+1,.3,.3);}}
}
export function drawMajorArmor(g,p){
  if(!p.armor?.startsWith('mc'))return false;
  const {poly,line,oval}=pens(g),c=p.cloth,s=p.skin||'#be9976',a=p.armor;
  if(a==='mcPersianRobe'){
    poly(c,[[-5,-22],[4,-22],[6,-16],[4,-14],[6,2],[-6,2],[-5,-14],[-7,-18]]);
    line('#715b3d',1.3,[[-5,-13],[4,-13]]);
    line(p.trim,1,[[-5,0],[5,0]]);
    for(const [x,y]of[[-2,-19],[2,-16],[-2,-10],[3,-6],[-2,-3]]){
      for(let i=0;i<4;i++)oval(p.trim,x+Math.cos(i*Math.PI/2),y+Math.sin(i*Math.PI/2),.55,.55);
      oval('#efe1a6',x,y,.45,.45);
    }
  }else if(a==='mcAssyrianKilt'){
    poly(c,[[-5,-22],[4,-22],[4,-12],[6,-5],[-6,-5],[-4,-12]]);
    line('#d6b47a',1.8,[[-5,-12],[5,-12]]);
    for(let x=-5;x<=5;x+=1.5)line('#c6a16c',.6,[[x,-10],[x,-4]]);
    line('#715a3e',2,[[-5,-12],[-8,0]]);line(STEEL,1.1,[[-6,-13],[-3,-11]]);
    line('#d6b47a',.8,[[-4,-21],[0,-19],[4,-21]]);
  }else if(a==='mcUnku'){
    poly(c,[[-6,-23],[5,-23],[6,-5],[-6,-5]]);
    line('#dfc48a',1.1,[[-3,-22],[0,-18],[3,-22]]);
    for(const y of [-16,-10])for(const x of [-4,0,4])poly('#483e30',[[x,y-2],[x+1.5,y],[x,y+2],[x-1.5,y]]);
    line('#e0bc75',1.1,[[-5,-6],[5,-6]]);poly('#80603d',[[-8,-12],[-5,-11],[-5,-6],[-9,-6]]);
  }else if(a==='mcShortTunic'){
    poly(c,[[-4,-22],[2,-22],[4,-18],[4,-12],[7,-6],[-6,-6],[-4,-12]]);
    line('#e3d3a5',.9,[[-4,-21],[-1,-18],[2,-22]]);line('#705639',1.2,[[-4,-12],[4,-12]]);
    poly('#786548',[[-6,-11],[-3,-11],[-3,-7],[-7,-7]]);line('#746248',.6,[[-2,-16],[-3,-8]]);
  }else if(a==='mcSwissPlate'){
    poly(c,[[-5,-22],[4,-22],[5,-6],[0,-8],[-5,-6]]);
    poly(STEEL,[[-4,-22],[3,-22],[5,-15],[3,-11],[-4,-11],[-5,-17]]);
    line('#e4e4c9',.7,[[0,-21],[1,-14],[-1,-12]]);
    poly('#8d9e91',[[-4,-11],[3,-11],[5,-7],[-5,-7]]);line('#4d5e51',.7,[[-4,-9],[4,-9]]);
  }else if(a==='mcSurcoat'){
    poly(STEEL,[[-6,-22],[5,-22],[6,-4],[-6,-4]]);rows(g,-5,-21,10,16,'#64776c');
    poly(c,[[-4,-23],[3,-23],[4,-14],[5,-2],[1,-2],[0,-7],[-1,-2],[-5,-2],[-4,-14]]);
    line('#c6b77d',1,[[-4,-12],[4,-12]]);line('#d7cf9f',.7,[[-4,-3],[-1,-3],[0,-7],[1,-3],[4,-3]]);
  }else if(a==='mcMongolLamellar'){
    poly('#6e5140',[[-6,-23],[5,-23],[5,-14],[7,-4],[1,-3],[0,-8],[-1,-3],[-7,-4],[-5,-14]]);
    rows(g,-5,-22,10,10,'#b4a583');rows(g,-5,-11,10,7,'#b4a583');
    for(const x of [-7,4]){poly('#7a6a50',[[x,-23],[x+3,-23],[x+3,-17],[x,-17]]);rows(g,x,-22,3,5);}
    line('#d3ae6d',1.3,[[-5,-12],[5,-12]]);
  }else if(a==='mcQinPlates'){
    poly(c,[[-6,-22],[5,-22],[6,-4],[-6,-4]]);
    poly('#666d5d',[[-5,-22],[4,-22],[5,-7],[-5,-7]]);rows(g,-4,-21,8,13,'#c1b58a');
    line('#af8461',1.4,[[-5,-12],[5,-12]]);
    poly('#707767',[[-7,-22],[-4,-22],[-4,-17],[-7,-18]]);
  }else if(a==='mcKoreanCoat'){
    poly(c,[[-6,-22],[5,-22],[5,-13],[7,-4],[-6,-4],[-5,-14]]);
    poly('#737d65',[[-4,-21],[3,-21],[4,-12],[-4,-12]]);rows(g,-3,-20,6,6,'#c1ba8d');
    line('#c4ba93',1,[[-4,-22],[2,-17],[2,-6]]);line('#574d39',1.2,[[-5,-12],[5,-12]]);
    line('#c4ba93',.8,[[-5,-5],[6,-5]]);
  }else if(a==='mcBrigandine'){
    poly(c,[[-5,-22],[4,-22],[4,-13],[6,-7],[1,-6],[0,-9],[-2,-6],[-6,-7],[-4,-13]]);
    for(const y of [-20,-17,-14])for(const x of [-3,0,3])oval('#d3c89b',x,y,.45,.45);
    line('#574b35',1.2,[[-4,-11],[4,-11]]);line('#c6b383',.7,[[0,-21],[0,-12]]);
    poly('#66513b',[[-6,-13],[-3,-12],[-4,-6],[-8,-7]]);
  }else if(a==='mcSyrianRobe'){
    poly(c,[[-5,-22],[4,-22],[4,-13],[6,1],[-6,1],[-4,-13]]);
    poly('#85836b',[[-5,-21],[4,-21],[4,-14],[-4,-14]]);rows(g,-4,-20,8,5,'#b3b29a');
    for(const x of [-3,0,3])line('#9a8a6c',.6,[[x,-12],[x*1.3,0]]);
    line('#816347',1.2,[[-4,-13],[4,-13]]);
  }else if(a==='mcEgyptBands'){
    poly(s,[[-5,-22],[4,-22],[4,-12],[-4,-12]]);
    line('#d4bf88',1.2,[[-4,-22],[4,-13]]);line('#d4bf88',1.2,[[4,-22],[-4,-13]]);
    poly(c,[[-4,-12],[4,-12],[6,-4],[-5,-4]]);line('#a8926d',.7,[[3,-11],[-3,-4]]);
    line('#b7a47d',1.1,[[-4,-12],[4,-12]]);
  }else if(a==='mcArabTunic'){
    poly(c,[[-5,-22],[4,-22],[4,-14],[7,0],[1,1],[0,-3],[-2,1],[-6,0],[-4,-14]]);
    line('#d7ccb0',1,[[-3,-22],[0,-18],[2,-22]]);line('#76573b',1.4,[[-4,-13],[4,-13]]);
    line('#8e7c5c',.7,[[-2,-11],[-3,-2]]);line('#d7ccb0',.7,[[-5,-1],[-2,0]]);
  }else if(a==='mcKhmerSampot'){
    poly(s,[[-5,-22],[4,-22],[4,-12],[-4,-12]]);
    line('#805736',.6,[[-3,-19],[0,-18],[3,-19]]);
    poly(c,[[-4,-12],[4,-12],[7,-6],[2,-3],[0,-7],[-2,-3],[-7,-6]]);
    line('#d0b77d',1,[[-4,-12],[4,-12]]);poly('#b28a58',[[0,-12],[3,-11],[2,-2],[-1,-3]]);
    line('#665539',.7,[[-4,-10],[-2,-6]]);
  }
  return true;
}
export function drawMajorHead(g,p){
  if(!p.head?.startsWith('mc'))return false;
  const {poly,line,oval}=pens(g),h=p.head,s=p.skin||'#be9976';
  oval(s,.5,-24,3,3.7);poly(s,[[2,-25],[4.2,-23.5],[3,-23],[3,-21],[0,-20.5]]);
  if(h==='mcPersianBand'){
    poly('#403a2c',[[-4,-28],[1,-29],[3,-27],[1,-26],[-2,-25],[-2,-21],[0,-20],[3,-22],[3,-19],[0,-17],[-4,-21]]);
    line('#bdab70',1.2,[[-4,-27],[3,-27]]);for(const y of [-24,-21,-19])line('#88794e',.5,[[-3,y],[0,y+1]]);
  }else if(h==='mcAssyrianCone'){
    poly('#9b9c7d',[[-4,-26],[-3,-30],[0,-36],[3,-30],[4,-26]]);line('#d6c58c',1,[[-4,-26],[4,-26]]);
    line('#cecfb0',.7,[[0,-34],[1,-28]]);poly('#463b2d',[[-3,-24],[-3,-21],[0,-18],[3,-19],[3,-22],[0,-21]]);
  }else if(h==='mcIncaBand'){
    poly('#37392c',[[-4,-25],[-4,-28],[2,-29],[4,-27],[2,-26],[-2,-26],[-2,-22],[-4,-22]]);
    line('#c6954f',1.8,[[-4,-27],[4,-27]]);line('#663b29',.7,[[-4,-27],[4,-27]]);
    line('#bda66a',1,[[-4,-27],[-6,-23]]);oval('#c9b27b',-2,-23,1,1.3);
  }else if(h==='mcBalearicHair'){
    poly('#4d4531',[[-4,-25],[-5,-28],[-2,-30],[2,-30],[4,-27],[2,-26],[-1,-26],[-2,-23],[-4,-23]]);
    line('#ad8f64',1,[[-4,-27],[3,-27]]);line('#b6a784',.9,[[-4,-27],[-7,-26],[-7,-22]]);
  }else if(h==='mcSwissKettle'||h==='mcCastilianKettle'){
    const spanish=h==='mcCastilianKettle';
    poly(STEEL,[[-4,-27],[-3,-31],[0,spanish?-34:-32],[3,-31],[4,-27]]);
    poly('#899b8f',[[-7,-27],[-3,-28],[4,-28],[7,-26],[3,-25],[-3,-25]]);
    line('#d6debf',.7,[[-3,-30],[0,-31],[3,-29]]);
    if(spanish){line('#65553e',.7,[[-3,-24],[0,-21],[3,-24]]);poly('#958d69',[[-4,-24],[-3,-23],[-4,-20],[-5,-21]]);}
  }else if(h==='mcGreatHelm'){
    poly(STEEL,[[-4,-32],[3,-32],[5,-30],[5,-22],[2,-20],[-4,-22]]);
    line('#d6d5ab',1,[[1,-32],[1,-22]]);line('#d6d5ab',.8,[[-4,-27],[4,-27]]);
    line('#263b30',.9,[[-3,-28],[0,-28]]);line('#263b30',.9,[[2,-28],[4,-28]]);
    for(const x of [-2,3])for(const y of [-25,-23])oval('#4d6251',x,y,.35,.35);
  }else if(h==='mcMongolHelm'){
    poly('#80664a',[[-5,-27],[4,-27],[5,-20],[2,-19],[2,-23],[-1,-24],[-2,-20],[-5,-19]]);rows(g,-4,-26,3,6);
    poly(STEEL,[[-4,-27],[-3,-30],[0,-33],[3,-30],[4,-27]]);
    line('#d5c492',.8,[[0,-33],[0,-27]]);line('#b3a375',1,[[-4,-27],[4,-27]]);
    line('#5c4130',1,[[0,-34],[0,-36]]);
  }else if(h==='mcQinKnot'){
    poly('#384134',[[-4,-26],[-4,-29],[-2,-30],[2,-29],[4,-27],[1,-27],[-2,-26],[-2,-23],[-4,-24]]);
    oval('#384134',-2.5,-31.7,2,2);line('#aa9470',.8,[[-4,-30],[-1,-30]]);
    line('#4a4934',.8,[[1,-21],[3,-21]]);
  }else if(h==='mcKoreanCap'){
    poly('#3c4840',[[-4,-26],[-4,-29],[-1,-32],[2,-32],[3,-29],[4,-26]]);
    line('#a3a78a',.8,[[-4,-27],[4,-27]]);poly('#465448',[[-4,-27],[-5,-22],[-3,-21],[-2,-26]]);
  }else if(h==='mcSyrianCone'){
    poly('#a5a18b',[[-4,-26],[-3,-29],[0,-33],[2,-31],[4,-27],[4,-25]]);
    line('#ded1a6',.7,[[0,-31],[1,-27]]);poly('#a79a79',[[-4,-26],[-2,-25],[-2,-21],[-5,-20]]);
  }else if(h==='mcEgyptHair'){
    poly('#353b2c',[[-4,-25],[-3,-28],[0,-29],[3,-28],[4,-26],[0,-26],[-2,-25],[-2,-22],[-4,-22]]);
    for(const x of [-3,-1,1])line('#686447',.4,[[x,-28],[x,-26]]);
  }else if(h==='mcArabWrap'){
    poly('#ded1af',[[-4,-27],[-3,-30],[1,-31],[4,-29],[5,-26],[1,-25],[-2,-26],[-3,-21],[-6,-18],[-6,-24]]);
    line('#a49774',.7,[[-3,-28],[2,-27],[4,-28]]);line('#a49774',.6,[[-2,-30],[2,-29]]);
    poly('#4a3d2d',[[-2,-23],[-1,-20],[1,-18],[3,-20],[3,-22],[1,-21]]);
  }else if(h==='mcKhmerWrap'){
    poly('#4b4431',[[-4,-25],[-4,-28],[0,-30],[3,-28],[3,-26],[-1,-26],[-2,-23]]);
    line('#c1a773',1.5,[[-4,-27],[3,-27]]);line('#aa8b58',1.1,[[-4,-27],[-6,-24],[-6,-20]]);
  }
  if(h!=='mcGreatHelm')oval('#26392b',2.3,-24,.4,.4);
  return true;
}
export function drawMajorWeapon(g,p,action,phase){
  if(!p.weapon?.startsWith('mc'))return false;
  const {poly,line,oval}=pens(g),w=p.weapon,attack=action==='attack'?Math.sin(phase*Math.PI):0,s=p.skin||'#be9976';
  const arm=(pts,bare=false)=>{line(INK,3.5,pts);line(bare?s:p.cloth,2.7,pts);const [x,y]=pts.at(-1);oval(s,x,y,1.1,1.1);};
  if(w==='mcEgyptBow'||w==='mcKhmerBow'){
    const egypt=w==='mcEgyptBow',top=egypt?-37:-32,bottom=egypt?-2:-6;
    const released=action==='attack'&&phase>=.5,nock=released?10:6-attack*5;
    arm([[3,-19],[7,-18],[14,-19]],true);arm([[-2,-19],[1,-16],[nock,-20]],true);
    g.beginPath();g.moveTo(10,top);g.bezierCurveTo(17,top+6,17,bottom-6,10,bottom);g.strokeStyle='#80603c';g.lineWidth=1.7;g.stroke();
    line('#ded2aa',.5,[[10,top],[nock,-20],[10,bottom]]);
    if(!released){line('#bba675',.65,[[nock,-20],[25,-20]]);poly('#a6aa8d',[[25,-21],[28,-20],[25,-19]]);}
    if(egypt)for(const dy of [2,3.5])line('#a99362',.6,[[nock-2,-20+dy],[21,-20+dy]]);
  }else if(w==='mcHookLance'){
    const pose=weaponMotion(w,action,phase,.64),hx=9+pose.x,hy=-17+pose.y;arm([[3,-19],[6,-15],[hx,hy]]);arm([[-2,-19],[-4,-14],[-1,-12]]);
    const angle=action==='charge'?1.48:action==='charge-ready'?.64+.84*phase*8/7:pose.angle;
    g.save();g.translate(hx,hy);g.rotate(angle);
    line('#8e693e',1.6,[[0,19],[0,-24]]);
    poly(STEEL,[[0,-30],[-1.5,-24],[0,-22],[1.5,-24]]);
    line(STEEL,1.3,[[0,-23],[4,-21],[4,-18],[2,-17]]);
    line('#d7d9bc',.6,[[0,-29],[0,-24]]);g.restore();
  }else{
    const pike=w==='mcPike',len=pike?35:27;
    const pose=weaponMotion(w,action,phase,.1),hx=7+pose.x,hy=-17+pose.y;
    arm([[3,-19],[7,-15],[hx,hy]]);arm([[-2,-19],[3,-11],[hx-Math.sin(pose.angle)*6,hy+Math.cos(pose.angle)*6]]);
    g.save();g.translate(hx,hy);g.rotate(pose.angle);
    line('#80613d',1.5,[[0,24],[0,-len]]);
    const metal=pike?STEEL:'#a6a078';
    poly(metal,[[0,-len-5],[-1.4,-len],[0,-len+2],[1.4,-len]]);
    if(!pike){poly(metal,[[-2,-len+3],[1,-len+3],[8,-len+1],[7,-len+4],[1,-len+5],[-2,-len+5]]);line('#d1c898',.6,[[2,-len+4],[7,-len+2]]);}
    line('#c4b17e',.8,[[-1,-len+6],[1,-len+6]]);g.restore();
  }
  return true;
}
