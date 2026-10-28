// Isolated, hand-drawn study sprites. Same 80x76 anchor as production artwork.
import { SamuraiStudyLibrary } from './crown-battle-samurai-study.js';
const TAU=Math.PI*2;
function poly(g,fill,pts,stroke='#202329',w=.4){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=w;g.stroke();}}
function line(g,color,w,pts){g.beginPath();g.lineCap='round';g.lineJoin='round';pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=color;g.lineWidth=w;g.stroke();}
function oval(g,fill,x,y,rx,ry,a=0){g.beginPath();g.ellipse(x,y,rx,ry,a,0,TAU);g.fillStyle=fill;g.fill();}
function grad(g,x,y,w,h,colors){const v=g.createLinearGradient(x,y,x+w,y+h);colors.forEach((c,i)=>v.addColorStop(i/(colors.length-1),c));return v;}
function surface(){const c=document.createElement('canvas');c.width=320;c.height=304;const g=c.getContext('2d',{willReadFrequently:true});g.setTransform(4,0,0,4,120,244);return[c,g];}

export function hussarStudySprite(team,frame=0,action='idle'){
  const[c,g]=surface(),walk=action==='walk',attack=action==='attack',phase=frame/8*TAU;
  const gait=walk?Math.sin(phase):0,bob=walk?Math.cos(phase*2)*.6:0;
  const cloth=team?['#e3ae8e','#9c393e','#471f2d']:['#a5bfc2','#365c76','#1d3045'];
  const steel=grad(g,-8,-48,14,20,['#eff1db','#a2acac','#536671','#25323d']);
  const gold=grad(g,-9,-45,13,22,['#f4de99','#b99653','#635036']);
  const coat=grad(g,-12,-31,23,22,['#b29169','#795438','#49352e','#2b2b2d']);
  oval(g,'#13221c20',3,1,24,3);
  // Separate femur, hock and hoof for each leg; far legs have a darker silhouette.
  function leg(front,near){
    const x=front?11:-11,cycle=phase+(front?Math.PI:0)+(near?0:Math.PI);
    const stride=walk?Math.sin(cycle)*5:near?1:-2,lift=walk?Math.max(0,Math.cos(cycle))*3:0;
    const knee=[x+stride*.55+(front?-1:2),-8-lift*.3],hoof=[x+stride,-.6-lift];
    line(g,near?'#73523c':'#37302c',3.2,[[x,-19],knee]);
    line(g,near?'#ac8960':'#4b3c30',1.8,[knee,hoof]);
    line(g,near?'#d3b18a':'#71604a',.5,[[knee[0]-.5,knee[1]],[hoof[0]-.5,hoof[1]-1]]);
    poly(g,near?'#302d2c':'#22272a',[[hoof[0]-1.2,hoof[1]-1.1],[hoof[0]+1,hoof[1]-1],[hoof[0]+2.1,hoof[1]+.5],[hoof[0]-1.1,hoof[1]+.5]]);
  }
  leg(false,false);leg(true,false);
  g.save();g.translate(0,bob);
  // Tail, muscular barrel, arched neck and cheek. Direction is mirrored by renderer.
  line(g,'#2a2527',3.3,[[-16,-25],[-21,-22],[-23+gait,-15],[-22+gait,-9]]);
  line(g,'#907553',.7,[[-18,-24],[-21,-18],[-22+gait,-12]]);
  oval(g,coat,-1,-22,17,8,-.04);
  oval(g,grad(g,-15,-27,8,10,['#b4946b','#70503a','#49342e']),-11,-22,6.4,7);
  poly(g,coat,[[8,-24],[10,-32],[16,-40],[20,-40],[22,-35],[23,-28],[17,-19],[10,-17]]);
  oval(g,coat,19,-35,4,5,.15);
  poly(g,coat,[[20,-39],[24,-37],[27,-30],[25,-28],[22,-29],[18,-34]]);
  oval(g,'#514039',25,-30,2.4,1.6,.6);
  poly(g,'#77563c',[[16,-39],[16,-44],[18,-42],[19,-39]]);
  poly(g,'#b08b5f',[[20,-39],[21,-44],[23,-42],[23,-38]]);
  line(g,'#30282a',2,[[15,-39],[12,-35],[11,-30],[9,-27]]);
  for(let i=0;i<6;i++)line(g,'#88745b',.45,[[15-i*.7,-38+i*1.5],[12-i*.5,-36+i*1.5]]);
  oval(g,'#171d22',22,-36.2,.7,.55);oval(g,'#ede2bb',22.2,-36.4,.22,.2);
  // Snaffle and reins visibly connect horse and rider's left hand.
  line(g,'#302b28',.85,[[18,-40],[22,-35],[25,-30]]);
  line(g,'#d3be8d',.5,[[23,-32],[26,-32]]);
  oval(g,gold,24,-31,.65,.75);
  // Saddle cloth with a patterned, gold bound edge.
  poly(g,grad(g,-12,-26,18,13,cloth),[[-13,-27],[6,-27],[9,-17],[3,-15],[-12,-17]]);
  line(g,gold,.8,[[-12,-26],[-11,-18],[3,-16],[8,-18]]);
  for(let x=-9;x<6;x+=3)poly(g,cloth[0],[[x,-21],[x+1,-22],[x+2,-20],[x+1,-19]],null);
  oval(g,'#352c2a',-3,-28,9,2.5);
  line(g,'#a98b55',1.1,[[-11,-29],[-9,-26],[3,-27],[6,-30]]);
  g.restore();
  leg(false,true);leg(true,true);
  g.save();g.translate(attack?[0,-.6,-1,-.5,1.2,1.5,.6,0][frame]:0,bob);
  // Two curved wooden wing frames, layered individual feathers rather than fans.
  function wing(dx,far){
    g.save();g.translate(dx,0);g.rotate((walk?gait*.018:0)+(far?.04:0));
    const feathers=far?['#b3ab91','#827f75']:['#f0e5bf','#b8b8a4'];
    for(let i=0;i<12;i++){
      const y=-31-i*1.85,x=-8-(i/11)**2*4;
      const tipX=x-6.5-i*.22,tipY=y-3.2-i*.14;
      poly(g,grad(g,tipX,tipY,7,4,feathers),[[x,y+.9],[tipX+1,tipY+1.8],[tipX,tipY],[tipX+2,tipY-.2],[x+.2,y-.6]],'#545c54',.22);
      line(g,far?'#888979':'#c4bc9d',.23,[[tipX+1,tipY+.6],[x-.4,y]]);
    }
    line(g,'#624630',1.4,[[-8,-30],[-8.4,-39],[-10,-47],[-12,-52]]);
    line(g,gold,.45,[[-7.5,-30],[-8,-39],[-9.5,-47],[-11.5,-52]]);g.restore();
  }
  wing(-1.5,true);wing(0,false);
  // Leopard pelt and the near rider leg overlap the saddle.
  poly(g,grad(g,-10,-42,8,15,['#e1c18b','#aa7d46','#5a4532']),[[-7,-43],[-1,-40],[-4,-28],[-10,-26],[-10,-35]]);
  for(let i=0;i<13;i++){const x=-8+(i%3)*1.5,y=-40+Math.floor(i/3)*2.7;oval(g,'#4c3b2c',x,y,.7,.9,.4);oval(g,'#c4a06a',x+.1,y,.25,.4);}
  line(g,'#303745',4,[[0,-29],[5,-24],[3,-17]]);
  line(g,steel,2.5,[[5,-24],[3,-18]]);
  poly(g,'#30323a',[[2,-20],[4,-20],[4,-17],[7,-16],[7,-15],[1,-15]]);
  line(g,gold,.6,[[0,-18],[1,-14.5],[5,-14.5],[6,-18]]);
  // Cuirass planes and overlapping faulds catch a consistent upper-left light.
  poly(g,steel,[[-5,-42],[1,-43],[6,-39],[5,-30],[1,-27],[-5,-30],[-7,-36]]);
  poly(g,'#273b4b60',[[1,-42],[6,-39],[5,-30],[1,-28]],null);
  line(g,'#eae4ca',.7,[[-4,-41],[-5,-36],[-3,-31],[1,-29]]);
  line(g,'#839797',.65,[[0,-41],[1,-36],[1,-29]]);
  for(let y=-32;y<-27;y+=1.4)line(g,'#b6bcb1',.6,[[-4,y],[1,y+1],[5,y]]);
  line(g,'#bd9654',.9,[[-5,-31],[1,-30],[5,-32]]);
  // Lobster-tail helmet, nasal bar and face, not a generic knight visor.
  poly(g,steel,[[-4,-46],[3,-46],[4,-42],[0,-41],[-5,-43]]);
  for(let y=-45;y<-42;y+=1)line(g,'#b1b8ae',.5,[[-4,y],[0,y+1],[3,y]]);
  oval(g,'#b68e6e',1,-46,2.7,3);
  oval(g,steel,-.4,-49,4,3.1);
  poly(g,steel,[[-4,-49],[-2,-52],[1,-52.5],[3,-50],[3,-47],[5,-46.7],[-4,-46.5]]);
  line(g,'#eee4c6',.6,[[-3,-49],[-1.6,-51],[0,-51.5]]);
  line(g,gold,.6,[[0,-52],[1,-48],[2.9,-46.8],[3,-43.7]]);
  line(g,'#222f37',.55,[[1.2,-45.9],[2.4,-45.8]]);
  // Bridle hand and spear arm have their own joint positions.
  line(g,steel,2.7,[[-4,-40],[-3,-35],[10,-35]]);
  line(g,'#3d2c2b',.65,[[10,-35],[18,-32],[24,-31]]);
  oval(g,'#c6a47e',10,-35,1.2,.9);
  const hand=attack?[[7,-36],[4,-37],[3,-38],[7,-36],[11,-34],[12,-33],[9,-35],[7,-36]][frame]:[7,-36];
  line(g,steel,3,[[4,-40],[7,-37],hand]);oval(g,steel,4,-40,3.3,2.3,.4);
  oval(g,'#c4a47e',...hand,1.1,1);
  g.save();g.translate(...hand);g.rotate(attack?[-.25,-.45,-.52,-.22,0,.06,-.08,-.2][frame]:-.25);
  line(g,'#594330',1,[[-11,0],[32,0]]);line(g,'#d0ae73',.35,[[-11,-.3],[32,-.3]]);
  for(let x=-8;x<29;x+=3)line(g,cloth[1],.55,[[x,-.5],[x+1,.5]]);
  poly(g,steel,[[30,-.8],[35,0],[30,.8]],'#36434b',.25);
  const flutter=walk?gait:Math.sin(phase)*.3;
  poly(g,cloth[0],[[29,1],[18,1+flutter],[21,3+flutter],[17,4.5+flutter],[29,4]],null);
  poly(g,cloth[1],[[29,2.7],[20,3+flutter],[17,4.5+flutter],[29,4]],null);
  g.restore();g.restore();return c;
}

