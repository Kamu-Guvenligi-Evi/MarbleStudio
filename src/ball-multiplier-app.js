import {BallMultiplier,normalizeMultiplier,MULTIPLIER_KEY} from './ball-multiplier.js';
import {renderMultiplier} from './ball-multiplier-renderer.js';
import {mountChannelPicker,getSelectedChannel} from './channel-branding.js';
import {mountMultiplierMusic} from './multiplier-music.js';
import {GameSoundPlayer,createGameSoundDirector} from './game-sound-director.js';
import {mountGameSoundPanel} from './game-sound-panel.js';
import {createWorkbench} from './workbench.js';
import './channel-picker.css';
import './ball-multiplier.css';

const $=id=>document.getElementById(id),mode='ball-multiplier';
mountChannelPicker(document.querySelector('.multiplier-header'));
document.querySelector('.studio-channel').firstChild.textContent='Channel';
let saved;try{saved=JSON.parse(localStorage.getItem(MULTIPLIER_KEY));}catch{}
// Upgrade the old default once; preserve deliberately chosen lower limits.
if(saved?.limit===800&&!localStorage.getItem(MULTIPLIER_KEY+'-population-v2'))saved.limit=2000;
try{localStorage.setItem(MULTIPLIER_KEY+'-population-v2','1');}catch{}
const settings=normalizeMultiplier(saved),ctx=$('multiplier-canvas').getContext('2d');
const sound=new GameSoundPlayer(mode,settings.soundStyle,settings.soundOverrides);
let game,paused=false,last=0,accumulator=0,needsPaint=true;
const canvas=$('multiplier-canvas');
function resizePreview(){
  const width=Math.min(1080,Math.max(270,Math.round(canvas.getBoundingClientRect().width*Math.min(devicePixelRatio||1,2))));
  const height=Math.round(width*16/9);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;needsPaint=true;}
}
new ResizeObserver(resizePreview).observe(canvas);
window.addEventListener('resize',resizePreview);
window.addEventListener('studio-channel-change',()=>{needsPaint=true;});
const save=()=>{try{localStorage.setItem(MULTIPLIER_KEY,JSON.stringify(settings));}catch{}};
const status=text=>{$('status').textContent=text;};
const music=mountMultiplierMusic({settings,save,notify:status});
let soundPanel;
function mountSoundMenu(){
  soundPanel?.remove();
  soundPanel=mountGameSoundPanel({mode,style:settings.soundStyle,overrides:settings.soundOverrides,
    onChange:style=>{settings.soundStyle=style;sound.setStyle(style);if(game)game.settings.soundStyle=style;save();},
    onOverrides:choices=>{settings.soundOverrides=choices;sound.setOverrides(choices);if(game)game.settings.soundOverrides=choices;save();},
    onPreview:async type=>{const cue=createGameSoundDirector(mode,settings.soundStyle,settings.soundOverrides)({type,energy:200},0);if(!cue)return false;await sound.unlock();sound.stop();return sound.play(cue);}
  });
}
mountSoundMenu();
const workbench=createWorkbench({capture:()=>({mode,project:{...settings}}),thumbnail:()=>$('multiplier-canvas').toDataURL('image/jpeg',.7),title:()=>settings.title||'Ball Multiplier',notify:status,isLocked:()=>false,getChannel:getSelectedChannel,openSnapshot:snapshot=>{Object.assign(settings,normalizeMultiplier(snapshot.project));mountSoundMenu();sync();music.sync();save();restart();}});
$('studio-export').onclick=()=>workbench.openExport();$('studio-videos').onclick=()=>workbench.openVideos();
function sync(){$('game-sound-style').value=settings.soundStyle;for(const id of ['title','count','radius','limit','duration','speed','gravity','seed','spawnOn'])$(id).value=settings[id];$('sound').textContent=settings.sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(settings.sound));}
function restart(){music.reset();sound.setStyle(settings.soundStyle);sound.setOverrides(settings.soundOverrides);game=new BallMultiplier(settings);game.onEvent=e=>{if(settings.sound&&!paused&&!document.hidden)sound.event(e);};paused=false;last=0;accumulator=0;needsPaint=true;$('pause').textContent='Pause';status('');}
for(const id of ['title','count','radius','limit','duration','speed','gravity','seed','spawnOn'])$(id).addEventListener(id==='title'?'input':'change',()=>{
  Object.assign(settings,normalizeMultiplier({...settings,[id]:$(id).value}));
  save();sync();needsPaint=true;if(id==='title')game.settings.title=settings.title;else restart();
});
$('new-game').onclick=()=>{settings.seed=crypto.getRandomValues(new Uint32Array(1))[0];save();sync();restart();};
$('replay').onclick=restart;
$('pause').onclick=()=>{paused=!paused;last=0;accumulator=0;needsPaint=true;if(paused){sound.stop();music.suspend();}$('pause').textContent=paused?'Resume':'Pause';};
$('sound').onclick=async()=>{settings.sound=!settings.sound;save();sync();if(!settings.sound){sound.stop();music.suspend();}else try{await sound.unlock();}catch{status('Sound could not start. Try again.');}};
document.addEventListener('pointerdown',()=>{if(settings.sound)sound.unlock().catch(()=>{});},{once:true});
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage').requestFullscreen();}catch{status('Full screen is unavailable.');}};
document.addEventListener('visibilitychange',()=>{last=0;accumulator=0;needsPaint=true;if(document.hidden){sound.stop();music.suspend();}});
function frame(now){
  // Render on the display clock; physics and video retain their own fixed steps.
  const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
  if(!paused&&!document.hidden&&game.state==='running'){
    accumulator+=dt*settings.speed;
    while(accumulator>=1/120&&game.state==='running'){game.step();accumulator-=1/120;}
    needsPaint=true;
  }
  music.update(!paused&&!document.hidden&&game.state==='running');
  if(needsPaint&&!document.hidden){renderMultiplier(ctx,game,{alpha:paused||game.state==='finished'?1:accumulator*120});needsPaint=false;}
  const label=`${game.balls.length} balls · ${Math.floor(game.time/settings.speed)}s${paused?' · Paused':game.state==='finished'?' · Complete':''}`;
  if($('match-state').textContent!==label)$('match-state').textContent=label;
  requestAnimationFrame(frame);
}
save();sync();restart();requestAnimationFrame(frame);
window.multiplierStudio={snapshot:()=>({...settings}),state:()=>({time:game.time,state:game.state,phase:game.phase,absorbed:game.absorbed,total:game.balls.length,births:game.births,collisions:game.collisions,paused})};
import {mountStudioNavigation} from './studio-navigation.js';
mountStudioNavigation('ball-multiplier');
