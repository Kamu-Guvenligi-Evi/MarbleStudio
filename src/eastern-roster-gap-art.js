import { weaponMotion } from './crown-battle-weapon-motion.js';
const INK='#30342e', STEEL='#a6b1a6';
function pens(g) {
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle=INK;g.lineWidth=.55;g.stroke();};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();};
  return {line,poly,oval};
}
export function drawEasternGapShield(g,p) {
  if(!p.shield?.startsWith('erg'))return false;
  const {line,poly,oval}=pens(g);
  if(p.shield==='ergEgyptShield') {
    poly('#ad9668',[[-5,7],[-5,-5],[-3,-9],[0,-10],[4,-8],[5,-5],[5,7]]);
    line('#dac99b',.9,[[-4,6],[-4,-5],[-2,-8],[0,-9],[3,-7],[4,-4],[4,6],[-4,6]]);
    line('#7e6646',1,[[0,-7],[0,6]]);
  } else if(p.shield==='ergMountainShield') {
    oval(INK,0,0,8.5,9);oval('#856b44',0,0,7.8,8.3);
    for(let x=-5;x<=5;x+=2.5)line('#b49a6d',.55,[[x,-6],[x,6]]);
    line('#534b36',1.4,[[-6,0],[6,0]]);oval(STEEL,0,0,2.1,2.1);
  } else {
    oval(INK,0,0,6.7,7);oval('#793f34',0,0,6,6.3);
    line('#c7a06b',.9,[[-4,-4],[4,4]]);line('#c7a06b',.9,[[4,-4],[-4,4]]);oval('#533f31',0,0,1.4,1.6);
  }
  return true;
}
export function drawEasternGapArmor(g,p) {
  if(!p.armor?.startsWith('erg'))return false;
  const {line,poly}=pens(g),c=p.cloth,skin=p.skin||'#be9976';
  if(p.armor==='ergArcherKilt'||p.armor==='ergLayeredKilt') {
    poly(skin,[[-4,-22],[3,-22],[5,-18],[3,-11],[-4,-11],[-5,-17]]);
    line('#8c6246',.55,[[-3,-18],[0,-17],[3,-18]]);
    const archer=p.armor==='ergArcherKilt';
    poly(c,[[-4,-12],[4,-12],[archer?5:7,archer?-5:-3],[-6,archer?-5:-3]]);
    for(let x=-3;x<=3;x+=1.5)line('#b6a67e',.5,[[x,-10],[x*1.4,-4]]);
    line('#987045',1.2,[[-4,-12],[4,-12]]);
    if(archer)line('#9a7148',1.3,[[-4,-22],[4,-12]]);
    else {poly('#eee0bc',[[0,-11],[4,-9],[2,-2],[-3,-4]]);line('#ba9c64',.6,[[0,-10],[2,-8],[0,-3]]);}
  } else if(p.armor==='ergRidingCoat') {
    poly(c,[[-5,-23],[4,-22],[5,-13],[7,-5],[2,-4],[0,-9],[-2,-4],[-7,-6],[-4,-14]]);
    poly('#b7a17a',[[-3,-22],[2,-20],[-2,-13],[-4,-15]]);
    line('#4f4b3b',1.5,[[-4,-12],[5,-12]]);
    line('#d0bb90',.65,[[-3,-21],[1,-19],[-2,-13]]);
    for(const s of [-1,1])line('#a99771',.7,[[s*3,-10],[s*5,-6]]);
    poly('#594c37',[[3,-12],[6,-12],[7,-7],[4,-7]]);
  } else if(p.armor==='ergMountainTunic') {
    poly('#5d6551',[[-5,-23],[-9,-20],[-10,-8],[-5,-5],[-1,-17],[4,-22]]);
    poly(c,[[-4,-22],[4,-21],[4,-12],[5,-4],[-5,-4],[-4,-13]]);
    line('#cdb48a',1,[[-4,-6],[4,-6]]);line('#594b37',1.5,[[-4,-12],[4,-12]]);
    line('#d3bd90',.7,[[-3,-21],[0,-18],[3,-21]]);
    line('#655b42',.55,[[0,-17],[0,-13]]);
  } else if(p.armor==='ergHanCoat') {
    poly(c,[[-5,-22],[4,-22],[5,-12],[6,-3],[-6,-3],[-5,-13]]);
    poly('#bcaa85',[[-4,-23],[3,-19],[-1,-13],[-3,-14],[0,-19],[-5,-21]]);
    line('#483e32',1.5,[[-5,-12],[5,-12]]);
    line('#ae9070',.7,[[-4,-5],[4,-5]]);
    line('#564339',.6,[[-1,-10],[-2,-4]]);
  } else {
    poly(c,[[-5,-23],[5,-23],[6,-5],[-6,-5]]);
    poly('#606e68',[[-5,-22],[4,-22],[5,-13],[-5,-13]]);
    poly('#66766b',[[-5,-12],[5,-12],[7,-3],[1,-2],[0,-6],[-1,-2],[-7,-3]]);
    for(let y=-20;y<-2;y+=2.3) {
      const w=y>-12?5.8:4;
      line('#a6af94',.6,[[-w,y],[w,y]]);
      for(let x=-3;x<=3;x+=2)line('#404e48',.5,[[x,y],[x,y+1.5]]);
    }
    poly('#788579',[[-5,-23],[-8,-21],[-7,-17],[-4,-17]]);
    poly('#788579',[[4,-23],[7,-21],[8,-17],[5,-17]]);
    line('#b8a277',1.4,[[-5,-12],[5,-12]]);
  }
  return true;
}
export function drawEasternGapHead(g,p) {
  if(!p.head?.startsWith('erg'))return false;
  const {line,poly,oval}=pens(g),skin=p.skin||'#be9976';
  oval(skin,.5,-24,3,3.5);poly(skin,[[2,-25],[4,-23.5],[3,-23],[3,-21],[0,-20.5]]);
  if(p.head==='ergLinenBand') {
    poly('#35342a',[[-4,-23],[-4,-29],[-1,-30],[3,-28],[3,-26],[-2,-26],[-2,-22]]);
    line('#dfd0a5',1.4,[[-4,-27],[3,-27]]);poly('#dfd0a5',[[-4,-27],[-6,-25],[-6,-21],[-4,-23]]);
  } else if(p.head==='ergShortHair') {
    poly('#35332a',[[-4,-24],[-4,-28],[-1,-30],[2,-29],[3,-27],[-1,-27],[-2,-24]]);
    for(let x=-3;x<=1;x+=1.3)line('#69523c',.45,[[x,-28],[x,-25]]);
  } else if(p.head==='ergRidingCap') {
    poly('#6d6650',[[-5,-26],[-3,-30],[0,-34],[3,-29],[4,-26]]);
    line('#b9a77c',1.4,[[-5,-26],[4,-26]]);
    poly('#665b43',[[-4,-25],[-2,-25],[-2,-20],[-4,-21]]);
  } else if(p.head==='ergMountainHair') {
    poly('#403a2d',[[-5,-22],[-5,-28],[-3,-31],[0,-30],[3,-28],[3,-26],[0,-27],[-2,-25],[-2,-21]]);
    poly('#403a2d',[[-1,-23],[1,-21],[3,-22],[3,-20],[0,-18],[-2,-20]]);
    line('#bca374',.8,[[-4,-27],[2,-27]]);
  } else if(p.head==='ergHanCap') {
    poly('#42433a',[[-5,-26],[-4,-30],[-2,-31],[1,-31],[3,-28],[4,-26]]);
    poly('#42433a',[[-3,-30],[-3,-33],[0,-34],[1,-30]]);
    line('#ad9875',.8,[[-4,-26],[3,-26]]);line('#6d5a40',.7,[[-3,-25],[-1,-21],[2,-21]]);
  } else {
    poly('#596d65',[[-5,-25],[-6,-21],[-5,-18],[-2,-19],[-2,-25]]);
    for(let y=-24;y<-18;y+=1.5)line('#a0ad94',.5,[[-5,y],[-2.5,y]]);
    poly(STEEL,[[-5,-26],[-4,-30],[-1,-32],[2,-31],[4,-27],[5,-26]]);
    line('#d1d1af',.8,[[-5,-26],[5,-26]]);line('#64786b',.8,[[-1,-31],[0,-27]]);
    poly('#8c9a87',[[3,-25],[4,-25],[4,-22],[2,-21],[2,-23]]);
  }
  oval(INK,2.5,-24,.4,.4);return true;
}
export function drawEasternGapWeapon(g,p,action,phase) {
  if(!p.weapon?.startsWith('erg'))return false;
  const {line,poly,oval}=pens(g),skin=p.skin||'#be9976';
  const arm=pts=>{line(INK,3.3,pts);line(p.bareLegs?skin:p.cloth,2.4,pts);const[x,y]=pts.at(-1);oval(skin,x,y,1.1,1.1);};
  if(p.weapon==='ergAngularBow') {
    const released=action==='attack'&&phase>=.5;
    const nock=6-(action==='attack'&&!released?Math.sin(phase*Math.PI)*5:0);
    arm([[3,-20],[8,-18],[13,-19]]);arm([[-3,-20],[0,-15],[nock,-20]]);
    line('#a98250',1.8,[[8,-34],[13,-28],[15,-19],[13,-10],[8,-4]]);
    line('#d7c797',.6,[[8,-34],[released?8:nock,-20],[8,-4]]);
    if(!released){line('#ba9661',.7,[[nock,-20],[24,-20]]);poly('#716853',[[24,-21],[27,-20],[24,-19]]);}
  } else {
    const spear=/Spear/.test(p.weapon),long=p.weapon==='ergSongSpear';
    const pose=weaponMotion(p.weapon,action,phase,.22),hx=7+pose.x,hy=-17+pose.y;
    g.save();g.translate(hx,hy);g.rotate(pose.angle);
    if(spear) {
      const len=long?34:27;line('#886540',1.4,[[0,11],[0,-len]]);
      poly(STEEL,[[-1.4,-len],[0,-len-5],[1.4,-len],[0,-len+1]]);
      line('#d4cfaf',.6,[[0,-len-3],[0,-len]]);
    } else if(p.weapon==='ergEgyptBattleAxe') {
      line('#795c39',2,[[0,5],[0,-23]]);
      poly('#bda16a',[[0,-21],[5,-24],[8,-23],[9,-19],[8,-14],[5,-13],[1,-16]]);
      line('#e1c48c',.7,[[8,-23],[9,-19],[8,-14]]);
      line('#b39a6e',1,[[-1,-20],[2,-19],[-1,-18],[2,-17],[-1,-16]]);
    } else if(p.weapon==='ergKhopesh') {
      line('#795d3a',2,[[0,3],[0,-4]]);
      poly('#bda16a',[[-1,-4],[-1,-11],[0,-14],[4,-15],[7,-18],[7,-23],[9,-21],[9,-17],[7,-13],[3,-11],[1,-10],[1,-4]]);
      line('#e1c48c',.65,[[1,-5],[1,-10],[6,-13],[8,-17],[8,-21]]);
    } else {
      line('#6f5039',2,[[0,3],[0,-3]]);line('#bba574',1.2,[[-3,-3],[3,-3]]);
      poly(STEEL,[[-1,-4],[-1,-21],[0,-24],[1,-21],[1,-4]]);line('#d4d5bb',.5,[[0,-5],[0,-21]]);
    }
    g.restore();arm([[3,-20],[5,-14],[hx,hy]]);
    if(long)arm([[-3,-21],[-2,-15],[hx-Math.sin(pose.angle)*7,hy+Math.cos(pose.angle)*7]]);
    else arm([[-3,-20],[-5,-14],[-6,-13]]);
  }
  return true;
}
