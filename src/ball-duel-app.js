import {BallDuel,normalizeDuel,DUEL_KEY} from './ball-duel.js';
import {renderDuel} from './ball-duel-renderer.js';
import {createImageCatalog,prepareCatalogImage} from './image-catalog.js';
import {loadBallImage,ballImageColor} from './ball-images.js';
import {createWorkbench} from './workbench.js';
import './catalog.css';
import './workbench.css';
import './ball-duel.css';

const $=id=>document.getElementById(id),canvas=$('duel-canvas'),ctx=canvas.getContext('2d');
let saved;try{saved=JSON.parse(localStorage.getItem(DUEL_KEY));}catch{}
let settings;try{settings=normalizeDuel(saved??{}).project;}catch{saved=null;settings=normalizeDuel({}).project;}
let game,paused=false,accumulator=0,last=0,audio,lastSound=0,ready=false;
const notify=message=>{$('status').textContent=message;};
function save(){try{localStorage.setItem(DUEL_KEY,JSON.stringify(settings));}catch{notify('Ayarlar kaydedilemedi; tarayıcı depolama alanı dolu olabilir.');}}
function updateControls(){
  for(let i=0;i<2;i++){$(`name-${i}`).value=settings.names[i];$(`portrait-${i}`).src=settings.ballImages[i]??'';$(`portrait-${i}`).hidden=!settings.ballImages[i];$(`color-${i}`).value=settings.colors[i];}
  $('hp').value=settings.hp;$('speed').value=settings.playbackSpeed;
  document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===settings.theme)));
  $('sound').setAttribute('aria-pressed',String(settings.sound));$('sound').textContent=settings.sound?'Ses açık':'Ses kapalı';
}
function unlockSound(){if(!settings.sound)return;try{audio??=new AudioContext();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
function sound(e){
  if(!settings.sound||audio?.state!=='running'||!['hit','pickup','shot','heal'].includes(e.type))return;
  const now=audio.currentTime;if(now-lastSound<.045)return;lastSound=now;
  const reward=e.type==='pickup'||e.type==='heal',osc=audio.createOscillator(),gain=audio.createGain(),duration=reward?.13:.055;
  osc.type=e.type==='shot'?'triangle':'sine';osc.frequency.setValueAtTime(reward?660:e.type==='hit'?190:420,now);osc.frequency.exponentialRampToValueAtTime(reward?990:75,now+duration);
  gain.gain.setValueAtTime(e.type==='shot'?.018:.06,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+duration+.01);osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
function reset(message='Düello başladı. Silahları topla, son ayakta kalan ol.'){
  game=new BallDuel(settings);game.onEvent=sound;paused=false;accumulator=0;last=0;updatePause();save();notify(message);renderDuel(ctx,game);
}
function updatePause(){$('pause').textContent=paused?'▶ Devam et':'Ⅱ Duraklat';$('pause').setAttribute('aria-label',paused?'Düelloya devam et':'Düelloyu duraklat');}
const catalog=createImageCatalog({getImages:()=>settings.ballImages,getNames:()=>settings.names,getCount:()=>2,onRosterChange:(images,names)=>{settings.ballImages=images.slice(0,2);settings.names=names.slice(0,2);settings.colors=settings.ballImages.map((src,i)=>ballImageColor(src,settings.colors[i]));},onApplied:()=>{updateControls();reset('Görseller güncellendi. Yeni karşılaşma hazır.');},notify});
for(let i=0;i<2;i++){
  for(const id of [`image-${i}`,`pick-${i}`])$(id).onclick=()=>{if(ready)catalog.open(i);};
  $(`name-${i}`).onchange=e=>{settings.names[i]=e.target.value.trim().slice(0,32)||`Top ${i+1}`;updateControls();if(game)game.settings.names=[...settings.names];save();};
  $(`color-${i}`).oninput=e=>{settings.colors[i]=e.target.value;if(game)game.settings.colors=[...settings.colors];save();};
}
document.querySelector('[data-close="catalog-dialog"]').onclick=()=>$('catalog-dialog').close();
document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{settings.theme=b.dataset.theme;if(game)game.settings.theme=settings.theme;updateControls();save();});
$('hp').onchange=e=>{settings.hp=Number(e.target.value);reset('Can sayısı güncellendi. Düello yeniden başladı.');};
$('speed').onchange=e=>{settings.playbackSpeed=Number(e.target.value);save();};
$('new-duel').onclick=()=>{unlockSound();settings.seed=crypto.getRandomValues(new Uint32Array(1))[0];reset();};
$('replay').onclick=()=>{unlockSound();reset('Aynı başlangıç ve aynı ayarlarla tekrar oynatılıyor.');};
$('pause').onclick=()=>{unlockSound();if(!game)return;if(game.state==='finished'){reset();return;}paused=!paused;accumulator=0;updatePause();};
$('sound').onclick=()=>{settings.sound=!settings.sound;unlockSound();updateControls();save();};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage').requestFullscreen();}catch{notify('Bu tarayıcı tam ekranı desteklemiyor.');}};
const workbench=createWorkbench({capture:()=>({mode:'ball-duel',project:structuredClone(settings)}),thumbnail:()=>canvas.toDataURL('image/jpeg',.7),title:()=>settings.names.join(' vs '),notify,isLocked:()=>!ready,openSnapshot:()=>{}});
$('studio-export').onclick=()=>workbench.openExport();$('studio-videos').onclick=()=>workbench.openVideos();
document.addEventListener('visibilitychange',()=>{last=0;accumulator=0;});
document.addEventListener('pointerdown',unlockSound,{once:true});
function frame(now){
  if(game){const modal=!!document.querySelector('dialog[open]');if(last&&!paused&&!modal&&!document.hidden){accumulator+=Math.min((now-last)/1000,.06)*settings.playbackSpeed;let steps=0;while(accumulator>=1/120&&steps<16){game.step(1/120);accumulator-=1/120;steps++;}}else accumulator=0;
    renderDuel(ctx,game,{paused:paused&&game.state==='running'});
    const label=game.state==='finished'?(game.winner===null?'Berabere':`${settings.names[game.winner]} kazandı`):paused?'Duraklatıldı':'Düello sürüyor';if($('match-state').textContent!==label)$('match-state').textContent=label;
    if(game.state==='finished')$('pause').textContent='↻ Tekrar';
  }last=now;requestAnimationFrame(frame);
}
async function init(){
  updateControls();
  let warning;
  for(const id of ['new-duel','replay','hp','studio-export'])$(id).disabled=true;
  try{
    if(!saved){const response=await fetch('/catalog/manifest.json');if(!response.ok)throw new Error('Kütüphane okunamadı.');const manifest=await response.json();const ids=['countries-3eb6578614','countries-23d8e01560'];settings.ballImages=await Promise.all(ids.map(id=>{const item=manifest.items.find(x=>x.id===id);return item?prepareCatalogImage(item):null;}));}
    await Promise.all(settings.ballImages.map(loadBallImage));
  }catch{warning='Varsayılan görseller yüklenemedi. Kütüphaneden tekrar seçebilirsin.';}
  ready=true;updateControls();reset(warning);for(const id of ['new-duel','replay','hp','studio-export'])$(id).disabled=false;requestAnimationFrame(frame);
}
// Read-only diagnostics for local validation; no separate simulation path.
window.duelStudio={snapshot:()=>structuredClone(settings),state:()=>({state:game?.state,time:game?.time,hp:game?.balls.map(b=>b.hp),winner:game?.winner,paused}),restart:()=>reset()};
init();
