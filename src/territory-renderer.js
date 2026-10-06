import {drawSpace} from './space-art.js';
import {drawMarble} from './marble-art.js';
import {drawLeaders} from './race-leaders.js';
import {raceName} from './race-copy.js';
import {TERRITORY_SHAPES} from './territory.js';
export function renderTerritory(ctx,race,{countdown=0,paused=false}={}){
  const tr=race.language==='tr';ctx.setTransform(2,0,0,2,0,0);ctx.fillStyle='#080e20';ctx.fillRect(0,0,540,960);drawSpace(ctx,0,race.time);drawLeaders(ctx,race);
  const text=(s,x,y,size=16,color='#e8f5ff')=>{ctx.font=`600 ${size}px Segoe UI`;ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(s,x,y,488);};
  text(tr?'ALAN SAVAŞI':'TERRITORY BATTLE',270,204,18);text(`${tr?TERRITORY_SHAPES[race.arenaShape]:race.arenaShape.toUpperCase()} · ${Math.ceil(race.duration-race.time)}s · ${tr?'EN ÇOK ALANI KAP':'CLAIM THE MOST LAND'}`,270,231,12,'#93adc6');
  const path=()=>{ctx.beginPath();race.outline.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();};
  path();ctx.fillStyle='#263345';ctx.fill();ctx.save();ctx.clip();
  for(const i of race.valid){const owner=race.cells[i];if(owner<0)continue;const p=race.position(i);ctx.fillStyle=race.balls[owner].color+'bb';ctx.fillRect(p.x-3,p.y-3,6.2,6.2);}
  ctx.strokeStyle='#ffffff0b';ctx.lineWidth=.5;for(let i=0;i<=80;i++){ctx.beginPath();ctx.moveTo(30+i*6,270);ctx.lineTo(30+i*6,750);ctx.moveTo(30,270+i*6);ctx.lineTo(510,270+i*6);ctx.stroke();}
  for(const b of race.balls)if(b.trail.length){ctx.beginPath();b.trail.forEach((cell,i)=>{const p=race.position(cell);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.lineTo(b.body.position.x,b.body.position.y);ctx.strokeStyle='#07101a';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle=b.color;ctx.lineWidth=2.5;ctx.stroke();}
  for(const b of race.balls)drawMarble(ctx,b,b.body.position.x,b.body.position.y,9);ctx.restore();path();ctx.strokeStyle='#adcdf0';ctx.lineWidth=2;ctx.stroke();
  const leaders=race.ranking().slice(0,3);leaders.forEach((b,i)=>{const x=100+i*170;ctx.fillStyle=b.color;ctx.fillRect(x-63,786,126,3);text(`${race.share(b).toFixed(1)}%`,x,822,25);text(raceName(race,b),x,847,12,'#bdd1e7');});
  const event=race.events[0];if(event)text(event.type==='cut'?(tr?`${raceName(race,race.balls[event.cutter])} rakibinin izini kesti`:`${raceName(race,race.balls[event.cutter])} cut a rival's trail`):(tr?`${raceName(race,race.balls[event.owner])} yeni alan ele geçirdi`:`${raceName(race,race.balls[event.owner])} captured more land`),270,878,12,'#b5c9dd');
  text(tr?'İZ ÇİZ. GERİ DÖN. ALANI ELE GEÇİR.':'DRAW A LOOP. RETURN HOME. CLAIM THE LAND.',270,916,11,'#819cb9');
  if(race.state==='finished'){ctx.fillStyle='#080e20ef';ctx.beginPath();ctx.roundRect(65,367,410,260,22);ctx.fill();text(race.winners.length===1?(tr?'KAZANAN':'WINNER'):(tr?'BERABERE':'DRAW'),270,408,22,'#ffe29a');const winner=race.winners[0];drawMarble(ctx,winner,270,468,38);text(raceName(race,winner),270,533,23);text(`${race.share(winner).toFixed(1)}% ${tr?'ALAN':'TERRITORY'}`,270,574,20,winner.color);if(race.winners.length>1)text(race.winners.map(b=>raceName(race,b)).join(' / '),270,603,11);}
  if(countdown>0||paused){ctx.fillStyle='#080e20bb';ctx.beginPath();ctx.roundRect(165,465,210,85,15);ctx.fill();text(countdown>0?String(Math.ceil(countdown)):(tr?'Duraklatıldı':'Paused'),270,521,countdown>0?48:22);}
}
