import {drawSpace} from './space-art.js';
import {drawMarble} from './marble-art.js';
import {drawLeaders} from './race-leaders.js';
import {raceName} from './race-copy.js';
import {TERRITORY_SHAPES,TERRITORY_BUFFS,TERRITORY_PICKUP_RADIUS} from './territory.js';
function buffIcon(ctx,type,x,y,size=12){
  ctx.save();ctx.translate(x,y);ctx.scale(size/12,size/12);ctx.beginPath();
  if(type==='speed'){ctx.moveTo(2,-11);ctx.lineTo(-7,2);ctx.lineTo(0,2);ctx.lineTo(-2,11);ctx.lineTo(8,-3);ctx.lineTo(1,-3);}
  else{ctx.moveTo(0,-10);ctx.lineTo(9,-6);ctx.lineTo(7,4);ctx.quadraticCurveTo(4,9,0,12);ctx.quadraticCurveTo(-4,9,-7,4);ctx.lineTo(-9,-6);}
  ctx.closePath();ctx.fillStyle=type==='speed'?'#ffe66d':'#8ce9ff';ctx.fill();ctx.restore();
}
export function renderTerritory(ctx,race,{countdown=0,paused=false}={}){
  const tr=race.language==='tr';ctx.setTransform(2,0,0,2,0,0);ctx.fillStyle='#080e20';ctx.fillRect(0,0,540,960);drawSpace(ctx,0,race.time);drawLeaders(ctx,race);
  const text=(s,x,y,size=16,color='#e8f5ff')=>{ctx.font=`600 ${size}px Segoe UI`;ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(s,x,y,488);};
  text(tr?'ALAN SAVAŞI':'TERRITORY BATTLE',270,204,18);text(`${tr?TERRITORY_SHAPES[race.arenaShape]:race.arenaShape.toUpperCase()} · ${Math.ceil(race.duration-race.time)}s · ${tr?'EN ÇOK ALANI KAP':'CLAIM THE MOST LAND'}`,270,231,12,'#93adc6');
  const path=()=>{ctx.beginPath();race.outline.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();};
  path();ctx.fillStyle='#263345';ctx.fill();ctx.save();ctx.clip();
  for(const i of race.valid){const owner=race.cells[i];if(owner<0)continue;const p=race.position(i);ctx.fillStyle=race.balls[owner].color+'bb';ctx.fillRect(p.x-3,p.y-3,6.2,6.2);}
  ctx.strokeStyle='#ffffff24';ctx.lineWidth=.8;ctx.beginPath();for(const i of race.valid)if(race.cells[i]>=0){const p=race.position(i);ctx.moveTo(p.x-3,p.y+3);ctx.lineTo(p.x+3,p.y-3);}ctx.stroke();
  ctx.strokeStyle='#ffffff0b';ctx.lineWidth=.5;for(let i=0;i<=80;i++){ctx.beginPath();ctx.moveTo(30+i*6,270);ctx.lineTo(30+i*6,750);ctx.moveTo(30,270+i*6);ctx.lineTo(510,270+i*6);ctx.stroke();}
  for(const b of race.balls)if(b.trail.length){ctx.beginPath();b.trail.forEach((cell,i)=>{const p=race.position(cell);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.lineTo(b.body.position.x,b.body.position.y);ctx.strokeStyle='#07101a';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle=b.color;ctx.lineWidth=2.5;ctx.stroke();}
  for(const pickup of race.pickups){const p=race.position(pickup.cell);ctx.beginPath();ctx.arc(p.x,p.y,TERRITORY_PICKUP_RADIUS,0,Math.PI*2);ctx.fillStyle='#091827ee';ctx.fill();ctx.strokeStyle=pickup.type==='speed'?'#ffe66d':'#8ce9ff';ctx.lineWidth=1.5;ctx.stroke();buffIcon(ctx,pickup.type,p.x,p.y,10);}
  ctx.restore();path();ctx.strokeStyle='#adcdf0';ctx.lineWidth=2;ctx.stroke();
  // Bodies stay fully visible at coastlines; shields sit behind every player.
  for(const b of race.balls)if(b.eliminatedAt===null&&b.shieldUntil>race.time){const {x,y}=b.body.position;ctx.beginPath();ctx.arc(x,y,b.body.circleRadius+6,0,Math.PI*2);ctx.fillStyle='#8ce9ff30';ctx.fill();ctx.strokeStyle='#8ce9ff';ctx.lineWidth=2;ctx.stroke();}
  for(const b of race.balls){
    if(b.eliminatedAt!==null)continue;
    const {x,y}=b.body.position,r=b.body.circleRadius;
    ctx.beginPath();ctx.arc(x,y,r+1,0,Math.PI*2);ctx.fillStyle='#050b17';ctx.fill();
    drawMarble(ctx,b,x,y,r);
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle='#f5f8ff';ctx.lineWidth=1;ctx.stroke();
    if(!b.imageSrc){ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fillStyle='#081020e8';ctx.fill();ctx.font='800 12px Segoe UI';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(String(b.id+1),x,y+4);}
    if(b.speedUntil>race.time)buffIcon(ctx,'speed',x+r+3,y-r-3,7);
  }
  const leaders=race.ranking().filter(b=>b.eliminatedAt===null).slice(0,3);leaders.forEach((b,i)=>{const x=270+(i-(leaders.length-1)/2)*170;ctx.fillStyle=b.color;ctx.fillRect(x-63,786,126,3);text(`${race.share(b).toFixed(1)}%`,x,822,25);text(raceName(race,b),x,847,12,'#bdd1e7');});
  const event=race.events[0];if(event){const name=raceName(race,race.balls[event.owner]);text(event.type==='elimination'?(tr?`${raceName(race,race.balls[event.cutter])}, ${name} oyuncusunu eledi · alanı devraldı`:`${raceName(race,race.balls[event.cutter])} eliminated ${name} and took their land`):event.type==='speed'?(tr?`${name} · ${TERRITORY_BUFFS.speed.duration} saniye hız artışı`:`${name} · ${TERRITORY_BUFFS.speed.duration} seconds of speed`):event.type==='shield'?(tr?`${name} · ${String(TERRITORY_BUFFS.shield.duration).replace('.',',')} saniye dokunulmazlık`:`${name} · ${TERRITORY_BUFFS.shield.duration} seconds of invincibility`):(tr?`${name} yeni alan ele geçirdi`:`${name} captured more land`),270,878,12,'#b5c9dd');}
  text(tr?`⚡ HIZ ×1,8 · ${TERRITORY_BUFFS.speed.duration} sn     ◇ DOKUNULMAZLIK · ${String(TERRITORY_BUFFS.shield.duration).replace('.',',')} sn`:`⚡ SPEED ×1.8 · ${TERRITORY_BUFFS.speed.duration}s     ◇ INVINCIBILITY · ${TERRITORY_BUFFS.shield.duration}s`,270,910,11,'#b8d3e9');
  text(tr?'AÇIK İZİNİ KORU. RAKİBİNİ ELE. ALANINI AL.':'PROTECT YOUR TRAIL. ELIMINATE RIVALS. TAKE THEIR LAND.',270,931,10,'#819cb9');
  if(race.state==='finished'){ctx.fillStyle='#080e20ef';ctx.beginPath();ctx.roundRect(65,367,410,260,22);ctx.fill();text(race.winners.length===1?(tr?'KAZANAN':'WINNER'):(tr?'BERABERE':'DRAW'),270,408,22,'#ffe29a');const winner=race.winners[0];drawMarble(ctx,winner,270,468,38);text(raceName(race,winner),270,533,23);text(`${race.share(winner).toFixed(1)}% ${tr?'ALAN':'TERRITORY'}`,270,574,20,winner.color);if(race.winners.length>1)text(race.winners.map(b=>raceName(race,b)).join(' / '),270,603,11);}
  if(countdown>0||paused){ctx.fillStyle='#080e20bb';ctx.beginPath();ctx.roundRect(165,465,210,85,15);ctx.fill();text(countdown>0?String(Math.ceil(countdown)):(tr?'Duraklatıldı':'Paused'),270,521,countdown>0?48:22);}
}
