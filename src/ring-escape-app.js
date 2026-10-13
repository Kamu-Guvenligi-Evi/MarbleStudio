import {RingEscape,normalizeRing,THEMES,RING_KEY,FLOW_PRESETS} from './ring-escape.js';
import {renderRingEscape} from './ring-escape-renderer.js';
import {RingAudio} from './ring-escape-audio.js';
import {DEFAULT_VIDEO_FPS} from './video-settings.js';
import {mountSoundDirector} from './sound-director-panel.js';
import {mountManualSoundControls} from './game-sound-panel.js';
import './ring-escape.css';
import './ring-flow-presets.css';

const $=id=>document.getElementById(id),canvas=$('ring-canvas'),ctx=canvas.getContext('2d');
let saved;try{saved=JSON.parse(localStorage.getItem(RING_KEY));}catch{}
// Upgrade the motion once while retaining the user's appearance and sound choices.
const settings=normalizeRing(saved&&saved.experienceVersion!==8&&Object.hasOwn(FLOW_PRESETS,saved.layout)?{...saved,...FLOW_PRESETS[saved.layout],count:Math.max(saved.count??0,FLOW_PRESETS[saved.layout].count)}:saved??{}),audio=new RingAudio(settings);
const manualPanel=document.createElement('section');manualPanel.className='game-sound-director';$('sound-director').before(manualPanel);
manualPanel.setAttribute('aria-label','Ses menüsü');const soundHeading=document.createElement('h2');soundHeading.textContent='Ses menüsü';manualPanel.append(soundHeading);
const manualControls=mountManualSoundControls({mode:'ring-escape',element:manualPanel,overrides:settings.soundOverrides,onOverrides:choices=>{settings.soundOverrides=choices;audio.manualDecide=null;audio.stop();save();syncSound();},onPreview:type=>audio.previewEvent(type)});
const originalSounds=document.createElement('button');originalSounds.type='button';originalSounds.textContent='Orijinal seslerle başla';originalSounds.onclick=()=>manualControls.useOriginal();soundHeading.after(originalSounds);
let game,paused=false,last=0,accumulator=0,ballImage=null,recorder=null,exportCanvas=null,exportStream=null,exportTimer=null,exportStarting=false,directorPanel;
const notify=message=>{$('status').textContent=message;};
function save(){try{localStorage.setItem(RING_KEY,JSON.stringify(settings));}catch{notify('Ayarlar bu oturumda kullanılacak; tarayıcı depolama alanı dolu.');}}
function syncSound(){return audio.sync(game.time,!paused&&game.state==='running'&&!document.hidden).catch(()=>notify('Ses başlatılamadı. Sesleri aç düğmesiyle yeniden deneyebilirsin.'));}
function visual(){Object.assign(game.settings,settings);audio.apply();save();}
function controls(){
  // Keep saved/custom values selectable even when they are outside the shortcuts.
  for(const key of ['count','duration','speed'])if(!Array.from($(key).options).some(o=>o.value===String(settings[key])))$(key).add(new Option(String(settings[key]),String(settings[key])));
  for(const key of ['title','shape','layout','count','duration','speed','seed','music'])$(key).value=settings[key];
  for(const key of ['ring','ball','accent','background'])$(key+'-color').value=settings[key];
  for(const key of ['trail','particles'])$(key).checked=settings[key];
  for(const key of ['music','effects']){$(key+'-volume').value=Math.round(settings[key+'Volume']*100);$(key+'-value').value=Math.round(settings[key+'Volume']*100)+'%';}
  document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===settings.theme)));
  document.querySelectorAll('[data-flow]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.flow===settings.layout)));
  $('sound').setAttribute('aria-pressed',String(settings.sound));$('sound').textContent=settings.sound?'Sesler açık ♫':'Sesleri aç ♫';$('remove-image').hidden=!settings.image;
}
function reset(message='Aynı akış baştan oynatılıyor.'){
  audio.reset();directorPanel?.refresh();game=new RingEscape(settings);game.onEvent=e=>{audio.event(e);if(['win','timeout'].includes(e.type)){if(recorder?.state!=='inactive'&&recorder){exportTimer=setTimeout(stopExport,audio.endingTail()*1000);}else audio.stop(true);notify(e.type==='win'?'Kaçış tamamlandı. Son halka da kırıldı.':'Süre doldu. Yeni akışla tekrar deneyebilirsin.');}};
  paused=false;last=0;accumulator=0;$('pause').textContent='Ⅱ Duraklat';$('pause').setAttribute('aria-label','Oyunu duraklat');controls();save();notify(message);syncSound();
}
function loadImage(){ballImage=null;if(settings.image){ballImage=new Image();ballImage.src=settings.image;}}
document.querySelectorAll('[data-flow]').forEach(b=>b.onclick=()=>{
  const preset=FLOW_PRESETS[b.dataset.flow];
  Object.assign(settings,{layout:b.dataset.flow,count:preset.count,duration:preset.duration,seed:preset.seed});
  reset(preset.name+' hazır. '+preset.hint+'.');
});
document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{settings.theme=b.dataset.theme;Object.assign(settings,THEMES[settings.theme]);delete settings.name;controls();visual();});
for(const key of ['ring','ball','accent','background'])$(key+'-color').oninput=e=>{settings[key]=e.target.value;visual();};
for(const key of ['title','shape'])$(key).oninput=e=>{settings[key]=e.target.value;visual();};
for(const key of ['trail','particles'])$(key).onchange=e=>{settings[key]=e.target.checked;visual();};
for(const key of ['layout','count','duration','seed'])$(key).onchange=e=>{settings[key]=key==='layout'?e.target.value:Number(e.target.value);Object.assign(settings,normalizeRing(settings));reset('Akış ayarları güncellendi.');};
$('speed').onchange=e=>{settings.speed=Number(e.target.value);reset('Hız güncellendi; akış yeniden başladı.');};
$('replay').onclick=()=>reset();
$('new-flow').onclick=async()=>{
  $('settings').disabled=true;$('export').disabled=true;
  notify('Yeni akışın ritmi hazırlanıyor…');
  await new Promise(resolve=>setTimeout(resolve,0));
  try{
  // Choose a promising physical trajectory; never schedule or fake ring breaks.
  const first=crypto.getRandomValues(new Uint32Array(1))[0]||1;let best=null,bestScore=-Infinity;
  for(let i=0;i<24;i++){
    await new Promise(resolve=>setTimeout(resolve,0));
    const seed=(first+i)>>>0||1,g=new RingEscape({...settings,seed,particles:false}),events=[];g.onEvent=e=>{if(e.type==='break')events.push(e.time);};while(g.state==='running')g.step(1/60);
    const firstBreak=events[0]??settings.duration,maxIdle=Math.max(firstBreak,...events.slice(1).map((t,n)=>t-events[n]),g.time-(events.at(-1)??0));
    const targetTime=12+settings.count/150;
    const score=g.broken*2+(g.state==='won'?80:0)-Math.abs(g.time-targetTime)*3-firstBreak*5-maxIdle*8;
    if(score>bestScore){best=seed;bestScore=score;}
    if(g.state==='won'&&g.time>10&&g.time<settings.duration-2&&firstBreak<1.6&&maxIdle<3.5)break;
  }
  settings.seed=best;reset('Yeni akış hazır. Akış numarasıyla aynı sonucu tekrar oynatabilirsin.');
  }finally{$('settings').disabled=false;$('export').disabled=false;}
};
$('pause').onclick=()=>{
  if(game.state!=='running'){reset();return;}paused=!paused;accumulator=0;last=0;
  $('pause').textContent=paused?'▶ Devam et':'Ⅱ Duraklat';$('pause').setAttribute('aria-label',paused?'Oyuna devam et':'Oyunu duraklat');syncSound();
};
$('sound').onclick=()=>{settings.sound=!settings.sound;audio.apply();controls();save();syncSound();};
$('music').onchange=e=>{settings.music=e.target.value;visual();syncSound();};
for(const key of ['music','effects'])$(key+'-volume').oninput=e=>{settings[key+'Volume']=Number(e.target.value)/100;$(key+'-value').value=e.target.value+'%';visual();};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage').requestFullscreen();}catch{notify('Tam ekran bu tarayıcıda kullanılamıyor.');}};
$('upload').onclick=()=>$('image-upload').click();
$('image-upload').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024){notify('8 MB’den küçük PNG, JPEG veya WebP görseli seç.');e.target.value='';return;}
  try{const bitmap=await createImageBitmap(file),c=document.createElement('canvas');c.width=c.height=96;const context=c.getContext('2d'),size=Math.min(bitmap.width,bitmap.height);context.drawImage(bitmap,(bitmap.width-size)/2,(bitmap.height-size)/2,size,size,0,0,96,96);bitmap.close();settings.image=c.toDataURL('image/webp',.85);loadImage();controls();visual();notify('Top görseli eklendi. Görsel yalnız bu tarayıcıda saklanır.');}catch{notify('Görsel okunamadı. Başka bir dosya deneyebilirsin.');}e.target.value='';
};
$('remove-image').onclick=()=>{settings.image=null;loadImage();controls();visual();};

