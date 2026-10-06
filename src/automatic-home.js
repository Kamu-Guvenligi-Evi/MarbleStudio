import './automatic-home.css';

const labels={track:'Parkur',arena:'Arena',spiral:'Spiral',statistics:'İstatistik'};
export async function automaticOptions(choice){
  if(!['auto',...Object.keys(labels)].includes(choice))throw new Error('İçerik türü geçersiz.');
  return {automatic:true,automaticMode:choice,count:1,duration:55,language:'tr',channel:'Marble Studio',resolution:1080,fps:60,template:'minimal'};
}

export function createAutomaticHome({create,videos,works,busy,pause,youtubeAccounts}){
  const home=document.createElement('section');home.id='automatic-start';home.setAttribute('aria-labelledby','automatic-title');
  home.innerHTML=`<div class="automatic-intro"><span class="automatic-dot" aria-hidden="true"></span><h1 id="automatic-title" tabindex="-1">Bir video hazırlayalım.</h1><p>Türünü seç. Geri kalanını Studio hazırlasın.</p></div>
    <form id="automatic-form"><fieldset><legend>Ne oluşturalım?</legend><div class="automatic-choices">
    <label><input type="radio" name="kind" value="auto" checked><span>Bana bırak</span></label>
    ${Object.entries(labels).map(([key,label])=>`<label><input type="radio" name="kind" value="${key}"><span>${label}</span></label>`).join('')}
    </div></fieldset><p id="automatic-note">Parkur, arena veya spiral seçilir. Düzen, kadro, müzik ve video ayarları otomatik hazırlanır.</p>
    <p>Tamamlanan videolar GitHub’daki ortak arşive otomatik eklenir.</p><div class="automatic-youtube"><label>YouTube kanalı<select id="automatic-youtube-channel"><option value="">YouTube kapalı</option></select></label><label>Görünürlük<select id="automatic-youtube-privacy"><option value="private">Gizli</option><option value="unlisted">Liste dışı</option><option value="public">Herkese açık</option></select></label><p><span id="automatic-youtube-note">Kanal bağlamak için İçerik Atölyesi'ni aç.</span> <a href="http://127.0.0.1:5180/factory.html#youtube" target="_blank" rel="noopener noreferrer">İçerik Atölyesi ↗</a></p></div>
    <button id="automatic-create" class="button primary" type="submit">Videomu oluştur</button><p id="automatic-status" role="status"></p></form>
    <div class="automatic-links"><button id="automatic-videos">Videolarım</button><button id="automatic-edit">Kendim düzenleyeyim</button></div>`;
  document.querySelector('main').before(home);
  const back=document.createElement('button');back.id='automatic-back';back.className='button subtle';back.textContent='← Ana ekran';document.querySelector('.studio-export-bar').prepend(back);
  const $=id=>document.getElementById(id);let pending=false;
  async function refreshYouTube(){try{const info=await youtubeAccounts();const select=$('automatic-youtube-channel'),selected=select.value;select.replaceChildren(new Option('YouTube kapalı',''),...info.accounts.map(a=>new Option(a.title,a.id)));select.value=selected;$('automatic-youtube-note').textContent=info.accounts.length?'Kanal seçersen video üretim bitince otomatik yüklenir.':'Kanal bağlamak için İçerik Atölyesi’ni aç.';}catch{$('automatic-youtube-note').textContent='YouTube bağlantısı için video hizmetini aç.';}}
  const show=()=>{if(busy())return;pause();document.body.classList.add('automatic-home');document.title='Marble Studio';window.scrollTo(0,0);$('automatic-title').focus({preventScroll:true});void refreshYouTube();};
  back.onclick=show;
  $('automatic-edit').onclick=()=>{document.body.classList.remove('automatic-home');document.querySelector('#watch-title').focus({preventScroll:true});};
  $('automatic-videos').onclick=videos;
  const library=document.createElement('button');library.textContent='Çalışmalarım';library.onclick=works;library.className='automatic-library';home.querySelector('.automatic-links').append(library);
  $('automatic-form').onchange=()=>{
    const kind=new FormData($('automatic-form')).get('kind');
    $('automatic-note').textContent=kind==='statistics'?'Kaynaklı kütüphaneden bir konu seçilir. Tablo ve başlıkla 30 saniyelik yatay video hazırlanır.':(kind==='auto'?'Parkur, arena veya spiral seçilir. ':'')+'Düzen, kadro ve müzik otomatik seçilir. Yarışın akışına uygun, kısa bir dikey video hazırlanır.';
  };
  $('automatic-form').onsubmit=async event=>{
    event.preventDefault();if(pending||busy())return;pending=true;
    const button=$('automatic-create');button.disabled=true;button.textContent='Hazırlanıyor…';$('automatic-status').textContent='';
    try{const options=await automaticOptions(new FormData($('automatic-form')).get('kind'));const channelId=$('automatic-youtube-channel').value;if(channelId)options.youtube={channelId,privacyStatus:$('automatic-youtube-privacy').value};await create(options);$('automatic-status').textContent='Videon kuyruğa eklendi. Hazır olduğunda Videolarım’da bulabilirsin.';}
    catch(error){$('automatic-status').textContent=error.message;}
    finally{pending=false;button.disabled=false;button.textContent='Videomu oluştur';}
  };
  if(new URL(location.href).searchParams.get('edit')!=='1')show();
  window.addEventListener('focus',()=>{if(document.body.classList.contains('automatic-home'))void refreshYouTube();});
}
