import './channel-picker.css';
import './ball-multiplier.css';
import './bounce-waves.css';
import {BounceWaves,normalizeWaves,WAVES_KEY,WAVE_MODES,WAVE_PALETTES} from './bounce-waves.js';
import {renderWaves} from './bounce-waves-renderer.js';
import {WavesSoundPlayer} from './bounce-waves-audio.js';
import {mountChannelPicker,getSelectedChannel} from './channel-branding.js';
import {mountMultiplierMusic} from './multiplier-music.js';
import {createWorkbench} from './workbench.js';
const $=id=>document.getElementById(id),mode='bounce-waves';
mountChannelPicker(document.querySelector('.multiplier-header'));
document.querySelector('.studio-channel').firstChild.textContent='Channel';
let saved;try{saved=JSON.parse(localStorage.getItem(WAVES_KEY));}catch{}
const settings=normalizeWaves(saved),canvas=$('waves-canvas'),ctx=canvas.getContext('2d');
// Upgrade existing low-density preferences once; later choices stay as selected.
if(saved?.densityVersion!==2)settings.count=Math.max(4200,settings.count);
let game,paused=false,last=0,needsPaint=true;
const save=()=>{try{localStorage.setItem(WAVES_KEY,JSON.stringify({...settings,densityVersion:2}));}catch{}};
const status=text=>{$('status').textContent=text;};
const music=mountMultiplierMusic({settings,save,notify:status});
const sound=new WavesSoundPlayer();
const controls=['variant','count','duration','height','speed','colorA','colorB'];
$('variant').replaceChildren(...Object.entries(WAVE_MODES).map(([id,label])=>new Option(label,id)));
for(const [id,p] of Object.entries({...WAVE_PALETTES,custom:{name:'Custom',colors:[settings.colorA,settings.colorB]}})){
  const button=document.createElement('button');button.type='button';button.className='palette';button.dataset.palette=id;
  const strip=document.createElement('i');strip.style.background=`linear-gradient(110deg,${p.colors.join(',')})`;button.append(strip,p.name);
  button.onclick=()=>{settings.palette=id;save();sync();game.settings.palette=id;needsPaint=true;};$('palettes').append(button);
}
function sync(){
  for(const id of controls)$(id).value=settings[id];
  for(const b of document.querySelectorAll('.palette'))b.setAttribute('aria-pressed',String(b.dataset.palette===settings.palette));
  document.querySelector('[data-palette=custom] i').style.background=`linear-gradient(110deg,${settings.colorA},${settings.colorB})`;
  $('custom-colors').hidden=settings.palette!=='custom';
  $('sound').textContent=settings.sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(settings.sound));
}
function restart(){game=new BounceWaves(settings);sound.reset(game);music.reset();paused=false;last=0;needsPaint=true;$('pause').textContent='Pause';status('');}
for(const id of controls)$(id).addEventListener('change',()=>{
  Object.assign(settings,normalizeWaves({...settings,[id]:$(id).value}));save();sync();
  if(['colorA','colorB','speed'].includes(id)){Object.assign(game.settings,settings);game.seek(game.time);needsPaint=true;}else restart();
});
const workbench=createWorkbench({capture:()=>({mode,project:{...settings}}),thumbnail:()=>canvas.toDataURL('image/jpeg',.7),title:()=>`Bounce Waves · ${WAVE_MODES[settings.variant]}`,notify:status,isLocked:()=>false,getChannel:getSelectedChannel,openSnapshot:snapshot=>{Object.assign(settings,normalizeWaves(snapshot.project));sync();music.sync();save();restart();}});
$('studio-export').onclick=()=>workbench.openExport();$('studio-videos').onclick=()=>workbench.openVideos();
$('replay').onclick=restart;
$('pause').onclick=()=>{paused=!paused;last=0;if(paused){sound.stop();music.suspend();}$('pause').textContent=paused?'Resume':'Pause';};
$('sound').onclick=()=>{settings.sound=!settings.sound;game.settings.sound=settings.sound;sound.reset(game,game.time);save();sync();if(!settings.sound)music.suspend();else sound.unlock().catch(()=>status('Sound could not start. Try again.'));};
const unlockSound=()=>{if(settings.sound)sound.unlock().catch(()=>{});};
document.addEventListener('pointerdown',unlockSound);
document.addEventListener('keydown',unlockSound);
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage').requestFullscreen();}catch{status('Full screen is unavailable.');}};
function resize(){const w=Math.min(1080,Math.max(270,Math.round(canvas.getBoundingClientRect().width*Math.min(devicePixelRatio||1,2))));if(canvas.width!==w){canvas.width=w;canvas.height=Math.round(w*16/9);needsPaint=true;}}
new ResizeObserver(resize).observe(canvas);
window.addEventListener('studio-channel-change',()=>{needsPaint=true;});
document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){sound.stop();music.suspend();}});
function frame(now){
  const dt=last?Math.max(0,(now-last)/1000):0;last=now;
  const running=!paused&&!document.hidden&&game.state==='running';
  if(running){game.seek(game.time+dt*settings.speed);needsPaint=true;}
  sound.update(game,running&&settings.sound);
  music.update(running&&game.state==='running');
  if(needsPaint&&!document.hidden){renderWaves(ctx,game);needsPaint=false;}
  const label=`${game.balls.length.toLocaleString('en-US')} balls · ${Math.floor(game.time/settings.speed)} / ${Math.round(settings.duration/settings.speed)} s${paused?' · Paused':game.state==='finished'?' · Complete':''}`;
  if($('match-state').textContent!==label)$('match-state').textContent=label;
  requestAnimationFrame(frame);
}
save();sync();restart();requestAnimationFrame(frame);
window.bounceWavesStudio={snapshot:()=>structuredClone(settings),state:()=>({time:game.time,state:game.state,count:game.balls.length,paused})};
import {mountStudioNavigation} from './studio-navigation.js';
mountStudioNavigation('bounce-waves');
