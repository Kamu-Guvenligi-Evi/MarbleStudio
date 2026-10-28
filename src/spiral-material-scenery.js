const TAU=Math.PI*2,wrap=(n,m)=>(n%m+m)%m;
// Muted environments frame the breakable ribbon. All motion follows simulation time.
const worlds={
  pearlShells:['#d9c3df','seabed'],pomegranate:['#df9aaa','flow'],bubbleCells:['#b1e0eb','bubbles'],
  ice:['#a8e4ff','peaks'],lava:['#ff763c','volcano'],aurora:['#79e6bf','curtains'],
  gold:['#e8bf63','arches'],candy:['#f5accb','hills'],cosmic:['#e9a0e3','nebula'],
  wood:['#8fb688','trees'],honey:['#f4c65f','hills'],marble:['#cbd4dd','columns'],
  copper:['#83c3ae','arches'],sand:['#dfa776','strata'],coral:['#e994aa','seabed'],
  glass:['#a5e3e9','prisms'],ceramic:['#a8bde0','arches'],obsidian:['#b79acb','peaks'],
  emerald:['#7ed3a6','prisms'],circuit:['#92c8a3','grid'],alien:['#b6a1d7','hills'],
  clockwork:['#dbb87f','arches'],amber:['#ecc07e','trees'],mushroom:['#9bd3bf','seabed'],
  pixels:['#b6b9ee','grid'],starmap:['#c3d3f0','orbits'],
  chocolate:['#c49676','flow'],soap:['#c3e5e5','bubbles'],opal:['#d4d9f2','silk'],
};
function path(c,points,close=false){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(close)c.closePath();}
function line(c,points,w=1){path(c,points);c.lineWidth=w;c.stroke();}
function circle(c,x,y,r,fill=false){c.beginPath();c.arc(x,y,r,0,TAU);fill?c.fill():c.stroke();}
function environment(c,kind,t){
  if(['hills','flow','strata','silk','seabed'].includes(kind)){
    for(let j=0;j<5;j++){
      const points=[[0,960]];for(let x=0;x<=550;x+=10)points.push([x,790+j*30+Math.sin(x*(kind==='strata'?.02:.009)+j*.8+t*.06)*(kind==='silk'?55:25)]);
      points.push([540,960]);path(c,points,true);c.globalAlpha=.035+j*.012;c.fill();c.globalAlpha=.13;c.stroke();
    }
  }else if(['peaks','volcano','prisms'].includes(kind)){
    for(let i=0;i<7;i++){const x=i*95-55,h=80+(i*71)%170;path(c,[[x-55,960],[x+15,960-h],[x+95,960]],true);c.globalAlpha=.08;c.fill();c.globalAlpha=.18;c.stroke();line(c,[[x+15,960-h],[x+32,960]]);}
    if(kind==='volcano'){c.globalAlpha=.2;line(c,[[225,960],[263,827],[280,840],[308,960]],3);}
  }else if(['arches','columns','trees'].includes(kind)){
    for(const x of [24,82,458,516]){c.globalAlpha=.1;line(c,[[x,960],[x,100]],kind==='columns'?12:3);
      if(kind==='arches'){c.beginPath();c.ellipse(x,170,52,110,0,Math.PI,TAU);c.stroke();}
      if(kind==='trees')for(let i=0;i<6;i++)line(c,[[x,650-i*86],[x+(i%2?1:-1)*35,600-i*86]],2);
    }
  }else if(kind==='grid'){
    c.globalAlpha=.08;for(let x=-300;x<900;x+=60)line(c,[[270+(x-270)*.1,770],[x,960]]);
    for(let i=0;i<8;i++){const y=780+wrap(i*27+t*4,180);line(c,[[0,y],[540,y]]);}
  }else if(kind==='curtains'||kind==='silk'){
    for(let i=0;i<10;i++){c.globalAlpha=.055;const pts=[];for(let x=0;x<=540;x+=8)pts.push([x,140+i*9+Math.sin(x*.012+i*.22+t*.2)*45]);line(c,pts,12);}
  }else if(kind==='orbits'){
    c.globalAlpha=.12;for(let i=0;i<3;i++){c.beginPath();c.ellipse(270,460,285+i*30,350+i*36,-.3+t*.015,0,TAU);c.stroke();}
  }else if(kind==='nebula'){
    for(let i=0;i<5;i++){const x=70+i*110,y=145+Math.sin(t*.15+i)*40,g=c.createRadialGradient(x,y,0,x,y,100);g.addColorStop(0,'#b97dc329');g.addColorStop(1,'#b97dc300');c.fillStyle=g;c.fillRect(x-100,y-100,200,200);}
  }
}
function motif(c,id,t,i){
  switch(id){
    case 'ice':for(let k=0;k<3;k++){c.rotate(Math.PI/3);line(c,[[-8,0],[8,0]]);line(c,[[4,-3],[6,0],[4,3]]);}break;
    case 'lava':c.beginPath();c.ellipse(0,0,3,8,0,0,TAU);c.fill();break;
    case 'aurora':line(c,[[-15,3],[-5,-6],[5,4],[15,-5]],2);break;
    case 'gold':path(c,[[-8,6],[-5,-5],[6,-5],[10,6]],true);c.fill();line(c,[[-5,-5],[-2,2],[10,6]]);break;
    case 'candy':circle(c,0,0,9);for(let k=0;k<3;k++)line(c,[[-5+k*4,-6],[-8+k*4,6]],2);break;
    case 'cosmic':path(c,[[0,-13],[7,0],[0,13],[-7,0]],true);c.stroke();line(c,[[0,-13],[0,13]]);break;
    case 'wood':c.beginPath();c.ellipse(0,0,5,12,.6,0,TAU);c.fill();line(c,[[-5,9],[5,-9]]);break;
    case 'honey':path(c,Array.from({length:6},(_,k)=>[Math.cos(k*TAU/6)*10,Math.sin(k*TAU/6)*10]),true);c.stroke();circle(c,0,0,3,true);break;
    case 'marble':line(c,[[-9,-14],[-2,-5],[-6,2],[8,14]],1.5);line(c,[[-2,-5],[8,-8]]);break;
    case 'copper':for(let k=0;k<3;k++){c.beginPath();c.ellipse(0,0,12-k*3,7-k,0,0,TAU);c.stroke();}break;
    case 'sand':line(c,[[-13,3],[-5,-2],[5,2],[13,-3]]);circle(c,8,-9,1,true);break;
    case 'coral':line(c,[[0,15],[0,-9],[-7,-15]],2);line(c,[[0,5],[9,-3],[9,-11]],2);line(c,[[0,7],[-9,0]],2);break;
    case 'glass':path(c,[[-12,-10],[13,-6],[5,14]],true);c.stroke();line(c,[[-12,-10],[5,14]]);break;
    case 'ceramic':for(let k=0;k<4;k++){c.rotate(Math.PI/2);c.beginPath();c.ellipse(0,6,3,6,0,0,TAU);c.stroke();}circle(c,0,0,2,true);break;
    case 'obsidian':path(c,[[0,-16],[8,7],[-9,12],[-4,-6]],true);c.fill();break;
    case 'emerald':path(c,[[-5,-12],[5,-12],[9,0],[5,12],[-5,12],[-9,0]],true);c.stroke();line(c,[[-5,-12],[-3,0],[5,12]]);break;
    case 'circuit':line(c,[[-16,10],[-6,10],[-6,-5],[9,-5]]);circle(c,9,-5,3);c.strokeRect(-19,7,6,6);break;
    case 'alien':c.beginPath();c.ellipse(0,0,14,6,0,0,TAU);c.stroke();c.beginPath();c.arc(0,-3,7,Math.PI,TAU);c.stroke();circle(c,-6,1,1,true);circle(c,6,1,1,true);break;
    case 'clockwork':circle(c,0,0,9);circle(c,0,0,3);for(let k=0;k<10;k++){c.rotate(TAU/10);line(c,[[9,0],[13,0]],3);}break;
    case 'amber':c.beginPath();c.ellipse(0,0,7,12,.2,0,TAU);c.stroke();circle(c,-2,-4,2,true);break;
    case 'mushroom':line(c,[[0,12],[0,0]],3);c.beginPath();c.ellipse(0,0,13,9,0,Math.PI,TAU);c.closePath();c.stroke();circle(c,-4,-4,1.5,true);circle(c,4,-5,1.5,true);break;
    case 'pixels':c.fillRect(-9,-9,6,6);c.fillRect(-3,-3,6,6);c.fillRect(3,-9,6,6);c.fillRect(3,3,6,6);break;
    case 'starmap':circle(c,0,0,8);c.beginPath();c.ellipse(0,0,16,4,-.4,0,TAU);c.stroke();break;
    case 'pomegranate':
    case 'chocolate':c.beginPath();c.ellipse(0,0,6,10,.4,0,TAU);c.fill();c.globalAlpha*=.5;line(c,[[-3,7],[0,0],[3,-7]],2);break;
    case 'bubbleCells':
    case 'soap':circle(c,0,0,10+i%3*3);c.beginPath();c.arc(0,0,7+i%3*3,3.5,4.8);c.lineWidth=2;c.stroke();break;
    case 'pearlShells':
    case 'opal':c.beginPath();c.ellipse(0,0,10,7,-.4,0,TAU);c.stroke();c.beginPath();c.ellipse(-2,-2,5,2,-.4,0,TAU);c.fill();break;
  }
}
export function drawMaterialScenery(c,id,time){
  const world=worlds[id];if(!world)return;
  c.save();try{
    const [color,kind]=world;c.strokeStyle=color;c.fillStyle=color;c.lineWidth=1;
    environment(c,kind,time);c.fillStyle=color;c.strokeStyle=color;
    for(let i=0;i<20;i++){
      const side=i%2,x=side?480+(i*17)%45:15+(i*19)%44;
      const y=wrap(i*149+time*(id==='lava'?-15:id==='soap'?-9:3),1040)-40;
      c.save();c.translate(x+Math.sin(time*.25+i)*8,y);c.rotate(Math.sin(time*.15+i)*.25);
      c.globalAlpha=.13+.09*(1+Math.sin(time*.5+i))/2;motif(c,id,time,i);c.restore();
    }
  }finally{c.restore();}
}