function exportLock(locked){$('settings').disabled=locked;$('pause').disabled=locked;exportStarting=locked&&!recorder;$('export').textContent=locked?'■ Kaydı bitir':'↓ Video indir · WebM';}
function releaseExport(){clearTimeout(exportTimer);exportTimer=null;exportStream?.getTracks().forEach(t=>t.stop());exportStream=null;exportCanvas=null;recorder=null;exportLock(false);}
function stopExport(){if(recorder&&recorder.state!=='inactive')recorder.stop();}
async function startExport(){
  if(recorder){stopExport();return;}if(exportStarting)return;
  if(!globalThis.MediaRecorder||!canvas.captureStream){notify('Video indirmek için güncel Chrome veya Edge kullan.');return;}
  const type=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!type){notify('Bu tarayıcı WebM kaydını desteklemiyor.');return;}
  exportChannel=getSelectedChannel();exportLock(true);
  try{
    // Prepare music before time zero so the downloaded video and soundtrack start together.
    audio.stop();if(settings.sound)await audio.unlock();
    exportCanvas=document.createElement('canvas');exportCanvas.width=1080;exportCanvas.height=1920;exportStream=exportCanvas.captureStream(DEFAULT_VIDEO_FPS);
    if(settings.sound&&audio.capture)for(const track of audio.capture.stream.getAudioTracks())exportStream.addTrack(track.clone());
    recorder=new MediaRecorder(exportStream,{mimeType:type,videoBitsPerSecond:7000000,audioBitsPerSecond:128000});const chunks=[];
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onerror=()=>{releaseExport();notify('Kayıt tamamlanamadı. Yeniden deneyebilirsin.');};
    recorder.onstop=()=>{
      const blob=new Blob(chunks,{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`halka-kacisi-${settings.seed}.webm`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);releaseExport();notify('Ses ayarlarınla 1080 × 1920 dikey video indirildi.');
    };
    reset('Video kaydediliyor. Akış tamamlanınca otomatik indirilecek.');renderRingEscape(exportCanvas.getContext('2d'),game,{image:ballImage,channel:exportChannel});recorder.start(500);exportStarting=false;
  }catch{releaseExport();notify('Kayıt başlatılamadı. Tarayıcı ses ve video desteğini kontrol et.');}
}
$('export').onclick=startExport;
document.addEventListener('visibilitychange',()=>{
  last=0;accumulator=0;
  if(document.hidden){audio.stop();if(recorder?.state==='recording')recorder.pause();}
  else{if(recorder?.state==='paused')recorder.resume();syncSound();}
});
function frame(now){
  if(last&&!paused&&!document.hidden&&!exportStarting){accumulator+=Math.min(.1,(now-last)/1000)*settings.speed;while(accumulator>=1/120){game.step(1/120);accumulator-=1/120;}if(game.state==='running')audio.tick(game.time);}else accumulator=0;
  last=now;renderRingEscape(ctx,game,{paused,image:ballImage});if(exportCanvas)renderRingEscape(exportCanvas.getContext('2d'),game,{image:ballImage,channel:exportChannel});
  const progressLabel=game.state==='won'?'Kaçış tamamlandı':game.state==='timeout'?`${game.remaining} halka kaldı · Süre doldu`:`${game.remaining} halka kaldı · ${Math.ceil(game.secondsLeft)} sn`;
  if($('progress').textContent!==progressLabel)$('progress').textContent=progressLabel;
  if(game.state!=='running'&&$('pause').textContent!=='↻ Tekrar'){$('pause').textContent='↻ Tekrar';$('pause').setAttribute('aria-label','Akışı tekrar oynat');}
  requestAnimationFrame(frame);
}
window.ringStudio={snapshot:()=>structuredClone(settings),state:()=>({time:game.time,state:game.state,remaining:game.remaining,broken:game.broken,hits:game.hits,paused,recording:!!recorder,audio:audio.context?.state??'locked',musicPlaying:!!audio.source,soundDirector:{source:audio.director.score?.source??null,played:audio.director.played,skipped:audio.director.skipped,voices:audio.director.voices.size}}),restart:()=>reset()};
directorPanel=mountSoundDirector({element:$('sound-director'),settings,audio,restart:reset,save});
function renderPresetCards(){
  const scene=document.createElement('canvas');scene.width=540;scene.height=960;
  for(const button of document.querySelectorAll('[data-flow]')){
    const layout=button.dataset.flow,preview=button.querySelector('canvas');
    const sample=new RingEscape({...FLOW_PRESETS[layout],layout,particles:false});
    while(sample.time<.9)sample.step(1/60);
    renderRingEscape(scene.getContext('2d'),sample);
    preview.getContext('2d').drawImage(scene,10,192,520,520,0,0,180,180);
  }
}
renderPresetCards();loadImage();reset('Dönen açıklığı izle. Son halka kaçışa açılıyor.');requestAnimationFrame(frame);

import './studio-workspace-layout.css';
import {mountStudioNavigation} from './studio-navigation.js';
mountStudioNavigation('ring-escape');
import {getSelectedChannel} from './channel-branding.js';
let exportChannel;
