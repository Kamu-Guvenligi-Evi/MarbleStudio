import { weaponMotion } from './crown-battle-weapon-motion.js';
// Medium-detail, editable companion art. Shapes and equipment distinguish units;
// restrained material light replaces texture noise and photographic shading.
import { drawAzogWarg } from './middle-earth-azog-art.js';
const INK='#27302f', STEEL='#a6b6b6', STEEL_DARK='#687f86', GOLD='#bca06a';
const mounted={
 me_nazgul:{mount:'horse',body:'#444b51',shade:'#343b42',coat:'#343b43',cloak:'#292f37',weapon:'sword',hood:true},
 me_rohirrim:{mount:'horse',body:'#a07c55',shade:'#7c5c40',coat:'#647358',cloak:'#52624c',weapon:'spear',helm:'rohan',shield:'rohan'},
 me_gondor_cavalry:{mount:'horse',body:'#aab1af',shade:'#7b8988',coat:STEEL,cloak:'#465a66',weapon:'spear',helm:'gondor',shield:'gondor',barding:true},
 me_dwarf_ram_rider:{mount:'ram',body:'#b4b09a',shade:'#858778',coat:'#82928d',cloak:'#675b49',weapon:'axe',helm:'dwarf',beard:'#815d3b',shield:'dwarf',dwarf:true},
 me_elf_stag_rider:{mount:'stag',body:'#ad9065',shade:'#827253',coat:'#7f947a',cloak:'#526d58',weapon:'curved',helm:'elf',hair:'#c9bc8c',elf:true},
 me_azog_warg:{mount:'warg',azog:true,body:'#c8c9bb',shade:'#999f94',coat:'#9d9985',weapon:'mace',skin:'#c5c4ae',orc:true},
 me_uruk_warg_rider:{mount:'warg',hyena:true,body:'#81725a',shade:'#554e42',coat:'#424c4e',weapon:'cleaver',skin:'#927561',orc:true,uruk:true,shield:'uruk'},
 me_theoden:{mount:'horse',body:'#c5c1ae',shade:'#969d90',coat:'#797659',cloak:'#7a4c45',weapon:'sword',helm:'king',shield:'rohan',beard:'#c1b385'},
 me_eomer:{mount:'horse',body:'#997153',shade:'#715541',coat:'#8e8b79',cloak:'#63724f',weapon:'sword',helm:'eomer',shield:'rohan',hair:'#bf9c65'},
 me_thranduil:{mount:'stag',body:'#b1a78b',shade:'#888670',coat:'#b6c0aa',cloak:'#648078',weapon:'curved',crown:true,hair:'#ddd1a6',elf:true},
 me_dain:{mount:'boar',body:'#837464',shade:'#625b51',coat:'#a18b68',cloak:'#775043',weapon:'hammer',helm:'dain',beard:'#a5633e',shield:'dwarf',dwarf:true,barding:true},
};
const foot={
 me_elrond:{coat:'#9eae9b',cloak:'#667e7a',hair:'#4a4039',weapon:'curved',elf:true,circlet:true,armored:true,longHair:true},
 me_boromir:{coat:'#715c50',cloak:'#7c554e',hair:'#a3835c',beard:'#92734f',weapon:'sword',shield:'boromir',horn:true},
 me_faramir:{coat:'#6b7d5d',cloak:'#4b6956',hair:'#976f45',beard:'#976f45',weapon:'bow',quiver:true},
 me_saruman:{coat:'#d5d6bf',cloak:'#b7c1b0',hair:'#dedec7',beard:'#e2dfc8',weapon:'staff',wizard:true},
 me_haldir:{coat:'#b4a66d',cloak:'#8b5f54',hair:'#c8b57d',weapon:'curved',elf:true,armored:true},
};
function pens(g,outlineScale=1){
 const material=color=>{if(!/^#[0-9a-f]{6}$/i.test(color))return color;const tint=k=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(color.slice(i,i+2),16)+k))).toString(16).padStart(2,'0')).join('');const v=g.createLinearGradient(-12,-50,20,2);v.addColorStop(0,tint(12));v.addColorStop(.55,color);v.addColorStop(1,tint(-10));return v;};
 const path=(d,color,edge=INK,w=.6)=>{const p=new Path2D(d);g.fillStyle=material(color);g.fill(p);if(edge){g.strokeStyle=edge;g.lineWidth=w*outlineScale;g.stroke(p);}return p;};
 const line=(d,color,w=.6)=>{g.strokeStyle=color;g.lineWidth=w;g.stroke(new Path2D(d));};
 const oval=(x,y,rx,ry,color,edge=INK,w=.6)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=color;g.fill();if(edge){g.strokeStyle=edge;g.lineWidth=w;g.stroke();}};
 return{path,line,oval};
}
function shield(g,style,x,y){
 const{path,line,oval}=pens(g);g.save();g.translate(x,y);
 if(style==='rohan'||style==='boromir'){
  oval(0,0,5.8,6.1,style==='boromir'?'#6a5550':'#586b50',GOLD,.85);
  if(style==='rohan'){
   for(let i=0;i<4;i++){g.save();g.rotate(i*Math.PI/2);line('M.7,-1.8Q4,-4.8 1.2,-4.3L.3,-3','#d3c39a',.65);g.restore();}
  }else{line('M-4.7,0H4.7M0,-5V5','#aaa78f',.6);oval(0,0,4.5,4.8,'#6a5550','#a19d86',.35);}
  oval(0,0,1.4,1.5,STEEL,INK,.45);
 }else if(style==='uruk'){
  path('M-5,-7L4,-6 5,1 2,7 -5,5Z','#394346','#8e9690',.8);
  path('M-1,2L-3,0 -3,-2 -2,-2 -1,-.7 -1,-4 0,-4 .2,-1 .5,-4 1.4,-4 1.3,-1 2,-3 2.8,-2.8 2,1 1,3 -1,3Z','#d4d0b7',null);
 }else if(style==='dwarf'){
  path('M-5,-5L0,-7 5,-5V3L0,6 -5,3Z','#65736d',GOLD,.8);
  line('M-2.5,-3L0,-4.5 2.5,-3V1L0,3 -2.5,1ZM0,-3V2',GOLD,.75);
 }else{
  path('M-5,-6Q0,-8 5,-6L4.5,3 0,7 -4.5,3Z','#495d66',STEEL,.8);
  line('M0,4V-4M0,-1L-3,-3M0,1L3,-2M0,-3L2,-5M-2,4H2','#d6dfcf',.7);
  for(const x of [-3,0,3])oval(x,-5.6,.35,.35,'#d6dfcf',null);
 }
 g.restore();
}
function head(g,c,x,y,small=false){
 const{path,line,oval}=pens(g);g.save();g.translate(x,y);if(small)g.scale(.86,.86);
 const skin=c.skin||'#c6a17d',hair=c.hair||c.beard||'#5e4c3c';
 if(c.longHair)path('M-3,-4Q-6,-2 -6,4L-8,10 -4,9 -3,5 3,7 4,2 2,-4Z',hair);
 if(c.hood){
  path('M-4,2Q-6,-5 -2,-7L2,-7Q6,-3 5,3L1,5 -5,5Z',c.coat);
  path('M-1,-4L2,-4 3,1 0,3 -2,1Z','#151f26',null);
  line('M-3,-3L-4,2M3,-3L4,2','#58616a',.55);g.restore();return;
 }
 if(c.hair||c.beard||c.wizard)path('M-3,2L-4,-3Q-2,-7 2,-5L4,-2 4,5 -3,6Z',hair);
 path('M-2.7,-3Q0,-5 2.6,-3L3,-1 4,.4 2.9,1.1 2.5,3 -1,3.4 -3,1Z',skin);
 path('M-2.7,-2.4L-1.7,-3.3 -1.5,2 -2.7,1Z',c.orc?'#a0a794':'#aa886d',null);
 line('M1,-1L2.5,-1.2',INK,.6);line('M1.8,1.9L2.7,1.8','#735c4e',.4);
 if(c.elf)path('M-2.5,-1.3L-5,-3 -3,1.2Z',skin);
 if(c.hair){
  path('M-3.4,-1Q-4,-5 0,-5.5L3,-4 3.2,-2.5 0,-3.5 -2,-2 -2,3.5 -4,4.8Z',hair);
  if(c.elf)line('M-2.6,-3.3L-3.1,2.7','#e0cf9f',.45);
 }
 if(c.beard){
  path(c.dwarf?'M-3,1L-.4,2.1 2.9,1 3.2,5 .7,9 -1,7 -2.6,9 -4,4Z':c.wizard?'M-3,1L0,2 3,1 3,5 1,12 -1,10 -3,5Z':'M-2,1.3L0,2.2 3,1.3 2.5,3.3 -.4,4.7 -2,3Z',c.beard);
  if(c.dwarf){line('M-1.8,3L-1.8,6M.7,3L.7,6','#d2ad78',.45);line('M-2.7,6H-1M0,6H1.6',GOLD,.9);}
  if(c.wizard)line('M-1,3L0,9M1,3L1,7','#f1edda',.55);
 }
 if(c.orc){
  path('M-2,-3L-5,-5 -4,0 -2,0Z',skin);
  line('M-1.8,-2.5L-.8,-.7M-.9,.5L0,1.8','#898d7f',.6);
  path('M1.5,2.6L2.3,.8 3.2,2.5Z','#ddd7b9',null);
 }
 if(c.uruk){
  path('M-4,0L-4,-5 -1,-7 3,-5 4,-1 2,-1 2,3 .5,3 .5,-1 -1.5,-1 -2,3 -4,2Z','#424c4e');
  line('M-3,-3L3,-3','#929b91',.65);
  line('M-1,-5V-3M-2,-4H0','#d4d0b7',.65);
 }
 if(c.helm){
  const gondor=c.helm==='gondor',dwarf=c.dwarf,rohan=['rohan','king','eomer'].includes(c.helm);
  const metal=gondor?STEEL:dwarf?'#8b9d99':'#9e936d';
  path(gondor?'M-4,-.8Q-5,-5 -1.2,-6L0,-9 1.5,-6Q5,-4.5 4,-1L2,-2 -1,-2Z':'M-4,-.5Q-5,-5 0,-6Q4,-5 4,-1L1,-2 -1,-1Z',metal);
  path('M-4,-1L-2.2,-1 -2,2 -3,3 -4,1Z',gondor?STEEL_DARK:'#7c795f');
  line('M-3.5,-1.8L3,-2',gondor?'#e2e7d7':GOLD,.8);
  line('M0,-5L.4,1',gondor?'#d9e2dc':GOLD,.75);
  if(rohan)line('M-2,-4Q0,-5 2,-3M-2.5,-3L-2,-2',GOLD,.45);
  if(c.helm==='eomer')path('M-1,-5Q-3,-11 -7,-7L-7,0 -5,2 -5,-4 -2,-4Z','#bba57d');
  if(c.helm==='king'){path('M-2.5,-4L-3,-7 -1,-5 0,-7 1.5,-5 3,-6 2.5,-3Z',GOLD);line('M-2,-3H2','#e0c68c',.45);}
  if(c.helm==='dain'){path('M-4,-3L-6,-7 -3,-6 -1,-4 1,-6 4,-7 3,-3Z',GOLD);line('M-3,-1L-3,2M2,-1V2',GOLD,.75);}
 }
 if(c.circlet)line('M-3,-3L0,-2 3,-3',GOLD,.75);
 if(c.crown)line('M-3,-3L-4,-7 -6,-9M-4,-6L-1,-8M0,-3L1,-8 3,-10M2,-7L5,-8M3,-3L5,-5',GOLD,.8);
 g.restore();
}
function weapon(g,kind,x,y,hit,pose){
 const{path,line,oval}=pens(g);g.save();g.translate(x,y);
 if(kind==='spear'){
  g.rotate(pose.angle);line('M0,6V-27','#806846',1.25);line('M-.3,4V-25','#bea47a',.4);
  path('M-.9,-26L0,-32 1.2,-26 0,-24Z',STEEL);line('M0,-30V-25','#dbe0cd',.4);
 }else if(kind==='staff'){
  g.rotate(hit*.2);line('M0,15V-24','#4c5459',1.3);
  path('M-2,-23L-3,-27 -1,-25 0,-29 1,-25 3,-27 2,-23Z','#737f80');oval(0,-25,.8,1.1,'#d4dfd3',null);
 }else{
  g.rotate(pose.angle);
  line('M0,3V-3','#63523c',1.3);
  if(kind==='axe'){
   line('M0,2V-17','#97774c',1.35);path('M0,-16L5,-19Q9,-16 6,-10L0,-12Z',STEEL);
   line('M6,-17Q7,-14 5,-11','#e0e5d5',.65);
  }else if(kind==='hammer'){
   line('M0,2V-15','#866e4a',1.5);path('M-4,-17H5V-11H-4Z',STEEL_DARK);path('M-4,-17H4V-15H-4Z',STEEL,null);
   line('M-3,-16V-12M3,-16V-12',GOLD,.55);
  }else if(kind==='cleaver'){
   path('M-1,-3L-1,-18 3,-20 3,-15 1.3,-14 1.3,-3Z','#8c9998');
   line('M3,-19L3,-15 1.3,-14 1.3,-4','#d7d8c3',.65);
   line('M-2,-3H2','#6e786c',1);
  }else if(kind==='mace'){
   line('M0,2V-15','#77766b',1.7);path('M-3,-12L-5,-15 -3,-18 0,-20 3,-18 4,-15 2,-12Z','#87918b');
   line('M0,-18V-13M-3,-16L2,-15','#c6c8b4',.7);
  }else{
   path(kind==='curved'?'M-.7,-3Q-2,-15 3,-22Q1,-13 .7,-3Z':'M-.8,-3L-1,-18 0,-21 1,-18 .8,-3Z',STEEL);
   line(kind==='curved'?'M-.4,-5Q-.7,-13 2,-19':'M0,-5V-18','#e3e6d7',.5);
   line('M-2.7,-3Q0,-4 2.7,-3',GOLD,.9);
  }
 }
 oval(0,0,1.2,1.1,'#c5a180');g.restore();
}
function drawMount(g,c,walk,hit){
 const{path,line,oval}=pens(g);const ram=c.mount==='ram',boar=c.mount==='boar',warg=c.mount==='warg',stag=c.mount==='stag';
 const short=ram||boar,back=short?-23:warg?-25:-29,leg=short?12:17;
 // Four distinct jointed legs. Far legs are shaded and offset rather than stacked.
 for(const far of [true,false]){
  for(const side of [-1,1]){
   const x=side<0?-12:11,step=walk*side*(far?-1:1),z=far?2:0;
   g.save();g.translate(x+z,back+7);g.rotate(step*.22);
   path(`M-2,0Q1,-1 2,1L1.4,${leg*.53} ${2+step},${leg-1} ${4+step},${leg+1} ${-1+step},${leg+1} -1.8,${leg*.54}Z`,far?c.shade:c.body);
   path(`M${-1+step},${leg-1}L${2+step},${leg-1} ${4+step},${leg+1} ${-1+step},${leg+1}Z`,warg?'#70796e':'#444a45');g.restore();
  }
  if(far){
   path(c.hyena?'M-13,-22Q-22,-23 -23,-16L-19,-17 -12,-19Z':warg?'M-13,-25Q-23,-26 -27,-14L-23,-16Q-19,-21 -12,-21Z':`M-14,${back+1}Q-23,${back+1} -23,${back+18}L-19,${back+14} -19,${back+7} -12,${back+5}Z`,c.shade);
   path(c.hyena?'M-17,-18Q-20,-23 -11,-24L2,-29Q12,-34 17,-27L18,-19Q14,-11 -7,-12Q-16,-13 -17,-18Z':`M-17,${back+7}Q-20,${back-3} -9,${back-3}L10,${back-2}Q18,${back-2} 18,${back+6}Q14,${back+14} -7,${back+13}Q-16,${back+13} -17,${back+7}Z`,c.body);
   path(`M-15,${back+8}Q-3,${back+13} 14,${back+7}L11,${back+12} -6,${back+13} -14,${back+11}Z`,c.shade,null);
  }
 }
 if(c.hyena){
  path('M-8,-25L-5,-29 -3,-27 0,-32 2,-30 5,-35 8,-33 12,-37 17,-36 21,-31 17,-22 9,-23 5,-27Z','#423f37');
  path('M11,-29L15,-35 21,-35 27,-31 30,-27 35,-26 36,-21 31,-18 25,-19 21,-23 17,-20 13,-21Z',c.body);
  path('M16,-34Q12,-41 17,-40L21,-35M24,-33Q24,-39 28,-37L28,-30',c.shade);
  path('M25,-29L30,-27 35,-26 36,-21 31,-18 26,-20 22,-24Z',c.shade);
  path('M33,-26L36,-25 36,-22 33,-22Z',INK,null);
  line('M25,-22L34,-22',INK,1.1);path('M28,-22L29,-19.5 30,-22M32,-22L32.5,-20 33,-22Z','#dfd8bd',null);
  line('M21,-30L24,-29','#d4b370',1);
  for(const [x,y] of [[-13,-20],[-10,-16],[-5,-23],[4,-23],[11,-18]])oval(x,y,1.2,.7,c.shade,null);
 }else if(warg){
  path('M6,-25L11,-32 13,-31 16,-36 22,-35 26,-30 31,-27 34,-24 32,-21 27,-20 22,-23 18,-22 15,-17 12,-20 9,-17Z',c.body);
  path('M16,-34L15,-40 20,-36M23,-34L25,-39 27,-32',c.shade);
  path('M24,-29L31,-27 34,-24 32,-21 27,-22 22,-25Z',c.shade,null);
  path('M32,-26L35,-24 33,-22 31,-23Z',INK,null);
  line('M21,-30L24,-29','#8a663d',.8);line('M26,-23L32,-23',INK,.6);
  path('M28,-23L28.5,-21 29.5,-23Z','#e6e4ce',null);
  line('M10,-28L12,-25 12,-28M14,-31L15,-27M18,-33L20,-31','#b5b9aa',.55);
  line('M11,-22Q15,-25 17,-22M-14,-21Q-10,-24 -7,-22',c.shade,.8);
 }else if(short){
  path(`M10,${back+2}L15,${back-7}Q23,${back-10} 27,${back-2}L31,${back+4} 26,${back+7} 19,${back+5} 14,${back+9}Z`,c.body);
  if(ram){
   line(`M14,${back-3}Q13,${back-12} 22,${back-11}Q30,${back-10} 25,${back-3}Q21,${back+2} 19,${back-4}`,INK,4);
   line(`M14,${back-3}Q13,${back-12} 22,${back-11}Q30,${back-10} 25,${back-3}Q21,${back+2} 19,${back-4}`,'#ac9870',2.6);
   line(`M-12,${back}Q-9,${back-3} -6,${back}M-5,${back}Q-2,${back-3} 1,${back}M2,${back}Q5,${back-3} 8,${back}`,'#ddd3b2',.65);
  }else{
   path(`M17,${back-6}L16,${back-13} 22,${back-8}Z`,c.body);
   path(`M26,${back+1}L32,${back+2} 32,${back+6} 26,${back+6}Z`,c.shade);
   path(`M25,${back+6}Q31,${back+10} 31,${back}Q29,${back+6} 25,${back+4}Z`,'#ded6b7');
  }
  oval(24,back-1,.7,.7,INK,null);
 }else{
  path('M10,-28Q15,-32 16,-42L20,-44 24,-42 25,-38 31,-33 30,-29 25,-28 20,-31 17,-18 12,-18Z',c.body);
  path('M12,-28Q17,-34 17,-42L19,-43Q18,-31 16,-22L13,-20Z',c.shade,null);
  path('M18,-42L17,-48 21,-45 23,-48 24,-42Z',c.body);
  line('M19,-42L20,-34 25,-31',c.shade,1.1);
  oval(24,-36.5,.65,.65,INK,null);oval(29,-31,.55,.5,INK,null);
  if(stag){
   line('M19,-44L15,-51 13,-57M15,-51L19,-55M14,-54L10,-56M22,-44L26,-51 27,-58M25,-49L30,-53M26,-54L23,-57','#b6ab85',1.25);
  }else{
   path('M16,-43Q12,-38 12,-32L10,-27 14,-29 18,-40Z',c.mount==='horse'&&c.body==='#c5c1ae'?'#e0dcc5':'#514c40');
   line('M20,-40L25,-35 30,-33M25,-35L24,-29','#5e4e3c',.75);
  }
 }
 const saddle=short?-25:warg?-28:-32;
 path(`M-10,${saddle+2}L8,${saddle+1} 9,${saddle+14} -7,${saddle+15}Z`,c.hood?'#333942':c.cloak||'#70614b');
 line(`M-9,${saddle+3}L-6,${saddle+13} 8,${saddle+12}`,c.hood?'#56616b':GOLD,.7);
 path(`M-7,${saddle}Q0,${saddle+3} 6,${saddle-1}L8,${saddle+2} -8,${saddle+3}Z`,'#635544');
 if(c.barding){
  path(`M12,${back}L17,${back+3} 15,${back+10} 10,${back+8}Z`,STEEL_DARK);
  line(`M12,${back+2}L16,${back+5}M11,${back+5}L15,${back+8}`,STEEL,.7);
 }
 return saddle;
}
function drawRider(g,c,walk,hit,action,frame){
 if(c.azog){drawAzogWarg(g,walk,hit,pens,action,frame);return;}
 const{path,line,oval}=pens(g),seat=drawMount(g,c,walk,hit),shoulder=seat-(c.dwarf?12:16);
 g.save();g.translate(0,-Math.abs(walk)*.6);
 if(c.cloak||c.hood){
  path(`M-5,${shoulder}Q-9,${shoulder+2} -10,${seat}L${-14-walk},${seat+13} -7,${seat+10} -3,${seat+5} 2,${shoulder+2}Z`,c.cloak||c.coat);
  line(`M-6,${shoulder+5}L-8,${seat+7}`,c.hood?'#535d66':'#8a947c',.6);
 }
 const w=c.orc?6:c.dwarf?5:4;
 path(`M-${w},${shoulder}Q0,${shoulder-2} ${w},${shoulder}L${w+1},${seat-4} 3,${seat} -5,${seat}Z`,c.coat);
 if(c.uruk){
  path(`M-5,${shoulder+1}L5,${shoulder+1} 5,${seat-5} 0,${seat-2} -5,${seat-5}Z`,'#394345');
  line(`M-4,${shoulder+5}H4M-3,${shoulder+8}H4`,'#8e9993',.65);
  path(`M-6,${shoulder-1}L-9,${shoulder+1} -8,${shoulder+5} -3,${shoulder+4}Z`,'#56615e');
  path(`M3,${shoulder}L7,${shoulder-1} 9,${shoulder+4} 4,${shoulder+4}Z`,'#56615e');
 }else if(c.orc){
  line(`M-3,${shoulder+4}L3,${shoulder+6}M-2,${shoulder+7}L1,${shoulder+9}`,'#7e8377',.6);
  line(`M-4,${shoulder+1}L4,${seat-2}`,'#665c4d',2);
 }else if(!c.hood){
  path(`M-4,${shoulder+1}L0,${shoulder+3} 4,${shoulder+1} 3,${seat-5} 0,${seat-3} -3,${seat-5}Z`,c.dwarf?'#89958a':STEEL_DARK);
  line(`M0,${shoulder+4}V${seat-5}M-3,${shoulder+5}L0,${shoulder+6} 3,${shoulder+5}`,GOLD,.55);
  path(`M-5,${shoulder}Q-8,${shoulder} -7,${shoulder+4}L-3,${shoulder+4}Z`,STEEL);
 }
 line(`M-4,${seat-2}H4`,'#564939',1.3);
 path(`M1,${seat-1}L7,${seat+2} 5,${seat+11} 7,${seat+13} 2,${seat+13} 1,${seat+4} -3,${seat+2}Z`,c.hood?'#343c43':'#5b6055');
 line(`M2,${seat+6}L5,${seat+6}M2,${seat+9}H4`,c.hood?'#69747a':GOLD,.65);
 line(`M2,${seat+13}H7M6,${seat+11}V${seat+13}`,STEEL_DARK,.7);
 head(g,c,0,shoulder-4,c.dwarf);
 // Rein hand and bridle remain attached to the animal's head throughout gait.
 line(`M-4,${shoulder+4}L-1,${shoulder+9} 10,${shoulder+10}`,INK,3);
 line(`M-4,${shoulder+4}L-1,${shoulder+9} 10,${shoulder+10}`,c.coat,1.9);
 oval(10,shoulder+10,1.2,1.1,c.skin||'#c6a17d');
 line(`M10,${shoulder+10}Q16,${seat-2} 25,${c.mount==='horse'||c.mount==='stag'?-32:seat+3}`,'#65533d',.5);
 const pose=weaponMotion(c.weapon,action,frame/8,c.weapon==='spear'?-.25:.35),hx=8+pose.x,hy=shoulder+10+pose.y;
 line(`M4,${shoulder+3}L8,${shoulder+6} ${hx},${hy}`,INK,3.5);
 line(`M4,${shoulder+3}L8,${shoulder+6} ${hx},${hy}`,c.orc?c.skin:c.coat,2.2);
 weapon(g,c.weapon,hx,hy,hit,pose);
 if(c.shield)shield(g,c.shield,-5,shoulder+10);
 g.restore();
}
function drawFoot(g,c,walk,hit,action,frame){
 const{path,line,oval}=pens(g);g.save();g.translate(hit*.8,-Math.abs(walk)*.5);
 path(`M-5,-31Q-10,-28 -10,-20L${-12-walk},-2 -6,-4 0,-2 5,-4 5,-30Z`,c.cloak);
 line(`M-6,-27L${-8-walk*.5},-7M-2,-24L-3,-6`,'#96a28b',.5);
 for(const side of [-1,1]){
  g.save();g.translate(side*3,-16);g.rotate(side*walk*.25);
  path('M-2,0H2L1.5,12 4,15H-2L-2,9Z','#5e6256');
  path('M-2,10H1.7L1.5,12 4,15H-2Z','#444b44');line('M-1.5,11H1.5','#9f977b',.55);g.restore();
 }
 path(c.wizard?'M-5,-32Q0,-34 5,-32L6,-20 9,-1 3,0 0,-2 -5,0 -8,-2 -5,-20Z':'M-5,-32Q0,-34 5,-32L7,-25 5,-17 7,-12 1,-13 -4,-12 -7,-14 -5,-21 -7,-26Z',c.coat);
 if(c.wizard){line('M-3,-28L-5,-3M1,-28L0,-5M4,-23L5,-3','#9cae9f',.65);}
 else if(c.armored){
  path('M-5,-30L0,-28 5,-30 4,-22 0,-20 -4,-22Z',c.coat);
  line('M-4,-27L0,-25 4,-27M-4,-24L0,-22 4,-24',GOLD,.7);
  path('M-5,-32L-8,-29 -6,-26 -3,-28Z',STEEL_DARK);
 }else{line('M-4,-30L4,-18','#a38d68',1.3);line('M-4,-20H4','#898974',.8);}
 line('M-5,-17H5','#554939',1.4);path('M-1,-18H1V-16H-1Z',GOLD,null);
 if(c.quiver){
  path('M-7,-22L-10,-33 -6,-35 -3,-24Z','#7b6346');
  for(let i=0;i<3;i++){line(`M${-8+i},-30L${-11+i},-39`,'#b6a171',.55);line(`M${-11+i},-39l-1,1.7`,'#d9d4b7',.8);}
 }
 head(g,c,0,-36);
 const pose=weaponMotion(c.weapon,action,frame/8,.35),hx=8+pose.x,hy=-23+pose.y;
 line(`M5,-29L8,-25 ${hx},${hy}`,INK,3.8);line(`M5,-29L8,-25 ${hx},${hy}`,c.coat,2.6);
 if(c.weapon==='bow'){
  line(`M${hx},${hy-11}Q${hx+10},${hy} ${hx},${hy+11}`,'#443f31',1.8);
  line(`M${hx},${hy-11}Q${hx+10},${hy} ${hx},${hy+11}`,'#b19b68',1);
  line(`M${hx},${hy-11}L${hx-2-hit*6},${hy} ${hx},${hy+11}`,'#d9d2b6',.4);
  line(`M-5,-29L-3,-23 ${hx-2-hit*6},${hy}`,INK,3.5);line(`M-5,-29L-3,-23 ${hx-2-hit*6},${hy}`,c.coat,2.3);
  oval(hx-2-hit*6,hy,1.2,1.1,'#c6a17d');oval(hx,hy,1.2,1.1,'#c6a17d');
  if(hit<.97){line(`M${hx-3-hit*6},${hy}H${hx+17}`,'#c1b18b',.65);path(`M${hx+17},${hy-1}l3,1 -3,1Z`,STEEL,null);}
 }else{
  weapon(g,c.weapon,hx,hy,hit,pose);line('M-5,-28L-7,-21 -4,-18',INK,3.6);line('M-5,-28L-7,-21 -4,-18',c.coat,2.5);oval(-4,-18,1.2,1.2,'#c6a17d');
 }
 if(c.shield)shield(g,c.shield,-7,-23);
 if(c.horn){path('M-4,-13Q0,-7 4,-12Q3,-5 -2,-8L-5,-11Z','#d1c8a6');line('M-4,-12L-2,-10',GOLD,1);}
 g.restore();
}
function creature(g,type,walk,hit,phase){
 const{path,line,oval}=pens(g,.65);
 if(type==='me_ent'){
  for(const side of [-1,1]){g.save();g.translate(side*5,-18);g.rotate(side*walk*.15);path('M-3,0L-3,9 -7,17 -2,16 0,18 2,14 5,15 3,5 3,0Z','#82734f');line('M0,3L0,11 -2,14','#a7996c',.8);g.restore();}
  path('M-7,-18L-10,-35 -6,-45 -5,-51 0,-54 6,-49 7,-39 10,-25 5,-15 0,-13Z','#8c7e55');
  path('M0,-49L3,-46 2,-37 6,-27 4,-18 0,-16 -2,-30Z','#706947',null);
  for(const side of [-1,1]){
   g.save();g.translate(side*8,-38);g.rotate(side<0?walk*.1:-hit*.9);if(side<0)g.scale(-1,1);
   path('M-2,0L5,2 9,10 10,18 8,20 6,17 5,23 3,20 4,15 2,8 -3,5Z','#81744e');
   line('M2,3L5,9 6,14','#b2a071',.65);g.restore();
  }
  line('M-4,-47L-9,-53 -10,-59M-8,-52L-15,-54M1,-51L1,-60 6,-63M1,-57L-3,-61M6,-47L12,-52 14,-59M11,-52L17,-53','#81744e',1.6);
  path('M-6,-47L-3,-48 -2,-46 -5,-45ZM1,-47L4,-48 5,-46 2,-45Z','#d2bb78');
  line('M0,-46L-1,-42 2,-42M-2,-39Q1,-37 4,-40','#464d37',.8);
  path('M-4,-39L-1,-37 3,-39 2,-33 -1,-29 -3,-33Z','#766a46');
  line('M-5,-31L-4,-23M1,-35L0,-27 2,-22','#c0aa74',.7);
  for(const[x,y]of[[-10,-55],[5,-59],[13,-54],[-8,-33]]){path(`M${x},${y}q-5,-4 -5,0q3,3 5,0q4,-5 5,-1q-2,3 -5,1Z`,'#60764c',null);}
 }else if(type==='me_shelob'){
  // Eight separate, jointed legs: back four, abdomen, front four.
  for(const front of [false,true]){
   for(let i=0;i<4;i++){
    const base=-9+i*6,swing=walk*(i%2?1:-1)*1.8,side=front?1:-1;
    const knee=base+(i<2?-11:11),foot=knee+(i<2?-5:5)+swing;
    path(`M${base},-18L${knee},${-32+side*5} ${foot},-1 ${foot-1},0 ${knee-1},${-26+side*5} ${base-1},-16Z`,front?'#5d5d64':'#42494e');
    line(`M${base},-18L${knee},${-32+side*5}`,'#8a8884',.65);
   }
   if(!front){
    path('M-16,-13Q-26,-16 -23,-29Q-22,-40 -10,-40Q2,-38 4,-27L7,-23 1,-14Z','#66636a');
    path('M-19,-29Q-16,-36 -9,-34L-5,-29 -10,-25 -17,-25Z','#7f7677',null);
    path('M-4,-25Q9,-30 19,-22L23,-14 19,-9 8,-10 0,-15Z','#50555c');
   }
  }
  path(`M17,-14Q${27+hit*3},-13 25,-4L22,-8 17,-10Z`,'#c1b9a0');
  path(`M10,-12Q${20+hit*3},-10 17,-3L14,-7 9,-9Z`,'#a39f8d');
  for(const[x,y,r]of[[17,-19,1],[13,-21,.85],[9,-22,.6],[20,-17,.6]])oval(x,y,r,r,'#bd9e65',INK,.4);
 }else{
  for(const far of [true,false]){
   for(const side of [-1,1]){const x=side<0?-14:10,step=walk*side*(far?-1:1);g.save();g.translate(x+(far?3:0),-20);g.rotate(step*.1);
    path('M-3.5,-2Q0,-3 3.5,-1L3,6Q1.8,10 2.7,14L4,18Q4.5,20 1,20L-3.5,19.5Q-4.8,19 -4,17L-3,10Q-4,5 -3.5,-2Z',far?'#687970':'#8d9b8f');
    line('M-2,9Q0,10 2,9M-2.3,11Q0,12 2.1,11',far?'#53665d':'#6a7e71',.35);
    if(!far){for(const toe of [-2,0,2])oval(toe,18.7,.65,.7,'#c7c7af',null);}
    g.restore();}
   if(far){
    path('M-20,-21Q-23,-42 -11,-44L7,-42Q18,-39 18,-24L12,-17 -11,-16Z','#929c91');
    path('M-18,-24Q-4,-18 13,-23L10,-17 -11,-16 -18,-19Z','#73817b',null);
    line('M-18,-35Q-15,-40 -10,-39M-18,-32Q-15,-35 -12,-34M-16,-29L-14,-30M-5,-38Q3,-40 8,-35','#acb3a3',.55);
    line('M-11,-24Q-7,-22 -3,-23M-5,-27Q-1,-25 3,-27M6,-31Q11,-30 12,-26','#687970',.45);
   }
  }
  line('M-19,-35Q-26,-30 -25,-20','#68766e',1.5);
  path(`M10,-39Q20,-45 26,-35L28,-23Q${28+hit*4},-12 32,-12L35,-16 36,-12Q32,-5 27,-11L21,-25 16,-22 9,-27Z`,'#949e93');
  path('M10,-38Q4,-39 7,-27L14,-23 19,-30 18,-38Z','#788b82');line('M10,-35L10,-29 14,-27','#abb3a2',.65);
  line('M13,-36L12,-30 15,-28M23,-35L25,-34M25,-28L27,-28M26,-25L28,-25M27,-22L29,-22M28,-19L30,-19','#5f736b',.42);
  oval(25,-32,.8,.75,'#303b37',null);
  path(`M24,-27Q${34+hit*2},-15 38,-25Q35,-12 25,-20Z`,'#d7d0b4');
  path('M21,-25Q29,-13 33,-19Q29,-8 21,-19Z','#bfbda6');
  // Wood construction and passengers stay readable at the creature's world scale.
  path('M-15,-44L-17,-53 9,-53 8,-42Z','#8c7151');
  path('M-15,-48H8V-44H-14Z','#b1996c');
  for(const x of [-14,-7,0,7])line(`M${x},-53V-44`,'#4f4c3c',.8);
  line('M-17,-54H10M-17,-50H10','#c4ae80',1);
  line('M-14,-53L-7,-45M-7,-53L0,-45M0,-53L7,-45','#c4ae80',.65);
  line('M-16,-46H8M-12,-48L-10,-47M1,-48L4,-47','#594e3b',.4);
  path('M-11,-43H5V-26L-2,-29 -9,-26Z','#856052');
  line('M-9,-42V-29L-2,-32 3,-29V-42',GOLD,.7);
  line('M-13,-40L-14,-21M7,-40L10,-23','#675b44',1);
  for(const x of [-10,3]){
   path(`M${x-2},-54L${x-2.3},-57.5Q${x},-59 ${x+2},-57.5L${x+2},-54Z`,'#6d6550');
   oval(x,-60,1.5,1.7,'#a58a69');
   path(`M${x-1.6},-60Q${x-2},-63 ${x+1.5},-62L${x+1.8},-60Z`,'#76644a');
   line(`M${x-1},-57L${x+1},-55M${x+1},-57L${x+3},-56`,'#c0a17a',.7);
   line(`M${x+3},-55V-63`,'#8e7e58',.65);
   path(`M${x+2.4},-63L${x+3},-65 ${x+3.6},-63Z`,'#a9b4ad',null);
  }
 }
}
export function stylizedExpansionSprite(type,team,frame,action,{density=3,scale=1}={}){
 const c=mounted[type]||foot[type];if(!c&&!['me_ent','me_shelob','me_mumakil'].includes(type))return null;
 const canvas=document.createElement('canvas');canvas.width=80*density;canvas.height=76*density;
 const g=canvas.getContext('2d',{willReadFrequently:true});g.setTransform(density*scale,0,0,density*scale,30*density,61*density);g.lineCap='round';g.lineJoin='round';
 const phase=frame/8*Math.PI*2,walk=action==='walk'?Math.sin(phase):0,hit=action==='attack'?Math.sin(frame/7*Math.PI):0;
 // The two tallest sources fit within the unchanged 80x76 logical canvas.
 if(type==='me_mumakil')g.scale(.85,.85);
 if(type==='me_ent')g.scale(.9,.9);
 if(mounted[type])g.scale(.82,.82);
 if(type==='me_dain')g.scale(.94,1);
 g.translate(0,Math.sin(phase)*.12);
 if(mounted[type])drawRider(g,c,walk,hit,action,frame);
 else if(foot[type])drawFoot(g,c,walk,hit,action,frame);
 else creature(g,type,walk,hit,phase);
 g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-atop';
 g.fillStyle=team?'#d96d5510':'#62aaca10';g.fillRect(0,0,canvas.width,canvas.height);
 return canvas;
}
