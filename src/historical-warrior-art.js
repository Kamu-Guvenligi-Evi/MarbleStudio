import { drawWesternArmor, drawWesternHead, drawWesternShield, drawWesternWeapon } from './western-frontier-art.js';
import { drawImperialAuxArmor, drawImperialAuxHead, drawImperialAuxShield, drawImperialAuxWeapon } from './imperial-auxiliary-art.js';
import { drawContingentArmor, drawContingentHead, drawContingentShield, drawContingentWeapon } from './achaemenid-contingent-art.js';
import { drawReinforcementArmor, drawReinforcementHead, drawReinforcementWeapon } from './commander-reinforcement-art.js';
import { weaponMotion } from './crown-battle-weapon-motion.js';
import { drawMedievalSpecialistArmor, drawMedievalSpecialistHead, drawMedievalSpecialistShield, drawMedievalSpecialistWeapon } from './medieval-specialist-art.js';
import { drawFrontierArmor, drawFrontierHead, drawFrontierShield, drawFrontierWeapon, drawFrontierHorseArmor } from './frontier-warrior-art.js';
import { drawEuropeanSpecialistArmor, drawEuropeanSpecialistHead, drawEuropeanSpecialistShield, drawEuropeanSpecialistWeapon } from './european-specialist-art.js';
import { drawMexicaRankArmor, drawMexicaRankHead, drawMexicaRankShield } from './mexica-rank-art.js';
import { drawPacificArmor, drawPacificHead, drawPacificWeapon } from './pacific-warrior-art.js';
import { drawTurkishJapaneseArmor, drawTurkishJapaneseHead, drawTurkishJapaneseWeapon } from './turkish-japanese-art.js';
import { drawEuropeCrusaderShield, drawEuropeCrusaderArmor, drawEuropeCrusaderHead, drawEuropeCrusaderWeapon } from './europe-crusader-art.js';
import { drawRusFrenchArmor, drawRusFrenchHead, drawRusFrenchWeapon } from './rus-french-art.js';
import { drawAdditionalArmor, drawAdditionalHead, drawAdditionalWeapon } from './additional-historical-art.js';
import { drawLateCavalryArmor, drawLateCavalryHead, drawLateCavalryHorse } from './late-medieval-cavalry-art.js';
import { drawYataganJanissaryArmor } from './janissary-yatagan.js';
import { drawMajorArmor, drawMajorHead, drawMajorWeapon } from './major-civilization-art.js';
import { drawRosterGapArmor, drawRosterGapHead, drawRosterGapShield, drawRosterGapWeapon } from './world-roster-gap-art.js';
import { drawEasternGapArmor, drawEasternGapHead, drawEasternGapShield, drawEasternGapWeapon } from './eastern-roster-gap-art.js';
import { drawReliefGapArmor, drawReliefGapHead, drawReliefGapShield, drawReliefGapWeapon } from './relief-roster-gap-art.js';
import { drawUnderrepresentedArmor, drawUnderrepresentedHead, drawUnderrepresentedShield, drawUnderrepresentedWeapon } from './underrepresented-roster-art.js';
import { drawRegionalGapArmor, drawRegionalGapHead, drawRegionalGapShield, drawRegionalGapWeapon } from './regional-roster-gap-art.js';
import { drawClassicalArmor, drawClassicalHead, drawClassicalShield, drawClassicalWeapon } from './classical-support-art.js';
import { drawMajorExpansionArmor, drawMajorExpansionShield, drawMajorExpansionWeapon } from './major-army-expansion-art.js';
import { drawAlliedContingentArmor, drawAlliedContingentHead, drawAlliedContingentShield } from './commander-allied-contingents-art.js';
import { drawGapArmor, drawGapHead, drawGapShield, drawGapWeapon } from './army-gap-art.js';
import { drawAncientArmor, drawAncientHead, drawAncientShield, drawAncientWeapon } from './ancient-roster-art.js';
// Equipment-led illustrations drawn from a blank canvas: no generic knight
// underneath the historical equipment. Colours are illustrative, not uniforms.
import { drawWorldArmor, drawWorldHead, drawWorldShield, drawWorldWeapon } from './world-warrior-art.js';
import { drawTurkicArmor, drawTurkicHead, drawTurkicWeapon } from './turkic-elite-art.js';
import { drawEuropeanArmor, drawEuropeanHead, drawEuropeanWeapon } from './european-elite-art.js';
import { drawItalianEnglishArmor, drawItalianEnglishHead, drawItalianEnglishWeapon } from './italian-english-art.js';
import { drawTurkicArabArmor, drawTurkicArabHead, drawTurkicArabShield } from './turkic-arab-art.js';
import { drawAndalusRumArmor, drawAndalusRumHead, drawAndalusRumShield, drawAndalusRumWeapon } from './andalus-rum-art.js';
const INK='#242b29', STEEL='#aebcba', GOLD='#c5a268', SKIN='#be9976';
function pens(g) {
  const path=pts=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));};
  const line=(c,w,pts)=>{path(pts);g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const poly=(c,pts,edge=true)=>{path(pts);g.closePath();g.fillStyle=c;g.fill();if(edge){g.strokeStyle=INK;g.lineWidth=.6;g.stroke();}};
  const oval=(c,x,y,rx,ry,edge=true)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();if(edge){g.strokeStyle=INK;g.lineWidth=.6;g.stroke();}};
  return {line,poly,oval};
}
function texture(g,p,[x,y,w,h],type) {
  const {line,oval}=pens(g);g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
  if(type==='mail')for(let j=0;j<h;j+=1.6)for(let i=0;i<w;i+=1.7)oval('#697774',x+i+(j%3>.5?.8:0),y+j,.55,.45,false);
  else if(type==='scale'||type==='lamellar')for(let j=0;j<h;j+=2)for(let i=0;i<w;i+=2){const xx=x+i+(j%4?1:0);line('#485551',.5,[[xx,y+j],[xx+.2,y+j+1.5],[xx+1.5,y+j+1.7],[xx+1.8,y+j]]);if(type==='lamellar')line(p.trim||GOLD,.35,[[xx+.8,y+j+.2],[xx+.8,y+j+.6]]);}
  else if(type==='jaguar')for(let j=0;j<h;j+=2.8)for(let i=0;i<w;i+=3)oval('#563d28',x+i+(j%5?1:0),y+j,.7,.5,false);
  else if(type==='feathers')for(let j=0;j<h;j+=2)for(let i=0;i<w;i+=2)line('#e0b66b',.55,[[x+i,y+j],[x+i+.7,y+j+1.5]]);
  g.restore();
}
function emblem(g,p,x,y,s=1) {
  const {line,oval}=pens(g),c=p.badge||'#e3c58b';
  if(p.emblem==='fleur'){
    line(c,.9*s,[[x,y+2*s],[x,y-3*s]]);
    for(const d of [-1,1])line(c,.8*s,[[x,y+s],[x+d*2*s,y-s],[x+d*2*s,y-2*s],[x+d*s,y-2*s]]);
    line(c,.8*s,[[x-s,y+s],[x+s,y+s]]);return;
  }
  if(p.emblem==='santiago'){
    line(c,.9*s,[[x,y-3*s],[x,y+2.5*s]]);
    line(c,.9*s,[[x-2*s,y-s],[x+2*s,y-s]]);
    line(c,.6*s,[[x-2.4*s,y-2*s],[x-2*s,y-s],[x-2.4*s,y]]);
    line(c,.6*s,[[x+2.4*s,y-2*s],[x+2*s,y-s],[x+2.4*s,y]]);
    line(c,.6*s,[[x-.8*s,y+1.5*s],[x,y+3*s],[x+.8*s,y+1.5*s]]);return;
  }
  if(p.emblem==='cross'){line(c,1.3*s,[[x,y-3*s],[x,y+3*s]]);line(c,1.3*s,[[x-2*s,y-s],[x+2*s,y-s]]);}
  else if(p.emblem==='lambda')line('#6e3927',s,[[x-2*s,y+2*s],[x,y-3*s],[x+2*s,y+2*s]]);
  else if(p.emblem==='stripe')line(c,1.7*s,[[x-2*s,y-3*s],[x+2*s,y+3*s]]);
  else if(p.emblem==='bolt')line(c,.8*s,[[x-2*s,y-3*s],[x+s,y-s],[x-s,y+s],[x+2*s,y+3*s]]);
  else if(p.emblem==='scorpion'){line(INK,.8*s,[[x,y+2*s],[x,y-s],[x+2*s,y-2*s],[x+2*s,y-3*s]]);for(const dy of [-1,1])line(INK,.5*s,[[x-2*s,y+dy*s],[x,y],[x+2*s,y+dy*s]]);}
  else if(p.emblem==='wings'){for(const d of [-1,1])for(let i=0;i<3;i++)line('#9a5534',.6*s,[[x,y+i*s],[x+d*2.5*s,y+(i-2)*s]]);}
  else if(['sun','studs'].includes(p.emblem)){for(let i=0;i<8;i++){const a=i*Math.PI/4;line(c,.7*s,[[x+Math.cos(a)*s,y+Math.sin(a)*s],[x+Math.cos(a)*3*s,y+Math.sin(a)*3*s]]);}}
  else if(p.emblem==='rings'){oval(c,x,y,2.5*s,2.5*s);oval(p.shieldColor||p.cloth,x,y,1.7*s,1.7*s);}
}
function shield(g,p,back=false) {
  if(!p.shield||(p.shield==='roundBack')!==back)return;
  const {line,oval,poly}=pens(g),c=p.shieldColor||p.cloth;
  g.save();g.translate(back?-5:-3.7,back?-12:-11);
  if(drawWorldShield(g,p)){g.restore();return;}
  if(drawGapShield(g,p)){g.restore();return;}
  if(drawRosterGapShield(g,p)){g.restore();return;}
  if(drawEasternGapShield(g,p)){g.restore();return;}
  if(drawReliefGapShield(g,p)){g.restore();return;}
  if(drawUnderrepresentedShield(g,p)){g.restore();return;}
  if(drawRegionalGapShield(g,p)){g.restore();return;}
  if(drawWesternShield(g,p)){g.restore();return;}
  if(drawImperialAuxShield(g,p)){g.restore();return;}
  if(drawContingentShield(g,p)){g.restore();return;}
  if(drawClassicalShield(g,p)){g.restore();return;}
  if(drawMajorExpansionShield(g,p)){g.restore();return;}
  if(drawAlliedContingentShield(g,p)){g.restore();return;}
  if(drawAncientShield(g,p)){g.restore();return;}
  if(drawTurkicArabShield(g,p)){g.restore();return;}
  if(drawAndalusRumShield(g,p)){g.restore();return;}
  if(drawMedievalSpecialistShield(g,p)){g.restore();return;}
  if(drawFrontierShield(g,p)){g.restore();return;}
  if(drawEuropeanSpecialistShield(g,p)){g.restore();return;}
  if(drawMexicaRankShield(g,p)){g.restore();return;}
  if(drawEuropeCrusaderShield(g,p)){g.restore();return;}
  if(p.shield==='adarga') {
    // Two joined leather lobes, without a metal shield boss.
    g.beginPath();g.moveTo(0,-5);g.bezierCurveTo(-6,-9,-7,1,-3,6);g.bezierCurveTo(-1,8,1,5,1,4);g.bezierCurveTo(5,7,7,1,5,-4);g.bezierCurveTo(4,-7,1,-7,0,-5);g.closePath();g.fillStyle=c;g.fill();g.strokeStyle='#624b31';g.lineWidth=.9;g.stroke();
    line('#d2b783',.6,[[0,-4],[-1,-1],[0,3]]);oval('#715535',-2,-1,.45,.45);oval('#715535',2,-1,.45,.45);
  } else if(['round','roundBack','aspis','chimalli'].includes(p.shield)) {
    const r=p.shield==='aspis'?6:4.8;oval(p.shield==='aspis'?GOLD:'#c9aa74',0,0,r,r*1.08);oval(c,0,0,r-.8,r*1.08-.8);
    if(p.emblem==='quarters'){poly('#d4c49c',[[0,0],[0,-4],[-4,0]]);poly('#d4c49c',[[0,0],[0,4],[4,0]]);}
    emblem(g,p,0,0);if(!['aspis','chimalli'].includes(p.shield))oval(STEEL,0,0,1.25,1.25);
    if(p.shield==='chimalli')for(let i=-3;i<=3;i++)line(i%2?'#d5a340':'#447d70',.8,[[i,4],[i,7-Math.abs(i)*.4]]);
  } else if(p.shield==='mayaRect'){
    poly(c,[[-4,-10],[4,-10],[4,10],[-4,10]]);
    for(let x=-3;x<4;x+=1.3)line('#8e7352',.5,[[x,-9],[x,9]]);
    line('#e1cda3',1,[[-4,-9],[4,-9]]);for(let x=-3;x<4;x++)line('#d9c092',.7,[[x,10],[x,11.5]]);
  } else if(p.shield==='beninRect'){
    poly(c,[[-5,-6],[3,-7],[5,-4],[4,6],[-5,6]]);
    line('#b49a6c',.8,[[-4,-5],[2,-6],[4,-3],[3,5],[-4,5],[-4,-5]]);
    line('#b49a6c',.6,[[-3,-4],[3,4]]);
  } else if(p.shield==='scutum'){poly(c,[[-4,-6],[3,-6],[4,-4],[4,5],[2,6],[-4,6],[-5,4],[-5,-4]]);line(GOLD,.6,[[-3,-5],[2,-5],[3,4],[1,5],[-3,5],[-3,-5]]);emblem(g,p,0,0);oval(GOLD,0,0,1.4,1.7);}
  else if(p.shield==='wicker'){poly('#af8a54',[[-4,-7],[3,-7],[4,6],[-4,6]]);for(let y=-6;y<6;y+=1.5)line('#664f32',.55,[[-3.5,y],[3,y]]);}
  else if(p.shield==='oval'){oval(GOLD,0,0,4.2,6.4);oval(c,0,0,3.5,5.7);emblem(g,p,0,0);}
  else if(p.shield==='hussar'){poly(c,[[-4,-5],[2,-8],[4,-9],[4,4],[1,6],[-4,4]]);line(GOLD,.7,[[-3,-4],[3,-7],[3,3],[0,5],[-3,3]]);}
  else {const h=p.shield==='kite'?9:6;poly(c,[[-4,-5],[3,-5],[4,-2],[1,h],[-4,0]]);emblem(g,p,-.5,-.5);}
  g.restore();
}
function horse(g,p,gait,variant) {
  const {line,oval,poly}=pens(g),palettes={bay:['#79503a','#a57850'],black:['#343c3b','#606965'],grey:['#a7aaa0','#d1cfc1'],dun:['#b29a70','#d3bb88']};
  const [dark,light]=palettes[p.horse]||palettes.bay;
  line('#33332c',2.8,[[-15,-17],[-21,-11],[-22+gait*2,-7]]);
  for(const [x,phase,far] of [[-11,-1,true],[10,1,true],[-13,1,false],[8,-1,false]]){
    const swing=gait*phase*4, bend=x<0?2.4:-.8,knee=x+bend+swing*.5,foot=x-swing+(far?2:-1),c=far?dark:light;
    poly(c,[[x-2,-17],[x+2,-17],[knee+1.2,-8],[foot+.8,-2],[foot+.5,-.5],[foot-1,-.5],[foot-.7,-3],[knee-1,-8]]);
    oval(c,knee,-8,1.25,1.5,false);line(dark,.7,[[x-.7,-13],[knee-.5,-8],[foot-.3,-2]]);
    poly('#302e28',[[foot-1,-2],[foot+1,-2],[foot+2,-.2],[foot-1,-.2]]);
  }
  g.beginPath();g.moveTo(-17,-18);g.bezierCurveTo(-18,-25,-7,-26,0,-23);g.bezierCurveTo(7,-23,12,-27,15,-20);g.bezierCurveTo(19,-12,5,-9,-7,-11);g.bezierCurveTo(-14,-11,-18,-13,-17,-18);g.closePath();g.fillStyle=light;g.fill();g.strokeStyle=INK;g.lineWidth=.6;g.stroke();
  g.beginPath();g.moveTo(-15,-14);g.quadraticCurveTo(-1,-10,12,-17);g.strokeStyle=dark;g.lineWidth=2.3;g.stroke();
  oval(dark,-12,-19,3.6,4.3,false);oval(light,-11,-20,3.2,3.8,false);
  g.beginPath();g.moveTo(6,-18);g.bezierCurveTo(11,-22,9,-30,15,-33);g.quadraticCurveTo(19,-35,20,-28);g.bezierCurveTo(17,-24,18,-14,11,-13);g.closePath();g.fillStyle=light;g.fill();g.strokeStyle=INK;g.lineWidth=.6;g.stroke();
  line(dark,1.3,[[11,-19],[14,-24],[14,-28]]);poly(dark,[[10,-20],[10,-29],[14,-34],[16,-32],[13,-27],[12,-18]]);
  poly(light,[[16,-32],[16,-37],[18,-33],[19,-35],[20,-30],[24,-27],[24,-24.8],[22,-24],[18,-26],[16,-28]]);oval('#1c2725',20,-29,.55,.55,false);oval(dark,23,-26,.55,.7,false);line('#e6d8b9',.6,[[21.5,-27],[23,-25]]);
  if(variant%2)line('#ddd4b8',1,[[19,-31],[21,-26]]);
  if(p.bard){const color=p.bard==='cloth'?p.cloth:p.bard==='leather'?'#65513d':STEEL;poly(color,[[-16,-20],[9,-22],[13,-16],[10,-6],[-5,-9],[-17,-7]]);
    if(['mail','scale'].includes(p.bard)){texture(g,p,[-15,-20,25,13],p.bard);poly(color,[[11,-28],[16,-31],[19,-27],[15,-15],[9,-16]]);texture(g,p,[12,-28,5,11],p.bard);}
    else {line(p.trim||GOLD,.9,[[-16,-8],[-5,-10],[10,-7]]);emblem(g,p,-10,-14,1.2);}}
  drawFrontierHorseArmor(g,p);
  drawLateCavalryHorse(g,p);
  poly(p.cloth,[[-8,-22],[6,-22],[8,-11],[-8,-12]]);line(p.trim||GOLD,.7,[[-7,-12],[7,-11]]);line('#493c30',2.1,[[-6,-23],[5,-23]]);
  if (!p.noBridle) {
    line('#cbb389',.8,[[16,-30],[20,-25],[23,-26]]);line('#493d2c',.8,[[20,-25],[7,-23],[1,-27]]);
  }
  if(p.tangTack){
    // Saluzi: cropped mane, rectangular saddle cloth and breast/crupper straps.
    poly(dark,[[11,-28],[13,-33],[16,-34],[16,-32],[14,-29]]);
    poly('#645b48',[[-8,-22],[5,-22],[6,-12],[-8,-12]]);
    line('#b6a77e',.65,[[-7,-21],[4,-21],[5,-13],[-7,-13],[-7,-21]]);
    line('#493c30',1.2,[[-8,-23],[-5,-25],[3,-25],[6,-23]]);
    line('#594733',1,[[-14,-21],[-12,-13],[-5,-12],[7,-14],[12,-23]]);
    for(const x of [-11,8]){oval('#b2a27e',x,-14,.7,.7);line('#776340',1,[[x,-13],[x-.4,-10]]);}
  }
}
function armor(g,p,mounted,gait) {
  const {line,poly,oval}=pens(g),c=p.cloth,trim=p.trim||GOLD,SKIN=p.skin||'#be9976';
  const metal=['mail','scale','lamellar','segment','plate'].includes(p.armor),base=metal?(p.armor==='lamellar'?'#8e8e75':STEEL):['bronze','muscle','banded'].includes(p.armor)?'#b79b61':c;
  for(const [x,d] of [[-2.7,-1],[2.8,1]]){const dx=mounted?d*1.5:gait*d*2.7,y=mounted?-3:0;const leg=p.bareLegs?SKIN:p.animalLegs?c:p.armor==='plate'?STEEL:'#655b48';line(INK,3.4,[[x,-9],[x+dx,-4],[x+dx*.8,y]]);line(leg,2.5,[[x,-9],[x+dx,-4],[x+dx*.8,y]]);line(p.bareFeet?SKIN:p.bareLegs?'#624d32':'#393c34',2,[[x+dx*.8,y],[x+dx*.8+2,y]]);if(p.bareLegs&&!p.bareFeet)line('#604b31',.5,[[x+dx-1,-3],[x+dx+1,-2],[x+dx-1,-1]]);if(mounted&&!p.noStirrups)line('#c7b177',.7,[[x+dx-1,-5],[x+dx-1,-1],[x+dx+2,-1]]);}
  if(p.cape)poly(p.cape,[[-4,-22],[-8,-16],[-9-gait*.6,-3],[-3,-5],[1,-19]]);
  if(p.trousers)for(const [x,d] of [[-2.7,-1],[2.8,1]])line(p.trousers,2.6,[[x,-9],[x+gait*d*2.7,-4],[x+gait*d*2.1,-1]]);
  if(p.legWraps&&!mounted)for(const [x,d] of [[-2.7,-1],[2.8,1]])for(let y=-6;y<-1;y+=1.3){const dx=gait*d*(2.7-(y+4)*.12);line('#b3ab88',.75,[[x+dx-1.2,y],[x+dx+1.2,y+.5]]);}
  if(p.longCoat||p.armor==='surcoat')poly(c,[[-4,-18],[4,-18],[6,-5],[0,-4],[-1,-8],[-3,-4],[-6,-6]]);
  if(drawYataganJanissaryArmor(g,p))return;
  if(drawWorldArmor(g,p,gait))return;
  if(drawTurkicArmor(g,p))return;
  if(drawEuropeanArmor(g,p))return;
  if(drawItalianEnglishArmor(g,p))return;
  if(drawTurkicArabArmor(g,p))return;
  if(drawAndalusRumArmor(g,p))return;
  if(drawLateCavalryArmor(g,p))return;
  if(drawMedievalSpecialistArmor(g,p))return;
  if(drawFrontierArmor(g,p))return;
  if(drawEuropeanSpecialistArmor(g,p))return;
  if(drawMexicaRankArmor(g,p))return;
  if(drawPacificArmor(g,p))return;
  if(drawTurkishJapaneseArmor(g,p))return;
  if(drawEuropeCrusaderArmor(g,p))return;
  if(drawRusFrenchArmor(g,p))return;
  if(drawAdditionalArmor(g,p))return;
  if(drawMajorArmor(g,p))return;
  if(drawGapArmor(g,p))return;
  if(drawRosterGapArmor(g,p))return;
  if(drawEasternGapArmor(g,p))return;
  if(drawReliefGapArmor(g,p))return;
  if(drawUnderrepresentedArmor(g,p))return;
  if(drawRegionalGapArmor(g,p))return;
  if(drawWesternArmor(g,p))return;
  if(drawImperialAuxArmor(g,p,gait))return;
  if(drawContingentArmor(g,p,gait))return;
  if(drawReinforcementArmor(g,p,gait))return;
  if(drawClassicalArmor(g,p))return;
  if(drawMajorExpansionArmor(g,p))return;
  if(drawAlliedContingentArmor(g,p))return;
  if(drawAncientArmor(g,p))return;
  if(p.armor==='santiagoSurcoat'){
    poly(STEEL,[[-5,-22],[4,-22],[5,-8],[-5,-8]]);texture(g,p,[-5,-22,10,14],'mail');
    poly(c,[[-3,-22],[2,-22],[3,-14],[6,-5],[1,-4],[0,-9],[-1,-4],[-6,-5],[-3,-14]]);
    line('#8a704c',1,[[-3,-12],[3,-12]]);emblem(g,p,0,-17,.85);return;
  }
  poly(base,[[-4,-21],[3,-21],[5,-17],[3,-10],[-4,-10],[-5,-17]]);
  if(p.armor==='janissaryChestGuard'){
    // Birago: upper chest and shoulders protected; keep the lower coat and limbs cloth.
    poly(STEEL,[[-3.5,-21],[2.8,-21],[3.5,-16],[-3.5,-16]]);
    poly('#86958e',[[-4,-22],[-2.7,-21],[-3.5,-18.5],[-5.5,-19]]);
    poly('#86958e',[[2.5,-21],[4,-22],[5.5,-19],[3.5,-18.5]]);
    line('#dce1cf',.6,[[-2.7,-20],[2,-20],[2.5,-16.8],[-2.7,-16.8]]);
    line('#5c4b36',1,[[-4,-11],[3.5,-11]]);oval(trim,0,-11,1,.8);
  }
  if(p.armor==='norseTunic'){
    poly(c,[[-4,-21],[3,-21],[4,-15],[6,-7],[1,-6],[0,-9],[-1,-6],[-6,-7],[-4,-15]]);
    line(trim,.65,[[-4,-7],[0,-6.5],[5,-7]]);line(trim,.65,[[-2,-21],[0,-18],[2,-21]]);
    line('#484237',.65,[[-3,-16],[-4,-8],[0,-9],[4,-8]]);
  }
  if(p.armor==='fringed'){
    poly(c,[[-4,-21],[4,-21],[5,-7],[-5,-7]]);line(trim,1,[[-4,-19],[4,-14]]);
    for(let x=-5;x<=5;x+=1.2)line(trim,.7,[[x,-7],[x,-5]]);
    for(const y of [-18,-9])line(trim,.6,[[-4,y],[4,y]]);
  }
  if(p.armor==='goryeoVest'){
    poly('#858b7b',[[-3.6,-21],[3,-21],[4,-11],[-4,-11]]);texture(g,p,[-3,-20,6,8],'lamellar');
    line(trim,.7,[[-3,-21],[1,-18],[-3,-14]]);
    // Xu Jing: helmet carried on the back, shoulders without armour plates.
    oval('#7e8780',-5.5,-12,2.3,2.6);poly('#a1aba0',[[-8,-12],[-6,-17],[-3,-12]]);
  }
  if(p.armor==='songLamellar'){
    poly('#817f69',[[-6,-22],[5,-22],[7,-17],[4,-16],[-5,-16],[-7,-18]]);
    texture(g,p,[-5,-21,10,5],'lamellar');
    poly('#8b8265',[[-4,-17],[4,-17],[6,-5],[1,-5],[0,-9],[-1,-5],[-6,-5]]);
    texture(g,p,[-4,-17,8,12],'lamellar');line(trim,1,[[-5,-6],[5,-6]]);
  }
  if(p.armor==='jama'){
    poly(c,[[-4,-22],[4,-21],[4,-14],[8,-6],[1,-5],[-7,-7],[-4,-14]]);
    line(trim,.7,[[3,-21],[-2,-16],[4,-13]]);line(trim,1.3,[[-4,-13],[4,-13]]);
    for(const x of [-4,-1,2,5])line('#a99775',.5,[[0,-13],[x,-6]]);
  }
  if(p.armor==='khmerPadded'){
    poly(c,[[-5,-22],[5,-22],[6,-15],[5,-6],[-5,-6],[-6,-15]]);
    for(let y=-21;y<-6;y+=2.5)for(let x=-4;x<5;x+=2.5)poly(trim,[[x,y],[x+1,y+1],[x,y+2],[x-1,y+1]],false);
    line('#6b5033',1,[[-5,-7],[5,-7]]);
  }
  if(p.armor==='mayaVest'){
    poly(c,[[-4,-21],[3,-21],[4,-7],[-4,-7]]);line(trim,1,[[-3,-21],[-2,-17],[1,-16],[3,-20]]);
    oval('#dfd3ad',0,-17,2.3,2.1);line('#a28e69',.5,[[-1.5,-17],[0,-18],[1.5,-17]]);
    line(trim,.7,[[-3,-9],[3,-9]]);
  }
  if(p.armor==='beninBells'){
    poly(c,[[-5,-21],[5,-21],[6,-8],[-6,-8]]);
    for(const y of [-19,-10])for(let x=-4;x<=4;x+=2){line('#b8a06e',.6,[[x,y-1],[x,y]]);poly('#b8a06e',[[x-.8,y],[x+.8,y],[x+1,y+1.8],[x-1,y+1.8]]);}
    for(let x=-3;x<4;x+=1.3)poly('#dfcda1',[[x,-22],[x+1,-22],[x+.4,-19.5]]);
    poly('#c5ac7e',[[-4,-8],[4,-8],[5,-3],[-5,-3]]);for(let x=-3;x<5;x+=1.5)line('#776247',.6,[[x,-7],[x,-3]]);
  }
  if(p.armor==='hanRobe'){
    // Cross collar and folded robe from the Eastern Han rider, Met 16.149.2.
    poly(c,[[-5,-21],[3,-21],[6,-17],[5,-6],[-5,-6],[-6,-16]]);
    line(trim,.8,[[-3,-21],[2,-17],[-3,-12]]);
    line('#493e30',.65,[[-4,-15],[2,-14],[4,-15]]);
    for(const y of [-10,-8])line(trim,.5,[[-4,y],[1,y+.7],[4,y]]);
  }
  if(p.armor==='incaUnku'){
    // Met 2017.674: rectangular checkerboard tunic with stepped red yoke.
    poly('#e3dbc3',[[-5.6,-22],[4.7,-22],[5.4,-6.1],[-5.7,-6.1]]);
    for(let row=0;row<6;row++)for(let col=0;col<4;col++)if((row+col)%2===0)
      poly('#343a34',[[-5.2+col*2.5,-21.6+row*2.5],[-2.7+col*2.5,-21.6+row*2.5],[-2.7+col*2.5,-19.1+row*2.5],[-5.2+col*2.5,-19.1+row*2.5]],false);
    poly('#b84132',[[-5.5,-22],[4.6,-22],[4.6,-19],[2.2,-19],[2.2,-17],[-.3,-17],[-.3,-15],[-2.6,-17],[-2.6,-19],[-5.5,-19]],false);
    line(INK,.6,[[0,-22],[0,-19]]);
    line('#b69b57',1,[[-5.3,-6.7],[4.8,-6.7]]);
    line('#934238',.5,[[-5,-7],[-3,-5.9],[-1,-7],[1,-5.9],[3,-7],[5,-5.9]]);
  }
  if(['mail','lamellar','scale','jaguar','feathers'].includes(p.armor))texture(g,p,[-4,-20,8,11],p.armor);
  if(p.armor==='mail'&&p.longCoat){poly(base,[[-4,-11],[4,-11],[5,-6],[-5,-6]]);texture(g,p,[-4,-11,8,5],'mail');}
  if(['segment','banded'].includes(p.armor)){for(let y=-19;y<-10;y+=2)line('#5b6052',.8,[[-4,y],[3,y]]);for(const x of [-3,2])line(GOLD,.6,[[x,-20],[x,-11]]);}
  if(['bronze','muscle','plate'].includes(p.armor)){line('#f2dfac',.7,[[-3,-20],[0,-18],[3,-20]]);line('#657066',.8,[[0,-18],[0,-13],[3,-11]]);if(p.fluted)for(let x=-3;x<4;x++)line('#60726e',.45,[[x,-20],[x*.5,-12]]);if(p.armor==='plate'){for(const x of [-4,4])oval(STEEL,x,-19,2,2.4);poly(STEEL,[[-4,-11],[4,-11],[5,-7],[1,-8],[0,-10],[-1,-8],[-5,-7]]);}}
  if(p.armor==='linen'){poly('#ded8bd',[[-4,-20],[4,-20],[4,-11],[-4,-11]]);for(let x=-4;x<5;x+=2)line('#b29664',1,[[x,-11],[x,-6]]);line('#8b6950',.6,[[-3,-19],[3,-19],[3,-12],[-3,-12],[-3,-19]]);}
  if(p.armor==='tangGuard'){
    // Form follows Met 10.221.6; dark finish follows the chronicle, not its pigment.
    poly('#424a45',[[-5,-22],[-1,-23],[1,-23],[5,-21],[6,-17],[4,-15],[-4,-15],[-6,-18]]);
    line('#9b9f8c',.65,[[-4,-21],[-2,-20],[-1,-17],[1,-17],[2,-20],[4,-21]]);
    line('#777e70',.6,[[0,-22],[0,-16]]);
    oval('#51594f',0,-13.7,4.8,3.2);line('#a1a18b',.55,[[-4,-15],[-2,-16],[2,-16],[4,-15]]);
    for(const [x,w] of [[-4,2.4],[-1.2,2.8],[2,2.8]]){
      poly('#39423c',[[x,-11],[x+w,-11],[x+w+1,-5],[x-.6,-5.4]]);
      line('#8e9581',.55,[[x,-10],[x-.2,-6],[x+w+.3,-5.8]]);
    }
    for(const x of [-5,5])poly('#444e45',[[x-1,-21],[x+1,-21],[x+2,-17],[x-1,-16]]);
  }
  if(p.armor==='yoroi'){for(let y=-20;y<-8;y+=2.3){poly(c,[[-4,y],[4,y],[5,y+1.9],[-5,y+1.9]]);line(trim,.5,[[-4,y+.5],[4,y+.5]]);}for(const d of [-1,1]){poly(c,[[d*4,-21],[d*7,-20],[d*7,-15],[d*4,-16]]);for(let y=-19;y<-15;y+=1.5)line(trim,.5,[[d*4.5,y],[d*6.5,y]]);}}
  if(p.armor==='slashed'){for(const x of [-4,4])oval(c,x,-18,2.8,3.5);for(const x of [-4,-2,1,3])line(p.secondary,1.2,[[x,-20],[x+1,-13]]);for(const x of [-3,3]){oval(c,x,-7,2.8,3.5);line(p.secondary,1.2,[[x,-9],[x+1,-5]]);}}
  if(p.armor==='robe'||p.armor==='surcoat'){line(trim,.7,[[0,-20],[1,-10],[3,-5]]);line(trim,.6,[[-5,-5],[-2,-4]]);emblem(g,p,0,-16,.8);}
  if(p.patterned)for(let y=-19;y<-6;y+=3)for(const x of [-3,2])oval(trim,x,y,.5,.5,false);
  if(p.featherCape)for(let y=-19;y<-7;y+=2)line('#8e713f',1.6,[[-4,y],[-8,y+3]]);
  if(p.pelt){poly('#c0a05c',[[-5,-21],[-2,-19],[-3,-10],[-7,-12]]);texture(g,p,[-6,-19,3,8],'jaguar');}
  if(p.armor!=='incaUnku'){line('#57432e',1.4,[[-4,-11],[4,-11]]);oval(trim,0,-11,.8,.8,false);}
}
// Anthropomorphic face plate inspired by the Lipovets museum reference.
// The cheek planes, paired apertures and embossed moustache must read at game scale.
function kipchakMask(g) {
  const {line,poly,oval}=pens(g);
  poly('#758481',[[-4,-27],[-4.5,-22],[-3.8,-18],[-1,-17.5],[3,-19],[4,-25]]);
  texture(g,{},[-4,-25,8,8],'mail');
  const steel=g.createLinearGradient(-4,0,5,0);
  steel.addColorStop(0,'#647471');steel.addColorStop(.35,'#bec8bc');
  steel.addColorStop(.6,'#e0dfc8');steel.addColorStop(1,'#7e8b82');
  g.beginPath();g.moveTo(-4.3,-27.1);g.quadraticCurveTo(-3.7,-30.5,-.1,-35);
  g.quadraticCurveTo(1.6,-31,4.2,-27);g.closePath();g.fillStyle=steel;g.fill();
  g.strokeStyle=INK;g.lineWidth=.65;g.stroke();
  line('#e1dfc7',.45,[[0,-34],[.5,-29.2]]);
  // Rounded temples and broad cheekbones taper into a sculpted chin.
  g.beginPath();g.moveTo(-3.6,-27.5);g.quadraticCurveTo(0,-28.5,3.6,-27.3);
  g.quadraticCurveTo(4.4,-25.6,3.9,-23.4);g.quadraticCurveTo(3.5,-20.4,1,-18.9);
  g.quadraticCurveTo(-.2,-18.5,-1.5,-19.7);g.quadraticCurveTo(-4.5,-22.2,-3.6,-27.5);
  g.closePath();g.fillStyle=steel;g.fill();g.strokeStyle=INK;g.lineWidth=.6;g.stroke();
  poly('#7c8980',[[-3.5,-24.2],[-1.9,-23.5],[-2.6,-21.3],[-3.5,-22.6]],false);
  poly('#98a397',[[2.5,-24.2],[3.8,-24.6],[3.1,-21.3],[1.8,-22]],false);
  line('#718078',.55,[[-3,-26.2],[-1.7,-26.6],[-.3,-26.1]]);
  line('#718078',.55,[[.9,-26.1],[2.3,-26.5],[3.4,-26]]);
  oval('#172523',-1.7,-25.4,1.05,.5,false);oval('#172523',2.2,-25.4,.95,.5,false);
  line('#e8e7d0',.35,[[-2.7,-25.9],[-1.6,-26],[-.7,-25.8]]);
  line('#e8e7d0',.35,[[1.3,-25.8],[2.2,-26],[3,-25.8]]);
  poly('#79877d',[[.2,-26.1],[1,-26],[1.5,-23.2],[.5,-22.7],[-.3,-23.2]],false);
  line('#efead0',.65,[[.3,-25.6],[.3,-23.5],[.9,-23.2]]);
  // Raised, upturned moustache: broad wings, rather than a straight mouth line.
  g.beginPath();g.moveTo(-2.9,-23);g.bezierCurveTo(-2.7,-21.4,-1,-21.4,.5,-22.5);
  g.bezierCurveTo(1.6,-21.3,3.3,-21.5,3.4,-22.8);
  g.strokeStyle='#42534e';g.lineWidth=1.15;g.lineCap='round';g.stroke();
  g.strokeStyle='#aeb9aa';g.lineWidth=.35;g.stroke();
  line('#4c5d55',.5,[[-.8,-20.9],[.5,-20.7],[1.6,-21]]);
  line('#d4d7be',.45,[[-.5,-19.8],[.6,-19.5],[1.4,-20]]);
  for(const x of [-3.6,3.6])oval('#e2d9b5',x,-27.2,.32,.32,false);
}
function head(g,p) {
  if(drawLateCavalryHead(g,p))return;
  if(drawWorldHead(g,p))return;
  if(drawTurkicHead(g,p))return;
  if(drawEuropeanHead(g,p))return;
  if(drawItalianEnglishHead(g,p))return;
  if(drawTurkicArabHead(g,p))return;
  if(drawAndalusRumHead(g,p))return;
  if(drawMedievalSpecialistHead(g,p))return;
  if(drawFrontierHead(g,p))return;
  if(drawEuropeanSpecialistHead(g,p))return;
  if(drawMexicaRankHead(g,p))return;
  if(drawPacificHead(g,p))return;
  if(drawTurkishJapaneseHead(g,p))return;
  if(drawEuropeCrusaderHead(g,p))return;
  if(drawRusFrenchHead(g,p))return;
  if(drawAdditionalHead(g,p))return;
  if(drawMajorHead(g,p))return;
  if(drawGapHead(g,p))return;
  if(drawRosterGapHead(g,p))return;
  if(drawEasternGapHead(g,p))return;
  if(drawReliefGapHead(g,p))return;
  if(drawUnderrepresentedHead(g,p))return;
  if(drawRegionalGapHead(g,p))return;
  if(drawWesternHead(g,p))return;
  if(drawImperialAuxHead(g,p))return;
  if(drawContingentHead(g,p))return;
  if(drawReinforcementHead(g,p))return;
  if(drawAlliedContingentHead(g,p))return;
  if(drawClassicalHead(g,p))return;
  if(drawAncientHead(g,p))return;
  const {line,poly,oval}=pens(g),h=p.head,SKIN=p.skin||'#be9976';
  if(h==='mask'){kipchakMask(g);return;}
  oval(SKIN,.5,-24,3,3.7);poly(SKIN,[[2,-25],[4.2,-23.7],[3,-23],[3,-21],[0,-20.5]]);
  if(h==='norseHair'){
    poly('#805a39',[[-4,-25],[-3,-29],[1,-29],[3,-27],[3,-25],[0,-26],[-1,-23],[-3,-22],[-4,-25]]);
    line('#b3915d',.6,[[-3,-27],[-1,-28],[2,-27]]);
  }
  if(h==='norseCap'){
    poly('#564d3d',[[-4,-25],[-3,-29],[0,-30],[3,-28],[4,-25]]);
    line('#b6a77d',.75,[[-4,-25],[4,-25]]);line('#8e8264',.6,[[0,-29],[1,-26]]);
  }
  if(h==='assyrian'){
    poly('#363b31',[[-4,-25],[-3,-21],[-4,-18],[-1,-18],[-1,-25]]);
    poly('#aaa68a',[[-4,-26],[-2,-31],[0,-35],[3,-29],[4,-26]]);line('#d8d0ac',.6,[[0,-34],[0,-27]]);
    line('#61513a',1,[[-4,-26],[4,-26]]);
  }
  if(h==='topknot'){poly('#303a32',[[-3,-23],[-4,-27],[-1,-29],[2,-28],[3,-26],[-1,-26],[-1,-23]]);oval('#303a32',-.5,-30,1.7,1.7);line('#c2b893',.6,[[-2,-29],[1,-29]]);}
  if(h==='songHelm'){
    poly('#777c6b',[[-4,-27],[-4,-21],[-6,-19],[-3,-17],[-1,-22],[3,-22],[4,-26]]);
    for(let y=-25;y<-19;y+=1.5)line('#b3ae8d',.5,[[-4,y],[-2,y+1]]);
    poly('#9b9b80',[[-4,-26],[-3,-30],[0,-32],[3,-30],[4,-26]]);line('#cdbb83',.8,[[-4,-27],[4,-27]]);line('#993e2e',2,[[0,-32],[0,-35],[-3,-34]]);
  }
  if(h==='mughalWrap'){
    oval('#c8c1a7',0,-27,4.8,2.6);poly('#d9d0b3',[[-3,-28],[-2,-31],[2,-31],[4,-28]]);
    for(let y=-29;y<-25;y++)line('#897e60',.5,[[-4,y],[3,y-1]]);line('#b1a584',1,[[-4,-27],[-5,-21],[-4,-18]]);
  }
  if(h==='khmerAnimal'){
    oval('#af925d',-1,-27,4.5,3.4);poly('#c1a875',[[1,-30],[5,-29],[7,-26],[3,-25],[1,-26]]);
    poly('#af925d',[[-4,-29],[-5,-33],[-2,-31],[-1,-29]]);oval(INK,3,-28,.6,.6);line('#e1c892',.8,[[4,-26],[6,-26]]);
    line('#a18758',2,[[-4,-26],[-5,-21],[-3,-18]]);
  }
  if(h==='mayaOrnament'){
    poly('#473c2c',[[-3,-25],[-4,-28],[-2,-30],[2,-29],[3,-26]]);
    oval('#b1704a',-1,-33,3,3);oval('#25382f',-1,-33,1.6,1.7);line('#d6ae77',1,[[-4,-29],[4,-29]]);
    for(const x of [-3,0,3])line('#ac7850',1.5,[[x,-29],[x-2,-31]]);
    for(const x of [-3,3]){oval('#d2b582',x,-23,1.8,2);oval('#735b3e',x,-23,.7,.9);}
    line('#755039',.5,[[1,-25],[2,-22]]);
  }
  if(h==='beninCap'){
    poly('#62563d',[[-4,-25],[-4,-29],[-2,-32],[1,-32],[4,-29],[4,-25]]);line('#c0ab75',.8,[[-4,-26],[4,-26]]);
    for(const x of [-4,-2]){line('#9b855d',1.3,[[x,-25],[x,-19],[x+1,-17]]);for(let y=-24;y<-17;y+=1.6)oval('#c0ab75',x,y,.7,.6,false);}
  }
  if(h==='hanCap'){
    poly('#353b32',[[-3.7,-26],[-3.7,-33.2],[-2.7,-34.2],[2.6,-34.2],[3.4,-33],[3.4,-26]]);
    for(const y of [-32,-29.5,-27])line('#a59c78',.65,[[-3.2,y],[2.9,y]]);
    line('#484435',.65,[[-3,-26],[-2,-21],[2,-21],[3,-26]]);
  }
  if(h==='incaBand'){
    poly('#30352d',[[-3.5,-21],[-4.2,-27],[-2.5,-29],[1.8,-29],[3,-27],[2,-25],[-1.5,-25],[-1.5,-21]]);
    line('#b84032',1.7,[[-3.7,-26.4],[2.9,-26.4]]);
    line('#d2bd79',.45,[[-3.5,-26],[2.8,-26]]);
  }
  if(h==='tangRidge'){
    poly('#3f4942',[[-4,-25],[-4,-28],[-2,-31],[1,-31],[4,-28],[4,-25]]);
    poly('#687264',[[-1.5,-30],[-1.3,-34],[.2,-34.5],[1.7,-32],[1.6,-29]]);
    line('#a8ac94',.6,[[-1,-33],[0,-34],[1,-32],[1,-29]]);
    poly('#485348',[[-4,-26],[-2,-26],[-1,-21],[-3,-20],[-4.6,-23]]);
    line('#a1a48c',.6,[[-3.5,-25],[-2.6,-22],[-3,-21]]);
    line('#99a18b',.65,[[-3,-27],[0,-28],[3,-27]]);
  }
  if(h==='polishMisiurka'){
    poly('#7f9089',[[-4,-27],[-2,-29],[2,-29],[4,-27],[3,-24],[-2,-24],[-2,-19],[-5,-20]]);
    texture(g,p,[-5,-25,3,6],'mail');line('#c0c4ad',.8,[[-3,-28],[2,-28]]);
  }
  if(h==='polishBrimHat'){
    poly('#574c3d',[[-4,-27],[-3,-32],[2,-32],[4,-27]]);
    oval('#4b4237',0,-27,6.8,1.2);line('#bca06b',.7,[[-3,-28],[3,-28]]);
  }
  if(p.beard)poly('#5c4430',[[-1,-23],[1,-22],[3,-22],[2,-19],[-1,-20],[-2,-23]]);
  if(['mask','cone','turbanCone','furCone','rus','mongol','sasanian'].includes(h)){poly(STEEL,[[-4,-25],[-2,-29],[0,-32],[3,-28],[4,-25]]);line('#e2d7ae',.55,[[0,-31],[0,-26]]);poly('#71817a',[[-4,-25],[-2,-24],[-2,-19],[-4,-20]]);}
  if(h==='mailHood'){oval('#7f9089',-.5,-24.5,4,5);texture(g,p,[-3,-28,6,8],'mail');poly(SKIN,[[0,-26],[3,-25],[3,-21],[0,-21]]);}
  if(['nasal','spectacle','bascinet'].includes(h)){oval('#7f9089',-.5,-25,3.7,4);poly(STEEL,[[-4,-25],[-3,-29],[0,-30],[3,-27],[4,-25]]);poly(SKIN,[[0,-25],[3,-25],[3,-21],[0,-21]]);line('#c2c7b1',.8,[[2,-26],[2,-23]]);if(h==='spectacle'){line(INK,1.2,[[-1,-25],[3,-25]]);oval(STEEL,0,-24.3,1,.8);oval(STEEL,2.1,-24.3,.9,.8);line(INK,.5,[[-.5,-24],[.5,-24],[1.5,-24],[2.5,-24]]);}if(h==='bascinet')poly(STEEL,[[-4,-26],[-2,-31],[1,-31],[4,-26]]);}
  if(['visor','greathelm','sallet','lobster'].includes(h)){if(h==='greathelm'){poly(STEEL,[[-4,-29],[3,-29],[4,-21],[-4,-21]]);line(GOLD,.7,[[0,-29],[0,-21]]);}else if(h==='sallet')poly(STEEL,[[-6,-24],[-4,-28],[0,-30],[4,-28],[5,-24],[1,-23],[1,-20],[-2,-21]]);else{oval(STEEL,0,-26,3.8,3.8);poly(STEEL,[[-3,-26],[4,-26],[5,-23],[2,-20],[-2,-21]]);}line(INK,.8,[[0,-25],[3.5,-25]]);if(h==='lobster'){for(let y=-25;y<-19;y+=1.5)line('#80928a',1.3,[[-3,y],[-5,y+1]]);line(GOLD,.6,[[3,-28],[3,-22]]);}else for(let y=-23;y<-21;y++)line('#5b6f69',.4,[[1,y],[3,y]]);}
  if(['corinthian','attic','boeotian','phrygian','horned'].includes(h)){oval(GOLD,0,-26,3.8,3.7);if(h==='boeotian')poly(GOLD,[[-5,-26],[-3,-29],[3,-29],[6,-26],[4,-24],[-4,-24]]);else if(h==='corinthian'){poly(GOLD,[[-3,-26],[4,-26],[4,-21],[2,-20],[1,-23],[0,-20],[-3,-21]]);line(INK,.9,[[-1,-25],[3,-25]]);line(INK,.7,[[1,-24],[1,-22]]);}else{poly(GOLD,[[-3,-26],[-1,-25],[-1,-21],[-3,-21]]);if(h==='phrygian')poly(GOLD,[[-3,-28],[-2,-32],[2,-33],[4,-30],[1,-30],[1,-27]]);}if(['attic','corinthian'].includes(h))line('#963e31',2.7,[[-3,-29],[-1,-32],[2,-32],[4,-29]]);if(h==='horned'){line('#d9c69c',1.6,[[-3,-28],[-6,-31],[-5,-33]]);line('#d9c69c',1.6,[[3,-28],[6,-31],[5,-33]]);line(GOLD,1,[[0,-29],[0,-33]]);oval(GOLD,0,-34,1.2,1.2);}}
  if(['imperial','imperialCrest','romanCavalry'].includes(h)){oval(STEEL,0,-26,3.8,3.6);line(GOLD,.9,[[-4,-25],[4,-25]]);poly(STEEL,[[-4,-25],[-1,-24],[-1,-21],[-3,-21]]);line(STEEL,1,[[-4,-24],[-5,-23]]);if(h==='imperialCrest')line('#874254',2.7,[[-4,-29],[0,-32],[4,-29]]);if(h==='romanCavalry')line('#b39965',2,[[0,-29],[-2,-32],[-5,-31]]);}
  if(h==='republicHelmet'){oval('#aa9464',0,-26,3.7,3.7);oval('#c4ae79',0,-30,1.1,1);line('#d0bb86',.65,[[-3.6,-25.5],[3.6,-25.5]]);poly('#9d895c',[[-4,-25],[-1.5,-24],[-1.5,-21],[-3.5,-21]]);line('#b9a674',1,[[-3.5,-24.5],[-5,-24]]);}
  if(p.coveredFace){poly('#8a9690',[[-2,-24],[3,-24],[4,-20],[2,-18],[-2,-19]]);texture(g,p,[-2,-23,5,5],'mail');line(INK,.7,[[0,-24],[3,-24]]);}
  if(['turban','turbanTall','turbanCone'].includes(h)){if(h==='turbanTall')poly('#cdbb8d',[[-3,-27],[-2,-33],[2,-33],[3,-26]]);oval('#e6d8b3',0,-27,4.6,2.3);for(let y=-28;y<-25;y++)line('#a89671',.5,[[-3,y],[3,y+.7]]);}
  if(h==='fur'||h==='furCone'){if(h==='fur')poly(p.cloth,[[-4,-26],[-3,-30],[1,-31],[4,-27]]);line('#6b5038',3,[[-4,-26],[3,-26]]);line('#5d4531',2,[[-4,-25],[-4,-21]]);}
  if(h==='tiara'){poly(p.cloth,[[-4,-26],[-3,-32],[2,-32],[3,-26],[0,-24],[0,-19],[-4,-20]]);line(p.trim||GOLD,.6,[[-3,-28],[2,-28]]);}
  if(h==='cap'){poly(p.cloth,[[-4,-26],[-3,-31],[1,-32],[4,-26]]);line(GOLD,1,[[-4,-26],[4,-26]]);}
  if(h==='bork'||h==='solak'){poly('#e5dfc7',[[-4,-26],[-4,-35],[2,-36],[3,-26]]);poly('#bebba8',[[-4,-34],[-6,-29],[-6,-21],[-3,-22],[-2,-31]]);line(GOLD,1.2,[[-4,-26],[3,-26]]);if(h==='solak'){line(GOLD,1,[[1,-28],[4,-38]]);line('#eee9d5',2.2,[[4,-34],[5,-40]]);}}
  if(h==='beret'){oval(p.cloth,0,-27,5.5,2);oval('#735037',0,-28,3,2);line('#e9ddad',1.6,[[1,-29],[6,-34]]);}
  if(h==='kabuto'){poly('#383c32',[[-4,-26],[-3,-30],[0,-31],[3,-29],[4,-26]]);for(let y=-26;y<-21;y+=1.5)poly(p.cloth,[[-4,y],[-5,y+1.5],[4,y+1.5],[3,y]]);poly(SKIN,[[0,-25],[3,-25],[3,-21],[0,-21]]);if(p.crest==='horns')line(GOLD,1.1,[[-5,-34],[-3,-29],[0,-28],[3,-29],[5,-34]]);else{g.beginPath();g.arc(0,-32,4,.1,Math.PI-.1);g.strokeStyle=GOLD;g.lineWidth=1.2;g.stroke();}}
  if(h==='eagle'){oval('#9f733d',0,-27,4.5,3.9);poly('#d5ae62',[[2,-28],[7,-26],[4,-24],[2,-25]]);oval('#e1cc86',2,-28.5,1,1);oval(INK,2.3,-28.5,.45,.5);poly(SKIN,[[0,-25],[3,-25],[3,-21],[0,-21]]);}
  if(h==='jaguar'){oval(p.cloth,0,-26,4.6,4.7);oval(p.cloth,-3,-30,1.4,1.5);oval(p.cloth,2,-30,1.4,1.5);texture(g,p,[-4,-29,8,5],'jaguar');poly('#eed7a2',[[0,-25],[5,-25],[4,-21],[0,-20]]);poly(SKIN,[[0,-24],[3,-24],[3,-21],[0,-21]]);line('#eee7d0',1,[[4,-25],[4,-23]]);}
  if(p.crest==='tail')line('#ddd4b6',1.5,[[0,-32],[-3,-35],[-6,-32],[-6,-28]]);
  if(p.crest==='plume')line(p.cloth,2.2,[[0,-30],[-3,-34],[-6,-33]]);
  if(p.ribbons)for(const dy of [0,2])line('#e3d7b3',1,[[-3,-26],[-7,-26+dy],[-10,-29+dy]]);
  if(p.braid)line('#493d2c',1.1,[[-3,-24],[-5,-18],[-4,-15]]);
  if(!['mask','visor','greathelm','sallet','corinthian'].includes(h)&&!p.coveredFace)line(INK,.55,[[2,-24],[2.7,-24]]);
}
function weapon(g,p,action,phase,team) {
  if(drawWorldWeapon(g,p,action,phase,team))return;
  if(drawTurkicWeapon(g,p,action,phase))return;
  if(drawEuropeanWeapon(g,p,action,phase))return;
  if(drawItalianEnglishWeapon(g,p,action,phase))return;
  if(drawAndalusRumWeapon(g,p,action,phase))return;
  if(drawMedievalSpecialistWeapon(g,p,action,phase))return;
  if(drawFrontierWeapon(g,p,action,phase))return;
  if(drawEuropeanSpecialistWeapon(g,p,action,phase))return;
  if(drawPacificWeapon(g,p,action,phase))return;
  if(drawTurkishJapaneseWeapon(g,p,action,phase))return;
  if(drawEuropeCrusaderWeapon(g,p,action,phase))return;
  if(drawRusFrenchWeapon(g,p,action,phase))return;
  if(drawAdditionalWeapon(g,p,action,phase))return;
  if(drawMajorWeapon(g,p,action,phase))return;
  if(drawGapWeapon(g,p,action,phase))return;
  if(drawRosterGapWeapon(g,p,action,phase))return;
  if(drawEasternGapWeapon(g,p,action,phase))return;
  if(drawReliefGapWeapon(g,p,action,phase))return;
  if(drawUnderrepresentedWeapon(g,p,action,phase))return;
  if(drawRegionalGapWeapon(g,p,action,phase))return;
  if(drawWesternWeapon(g,p,action,phase))return;
  if(drawImperialAuxWeapon(g,p,action,phase))return;
  if(drawContingentWeapon(g,p,action,phase))return;
  if(drawReinforcementWeapon(g,p,action,phase))return;
  if(drawClassicalWeapon(g,p,action,phase))return;
  if(drawMajorExpansionWeapon(g,p,action,phase))return;
  if(drawAncientWeapon(g,p,action,phase))return;
  const {line,poly,oval}=pens(g),attack=action==='attack'?Math.sin(phase*Math.PI):0,w=p.weapon,SKIN=p.skin||'#be9976';
  const hand=(x,y)=>oval(SKIN,x,y,1.15,1.15);
  const sleeve=(width,pts)=>{
    const metal=['plate','mail','scale','lamellar','segment'].includes(p.armor),bare=['bronze','muscle','linen','banded','incaUnku'].includes(p.armor);
    const color=metal?STEEL:bare?SKIN:p.cloth;
    line(INK,width+.65,pts);line(color,width,pts);
    if(p.armor==='plate'){oval('#8a9b96',pts[1][0],pts[1][1],1.7,1.7);line('#e4e6cf',.55,pts.map(([x,y])=>[x,y-.7]));}
    if(p.armor==='mail')for(let i=1;i<pts.length;i++){const [x,y]=pts[i-1],[xx,yy]=pts[i],steps=Math.ceil(Math.hypot(xx-x,yy-y)/1.6);for(let j=0;j<steps;j++)oval('#62746d',x+(xx-x)*j/steps,y+(yy-y)*j/steps,.45,.5,false);}
    if(['yoroi','lamellar','scale'].includes(p.armor)){const [x,y]=pts.at(-1),[xx,yy]=pts.at(-2);line('#56625a',width-.5,[[x,y],[x+(xx-x)*.55,y+(yy-y)*.55]]);}
  };
  if(['bow','yumi','longbow'].includes(w)){
    const released=action==='attack'&&phase>=.5,draw=released?0:attack;
    const x=13,tip=x-3,nock=tip-4-draw*5,top=w==='longbow'?-36:w==='yumi'?-36:-29,bottom=w==='longbow'?-1:-10;
    sleeve(3,[[3,-19],[7,-18],[x,-19]]);sleeve(2.5,[[-2,-19],[1,-16],[nock,-20]]);
    // The forward hand holds the wooden grip; the rear hand pulls the string.
    g.beginPath();g.moveTo(tip,top);g.bezierCurveTo(x+2,top+5,x,-24,x,-19);g.bezierCurveTo(x,-15,x+2,bottom-3,tip,bottom);g.strokeStyle=w==='longbow'?'#ae8951':'#cbb27b';g.lineWidth=w==='longbow'?1.6:1.3;g.stroke();
    line('#d9cba1',.45,[[tip,top],[released?tip:nock,-20],[tip,bottom]]);
    if(!released){line('#ddd3b3',.65,[[nock,-20],[24,-20]]);poly('#d5d6c3',[[24,-21],[27,-20],[24,-19]]);}
    hand(x,-19);hand(nock,-20);
  }
  else if(w==='partisan'){
    const pose=weaponMotion('spear',action,phase,.32);
    g.save();g.translate(7+pose.x,-17+pose.y);g.rotate(pose.angle);
    line('#78603e',1.6,[[0,12],[0,-28]]);
    poly(STEEL,[[0,-38],[-2,-31],[-2,-29],[-4,-30],[-3,-26],[0,-27],[3,-26],[4,-30],[2,-29],[2,-31]]);
    line('#e2dfc7',.55,[[0,-37],[0,-27]]);g.restore();
    sleeve(3,[[3,-19],[6,-14],[7+pose.x,-17+pose.y]]);hand(7+pose.x,-17+pose.y);
  }
  else if(w==='chariotReins'){sleeve(2.4,[[3,-20],[7,-17],[12,-18]]);sleeve(2.4,[[-2,-19],[4,-15],[11,-16]]);hand(12,-18);hand(11,-16);}
  else if(w==='musket'){sleeve(3,[[-2,-19],[4,-15],[10,-17]]);sleeve(3,[[3,-20],[8,-18],[15,-19]]);line('#795333',2.5,[[2,-14],[10,-17],[18,-20]]);line(STEEL,1.2,[[8,-18],[29,-23]]);hand(10,-17);hand(15,-19);if(action==='attack'&&phase>=.5&&phase<.75)poly('#f4d280',[[29,-23],[34,-26],[32,-23],[35,-21],[30,-21]]);}
  else if(['lance','kontos','xyston','spear','shortSpear','pike'].includes(w)){const len=w==='shortSpear'?19:w==='pike'?34:w==='kontos'?32:30,pose=weaponMotion(w,action,phase,['kontos','xyston'].includes(w)?1.36:p.horse?.8:.32);g.save();g.translate(7+pose.x,-17+pose.y);g.rotate(action==='charge'?1.48:action==='charge-ready'?.8+.68*phase*8/7:pose.angle);line('#78603e',1.3,[[0,11],[0,-len]]);poly(STEEL,[[-1.4,-len],[0,-len-5],[1.4,-len],[0,-len+1]]);if(p.pennant){const k=w==='shortSpear'?.45:1;poly(p.pennant,[[0,-len+2],[-9*k,-len+3],[-6*k,-len+5],[-10*k,-len+7],[0,-len+6]]);if(w==='shortSpear')line('#9ba99e',.45,[[-1,-len+4],[-3,-len+3.5],[-3.5,-len+4.5],[-2,-len+5]]);}g.restore();sleeve(3,[[3,-19],[6,-14],[7+pose.x,-17+pose.y]]);hand(7+pose.x,-17+pose.y);if(['kontos','xyston','pike'].includes(w)){const a=action==='charge'?1.48:action==='charge-ready'?.8+.68*phase*8/7:pose.angle,sx=7+pose.x-Math.sin(a)*5,sy=-17+pose.y+Math.cos(a)*5;sleeve(2.5,[[-2,-19],[0,-14],[sx,sy]]);hand(sx,sy);}}
  else {const two=['greatsword','daneaxe','norseDaneaxe','longaxe','mamlukAxe','phkak','roncone'].includes(w),ax=['axe','daneaxe','longaxe'].includes(w),pose=weaponMotion(w,action,phase),hx=9+pose.x,hy=-19+pose.y;sleeve(3,[[3,-19],[6+pose.x*.5,-15+pose.y*.6],[hx,hy]]);hand(hx,hy);if(two){const sx=hx-Math.sin(pose.angle)*3,sy=hy+Math.cos(pose.angle)*3;sleeve(2.5,[[-2,-19],[3,-13],[sx,sy]]);hand(sx,sy);}g.save();g.translate(hx,hy);g.rotate(pose.angle);
    if(w==='roncone'){
      line('#80613d',1.7,[[0,11],[0,-24]]);
      // Italian bill: long point, forward hook, back spike and basal guards.
      poly(STEEL,[[-1,-21],[-1,-27],[-5,-28],[-1,-29],[0,-37],[1.5,-31],[3,-30],[6,-31],[7,-28],[5,-25],[5,-28],[3,-27],[2,-23],[4,-21],[1,-22],[1,-20],[-1,-20],[-3,-22]]);
      line('#e4e8db',.6,[[0,-36],[1.5,-30],[3,-29],[5.5,-30],[6,-28],[5,-26]]);
    } else if(w==='katzbalger'){
      line('#69523b',1.8,[[0,4],[0,-2]]);
      oval('#acaa8e',0,4.5,2,1.3);
      poly(STEEL,[[-1.7,-3],[-1.7,-17],[-1,-19],[0,-20],[1,-19],[1.7,-17],[1.7,-3]]);
      line('#edf0da',.55,[[1.1,-4],[1.1,-17],[0,-19]]);
      // Curved S guard and short broad blade distinguish the Landsknecht sidearm.
      g.beginPath();g.moveTo(-4,-4);g.bezierCurveTo(-6,0,-1,-1,0,-2);g.bezierCurveTo(1,-3,6,-4,4,0);g.strokeStyle='#aca98e';g.lineWidth=1.4;g.stroke();
    } else if(w==='bozdogan'){
      line('#72543b',2,[[0,5],[0,-13]]);
      line('#a3977a',2.5,[[0,-4],[0,-13]]);
      poly(STEEL,[[-1,-12],[-3.7,-14],[-3,-18],[0,-20],[3,-18],[3.7,-14],[1,-12]]);
      line('#e2e5d7',.8,[[0,-19],[0,-13]]);
      line('#596860',.7,[[-2,-17],[-1.4,-13]]);
      line('#e2e5d7',.7,[[2,-17],[1.4,-13]]);
      oval('#998968',0,5,1.4,1);
    } else if(w==='yatagan'){
      // Short recurved blade, no crossguard; the flared ears retain the grip.
      poly('#ddd2b6',[[-.8,-2],[.8,-2],[.9,2],[2.1,3.5],[1.3,5],[0,4.3],[-1.5,5],[-2.1,3.4],[-.9,2]]);
      line('#a58f61',.6,[[-.8,-1],[.8,-1]]);
      g.beginPath();g.moveTo(-.8,-2);g.bezierCurveTo(-2.2,-7,-1.5,-12,2.8,-17);g.bezierCurveTo(.7,-12,2.2,-9,1.3,-5);g.lineTo(.8,-2);g.closePath();g.fillStyle=STEEL;g.fill();g.strokeStyle=INK;g.lineWidth=.55;g.stroke();
      g.beginPath();g.moveTo(.8,-3);g.bezierCurveTo(1.8,-8,.6,-12,2.8,-17);g.strokeStyle='#f0f0df';g.lineWidth=.55;g.stroke();
    } else if(w==='norseDaneaxe'){
      line('#886b42',1.6,[[0,9],[0,-24]]);
      poly('#95a29b',[[0,-24],[3,-24],[8,-27],[10,-25],[11,-20],[10,-16],[7,-14],[4,-18],[2,-20],[0,-20]]);
      line('#e3e4d2',.8,[[8,-27],[10,-25],[11,-20],[10,-16],[7,-14]]);
      line('#697b73',1.1,[[-1,-24],[1,-24],[1,-20],[-1,-20]]);
    } else if(w==='norseSword'){
      line('#705137',1.5,[[0,4],[0,-2]]);line('#a99b7b',1.4,[[-3,-2],[3,-2]]);
      poly('#b3aa8f',[[-2.5,4],[-1.7,5.2],[0,6],[1.7,5.2],[2.5,4]]);line('#716746',.5,[[-1,4],[-1,5],[1,5],[1,4]]);
      poly('#a9bab3',[[-1.4,-3],[-1.2,-20],[0,-22],[1.2,-20],[1.4,-3]]);line('#647971',.6,[[0,-3],[0,-19]]);
      line('#e6e8d3',.45,[[1,-4],[.9,-20],[0,-22]]);
    } else if(w==='phkak'){
      line('#765532',2,[[0,7],[0,-18]]);poly('#a8ada1',[[0,-18],[2,-21],[8,-16],[7,-14],[2,-18],[1,-15]]);line('#e0d7b8',.7,[[2,-21],[8,-16]]);
    } else if(w==='mamlukAxe'){
      // Put the cutting edge forward, on the same side as the other axes.
      g.save();g.scale(-1,1);
      line('#795539',1.7,[[0,7],[0,-23]]);
      poly('#8d9487',[[0,-23],[-8,-28],[-10,-23],[-9,-16],[-3,-12],[-2,-20],[0,-20]]);
      line('#d8d7bc',.8,[[-8,-28],[-10,-23],[-9,-16],[-3,-12]]);
      poly('#949b8b',[[0,-23],[3,-23],[3,-21],[0,-21]]);oval('#bda873',0,-22,1.5,1.7);line('#6d684b',.5,[[-.7,-22],[.7,-22],[.4,-21],[-.4,-21],[-.7,-22]]);
      g.restore();
    } else if(ax){const len=w==='axe'?12:21;line('#87633b',1.7,[[0,7],[0,-len]]);poly(STEEL,[[0,-len],[6,-len+1],[7,-len+6],[3,-len+8],[1,-len+5],[0,-len+5]]);line('#e0ddc0',.7,[[6,-len+1],[7,-len+6],[3,-len+8]]);}
    else if(w==='starMace'){
      line('#795536',1.7,[[0,5],[0,-14]]);
      const points=Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,r=i%2?1.9:4.4;return [Math.cos(a)*r,-14+Math.sin(a)*r];});
      poly('#a79976',points);oval('#655e45',0,-14,.9,.9);line('#d2c6a4',.5,[[-2,-16],[0,-17.7],[1,-15.7]]);
    }
    else if(w==='macuahuitl'){poly('#906b3e',[[-1,4],[-1,-3],[-2,-5],[-2,-17],[2,-17],[2,-5],[1,-3],[1,4]]);for(let y=-16;y<-5;y+=2.5)for(const d of [-1,1])poly('#313d39',[[d*2,y],[d*3.3,y],[d*3.3,y+1.6],[d*2,y+1.6]]);}
    else {const len=w==='gladius'?11:w==='greatsword'?25:19;line('#705137',1.4,[[0,4],[0,-2]]);line(GOLD,1.1,[[-3,-2],[3,-2]]);if(['sabre','katana'].includes(w)){g.beginPath();g.moveTo(.7,-3);g.quadraticCurveTo(.8,-len+4,-4,-len);g.quadraticCurveTo(-1,-len+5,-.8,-3);g.closePath();g.fillStyle=STEEL;g.fill();g.strokeStyle=INK;g.lineWidth=.5;g.stroke();line('#e7e4cd',.5,[[.3,-4],[.2,-12],[-3,-len+1]]);}else{poly(STEEL,[[-1,-3],[-1,-len+3],[0,-len],[1,-len+3],[1,-3]]);line('#edf0da',.45,[[0,-3],[0,-len+1]]);}}
    g.restore();}
  line(team?'#dc7764':'#64b7cb',1.4,[[3,-19],[4,-17]]);
}
export function drawHistoricalWarrior(g,p,cfg,team,frame,action,variant=0,paintHead=null) {
  const {line,poly}=pens(g),phase=(frame%8)/8,gait=['walk','charge','charge-ready'].includes(action)?Math.sin(phase*Math.PI*2):0,mounted=cfg.role==='cavalry';
  if(mounted)horse(g,p,gait,variant);
  g.save();g.translate(0,mounted?-17+Math.abs(gait)*.5:-Math.abs(gait)*.6);
  if(p.wings)for(const dx of [-2,1]){line('#765737',1.3,[[-4+dx,-9],[-9+dx,-22],[-9+dx,-37]]);for(let y=-35;y<-14;y+=2.7)line('#dfdccc',1.5,[[-9+dx,y],[-15+dx,y-4]]);}
  shield(g,p,true);
  if(p.quiver){poly('#795537',[[-6,-20],[-9,-17],[-7,-6],[-4,-8]]);for(let x=-8;x<-5;x++)line('#cab580',.6,[[x,-13],[x-1,-27]]);}
  armor(g,p,mounted,gait);
  if(p.bandolier){line('#a68a56',1.5,[[-3,-20],[4,-9]]);for(let i=0;i<5;i++)line('#d0b17a',1.1,[[-2+i*1.3,-19+i*2],[-3+i*1.3,-16.5+i*2]]);}
  if(paintHead)paintHead(g,p);else head(g,p);weapon(g,p,action,phase,team);shield(g,p);g.restore();
}
