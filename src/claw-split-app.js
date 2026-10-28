import {ClawSplit,normalizeClaw,renderClaw,clawBallRadius} from './claw-split.js';
import {mountStudioNavigation} from './studio-navigation.js';
import './ball-multiplier.css';
const $=id=>document.getElementById(id),key='marble-studio-claw-split-v1',canvas=$('claw-canvas'),ctx=canvas.getContext('2d');
let saved;try{saved=JSON.parse(localStorage.getItem(key));}catch{}
if(saved&&(saved.populationVersion??0)<2){
  if(saved.limit===6000)saved.limit=20000;
}
if(saved&&saved.populationVersion===2&&saved.count===4)saved.count=1;
if(saved&&(saved.motionVersion??0)<1){saved.rpm=Math.min(saved.rpm??12,12);saved.acceleration=Math.min(saved.acceleration??.4,.4);saved.speed=Math.min(saved.speed??1,1);}
let settings=normalizeClaw(saved),game,paused=false,last=0,accumulator=0,recorder=null,stream=null,url=null,audio=null,audioDestination=null,sound=false,lastTone=0,lastStatus=-Infinity,statusState='';
const inputs=['count','rpm','acceleration','gravity','duration','limit','seed','speed'];
const status=text=>{$('status').textContent=text;};
function sync(){for(const id of inputs)$(id).value=settings[id];$('ball-size').value=settings.radius*2;$('ball-size-value').textContent=`${settings.radius*2} px`;try{localStorage.setItem(key,JSON.stringify({...settings,sizeVersion:2,populationVersion:3,motionVersion:1}));}catch{}}
function restart(){game=new ClawSplit(settings);game.onSplit=tone;paused=false;last=0;accumulator=0;$('pause').textContent='Duraklat';renderClaw(ctx,game);}
function tone(){
  if(!sound||!audio||audio.state!=='running'||audio.currentTime-lastTone<.14)return;
  lastTone=audio.currentTime;const now=audio.currentTime,note=[0,2,4,7,9,7,4,2][Math.floor(game.time*4)%8];
  const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(220*2**(note/12),now);
  g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.045,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+.42);
  o.connect(g);g.connect(audio.destination);if(audioDestination)g.connect(audioDestination);o.onended=()=>{o.disconnect();g.disconnect();};o.start(now);o.stop(now+.44);
}
for(const id of inputs)$(id).addEventListener('change',()=>{settings=normalizeClaw({...settings,[id]:$(id).value});sync();restart();});
$('ball-size').addEventListener('input',()=>{settings=normalizeClaw({...settings,radius:Number($('ball-size').value)/2});game.settings.radius=settings.radius;game.radius=clawBallRadius(settings.radius,game.balls.length);sync();renderClaw(ctx,game);});
$('pause').onclick=()=>{paused=!paused;last=0;$('pause').textContent=paused?'Devam et':'Duraklat';};
$('replay').onclick=restart;
$('new-game').onclick=()=>{settings.seed=crypto.getRandomValues(new Uint32Array(1))[0];sync();restart();};
$('reference').onclick=()=>{settings=normalizeClaw();sync();restart();};
$('sound').onclick=async()=>{try{audio??=new AudioContext();await audio.resume();sound=!sound;$('sound').textContent=sound?'Ses kapat':'Ses aç';$('sound').setAttribute('aria-pressed',String(sound));}catch{status('Ses başlatılamadı.');}};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage').requestFullscreen();}catch{status('Tam ekran açılamadı.');}};
function lock(value){$('settings').disabled=value;for(const id of ['new-game','reference','replay','pause','sound'])$(id).disabled=value;}
function stopRecording(){if(recorder?.state==='recording'){recorder.stop();$('record').disabled=true;status('Video hazırlanıyor…');}}
$('record').onclick=async()=>{
  if(recorder?.state==='recording'){stopRecording();return;}
  if(!window.MediaRecorder||!canvas.captureStream){status('Bu tarayıcı video kaydını desteklemiyor.');return;}
  try{
    if(url){URL.revokeObjectURL(url);url=null;}$('download').hidden=true;
    const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!mime)throw new Error('WebM desteği yok');
    $('record').disabled=true;canvas.scrollIntoView({block:'center',behavior:'instant'});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));stream=canvas.captureStream(30);if(sound&&audio){audioDestination=audio.createMediaStreamDestination();for(const track of audioDestination.stream.getAudioTracks())stream.addTrack(track);}
    const chunks=[];recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());audioDestination=null;url=URL.createObjectURL(new Blob(chunks,{type:mime}));$('download').href=url;$('download').download='marble-pence-bolunmesi.webm';$('download').hidden=false;$('record').textContent='Video kaydet';$('record').disabled=false;lock(false);status('Video hazır. Videoyu indir düğmesiyle kaydedebilirsin.');};
    recorder.onerror=()=>{stopRecording();status('Video kaydı sırasında hata oluştu.');};
    restart();lock(true);recorder.start(1000);$('record').disabled=false;$('record').textContent='Kaydı bitir';status('540 × 960 · 30 FPS WebM kaydediliyor. Sekmeyi açık tut.');
  }catch(e){$('record').disabled=false;stream?.getTracks().forEach(t=>t.stop());lock(false);status('Kayıt başlatılamadı: '+e.message);}
};
document.addEventListener('visibilitychange',()=>{last=0;accumulator=0;if(document.hidden)stopRecording();});
function frame(now){const elapsed=last?Math.min(.1,(now-last)/1000):0;last=now;if(!paused&&!document.hidden&&(game.state==='running'||game.state==='finishing')){accumulator=Math.min(.15,accumulator+elapsed*settings.speed);let steps=0;const budgetStart=performance.now();while(accumulator>=1/120&&steps++<36){game.step();accumulator-=1/120;if(performance.now()-budgetStart>10)break;}}if(!document.hidden)renderClaw(ctx,game);if(recorder?.state==='recording')stream?.getVideoTracks()[0]?.requestFrame?.();if(now-lastStatus>=100||statusState!==game.state+paused){lastStatus=now;statusState=game.state+paused;const label=`${game.time.toFixed(1)} sn · ${game.splits.toLocaleString('tr-TR')} bölünme · ${game.balls.length.toLocaleString('tr-TR')} görünür top${game.limited?' · Üretim sınırı':''}${game.state==='finished'?' · Tamamlandı':paused?' · Duraklatıldı':''}`;if($('match-state').textContent!==label)$('match-state').textContent=label;}if(game.state==='finished')stopRecording();requestAnimationFrame(frame);}
sync();restart();mountStudioNavigation('claw-split');requestAnimationFrame(frame);
window.clawStudio={snapshot:()=>({...settings}),state:()=>({time:game.time,created:game.balls.length,splits:game.splits,visible:game.balls.length,state:game.state,paused,limited:game.limited})};
