import {createAutomaticHome} from './automatic-home.js';
import {createWorkbench} from './workbench.js';
import {normalizeSnapshot,createBackup,parseBackup,restoreBackup,downloadJSON} from './studio-transfer.js';
import {playEffect} from './impact-audio.js';
import { SPIRAL_THEMES, normalizeSpiralTheme } from './spiral-themes.js';
import './style.css';
import './editor-detail.css';
import './catalog.css';
import './studio-layout.css';
import './music.css';
import { createMusic } from './music.js';
import { createStatistics } from './statistics.js';
import { Spiral } from './spiral.js';
import { renderSpiral } from './spiral-renderer.js';
import { Arena } from './arena.js';
import { renderArena } from './arena-renderer.js';
import { Race } from './physics.js';
import { renderRace } from './renderer.js';
import { loadDraft, normalizeProject } from './projects.js';
import { createBallEditor } from './ball-editor.js';
import { loadBallImage, normalizeBallImages } from './ball-images.js';
import { upgradeCatalogImages } from './image-catalog.js';
import { normalizeNames, normalizePresentation, createCameraDirector } from './presentation.js';

import './studio-light.css';

const $ = s => document.querySelector(s);
const canvas = $('#race'), ctx = canvas.getContext('2d');
const modeDrafts={};
for(const mode of ['track','arena','spiral']){
  try{const raw=JSON.parse(localStorage.getItem('marble-studio-'+mode+'-v1'));if(raw)modeDrafts[mode]={...normalizeProject(raw),spiralSfxVersion:raw.spiralSfxVersion??0,preset:raw.preset??'saved',speed:raw.speed??'1'};}catch{}
}
const legacyDraft=loadDraft();
if(legacyDraft&&!modeDrafts[legacyDraft.mode==='arena'?'arena':'track'])modeDrafts[legacyDraft.mode==='arena'?'arena':'track']=legacyDraft;
const draft=modeDrafts.track;
let trackPreset=draft?.preset??'saved';
let gameMode='track';
let spiralTheme='ice',spiralBehavior='classic',arenaEnergy=1,arenaGame='links',arenaShape='triangle',territoryDuration=45;
for(const [id,theme] of Object.entries(SPIRAL_THEMES))$('#spiral-theme').add(new Option(theme.name,id));
let sequence = draft?.sequence ?? null, projectName = draft?.name ?? 'Parkurum';
let ballImages=await upgradeCatalogImages(normalizeBallImages(draft?.ballImages));
let ballNames=normalizeNames(draft?.ballNames);
let presentation=normalizePresentation(draft?.presentation);
let director=createCameraDirector(),resultElapsed=0,winnerElapsed=null;
function syncPresentation(){ $('#countdown-seconds').value=presentation.countdown;$('#outro-seconds').value=presentation.outro;$('#camera').value=presentation.camera; }
syncPresentation();
await Promise.all(ballImages.map(loadBallImage));
if(draft){$('#seed').value=draft.seed;$('#count').value=draft.count;$('#sound').checked=draft.sound;$('#trails').checked=draft.trails;}
$('#speed').value=draft?.speed??'1';
let race, view = 'watch', cameraY = 0, paused = false, countdown = 0;
let last = 0, accumulator = 0, uiTick = 0;
let recorder = null, downloadURL = null;
let recordStarting = false;
let raceStarting = false;
let exportPreparing = false;
let raceStartRevision = 0;
let audioCtx, audioBus, audioDestination, lastTone = 0;
const H = 960;
const isRecording = () => recorder?.state === 'recording';

