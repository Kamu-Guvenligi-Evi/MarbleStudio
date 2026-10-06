import './workbench.css';
import {normalizeSnapshot} from './studio-transfer.js';
import {createWorkStore} from './saved-works.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modeName={track:'Parkur yarışı',arena:'Küre arenası',spiral:'Spiral çoğalma',statistics:'İstatistik yarışı'};
export function createWorkbench({capture,openSnapshot,thumbnail,title,notify,isLocked}){
  const store=createWorkStore();let source=null,ready=false,submitting=false,offset=0,poll=null,refreshing=false,works=[],exportRevision=0;
  const root=document.createElement('div');root.innerHTML=`
  <dialog id="video-dialog" class="workbench-dialog" aria-labelledby="video-title">
    <div class="wb-heading"><div><p class="eyebrow">PAYLAŞMAYA HAZIRLA</p><h2 id="video-title">Video oluştur</h2></div><button class="wb-close" data-wb-close aria-label="Kapat">×</button></div>
    <div class="wb-source"><img id="video-thumbnail" alt="Çalışmanın önizlemesi"><div><strong id="video-source-name">Çalışma hazırlanıyor…</strong><p id="video-source-description"></p></div></div>
    <form id="video-form">
      <label>Ne hazırlayalım?<select name="strategy"><option value="exact">Bu çalışmayı videoya dönüştür</option><option value="variations">Bu ayarlarla seri üret</option></select></label>
      <div id="video-series" class="wb-pair" hidden><label>Video adedi<input name="count" type="number" min="1" max="30" value="3"></label><label>Hedef süre<select name="duration"><option value="30">30 saniye</option><option value="55" selected>55 saniye</option><option value="90">90 saniye</option></select></label></div>
      <fieldset class="wb-formats"><legend>Video biçimi</legend><label><input type="radio" name="orientation" value="portrait" checked><span>▯</span><b>Dikey</b><small>9:16</small></label><label><input type="radio" name="orientation" value="landscape"><span>▭</span><b>Yatay</b><small>16:9</small></label><label><input type="radio" name="orientation" value="square"><span>□</span><b>Kare</b><small>1:1</small></label></fieldset>
      <details id="video-advanced"><summary>Gelişmiş seçenekler</summary><div class="wb-pair"><label>Çözünürlük<select name="resolution"><option value="1080">1080p · Yüksek kalite</option><option value="720">720p · Daha küçük dosya</option></select></label><label>Akıcılık<select name="fps"><option value="60">60 FPS</option><option value="30">30 FPS</option></select></label></div>
      <label>Ses<select name="audio"><option value="all">Müzik ve efektler</option><option value="music">Yalnız müzik</option><option value="effects">Yalnız efektler</option><option value="none">Sessiz</option></select></label>
      <div class="wb-pair"><label>Sunum<select name="template"><option value="minimal">Sade</option><option value="broadcast">Yarış yayını</option><option value="cinema">Sinema</option></select></label><label>Dil<select name="language"><option value="tr">Türkçe</option><option value="en">İngilizce</option></select></label></div>
      <label>Seri / kanal adı<input name="channel" maxlength="60" value="Marble Studio" required></label><label>Giriş metni<input name="hook" maxlength="100" placeholder="Otomatik hazırla"></label><label>Kapanış metni<input name="outro" maxlength="100" placeholder="İsteğe bağlı"></label></details>
      <p id="video-format-note" class="wb-muted"></p><p id="video-message" role="status"></p><button id="video-submit" class="button primary" type="submit" disabled>Videoyu hazırla</button>
    </form>
  </dialog>
  <dialog id="works-dialog" class="workbench-dialog wide" aria-labelledby="works-title"><div class="wb-heading"><div><p class="eyebrow">KALDIĞIN YERDEN DEVAM ET</p><h2 id="works-title">Çalışmalarım</h2></div><button class="wb-close" data-wb-close aria-label="Kapat">×</button></div>
    <form id="work-save-form" class="wb-save"><label>Bu çalışmaya bir isim ver<input id="work-name" maxlength="80" required placeholder="Örneğin: Ülkeler yarışı"></label><button class="button primary" id="work-save">Yeni çalışma kaydet</button></form><p id="works-message" role="status"></p><div id="works-list" class="wb-cards"></div>
  </dialog>
  <dialog id="videos-dialog" class="workbench-dialog wide" aria-labelledby="videos-title"><div class="wb-heading"><div><p class="eyebrow">ÜRETTİĞİN VİDEOLAR</p><h2 id="videos-title">Videolarım</h2></div><button class="wb-close" data-wb-close aria-label="Kapat">×</button></div>
    <p>Tamamlanan ve yüklenen videolar GitHub’daki ortak arşive otomatik eklenir.</p><div class="wb-archive-controls"><label>Göster<select id="videos-filter"><option value="all">Tüm videolar</option><option value="done">Hazır</option><option value="queued">Sırada</option><option value="running">Hazırlanıyor</option><option value="failed">Hatalı</option><option value="cancelled">İptal edilen</option></select></label><span id="videos-summary"></span><button id="videos-refresh" class="button secondary">Yenile</button></div><p id="videos-message" role="status"></p><div id="videos-list" class="wb-cards"></div><div class="wb-pages"><button id="videos-previous" class="button secondary">Önceki</button><button id="videos-next" class="button secondary">Sonraki</button></div>
  </dialog>`;
  document.body.append(root);const $=id=>document.getElementById(id),form=$('video-form');
  const uploadButton=document.createElement('button');uploadButton.className='button secondary';uploadButton.textContent='Video yükle';uploadButton.id='videos-upload';
  const uploadInput=document.createElement('input');uploadInput.type='file';uploadInput.accept='.mp4,.webm,video/mp4,video/webm';uploadInput.hidden=true;uploadInput.id='videos-upload-file';
  document.querySelector('.wb-archive-controls').append(uploadButton,uploadInput);uploadButton.onclick=()=>uploadInput.click();
  const origin=()=>new URL(document.querySelector('.factory-link').href).origin;
  const failure='Video hizmetine bağlanılamadı. Masaüstündeki Marble Studio kısayolunu yeniden açıp Tekrar dene düğmesine bas.';
  async function uploadVideo(blob,{name='Video',mode='track'}={}){
    if(!blob.size||blob.size>1024**3)throw new Error('Video boş olamaz; en fazla 1 GB olabilir.');
    const type=blob.type.startsWith('video/webm')||name.toLowerCase().endsWith('.webm')?'video/webm':'video/mp4';
    const response=await fetch(origin()+'/api/import-video',{method:'POST',headers:{'Content-Type':type,'X-Marble-Mode':mode,'X-Marble-Title':encodeURIComponent(name)},body:blob});
    const data=await response.json();if(!response.ok)throw new Error(data.error??'Video yüklenemedi.');return data;
  }
  uploadInput.onchange=async()=>{const file=uploadInput.files[0];if(!file)return;uploadButton.disabled=true;$('videos-message').textContent='Video yükleniyor…';try{await uploadVideo(file,{name:file.name.replace(/\.(mp4|webm)$/i,'')});$('videos-message').textContent='';notify('Video eklendi. GitHub paylaşımı otomatik yapılacak.');await refreshVideos();}catch(error){$('videos-message').textContent=error.message;}finally{uploadInput.value='';uploadButton.disabled=false;}};
  async function api(route,body){
    let res;try{res=await fetch(origin()+'/api/'+route,{...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});}catch{throw new Error(failure);}
    const data=await res.json();if(!res.ok)throw new Error(data.error??'İşlem tamamlanamadı.');return data;
  }
  async function checkService(){const data=await api('factory?limit=1');if(data.apiVersion<3||!data.capabilities?.includes('studio-workbench'))throw new Error('Video hizmeti eski sürümde. Açık hizmeti kapatıp Marble Studio kısayolunu yeniden aç.');return data;}
  function show(dialog){for(const d of root.querySelectorAll('dialog[open]'))d.close();dialog.showModal();}
  for(const dialog of root.querySelectorAll('dialog')){
    dialog.querySelector('[data-wb-close]').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>{dialog.querySelectorAll('video').forEach(v=>v.pause());if(dialog.id==='videos-dialog'){clearInterval(poll);poll=null;}});
  }
  function updateForm(){
    const series=form.elements.strategy.value==='variations';$('video-series').hidden=!series;
    $('video-format-note').textContent=`${({portrait:'Dikey',landscape:'Yatay',square:'Kare'})[form.elements.orientation.value]} · ${form.elements.resolution.value}p · ${form.elements.fps.value} FPS · MP4. `+(series?'Kadro korunur, yarış düzenleri değişir.':'Aynı düzen ve özgün süre korunur.');
    if(source)$('video-source-description').textContent=modeName[source.mode]+(source.mode==='statistics'?' · Tablo ve kaynak bilgileriyle':' · Kadro ve seçtiğin müzikle');
  }
  form.addEventListener('change',()=>{updateForm();if(source)try{localStorage.setItem('marble-studio-export-'+source.mode+'-v1',JSON.stringify({...Object.fromEntries(new FormData(form)),fpsDefaultVersion:2}));}catch{}});
  async function openExport(snapshot,preview){
    if(isLocked())return;const revision=++exportRevision;show($('video-dialog'));source=null;ready=false;$('video-submit').disabled=true;$('video-submit').textContent='Hazırlanıyor…';$('video-message').textContent='Çalışma hazırlanıyor…';$('video-source-name').textContent='Çalışma hazırlanıyor…';$('video-thumbnail').src=preview??thumbnail();
    try{
      const captured=normalizeSnapshot(snapshot??await capture());if(revision!==exportRevision)return;source=captured;form.reset();form.elements.orientation.value=source.mode==='statistics'?'landscape':'portrait';form.elements.audio.value=source.mode==='statistics'?'none':source.project.sound?'all':'music';
      try{const saved=JSON.parse(localStorage.getItem('marble-studio-export-'+source.mode+'-v1')??'{}');for(const key of ['orientation','resolution','fps','audio','template','language','channel','hook','outro'])if(typeof saved[key]==='string'&&form.elements[key]){if(key==='fps'&&saved.fpsDefaultVersion!==2)continue;const input=form.elements[key];if(input.tagName==='SELECT'&&![...input.options].some(o=>o.value===saved[key]))continue;if(key==='orientation'&&!['portrait','landscape','square'].includes(saved[key]))continue;input.value=saved[key];}}catch{}
      form.elements.strategy.value='exact';form.elements.strategy.querySelector('[value=variations]').disabled=source.mode==='statistics';$('video-advanced').open=false;
      $('video-source-name').textContent=source.mode==='statistics'?source.statistics.heading:source.project.name;updateForm();
      await checkService();if(revision!==exportRevision)return;ready=true;$('video-message').textContent='Hazır olduğunda videonu bu pencereden izleyip indirebilirsin.';
    }catch(error){if(revision!==exportRevision)return;$('video-message').textContent=error.message;}
    $('video-submit').disabled=!source;$('video-submit').textContent=ready?'Videoyu hazırla':'Tekrar dene';
  }
  form.onsubmit=async e=>{
    e.preventDefault();if(submitting||!source)return;submitting=true;$('video-submit').disabled=true;
    try{
      if(!ready){await checkService();ready=true;$('video-submit').textContent='Videoyu hazırla';$('video-message').textContent='Bağlantı hazır. Videoyu hazırlayabilirsin.';return;}
      const fields=Object.fromEntries(new FormData(form));await api('queue',{...fields,count:fields.strategy==='exact'?1:Number(fields.count),duration:Number(fields.duration),resolution:Number(fields.resolution),fps:Number(fields.fps),source});
      notify('Video hazırlanmaya başladı.');await openVideos();
    }catch(error){$('video-message').textContent=error.message;}finally{submitting=false;$('video-submit').disabled=false;}
  };
  async function listWorks(){
    works=await store.list();$('works-list').innerHTML=works.length?works.map(work=>`<article class="wb-card"><img class="wb-cover" src="${work.thumbnail}" alt="${escape(work.name)} önizlemesi"><h3>${escape(work.name)}</h3><p>${modeName[work.snapshot.mode]}</p><div class="wb-buttons"><button class="button secondary" data-work="${work.id}" data-action="open">Aç</button><button class="button secondary" data-work="${work.id}" data-action="copy">Kopyala</button><button class="button primary" data-work="${work.id}" data-action="export">Video oluştur</button></div></article>`).join(''):'<p class="wb-empty">İlk çalışmanı kaydet. Kadron, müziğin ve ayarların bir arada dursun.</p>';
  }
  async function openWorks(){if(isLocked())return;show($('works-dialog'));$('work-name').value=title();$('works-message').textContent='';try{await listWorks();}catch(error){$('works-message').textContent=error.message;}}
  $('work-save-form').onsubmit=async e=>{e.preventDefault();const button=$('work-save');if(button.disabled)return;button.disabled=true;try{const snapshot=await capture(),name=$('work-name').value.trim();if(snapshot.project)snapshot.project.name=name;await store.put({id:crypto.randomUUID(),name,snapshot,thumbnail:thumbnail(),updatedAt:new Date().toISOString()});await listWorks();$('works-message').textContent='Çalışman kaydedildi.';}catch(error){$('works-message').textContent=error.message;}finally{button.disabled=false;}};
  $('works-list').onclick=async e=>{const button=e.target.closest('[data-work]');if(!button)return;const work=works.find(w=>w.id===button.dataset.work);if(!work)return;button.disabled=true;try{if(button.dataset.action==='open'){await openSnapshot(work.snapshot.project?{...work.snapshot,project:{...work.snapshot.project,name:work.name}}:work.snapshot);$('works-dialog').close();notify(work.name+' açıldı.');}else if(button.dataset.action==='copy'){await store.put({...work,id:crypto.randomUUID(),name:work.name.slice(0,70)+' · Kopya',updatedAt:new Date().toISOString()});await listWorks();}else await openExport(work.snapshot.project?{...work.snapshot,project:{...work.snapshot.project,name:work.name}}:work.snapshot,work.thumbnail);}catch(error){$('works-message').textContent=error.message;}finally{button.disabled=false;}};
  async function refreshVideos(){
    if(refreshing)return;refreshing=true;try{
      const data=await api('factory?limit=12&offset='+offset+'&state='+$('videos-filter').value);if(data.apiVersion<3)throw new Error('Video hizmetini yeni sürümle yeniden aç.');
      $('videos-message').textContent=data.storageError?'Kayıt sorunu: '+data.storageError:'';
      $('videos-summary').textContent=`${data.summary.done} hazır · ${data.summary.pending} hazırlanıyor`;$('videos-previous').disabled=offset===0;$('videos-next').disabled=offset+12>=data.total;
      const list=$('videos-list'),ids=new Set(data.jobs.map(j=>j.id));for(const card of [...list.children])if(!ids.has(card.dataset.job))card.remove();
      for(const [index,job] of data.jobs.entries()){
        let card=[...list.children].find(c=>c.dataset.job===job.id);if(!card){card=document.createElement('article');card.className='wb-card';card.dataset.job=job.id;}
        if(list.children[index]!==card)list.insertBefore(card,list.children[index]??null);
        const version=JSON.stringify([job.state,job.copy?.title,job.error,job.youtube]),base=origin()+'/output/'+encodeURIComponent(job.id)+'/';
        if(card.dataset.version!==version){card.dataset.version=version;card.innerHTML=`${job.state==='done'?`<video class="wb-video" controls preload="none" poster="${base}cover.jpg" src="${base}${job.videoFile==='video.webm'?'video.webm':'video.mp4'}?preview=1" aria-label="${escape(job.copy?.title??'Video')} önizlemesi"></video>`:''}<h3>${escape(job.copy?.title??modeName[job.mode])}</h3><p class="wb-job-status"></p>${['queued','running'].includes(job.state)?'<progress max="100"></progress>':''}${job.error?`<p>${escape(job.error)}</p>`:''}<div class="wb-buttons">${job.state==='done'?`<a class="button primary" href="${base}${job.videoFile==='video.webm'?'video.webm':'video.mp4'}" download>İndir</a><button class="button secondary" data-job-action="reveal">Klasörde göster</button><button class="button secondary" data-job-action="copy">Başlığı kopyala</button>`:`<button class="button secondary" data-job-action="${['queued','running'].includes(job.state)?'cancel':'retry'}">${['queued','running'].includes(job.state)?'İptal et':'Yeniden dene'}</button>`}</div>`;}
        if(job.youtube&&card.dataset.version===version&&!card.querySelector('.wb-youtube')){const p=document.createElement('p');p.className='wb-youtube';p.textContent='YouTube: '+({queued:'sırada',uploading:'yükleniyor',done:'yüklendi',failed:'yükleme hatası'}[job.youtube.state]??job.youtube.state)+(job.youtube.error?' · '+job.youtube.error:'');card.querySelector('.wb-buttons').before(p);if(job.youtube.url){const link=document.createElement('a');link.className='button secondary';link.href=job.youtube.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='YouTube’da aç';card.querySelector('.wb-buttons').append(link);}}
        card.querySelector('.wb-job-status').textContent=job.state==='running'?`${job.stage} · %${job.progress}`:job.stage;const progress=card.querySelector('progress');if(progress)progress.value=job.progress??0;
        let github=card.querySelector('.wb-github-status');if(!github){github=document.createElement('p');github.className='wb-github-status';card.querySelector('.wb-buttons').before(github);}
        github.textContent=job.shared?'GitHub’da paylaşıldı':data.githubSharing&&job.state==='done'?'GitHub: '+({queued:'paylaşım bekliyor',syncing:'gönderiliyor',done:'paylaşıldı',retrying:'yeniden denenecek'}[job.github?.state]??'paylaşım bekliyor')+(job.github?.error?' · '+job.github.error:''):'';
      }
      if(!data.jobs.length)list.innerHTML='<p class="wb-empty">Bu görünümde henüz video yok. Video oluştur düğmesiyle başlayabilirsin.</p>';
    }catch(error){$('videos-message').textContent=error.message;}finally{refreshing=false;}
  }
  async function openVideos(){show($('videos-dialog'));await refreshVideos();if($('videos-dialog').open&&!poll)poll=setInterval(()=>{if($('videos-dialog').open)void refreshVideos();},2000);}
  $('videos-filter').onchange=()=>{offset=0;void refreshVideos();};$('videos-refresh').onclick=()=>void refreshVideos();
  $('videos-previous').onclick=()=>{offset=Math.max(0,offset-12);void refreshVideos();};$('videos-next').onclick=()=>{offset+=12;void refreshVideos();};
  $('videos-list').onclick=async e=>{const button=e.target.closest('[data-job-action]');if(!button)return;button.disabled=true;try{const card=button.closest('[data-job]'),id=card.dataset.job;if(button.dataset.jobAction==='copy'){await navigator.clipboard.writeText(card.querySelector('h3').textContent);notify('Başlık kopyalandı.');}else{await api(button.dataset.jobAction,{id});await refreshVideos();}}catch(error){$('videos-message').textContent=error.message;}finally{button.disabled=false;}};
  return {uploadVideo,async createAutomatic(options){if(submitting)throw new Error('Video zaten hazırlanıyor.');submitting=true;try{const service=await checkService();if(!service.capabilities?.includes('automatic-diversity')||!service.capabilities?.includes('long-term-repetition')||!service.capabilities?.includes('episode-formats'))throw new Error('Otomatik üretim güncellendi. Video hizmetini yeniden başlat.');if(options.youtube&&!service.capabilities?.includes('youtube-upload'))throw new Error('YouTube yüklemesi için video hizmetini yeniden başlat.');await api('queue',options);}finally{submitting=false;}await openVideos();},youtubeAccounts:()=>api('youtube/accounts'),openExport,openWorks,openVideos,works:()=>store.list(),restoreWorks:value=>store.replace(value)};
}
