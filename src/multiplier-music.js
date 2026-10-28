// Uses the studio's installed music library; no external track downloads.
export function mountMultiplierMusic({settings,save,notify}){
  const $=id=>document.getElementById(id),player=$('music-audio'),select=$('music-track');
  let tracks=[],active=false,unlocked=false,preview=false,revision=0;
  function stop(){revision++;player.pause();preview=false;$('music-preview').textContent='Preview music';}
  function play(){
    if(!unlocked||!select.value||!player.paused)return;
    const current=++revision;
    player.play().catch(()=>{if(current===revision){stop();notify('Music could not start. Try Preview music.');}});
  }
  function sync(){
    stop();select.value=settings.music.track;
    const track=tracks.find(t=>t.id===select.value);
    if(track)player.src=track.src;else{player.removeAttribute('src');player.load();}
    player.volume=settings.music.volume/100;$('music-volume').value=settings.music.volume;$('music-level').value=settings.music.volume+'%';
    $('music-credit').textContent=track?`${track.title} · ${track.artist} · ${track.license}`:'';
    $('music-preview').disabled=!track;if(active&&settings.sound)play();
  }
  select.onchange=()=>{settings.music.track=select.value;save();sync();};
  $('music-volume').oninput=e=>{settings.music.volume=Number(e.target.value);player.volume=settings.music.volume/100;$('music-level').value=e.target.value+'%';save();};
  $('music-preview').onclick=()=>{unlocked=true;if(preview){stop();return;}preview=true;$('music-preview').textContent='Stop preview';play();};
  document.addEventListener('pointerdown',()=>{unlocked=true;if(active&&settings.sound)play();},{once:true});
  fetch('/music/manifest.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{tracks=data;for(const t of tracks)select.add(new Option(t.title,t.id));sync();}).catch(()=>notify('Music library could not load.'));
  return {sync,suspend(){stop();active=false;},reset(){stop();if(player.hasAttribute('src'))player.currentTime=0;active=false;},update(running){const next=running&&settings.sound;if(next===active)return;active=next;if(active)play();else stop();}};
}