function toast(message) {
  $('#toast').textContent = message; $('#toast').classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').classList.remove('show'), 3500);
}
function showDialog(id) { $(id).showModal(); }
function closeDialog(id) { $(id).close(); }
const music = await createMusic({getAudio:()=>{initAudio();return {context:audioCtx,destination:audioDestination};},notify:toast});
function archiveBrowserVideo(blob,options){
  void workbench.uploadVideo(blob,options).then(()=>toast('Video arşive eklendi; GitHub’a otomatik gönderilecek.')).catch(()=>toast('Video indirildi. Ortak arşive eklemek için video hizmetini açıp Videolarım → Video yükle kullan.'));
}
const statistics = createStatistics({notify:toast,onVideoRecorded:archiveBrowserVideo,onRecordingChange:active=>{
  $('#nav-track').disabled=active;$('#nav-arena').disabled=active;$('#nav-spiral').disabled=active;
  $('#open-settings').disabled=active;
  for(const id of ['studio-export','studio-backup','studio-restore','studio-works'])$('#'+id).disabled=active;
}});

createBallEditor({getImages:()=>ballImages,getNames:()=>ballNames,getCount:()=>Number($('#count').value),notify:toast,onRosterChange:(images,names)=>{if(isRecording())throw new Error('Kadroyu kayıt bittikten sonra değiştir.');ballImages=normalizeBallImages(images);ballNames=normalizeNames(names);resetRace();},onChange:next=>{if(isRecording())throw new Error('Görseli kayıt bittikten sonra ekle.');ballImages=next;resetRace();},onNamesChange:next=>{if(isRecording())throw new Error('İsmi kayıt bittikten sonra değiştir.');ballNames=normalizeNames(next);resetRace();}});
function getProject(){return {mode:gameMode,spiralTheme,variant:spiralBehavior,energy:arenaEnergy,arenaGame,arenaShape,territoryDuration,spiralSfxVersion:1,preset:trackPreset,speed:$('#speed').value,name:projectName,sequence:structuredClone(sequence??[]),seed:Number($('#seed').value),count:Number($('#count').value),sound:$('#sound').checked,visualStyle:'neon',trails:$('#trails').checked,ballImages:[...ballImages],ballNames:[...ballNames],presentation:{...presentation}};}
function persistDraft(){
  modeDrafts[gameMode]=getProject();
  try{localStorage.setItem('marble-studio-'+gameMode+'-v1',JSON.stringify(modeDrafts[gameMode]));$('#save-status').textContent='✓ Bu yarışın ayarları kaydedildi';}
  catch{$('#save-status').textContent='Ayarlar bu oturumda saklanıyor';}
}
function switchRaceMode(mode,force=false){
  if(isRecording()||recordStarting||raceStarting||exportPreparing||statistics.isRecording())return;
  if(mode!==gameMode||force){
    if(!force)persistDraft();music.suspend();gameMode=mode;
    const saved=modeDrafts[mode];
    sequence=saved?.sequence?.length?structuredClone(saved.sequence):null;
    projectName=saved?.name??(mode==='spiral'?'Spiral çoğalma':mode==='arena'?'Küre arenası':'Parkur yarışı');
    trackPreset=saved?.preset??'saved';
    spiralTheme=normalizeSpiralTheme(saved?.spiralTheme);spiralBehavior=saved?.variant??'classic';arenaEnergy=saved?.energy??1;arenaGame=saved?.arenaGame??'links';arenaShape=saved?.arenaShape??'triangle';territoryDuration=saved?.territoryDuration??45;
    ballImages=normalizeBallImages(saved?.ballImages);ballImages.forEach(loadBallImage);
    ballNames=normalizeNames(saved?.ballNames);presentation=normalizePresentation(saved?.presentation);syncPresentation();
    $('#seed').value=saved?.seed??2048;$('#count').value=saved?.count??(mode==='spiral'?1:12);
    $('#sound').checked=mode==='spiral'&& !saved?.spiralSfxVersion?true:saved?.sound??false;$('#trails').checked=saved?.trails??true;
    $('#speed').value=saved?.speed??'1';
    $('#download-panel').hidden=true;
    resetRace();
  }
  setView('watch');
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext(); audioBus = audioCtx.createGain(); audioBus.gain.value = .22;
    audioBus.connect(audioCtx.destination); audioDestination = audioCtx.createMediaStreamDestination(); audioBus.connect(audioDestination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
const effectTimes=new Map();
function tone(strength, x, effect) {
  if (!$('#sound').checked || !audioCtx || audioCtx.state !== 'running') return;
  if(effect){const now=audioCtx.currentTime,previous=effectTimes.get(effect.type)??-1;if(now-previous<(effect.type==='ice'?.035:.025))return;effectTimes.set(effect.type,now);playEffect(audioCtx,audioBus,{...effect,x});return;}
  const now = audioCtx.currentTime; if (now - lastTone < .045) return; lastTone = now;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain(), pan = audioCtx.createStereoPanner();
  osc.type = 'sine'; osc.frequency.setValueAtTime(260+x*1.3, now); osc.frequency.exponentialRampToValueAtTime(130+x*.4, now+.075);
  gain.gain.setValueAtTime(Math.min(.26,strength*.018),now); gain.gain.exponentialRampToValueAtTime(.001,now+.11); pan.pan.value=(x/540-.5)*1.3;
  osc.connect(gain); gain.connect(pan); pan.connect(audioBus); osc.start(); osc.stop(now+.12);
  osc.onended=()=>{osc.disconnect();gain.disconnect();pan.disconnect();};
}
function resetRace() {
  if (isRecording()) return;
  music.reset();
  music.setGameMode(gameMode);
  race?.dispose();
  const seed = Math.min(999999,Math.max(1,Math.floor(Number($('#seed').value)||2048))); $('#seed').value=seed;
  race=gameMode==='spiral'?new Spiral({variant:spiralBehavior,theme:spiralTheme,seed,count:Number($('#count').value),ballImages,ballNames,onHit:tone}):gameMode==='arena'?new Arena({energy:arenaEnergy,arenaGame,arenaShape,territoryDuration,seed,count:Number($('#count').value),ballImages,ballNames,onHit:tone}):new Race({seed,sequence:sequence?.length?sequence:null,sections:4,count:Number($('#count').value),ballImages,ballNames,onHit:tone});
  director=createCameraDirector();resultElapsed=0;winnerElapsed=null;
  // Freeze the initial starter course too: settings never reshuffle the user's order.
  if(gameMode==='track')sequence=structuredClone(race.sequence);
  race.courseName=projectName;
  if(race.arenaGame==='territory')race.language='tr';
  paused=false; countdown=0; cameraY=0; accumulator=0;
  syncModeUI(); updateUI(); draw(); persistDraft();
}
function syncModeUI(){
  const arena=gameMode==='arena',spiral=gameMode==='spiral',territory=arena&&arenaGame==='territory';
  $('#arena-options').hidden=!arena;$('#arena-game').value=arenaGame;$('#arena-shape').value=arenaShape;$('#territory-duration').value=territoryDuration;$('#arena-shape-field').hidden=!territory;$('#territory-duration-field').hidden=!territory;
  $('#arena-rules').textContent=territory?'Kendi alanından çıkıp iz çiz. Geri dönünce kapalı bölge senin olur. Rakibinin izini keserek hamlesini boz. Süre sonunda en çok alanı olan kazanır.':'Her top 3 bağla başlar. Duvara çarptıkça bağ kurar, rakiplerinin bağlarını keser. Bağı kalmayan elenir; son bağlı top kazanır.';
  $('#track-preset-field').hidden=gameMode!=='track';$('#arena-rules').hidden=!arena;$('#camera').closest('label').hidden=gameMode!=='track';
  $('#spiral-rules').hidden=!spiral;
  $('#spiral-theme-field').hidden=!spiral;$('#spiral-theme').value=spiralTheme;
  $('#trails').closest('.settings-toggle').hidden=spiral;
  $('#count-single').hidden=!spiral;$('#count-single').disabled=!spiral;
  $('#count-label').textContent=spiral?'Başlangıç top sayısı':'Yarışmacı sayısı';
  $('#track-preset').value=trackPreset;
  $('#track-preset option[value="saved"]').hidden=trackPreset!=='saved';
  $('#watch-title').textContent=spiral?'Spiral çoğalma':territory?'Alan Savaşı':arena?'Küre arenası':'Parkur yarışı';
  $('#race-eyebrow').textContent=spiral?'YOLU KIR · ÇOĞAL · MERKEZE ULAŞ':territory?'ALANI KAP · RAKİBİNİN İZİNİ KES':arena?'BAĞ KUR · RAKİPLERİNİ ELE':'ENGELLERİ AŞ · FİNİŞE ULAŞ';
  $('#race-description').textContent=spiral?'Bir topla başla. Spiral yolu parçalarken topların çoğalmasını izle.':territory?'Şeklini ve kadronu seç. Kapalı bölgeleri ele geçir, en geniş alan senin olsun.':arena?'Kadronu seç. Son bağlı top kalana kadar mücadele et.':'Hazır parkurunu seç, kadronu kur ve yarışı başlat.';
  if(spiral)$('#race-description').textContent=SPIRAL_THEMES[spiralTheme].description;
  $('.progress-heading span').textContent=spiral?'Açılan spiral yolu':territory?'Yarış süresi':arena?'Elenen toplar':'Parkur ilerlemesi';
  $('#settings-title').textContent=spiral?'Spiral çoğalma ayarları':territory?'Alan Savaşı ayarları':arena?'Küre arenası ayarları':'Parkur yarışı ayarları';
}
function setView(next, focus = true) {
  if ((isRecording() || recordStarting || raceStarting || exportPreparing) && next !== 'watch') return;
  if (statistics.isRecording() && next !== 'statistics') return;
  if (next !== 'watch' && (race.state === 'running' || countdown>0)) paused=true;
  if(next==='statistics')music.suspend();
  view=next;
  const workspace=next==='statistics'?'statistics':gameMode;
  if(next==='watch')$('#'+gameMode+'-view').append($('#watch-view'));
  for(const mode of ['track','arena','statistics','spiral']){
    $('#'+mode+'-view').hidden=workspace!==mode;
    $('#nav-'+mode).setAttribute('aria-pressed',String(workspace===mode));
  }
  $('#watch-view').hidden=next!=='watch';statistics.setActive(next==='statistics');
  document.title='Marble Studio — '+(workspace==='statistics'?'İstatistik yarışı':workspace==='spiral'?'Spiral çoğalma':workspace==='arena'?'Küre arenası':'Parkur yarışı');
  updateUI();draw();window.scrollTo({top:0,behavior:'instant'});
  if(focus)$(next==='statistics'?'#statistics-title':'#watch-title').focus({preventScroll:true});
}
function freshSeed() {
  const previous=Number($('#seed').value);
  const value=crypto.getRandomValues(new Uint32Array(1))[0];
  $('#seed').value=1+((previous-1+1+value%999998)%999999);
}
async function startRace(fresh = false) {
  if (!race.sectionCount || isRecording() || recordStarting || raceStarting || exportPreparing) return;
  if(fresh)freshSeed();
  initAudio();resetRace();
  const startingRace=race;
  const startingRevision=++raceStartRevision;
  raceStarting=true;music.lock(true);updateUI();
  try {
    await music.prepare({mode:gameMode,balls:race.balls});
    if(race!==startingRace||startingRevision!==raceStartRevision)return;
    beginRace();setView('watch');
  }catch(error){toast(error.message||'Müzik hazırlanamadı. Müziğini kontrol edip tekrar dene.');}
  finally{raceStarting=false;music.lock(false);updateUI();}
}
function beginRace(){countdown=presentation.countdown;paused=false;if(countdown===0)race.start();}
function winSound(){
  if(gameMode==='spiral')return;
  if(!$('#sound').checked||!audioCtx)return;
  [523.25,659.25,783.99].forEach((frequency,i)=>{
    const oscillator=audioCtx.createOscillator(),gain=audioCtx.createGain(),when=audioCtx.currentTime+i*.11;
    oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(.2,when+.02);gain.gain.exponentialRampToValueAtTime(.001,when+.45);
    oscillator.connect(gain);gain.connect(audioBus);oscillator.start(when);oscillator.stop(when+.5);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  });
}
const escapeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function togglePause() {
  if (!race.sectionCount||exportPreparing) return;
  if (race.state==='finished' || (race.state==='ready' && countdown===0)) {startRace(race.state==='finished');return;}
  paused=!paused; updateUI();
}
function timeText(t) { return `${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toFixed(2).padStart(5,'0')}`; }
function updateUI() {
  const locked=isRecording()||recordStarting||raceStarting||exportPreparing||statistics.isRecording();
  for(const id of ['studio-export','studio-backup','studio-restore','studio-works'])$('#'+id).disabled=locked;
  const ranked=race.ranking(), empty=!race.sectionCount;
  $('#stage-state').textContent=raceStarting||recordStarting?'Müzikler hazırlanıyor…':isRecording()?'● Kayıt alınıyor':paused?'Duraklatıldı':countdown>0?'Başlıyor…':race.state==='ready'?'Başlamaya hazır':race.state==='finished'?'Yarış tamamlandı':'Yarış sürüyor';
  $('#clock').textContent=timeText(race.time);
  $('#pause').textContent=paused?'▶ Devam et':countdown>0||race.state==='running'?'Ⅱ Duraklat':race.state==='finished'?'↻ Yeni yarış':'▶ Başlat';
  $('#new-race').disabled=empty||locked;
  $('#pause').disabled=empty || raceStarting || recordStarting || exportPreparing || (isRecording() && race.state==='finished');
  $('#record').disabled=empty||recordStarting||raceStarting||exportPreparing;
  for(const mode of ['track','arena','statistics','spiral'])$('#nav-'+mode).disabled=locked;
  for(const selector of ['#count','#open-balls','#track-preset','#spiral-theme','#arena-game','#arena-shape','#territory-duration','#sound','#open-settings'])$(selector).disabled=locked;
  $('#ranking-title').textContent=gameMode==='spiral'?'Spiraldeki toplar':race.finished.length?'Sonuçlar':race.state==='ready'?'Yarışmacılar':'Canlı sıralama';
  const spiral=gameMode==='spiral',arena=gameMode==='arena',territory=arena&&race.arenaGame==='territory',active=arena?race.balls.filter(b=>b.eliminatedAt===null).length:0;
  $('#finish-count').textContent=spiral?`${race.balls.length} top · ${race.totalBreaks} kırılma`:territory?`${Math.ceil(race.duration-race.time)} sn kaldı`:arena?`${active} / ${race.balls.length} top kaldı`:race.finished.length?`${race.finished.length} / ${race.balls.length} finish`:`${race.balls.length} top`;
  $('#ranking').innerHTML=ranked.slice(0,5).map((b,i)=>`<div class="rank-row"><span class="rank-num">${String(i+1).padStart(2,'0')}</span><span class="rank-ball" style="background:${b.color}">${b.imageSrc?`<img src="${b.imageSrc}" alt="">`:''}</span><span class="rank-name">${escapeText(b.name)}</span><span class="rank-value">${spiral?'#'+(b.id+1):territory?race.share(b).toFixed(1)+'% alan':arena?(b.eliminatedAt!==null?'Elendi':race.linkCount(b)+' bağ · '+b.cuts+' kesiş'):b.finishedAt!==null?b.finishedAt.toFixed(2)+' sn':Math.round(Math.max(0,Math.min(100,(b.body.position.y-260)/(race.finishY-260)*100)))+'%'}</span></div>`).join('');
  const progress=spiral?race.progress*100:territory?race.time/race.duration*100:arena?(race.balls.length-active)/race.balls.length*100:Math.max(0,Math.min(100,(ranked[0].body.position.y-260)/(race.finishY-260)*100));
  $('#progress-bar').style.width=progress+'%'; $('#progress-label').textContent=Math.round(progress)+'%';
}
function draw() {
  if (view!=='watch') return;
  (gameMode==='spiral'?renderSpiral:gameMode==='arena'?renderArena:renderRace)(ctx,race,{cameraY,countdown,paused,trails:$('#trails').checked,preview:null,winnerElapsed,resultElapsed});
}
function frame(now) {
  const elapsed=Math.min((now-last)/1000||0,.06); last=now;
  if(view==='watch'&&!paused) {
    if(countdown>0) {countdown-=elapsed;if(countdown<=0){countdown=0;race.start();}}
    else if(race.state==='running') {
      accumulator+=elapsed*Number($('#speed').value);
      while(accumulator>=1/120){race.step();accumulator-=1/120;}
      const target=gameMode!=='track'?0:director.target(race,presentation.camera,elapsed);
      cameraY+=(target-cameraY)*(1-Math.exp(-elapsed*4));
    }
    if(race.finished.length){if(winnerElapsed===null){winnerElapsed=0;winSound();}else winnerElapsed+=elapsed;}
    if(race.state==='finished')resultElapsed+=elapsed;
  }
  draw();if(race.state==='finished'&&isRecording()&&resultElapsed>=presentation.outro)stopRecord();
  music.sync(view==='watch'&&!paused&&(countdown>0||race.state==='running'||(race.state==='finished'&&resultElapsed<presentation.outro)),gameMode==='track'?race.ranking()[0]:null,race.state==='running'||countdown>0);
  uiTick+=elapsed;if(uiTick>.12){if(view==='watch')updateUI();uiTick=0;}requestAnimationFrame(frame);
}

function recordingUI(active) {
  music.lock(active);
  $('#record').classList.toggle('recording',active);
  $('#record').innerHTML=active?'■ Kaydı bitir ve indir':'<span aria-hidden="true">●</span> Videoya kaydet';
  $('#record-help').textContent=active?'Kayıt sürüyor. Bu sekmeyi açık tut; finişte videon otomatik indirilecek.':'Yarış baştan oynatılır ve kaydedilir. Bittiğinde dikey videon otomatik iner.';
  for(const selector of ['#nav-track','#nav-arena','#nav-statistics','#nav-spiral','#open-settings','#reset','#speed','#new-race','#camera','#count','#open-balls','#track-preset','#spiral-theme','#arena-game','#arena-shape','#territory-duration','#sound'])$(selector).disabled=active;
}
async function startRecord() {
  if(recordStarting||raceStarting||exportPreparing)return;
  if(isRecording()){stopRecord();return;}
  if(!race.sectionCount)return;
  if(!window.MediaRecorder||!canvas.captureStream){toast('Bu tarayıcı video kaydını desteklemiyor. Chrome veya Edge ile aç.');return;}
  const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  if(!mime){toast('Bu tarayıcıda WebM kaydı kullanılamıyor.');return;}
  // Claim the start before any asynchronous preparation can yield to another request.
  recordStarting=true;
  let stream;
  try {
    recordingUI(true);updateUI();
    await Promise.all(ballImages.map(loadBallImage));
    initAudio();resetRace();$('#speed').value='1';
    await music.prepare({mode:gameMode,balls:race.balls});
    stream=canvas.captureStream(60);
    if($('#sound').checked||music.enabled())audioDestination.stream.getAudioTracks().forEach(t=>stream.addTrack(t.clone()));
    const session=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:10_000_000});
    const chunks=[];
    const filename=gameMode==='spiral'?`marble-spiral-${race.seed}.webm`:gameMode==='arena'?`marble-orbit-${race.seed}.webm`:`marble-${race.sectionCount}-bolum-${race.seed}.webm`;
    const recordingMode=gameMode,recordingTitle=projectName;
    let failed=false;
    session.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    session.onstop=()=>{
      stream.getTracks().forEach(t=>t.stop());
      if(recorder===session)recorder=null;
      recordingUI(false);
      if(failed||!chunks.length){toast('Video kaydı oluşturulamadı. Tekrar deneyebilirsin.');return;}
      if(downloadURL)URL.revokeObjectURL(downloadURL);
      const videoBlob=new Blob(chunks,{type:'video/webm'});downloadURL=URL.createObjectURL(videoBlob);
      const link=$('#download-video');link.href=downloadURL;link.download=filename;
      $('#download-panel').hidden=false;link.click();toast('Videon hazır ve indirildi.');updateUI();
      archiveBrowserVideo(videoBlob,{name:recordingTitle,mode:recordingMode});
    };
    session.onerror=()=>{failed=true;stopRecord();};
    recorder=session;session.start(1000);
    beginRace();cameraY=0;$('#download-panel').hidden=true;setView('watch');recordingUI(true);updateUI();
  } catch(error) {stream?.getTracks().forEach(t=>t.stop());recorder=null;recordingUI(false);toast('Kayıt başlatılamadı. Müziğin yüklendiğini kontrol edip tekrar dene.');}
  finally {recordStarting=false;updateUI();}
}
function stopRecord() {
  if(isRecording())recorder.stop();
  recordingUI(false);
}

