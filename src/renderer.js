import { drawMarble } from './marble-art.js';
import { drawFinale } from './finale.js';
import { drawSpace } from './space-art.js';
import { SECTION_LABELS, SECTION_LABELS_TR } from './race-copy.js';
import { drawLeaders } from './race-leaders.js';
const W=540,H=960,BG='#080e20';

export function renderRace(ctx,race,{cameraY,countdown,paused,trails=false,preview,suppressFinale=false}) {
  const text=(str,x,y,size,color='#edf7ff',align='center')=>{
    ctx.fillStyle=color;ctx.font=`600 ${size}px "Segoe UI",sans-serif`;ctx.textAlign=align;ctx.fillText(str,x,y,440);
  };
  const circle=(x,y,r,fill)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();};
  const path=body=>{
    ctx.beginPath();
    if(body.circleRadius)ctx.arc(body.position.x,body.position.y,body.circleRadius,0,Math.PI*2);
    else {body.vertices.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();}
  };
  ctx.setTransform(2,0,0,2,0,0);ctx.fillStyle=BG;ctx.fillRect(0,0,W,H);
  drawSpace(ctx,cameraY,race.time);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.save();ctx.translate(0,-cameraY);
  // World coordinates keep arena decoration anchored to the track.
  for(const section of race.sections) {
    if(section.endY<cameraY||section.y>cameraY+H)continue;
    const wash=ctx.createRadialGradient(270,section.y+260,0,270,section.y+260,390);
    wash.addColorStop(0,section.color+'20');wash.addColorStop(1,section.color+'00');
    ctx.fillStyle=wash;ctx.fillRect(27,section.y,486,section.endY-section.y);
    ctx.strokeStyle=section.color+'30';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(42,section.y+30);ctx.lineTo(498,section.y+30);ctx.stroke();
    text(String(section.sourceIndex+1).padStart(2,'0'),49,section.y+58,12,section.color,'left');
    text(((race.language==='tr'?SECTION_LABELS_TR:SECTION_LABELS)[section.type]??'Track section').toLocaleUpperCase(race.language==='tr'?'tr-TR':'en-US'),82,section.y+58,11,section.color+'b0','left');
  }
  for(const x of [28,511]) {
    ctx.fillStyle='#59dfff35';ctx.fillRect(x,cameraY,1,H);
    for(let y=Math.floor(cameraY/90)*90;y<cameraY+H;y+=90){ctx.fillStyle='#59dfff';ctx.fillRect(x,y,2,20);}
  }
  for(const body of race.obstacles) {
    if(body.bounds.max.y<cameraY||body.bounds.min.y>cameraY+H)continue;
    const {kind,gate,section}=body.plugin;
    const accent=race.sections[section]?.color??'#64eaff';
    const moving=['rotor','swing','drifter','pulse','gate'].includes(kind);
    if(gate?.open) {
      ctx.save();ctx.setLineDash([5,9]);ctx.lineDashOffset=-race.time*24;ctx.strokeStyle='#6bffd5';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(body.bounds.min.x,body.position.y);ctx.lineTo(body.bounds.max.x,body.position.y);ctx.stroke();ctx.restore();
      continue;
    }
    const {min,max}=body.bounds;
    const surface=ctx.createLinearGradient(min.x,min.y,max.x,max.y);
    surface.addColorStop(0,moving?'#f5ebff':'#c0d9ed');surface.addColorStop(.24,moving?accent:'#506b8b');surface.addColorStop(1,'#18243d');
    ctx.save();ctx.shadowColor=moving?accent:'#020612';ctx.shadowBlur=moving?12:4;ctx.shadowOffsetY=moving?0:4;
    path(body);ctx.fillStyle=kind==='wall'?'#17233b':surface;ctx.fill();ctx.restore();
    path(body);ctx.strokeStyle=kind==='wall'?'#2d4669':accent;ctx.lineWidth=1.3;ctx.stroke();
    if(body.circleRadius) {
      ctx.beginPath();ctx.arc(body.position.x,body.position.y,body.circleRadius*.65,0,Math.PI*2);
      ctx.strokeStyle=accent+'90';ctx.lineWidth=2;ctx.stroke();circle(body.position.x,body.position.y,3,'#eafaff');
    }
    if(kind==='rotor'||kind==='swing') {
      circle(body.position.x,body.position.y,8,'#10172c');circle(body.position.x,body.position.y,4,accent);
    }
  }
  const finishGlow=ctx.createLinearGradient(0,race.finishY-70,0,race.finishY+70);
  finishGlow.addColorStop(0,'#64eaff00');finishGlow.addColorStop(.5,'#64eaff45');finishGlow.addColorStop(1,'#64eaff00');
  ctx.fillStyle=finishGlow;ctx.fillRect(30,race.finishY-70,480,140);
  for(let i=0;i<24;i++)for(let row=0;row<2;row++) {
    ctx.fillStyle=(i+row)%2?'#142239':'#e9fbff';ctx.fillRect(30+i*20,race.finishY+row*10,20,10);
  }
  text(race.language==='tr'?'FİNİŞ':'FINISH',270,race.finishY-23,20,'#92f3ff');
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  for(const p of race.particles) {
    if(p.y<cameraY-20||p.y>cameraY+H+20)continue;
    ctx.globalAlpha=p.life;ctx.strokeStyle=p.color;ctx.lineWidth=1+p.life*1.5;
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*3,p.y-p.vy*3);ctx.stroke();
  }
  ctx.restore();
  for(const ball of race.balls) {
    const {x,y}=ball.body.position,r=ball.body.circleRadius;
    if(y<cameraY-80||y>cameraY+H+80)continue;
    if(trails&&ball.trail.length>1) {
      ctx.save();ctx.lineCap='round';const points=ball.trail;
      for(let i=1;i<points.length;i++) {
        ctx.globalAlpha=(i/points.length)*.4;ctx.strokeStyle=ball.color;ctx.lineWidth=(i/points.length)*r*.8;
        ctx.beginPath();ctx.moveTo(points[i-1].x,points[i-1].y);ctx.lineTo(points[i].x,points[i].y);ctx.stroke();
      }
      ctx.restore();
    }
  }
  // Draw every trail before every marble so a following trail cannot cover a face.
  for(const ball of race.balls) {
    const {x,y}=ball.body.position;
    if(y>=cameraY-80&&y<=cameraY+H+80)drawMarble(ctx,ball,x,y,ball.body.circleRadius);
  }
  ctx.restore();
  if(race.state!=='ready'&&!race.finished.length&&preview===null) {
    drawLeaders(ctx,race);
  }
  if(countdown>0) {
    ctx.fillStyle='#080e2070';ctx.fillRect(0,0,W,H);
    ctx.beginPath();ctx.arc(270,460,80,-Math.PI/2,-Math.PI/2+Math.PI*2*(countdown%1));ctx.strokeStyle='#76eeff';ctx.lineWidth=5;ctx.stroke();
    text(String(Math.ceil(countdown)),270,490,100);
  }else if(race.state==='ready'&&preview===null)text(race.language==='tr'?'Yarışmacını seç.':'Pick your racer.',270,125,18,'#a8cce5');
  if(race.finished.length&&preview===null&&!suppressFinale)drawFinale(ctx,race);
  if(paused&&preview===null) {
    ctx.fillStyle='#080e20ee';ctx.fillRect(165,433,210,64);text('Paused',270,473,18);
  }
}
