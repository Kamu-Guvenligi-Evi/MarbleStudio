import {createCountryMusic} from './country-music.js';

export async function createMusic({getAudio, notify}) {
  const $ = id => document.getElementById(id);
  const select = $('music-track'), volume = $('music-volume'), preview = $('music-preview');
  const player = $('music-audio');
  let tracks = [], source, gain, previewing = false, racing = false, playing = false, revision = 0;
  let countryMusic,gameMode='track',locked=false;
  const musicMode=$('music-mode');
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('marble-studio-music-track-v1')??localStorage.getItem('marble-studio-music-v1')) || {}; } catch {}
  let initialized=false;
  const level = Number(saved.volume);
  volume.value = String(Number.isFinite(level) ? Math.max(0, Math.min(100, level)) : 35);
  function persist() {
    if(!initialized)return;
    try { localStorage.setItem('marble-studio-music-'+gameMode+'-v1', JSON.stringify({track:select.value,volume:Number(volume.value),mode:musicMode.value})); } catch {}
  }
  function connect() {
    const {context, destination} = getAudio();
    if (!source) {
      source = context.createMediaElementSource(player);
      gain = context.createGain();source.connect(gain);
      gain.connect(context.destination);gain.connect(destination);
    }
    gain.gain.value = Number(volume.value) / 100;
  }
  function updateVolume() {
    if (gain) gain.gain.value = Number(volume.value) / 100;
    countryMusic?.setVolume(Number(volume.value)/100);
    $('music-volume-value').textContent = `${volume.value}%`;
    persist();
  }
  function stopPreview() { previewing=false;preview.textContent='Ön dinle'; }
  function stop() { revision++;player.pause();playing=false;stopPreview(); }
  function play() {
    if (!select.value || playing) return;
    connect();playing=true;
    const current=++revision;
    player.play().catch(() => {
      if(current!==revision)return;
      playing=false;stopPreview();notify('Müzik çalınamadı. Ön dinle düğmesiyle tekrar deneyebilirsin.');
    });
  }
  function choose() {
    stop();
    const track=tracks.find(t=>t.id===select.value);
    if(track)player.src=track.src;
    else {player.removeAttribute('src');player.load();}
    preview.disabled=!track;
    $('music-credit').hidden=!track;
    if(track) {
      $('music-source').href=track.source;
      $('music-attribution').value=[`${track.title} — ${track.artist}`,track.source,`${track.license}${track.licenseUrl?': '+track.licenseUrl:''}`,'Bu videoda müzik kesilmiş, tekrarlanmış ve diğer seslerle karıştırılmış olabilir.'].join('\n');
    }
    persist();if(racing)play();
  }
  volume.oninput=updateVolume;
  select.onchange=choose;
  preview.onclick=()=>{
    if(previewing){stop();if(racing)play();return;}
    stop();player.currentTime=0;previewing=true;preview.textContent='Dinlemeyi durdur';play();
  };
  $('music-copy').onclick=async()=>{
    try {await navigator.clipboard.writeText($('music-attribution').value);notify('Müzik atfı kopyalandı. Video açıklamasına ekleyebilirsin.');}
    catch {$('music-attribution').focus();$('music-attribution').select();notify('Atıf metnini seçtim; kopyalayabilirsin.');}
  };
  try {
    const response=await fetch('/music/manifest.json');
    if(!response.ok)throw new Error('Music library unavailable');
    tracks=await response.json();
    for(const track of tracks)select.add(new Option(`${track.title} · ${track.duration.slice(3)}`,track.id));
    select.value=tracks.some(t=>t.id===saved.track)?saved.track:'';
    choose();
  } catch {select.disabled=true;notify('Müzik kütüphanesi yüklenemedi. Sayfayı yenileyebilirsin.');}
  countryMusic=await createCountryMusic({tracks,getAudio,notify,onChange:()=>{
    if(racing)notify('Lider müziği değişti. Yeni eşleştirme bir sonraki yarışta hazırlanır.');
  }});
  musicMode.value=saved.mode==='fixed'?'fixed':'leader';
  function renderMode() {
    const leader=musicMode.value==='leader';
    $('music-countries').hidden=!leader;$('music-fixed').hidden=leader;
    preview.hidden=leader;$('music-credit').hidden=leader||!select.value;
  }
  musicMode.onchange=()=>{stop();countryMusic.reset();racing=false;renderMode();persist();};
  renderMode();
  initialized=true;
  updateVolume();
  return {
    importPlan(plan){stop();countryMusic.reset();racing=false;musicMode.value=gameMode==='track'&&plan.mode==='leader'?'leader':'fixed';select.value=tracks.some(t=>t.id===plan.track)?plan.track:'';volume.value=String(plan.volume??35);countryMusic.importPlan(plan.roster??[]);choose();renderMode();updateVolume();persist();},
    async exportPlan(balls){return {mode:musicMode.value,track:select.value,volume:Number(volume.value),roster:musicMode.value==='leader'?await countryMusic.exportPlan(balls):[]};},
    enabled:()=>musicMode.value==='leader'?countryMusic.enabled(gameMode):Boolean(select.value),
    state:()=>({mode:musicMode.value,...countryMusic.state()}),
    setGameMode(mode){
      if(mode!==gameMode){
        persist();stop();countryMusic.reset();racing=false;gameMode=mode;
        let settings={};try{settings=JSON.parse(localStorage.getItem('marble-studio-music-'+mode+'-v1'))||{};}catch{}
        musicMode.value=mode!=='track'?'fixed':settings.mode==='fixed'?'fixed':'leader';
        select.value=tracks.some(track=>track.id===settings.track)?settings.track:'';
        volume.value=String(Math.min(100,Math.max(0,Number(settings.volume??35)||0)));
        choose();renderMode();updateVolume();
      }
      musicMode.querySelector('option[value="leader"]').disabled=mode!=='track';
      musicMode.closest('label')?.toggleAttribute('hidden',mode!=='track');
      musicMode.hidden=mode!=='track';
      document.querySelector('label[for="music-mode"]').hidden=mode!=='track';
      countryMusic.setMode(mode);
    },
    sync(active,leader,started=false) {
      countryMusic.lock(locked||active||started);
      musicMode.disabled=locked||active||started;
      if(musicMode.value==='leader'){
        if(playing||previewing)stop();racing=active;countryMusic.sync(active,leader);return;
      }
      countryMusic.pause();
      if(active===racing)return;
      racing=active;
      if(active){stopPreview();play();}else stop();
    },
    reset(){stop();countryMusic.reset();racing=false;if(player.hasAttribute('src'))player.currentTime=0;},
    suspend(){stop();countryMusic.pause();racing=false;},
    lock(value){locked=value;countryMusic.lock(value);musicMode.disabled=value;select.disabled=value||!tracks.length;volume.disabled=value;preview.disabled=value||!select.value;},
    async prepare({mode=gameMode,balls=[]}={}) {
      this.reset();
      this.setGameMode(mode);
      if(musicMode.value==='leader'){
        if(mode==='track')await countryMusic.prepare(balls);
        return;
      }
      if(!select.value)return;
      connect();
      if(player.readyState>=3)return;
      await new Promise((resolve,reject)=>{
        const cleanup=()=>{clearTimeout(timer);player.removeEventListener('canplay',ready);player.removeEventListener('error',failed);};
        const ready=()=>{cleanup();resolve();};
        const failed=()=>{cleanup();reject(new Error('Müzik yüklenemedi.'));};
        const timer=setTimeout(failed,15000);
        player.addEventListener('canplay',ready);player.addEventListener('error',failed);
        player.load();
      });
    },
  };
}