$('#new-race').onclick=()=>startRace(true);$('#pause').onclick=togglePause;$('#reset').onclick=resetRace;
$('#nav-track').onclick=()=>switchRaceMode('track');$('#nav-arena').onclick=()=>switchRaceMode('arena');
$('#nav-spiral').onclick=()=>switchRaceMode('spiral');
$('#nav-statistics').onclick=()=>setView('statistics');
$('#count').onchange=resetRace;
$('#arena-game').onchange=()=>{arenaGame=$('#arena-game').value;resetRace();};
$('#arena-shape').onchange=()=>{arenaShape=$('#arena-shape').value;resetRace();};
$('#territory-duration').onchange=()=>{territoryDuration=Number($('#territory-duration').value);resetRace();};
$('#speed').onchange=persistDraft;
$('#spiral-theme').onchange=()=>{
  if(isRecording()||recordStarting||raceStarting)return;
  spiralTheme=normalizeSpiralTheme($('#spiral-theme').value);resetRace();
};
$('#track-preset').onchange=()=>{
  trackPreset=$('#track-preset').value;
  if(trackPreset==='saved')return;
  const presetRace=new Race({preset:trackPreset,seed:Number($('#seed').value),sections:4});
  sequence=structuredClone(presetRace.sequence);presetRace.dispose();projectName=$('#track-preset').selectedOptions[0].textContent;resetRace();
};
$('#sound').onchange=()=>{if($('#sound').checked)initAudio();persistDraft();};
$('#open-settings').onclick=()=>showDialog('#settings-dialog');
$('#settings-done').onclick=()=>closeDialog('#settings-dialog');
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeDialog('#'+b.dataset.close));
// Native dialogs trap focus, restore it on close, and support Escape.
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',e=>{
  if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();
});
$('#seed').onchange=resetRace;
$('#shuffle').onclick=()=>{freshSeed();resetRace();toast('Başlangıç dizilişi ve hareket düzeni yenilendi.');};
$('#trails').onchange=()=>{draw();persistDraft();};
for(const id of ['#countdown-seconds','#outro-seconds','#camera'])$(id).onchange=()=>{
  try{presentation=normalizePresentation({countdown:Number($('#countdown-seconds').value),outro:Number($('#outro-seconds').value),camera:$('#camera').value});director=createCameraDirector();persistDraft();}
  catch(e){syncPresentation();toast(e.message);}
};
$('#cinema').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('.race-stage').requestFullscreen();}catch{toast('Tam ekran kullanılamıyor.');}};
$('#record').onclick=startRecord;
document.addEventListener('keydown',e=>{
  if(e.code==='Space'&&view==='watch'&&!document.querySelector('dialog[open]')&&!['INPUT','SELECT','BUTTON','A','SUMMARY'].includes(document.activeElement.tagName)){
    e.preventDefault();togglePause();
  }
});
document.addEventListener('visibilitychange',()=>{last=performance.now();});
resetRace();setView('watch',false);requestAnimationFrame(frame);
window.marbleStudio={getStatisticsState:()=>statistics.state(),getState:()=>({music:music.state(),leader:race.ranking()[0]?.name,mode:gameMode,spiralTheme,spiralProgress:race.progress,spiralRound:race.round,spiralMultiplier:race.multiplier,consumed:race.totalConsumed,totalBreaks:race.totalBreaks,links:race.links?.length,active:race.balls.filter(b=>b.eliminatedAt===null).length,cuts:race.totalCuts,name:projectName,state:race.state,view,workspace:view==='statistics'?'statistics':gameMode,time:race.time,count:race.balls.length,finished:race.finished.length,custom:race.isCustom,paused,cameraY,finishY:race.finishY,sections:race.sections.map(s=>({type:s.type,y:s.y,settings:s.settings})),seed:race.seed,recording:isRecording(),positions:race.balls.map(b=>({x:b.body.position.x,y:b.body.position.y})),names:race.balls.map(b=>b.name),podium:race.finished.slice(0,3).map(b=>({id:b.id,name:b.name,time:b.finishedAt})),countdown,resultElapsed,presentation:{...presentation}})};


