import './automatic-home.css';
import {factoryOrigin} from './service-origin.js';
import {DEFAULT_VIDEO_FPS} from './video-settings.js';

const labels={track:'Parkur',arena:'Küre Arenası',territory:'Alan Savaşı',spiral:'Spiral',statistics:'İstatistik'};
export async function automaticOptions(choice){
  if(!['auto',...Object.keys(labels)].includes(choice))throw new Error('İçerik türü geçersiz.');
  return {automatic:true,automaticMode:choice,count:1,duration:55,language:'en',channel:'Marble Studio',resolution:1080,fps:DEFAULT_VIDEO_FPS,template:'minimal'};
}

export function createAutomaticHome({create,videos,works,busy,pause,youtubeAccounts,edit}){
  const home=document.createElement('section');home.id='automatic-start';home.setAttribute('aria-labelledby','automatic-title');
  home.innerHTML=`<button id="automatic-manual" class="button subtle">← Manuel stüdyoya dön</button><div class="automatic-intro"><span class="automatic-dot" aria-hidden="true"></span><h1 id="automatic-title" tabindex="-1">Otomatik üretim</h1><p>Türünü seç. Düzen, kadro ve video ayarlarını Studio hazırlasın.</p></div>
    <form id="automatic-form"><fieldset><legend>Ne oluşturalım?</legend><div class="automatic-choices">
    <label><input type="radio" name="kind" value="auto" checked><span>Bana bırak</span></label>
    ${Object.entries(labels).map(([key,label])=>`<label><input type="radio" name="kind" value="${key}"><span>${label}</span></label>`).join('')}
    </div></fieldset><p id="automatic-note">Parkur, küre arenası, alan savaşı veya spiral seçilir. Düzen, kadro, müzik ve video ayarları otomatik hazırlanır.</p>
    <p>Tamamlanan videolar GitHub’daki ortak arşive otomatik eklenir.</p><div class="automatic-youtube"><label>YouTube kanalı<select id="automatic-youtube-channel"><option value="">YouTube kapalı</option></select></label><label>Görünürlük<select id="automatic-youtube-privacy"><option value="private">Gizli</option><option value="unlisted">Liste dışı</option><option value="public">Herkese açık</option></select></label><p><span id="automatic-youtube-note">Kanal bağlamak için İçerik Atölyesi'ni aç.</span> <a href="${factoryOrigin()}/factory.html#youtube" target="_blank" rel="noopener noreferrer">İçerik Atölyesi ↗</a></p></div>
    <button id="automatic-create" class="button primary" type="submit">Videomu oluştur</button><p id="automatic-status" role="status"></p></form>
    <div class="automatic-links"><a href="/glass-breaker.html" class="button secondary" style="text-decoration:none">◇ Cam Kırıcı</a><a href="/spiral-breaker.html" class="button secondary" style="text-decoration:none">▧ Spiral Kırıcı</a><button id="automatic-pi">π Pi Çarpışmaları</button><button id="automatic-videos">Videolarım</button><button id="automatic-edit">Kendim düzenleyeyim</button></div>`;
  document.querySelector('main').before(home);
  const back=document.createElement('button');back.id='automatic-back';back.className='button subtle';back.textContent='Otomatik üretim';back.setAttribute('aria-controls','automatic-start');back.setAttribute('aria-expanded','false');document.querySelector('.studio-export-bar').prepend(back);
  const $=id=>document.getElementById(id);let pending=false,studioTitle=document.title;
  async function refreshYouTube(){try{const info=await youtubeAccounts();const select=$('automatic-youtube-channel'),selected=select.value;select.replaceChildren(new Option('YouTube kapalı',''),...info.accounts.map(a=>new Option(a.title,a.id)));select.value=selected;$('automatic-youtube-note').textContent=info.accounts.length?'Kanal seçersen video üretim bitince otomatik yüklenir.':'Kanal bağlamak için İçerik Atölyesi’ni aç.';}catch{$('automatic-youtube-note').textContent='YouTube bağlantısı için video hizmetini aç.';}}
  const show=()=>{if(busy())return;studioTitle=document.title;pause();document.body.classList.add('automatic-home');back.setAttribute('aria-expanded','true');document.title='Marble Studio — Otomatik üretim';window.scrollTo(0,0);$('automatic-title').focus({preventScroll:true});void refreshYouTube();};
  const manual=()=>{if(busy()||!document.body.classList.contains('automatic-home'))return;document.body.classList.remove('automatic-home');back.setAttribute('aria-expanded','false');document.title=studioTitle;window.scrollTo(0,0);document.querySelector('.view-tabs [aria-pressed="true"]')?.focus({preventScroll:true});};
  back.onclick=show;
  $('automatic-manual').onclick=manual;
  document.querySelector('.brand').onclick=event=>{event.preventDefault();manual();};
  $('automatic-pi').onclick=()=>{if(busy())return;manual();edit?.('pi');};
  $('automatic-edit').textContent='Bu türü stüdyoda düzenle';
  $('automatic-edit').onclick=()=>{if(busy())return;manual();const kind=new FormData($('automatic-form')).get('kind');edit?.(kind);document.querySelector(kind==='statistics'?'#statistics-title':'#watch-title').focus({preventScroll:true});};
  $('automatic-videos').onclick=videos;
  const library=document.createElement('button');library.textContent='Çalışmalarım';library.onclick=works;library.className='automatic-library';home.querySelector('.automatic-links').append(library);
  $('automatic-form').onchange=()=>{
    const kind=new FormData($('automatic-form')).get('kind');
    $('automatic-note').textContent=kind==='statistics'?'Kaynaklı kütüphaneden bir konu seçilir. Tablo ve başlıkla 30 saniyelik yatay video hazırlanır.':kind==='territory'?'Dikey arena, üçgen, kare, altıgen veya dairede alan kapma mücadelesi. Şekil, kadro ve müzik otomatik seçilir; 144 FPS video hazırlanır.':(kind==='auto'?'Parkur, küre arenası, alan savaşı veya spiral seçilir. ':'')+'Düzen, kadro ve müzik otomatik seçilir. Yarışın akışına uygun, kısa bir dikey video hazırlanır.';
  };
  $('automatic-form').onsubmit=async event=>{
    event.preventDefault();if(pending||busy())return;pending=true;
    const button=$('automatic-create');button.disabled=true;button.textContent='Hazırlanıyor…';$('automatic-status').textContent='';
    try{const options=await automaticOptions(new FormData($('automatic-form')).get('kind'));const channelId=$('automatic-youtube-channel').value;if(channelId)options.youtube={channelId,privacyStatus:$('automatic-youtube-privacy').value};if(await create(options)===false)return;$('automatic-status').textContent='Videon kuyruğa eklendi. Hazır olduğunda Videolarım’da bulabilirsin.';}
    catch(error){$('automatic-status').textContent=error.message;}
    finally{pending=false;button.disabled=false;button.textContent='Videomu oluştur';}
  };
  window.addEventListener('focus',()=>{if(document.body.classList.contains('automatic-home'))void refreshYouTube();});
}
