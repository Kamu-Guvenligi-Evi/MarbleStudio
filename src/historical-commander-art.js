import { COMMANDER_TYPES } from './historical-commander-types.js';
import { drawHistoricalWarrior } from './historical-warrior-art.js';

// Portrait-informed identifiers, with period-inspired battlefield equipment.
// These are game interpretations, not authenticated outfits or likenesses.
export const COMMANDER_ART_PROFILES = {
  jan_iii_sobieski: { armor:'plate',weapon:'sabre',cloth:'#91463b',trim:'#ceb16b',horse:'bay',cape:'#a8493a',head:'sobieskiCap',hair:'#4b3529',skin:'#c39c78',furCollar:true },
  ramesses_ii: { armor:'linen',weapon:'ergKhopesh',cloth:'#e1d4ab',trim:'#b79b50',horse:'dun',cape:'#936044',head:'khepresh',hair:'#342e28',skin:'#b88b5f',noStirrups:true },
  alexander_nevsky: { armor:'mail',weapon:'longsword',shield:'kite',shieldColor:'#8d4137',emblem:'stripe',cloth:'#725947',trim:'#bba572',horse:'bay',cape:'#8b3737',head:'rusRoyalCone',hair:'#725139',skin:'#c49d7a',legWraps:true },
  harald_hardrada: { armor:'mail',weapon:'norseSword',shield:'round',shieldColor:'#7c3032',emblem:'quarters',cloth:'#3c5665',trim:'#ba9d60',horse:'black',cape:'#84383b',head:'norseRoyalNasal',hair:'#aa8054',skin:'#c6a181',legWraps:true },
  mehmed_ii: { armor:'robe',weapon:'sabre',cloth:'#882e35',trim:'#cbb57d',horse:'grey',longcoat:true,patterned:true,head:'ottomanTurban',hair:'#503b2e',skin:'#bb8f69',furCollar:true },
  timur: { armor:'lamellar',weapon:'sabre',cloth:'#3d7772',trim:'#d5b66d',horse:'black',longcoat:true,barding:'leather',cape:'#a44d3c',head:'timurid',hair:'#43352d',skin:'#b98761' },
  attila: { armor:'scale',weapon:'longsword',cloth:'#67553c',trim:'#b4a078',horse:'dun',cape:'#65503c',head:'hunCap',hair:'#302b24',skin:'#b18b6a',furCollar:true },
  genghis_khan: { armor:'lamellar',weapon:'sabre',cloth:'#c6b998',trim:'#735536',horse:'bay',longcoat:true,head:'yuanCap',hair:'#a4a08c',skin:'#c19b7a' },
  alexander_great: { armor:'linen',weapon:'longsword',cloth:'#e2dac0',trim:'#9c7452',horse:'black',cape:'#9a4334',head:'anastole',hair:'#685039',skin:'#c7a17a' },
  julius_caesar: { armor:'muscle',weapon:'gladius',cloth:'#a03939',trim:'#c8a563',horse:'grey',cape:'#793b58',head:'laurel',hair:'#6a6555',skin:'#c39e7f' },
  alp_arslan: { armor:'lamellar',weapon:'sabre',shield:'kite',cloth:'#a44935',trim:'#d9ba70',horse:'bay',head:'seljukCone',hair:'#3f3027',skin:'#b68a63',braid:true },
  saladin: { armor:'mail',weapon:'sabre',shield:'round',cloth:'#436d56',trim:'#c4ad73',horse:'grey',cape:'#4c7254',longcoat:true,head:'ayyubidTurban',hair:'#3b3027',skin:'#b38c64' },
  hannibal_barca: { armor:'muscle',weapon:'longsword',shield:'aspis',cloth:'#78608a',trim:'#c4a270',horse:'dun',cape:'#665378',head:'punicHelmet',hair:'#40342a',skin:'#b58d65' },
  georg_frundsberg: { armor:'plate',weapon:'longsword',cloth:'#b88b39',trim:'#c9bb8a',horse:'black',cape:'#4f5551',head:'featherBeret',hair:'#72503b',skin:'#c9a17e' },
  harold_godwinson: { armor:'mail',weapon:'longsword',shield:'kite',cloth:'#446b80',trim:'#c6b183',horse:'dun',cape:'#53744c',head:'saxonNasal',hair:'#b1814d',skin:'#c8a17d' },
  charles_vii: { armor:'plate',weapon:'longsword',cloth:'#32557e',trim:'#d6b25b',horse:'grey',cape:'#294575',head:'royalCap',hair:'#70503b',skin:'#c6a07e' },
  francesco_sforza: { armor:'plate',weapon:'longsword',cloth:'#8b3731',trim:'#cec5a0',horse:'bay',cape:'#d2c8ac',head:'ducalCap',hair:'#533e2c',skin:'#bd9672' },
  leonidas: { armor:'muscle',weapon:'gladius',shield:'aspis',cloth:'#a34636',trim:'#c7a05d',horse:'bay',cape:'#803a2c',head:'corinthianCrest',hair:'#43372d',skin:'#b88d67',noStirrups:true },
  darius_i: { armor:'robe',weapon:'longsword',cloth:'#63518a',trim:'#d4b76c',horse:'grey',cape:'#a38247',head:'achaemenidCrown',hair:'#382d29',skin:'#b78d66',noStirrups:true,longCoat:true,patterned:true },
  takeda_shingen: { armor:'lamellar',weapon:'sabre',cloth:'#9a4234',trim:'#ba9b64',horse:'black',head:'takedaKabuto',hair:'#544037',skin:'#bd956f',barding:'leather' },
  qin_shi_huang: { armor:'robe',weapon:'longsword',cloth:'#303e3b',trim:'#b86741',horse:'dun',cape:'#814739',head:'qinCrown',hair:'#2a2926',skin:'#b9916d',noStirrups:true,longCoat:true },
  qi_jiguang: { armor:'lamellar',weapon:'sabre',cloth:'#35596b',trim:'#c1a46d',horse:'bay',cape:'#a75835',head:'mingTassel',hair:'#39322b',skin:'#ba906b' },
  nikephoros_ii_phokas: { armor:'lamellar',weapon:'longsword',shield:'round',cloth:'#725071',trim:'#d1b876',horse:'black',cape:'#654471',head:'byzantineCrown',hair:'#78766a',skin:'#ba9476' },
};

