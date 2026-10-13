import {canvasLayer} from './canvas-layer.js';
import './breaker-layout.css';
import './glass-breaker.css';
import {GlassBreaker,WIDTH,HEIGHT,CX,CY,ARENA_RADIUS,BALL_LIMIT,WALL} from './glass-breaker.js';
import {GlassPaneRenderer} from './glass-pane-renderer.js';
import {GLASS_THEMES,themeColor} from './glass-themes.js';
import {setupBreakerWorkbench,videoRenderMode} from './breaker-workbench.js';
import {VIDEO_CHANNELS,getSelectedChannel,channelHandle,drawChannelWatermark} from './channel-branding.js';
import {GameSoundPlayer,createGameSoundDirector} from './game-sound-director.js';
import {mountGameSoundPanel,savedSoundStyle,savedSoundOverrides} from './game-sound-panel.js';
let videoChannel='';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
window.addEventListener('studio-channel-change',()=>draw());
const pane=document.createElement('canvas');pane.width=WIDTH;pane.height=HEIGHT;const glass=pane.getContext('2d');
const paneRenderer=new GlassPaneRenderer(glass);let speed=1,lastTime=0,lastUi=-1,muted=true;
const soundtrack=new GameSoundPlayer('glass-breaker',savedSoundStyle('glass-breaker'),savedSoundOverrides('glass-breaker'));
const soundEvent=event=>{if(!muted)soundtrack.event(event);};
const game=new GlassBreaker({onImpact:impact=>soundEvent({...impact,type:'ice'}),onWave:()=>soundEvent({type:'wave'})});
mountGameSoundPanel({mode:'glass-breaker',style:soundtrack.style,onChange:style=>soundtrack.setStyle(style),overrides:soundtrack.overrides,onOverrides:choices=>soundtrack.setOverrides(choices),onPreview:async type=>{
  const event=createGameSoundDirector('glass-breaker',soundtrack.style,soundtrack.overrides)({type,energy:200},0);
  if(!event)return false;await soundtrack.unlock();soundtrack.stop();return soundtrack.play(event);
}});
const themeStorageKey='marble-studio.glass-theme',ballSprites=new Map();
const liveColorsKey='marble-studio.glass-live-colors';
let liveColors=false,colorTime=0;
try{liveColors=localStorage.getItem(liveColorsKey)==='true';}catch{}
$('live-colors').checked=liveColors;
$('live-colors').onchange=()=>{liveColors=$('live-colors').checked;try{localStorage.setItem(liveColorsKey,String(liveColors));}catch{}draw();};
let themeId='spectrum',theme=GLASS_THEMES.spectrum;
try{const saved=localStorage.getItem(themeStorageKey);if(Object.hasOwn(GLASS_THEMES,saved))themeId=saved;}catch{}
function selectTheme(id,persist=true){
  if(!Object.hasOwn(GLASS_THEMES,id))return;
  themeId=id;theme=GLASS_THEMES[id];paneRenderer.setTheme(theme);ballSprites.clear();
  const layout=document.querySelector('.glass-layout');
  layout.style.setProperty('--theme-accent',theme.accent);layout.style.setProperty('--theme-halo',theme.halo+'55');layout.style.setProperty('--theme-background',theme.background);layout.style.setProperty('--theme-swatch',theme.swatch);
  for(const button of document.querySelectorAll('[data-theme]'))button.setAttribute('aria-pressed',String(button.dataset.theme===id));
  $('theme-name').textContent=theme.name;$('theme-detail').textContent=theme.detail+' · Cam, toplar ve parçalar';
  if(persist){try{localStorage.setItem(themeStorageKey,id);}catch{}$('status').textContent=`${theme.name} görünümü seçildi.`;draw();}
}
for(const [id,option] of Object.entries(GLASS_THEMES)){
  const button=document.createElement('button');button.type='button';button.className='theme-option';button.dataset.theme=id;button.setAttribute('aria-pressed','false');button.title=option.detail;
  const swatch=document.createElement('span');swatch.className='theme-swatch';swatch.style.background=option.swatch;swatch.setAttribute('aria-hidden','true');
  button.append(swatch,document.createTextNode(option.name));button.onclick=()=>selectTheme(id);$('theme-options').append(button);
}
selectTheme(themeId,false);
function ballSprite(ball,colorShift){
  const hue=(Math.round((ball.hue+colorShift)/3)*3%360+360)%360,key=`${hue}:${ball.radius}`;
  if(ballSprites.has(key))return ballSprites.get(key);
  const sprite=document.createElement('canvas'),r=ball.radius,center=r+12;
  sprite.width=sprite.height=center*2;const paint=sprite.getContext('2d');
  const fill=theme.metal?paint.createLinearGradient(center-r,center-r,center+r,center+r):paint.createRadialGradient(center-r*.3,center-r*.3,.3,center,center,r);
  const stops=theme.metal?[[0,94],[.24,79],[.44,61],[.52,30],[.76,73],[1,35]]:[[0,98],[.32,76],[1,43]];
  for(const [position,light] of stops)fill.addColorStop(position,themeColor(theme,hue+(position-.5)*(theme.hue===null?40:100),light));
  paint.shadowColor=themeColor(theme,hue,65,.65);paint.shadowBlur=6;paint.fillStyle=fill;paint.beginPath();paint.arc(center,center,r,0,Math.PI*2);paint.fill();paint.shadowBlur=0;
  paint.strokeStyle=themeColor(theme,hue,90,.45);paint.lineWidth=.65;paint.stroke();
  if(theme.metal){paint.fillStyle='#fff8';paint.beginPath();paint.ellipse(center-r*.28,center-r*.45,r*.3,r*.13,-.5,0,Math.PI*2);paint.fill();}
  ballSprites.set(key,sprite);return sprite;
}
function polygon(context,points){context.beginPath();points.forEach((p,i)=>i?context.lineTo(p.x,p.y):context.moveTo(p.x,p.y));context.closePath();}
function draw(){
  const colorShift=liveColors?colorTime*15%360:0;
  ctx.drawImage(canvasLayer(ctx,themeId,WIDTH,HEIGHT,ctx=>{  ctx.fillStyle=theme.background;ctx.fillRect(0,0,WIDTH,HEIGHT);
  const halo=ctx.createRadialGradient(CX,CY,80,CX,CY,350);halo.addColorStop(0,theme.halo+'33');halo.addColorStop(1,theme.halo+'00');ctx.fillStyle=halo;ctx.fillRect(0,100,WIDTH,700);
}),0,0,WIDTH,HEIGHT);
  ctx.textAlign='center';ctx.fillStyle='#91a8a0';ctx.font='10px Segoe UI';ctx.letterSpacing='3px';ctx.fillText(channelHandle(videoChannel||getSelectedChannel()),CX,133);ctx.letterSpacing='0px';
  ctx.fillStyle='#eff4f2';ctx.font='500 26px Segoe UI';ctx.fillText('Will all the glass break?',CX,177);
  paneRenderer.update(game.cells,game.revision);ctx.drawImage(pane,0,0);
  ctx.strokeStyle=theme.wall;ctx.lineWidth=1.3;ctx.beginPath();WALL.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
  ctx.beginPath();ctx.arc(500,325,16,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#d5e3dd';ctx.font='10px Segoe UI';ctx.fillText(`${game.wave}×`,500,329);
  for(const s of game.shards){
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.angle);ctx.scale(Math.max(.12,Math.abs(Math.cos(s.angle*.65))),1);const fade=s.life/s.maxLife;ctx.globalAlpha=fade*fade*.65;polygon(ctx,s.points);ctx.fillStyle=themeColor(theme,s.hue+colorShift,theme.metal?54+Math.cos(s.angle)*13:66);ctx.fill();ctx.strokeStyle=theme.wall+'66';ctx.lineWidth=.5;ctx.stroke();ctx.restore();
  }
  for(const b of game.balls){
    ctx.globalAlpha=b.opacity??1;
    for(let i=1;i<b.trail.length;i+=2){const p=b.trail[i];ctx.beginPath();ctx.arc(p.x,p.y,b.radius*(i/b.trail.length)*.85,0,Math.PI*2);ctx.fillStyle=themeColor(theme,b.hue+colorShift,66,i/b.trail.length*.18);ctx.fill();}
    const sprite=ballSprite(b,colorShift);ctx.drawImage(sprite,b.x-sprite.width/2,b.y-sprite.height/2);
  }
  ctx.globalAlpha=1;
  ctx.textAlign='center';ctx.fillStyle='#d5e3dd';ctx.font='15px Segoe UI';ctx.fillText('Glass broken',CX,728);ctx.font='500 39px Segoe UI';ctx.fillStyle=theme.accent;ctx.fillText(`${(game.progress*100).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1})}%`,CX,779);
  ctx.font='12px Segoe UI';ctx.fillStyle='#8da69b';ctx.fillText(`Wave ${game.wave}   ·   ${game.balls.length} marbles left   ·   ${speed}×`,CX,815);
  if(videoRenderMode){ctx.fillStyle='#59756a';ctx.font='11px Segoe UI';ctx.fillText(channelHandle(videoChannel||getSelectedChannel()),CX,884);}
  if(videoRenderMode)drawChannelWatermark(ctx,videoChannel);
  if(lastUi!==Math.floor(game.time*8)||game.state!=='running'){
    lastUi=Math.floor(game.time*8);$('broken').textContent=`${(game.progress*100).toLocaleString('tr-TR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`;$('balls').textContent=game.balls.length;
    $('progress-fill').style.width=`${game.progress*100}%`;document.querySelector('.progress').setAttribute('aria-valuenow',(game.progress*100).toFixed(1));$('add-ball').disabled=game.balls.length>=BALL_LIMIT||game.state!=='running';
  }
}
function updateOverlay(){
  const won=game.state==='won',paused=game.state==='paused';$('overlay').hidden=!won&&!paused;
  $('overlay-title').textContent=won?'All the glass is broken!':'Paused';$('overlay-detail').textContent=won?`${game.balls.length} marbles · ${Math.floor(game.time)} seconds`:'';
  $('resume').textContent=won?'Play again':'Resume';$('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',paused?'Resume':'Pause');
  if(won)$('status').textContent='Daire tamamen temizlendi.';
}
function pause(){if(game.state==='won')return;game.state=game.state==='paused'?'running':'paused';if(game.state==='paused')soundtrack.stop();lastTime=0;updateOverlay();draw();}
function restart(seed=game.seed){soundtrack.reset();const auto=$('auto-spawn').checked;game.reset(seed);game.automatic=auto;paneRenderer.reset();lastTime=0;lastUi=-1;updateOverlay();draw();$('status').textContent='Yeni oyun başladı.';}
function addBall(){if(game.state!=='running')return;if(game.spawnBall()){$('status').textContent=`${game.balls.length}. top yukarıdan bırakıldı.`;lastUi=-1;draw();}else $('status').textContent=`En fazla ${BALL_LIMIT} top eklenebilir.`;}
$('pause').onclick=pause;$('resume').onclick=()=>game.state==='won'?restart():pause();$('restart').onclick=()=>restart();$('new-glass').onclick=()=>restart((game.seed+7919)>>>0);$('add-ball').onclick=()=>addBall();$('auto-spawn').onchange=()=>{game.automatic=$('auto-spawn').checked;};
for(const button of document.querySelectorAll('[data-speed]'))button.onclick=()=>{speed=Number(button.dataset.speed);for(const b of document.querySelectorAll('[data-speed]'))b.setAttribute('aria-pressed',String(b===button));$('speed-value').textContent=`${speed}×`;draw();};
$('sound').onclick=async()=>{try{if(muted)await soundtrack.unlock();else soundtrack.stop();muted=!muted;$('sound').setAttribute('aria-pressed',String(!muted));$('sound').setAttribute('aria-label',muted?'Unmute':'Mute');}catch{$('status').textContent='Ses bu tarayıcıda açılamadı.';}};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.game-shell').requestFullscreen();}catch{$('status').textContent='Bu tarayıcı tam ekranı desteklemiyor.';}};
canvas.addEventListener('pointerdown',event=>{canvas.focus({preventScroll:true});const r=canvas.getBoundingClientRect(),scale=Math.min(r.width/WIDTH,r.height/HEIGHT);const target={x:(event.clientX-r.left-(r.width-WIDTH*scale)/2)/scale,y:(event.clientY-r.top-(r.height-HEIGHT*scale)/2)/scale};if(Math.hypot(target.x-CX,target.y-CY)<ARENA_RADIUS)addBall();});
window.addEventListener('keydown',event=>{if(event.target.closest('button,a,input,select,textarea')||event.repeat)return;if(event.code==='Space'){event.preventDefault();pause();}if(event.code==='KeyR')restart();if(event.code==='KeyA')addBall();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)soundtrack.stop();if(!videoRenderMode&&document.hidden&&game.state==='running'){game.state='paused';updateOverlay();}lastTime=0;});
function frame(time){const elapsed=lastTime?Math.min(.05,(time-lastTime)/1000):0;lastTime=time;const before=game.state;if(liveColors&&before==='running')colorTime+=elapsed;let remaining=elapsed*speed;while(remaining>0){const step=Math.min(.1,remaining);game.step(step);remaining-=step;}if(before!==game.state){if(game.state==='won')soundEvent({type:'won'});updateOverlay();}draw();requestAnimationFrame(frame);}
draw();if(!videoRenderMode)requestAnimationFrame(frame);
if(videoRenderMode)window.breakerVideo={reset(recipe,onImpact,channel){game.reset(recipe.seed);game.onImpact=event=>onImpact({...event,type:'ice'});game.onWave=()=>onImpact({type:'wave'});selectTheme(recipe.theme,false);liveColors=recipe.liveColors;colorTime=0;speed=recipe.playbackSpeed;videoChannel=VIDEO_CHANNELS.includes(channel)?channel:VIDEO_CHANNELS[0];paneRenderer.reset();lastUi=-1;},step:dt=>game.step(dt),state:()=>game.state,draw(time){colorTime=time;draw();return canvas;}};
setupBreakerWorkbench({canvas,getChannel:getSelectedChannel,capture:()=>({mode:'glass-breaker',project:{seed:game.seed,theme:themeId,liveColors,playbackSpeed:speed,sound:!muted,soundStyle:soundtrack.style,soundOverrides:{...soundtrack.overrides},name:'Cam Kırıcı'}})});
window.glassBreaker={getState:()=>({state:game.state,time:game.time,balls:game.balls.length,wave:game.wave,broken:game.broken,total:game.cells.length,progress:game.progress,shards:game.shards.length,automatic:game.automatic,speed,seed:game.seed,theme:themeId})};
window.glassBreaker.getAudioState=()=>({...soundtrack.state(),muted});

import './studio-workspace-layout.css';
import {mountStudioNavigation} from './studio-navigation.js';
mountStudioNavigation('glass-breaker');
