import {drawTilePattern} from './glass-tile-patterns.js';
export const GLASS_THEMES={
  sahlale:{name:'Şahlale Çini',detail:'Mercan kırmızısında beyaz sarmaşıklar ve iri lacivert saz yaprakları',pattern:'tile:sahlale',glaze:43,hue:5,saturation:58,accent:'#f2c7ac',background:'#29181f',halo:'#82423e',wall:'#e7d6af',swatch:'linear-gradient(125deg,#a52f35,#f5eed7,#18366e,#21998f)',metal:false},
  yesilturbe:{name:'Yeşil Türbe',detail:'Turkuaz sırda birleşen lacivert madalyonlar ve altın dallar',pattern:'tile:yesilturbe',glaze:48,hue:169,saturation:57,accent:'#9be5c8',background:'#0b2525',halo:'#267b6c',wall:'#ddc795',swatch:'linear-gradient(125deg,#10ae9b,#123e57,#f2dfac,#187867)',metal:false},
  dantel:{name:'Dantel Çini',detail:'Lacivert ve fildişi çiçek örgüsü, kırmızı çini bordürü',pattern:'tile:dantel',glaze:92,hue:42,saturation:39,accent:'#dfcda8',background:'#121c34',halo:'#344e81',wall:'#e4d6b7',swatch:'linear-gradient(125deg,#142c62,#fff7df,#23518c,#943c37)',metal:false},
  revzen:{name:'Kemerli Revzen',detail:'Turkuaz camlı kemerler ve çiçekli pencere bölmeleri',pattern:'tile:revzen',glaze:77,hue:173,saturation:48,accent:'#7ddcc5',background:'#10252a',halo:'#286575',wall:'#d5c79d',swatch:'linear-gradient(125deg,#173e50,#25bda9,#f1dca5,#2487ab)',metal:false},
  rosewindow:{name:'Gül Pencere',detail:'Birbirine geçen renkli cam yaprakları ve yuvarlak şebeke',pattern:'tile:rosewindow',glaze:84,hue:235,saturation:33,accent:'#ceb7e6',background:'#201d32',halo:'#625480',wall:'#dfc9a2',swatch:'linear-gradient(125deg,#c470a6,#9694d0,#4caeb5,#e4b97c)',metal:false},
  lattice:{name:'Yıldız Kafes',detail:'Zümrüt camda birleşik yıldızlar ve elmas bölmeler',pattern:'tile:lattice',glaze:84,hue:161,saturation:40,accent:'#9cddbf',background:'#102820',halo:'#347361',wall:'#cbdcb8',swatch:'linear-gradient(125deg,#165b57,#29ac95,#e1efd5,#6abfbb)',metal:false},
  rumi:{name:'Rumi Çini',detail:'Lacivert kıvrımlar ve turkuaz yapraklar',pattern:'tile:rumi',glaze:89,hue:181,saturation:40,accent:'#59d8cc',background:'#101b32',halo:'#244875',wall:'#b8e5df',swatch:'linear-gradient(125deg,#112b66,#14b6aa,#effaf1)',metal:false},
  hatayi:{name:'Hatayi Bahçesi',detail:'Büyük çiçek madalyonu ve mercan taç yapraklar',pattern:'tile:hatayi',glaze:88,hue:38,saturation:35,accent:'#efb0a5',background:'#231b26',halo:'#674256',wall:'#e8d5bd',swatch:'linear-gradient(125deg,#124f69,#de657c,#fff3df,#159f96)',metal:false},
  tulip:{name:'Lale Bahçesi',detail:'Fildişi sırda mercan laleler ve yeşil dallar',pattern:'tile:tulip',glaze:88,hue:46,saturation:39,accent:'#eaa58b',background:'#18251e',halo:'#426b51',wall:'#e6d8b4',swatch:'linear-gradient(125deg,#135744,#d94c48,#fff3d8)',metal:false},
  penc:{name:'Mine Çiçeği',detail:'Mor penç çiçekleri ve turkuaz sarmaşıklar',pattern:'tile:penc',glaze:87,hue:270,saturation:28,accent:'#c5b0e8',background:'#21192e',halo:'#604b80',wall:'#dcd0e9',swatch:'linear-gradient(125deg,#493567,#9f77bc,#fff4e7,#31a9a4)',metal:false},
  cintemani:{name:'Çintemani',detail:'Lacivert halkalar ve turkuaz dalga şeritleri',pattern:'tile:cintemani',glaze:80,hue:182,saturation:50,accent:'#7cdee2',background:'#102331',halo:'#286275',wall:'#b0dfe1',swatch:'linear-gradient(125deg,#163e73,#2bbbc1,#f2e2b2)',metal:false},
  iznik:{name:'Turkuaz Çini',detail:'Turkuaz sırda zümrüt çiçekler ve zarif yapraklar',pattern:'iznik',hue:170,saturation:62,accent:'#64e0ca',background:'#0b211f',halo:'#1c675e',wall:'#a3dcd1',swatch:'linear-gradient(125deg,#075f59,#13b6a5,#8edccc,#e0f4e9)',metal:false},
  rain:{name:'Yağmur Damlaları',detail:'Gece mavisinde parlak damlalar',pattern:'rain',hue:218,saturation:43,accent:'#b6cfee',background:'#111827',halo:'#3b527a',wall:'#b5c6df',swatch:'linear-gradient(125deg,#344f87,#7d9fcb,#d3e4f3)',metal:false},
  fern:{name:'Eğrelti Camı',detail:'Yeşim camda ince yaprak izleri',pattern:'fern',hue:145,saturation:35,accent:'#b8ddba',background:'#11201a',halo:'#3a674b',wall:'#b7d8bc',swatch:'linear-gradient(125deg,#3e755d,#94bf9c,#e1ead0)',metal:false},
  ripples:{name:'Su Halkaları',detail:'Sedefli yüzeyde iç içe su halkaları',pattern:'ripples',hue:190,saturation:35,accent:'#c4dcf4',background:'#181a2b',halo:'#515b83',wall:'#c6cce5',swatch:'linear-gradient(125deg,#7b82bb,#a4d8db,#e4daf4)',metal:false},
  frost:{name:'Buz Çiçeği',detail:'Kristal dalları ve buzlu yüzey',pattern:'frost',hue:195,saturation:45,accent:'#b9edff',background:'#101b27',halo:'#376885',wall:'#c5eaff',swatch:'linear-gradient(125deg,#3f7fbc,#a8dbea,#eefcff)',metal:false},
  honeycomb:{name:'Bal Peteği',detail:'Kehribar camda ince petekler',pattern:'honeycomb',hue:38,saturation:76,accent:'#ffd47d',background:'#21170e',halo:'#78551b',wall:'#efca83',swatch:'linear-gradient(125deg,#9e561e,#edac39,#ffe7aa)',metal:false},
  bubbles:{name:'Deniz Köpüğü',detail:'Su yeşili camda hava kabarcıkları',pattern:'bubbles',hue:170,saturation:53,accent:'#a0e9d9',background:'#102020',halo:'#326c67',wall:'#b4dfd4',swatch:'linear-gradient(125deg,#248a98,#84d6ca,#d6f4e1)',metal:false},
  spectrum:{name:'Spektrum',detail:'Renkli kristal',hue:null,saturation:88,accent:'#80e9c8',background:'#101214',halo:'#315849',wall:'#d2e2dc',swatch:'linear-gradient(125deg,#ed778d,#bd8bea,#77b8e6,#78cba6)',metal:false},
  gold:{name:'Gold',detail:'Sıcak altın',hue:42,saturation:64,accent:'#e5c47e',background:'#151310',halo:'#665022',wall:'#d5bc82',swatch:'linear-gradient(125deg,#705122,#d8b45e 35%,#fff0b9 47%,#9e7532 59%,#e5c47e)',metal:true},
  chrome:{name:'Krom',detail:'Gümüş yansımalar',hue:215,saturation:8,accent:'#c4d2e3',background:'#101318',halo:'#36495f',wall:'#c5d3e4',swatch:'linear-gradient(125deg,#445165,#bdc9d8 35%,#f3f6fc 47%,#69788e 59%,#c4d2e3)',metal:true},
  rose:{name:'Rose Gold',detail:'Bakır ve pembe',hue:17,saturation:43,accent:'#e4b3a4',background:'#171214',halo:'#674239',wall:'#d6afa0',swatch:'linear-gradient(125deg,#795047,#cd9483 35%,#ffe0cd 47%,#a46557 59%,#e4b3a4)',metal:true},
  emerald:{name:'Zümrüt',detail:'Derin yeşil',hue:157,saturation:49,accent:'#86d5b2',background:'#0e1715',halo:'#245d48',wall:'#a2cbbb',swatch:'linear-gradient(125deg,#174e43,#419d79 40%,#b8e7cb 49%,#286b57 62%,#65bc97)',metal:false},
  sapphire:{name:'Safir',detail:'Serin mavi',hue:215,saturation:59,accent:'#97bdea',background:'#10141c',halo:'#304d79',wall:'#a8c3df',swatch:'linear-gradient(125deg,#213e70,#477fb9 40%,#c1deef 49%,#365d95 62%,#78a5db)',metal:false}
};
// Closed palettes blend neighboring shades without a visible seam at 360°.
const palettes={
  sahlale:[[3,58],[355,53],[10,56]],
  yesilturbe:[[169,57],[180,60],[156,49]],
  dantel:[[42,39],[48,32],[35,34]],
  revzen:[[173,48],[188,51],[157,42]],
  rosewindow:[[235,33],[275,31],[195,37]],
  lattice:[[161,40],[177,43],[145,34]],
  rumi:[[179,40],[190,42],[168,32]],
  hatayi:[[35,35],[45,32],[25,29]],
  tulip:[[42,39],[53,37],[35,33]],
  penc:[[270,28],[288,24],[252,27]],
  cintemani:[[182,50],[193,47],[170,44]],
  frost:[[195,43],[212,52],[180,33],[205,37]],
  iznik:[[174,65],[158,53],[182,61],[165,57]],
  rain:[[213,46],[225,40],[201,37],[218,48]],
  fern:[[143,34],[164,39],[122,29],[153,36]],
  ripples:[[190,35],[226,34],[265,29],[178,30]],
  honeycomb:[[29,79],[43,85],[52,75],[35,83]],
  bubbles:[[166,53],[184,59],[149,39],[194,47]],
  gold:[[42,66],[54,56],[34,69],[22,53],[46,61]],
  chrome:[[212,20],[184,22],[230,19],[274,17],[38,16]],
  rose:[[17,47],[344,42],[323,32],[29,54],[8,46]],
  emerald:[[157,51],[181,48],[168,57],[126,40],[146,48]],
  sapphire:[[215,61],[193,57],[226,59],[253,44],[208,55]]
};
const themePalettes=new Map(Object.entries(palettes).map(([id,palette])=>[GLASS_THEMES[id],palette]));
export function themeColor(theme,hue,light=55,alpha=1){
  const palette=themePalettes.get(theme);
  let tint=hue,saturation=theme.saturation;
  if(palette){
    const phase=((hue%360+360)%360)/360*palette.length,index=Math.floor(phase);
    const a=palette[index],b=palette[(index+1)%palette.length],mix=(1-Math.cos((phase-index)*Math.PI))/2;
    const distance=((b[0]-a[0]+540)%360)-180;
    tint=a[0]+distance*mix;saturation=a[1]+(b[1]-a[1])*mix;
  }
  return `hsla(${tint} ${saturation}% ${light}% / ${alpha})`;
}
export function createGlassFill(context,theme,cell){
  if(theme.glaze)cell={...cell,light:theme.glaze};
  if(theme.pattern==='iznik')cell={...cell,light:76};
  const fill=context.createLinearGradient(cell.x-16,cell.y-18,cell.x+16,cell.y+18);
  fill.addColorStop(0,themeColor(theme,cell.hue-22,cell.light+6));
  fill.addColorStop(.48,themeColor(theme,cell.hue,cell.light+1));
  fill.addColorStop(1,themeColor(theme,cell.hue+25,cell.light-4));
  return fill;
}

