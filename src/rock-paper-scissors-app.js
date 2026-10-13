import {RPS_KEY,RPS_MAPS,RockPaperScissors,normalizeRps,NAMES} from './rock-paper-scissors.js';
import {renderRps,drawRpsIcon,drawRpsMapPreview} from './rock-paper-scissors-renderer.js';
import {GameSoundPlayer,createGameSoundDirector,normalizeSoundStyle} from './game-sound-director.js';
import {normalizeSoundOverrides} from './game-sound-settings.js';
import {mountGameSoundPanel} from './game-sound-panel.js';
import './rock-paper-scissors.css';

const $=id=>document.getElementById(id),mode='rock-paper-scissors';
let saved;try{saved=JSON.parse(localStorage.getItem(RPS_KEY));}catch{}
const settings=normalizeRps(saved??{});
settings.soundStyle=normalizeSoundStyle(settings.soundStyle);
settings.soundOverrides=normalizeSoundOverrides(mode,settings.soundOverrides);
const sound=new GameSoundPlayer(mode,settings.soundStyle,settings.soundOverrides);
const ctx=$('rps-canvas').getContext('2d');
let game,paused=false,last=0,accumulator=0,recorder=null,exportStarting=false,exportStream=null,exportCanvas=null,audioCapture=null,endTail=0,exportFailed=false;
const save=()=>{try{localStorage.setItem(RPS_KEY,JSON.stringify(settings));}catch{}};
const status=message=>{$('status').textContent=message;};
for(const [key,map] of Object.entries(RPS_MAPS)){
  const option=document.createElement('option');option.value=key;option.textContent=map.name+(map.moving?' · Hareketli':'');$('map').append(option);
  const button=document.createElement('button');button.type='button';button.dataset.map=key;button.className='map-card';
  const preview=document.createElement('canvas');preview.width=preview.height=180;preview.setAttribute('aria-hidden','true');
  const label=document.createElement('span');label.textContent=map.name;button.append(preview,label);
  if(map.moving){const badge=document.createElement('small');badge.textContent='Hareketli';button.append(badge);}
  const sample=new RockPaperScissors({map:key});sample.time=1.2;sample.updateObstacles(0);drawRpsMapPreview(preview.getContext('2d'),sample);
  button.onclick=()=>{$('map').value=key;$('map').dispatchEvent(new Event('change'));};$('map-cards').append(button);
}
function syncMap(){
  $('map-description').textContent=RPS_MAPS[settings.map].description??({classic:'Açık alanda kesintisiz karşılaşmalar.',orbit:'Ortadaki ada grupları iki yöne ayırır.',pillars:'Dört sütunun arasında çok yönlü sekmeler.',gates:'İki bölge, ortada tek bir geçiş.'}[settings.map]);
  for(const button of $('map-cards').children)button.setAttribute('aria-pressed',String(button.dataset.map===settings.map));
}
function syncPlayback(){
  $('pause').textContent=paused?'▶ Devam et':'Ⅱ Duraklat';$('pause').setAttribute('aria-label',paused?'Oyuna devam et':'Oyunu duraklat');
  $('sound').textContent=settings.sound?'Ses açık':'Ses kapalı';$('sound').setAttribute('aria-pressed',String(settings.sound));
}
function restart(){
  sound.reset();game=new RockPaperScissors(settings);paused=false;last=0;accumulator=0;endTail=0;
  game.onEvent=event=>{if(settings.sound&&!paused&&!document.hidden)sound.event(event);};
  syncMap();syncPlayback();renderRps(ctx,game,settings);status('Yeni karşılaşma başladı. Başlangıç: '+settings.seed);
}
for(const id of ['title','count','speed','background','seed','map']){
  $(id).value=settings[id];
  $(id).addEventListener(id==='title'?'input':'change',()=>{
    const value=id==='seed'?$(id).valueAsNumber:$(id).value;
    Object.assign(settings,normalizeRps({...settings,[id]:value}));save();
    if(['seed','count','map'].includes(id)){ $(id).value=settings[id];restart(); }
  });
}
$('new-game').onclick=()=>{settings.seed=crypto.getRandomValues(new Uint32Array(1))[0];$('seed').value=settings.seed;save();restart();};
$('replay').onclick=restart;
$('pause').onclick=()=>{paused=!paused;last=0;accumulator=0;if(paused)sound.stop();syncPlayback();};
$('sound').onclick=async()=>{
  settings.sound=!settings.sound;save();syncPlayback();
  if(!settings.sound)sound.stop();else try{await sound.unlock();}catch{status('Ses başlatılamadı. Ses düğmesini tekrar deneyebilirsin.');}
};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage').requestFullscreen();}catch{status('Bu tarayıcı tam ekranı desteklemiyor.');}};
document.addEventListener('pointerdown',()=>{if(settings.sound&&!document.hidden)sound.unlock().catch(()=>{});},{once:true});
mountGameSoundPanel({mode,style:settings.soundStyle,overrides:settings.soundOverrides,
  onChange:value=>{settings.soundStyle=value;sound.setStyle(value);save();},
  onOverrides:value=>{settings.soundOverrides=value;sound.setOverrides(value);save();},
  onPreview:async event=>{
    if(!settings.sound)throw new Error('Ön dinleme için Sesleri aç düğmesine bas.');
    await sound.unlock();sound.stop();
    const decision=createGameSoundDirector(mode,settings.soundStyle,settings.soundOverrides)({type:event,time:0},0);
    return decision?sound.play(decision):false;
  }
});
for(const c of document.querySelectorAll('[data-icon]'))drawRpsIcon(c.getContext('2d'),c.dataset.icon,32,32,51);