function drawCommanderHead(g,p) {
  const ink='#26302b';
  const line=(c,w,pts)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke();};
  const shape=(c,pts,edge=true)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=c;g.fill();if(edge){g.strokeStyle=ink;g.lineWidth=.45;g.stroke();}};
  const oval=(c,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=c;g.fill();};
  const beard=(long=false)=>{shape(p.hair,[[-2,-23],[-.8,-22.4],[1,-22.3],[3.2,-23],[3.1,-20.5],[long?0:1,long?-17.7:-19.4],[-2,-20.3]],false);line(p.hair,.65,[[.5,-23],[2.7,-23.1]]);};
  const turban=(c,w,high)=>{oval(c,-.6,-28.5,w,high);for(let i=0;i<3;i++)line('#a99c7e',.4,[[-w+1,-29+i],[0,-27.8+i*.5],[w-1,-29+i*.4]]);};
  // Neck, three-quarter face and projecting nose remain visible under the headgear.
  shape(p.skin,[[-1.6,-23],[2.6,-23],[2.1,-19],[-1.8,-19]]);
  oval(p.skin,0,-25,3.5,4.1);
  shape(p.skin,[[1.5,-27],[3.1,-26],[3.4,-24.9],[4.4,-23.9],[3,-23.4],[2.8,-21.5],[.5,-21]],false);
  oval('#a67b58',-2.7,-24, .7,1.05);
  line('#664b38',.5,[[1.2,-25.5],[2.8,-25.4]]);oval(ink,2.3,-25,.36,.33);
  line('#7e5942',.4,[[1.2,-22.5],[2.7,-22.3]]);
  if(p.furCollar){line('#5c4936',2.7,[[-4.5,-21],[-3.8,-19],[-2.3,-17]]);line('#7d6246',2.2,[[3.5,-21],[4,-18]]);}
  if(p.head==='sobieskiCap'){
    shape('#964a3c',[[-4,-28],[-3,-32],[0,-33],[3,-31],[4,-28]]);
    line('#71583f',2.5,[[-4,-27.5],[3.5,-27.5]]);
    line(p.hair,1.2,[[-.5,-23],[1.2,-23.5],[3.8,-22.7]]);
    oval('#d0b26e',1,-29,1,1.2);
  }else if(p.head==='ottomanTurban'){
    beard();oval('#963c38',-.7,-32,2.9,2.4);turban('#e8e1c7',6.3,3.5);
    line('#f3ecd7',1.2,[[-4.7,-29.8],[-2,-27.5],[2.5,-27.7]]);
    shape('#dbd5bf',[[-6,-29],[-5,-23],[-3.5,-24],[-3.5,-28]]);
  }else if(p.head==='timurid'){
    beard();shape('#adbaaf',[[-4.5,-28],[-2.5,-34],[.2,-35.4],[3.5,-28]]);
    for(const x of [-2,0,2])line('#657c73',.55,[[x*.4,-34],[x,-29]]);
    oval('#c3c8af',-.4,-28,5.3,1.2);line('#bba261',.7,[[-4.6,-27.8],[4.2,-27.8]]);
    line('#a34335',1.4,[[0,-35],[1,-38],[2.2,-37.5]]);
  }else if(p.head==='hunCap'){
    shape('#484139',[[-4,-27],[-3,-31],[0,-33],[3,-30],[4,-27]]);
    line('#807055',2,[[-4,-27],[3,-27]]);
    line(p.hair,1.8,[[-3,-26],[-4,-22],[-3,-19]]);beard();
    line(p.hair,.9,[[.3,-23],[1.5,-22.8],[3,-23.4]]);
  }else if(p.head==='yuanCap'){
    shape('#c8c5ac',[[-4,-29],[-5,-25],[-4.4,-19],[-2.8,-20],[-2.5,-27]]);
    oval('#e6e0c6',-.2,-29,4.8,2.6);line('#faf0cf',.8,[[-3.8,-28.4],[3.9,-28.4]]);
    line(p.hair,.8,[[-.2,-23],[1.1,-22.7],[3,-23.2]]);
    shape(p.hair,[[-.6,-21.7],[1.8,-21.6],[1.6,-18.1],[.2,-17.2],[-.6,-19]],false);
    line('#e4d2b3',.45,[[.4,-21],[.5,-18.5]]);
  }else if(p.head==='anastole'){
    // Swept-up central locks, bare face and a narrow diadem distinguish Alexander.
    for(const [x,y,r] of [[-3,-28,1.8],[-1.6,-30,2],[.4,-30.3,1.7],[2.3,-29,1.4],[-3.6,-25.6,1.3]])oval(p.hair,x,y,r,r*1.1);
    line('#ac8960',.7,[[-2,-30],[-.5,-31],[.7,-29.8]]);
    line('#e0d6b5',.65,[[-3.6,-28.3],[-.8,-28.7],[2.5,-28]]);
    line('#d2c3a2',.6,[[-3.8,-28],[-5.8,-25],[-5.5,-22]]);
  }else if(p.head==='laurel'){
    shape(p.hair,[[-3.5,-24],[-4,-27.4],[-2.5,-29.2],[-.3,-29.3],[-1,-28],[-2,-27.3],[-2.3,-24]],false);
    line('#8c9b5b',.65,[[-3.2,-27.2],[-1.8,-28.6],[.1,-29],[2.3,-28.3]]);
    for(const [x,y] of [[-3,-27.7],[-2,-28.7],[-.8,-29.2],[.6,-29],[1.8,-28.7]]){shape('#b2b574',[[x-.7,y+.3],[x-.8,y-1],[x+.3,y-.5],[x+.4,y+.2]],false);}
    line('#9c785c',.4,[[.2,-26.6],[2,-26.5]]);
  }else if(p.head==='seljukCone'){
    shape('#b8beb0',[[-4,-27],[-2,-31.5],[0,-35],[2.5,-31],[4,-27]]);
    line('#dccb8f',.6,[[0,-34],[.7,-29]]);line('#584233',2.3,[[-4,-27],[3.6,-27]]);
    line(p.hair,1.4,[[-3,-25],[-4.5,-21],[-4.1,-17.5]]);
    line(p.hair,1,[[.1,-23],[1.4,-22.6],[3.3,-23.1]]);
    line(p.hair,.8,[[.5,-21.2],[.7,-19.5]]);
  }else if(p.head==='ayyubidTurban'){
    shape('#87978a',[[-4,-27],[-4.3,-21],[-2.8,-18.8],[-1.8,-22],[-2,-27]]);
    for(let y=-26;y<-20;y+=1.2)line('#d0cbb2',.4,[[-4,y],[-2.8,y+.5]]);
    beard(true);turban('#d8c9a0',4.8,2.6);
    line('#eee1b8',.8,[[-3,-29.8],[1,-27],[3.5,-28.1]]);
  }else if(p.head==='punicHelmet'){
    beard();oval('#bb9b62',-.5,-28,4.3,3.5);
    shape('#a88853',[[-4.4,-28],[-2,-27],[-2,-22],[-3.5,-21],[-4,-24]]);
    line('#e3c48e',.8,[[-4,-27.5],[3.6,-27.5]]);
    line('#674453',2.5,[[-3,-30.5],[-1,-33],[1.5,-32.5],[3.5,-30.5]]);
  }else if(p.head==='featherBeret'){
    beard(true);oval('#503d30',-.7,-29,6,2.3);
    line('#d5c8a5',1.8,[[-4,-30],[-6,-34],[-5,-38]]);
    line('#a9543e',1.4,[[-3,-30],[-2,-34],[-3,-37]]);
    line(p.trim,.8,[[-5,-28],[4,-28]]);
  }else if(p.head==='norseRoyalNasal'){
    line(p.hair,2.2,[[-3,-27],[-4,-23],[-4,-19]]);beard(true);
    shape('#7e8d91',[[-4.5,-27.5],[-4,-30.5],[-1.5,-34.5],[1,-34],[3.5,-30.5],[4,-27.5]]);
    line('#c2c5b5',.9,[[-1.5,-34],[.2,-30],[1,-27.7],[3,-27],[3.3,-23.4]]);
    line(p.trim,1,[[-4.4,-27.8],[0,-28.2],[3.8,-27.8]]);
    shape('#647570',[[-4.5,-27],[-3,-27],[-3.5,-22],[-5,-20.5],[-5.5,-24]]);
  }else if(p.head==='saxonNasal'){
    beard();shape('#a1aaa0',[[-4,-28],[-2,-32],[0,-34],[3,-30],[4,-27]]);
    line('#d0c7a3',.8,[[0,-33],[1,-28],[3,-27],[3.4,-23]]);
    shape('#738079',[[-4,-28],[-2.5,-27],[-2.5,-21],[-4.5,-20.5]]);
  }else if(p.head==='royalCap'){
    line(p.hair,2,[[-3,-27],[-4,-22],[-3,-20]]);
    shape('#983e3c',[[-5,-28],[-4.5,-32],[1.5,-33],[4,-30],[5,-28]]);
    line('#c76950',1.5,[[-4.7,-28],[4.7,-28]]);
  }else if(p.head==='ducalCap'){
    line(p.hair,2.6,[[-3,-27],[-4.5,-24],[-4,-19]]);
    shape('#3d4039',[[-5,-28],[-5,-31],[1,-31.5],[3,-30],[4,-27.5]]);
    line('#a8aa91',.7,[[-4.7,-28],[3.8,-27.5]]);
  }else if(p.head==='corinthianCrest'){
    beard();oval('#af8d51',0,-28,4.4,3.8);
    shape('#b99a60',[[-4,-28],[-1.6,-27],[-1.5,-22],[-3.5,-21.5]]);
    shape('#c4a46c',[[2,-27],[3.7,-27],[4.1,-23.5],[3,-24]]);
    line('#72372e',3.4,[[-5,-29],[-4,-34],[-1,-36],[3,-34],[4.5,-31]]);
    line('#d0ad69',.8,[[-4,-30],[-2,-33],[1,-33],[3,-31]]);
  }else if(p.head==='achaemenidCrown'){
    beard(true);shape('#4d635f',[[-4,-28],[-4,-34],[-2.5,-34],[-2.5,-32.5],[-1,-32.5],[-1,-34],[1,-34],[1,-32.5],[2.7,-32.5],[2.7,-34],[4,-34],[4,-28]]);
    line('#d5b56c',1,[[-4,-28],[4,-28]]);
    for(let y=-22;y<-18;y++)line('#a08055',.35,[[-1.5,y],[2.5,y]]);
    line(p.hair,2,[[-3,-27],[-4,-24],[-4,-20]]);
  }else if(p.head==='takedaKabuto'){
    beard();shape('#6a5140',[[-5,-28],[-3,-32],[0,-34],[3,-31],[5,-27]]);
    for(let i=0;i<6;i++)line('#dad5bc',1.7,[[-4+i*1.4,-30],[-6+i*2,-34-(i%2)*2]]);
    shape('#714733',[[-4.8,-27],[-3,-26],[-3.8,-22],[-6,-23]]);
    line('#c3a15f',1,[[3.5,-29],[6,-31],[5,-27]]);
  }else if(p.head==='qinCrown'){
    beard(true);shape('#353b36',[[-3,-28],[-3,-33],[3,-33],[3,-28]]);
    shape('#252e2b',[[-6,-34],[4,-35],[6,-33],[-4,-32]]);
    for(const x of [-5,-2,2,5]){line('#bb9e5a',.35,[[x,-33],[x,-27]]);for(let y=-31;y<=-27;y+=2)oval('#d3bf80',x,y,.4,.45);}
  }else if(p.head==='mingTassel'){
    beard(true);oval('#8c9c96',-.5,-29,4.2,3.3);
    shape('#6f827b',[[-4,-28],[-3,-22],[-5,-23],[-5,-28]]);
    line('#bdad77',.8,[[-5,-28],[4,-28]]);
    line('#9e4137',2,[[0,-32],[0,-36],[2,-38],[3,-35]]);
  }else if(p.head==='khepresh'){
    shape('#42677c',[[-4,-27],[-4.5,-32],[-3,-36],[.5,-36.5],[3.8,-34],[4,-28]]);
    line('#c5ab64',.8,[[-4,-27],[0,-27.5],[4,-28]]);
    for(const [x,y] of [[-2.5,-33],[0,-34],[2,-32],[-2,-30],[1,-30]])oval('#8ca1a0',x,y,.35,.35);
    line('#cfad58',.8,[[3,-28],[3,-31],[4,-32],[4.7,-30.5],[4,-29]]);
    line('#b19a61',1,[[-2,-20],[0,-18.8],[3,-20]]);
  }else if(p.head==='rusRoyalCone'){
    beard();
    shape('#64736d',[[-4,-28],[-4.5,-24],[-3,-20],[-1.5,-21],[-2.5,-28]]);
    for(let y=-26;y<-21;y+=1.2)line('#a2aaa0',.35,[[-4,y],[-2.5,y+.3]]);
    shape('#89978f',[[-4.5,-28],[-3,-32],[0,-36],[2.5,-32],[4.5,-28]]);
    line('#c4c6ad',.6,[[0,-35],[.7,-29]]);
    line('#b9a16a',1,[[-4.5,-28],[4.5,-28]]);
    shape('#a9afa0',[[2,-28],[3,-28],[3.3,-24],[2.4,-24]]);
  }else if(p.head==='byzantineCrown'){
    beard();oval(p.hair,-.5,-28,3.8,2);
    shape('#c2a466',[[-4,-28],[-4,-31],[-2,-30],[-1,-32],[1,-30],[3,-31],[4,-28]]);
    line('#d4bd7e',.6,[[0,-32],[0,-35]]);line('#d4bd7e',.6,[[-1,-34],[1,-34]]);
    for(const x of [-4,4]){line('#d8c493',.7,[[x,-28],[x,-23]]);oval('#dacdaa',x,-22.5,.65,.8);}
  }
}

