import './breaker-layout.css';
import {SpiralBreaker,WIDTH,HEIGHT,CELL,COLS,ROWS,BALL_LIMIT} from './spiral-breaker.js';
import {BREAKER_MAPS} from './breaker-maps.js';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const field=document.createElement('canvas');field.width=WIDTH;field.height=ROWS*CELL;
const tiles=field.getContext('2d');
let colors=BREAKER_MAPS[0].colors,speed=1,completionDelay=0;
let audio,muted=true,lastSound=0,keys=new Set(),lastTime=0,shownBroken=-1,shownBalls=-1;
const bonusStyles={multiply:{label:'×3',color:'#9564b3',name:'Toplar üçe katlandı'},add:{label:'+3',color:'#489d98',name:'Üç yeni top'},wide:{label:'↔',color:'#749e44',name:'Çubuk uzadı'},shrink:{label:'−',color:'#b78b2a',name:'Çubuk kısaldı'}};
function playSound(kind){
  if(kind==='finish'&&!game.broken)$('status').textContent='Top hedefe ulaştı; şimdi blokları kırabilir.';
  if(kind==='lost')$('status').textContent='Bütün toplar düştü. Tekrar deneyebilirsin.';
  if(muted||!audio||audio.state!=='running'||audio.currentTime-lastSound<.035)return;
  lastSound=audio.currentTime;const oscillator=audio.createOscillator(),gain=audio.createGain();
  oscillator.type='sine';oscillator.frequency.setValueAtTime(kind==='paddle'?410:kind==='lost'?160:740,audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(180,audio.currentTime+.07);
  gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.08);
  oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+.09);
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
}
const game=new SpiralBreaker({mapId:new URLSearchParams(location.search).get('map'),onBreak:index=>tiles.clearRect(index%COLS*CELL,Math.floor(index/COLS)*CELL,CELL,CELL),onHit:playSound,onBonus:(type,count)=>{$('status').textContent=count===BALL_LIMIT?`${BALL_LIMIT} top sahada · Top sınırına ulaşıldı`:`${bonusStyles[type].name} · ${count} top sahada`;}});
function rebuildField(){
  colors=game.map.colors;
  tiles.clearRect(0,0,field.width,field.height);
  game.cells.forEach((type,index)=>{
    if(!type)return;const x=index%COLS*CELL,y=Math.floor(index/COLS)*CELL;
    tiles.fillStyle=colors[type];tiles.fillRect(x,y,CELL,CELL);
    tiles.fillStyle='#00000030';tiles.fillRect(x,y,CELL,.65);tiles.fillRect(x,y,.65,CELL);
    tiles.fillStyle='#ffffff20';tiles.fillRect(x+1,y+CELL-1,CELL-1,.5);
  });
}
function rounded(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function drawMascots(){
  ctx.save();ctx.translate(76,742);ctx.rotate(-.06);
  ctx.shadowColor='#0008';ctx.shadowBlur=8;ctx.shadowOffsetY=5;
  ctx.beginPath();ctx.moveTo(20,18);ctx.bezierCurveTo(-2,18,-13,86,3,96);ctx.bezierCurveTo(17,109,32,91,38,89);ctx.lineTo(78,89);ctx.bezierCurveTo(91,102,107,107,112,92);ctx.bezierCurveTo(121,75,109,21,91,18);ctx.closePath();ctx.fillStyle='#363e51';ctx.fill();ctx.strokeStyle='#e1e7e5';ctx.lineWidth=2.5;ctx.stroke();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  rounded(38,11,36,10,4,'#2e3340','#d4dad7');
  ctx.strokeStyle='#151923';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(15,54);ctx.lineTo(35,54);ctx.moveTo(25,44);ctx.lineTo(25,64);ctx.stroke();
  ctx.strokeStyle='#727b90';ctx.lineWidth=4;ctx.stroke();
  for(const [x,y,color] of [[88,45,'#54c966'],[97,54,'#f27768'],[79,54,'#70afed'],[88,63,'#e6c755']]){ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
  for(const x of [48,65]){ctx.beginPath();ctx.ellipse(x,53,5,6,0,0,Math.PI*2);ctx.fillStyle='#f4f5f1';ctx.fill();ctx.beginPath();ctx.arc(x+1,52,2.8,0,Math.PI*2);ctx.fillStyle='#1d202a';ctx.fill();}
  ctx.beginPath();ctx.arc(57,62,7,.15,Math.PI-.15);ctx.strokeStyle='#0f1720';ctx.lineWidth=2;ctx.stroke();
  ctx.restore();ctx.save();ctx.translate(370,750);ctx.rotate(-.035);rounded(0,0,73,63,5,'#797f89','#a3a8ae');rounded(4,4,65,53,3,'#949aa3');
  ctx.strokeStyle='#242831';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(12,18);ctx.lineTo(31,22);ctx.moveTo(46,18);ctx.quadraticCurveTo(54,10,61,14);ctx.stroke();
  for(const x of [24,51]){ctx.beginPath();ctx.ellipse(x,28,6,3,0,0,Math.PI*2);ctx.fillStyle='#e9eeed';ctx.fill();ctx.beginPath();ctx.arc(x+1,28,2.4,0,Math.PI*2);ctx.fillStyle='#20252c';ctx.fill();}
  ctx.beginPath();ctx.moveTo(26,43);ctx.quadraticCurveTo(38,53,51,39);ctx.stroke();ctx.restore();
}
function render(){
  ctx.fillStyle='#111516';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.drawImage(field,0,0);
  if(!game.broken){
    const [x,y]=game.path.at(-1);ctx.strokeStyle=colors[4];ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(x,y,7+Math.sin(game.time*3)*2,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=colors[4];ctx.fillRect(x-2,y-2,4,4);
  }
  for(const particle of game.particles){ctx.globalAlpha=particle.life*2;ctx.fillStyle=colors[particle.type];ctx.fillRect(particle.x,particle.y,2,2);}ctx.globalAlpha=1;
  for(const bonus of game.bonuses){
    if(bonus.collected)continue;
    const style=bonusStyles[bonus.type];rounded(bonus.x-16,bonus.y-16,32,32,3,style.color,'#ffffff40');
    ctx.fillStyle='#fff';ctx.font='bold 22px Segoe UI';ctx.textAlign='center';ctx.fillText(style.label,bonus.x,bonus.y+8);ctx.textAlign='left';
  }
  const p=game.paddle;ctx.shadowColor='#edb92555';ctx.shadowBlur=9;rounded(p.x-p.width/2,p.y,p.width,p.height,5,'#e5ad25','#f7d966');ctx.shadowBlur=0;
  ctx.fillStyle='#f9ffff';ctx.beginPath();for(const b of game.balls){ctx.moveTo(b.x+b.radius,b.y);ctx.arc(b.x,b.y,b.radius,0,Math.PI*2);}ctx.fill();
  rounded(18,561,game.balls.length>99?91:64,27,8,'#090d0ec9');ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(31,574,5.4,0,Math.PI*2);ctx.fill();ctx.font='18px Segoe UI';ctx.fillText(game.balls.length.toLocaleString('tr-TR'),44,580);
  drawMascots();
  const progress=game.broken/game.initialBlocks;
  ctx.fillStyle=colors[3];ctx.font='600 13px Segoe UI';ctx.fillText(`${String(BREAKER_MAPS.indexOf(game.map)+1).padStart(2,'0')} / 06`,24,863);
  ctx.fillStyle='#f4f8f6';ctx.font='600 27px Segoe UI';ctx.fillText(game.map.name,24,900);
  ctx.font='13px Segoe UI';ctx.fillStyle='#95aaa2';ctx.fillText(game.broken?'ZİNCİRLEME KIRILMA':'HEDEFE ULAŞ → BLOKLARI KIR',24,925);
  ctx.textAlign='right';ctx.fillStyle='#e2eee7';ctx.font='600 25px Segoe UI';ctx.fillText(`${Math.floor(progress*100)}%`,WIDTH-24,900);
  ctx.font='13px Segoe UI';ctx.fillStyle='#95aaa2';ctx.fillText(`${Math.floor(game.time/60)}:${String(Math.floor(game.time%60)).padStart(2,'0')} · ${speed}×`,WIDTH-24,925);ctx.textAlign='left';
  if(shownBroken!==game.broken){shownBroken=game.broken;$('broken').textContent=game.broken.toLocaleString('tr-TR');const progress=game.broken/game.initialBlocks*100;$('progress-fill').style.width=`${progress}%`;document.querySelector('.progress').setAttribute('aria-valuenow',String(Math.round(progress)));}
  if(shownBalls!==game.balls.length){shownBalls=game.balls.length;$('balls').textContent=game.balls.length.toLocaleString('tr-TR');}
}
function updateOverlay(){
  const won=game.state==='won',lost=game.state==='lost',paused=game.state==='paused';$('overlay').hidden=!won&&!lost&&!paused;$('overlay-title').textContent=won?`${game.map.name} tamamlandı!`:lost?'Toplar bitti':'Duraklatıldı';$('resume').textContent=won||lost?'Tekrar oyna':'Devam et';$('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',paused?'Devam et':'Duraklat');
  $('next-countdown').textContent='';
  if(won)$('status').textContent='Haritadaki bütün bloklar temizlendi.';
}
function pause(){if(game.state!=='running'&&game.state!=='paused')return;game.state=game.state==='running'?'paused':'running';updateOverlay();}
function restart(mapId=game.map.id){const automatic=game.automatic;game.reset(typeof mapId==='string'?mapId:game.map.id);game.automatic=automatic;completionDelay=0;shownBroken=-1;shownBalls=-1;lastTime=0;keys.clear();rebuildField();updateMapPicker();updateOverlay();$('status').textContent=`${game.map.name} başladı.`;render();}
function updateMapPicker(){
  for(const button of $('map-picker').children)button.setAttribute('aria-pressed',String(button.dataset.map===game.map.id));
  const url=new URL(location.href);url.searchParams.set('map',game.map.id);history.replaceState(null,'',url);
  document.title=`${game.map.name} · Marble Studio`;
}
function nextMap(){restart(BREAKER_MAPS[(BREAKER_MAPS.indexOf(game.map)+1)%BREAKER_MAPS.length].id);}
for(const map of BREAKER_MAPS){
  const button=document.createElement('button');button.className='map-card';button.dataset.map=map.id;button.setAttribute('aria-label',map.name);button.title=map.tag;
  const points=map.path.map(point=>point.join(',')).join(' ');
  button.innerHTML=`<svg viewBox="0 0 540 555" aria-hidden="true"><rect width="540" height="555" rx="25" fill="${map.colors[3]}"/><polyline points="${points}" fill="none" stroke="${map.colors[2]}" stroke-width="70"/><polyline points="${points}" fill="none" stroke="${map.colors[1]}" stroke-width="50"/><polyline points="${points}" fill="none" stroke="#111516" stroke-width="28"/><circle cx="${map.path.at(-1)[0]}" cy="${map.path.at(-1)[1]}" r="12" fill="${map.colors[4]}"/></svg><span>${map.name}</span>`;
  button.onclick=()=>restart(map.id);$('map-picker').append(button);
}
$('next-map').onclick=nextMap;
$('speed').onchange=()=>{speed=Number($('speed').value);};
$('sequence').onchange=()=>{completionDelay=0;updateOverlay();};
$('watch-tour').onclick=()=>{setAutomatic(true);speed=1.5;$('speed').value='1.5';$('sequence').checked=true;restart('stairs');canvas.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
$('cinema').onclick=()=>{const active=document.body.classList.toggle('cinema-mode');$('cinema').setAttribute('aria-pressed',String(active));$('cinema').setAttribute('aria-label',active?'Haritaları göster':'Odak görünümü');};
function setAutomatic(value){game.automatic=value;keys.clear();$('auto').setAttribute('aria-pressed',String(value));$('manual').setAttribute('aria-pressed',String(!value));$('control-hint').textContent=value?'Çubuk topu takip eder. Sen akışı izle.':'Çubuğu fareyle, parmağınla veya ← → tuşlarıyla hareket ettir.';}
$('auto').onclick=()=>setAutomatic(true);$('manual').onclick=()=>setAutomatic(false);$('pause').onclick=pause;$('restart').onclick=restart;$('resume').onclick=()=>game.state==='won'||game.state==='lost'?restart():pause();
$('sound').onclick=async()=>{muted=!muted;if(!muted){audio??=new AudioContext();await audio.resume();}$('sound').setAttribute('aria-pressed',String(!muted));$('sound').setAttribute('aria-label',muted?'Sesi aç':'Sesi kapat');};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.game-shell').requestFullscreen();}catch{$('status').textContent='Bu tarayıcı tam ekranı desteklemiyor.';}};
function pointer(event){if(game.automatic)return;const rect=canvas.getBoundingClientRect();game.movePaddle((event.clientX-rect.left)/rect.width*WIDTH);}
canvas.addEventListener('pointerdown',event=>{canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);pointer(event);});canvas.addEventListener('pointermove',pointer);
window.addEventListener('keydown',event=>{
  if(event.target.closest('button,a,select,input'))return;
  if(['Space','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
  if(event.code==='Space'&&!event.repeat)pause();if(event.code==='KeyR'&&!event.repeat)restart();keys.add(event.code);
});window.addEventListener('keyup',event=>keys.delete(event.code));window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.state==='running'){game.state='paused';updateOverlay();}lastTime=0;});
function frame(time){const dt=lastTime?Math.min(.05,(time-lastTime)/1000):0;lastTime=time;
  if(!game.automatic&&game.state==='running')game.movePaddle(game.paddle.x+((keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0))*480*dt);
  const state=game.state;game.step(dt*speed);if(game.state!==state)updateOverlay();
  if(game.state==='won'&&game.automatic&&$('sequence').checked&&!document.hidden){
    completionDelay+=dt;$('next-countdown').textContent=`Sıradaki harita ${Math.max(1,Math.ceil(4-completionDelay))} saniye içinde`;
    if(completionDelay>=4)nextMap();
  }
  render();requestAnimationFrame(frame);
}
updateMapPicker();rebuildField();render();requestAnimationFrame(frame);
// Small read-only hook for local browser checks.
window.spiralBreaker={getState:()=>({mapId:game.map.id,speed,sequence:$('sequence').checked,state:game.state,time:game.time,broken:game.broken,balls:game.balls.length,bonuses:game.bonusCount,armed:game.balls.filter(b=>b.armed).length,falling:game.bonuses.map(b=>({...b})),automatic:game.automatic,paddleX:game.paddle.x,paddleWidth:game.paddle.width,ball:{...game.ball}})};
