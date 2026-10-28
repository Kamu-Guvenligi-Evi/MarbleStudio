import {GoalArena,normalizeGoalArena,GOAL_ARENA_KEY} from './goal-arena.js';
import {renderGoalArena} from './goal-arena-renderer.js';
import {mountChannelPicker,getSelectedChannel} from './channel-branding.js';
import {mountMultiplierMusic} from './multiplier-music.js';
import {GameSoundPlayer,createGameSoundDirector} from './game-sound-director.js';
import {mountGameSoundPanel} from './game-sound-panel.js';
import {createWorkbench} from './workbench.js';
import {createImageCatalog} from './image-catalog.js';
import {loadBallImage} from './ball-images.js';
import './catalog.css';
import './channel-picker.css';
import './ball-multiplier.css';
import './goal-arena.css';

const $=id=>document.getElementById(id),mode='goal-arena';
mountChannelPicker(document.querySelector('.multiplier-header'));
document.querySelector('.studio-channel').firstChild.textContent='Channel';
let saved;try{saved=JSON.parse(localStorage.getItem(GOAL_ARENA_KEY));}catch{}
const settings=normalizeGoalArena(saved),ctx=$('goal-canvas').getContext('2d');
const sound=new GameSoundPlayer(mode,settings.soundStyle,settings.soundOverrides);
let game,paused=false,last=0,accumulator=0,needsPaint=true;
const canvas=$('goal-canvas');
function resizePreview(){
  const width=Math.min(1080,Math.max(270,Math.round(canvas.getBoundingClientRect().width*Math.min(devicePixelRatio||1,2))));
  const height=Math.round(width*16/9);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;needsPaint=true;}
}
new ResizeObserver(resizePreview).observe(canvas);
window.addEventListener('resize',resizePreview);
window.addEventListener('studio-channel-change',()=>{needsPaint=true;});
const save=()=>{try{localStorage.setItem(GOAL_ARENA_KEY,JSON.stringify(settings));}catch{}};
const status=text=>{$('status').textContent=text;};
let catalogNames=[settings.home,settings.away];
const catalog=createImageCatalog({getImages:()=>settings.ballImages,getNames:()=>catalogNames,getCount:()=>2,
  onRosterChange:(images,names)=>{
    const oldImages=settings.ballImages;
    settings.ballImages=images.slice(0,2);
    for(const [i,side] of ['home','away'].entries())if(oldImages[i]!==images[i]){
      settings[side]=names[i].slice(0,24);
      settings[side+'Code']=names[i].replace(/[^a-z0-9]/gi,'').slice(0,3).toUpperCase()||['HOME','AWAY'][i];
    }
  },onApplied:()=>{save();sync();restart();},notify:status});
for(let i=0;i<2;i++){
  $('pick-'+i).onclick=()=>catalog.open(i);
  $('clear-'+i).onclick=()=>{settings.ballImages[i]=null;save();sync();restart();};
}
document.querySelector('[data-close="catalog-dialog"]').onclick=()=>$('catalog-dialog').close();
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
const workbench=createWorkbench({capture:()=>({mode,project:{...settings}}),thumbnail:()=>$('goal-canvas').toDataURL('image/jpeg',.7),title:()=>`${settings.home} vs ${settings.away}`,notify:status,isLocked:()=>false,getChannel:getSelectedChannel,openSnapshot:snapshot=>{Object.assign(settings,normalizeGoalArena(snapshot.project));mountSoundMenu();sync();music.sync();save();restart();}});
$('studio-export').onclick=()=>workbench.openExport();$('studio-videos').onclick=()=>workbench.openVideos();
function sync(){
  catalogNames=[settings.home,settings.away];
  for(let i=0;i<2;i++){
    const img=$('portrait-'+i),src=settings.ballImages[i];img.hidden=!src;
    if(src)img.src=src;else img.removeAttribute('src');
    $('clear-'+i).disabled=!src;
  }
  $('game-sound-style').value=settings.soundStyle;for(const id of ['home','away','homeCode','awayCode','homeColor','awayColor','duration','speed','ballSpeed','goalSpeed','goalWidth','seed'])$(id).value=settings[id];$('sound').textContent=settings.sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(settings.sound));
}
function restart(){music.reset();sound.setStyle(settings.soundStyle);sound.setOverrides(settings.soundOverrides);game=new GoalArena(settings);game.onEvent=e=>{if(settings.sound&&!paused&&!document.hidden)sound.event(e);};paused=false;last=0;accumulator=0;needsPaint=true;Promise.all(settings.ballImages.map(loadBallImage)).then(()=>{needsPaint=true;});$('pause').textContent='Pause';status('');}
for(const id of ['home','away','homeCode','awayCode','homeColor','awayColor','duration','speed','ballSpeed','goalSpeed','goalWidth','seed'])$(id).addEventListener('change',()=>{
  Object.assign(settings,normalizeGoalArena({...settings,[id]:$(id).value}));
  save();sync();restart();
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
  if(needsPaint&&!document.hidden){renderGoalArena(ctx,game,{alpha:paused||game.state==='finished'?1:accumulator*120});needsPaint=false;}
  const label=`${game.minute}′ · ${settings.homeCode} ${game.scores[0]} – ${game.scores[1]} ${settings.awayCode}${paused?' · Paused':game.state==='finished'?' · Full time':game.phase==='goal'?' · GOAL!':game.phase==='kickoff'?' · Kick off':''}`;
  if($('match-state').textContent!==label)$('match-state').textContent=label;
  requestAnimationFrame(frame);
}
save();sync();restart();requestAnimationFrame(frame);
window.goalArenaStudio={snapshot:()=>structuredClone(settings),state:()=>({time:game.time,state:game.state,phase:game.phase,scores:[...game.scores],minute:game.minute,goals:[...game.goals],paused})};
import {mountStudioNavigation} from './studio-navigation.js';
mountStudioNavigation('goal-arena');
