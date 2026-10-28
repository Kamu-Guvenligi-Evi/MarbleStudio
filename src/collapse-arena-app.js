import {CollapseArena,normalizeCollapse,DT} from './collapse-arena.js';
import {renderCollapse} from './collapse-arena-renderer.js';
import {GameSoundPlayer} from './game-sound-director.js';
import {setupBreakerWorkbench,videoRenderMode} from './breaker-workbench.js';
import {getSelectedChannel} from './channel-branding.js';
import {mountStudioNavigation} from './studio-navigation.js';
import './collapse-arena.css';
const $=id=>document.getElementById(id),key='marble-studio-collapse-arena-v3';
let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}');}catch{}
let settings=normalizeCollapse(saved),game=new CollapseArena(settings),paused=false,last=0,accumulator=0,channel='';
const canvas=$('game'),ctx=canvas.getContext('2d');
if(videoRenderMode){const w=Number(new URLSearchParams(location.search).get('render-width'));canvas.width=Number.isFinite(w)&&w>0?Math.min(2160,Math.ceil(w)):1080;canvas.height=Math.round(canvas.width*960/540);}
const sound=new GameSoundPlayer('collapse-arena','balanced');
function bind(){game.onEvent=e=>{if(settings.sound&&!paused&&!document.hidden&&!videoRenderMode)sound.event(e);};}bind();
function save(){try{localStorage.setItem(key,JSON.stringify(settings));}catch{$('status').textContent='Ayarlar bu tarayıcıda saklanamadı.';}}
function sync(){for(const id of ['title','seed','growth','fragments','playbackSpeed'])$(id).value=settings[id];$('sound').textContent=settings.sound?'Ses açık':'Ses kapalı';$('sound').setAttribute('aria-pressed',String(settings.sound));$('pause').textContent=paused?'Sürdür':'Duraklat';}
function draw(){renderCollapse(ctx,game,{channel:channel||getSelectedChannel(),paused});$('metrics').textContent=`${game.broken} kırılma · ${game.shards.length} parça · Arena %${Math.round(game.radius/230*100)} · ${game.time.toFixed(1)} sn${game.state==='won'?' · Tamamlandı':''}`;}
function restart(){sound.reset();game.reset(settings);bind();paused=false;last=0;accumulator=0;sync();draw();$('status').textContent='';}
function pause(){if(game.state==='won')return;paused=!paused;last=0;accumulator=0;sound.stop();sync();draw();}
for(const id of ['title','seed','growth','fragments','playbackSpeed'])$(id).addEventListener(id==='title'?'input':'change',()=>{settings=normalizeCollapse({...settings,[id]:$(id).value});save();if(id==='title'||id==='playbackSpeed'){game.settings={...settings};draw();}else restart();});
$('restart').onclick=restart;$('new-seed').onclick=()=>{settings.seed=crypto.getRandomValues(new Uint32Array(1))[0];save();restart();};$('pause').onclick=pause;
$('sound').onclick=async()=>{settings.sound=!settings.sound;game.settings.sound=settings.sound;save();sync();if(settings.sound){try{await sound.unlock();}catch{$('status').textContent='Ses başlatılamadı.';}}else sound.stop();};
document.addEventListener('pointerdown',()=>{if(settings.sound)sound.unlock().catch(()=>{});},{once:true});
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage').requestFullscreen();}catch{$('status').textContent='Tam ekran açılamadı.';}};
window.addEventListener('keydown',event=>{if(event.target.closest('input,select,textarea,button,a,summary')||event.repeat)return;if(event.code==='Space'){event.preventDefault();pause();}if(event.code==='KeyR')restart();});
document.addEventListener('visibilitychange',()=>{last=0;accumulator=0;if(document.hidden){sound.stop();if(!videoRenderMode&&game.state==='running'){paused=true;sync();}}});
window.addEventListener('studio-channel-change',draw);
function frame(now){
  const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
  if(!paused&&!document.hidden&&game.state==='running'){
    accumulator=Math.min(accumulator+dt*settings.playbackSpeed,6*DT);
    const deadline=performance.now()+8;
    while(accumulator>=DT&&game.state==='running'){
      game.step();accumulator-=DT;
      if(performance.now()>=deadline){accumulator=Math.min(accumulator,DT);break;}
    }
    draw();
  }
  requestAnimationFrame(frame);
}
if(videoRenderMode)window.breakerVideo={reset(recipe,onEvent,selectedChannel){settings=normalizeCollapse(recipe);game.reset(settings);game.onEvent=onEvent;channel=selectedChannel;paused=false;},step:dt=>game.step(dt),state:()=>game.state,draw(){draw();return canvas;}};
setupBreakerWorkbench({canvas,getChannel:getSelectedChannel,capture:()=>({mode:'collapse-arena',project:{...settings}})});
mountStudioNavigation('collapse-arena');sync();draw();if(!videoRenderMode)requestAnimationFrame(frame);
window.collapseArena={getState:()=>({...game.snapshot(),paused,speed:settings.playbackSpeed}),snapshot:()=>({...settings})};