function lockExport(locked){$('settings').disabled=locked;$('pause').disabled=locked;$('sound').disabled=locked;$('export').textContent=locked?'■ Kaydı bitir':'↓ Video indir';}
function releaseExport(){
  for(const track of exportStream?.getTracks()??[])track.stop();
  exportStream=null;exportCanvas=null;recorder=null;exportStarting=false;lockExport(false);
}
function stopExport(){if(recorder&&recorder.state!=='inactive'){recorder.stop();$('export').disabled=true;}}
async function startExport(){
  if(exportStarting)return;
  if(recorder){stopExport();return;}
  exportStarting=true;lockExport(true);$('export').disabled=true;exportFailed=false;
  try{
    if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)throw new Error('Bu tarayıcı video kaydını desteklemiyor. Chrome veya Edge kullanabilirsin.');
    if(settings.sound){
      await sound.unlock();
      if(!audioCapture){audioCapture=sound.context.createMediaStreamDestination();sound.compressor.connect(audioCapture);}
    }
    exportCanvas=document.createElement('canvas');exportCanvas.width=1080;exportCanvas.height=1920;
    restart();renderRps(exportCanvas.getContext('2d'),game,settings);
    exportStream=exportCanvas.captureStream(30);
    if(settings.sound)for(const track of audioCapture.stream.getAudioTracks())exportStream.addTrack(track.clone());
    const mimeType=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));
    if(!mimeType)throw new Error('WebM kaydı desteklenmiyor. Chrome veya Edge kullanabilirsin.');
    recorder=new MediaRecorder(exportStream,{mimeType,videoBitsPerSecond:6500000,audioBitsPerSecond:128000});
    const chunks=[],seed=settings.seed;
    recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
    recorder.onerror=()=>{exportFailed=true;status('Video kaydı başarısız oldu. Yeniden deneyebilirsin.');stopExport();};
    recorder.onstop=()=>{
      try{
        if(!exportFailed&&chunks.length){
          const blob=new Blob(chunks,{type:mimeType}),url=URL.createObjectURL(blob),a=document.createElement('a');
          a.href=url;a.download=`tas-kagit-makas-${seed}.webm`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
          status('1080 × 1920 video hazır. Dosya indirildi.');
        }else if(!exportFailed)status('Kayıt boş kaldı. Yeniden deneyebilirsin.');
      }finally{releaseExport();$('export').disabled=false;}
    };
    recorder.start(250);exportStarting=false;$('export').disabled=false;
    if(document.hidden)recorder.pause();
    status('Video kaydediliyor. Oyun bitince otomatik indirilecek; erken bitirebilirsin.');
  }catch(error){releaseExport();$('export').disabled=false;status(error.message||'Video kaydı başlatılamadı.');}
}
$('export').onclick=startExport;
document.addEventListener('visibilitychange',()=>{
  last=0;accumulator=0;
  if(document.hidden){sound.stop();if(recorder?.state==='recording')recorder.pause();}
  else if(recorder?.state==='paused')recorder.resume();
});
function frame(now){
  const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
  if(!paused&&!document.hidden&&!exportStarting){
    accumulator+=dt*settings.speed;
    while(accumulator>=1/120){game.step(1/120);accumulator-=1/120;}
    if(recorder?.state==='recording'&&game.state!=='running'){endTail+=dt;if(endTail>=1.6)stopExport();}
  }
  renderRps(ctx,game,settings,{paused});
  if(exportCanvas&&recorder?.state==='recording')renderRps(exportCanvas.getContext('2d'),game,settings);
  const label=game.state==='won'?`${NAMES[game.winner]} kazandı`:game.state==='timeout'?'Berabere':paused?'Duraklatıldı':`${game.pieces.length} parça · Oyun sürüyor`;
  if($('match-state').textContent!==label)$('match-state').textContent=label;
  requestAnimationFrame(frame);
}
restart();requestAnimationFrame(frame);
window.rpsStudio={snapshot:()=>structuredClone(settings),state:()=>({time:game.time,state:game.state,winner:game.winner,counts:game.counts(),total:game.pieces.length,conversions:game.conversions,obstacles:structuredClone(game.obstacles),paused,recording:Boolean(recorder),audio:sound.state()})};
