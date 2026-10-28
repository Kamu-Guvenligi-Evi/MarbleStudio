import {createWorkbench} from './workbench.js';
import {mountChannelPicker,getSelectedChannel} from './channel-branding.js';
import './channel-picker.css';
import {EscapeAudio} from './escape-multiply-audio.js';
import {EscapeMultiply,normalizeEscape,renderEscape} from './escape-multiply.js';
import {mountStudioNavigation} from './studio-navigation.js';
import './ball-multiplier.css';
const $=id=>document.getElementById(id),key='marble-studio-escape-multiply-v1',canvas=$('escape-canvas'),ctx=canvas.getContext('2d');
let lastStatus=0;
let saved;try{saved=JSON.parse(localStorage.getItem(key));}catch{}
// Upgrade the former tiny default once, preserving custom sizes thereafter.
if(saved&&saved.sizeVersion!==2&&saved.radius===2.5)saved.radius=5;
if(saved&&saved.flowVersion!==3){if([-.25,-.45,-.5].includes(saved.rotation))saved.rotation=-.9;if(saved.gravity===310)saved.gravity=220;}
if(saved&&saved.countVersion!==1&&saved.limit>6000)saved.limit=2000;
let settings=normalizeEscape(saved),game,paused=false,last=0,accumulator=0,audio=null,soundtrack=null,sound=false;
const inputs=['count','addition','gap','rotation','gravity','duration','limit','seed','speed'];
const status=text=>{$('status').textContent=text;};
function sync(){for(const id of inputs)$(id).value=settings[id];$('ball-size').value=settings.radius*2;$('ball-size-value').textContent=`${settings.radius*2} px`;try{localStorage.setItem(key,JSON.stringify({...settings,sizeVersion:2,flowVersion:3,countVersion:1}));}catch{}}
function restart(){game=new EscapeMultiply(settings);soundtrack?.reset();paused=false;last=0;accumulator=0;$('pause').textContent='Duraklat';renderEscape(ctx,game);}
for(const id of inputs)$(id).addEventListener('change',()=>{settings=normalizeEscape({...settings,[id]:$(id).value});sync();restart();});
$('ball-size').addEventListener('input',()=>{settings=normalizeEscape({...settings,radius:Number($('ball-size').value)/2});game.settings.radius=settings.radius;sync();renderEscape(ctx,game);});
$('pause').onclick=()=>{paused=!paused;last=0;$('pause').textContent=paused?'Devam et':'Duraklat';};
$('replay').onclick=restart;
$('new-game').onclick=()=>{settings.seed=crypto.getRandomValues(new Uint32Array(1))[0];sync();restart();};
$('reference').onclick=()=>{settings=normalizeEscape();sync();restart();};
$('sound').onclick=async()=>{try{audio??=new AudioContext();soundtrack??=new EscapeAudio(audio);await audio.resume();sound=!sound;soundtrack.setEnabled(sound);$('sound').textContent=sound?'Ses kapat':'Ses a\u00e7';$('sound').setAttribute('aria-pressed',String(sound));}catch{status('Ses ba\u015flat\u0131lamad\u0131.');}};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage').requestFullscreen();}catch{status('Tam ekran açılamadı.');}};
document.addEventListener('visibilitychange',()=>{last=0;accumulator=0;if(document.hidden){soundtrack?.gate(false);}});
function frame(now){const elapsed=last?Math.min(.1,(now-last)/1000):0;last=now;if(!paused&&!document.hidden&&game.state==='running'){accumulator+=elapsed*settings.speed;let steps=0;while(accumulator>=1/120&&steps++<36){game.step();accumulator-=1/120;}}renderEscape(ctx,game);soundtrack?.update(game,!paused&&!document.hidden);if(now-lastStatus>150||game.state==='finished'){lastStatus=now;$('match-state').textContent=`${game.time.toFixed(1)} sn · ${game.escaped.toLocaleString('tr-TR')} kaçış · ${(game.created-game.escaped).toLocaleString('tr-TR')} içeride${game.finalizing&&game.state!=='finished'?' · Final akışı':''}${game.limited?' · Üretim sınırı':''}${game.state==='finished'?' · Tamamlandı':paused?' · Duraklatıldı':''}`;}requestAnimationFrame(frame);}
sync();restart();mountStudioNavigation('escape-multiply');requestAnimationFrame(frame);
window.escapeStudio={snapshot:()=>({...settings}),state:()=>({time:game.time,created:game.created,escaped:game.escaped,visible:game.balls.length,state:game.state,paused,limited:game.limited,finalizing:game.finalizing})};

mountChannelPicker(document.querySelector('.multiplier-header'));
const workbench=createWorkbench({capture:()=>({mode:'escape-multiply',project:{...settings,sound:true}}),thumbnail:()=>canvas.toDataURL('image/jpeg',.7),title:()=>'Escape Multiplier',notify:status,isLocked:()=>false,getChannel:getSelectedChannel,openSnapshot:snapshot=>{settings=normalizeEscape(snapshot.project);sync();restart();}});
$('studio-export').onclick=()=>workbench.openExport();$('studio-videos').onclick=()=>workbench.openVideos();