// Draw inside the facet clip so each pattern disappears with its broken glass.
// Cell coordinates make cached redraws and exported frames identical.
export function drawGlassPattern(c,theme,cell){
  const kind=theme.pattern;if(!kind)return;
  if(kind.startsWith('tile:')){drawTilePattern(c,kind.slice(5),cell);return;}
  c.save();c.strokeStyle='#efffff66';c.lineWidth=.8;
  const line=points=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
  if(kind==='iznik'){
    // A pane-wide repeat keeps the painted design continuous across fracture edges.
    const xs=cell.poly.map(p=>p.x),ys=cell.poly.map(p=>p.y);
    for(let row=Math.floor(Math.min(...ys)/64)-1;row<=Math.ceil(Math.max(...ys)/64);row++){
      for(let col=Math.floor(Math.min(...xs)/64)-1;col<=Math.ceil(Math.max(...xs)/64);col++){
        c.save();c.translate(col*64,row*64);
        const alternate=(row+col)%2===0;
        // Curved, interlocking tile outlines surround a larger enamel rosette.
        c.strokeStyle='#e1fff0b3';c.lineWidth=1.1;
        c.beginPath();c.moveTo(0,-31);c.quadraticCurveTo(9,-10,31,0);c.quadraticCurveTo(10,9,0,31);c.quadraticCurveTo(-9,10,-31,0);c.quadraticCurveTo(-10,-9,0,-31);c.closePath();c.stroke();
        for(let k=0;k<8;k++){
          c.save();c.rotate(k*Math.PI/4+(alternate?0:Math.PI/8));
          c.fillStyle=k%2===0?(alternate?'#078b83':'#13765c'):(alternate?'#239e70':'#16a99e');
          c.strokeStyle='#075b54';c.lineWidth=.75;
          c.beginPath();c.moveTo(0,-3);c.bezierCurveTo(-9,-10,-7,-18,0,-24);c.bezierCurveTo(7,-18,9,-10,0,-3);c.closePath();c.fill();c.stroke();
          c.strokeStyle='#b9f2d9';c.lineWidth=.65;c.beginPath();c.moveTo(0,-8);c.quadraticCurveTo(-2,-15,0,-20);c.stroke();
          c.restore();
        }
        c.fillStyle='#e4f8de';c.strokeStyle='#075f59';c.lineWidth=1;
        c.beginPath();c.arc(0,0,5.2,0,Math.PI*2);c.fill();c.stroke();
        c.fillStyle='#0b998b';c.beginPath();c.arc(0,0,2.2,0,Math.PI*2);c.fill();
        // Small paired leaves occupy the spaces between neighboring medallions.
        for(const side of [-1,1]){
          c.save();c.translate(side*32,32);c.rotate(-side*Math.PI/4);
          c.fillStyle='#167b60';c.beginPath();c.moveTo(0,-10);c.quadraticCurveTo(10,0,0,10);c.quadraticCurveTo(-10,0,0,-10);c.fill();
          c.strokeStyle='#a5e6cd';c.lineWidth=.7;line([[0,-7],[0,7]]);c.restore();
        }
        c.restore();
      }
    }
  }else if(kind==='rain'){
    for(let k=0;k<4;k++){
      const x=cell.x+Math.sin(cell.id*2+k*5)*17,y=cell.y+Math.cos(cell.id+k*4)*18,r=2.5+(cell.id+k)%3;
      c.beginPath();c.moveTo(x,y-r*1.8);c.bezierCurveTo(x+r*1.8,y,x+r,y+r,x,y+r);c.bezierCurveTo(x-r,y+r,x-r*1.8,y,x,y-r*1.8);c.stroke();
      c.strokeStyle='#ffffffaa';line([[x-r*.5,y],[x-r*.3,y+r*.4]]);c.strokeStyle='#efffff66';
    }
  }else if(kind==='fern'){
    c.translate(cell.x,cell.y);c.rotate(Math.sin(cell.id*2)*.8);c.strokeStyle='#e0f4d78c';
    c.beginPath();c.moveTo(-3,23);c.quadraticCurveTo(3,0,0,-23);c.stroke();
    for(let k=0;k<6;k++)for(const side of [-1,1]){
      const y=15-k*6,w=11-k*1.3;c.beginPath();c.moveTo(0,y);c.quadraticCurveTo(side*w,y-1,side*w,y-8);c.quadraticCurveTo(side*3,y-7,0,y);c.stroke();
    }
  }else if(kind==='ripples'){
    const x=cell.x+Math.sin(cell.id)*7,y=cell.y+Math.cos(cell.id*3)*7;
    for(let k=0;k<4;k++){
      const r=5+k*6;c.strokeStyle='#eaf7ff60';c.beginPath();c.ellipse(x,y,r,r*.65,-.35,0,Math.PI*2);c.stroke();
      c.strokeStyle='#ffffff99';c.beginPath();c.ellipse(x,y,r-1,r*.65-1,-.35,3.4,4.6);c.stroke();
    }
  }else if(kind==='frost'){
    c.translate(cell.x,cell.y);c.rotate(cell.id*1.7);
    for(let k=0;k<6;k++){c.rotate(Math.PI/3);line([[0,0],[0,-19]]);line([[-5,-9],[0,-13],[5,-9]]);line([[-3,-4],[0,-7],[3,-4]]);}
  }else if(kind==='honeycomb'){
    c.strokeStyle='#ffe6a885';
    for(let row=-2;row<=2;row++)for(let col=-2;col<=2;col++){
      const x=cell.x+col*12+(row%2)*6,y=cell.y+row*10.4;c.beginPath();
      for(let k=0;k<6;k++){const a=Math.PI/3*k+Math.PI/6,px=x+6.9*Math.cos(a),py=y+6.9*Math.sin(a);k?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.stroke();
    }
  }else if(kind==='bubbles'){
    for(let k=0;k<5;k++){const x=cell.x+Math.sin(cell.id*3+k*7)*17,y=cell.y+Math.cos(cell.id+k*3)*17,r=2+(cell.id+k*3)%5;
      c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.strokeStyle='#ffffff99';c.beginPath();c.arc(x,y,r*.65,3.4,4.7);c.stroke();c.strokeStyle='#efffff66';}
  }
  c.restore();
}
export function createGlassShine(context,theme,cell){
  const shine=theme.metal?context.createLinearGradient(95,225,455,620):context.createLinearGradient(cell.x-12,cell.y-14,cell.x+12,cell.y+14);
  const stops=theme.metal?[[0,'#00000028'],[.22,'#ffffff0c'],[.4,'#ffffff6b'],[.48,'#ffffffa3'],[.54,'#00000045'],[.7,'#ffffff0c'],[.87,'#ffffff52'],[1,'#00000024']]:[[0,'#ffffff32'],[.48,'#ffffff02'],[.52,'#ffffff14'],[1,'#0000001a']];
  for(const [offset,color] of stops)shine.addColorStop(offset,color);
  return shine;
}