const busy=()=>isRecording()||recordStarting||raceStarting||exportPreparing||statistics.isRecording();
async function captureSnapshot(){
  if(busy())throw new Error('Önce kaydı bitir.');
  persistDraft();const mode=gameMode,project=getProject(),balls=[...race.balls],stats=view==='statistics'?statistics.snapshot():null;
  exportPreparing=true;paused=true;if(stats)statistics.pause();music.suspend();music.lock(true);updateUI();
  try{return normalizeSnapshot(stats?{mode:'statistics',statistics:stats}:{mode,project,music:await music.exportPlan(balls)});}
  finally{exportPreparing=false;music.lock(false);updateUI();}
}
function previewThumbnail(){
  const picture=view==='statistics'?document.querySelector('#statistics-canvas'):canvas;
  const preview=document.createElement('canvas');preview.width=240;preview.height=Math.round(240*picture.height/picture.width);preview.getContext('2d').drawImage(picture,0,0,preview.width,preview.height);return preview.toDataURL('image/jpeg',.7);
}
async function openSnapshot(raw){
  if(busy())throw new Error('Önce kaydı bitir.');const saved=normalizeSnapshot(raw);document.body.classList.remove('automatic-home');persistDraft();
  if(saved.mode==='statistics'){statistics.loadSnapshot(saved.statistics);statistics.persist();setView('statistics');return;}
  modeDrafts[saved.mode]={...saved.project,preset:'saved',speed:'1',spiralSfxVersion:1};
  // Persist the currently open race before replacing the selected draft.
  localStorage.setItem('marble-studio-'+saved.mode+'-v1',JSON.stringify(modeDrafts[saved.mode]));
  switchRaceMode(saved.mode,true);music.importPlan(saved.music);persistDraft();
}
const workbench=createWorkbench({capture:captureSnapshot,openSnapshot,thumbnail:previewThumbnail,title:()=>view==='statistics'?statistics.snapshot().heading:projectName,notify:toast,isLocked:busy});
$('#studio-export').onclick=()=>workbench.openExport();
$('#studio-works').onclick=()=>workbench.openWorks();
$('#studio-videos').onclick=()=>workbench.openVideos();
for(const button of document.querySelectorAll('[data-create-video]'))button.onclick=()=>workbench.openExport();
async function fullBackup(){persistDraft();return {...createBackup(localStorage),works:await workbench.works()};}
$('#studio-backup').onclick=async()=>{try{downloadJSON(await fullBackup(),'marble-studio-yedek.json');}catch(error){toast(error.message);}};
$('#studio-restore').onclick=()=>$('#studio-backup-file').click();
$('#studio-backup-file').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    if(busy())throw new Error('Önce kaydı bitir.');if(file.size>64000000)throw new Error('Yedek en fazla 64 MB olabilir.');
    const backup=parseBackup(await file.text()),previous=await fullBackup();downloadJSON(previous,'marble-studio-geri-yukleme-oncesi.json');
    if(backup.works!==undefined)await workbench.restoreWorks(backup.works);
    try{restoreBackup(localStorage,backup);}catch(error){if(backup.works!==undefined)await workbench.restoreWorks(previous.works);throw error;}
    location.reload();
  }catch(error){toast(error.message);}finally{e.target.value='';}
};

createAutomaticHome({create:options=>workbench.createAutomatic(options),videos:()=>workbench.openVideos(),works:()=>workbench.openWorks(),youtubeAccounts:()=>workbench.youtubeAccounts(),busy,pause:()=>{paused=true;statistics.pause();music.suspend();updateUI();}});