export function sauronStudySprite(team,frame=0,action='idle'){
  const[c,g]=surface(),walk=action==='walk',attack=action==='attack',phase=frame/8*TAU;
  const gait=walk?Math.sin(phase):0,lift=walk?Math.abs(Math.cos(phase))*.45:0;
  const lean=attack?[0,-.7,-1.4,-.8,2.5,3.2,1.6,.4][frame]:gait*.2;
  const steel=grad(g,-11,-48,22,35,['#839496','#455765','#232e3c','#111822']);
  const edge='#a9afa3',dark='#111921';
  const cloth=team?['#542f30','#291b24','#10151c']:['#334956','#1d2935','#10151c'];
  oval(g,'#10201928',6,1.3,18,3);
  // Heavy split cloak: broad planes with hems that lag behind the step.
  poly(g,grad(g,-13,-42,20,42,cloth),[[-8,-43],[6,-41],[9,-30],[13+gait*.6,-4],[9,-2],[5,-5],[1,-2],[-3,-5],[-9,-1],[-14,-3],[-13,-19]]);
  for(let i=0;i<5;i++)line(g,'#73808825',.75,[[-8+i*3,-36],[-10+i*4+gait*.35,-5]]);
  function leg(near){const side=near?1:-1,x=side*3.8,stride=side*gait*3.1,stepLift=walk?Math.max(0,side*Math.cos(phase))*1.5:0,knee=[x+stride*.45,-10-stepLift*.4],foot=[x+stride,-stepLift];
    line(g,dark,4.8,[[x,-22],knee,foot]);
    poly(g,steel,[[x-2,-23],[x+2.4,-23],[knee[0]+2,-12],[knee[0],-10],[knee[0]-2.4,-12]]);
    poly(g,steel,[[knee[0]-2.3,-10],[knee[0],-12],[knee[0]+2.3,-10],[foot[0]+1.3,foot[1]-2],[foot[0]-.3,foot[1]-1],[foot[0]-1.6,foot[1]-3]]);
    line(g,near?edge:'#65717a',.55,[[knee[0],-9],[foot[0]-.3,foot[1]-2]]);
    poly(g,steel,[[foot[0]-1.5,foot[1]-2],[foot[0]+1.5,foot[1]-2],[foot[0]+4.2,foot[1]],[foot[0]+3.5,foot[1]+.9],[foot[0]-1.5,foot[1]+.4]]);
    line(g,'#87948f',.4,[[foot[0]-.5,foot[1]-1],[foot[0]+2,foot[1]]]);}
  leg(false);leg(true);g.translate(lean,-lift);
  // Long fingers on the far gauntlet and the faceted arm plates.
  line(g,steel,4.3,[[-8,-39],[-12,-31],[-10,-24]]);
  for(let i=0;i<3;i++)line(g,'#7c888b',.65,[[-11+i*.8,-25],[-10.5+i*.9,-22]]);
  // Gothic breastplate: an angular sternum, ribbed sides and layered tassets.
  poly(g,steel,[[-8,-42],[2,-43],[9,-39],[7,-27],[2,-23],[-7,-27],[-10,-35]]);
  poly(g,'#141e2c88',[[1,-42],[8,-39],[6,-28],[2,-24]],null);
  poly(g,grad(g,-5,-40,8,15,['#b1b9af','#65737c','#283847']),[[-5,-40],[0,-42],[4,-38],[2,-27],[-1,-25],[-4,-30]],'#344551',.3);
  line(g,'#c1c2b2',.6,[[-5,-40],[-1,-37],[-1,-27]]);
  // Etched chevrons follow the plate planes; alternating light and dark cuts
  // read as engraved steel rather than flat decorative stripes.
  for(let i=0;i<4;i++){
    const y=-37+i*2.5;
    line(g,'#14232f',.65,[[-4,y-1],[-2,y+.2],[-1.4,y+1.5]]);
    line(g,'#84989c',.3,[[-4,y-1.3],[-1.8,y],[-1.1,y+1.2]]);
    line(g,'#657985',.35,[[1.1,y+1],[2.6,y-.2],[3,y-1.6]]);
  }
  for(let y=-37;y<-29;y+=2){line(g,'#8a9598',.55,[[-8,y-1],[-5,y+1],[-2,y+2]]);line(g,'#46535f',.6,[[3,y+1],[6,y],[7,y-2]]);}
  line(g,'#0d1822',1,[[-7,-27],[0,-25],[6,-28]]);
  for(const [x,y] of [[-7,-27],[-2,-26],[3,-27]]){
    poly(g,steel,[[x,y],[x+4,y+.6],[x+5,-16],[x+1,-13],[x-1,-18]]);
    for(let j=0;j<3;j++)line(g,'#78868a',.45,[[x+.3,y+3+j*2],[x+3.5,y+3.5+j*2]]);
  }
  // Bladed pauldrons have volume and individual spike highlights.
  function shoulder(x,near){
    poly(g,steel,[[x-5,-40],[x-3,-45],[x+3,-44],[x+5,-40],[x+3,-35],[x-2,-37]]);
    for(const [dx,dy] of [[-3,-47],[0,-49],[3,-46]])poly(g,steel,[[x+dx-1.3,-42],[x+dx,dy],[x+dx+1.2,-41]],'#303e4a',.3);
    line(g,near?edge:'#72818b',.6,[[x-4,-40],[x,-42],[x+4,-40]]);
    line(g,'#78898f',.5,[[x-2,-37],[x+2,-36],[x+4,-39]]);
    for(let i=0;i<3;i++)line(g,'#263745',.6,[[x-2+i,-40],[x+i,-39],[x+i-.8,-37.5]]);
    line(g,'#738994',.35,[[x-3,-39],[x,-37.3],[x+2,-38.8]]);
  }
  shoulder(-8,false);
  // Tall, recognizable crown and narrow mask. Eye slots remain restrained embers.
  poly(g,steel,[[-4,-47],[-4.5,-54],[0,-56],[4,-53],[4.5,-46],[1,-42],[-2,-44]]);
  poly(g,'#18222e',[[-4,-51],[-1,-50],[-.5,-46],[-3,-47]],null);
  poly(g,'#101a26',[[1,-50],[4,-51],[3.5,-47],[1,-46]],null);
  for(const [x,top] of [[-4,-58],[-1,-60],[2,-59],[4,-56.5]]){
    poly(g,steel,[[x-1,-52],[x-.3,top],[x+1.2,-53]],'#344451',.25);
    line(g,'#c0c1ae',.38,[[x-.7,-53],[x-.3,top+.8]]);
  }
  poly(g,'#9eaaa3',[[-.7,-53],[.4,-54],[1.3,-47],[.3,-45]],null);
  line(g,'#edb374',.55,[[-3.3,-49.4],[-1.6,-48.9]]);line(g,'#f7bf78',.55,[[1.9,-49],[3.3,-49.6]]);
  line(g,'#687d89',.5,[[-3,-47],[-1,-44],[.2,-43]]);
  line(g,'#7b8c91',.5,[[3.2,-47],[1.4,-44]]);
  // Slow wind-up, sweeping contact and settling weight; mace is held by a hand.
  const hand=attack?[[10,-29],[8,-34],[5,-40],[10,-36],[18,-25],[19,-21],[14,-25],[10,-29]][frame]:[10+gait*.4,-29];
  const elbow=[9+(hand[0]-9)*.35,-33+(hand[1]+33)*.5];
  line(g,dark,4.8,[[7,-39],elbow,hand]);
  line(g,steel,3.5,[[7,-39],elbow]);line(g,steel,3.5,[elbow,hand]);
  line(g,edge,.55,[[elbow[0]-.7,elbow[1]],[hand[0]-.7,hand[1]]]);
  shoulder(7,true);
  g.save();g.translate(...hand);g.rotate(attack?[-1,-1.7,-2,-1.15,.15,.5,-.3,-.9][frame]:-1.05);
  line(g,'#171e28',2.1,[[-5,0],[14,0]]);line(g,'#879392',.6,[[-4,-.6],[14,-.6]]);
  for(let x=-3;x<3;x++)line(g,'#485562',.6,[[x,-.9],[x+.3,.9]]);
  // Flanged steel head: pointed fins extend along the shaft, without glow blobs.
  poly(g,steel,[[12,-2],[14,-4],[19,-3],[22,0],[19,3],[14,4],[12,2]]);
  for(const side of [-1,1])poly(g,steel,[[13,side*2],[12,side*6],[16,side*4.5],[20,side*5.5],[19,side*2]],'#263645',.35);
  line(g,'#c1c4b6',.6,[[13,-2],[18,-1],[22,0]]);line(g,'#839394',.45,[[14,2],[19,2]]);
  oval(g,steel,0,0,1.8,1.6);
  for(let x=-1;x<2;x++)line(g,'#a7afa7',.4,[[x,-1.2],[x,1]]);
  oval(g,'#edc980',1,-.8,.5,.4);g.restore();return c;
}

export class EliteStudyLibrary extends SamuraiStudyLibrary {
  get(type,team,frame,action,variant=0){
    const make=type==='hussar'?hussarStudySprite:type==='me_sauron'?sauronStudySprite:null;
    if(!make)return super.get(type,team,frame,action,variant);
    // Variant-independent artwork shares one pose across all soldiers.
    const key=`${type}/${team}/${frame}/${action}`;
    if(!this.studyCache.has(key))this.studyCache.set(key,make(team,frame,action));
    return this.studyCache.get(key);
  }
}
