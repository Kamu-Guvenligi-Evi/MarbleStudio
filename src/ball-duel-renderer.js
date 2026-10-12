import {ballImage} from './ball-images.js';
import {WEAPONS} from './ball-duel.js';

const circle=(c,x,y,r)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);};
const readableColor=hex=>'#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*.65+255*.35).toString(16).padStart(2,'0')).join('');
function heart(c,x,y,size,fill){c.save();c.translate(x,y);c.scale(size/20,size/20);c.beginPath();c.moveTo(0,7);c.bezierCurveTo(-23,-7,-7,-20,0,-9);c.bezierCurveTo(7,-20,23,-7,0,7);c.fillStyle=fill;c.fill();c.restore();}
export function weaponIcon(c,type,x,y,angle=0,scale=1){
  c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.lineJoin='round';c.lineCap='round';c.lineWidth=2;c.strokeStyle='#f3f6ff';c.fillStyle=WEAPONS[type].color;
  if(type==='blade'){c.beginPath();c.moveTo(-9,3);c.lineTo(19,-3);c.lineTo(29,-9);c.lineTo(17,-10);c.lineTo(-10,-3);c.closePath();c.fill();c.stroke();c.strokeStyle='#b9a1ff';c.beginPath();c.moveTo(-9,-10);c.lineTo(-5,10);c.moveTo(-8,0);c.lineTo(-21,4);c.stroke();}
  else if(type==='rocket'){c.beginPath();c.moveTo(23,0);c.lineTo(12,-7);c.lineTo(-12,-7);c.lineTo(-18,-11);c.lineTo(-15,0);c.lineTo(-18,11);c.lineTo(-12,7);c.lineTo(12,7);c.closePath();c.fill();c.stroke();}
  else{c.fillRect(-12,-5,26,10);c.strokeRect(-12,-5,26,10);c.fillStyle='#ced8ec';c.fillRect(12,-3,type==='burst'?17:10,6);c.fillRect(-9,5,6,9);if(type==='scatter')c.fillRect(12,3,10,4);}
  c.restore();
}
export function renderDuel(c,game,{english=false,paused=false}={}){
  const p=game.settings,t=game.time,{x:cx,y:cy,r}=game.arena,w=c.canvas.width,h=c.canvas.height;
  c.save();c.scale(w/600,h/(600*16/9));
  const themes={midnight:['#111b30','#070b14','#6b9cb9'],gold:['#241c15','#0d0b0c','#eec680'],chrome:['#242c38','#090e17','#d2e8f5'],aurora:[`hsl(${(t*10+240)%360} 38% 16%)`,'#080d18',`hsl(${(t*10+150)%360} 75% 75%)`]};
  const [top,bottom,accent]=themes[p.theme],bg=c.createLinearGradient(0,0,600,1067);bg.addColorStop(0,top);bg.addColorStop(1,bottom);c.fillStyle=bg;c.fillRect(0,0,600,1067);c.translate(0,(600*16/9-960)/2);
  c.fillStyle='#93a6bf';c.font='600 11px "Segoe UI", sans-serif';c.textAlign='center';c.fillText(english?'MARBLE STUDIO  /  BALL DUEL':'MARBLE STUDIO  /  TOP DÜELLOSU',300,39);
  for(let i=0;i<2;i++){
    const left=i===0?38:322,ball=game.balls[i],color=readableColor(p.colors[i]);
    c.fillStyle=color;c.fillRect(left,64,3,22);c.font='700 21px "Segoe UI", sans-serif';c.textAlign='left';c.fillText(p.names[i],left+13,83,224);
    for(let k=0;k<p.hp;k++){const row=Math.floor(k/10),col=k%10;heart(c,left+9+col*22,112+row*22,12,k<ball.hp?color:'#ffffff15');}
    c.font='600 12px "Segoe UI", sans-serif';c.fillStyle='#95a5bc';c.fillText(`${ball.hp} / ${p.hp}`,left,169);
    const weapon=WEAPONS[ball.weapon];c.fillStyle=weapon?.color??'#95a5bc';c.textAlign='right';const labels={blaster:'Blaster',burst:'Rapid fire',scatter:'Scatter',rocket:'Rocket',blade:'Sword'};c.fillText(weapon?(english?labels[ball.weapon]:weapon.name):(english?'Unarmed':'Silahsız'),left+238,169);
  }
  c.textAlign='center';c.fillStyle='#ffffff35';c.font='800 13px "Segoe UI", sans-serif';c.fillText('VS',300,95);
  c.strokeStyle='#ffffff10';c.lineWidth=1;c.beginPath();c.moveTo(38,188);c.lineTo(562,188);c.stroke();
  c.fillStyle='#93a6bf';c.font='600 11px "Segoe UI", sans-serif';c.fillText(english?'LAST ONE STANDING':'SON AYAKTA KALAN KAZANIR',300,223);
  // Quiet arena texture and a bright, clean boundary; impacts never shake the camera.
  circle(c,cx,cy,r);c.fillStyle='#04091175';c.fill();c.save();c.clip();c.fillStyle='#b4ceee12';
  for(let y=270;y<770;y+=28)for(let x=50;x<555;x+=28){circle(c,x,y,.8);c.fill();}c.restore();
  circle(c,cx,cy,r+7);c.strokeStyle=p.theme==='aurora'?'#b8bcff22':accent+'22';c.lineWidth=1;c.stroke();
  circle(c,cx,cy,r);c.strokeStyle=accent;c.lineWidth=3;c.stroke();
  for(const pickup of game.pickups){const col=WEAPONS[pickup.weapon].color,pulse=1+Math.sin(t*3)*.06;c.save();c.translate(pickup.x,pickup.y);c.scale(pulse,pulse);circle(c,0,0,22);c.fillStyle='#172238';c.fill();c.strokeStyle=col;c.lineWidth=1.5;c.stroke();weaponIcon(c,pickup.weapon,0,0,-.55,.62);c.restore();}
  if(game.heart){const item=game.heart;c.save();c.globalAlpha=Math.min(1,(item.until-t)*2);circle(c,item.x,item.y,21);c.fillStyle='#261727';c.fill();c.strokeStyle='#ff92b0';c.lineWidth=1.5;c.stroke();heart(c,item.x,item.y+3,17+Math.sin(t*3)*.8,'#ff739b');c.restore();}
  for(const ball of game.balls){
    if(ball.hp<=0)continue;
    for(let i=0;i<ball.trail.length;i+=3){const point=ball.trail[i];circle(c,point.x,point.y,ball.r*(.4+i/ball.trail.length*.4));c.globalAlpha=i/ball.trail.length*.09;c.fillStyle=p.colors[ball.id];c.fill();}c.globalAlpha=1;
  }
  for(const b of game.bullets){c.strokeStyle=WEAPONS[b.weapon].color;c.lineWidth=b.r*1.7;c.lineCap='round';const speed=Math.hypot(b.vx,b.vy);c.beginPath();c.moveTo(b.x-b.vx/speed*(b.weapon==='rocket'?19:12),b.y-b.vy/speed*12);c.lineTo(b.x,b.y);c.stroke();circle(c,b.x,b.y,b.r*.65);c.fillStyle='#fff8dd';c.fill();}
  for(const ball of game.balls){
    if(ball.hp<=0)continue;const color=p.colors[ball.id],img=ballImage(p.ballImages[ball.id]);
    circle(c,ball.x,ball.y+4,ball.r+3);c.fillStyle='#00000055';c.fill();
    c.save();circle(c,ball.x,ball.y,ball.r);c.clip();
    if(img)c.drawImage(img,ball.x-ball.r,ball.y-ball.r,ball.r*2,ball.r*2);
    else{c.fillStyle=color;c.fill();c.fillStyle='#152337';c.font='800 24px "Segoe UI", sans-serif';c.textAlign='center';c.fillText(p.names[ball.id].slice(0,1).toUpperCase(),ball.x,ball.y+8);}
    const glaze=c.createRadialGradient(ball.x-10,ball.y-13,1,ball.x,ball.y,ball.r*1.2);glaze.addColorStop(0,'#ffffff30');glaze.addColorStop(.5,'#ffffff00');glaze.addColorStop(1,'#00000050');c.fillStyle=glaze;c.fillRect(ball.x-ball.r,ball.y-ball.r,ball.r*2,ball.r*2);if(ball.flash>0){c.fillStyle=`rgba(255,255,255,${ball.flash*2})`;c.fillRect(ball.x-ball.r,ball.y-ball.r,ball.r*2,ball.r*2);}c.restore();
    circle(c,ball.x,ball.y,ball.r);c.strokeStyle=color;c.lineWidth=2;c.stroke();
    if(ball.heal>0){c.save();c.globalAlpha=Math.min(1,ball.heal*3);circle(c,ball.x,ball.y,ball.r+5+(1-ball.heal/.65)*9);c.strokeStyle='#a6f3bf';c.lineWidth=2;c.stroke();c.textAlign='center';c.font='700 17px "Segoe UI", sans-serif';c.fillStyle='#a6f3bf';c.fillText('+1',ball.x,ball.y-ball.r-12-(.65-ball.heal)*18);c.restore();}
    const angle=ball.angle;if(ball.weapon)weaponIcon(c,ball.weapon,ball.x+Math.cos(angle)*31,ball.y+Math.sin(angle)*31,angle,.77);
    if(ball.swing>0){c.beginPath();c.arc(ball.x,ball.y,62,angle-.8,angle+.8);c.strokeStyle='#d0c0ff';c.lineWidth=3;c.stroke();}
    if(ball.weapon){c.beginPath();c.arc(ball.x,ball.y,ball.r+5,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,(ball.weaponUntil-t)/WEAPONS[ball.weapon].life));c.strokeStyle=WEAPONS[ball.weapon].color;c.lineWidth=2;c.stroke();}
  }
  for(const part of game.particles){c.globalAlpha=Math.min(1,part.life*3);c.fillStyle=p.colors[part.owner];c.fillRect(part.x-1.5,part.y-1.5,3,3);}c.globalAlpha=1;
  c.textAlign='center';c.font='600 14px "Segoe UI", sans-serif';c.fillStyle='#d1deef';c.fillText(`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`,300,819);
  c.fillStyle='#8191a9';c.font='12px "Segoe UI", sans-serif';c.fillText(english?'Collect weapons. Dodge. Survive.':'Silahı topla. Atıştan kaç. Hayatta kal.',300,848);
  for(let i=0;i<5;i++)weaponIcon(c,Object.keys(WEAPONS)[i],204+i*48,886,-.4,.5);
  c.font='10px "Segoe UI", sans-serif';c.fillStyle='#65758e';c.fillText('MARBLE STUDIO',300,930);
  if(game.state==='finished'||paused){
    c.fillStyle='#080d18b8';c.fillRect(35,cy-78,530,157);c.strokeStyle='#ffffff25';c.strokeRect(35.5,cy-77.5,529,156);
    c.font='600 12px "Segoe UI", sans-serif';c.fillStyle='#a0b1c9';c.fillText(paused?(english?'PAUSED':'DURAKLATILDI'):(english?'DUEL COMPLETE':'DÜELLO TAMAMLANDI'),300,cy-35);
    c.font='800 32px "Segoe UI", sans-serif';c.fillStyle=game.winner===null?'#edf5ff':p.colors[game.winner];c.fillText(paused?(english?'Ready when you are':'Hazır olduğunda devam et'):game.winner===null?(english?'Draw':'Berabere'):p.names[game.winner],300,cy+9,480);
    c.font='14px "Segoe UI", sans-serif';c.fillStyle='#b3c1d5';c.fillText(paused?'▶':game.winner===null?(english?'Both survived the time limit':'İki top da süre sonuna kadar hayatta kaldı'):(english?'Last one standing':'Son ayakta kalan'),300,cy+43);
  }
  c.restore();
}
