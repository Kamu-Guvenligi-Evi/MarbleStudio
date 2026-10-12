import {PiSession,normalizePi,PI_KEY,PI_MAX_DIGITS} from './pi-collisions.js';
import {renderPi} from './pi-renderer.js';
import './pi-studio.css';

export function createPiStudio({notify,onExport}){
  const root=document.querySelector('#pi-view');
  root.innerHTML=`<div class="watch-heading"><div><p class="eyebrow">İKİ BLOK · BİR DUVAR · π</p><h1 id="pi-title" tabindex="-1">Pi Çarpışmaları</h1><p class="workspace-description">Kütleyi artır. Çarpışmaları say. Pi’nin basamaklarını keşfet.</p></div><span id="pi-save-status" class="save-status" role="status"></span></div>
  <div class="pi-layout"><div class="pi-stage"><canvas id="pi-canvas" width="1080" height="1920" aria-label="Pi çarpışmaları: iki blok ve sağda bir tuğla duvar"></canvas></div>
  <aside class="pi-controls" aria-label="Pi çarpışma ayarları"><h2>Çarpışmalardan π’ye</h2><p>Mavi blok, 1 kg’lık mor bloğa doğru hareket eder. Blokların birbirine ve duvara her çarpması sayılır.</p>
  <div class="pi-live-mass"><span>ŞU ANKİ KÜTLE</span><strong id="pi-mass">1 kg</strong><small id="pi-round">Tur 1 / ${PI_MAX_DIGITS}</small></div>
  <label class="pi-toggle"><input type="checkbox" id="pi-auto" checked> Her turda kilogramı otomatik artır</label>
  <p class="pi-sequence-note">1 kg’dan 10 milyar kg’a kadar, her turda ×100. Her sonuçtan sonra kısa bir ara, ardından yeni tur.</p>
  <label>Başlangıç kütlesi<select id="pi-digits"><option value="1">1 kg · 1 basamak</option><option value="2">100 kg · 2 basamak</option><option value="3">10.000 kg · 3 basamak</option><option value="4">1.000.000 kg · 4 basamak</option><option value="5">100.000.000 kg · 5 basamak</option><option value="6">10.000.000.000 kg · 6 basamak</option></select></label>
  <label>Oynatma hızı<select id="pi-speed"><option value="0.25">0,25× · Çok yavaş</option><option value="0.5">0,5× · Yavaş</option><option value="1" selected>1× · Normal</option><option value="2">2× · Hızlı</option><option value="3">3× · Çok hızlı</option></select></label>
  <label class="pi-toggle"><input type="checkbox" id="pi-sound" checked> Çarpışma sesleri</label>
  <div class="pi-actions"><button id="pi-play" class="button primary">▶ Başlat</button><button id="pi-reset" class="button secondary">↻ Sıfırla</button></div>
  <div class="pi-actions"><button id="pi-step" class="button secondary">Sonraki çarpışma</button><button id="pi-fullscreen" class="button subtle">Tam ekran</button></div>
  <div class="pi-stats"><div><span>Çarpışmalar</span><strong id="pi-count">0</strong></div><div><span>Simülasyon süresi</span><strong id="pi-time">0,00 sn</strong></div></div>
  <div id="pi-status" class="pi-status" role="status">Başlamaya hazır.</div>
  <button id="pi-export" class="button primary">MP4 video oluştur</button>
  <p>Sürtünmesiz, tam esnek çarpışmalar. Kütle oranı 100’ün kuvvetleri olduğunda sayaç π’nin ilk basamaklarını verir. <a href="https://www.mathnet.ru/php/archive.phtml?jrnid=rcd&option_lang=eng&paperid=790&wshow=paper" target="_blank" rel="noopener noreferrer">Galperin deneyi ↗</a></p></aside></div>`;
  const $=key=>document.getElementById('pi-'+key),canvas=$('canvas'),ctx=canvas.getContext('2d');
  let options=normalizePi({digits:1,autoIncrease:true}),race,active=false,playing=false,last=0,audio=null,lastTone=-1;
  try{const saved=JSON.parse(localStorage.getItem(PI_KEY));if(saved)options=normalizePi(saved.autoIncrease===undefined?{...saved,digits:1,autoIncrease:true}:saved);}catch{notify('Pi taslağı okunamadı; varsayılan ayarlar açıldı.');}
  function sync(){ $('digits').value=String(options.digits);$('speed').value=String(options.speed);$('sound').checked=options.sound;$('auto').checked=options.autoIncrease; }
  function persist(){try{localStorage.setItem(PI_KEY,JSON.stringify(options));$('save-status').textContent='✓ Pi ayarları kaydedildi';}catch{$('save-status').textContent='Ayarlar bu oturumda saklanıyor';}}
  function unlockAudio(){if(!options.sound)return;try{audio??=new AudioContext();void audio.resume().catch(()=>{});}catch{}}
  function hit(event){
    if(!options.sound||!audio||audio.state!=='running'||!active)return;
    const now=audio.currentTime;if(now-lastTone<.035)return;lastTone=now;
    const osc=audio.createOscillator(),gain=audio.createGain();osc.type='triangle';osc.frequency.value=event.type==='wall'?720:420;
    gain.gain.setValueAtTime(.045,now);gain.gain.exponentialRampToValueAtTime(.001,now+.055);
    osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+.06);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  function draw(){renderPi(ctx,race,{paused:!playing&&race.state==='running'});}
  function ui(){
    $('play').textContent=playing?'Ⅱ Duraklat':race.state==='finished'?'↻ Yeniden oynat':race.state==='ready'?'▶ Başlat':'▶ Devam et';
    $('count').textContent=String(race.collisions);$('time').textContent=race.time.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' sn';
    $('step').disabled=playing||race.state==='finished';
    $('status').textContent=race.state==='finished'?`${race.collisions} çarpışma → π ≈ ${race.approximation}`:playing?'Çarpışmalar sayılıyor…':race.state==='ready'?'Başlamaya hazır.':'Duraklatıldı. Sonraki çarpışmayı tek tek inceleyebilirsin.';
    if(race.transitioning)$('status').textContent=`${race.collisions} çarpışma → π ≈ ${race.approximation}. ${new Intl.NumberFormat('tr-TR').format(race.mass*100)} kg ${playing?'ile devam ediliyor…':'için devam et.'}`;
    $('mass').textContent=new Intl.NumberFormat('tr-TR').format(race.mass)+' kg';
    $('round').textContent=options.autoIncrease?`Tur ${race.current.options.digits-options.digits+1} / ${PI_MAX_DIGITS+1-options.digits}`:'Tek tur';
    canvas.setAttribute('aria-label',`Pi çarpışmaları: ${race.collisions} çarpışma, mavi blok ${race.mass} kg, mor blok 1 kg.`);
  }
  function reset(){playing=false;race=new PiSession({...options,onHit:hit});ui();draw();}
  function pause(){playing=false;ui();draw();}
  function toggle(){unlockAudio();if(race.state==='finished')reset();playing=!playing;if(playing){race.start();last=performance.now();}ui();draw();}
  $('play').onclick=toggle;$('reset').onclick=reset;
  $('step').onclick=()=>{unlockAudio();race.nextCollision();ui();draw();};
  $('digits').onchange=()=>{options=normalizePi({...options,digits:$('digits').value});persist();reset();};
  $('auto').onchange=()=>{options.autoIncrease=$('auto').checked;persist();reset();};
  $('speed').onchange=()=>{options=normalizePi({...options,speed:$('speed').value});persist();ui();};
  $('sound').onchange=()=>{options.sound=$('sound').checked;unlockAudio();persist();};
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await root.querySelector('.pi-stage').requestFullscreen();}catch{notify('Tam ekran kullanılamıyor.');}};
  $('export').onclick=()=>{pause();onExport();};
  document.addEventListener('keydown',e=>{if(active&&e.code==='Space'&&!document.querySelector('dialog[open]')&&!['INPUT','SELECT','TEXTAREA','BUTTON','A','SUMMARY'].includes(document.activeElement.tagName)){e.preventDefault();toggle();}});
  document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden&&active)pause();});
  function frame(now){const dt=Math.min(Math.max((now-last)/1000,0),.05);last=now;if(active&&playing){race.step(dt*options.speed);if(race.state==='finished')playing=false;draw();ui();}requestAnimationFrame(frame);}
  sync();reset();persist();requestAnimationFrame(frame);
  return {setActive(value){active=value;if(!value)pause();else draw();},pause,snapshot:()=>({...options}),
    loadSnapshot(raw){options=normalizePi(raw);sync();reset();persist();},
    state:()=>({mode:'pi',state:race.state,playing,collisions:race.collisions,time:race.time,energy:race.energy,mass:race.mass,currentDigits:race.current.options.digits,transitioning:race.transitioning,rounds:race.rounds.map(round=>({...round})),...options})};
}
