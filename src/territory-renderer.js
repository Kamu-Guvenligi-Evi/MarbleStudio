import {drawChannelWatermark} from './channel-branding.js';
import {drawSpace} from './space-art.js';
import {drawMarble} from './marble-art.js';
import {raceName} from './race-copy.js';
import {TERRITORY_BUFFS,TERRITORY_PICKUP_RADIUS} from './territory.js';

export const TERRITORY_RESULT_DELAY=1.4;
// Routine captures cannot overwrite an elimination before it can be read.
export function territoryHighlights(race,now=race.time){
  const feed=race.events.filter(e=>e.type==='elimination'&&now-e.time<6).slice(0,3);
  return {headline:feed.find(e=>now-e.time<2)??race.events.find(e=>e.type==='claim'&&now-e.time<1.4),feed};
}
function buffIcon(ctx,type,x,y,size=12){
  ctx.save();ctx.translate(x,y);ctx.scale(size/12,size/12);ctx.beginPath();
  if(type==='speed'){ctx.moveTo(2,-11);ctx.lineTo(-7,2);ctx.lineTo(0,2);ctx.lineTo(-2,11);ctx.lineTo(8,-3);ctx.lineTo(1,-3);}
  else{ctx.moveTo(0,-10);ctx.lineTo(9,-6);ctx.lineTo(7,4);ctx.quadraticCurveTo(4,9,0,12);ctx.quadraticCurveTo(-4,9,-7,4);ctx.lineTo(-9,-6);}
  ctx.closePath();ctx.fillStyle=type==='speed'?'#ffe66d':'#8ce9ff';ctx.fill();ctx.restore();
}
export function renderTerritory(ctx,race,{countdown=0,paused=false,channel,resultElapsed=0}={}){
  const now=race.time+(race.state==='finished'?resultElapsed:0),alive=race.ranking().filter(b=>b.eliminatedAt===null),leaders=alive.slice(0,3);
  ctx.setTransform(2,0,0,2,0,0);ctx.fillStyle='#080e20';ctx.fillRect(0,0,540,960);drawSpace(ctx,0,now);
  const text=(s,x,y,size=16,color='#e8f5ff',width=488)=>{ctx.font=`700 ${size}px Segoe UI`;ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(s,x,y,width);};
  text('TERRITORY BATTLE',270,38,25);text(`${alive.length} / ${race.balls.length} ALIVE`,95,65,13,'#9bb4cc');text(`${Math.max(0,Math.ceil(race.duration-race.time))}s`,451,65,18,race.duration-race.time<10?'#ffbb80':'#e8f5ff');
  leaders.forEach((b,i)=>{const x=270+(i-(leaders.length-1)/2)*166;ctx.fillStyle='#142238';ctx.beginPath();ctx.roundRect(x-78,78,156,57,10);ctx.fill();drawMarble(ctx,b,x-54,98,12);text(`${race.share(b).toFixed(1)}%`,x+13,105,23,b.color,105);text(raceName(race,b),x,126,12,'#d5e3f0',140);});
  ctx.fillStyle='#273448';ctx.fillRect(30,146,480,7);let shareX=30;for(const b of race.balls){const width=race.share(b)*4.8;ctx.fillStyle=b.color;ctx.fillRect(shareX,146,width,7);shareX+=width;}
  const opening=race.opening(),finalDuel=alive.length===2&&race.balls.length>2;
  text(opening?`BUILD YOUR TERRITORY · SHIELDS ${Math.max(1,Math.ceil(race.openingDuration-race.time))}s`:race.state==='finished'?'THE FINAL MOVE':finalDuel?'FINAL DUEL · EVERY TRAIL COUNTS':'CLOSE YOUR LOOP. CLAIM THE LAND.',270,176,13,opening?'#8ce9ff':finalDuel?'#ffe29a':'#9bb4cc');
  const path=()=>{ctx.beginPath();race.outline.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();};
  path();ctx.fillStyle='#202e42';ctx.fill();ctx.save();ctx.clip();
  for(const i of race.valid){const owner=race.cells[i];if(owner<0)continue;const p=race.position(i);ctx.fillStyle=race.balls[owner].color+'b8';ctx.fillRect(p.x-3,p.y-3,6.2,6.2);}
  drawChannelWatermark(ctx,channel);
  ctx.strokeStyle='#080e2045';ctx.lineWidth=1;ctx.beginPath();for(const i of race.valid){if(race.cells[i]<0)continue;const p=race.position(i);if(race.cells[i+1]!==race.cells[i]){ctx.moveTo(p.x+3,p.y-3);ctx.lineTo(p.x+3,p.y+3);}if(race.cells[i+80]!==race.cells[i]){ctx.moveTo(p.x-3,p.y+3);ctx.lineTo(p.x+3,p.y+3);}}ctx.stroke();
  for(const event of race.events){const age=now-event.time;if(age<0||age>1.15||!event.changedCells)continue;ctx.fillStyle=`rgba(255,255,255,${.5*(1-age/1.15)})`;for(const i of event.changedCells){const p=race.position(i);ctx.fillRect(p.x-3,p.y-3,6.2,6.2);}}
  for(const b of alive)if(b.trail.length){ctx.beginPath();b.trail.forEach((cell,i)=>{const p=race.position(cell);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.lineTo(b.body.position.x,b.body.position.y);ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle='#050a16';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle=b.color;ctx.lineWidth=4.5;ctx.stroke();ctx.strokeStyle='#ffffff90';ctx.lineWidth=1;ctx.stroke();}
  for(const pickup of race.pickups){const p=race.position(pickup.cell);ctx.beginPath();ctx.arc(p.x,p.y,TERRITORY_PICKUP_RADIUS+3,0,Math.PI*2);ctx.fillStyle='#071325';ctx.fill();ctx.strokeStyle=pickup.type==='speed'?'#ffe66d':'#8ce9ff';ctx.lineWidth=1.5;ctx.stroke();buffIcon(ctx,pickup.type,p.x,p.y);}
  ctx.restore();path();ctx.strokeStyle=finalDuel?'#f4d68a':'#7b9db4';ctx.lineWidth=2;ctx.stroke();
  for(const b of alive){const {x,y}=b.body.position,r=b.body.circleRadius;
    if(race.protected(b)){ctx.beginPath();ctx.arc(x,y,r+6,0,Math.PI*2);ctx.fillStyle='#8ce9ff25';ctx.fill();ctx.strokeStyle='#8ce9ff';ctx.lineWidth=2;ctx.stroke();}
    ctx.beginPath();ctx.arc(x,y,r+2,0,Math.PI*2);ctx.fillStyle='#050b17';ctx.fill();drawMarble(ctx,b,x,y,r);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
    if(!b.imageSrc){ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fillStyle='#081020e8';ctx.fill();text(String(b.id+1),x,y+4,12);}
    if(b.speedUntil>race.time)buffIcon(ctx,'speed',x+r+3,y-r-3,7);
  }
  for(const event of race.events.slice(0,24)){const age=now-event.time;if(age<0||age>1.4||!event.position)continue;const {x,y}=event.position;ctx.save();ctx.globalAlpha=Math.min(1,(1.4-age)*2);
    if(event.type==='elimination'){
      ctx.strokeStyle='#fff0cd';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,14+age*42,0,Math.PI*2);ctx.stroke();
      if(event.cutPosition){ctx.beginPath();ctx.moveTo(event.cutPosition.x,event.cutPosition.y);ctx.lineTo(x,y);ctx.setLineDash([4,5]);ctx.stroke();ctx.setLineDash([]);}
      if(event.trail?.length){ctx.beginPath();event.trail.forEach((cell,i)=>{const p=race.position(cell);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.strokeStyle=race.balls[event.owner].color;ctx.lineWidth=4;ctx.setLineDash([4,6]);ctx.stroke();ctx.setLineDash([]);}
      text('OUT',Math.max(60,Math.min(480,x)),Math.max(214,y-20-age*16),17,'#fff0cd',100);
    }else text(`+${(event.cells/race.valid.length*100).toFixed(1)}%`,Math.max(65,Math.min(475,x)),Math.max(214,y-18-age*18),17,'#fff',100);
    ctx.restore();
  }
  const {headline,feed}=territoryHighlights(race,now);ctx.fillStyle='#111e32';ctx.beginPath();ctx.roundRect(24,818,492,97,12);ctx.fill();
  if(headline?.type==='elimination'){const attacker=race.balls[headline.cutter],victim=race.balls[headline.owner];text(`${raceName(race,attacker)}  ×  ${raceName(race,victim)}`,270,845,18,attacker.color,462);text(`ELIMINATED · +${(headline.cells/race.valid.length*100).toFixed(1)}% TERRITORY`,270,866,12,'#d2dfec');}
  else if(headline){const b=race.balls[headline.owner];text(`${raceName(race,b)} CLAIMS +${(headline.cells/race.valid.length*100).toFixed(1)}%`,270,849,18,b.color,460);}
  else{text(finalDuel?'TWO LEFT. ONE TERRITORY.':'CUT AN OPEN TRAIL TO ELIMINATE.',270,848,16);text(opening?'Opening shields protect every player.':'The most land at the buzzer wins.',270,868,12,'#a4b9cd');}
  const older=feed.filter(e=>e!==headline).slice(0,2);if(older.length)text(older.map(e=>`${raceName(race,race.balls[e.cutter])} › ${raceName(race,race.balls[e.owner])}`).join('   ·   '),270,898,12,'#a4b9cd',460);
  text(`SPEED ×1.8 · ${TERRITORY_BUFFS.speed.duration}s     SHIELD · ${TERRITORY_BUFFS.shield.duration}s`,270,942,12,'#91abc4');
  if(race.state==='finished'&&resultElapsed>=TERRITORY_RESULT_DELAY){ctx.fillStyle='#080e20eb';ctx.beginPath();ctx.roundRect(56,343,428,268,22);ctx.fill();const winner=race.winners[0];text(race.winners.length===1?'WINNER':'DRAW',270,385,22,'#ffe29a');drawMarble(ctx,winner,270,444,37);text(raceName(race,winner),270,505,24,winner.color,390);text(`${race.share(winner).toFixed(1)}% TERRITORY · ${winner.cuts} ELIMINATIONS`,270,544,16);text(race.winners.length>1?race.winners.map(b=>raceName(race,b)).join(' / '):alive.length===1?'LAST PLAYER STANDING':'MOST TERRITORY AT THE BUZZER',270,582,12,'#9bb4cc',392);}
  if(countdown>0||paused){ctx.fillStyle='#080e20dd';ctx.beginPath();ctx.roundRect(165,454,210,92,15);ctx.fill();text(countdown>0?String(Math.ceil(countdown)):'Paused',270,516,countdown>0?48:22);}
}
