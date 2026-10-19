// Isolated visual study. No combat statistics, saved armies or production art change.
import { SpriteLibrary } from './crown-battle-art.js';
const TAU = Math.PI * 2;
function shape(g, fill, points, stroke = '#182526', width = .45) {
  g.beginPath(); points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.closePath();
  g.fillStyle=fill; g.fill(); if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}
}
function line(g, color, width, points) {
  g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';
  g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();
}
function oval(g,fill,x,y,rx,ry,angle=0){g.fillStyle=fill;g.beginPath();g.ellipse(x,y,rx,ry,angle,0,TAU);g.fill();}
function light(g,x,y,w,h,colors){const v=g.createLinearGradient(x,y,x+w,y+h);colors.forEach((c,i)=>v.addColorStop(i/(colors.length-1),c));return v;}

export function samuraiStudySprite(team,frame=0,action='idle',variant=0){
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=304;
  const g=canvas.getContext('2d',{willReadFrequently:true});g.setTransform(4,0,0,4,120,244);
  const gait=action==='walk'?Math.sin(frame/8*TAU):0;
  const lift=action==='walk'?Math.abs(Math.cos(frame/8*TAU))*.65:0;
  const attack=action==='attack';
  // Wind-up, contact (frame 4) and follow-through share the engine's attack clock.
  const lean=attack?[0,-.8,-1.5,-.6,2.1,2.8,1.5,.4][frame]:gait*.25;
  const cloth=team?['#cc7155','#8b3832','#41272d']:['#789ca3','#365d70','#233343'];
  const lacquer=team?['#975548','#522e30','#251f29']:['#738186','#354951','#1c2934'];
  const gold=['#efe0a1','#b79a58','#655332'];
  const metal=['#e2e5d8','#7f9699','#30454e'];
  const armor=light(g,-6,-30,12,16,lacquer),silk=light(g,-7,-15,13,12,cloth);
  const steel=light(g,-6,-33,10,14,metal),brass=light(g,-3,-41,8,10,gold);
  // Cast shade and two grounded feet: feet remain fixed while the torso rises.
  oval(g,'#13221c18',6,1.7,14,2.8,.18);
  function leg(near){
    const side=near?1:-1,s=side*gait*3.6,x=side*2.6;
    const knee=[x+s*.4,-7+Math.abs(s)*.25],foot=[x+s+.7,0-Math.max(0,-side*gait)*1.8];
    line(g,near?'#414a43':'#252d31',4.3,[[x,-15],knee,foot]);
    line(g,near?'#8b9691':'#465452',2.1,[[knee[0]-.7,knee[1]+.4],[foot[0]-.6,foot[1]-2.3]]);
    for(let j=0;j<3;j++)line(g,'#273332',.45,[[knee[0]-1,knee[1]+j*1.2],[knee[0]+1.1,knee[1]+j*1.2]]);
    oval(g,near?'#bbb39a':'#6a7163',foot[0]+.7,foot[1],2.2,.8,-.12);
    line(g,'#343a30',.65,[[foot[0]-.2,foot[1]-.6],[foot[0]+1.1,foot[1]+.3]]);
  }
  leg(false);leg(true);
  g.translate(lean,-lift);
  // Scabbard sits behind the waist, not pasted over the weapon arm.
  line(g,'#191f27',1.8,[[-5,-17],[-14,-8]]);line(g,'#ad9362',.65,[[-5,-17],[-7,-15]]);
  // Hakama volume, skirt panels, warm light on upper-left edges.
  shape(g,silk,[[-5,-20],[5,-19],[7,-8],[2,-9],[0,-12],[-3,-8],[-7,-10]]);
  line(g,cloth[0],.65,[[-3,-17],[-4,-10]]);line(g,cloth[2],.7,[[1,-17],[2,-10]]);
  shape(g,armor,[[-5,-29],[3,-30],[7,-26],[6,-19],[0,-17],[-6,-20]]);
  shape(g,'#17242b70',[[3,-30],[7,-26],[6,-19],[3,-18]],null);
  // Five separate lacquer lames with lacing; no broad black contour.
  for(let y=-27;y<-19;y+=1.8){
    line(g,lacquer[0],.55,[[-4.7,y],[1,y+.5],[5.4,y-.1]]);
    line(g,'#111e26',.45,[[-4.7,y+.6],[1,y+1.1],[5.4,y+.5]]);
    for(const x of [-3,-1,2,4])line(g,variant===1?'#bba578':cloth[0],.45,[[x,y-.3],[x+.1,y+.7]]);
  }
  for(const x of [-5,-1,3]){
    shape(g,armor,[[x,-19],[x+3,-19],[x+4,-12],[x,-12.4]]);
    for(let y=-17.5;y<-12;y+=1.5)line(g,lacquer[0],.45,[[x+.3,y],[x+3,y+.2]]);
  }
  line(g,'#d0ba83',1.1,[[-5,-19.2],[1,-18.7],[6,-20]]);
  oval(g,'#bda064',1,-19,.8,.8);
  // Far arm, helmet neck guard and cheek planes.
  line(g,cloth[2],3.1,[[-5,-28],[-7,-23],[-3,-21]]);
  shape(g,armor,[[-5,-35],[3,-35],[6,-30],[3,-28],[-5,-30],[-7,-32]]);
  for(let y=-33;y<-29;y+=1.2)line(g,lacquer[0],.5,[[-5,y],[0,y+1],[5,y]]);
  oval(g,'#694d40',1,-34,3.3,3.7);
  shape(g,light(g,0,-37,5,4,['#dfbc8c','#a2775b','#61473e']),[[0,-37],[4,-36],[4.8,-33.5],[3.7,-33],[3.2,-30.9],[0,-31.5]]);
  shape(g,'#27363b',[[0,-33],[3.8,-32.8],[3,-30],[0,-30.8]]);
  line(g,'#baae8b',.4,[[.7,-31.8],[2.9,-31.4]]);
  line(g,'#20252a',.6,[[1.8,-35],[3.6,-34.8]]);
  // Kabuto: curved crown, overlapping rim, restrained brass crest.
  oval(g,steel,-.7,-37,4.8,3.5,-.08);
  shape(g,armor,[[-5,-37],[-3,-40.4],[0,-41],[2.9,-39],[4.2,-36.5],[6,-35.9],[2,-35.4],[-5.5,-35.9]]);
  line(g,'#a5b0a3',.65,[[-4,-37.3],[-2.9,-39.4],[-1.1,-40]]);
  line(g,'#72868a',.4,[[-1,-40],[.2,-36.2]]);
  line(g,brass,.9,[[-2.5,-37.5],[-5.1,-41],[-5.5,-43],[-3.6,-40.3],[.1,-38.3],[3.5,-40.3],[4,-42.4]]);
  oval(g,'#d7be77',-.3,-37.7,.85,.85);
  // Articulated upper arm, elbow and wrists follow a two-handed sword arc.
  const hands=attack?[[7,-23],[4,-29],[0,-34],[6,-32],[14,-21],[15,-18],[11,-20],[8,-23]][frame]:[8+gait*.45,-23];
  const elbow=[3+(hands[0]-3)*.45,-24+(hands[1]+24)*.5];
  line(g,cloth[1],3.1,[[4,-27],elbow,hands]);
  line(g,steel,1.8,[[elbow[0],elbow[1]], [hands[0]-.8,hands[1]+.6]]);
  // Broad near shoulder board reads as a solid, lit object.
  shape(g,armor,[[2,-29],[7,-28],[8,-22.5],[3,-23.2]]);
  for(let y=-27.8;y<-23;y+=1.25)line(g,lacquer[0],.55,[[3,y],[7,y+.4]]);
  line(g,'#dec88d',.55,[[2.5,-29],[7,-28]]);
  line(g,cloth[2],2.4,[[-4,-26],[-2,-22],[hands[0]-2,hands[1]+1]]);
  oval(g,'#d4b38c',hands[0]-1.5,hands[1]+.9,1.2,.95);
  oval(g,'#e0c29b',hands[0],hands[1],1.2,1.1);
  const angle=attack?[-.95,-1.7,-2.2,-1.25,.18,.5,-.1,-.8][frame]:-.95;
  g.save();g.translate(...hands);g.rotate(angle);
  line(g,'#202c32',1.35,[[-4,0],[2,0]]);
  for(let i=-3;i<1;i++)line(g,'#b6aa8a',.4,[[i,-.6],[i+.5,.6]]);
  oval(g,brass,2,0,.65,1.9);
  shape(g,light(g,3,-1,1,2,['#f4eed5','#b7cecf','#536c7b']),[[3,-.75],[19,-1.1],[22,-2],[20,.1],[3,.8]],'#4e6771',.25);
  line(g,'#f8f2d6',.45,[[3,-.75],[19,-1.1],[22,-2]]);g.restore();
  return canvas;
}

export class SamuraiStudyLibrary extends SpriteLibrary {
  constructor(){super();this.studyCache=new Map();}
  get(type,team,frame,action,variant=0){
    if(type!=='samurai')return super.get(type,team,frame,action,variant);
    const key=`${team}/${frame}/${action}/${variant}`;
    if(!this.studyCache.has(key))this.studyCache.set(key,samuraiStudySprite(team,frame,action,variant));
    return this.studyCache.get(key);
  }
}