// Built only when a card changes; never drawn in the battle animation loop.
export function commanderPortrait(id) {
  const p=COMMANDER_ART_PROFILES[id];
  if(!p)throw new Error(`Commander portrait missing: ${id}`);
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=288;
  const g=canvas.getContext('2d'),bg=g.createLinearGradient(0,0,240,288);
  bg.addColorStop(0,'#566456');bg.addColorStop(1,'#182720');g.fillStyle=bg;g.fillRect(0,0,240,288);
  g.setTransform(7.5,0,0,7.5,120,315);
  g.beginPath();g.moveTo(-13,0);g.lineTo(-11,-15);g.quadraticCurveTo(-8,-20,0,-20);g.quadraticCurveTo(8,-20,11,-15);g.lineTo(13,0);g.closePath();
  g.fillStyle=p.cape||p.cloth;g.fill();g.strokeStyle='#26302b';g.lineWidth=.6;g.stroke();
  g.beginPath();g.moveTo(-7,-17);g.lineTo(0,-20);g.lineTo(7,-17);g.lineTo(6,0);g.lineTo(-6,0);g.closePath();
  g.fillStyle=p.armor==='plate'?'#88958c':p.cloth;g.fill();g.strokeStyle=p.trim;g.lineWidth=.7;g.stroke();
  if(['lamellar','mail','muscle'].includes(p.armor)){
    g.strokeStyle=p.trim;g.lineWidth=.25;
    for(let y=-15;y<-3;y+=2){g.beginPath();g.moveTo(-6,y);g.lineTo(6,y);g.stroke();
      for(let x=-5;x<6;x+=2){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+1.5);g.stroke();}}
  }else if(p.armor==='plate'){
    g.strokeStyle='#c5cabc';g.lineWidth=.4;g.beginPath();g.moveTo(0,-17);g.lineTo(1,-5);g.stroke();
  }
  drawCommanderHead(g,p);
  return canvas;
}

export function commanderSprite(type,team,frame,action,variant=0) {
  const cfg=COMMANDER_TYPES[type],p=COMMANDER_ART_PROFILES[cfg?.commanderId];
  if(!p)throw new Error(`Commander artwork missing: ${type}`);
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=228;
  const g=canvas.getContext('2d',{willReadFrequently:true});g.setTransform(3,0,0,3,90,183);
  drawHistoricalWarrior(g,p,cfg,team,frame,action,variant,drawCommanderHead);
  return canvas;
}
