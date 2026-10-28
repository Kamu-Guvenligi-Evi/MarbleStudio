import { weaponMotion } from './crown-battle-weapon-motion.js';
import { MIDDLE_EARTH_BY_ID } from './middle-earth-units.js';
import { stylizedExpansionSprite } from './middle-earth-stylized-expansion.js';

// Editable game-scale silhouettes, restrained material light and fine outlines.
// Draw once per cached pose at its native density, never per soldier per frame.
export function stylizedMiddleEarthSprite(type, team, frame, action, { density = 3, scale = 1 } = {}) {
  const fallback=stylizedExpansionSprite(type,team,frame,action,{density,scale});if(fallback)return fallback;
  const unit = MIDDLE_EARTH_BY_ID[type];
  if (!unit) throw new Error(`Unknown Middle-earth unit: ${type}`);
  const canvas = document.createElement('canvas'); canvas.width = 80*density; canvas.height = 76*density;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  g.setTransform(density*scale, 0, 0, density*scale, 30*density, 61*density);
  const phase = frame / 8 * Math.PI * 2;
  const walk = action === 'walk' ? Math.sin(phase) : 0;
  const hit = action === 'attack' ? Math.sin(frame / 7 * Math.PI) : 0;
  const breath = Math.sin(phase) * (action === 'idle' ? .22 : .08);
  const ink = '#202425', gold = '#c8aa6b';
  const teamCloth = team ? ['#d08770','#903e38','#45282c'] : ['#92bbcc','#467b98','#263e54'];
  const steel = ['#d5e1df','#819698','#3b4a53'], darkSteel = ['#8a9694','#444d50','#242a32'];
  const leather = ['#a18460','#67503c','#342d2a'], skin = ['#edd1ab','#bd9676','#75564b'];
  const id = type.slice(3), dwarf = /dwarf|gimli/.test(unit.art);
  const outlineScale = id==='balrog' || id==='cave_troll' ? .65 : 1;
  function grad(colors,x=-8,y=-40,xx=12,yy=0) {
    // Restrained material light, matching the historical canvas soldiers.
    const shadow='#'+[1,3,5].map(i=>Math.round(parseInt(colors[1].slice(i,i+2),16)*.62+parseInt(colors[2].slice(i,i+2),16)*.38).toString(16).padStart(2,'0')).join('');
    const p=g.createLinearGradient(x,y,xx,yy);
    const highlight='#'+[1,3,5].map(i=>Math.round(parseInt(colors[1].slice(i,i+2),16)*.72+parseInt(colors[0].slice(i,i+2),16)*.28).toString(16).padStart(2,'0')).join('');
    p.addColorStop(0,highlight);p.addColorStop(.48,colors[1]);p.addColorStop(1,shadow);return p;
  }
  function path(d,fill,edge=ink,width=.6) {
    const p=new Path2D(d);g.fillStyle=fill;g.fill(p);
    if(edge){g.strokeStyle=edge;g.lineWidth=width*outlineScale;g.lineJoin='round';g.stroke(p);}return p;
  }
  function line(d,color,width=.6) {
    g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.stroke(new Path2D(d));
  }
  function oval(x,y,rx,ry,fill,edge=null) {
    g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=fill;g.fill();
    if(edge){g.strokeStyle=edge;g.lineWidth=.4;g.stroke();}
  }
  function texture(p,color,spacing=2) {
    // Texture hatching was unreadable at game size; the silhouette and armour
    // seams carry the detail. Retain the call sites as material annotations.
  }
  function belt(y=-19,width=8) {
    path(`M${-width},${y-1}L${width},${y-1.6}v2.4L${-width},${y+1.3}Z`,'#3c3029');
    path(`M1,${y-1.7}h3v2.7H1Z`,gold);line(`M2,${y-1}v1.5`,'#e2d4a9',.3);
  }
  function tree(x,y,s=1,color='#e2dfc5') {
    g.save();g.translate(x,y);g.scale(s,s);
    line('M0,3V-5M0,-2L-3,-4 -4,-6M0,-1L3,-4 4,-6M0,0L-4,-2M0,1L4,-1M-2,3H2',color,.65);
    for(const [x,y] of [[-3,-6],[0,-7],[3,-6]])oval(x,y,.38,.38,color);g.restore();
  }
  function leg(x,swing,armored,wide=2.3) {
    g.save();g.translate(x,-18);g.rotate(swing*.32);
    const p=path(`M${-wide},0Q0,-1 ${wide},0L${wide-.2},8 1.8,16Q4,17 4.8,18H-2.5L-2.2,9Z`,grad(armored?darkSteel:leather));
    if(armored){line(`M${-wide+.4},2L.7,7 -1,13`,'#a5aaa3',.45);path('M-2,7Q0,6 2,7L2,9H-2Z',grad(steel));}
    else texture(p,'#d5ba8a35',2.6);
    path('M-2,12L2,12 1.8,16Q4,17 4.8,18H-2.5Z',grad(['#796e5b','#3e3b34','#25292a']));
    line('M-1.6,13H1.9M-1.6,14.5H1.7','#b29c75',.4);g.restore();
  }
  // Opens a local hand/weapon coordinate system. Each caller restores it.
  function arm(x,y,rotation,colors=steel,bare=false) {
    g.save();g.translate(x,y);g.rotate(rotation);
    path('M-2.8,0Q0,-2.6 2.8,0L2.3,7 2,12H-1.7L-2,7Z',grad(colors));
    if(!bare){path('M-2.5,7L2.4,6.7 2,10.3H-2Z',grad(darkSteel));line('M-1.9,7.5L1.6,7.2',gold,.35);}
    oval(.2,12,2,1.6,grad(bare?colors:skin));
  }
  function sword(kind='sword') {
    // Grip is inside the fist; the blade extends away from the hand.
    path('M-.65,3H.65V-3H-.65Z','#514238');oval(0,3.3,.9,.7,gold);
    if(kind==='axe'){
      line('M0,2V-20','#836744',1.4);
      path('M0,-18Q6,-21 8,-15Q6,-10 0,-12L-3,-12Q-6,-15 -3,-19Z',grad(steel));line('M7,-17Q8,-14 5,-12','#eef1dc',.6);
    }else if(kind==='mace'){
      line('M0,2V-16','#6f7470',1.5);
      path('M-2,-12L-5,-15 -3,-18 -4,-21 -1,-19 0,-23 2,-19 4,-21 4,-17 6,-15 2,-12Z',grad(darkSteel));line('M0,-21V-13M-3,-18L2,-14','#c7cec0',.55);
    }else if(kind==='cleaver'){
      path('M-1,-3L-2,-18 4,-19 2,-16 2,-3Z',grad(darkSteel));line('M-1.7,-17L-.6,-3','#e0d9bc',.7);
    }else if(kind==='curved'){
      path('M-.7,-3Q-3,-14 3,-23Q1,-14 1,-3Z',grad(steel));line('M-1,-6Q-2,-14 2,-20','#f5efcf',.5);
    }else{
      path('M-1,-3L-1.5,-18 0,-22 1.5,-18 1,-3Z',grad(steel));line('M0,-20V-4','#f5f1d6',.45);
    }
    if(kind!=='axe'&&kind!=='mace')line('M-3,-3Q0,-4 3,-3',gold,1);
  }
  function shield(style) {
    g.save();g.translate(-6,-24);g.rotate(-.12+hit*.12);
    if(style==='rohan'){
      oval(0,0,7.2,8,grad(['#aea87b','#4a5d42','#2e382f']),gold);
      for(let n=0;n<4;n++){g.save();g.rotate(n*Math.PI/2);line('M1,-2Q5,-6 1,-6L-1,-4','#dfd1a2',.7);g.restore();}
      oval(0,0,1.6,1.8,grad(steel),ink);
    }else if(style==='uruk'){
      path('M-6,-8L5,-7 6,5 -2,9 -6,4Z',grad(darkSteel));
      path('M-1,3L-3,0 -4,-3 -3.2,-3.5 -1.5,-1 -2,-5 -1,-5 -.4,-1 .5,-5 1.4,-4.5 1,-1 2.4,-3 3,-2 1.5,2Z','#d5d1b7',null);
      line('M-5,-6L4,-5M-5,4L-1,7','#9e9a84',.5);
    }else if(style==='dwarf'){
      path('M-6,-7L0,-9 6,-7 6,4 0,8 -6,4Z',grad(['#d1ad69','#6c5a43','#373d3f']),gold);
      path('M-3,-5H3V2L0,5 -3,2Z',grad(darkSteel),gold);line('M0,-4V3M-2,0H2',gold,.6);
    }else{
      path('M-5.5,-8Q0,-10 5.5,-8L5,3Q2,7 0,9Q-3,7 -5,3Z',grad(style==='elite'?steel:['#78878a','#3d4b52','#242e38']),gold);
      tree(0,0,.85,style==='elite'?'#344149':'#e0e3d3');
    }g.restore();
  }
  g.translate(hit*1.2,breath-Math.abs(walk)*.5);
  g.scale(unit.heightScale,unit.heightScale);
  if(id==='cave_troll'||id==='balrog'){
    const fire=id==='balrog',flesh=fire?['#756356','#352f30','#191f25']:['#aaa18b','#747c70','#424f4d'];
    if(fire){
      // Wings are the film interpretation; flight is not simulated.
      for(const side of [-1,1]){g.save();g.scale(side*.82,1);
        path('M0,-28Q-7,-39 -20,-39L-25,-42 -22,-35Q-18,-34 -18,-29Q-14,-29 -14,-24Q-10,-25 -8,-18L-4,-24Z',grad(['#766553','#393338','#1e252a']));
        line('M-1,-29Q-11,-38 -24,-41M-2,-28L-21,-35M-4,-25L-17,-29M-5,-24L-13,-24','#9b684a',.42);
        line('M-8,-32L-11,-35M-14,-33L-16,-35M-8,-27L-11,-29','#57433c',.3);g.restore();}
      for(let k=0;k<8;k++){const x=-11+k*3,flick=Math.sin(phase+k)*1.2;
        path(`M${x},-32Q${x-4},-39 ${x-1},${-42-flick}Q${x+1},-38 ${x+3},-40Q${x+2},-35 ${x+5},-31Z`,grad(['#fbc476','#d65b2f','#622e2a']),null);}
    }
    for(const side of [-1,1]){g.save();g.translate(side*6,-17);g.rotate(side*walk*.22);
      const p=path('M-4,0Q0,-2 4,0L3,10 5,15Q1,18 -4,16L-3,9Z',grad(flesh));texture(p,fire?'#d27b4038':'#323f3c55',2.2);
      if(fire){path('M-3,1L0,-.3 2,2 1,7 -1,10 -2,7Z','#49403c',null);line('M-2,2L0,5 -1,8M1,11L0,13 2,15','#b76b3d',.35);}
      for(let t=-2;t<4;t+=2)path(`M${t},15l.7,2 1,-2Z`,fire?'#b8966c':'#c7bd9c');g.restore();}
    const torso=path('M-9,-33Q0,-38 10,-33L13,-24 8,-15Q0,-12 -8,-16L-13,-26Z',grad(flesh));texture(torso,fire?'#d3773b55':'#c8c3a73d',1.9);
    line('M-7,-28Q-3,-30 0,-27Q4,-30 8,-28M0,-26L1,-19M-5,-23L-2,-21M4,-23L6,-21',fire?'#e59451':'#515b51',.6);
    if(fire){
      path('M-10,-31L-5,-33 -1,-30 -2,-27 -8,-26Z','#49403d',null);
      path('M2,-30L7,-33 10,-29 8,-25 3,-26Z','#453b38',null);
      line('M-9,-32L-6,-30 -6,-28M6,-32L4,-29 6,-27M-7,-24L-6,-21 -3,-20M3,-23L2,-20 4,-18M0,-32L1,-30','#be6b3b',.35);
      line('M-7,-27L-4,-28M3,-28L6,-27','#e2a05a',.35);
    }
    if(!fire){path('M-9,-17Q0,-14 9,-17L7,-11 -1,-9 -7,-12Z',grad(leather));belt(-16,9);line('M-9,-30L7,-17','#514d40',2);}
    arm(-11,-31,.16+walk*.1,flesh,true);g.restore();
    arm(7,-29,-.3-hit*.5,flesh,true);g.translate(0,12);g.rotate(.6+hit*1.5);g.scale(.73,.73);
    if(fire){line('M0,1V-8','#8a5633',1.5);path('M-2,-5Q-7,-14 -1,-26L1,-21 3,-24Q2,-14 4,-9L1,-5Z',grad(['#ffeb9a','#f99c46','#c04728']),'#71372a');line('M0,-7Q-3,-16 0,-22','#fff0ac',.7);}
    else{line('M0,3V-16','#786449',2.4);path('M-4,-14L-5,-23 -2,-26 4,-25 6,-16 3,-13Z',grad(['#aaa99a','#727a73','#414b4d']));line('M-3,-23L1,-21 4,-23M0,-20L1,-16','#c1bd9d',.6);}
    g.restore();
    if(fire){const whip=`M-12,-19Q-22,-11 -18,-5Q-11,2 -4,-5Q7,-13 ${24+hit*3},-6`;line(whip,'#c14e2b',1.4);line(whip,'#ffd98b',.5);}
    const head=path('M-5,-39Q0,-43 6,-38L8,-33 5,-30 -3,-30 -6,-34Z',grad(flesh));texture(head,'#2b363b55',2);
    if(fire){for(const side of [-1,1]){g.save();g.scale(side,1);path('M3,-38Q11,-38 10,-43Q14,-40 10,-36L5,-34Z',grad(['#c5b58e','#716354','#332d2b']));g.restore();}
      path('M-4,-38L0,-39 2,-36 0,-34 -3,-35Z','#51423c',null);
      line('M-2,-36L.5,-35.6M4,-35.8L6,-36.4','#ffe48b',.55);
      path('M-.5,-33L2,-34 6,-33.5 5,-31.5 1,-31.5Z','#151d20',null);
      path('M1,-33.3L1.6,-32 2.2,-33.5M4,-33.5L4.6,-32.4 5,-33.4Z','#e2bc80',null);
      line('M1,-35L2,-34.5 3,-35M1,-30.5L4,-30.5','#a6653f',.4);
    }else{oval(3.8,-36,.8,.5,'#221f1a');line('M4,-34L7,-33 4,-32','#424a40',.7);path('M2,-31L3,-33 4,-31Z','#dfd5ad');}
    path('M-13,-24L-9,-23 -9,-20 -13,-21Z',grad(fire?['#947251',team?'#74473a':'#4d5555','#302b29']:teamCloth));return canvas;
  }
  const gondor=id.startsWith('gondor'),uruk=id.startsWith('uruk'),elf=id==='lorien_elf'||id==='legolas'||id==='elrond';
  const wizard=id==='gandalf',wraith=id==='witch_king',darkLord=id==='sauron',orc=id==='mordor_orc';
  const rohan=id==='rohan_warrior',ranger=id==='aragorn',veteran=id.includes('veteran');
  const armored=gondor||uruk||dwarf||darkLord,robes=wizard||wraith;
  const coat=wizard?['#c6c6ba','#929b97','#586564']:wraith?['#5a6064','#30383f','#171f28']:ranger?['#7a8871','#4b5a4c','#293b36']:elf?['#a4aa7b','#586f4e','#34483f']:rohan?['#ad9363','#6c6242','#38473a']:uruk?darkSteel:dwarf?['#b2a280','#74664f','#423e37']:steel;
  if(dwarf)g.scale(1.2,1);
  if(!orc&&!uruk){
    path(`M-6,-32Q-10,-29 -11,-20L${-14-walk},-3 -9,-5 -6,-2 -1,-4 5,-2 8,-8 6,-30Z`,grad(wraith?['#555a60','#292e37','#141d26']:ranger||elf?['#748773','#425d4d','#263d35']:wizard?coat:teamCloth));
    line(`M-6,-29Q-10,-17 ${-11-walk},-6M-3,-27Q-6,-15 -5,-6M1,-25L3,-7`,'#d2d4bd32',.6);
  }
  leg(-3.4,-walk,armored,dwarf?3:2.3);leg(3.3,walk,armored,dwarf?3:2.3);
  if(robes){
    path('M-6,-31Q0,-34 7,-31L8,-20 10,-2 4,-1 0,-2 -6,-1 -9,-3 -6,-21Z',grad(coat));
    line('M-3,-28L-5,-3M1,-28L0,-4M4,-25L6,-4','#d6d8c24d',.65);belt(-20,7);
  }else{
    const skirt=path(`M-7,-21H7L${dwarf?10:8},-12 4,-11 0,-12 -5,-11 -8,-13Z`,grad(armored?darkSteel:coat));if(armored)texture(skirt,'#cad0bb66',1.4);
    const torso=path(`M-6,-33Q0,-35 6,-33L${dwarf?9:8},-27 6,-19 -6,-19 -8,-27Z`,grad(coat));if(uruk||dwarf)texture(torso,'#dcc8a23a',1.6);
    if(armored){
      path('M-6,-32L0,-30 6,-32 5,-24 0,-21 -5,-24Z',grad(darkLord||uruk?darkSteel:steel));
      line('M0,-30V-22M-5,-28L-1,-26M5,-28L1,-26',darkLord?'#b1b0a1':'#ede5c4',.45);
      if(gondor)tree(0,-26,.55);if(dwarf)line('M-4,-29L0,-27 4,-29M-4,-26L0,-24 4,-26',gold,.7);
    }else{line('M-5,-31L5,-20','#bba27b',1.2);line('M-4.6,-31L5.4,-20','#3b322d',.45);}
    belt(-19,7);if(veteran)path('M-4,-19H4L3,-8 0,-10 -3,-8Z',grad(teamCloth),gold);
  }
  if(armored)for(const side of [-1,1]){g.save();g.scale(side,1);path('M5,-33Q9,-35 11,-29L6,-28Z',grad(darkLord||uruk?darkSteel:steel));line('M6,-32L9,-30',gold,.4);if(darkLord)path('M7,-33L8,-39 9,-33 12,-36 11,-29Z',grad(darkSteel));g.restore();}
  arm(-7,-30,walk*.16+.12,coat);g.restore();
  if(id==='legolas'){
    path('M-10,-25L-13,-36 -9,-37 -6,-26Z',grad(leather));
    for(let k=0;k<3;k++){line(`M${-12+k*1.5},-33L${-15+k*1.5},-41`,'#d2bd8c',.5);line(`M${-15+k*1.5},-41l-1.2,1.7`,'#e4e0c7',.8);}
  }
  const complexion=orc?['#b4ae7f','#87845e','#535b43']:uruk?['#b39a82','#80685a','#4a4140']:skin;
  const hair=id==='legolas'?['#e0cc91','#b29a65','#776747']:dwarf?['#b78552','#805337','#4b342b']:['#746358','#443b35','#292c2b'];
  if(ranger||elf||dwarf)path('M-5,-39Q-1,-44 5,-40L7,-31 3,-30 -4,-31 -6,-34Z',grad(hair));
  path('M-3,-39Q0,-42 4,-39L5,-36 6.4,-34.5 4.7,-33.8 4,-31 -1,-31 -4,-35Z',grad(complexion));
  line('M2,-37L4.3,-37.2',ink,.55);oval(3.5,-36.8,.35,.35,'#e6ddd0');line('M3,-33L4.5,-33.4','#634c42',.4);
  if(elf){path('M-3,-37L-7,-39 -4,-34Z',grad(skin));line('M-4,-39Q0,-41 4,-39',gold,.45);}
  if(ranger){path('M-4,-38L-4,-32 -1,-29 3,-31 4,-33 1,-32 -2,-34Z',grad(hair));line('M-2,-40Q0,-41 3,-39','#b3a283',.4);}
  if(dwarf){
    const beard=path(`M-4,-35Q-2,-32 2,-33L5,-35 6,-29 3,-23 0,${id==='gimli'?-19:-22} -5,-24 -7,-31Z`,grad(hair));texture(beard,'#e8b77660',1.8);
    for(let x=-3;x<4;x+=2)line(`M${x},-31Q${x-1},-27 ${x+1},-24`,'#d3a56c',.45);line('M-4,-26L-1,-25M1,-25L4,-26',gold,.8);
  }
  if(wizard){
    path('M-4,-38Q-7,-33 -4,-29L-2,-27 -3,-32 0,-29 3,-33 5,-31 4,-38Z',grad(['#deded0','#b5bdb5','#7b8d88']));
    path('M-4,-34Q-2,-31 2,-33L5,-34 5,-28 1,-21 -3,-25 -5,-30Z',grad(['#e7e4cf','#b6c0b4','#7c918c']));line('M-2,-32L0,-25M2,-31L1,-24','#f8eed9',.45);
    path('M-9,-39Q-3,-42 -2,-51L2,-49 5,-41 9,-39Q1,-36 -9,-39Z',grad(coat));line('M-4,-41Q1,-40 5,-41','#d0c8a6',.5);
  }else if(wraith){
    path('M-6,-39Q0,-44 5,-40L7,-31 3,-29 -5,-31Z',grad(coat));path('M-2,-39L4,-38 5,-32 -2,-32Z','#11191f');
    path('M-6,-39L-7,-47 -3,-41 -1,-48 1,-41 5,-47 4,-40 7,-43 6,-35 2,-33 -3,-35Z',grad(darkSteel));
    path('M-2,-38L0,-36 -1,-34 -3,-36ZM2,-38L4,-38 3,-35 1,-35Z','#131b22');line('M0,-40L0,-33','#c7ccc0',.6);
  }else if(darkLord){
    path('M-5,-36L-6,-43 -4,-45 -4,-47 -1,-42 1,-47 3,-42 6,-46 6,-40 5,-34 1,-30 -3,-33Z',grad(darkSteel));
    line('M-3,-42L0,-35 1,-31M4,-41L2,-35','#b8bbb1',.65);line('M-2,-37L0,-36M2,-36L4,-37','#efb667',.65);
  }else if(gondor){
    // Gondor: a tall forged ridge, fitted cheek guards and an open eye line.
    // Keep the face legible at battle scale; veterans have engraved silver wings.
    path('M-5.4,-36.5Q-6.5,-42 -3,-44L-.6,-48.4 1,-45Q5.6,-43.8 6,-38.3L4.8,-37.2 3.5,-40.1 .9,-40.8 -2.6,-39.4 -3.3,-35Z',grad(['#edf2e8','#a1b1b7','#3b4b5a']));
    path('M-.6,-48.4L.5,-43.7 .9,-40.8 -.2,-39.7 -1.2,-43Z',grad(['#fcf8e4','#d3dddb','#71868e']));
    path('M-5.2,-39.7L-2.6,-39.4 -2.5,-36.5 -.6,-34.4 -3.5,-32.8 -5.7,-35.6Z',grad(['#c4d4d5','#728c99','#334452']));
    path('M4.9,-39.3L6,-38.3 5.4,-35.6 3.5,-33.5 2.9,-35.7 4,-37Z',grad(steel));
    path('M.9,-40.8L2.1,-40.4 2.8,-36.8 1.8,-36.3 1.3,-38.8Z',grad(steel));
    line('M-4.9,-40.1Q-.4,-42.1 4.8,-40.2','#f4f4e5',.5);
    line('M-4.7,-38.8L-4.8,-35.9 -3.3,-34.3','#dce5df',.4);
    for(const y of [-38.4,-36.8])oval(-4.4,y,.24,.24,'#e6e6ce');
    if(veteran){
      path('M-5,-38L-8.6,-44.8 -7.8,-45.7 -4.8,-42.8 -3.6,-39.2Z',grad(steel));
      line('M-7.7,-44.2L-5.1,-39.8M-6.9,-43.2L-4.6,-40.3','#f5f2da',.35);
      line('M-2,-42.1L-.8,-43.8 .3,-42.4',gold,.4);
    }
  }else if(dwarf||rohan||uruk){
    const helmet=rohan?['#d8bb75','#93804f','#514a3b']:uruk?darkSteel:dwarf?['#d8b477','#9d7c50','#534a3e']:steel;
    path('M-5,-36Q-7,-43 0,-44Q6,-43 6,-37L3,-37 2,-40 0,-37 -3,-36 -3,-32 -5,-33Z',grad(helmet));line('M0,-43L0,-38',gold,.5);
    if(uruk)path('M-4,-38L5,-38 5,-33 2,-32 2,-36 -2,-36 -2,-32 -4,-33Z',grad(darkSteel));
    if(rohan)path('M-2,-44Q-5,-48 -7,-44L-6,-36 -4,-34 -5,-41Z',grad(['#e1d1a9','#b59b6c','#655e45']));
    if(veteran)path('M-2,-43L0,-44.5 2,-43 4,-44 3,-41 -3,-41 -4,-44Z',grad(['#e5ca8d','#b1955d','#6a644e']));
  }else if(orc){
    path('M-4,-40L-7,-42 -5,-35 -2,-35Z',grad(complexion));path('M-4,-40L0,-43 4,-41 6,-38 2,-39Z',grad(darkSteel));line('M2,-32L3,-34 4,-32','#e5d8aa',.7);
  }
  path('M-8,-29L-5,-28 -5,-24 -8,-25Z',grad(teamCloth));
  if(id==='legolas'){
    // Drawing hand pulls inward; arrow and bow face forward (+x).
    line(`M6,-30L${4-hit*4},-27 12,-26`,grad(coat),3.1);oval(4-hit*4,-27,1.4,1.3,grad(skin));
    line('M7,-31L14,-27 18,-27',grad(coat),3);oval(18,-27,1.5,1.2,grad(skin));
    g.save();g.translate(19,-27);line('M-1,-12Q10,-8 3,0Q10,8 -1,12','#a99460',1.2);
    line(`M-1,-12L${-5-hit*5},0 -1,12`,'#e3d6b7',.35);
    if(hit<.96){line(`M${-5-hit*5},0H15`,'#d0b887',.55);path('M15,-1L19,0 15,1Z','#c9d7d2');}
    line('M2,-3L4,-1M2,3L4,1',gold,.5);g.restore();
  }else if(unit.kind==='spear'){
    const pose=weaponMotion('spear',action,frame/8,.94),hx=12+pose.x,hy=-27+pose.y;
    line(`M7,-31L${8+pose.x*.5},-25 ${hx},${hy}`,grad(coat),3);
    g.save();g.translate(hx,hy);g.rotate(pose.angle);
    line('M0,24V-21','#6f5941',1.3);line('M0,24V-21','#c6a36d',.4);
    path('M-1.4,-20L0,-27 1.4,-20Z',grad(steel));g.restore();
    oval(hx,hy,1.7,1.4,grad(skin));if(gondor)shield('gondor');
  }else{
    const weapon=dwarf?'axe':darkLord?'mace':uruk||orc?'cleaver':elf?'curved':'sword';
    const pose=weaponMotion(weapon,action,frame/8,.12),hx=11.5+pose.x,hy=-20+pose.y;
    line(`M7,-31L${6+pose.x*.5},${-25+pose.y*.6} ${hx},${hy}`,grad(coat),3.2);
    g.save();g.translate(hx,hy);g.rotate(pose.angle);if(darkLord)g.scale(.9,.9);sword(weapon);g.restore();oval(hx,hy,1.4,1.2,grad(skin));
    if(gondor)shield(veteran?'elite':'gondor');else if(rohan)shield('rohan');else if(uruk)shield('uruk');else if(dwarf&&id!=='gimli')shield('dwarf');
    if(wizard){
      line('M-10,-1L-12,-44','#6a5e48',1.4);line('M-10,-2L-12,-43','#c4b28a',.45);
      path('M-13,-42L-15,-47 -13,-50 -11,-47 -9,-48 -8,-45 -11,-42Z',grad(leather));oval(-10.5,-45.5,.9,1.2,'#e3e5c6');oval(-10.8,-21,1.5,1.2,grad(skin));
    }
    if(wraith){line('M-10,-21L-16,-17 -12,-11','#9da4a1',.55);path('M-15,-12L-16,-15 -13,-13 -11,-16 -10,-12 -7,-11 -11,-10 -11,-7 -13,-9 -16,-8Z',grad(darkSteel));}
  }
  // Shield must not conceal the only team marking on heavy Uruk infantry.
  if(uruk){path('M-6,-16L-2,-15.5 -2,-13 -6,-13.5Z',grad(teamCloth));}
  return canvas;
}
