import {brandVideoOptions} from './channel-branding.js';
import {factoryOrigin} from './service-origin.js';
import './workbench.css';
import {normalizeSnapshot} from './studio-transfer.js';
import {createWorkStore} from './saved-works.js';
import {isBreaker} from './breaker-video.js';
import {DEFAULT_VIDEO_FPS,VIDEO_FPS_DEFAULT_VERSION,preferredVideoFps} from './video-settings.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const standalone=mode=>isBreaker(mode)||['escape-multiply','merge-evolution','ball-duel','rock-paper-scissors','ball-multiplier','goal-arena','bounce-waves'].includes(mode);
const modeName={'escape-multiply':'Ka\u00e7\u0131\u015f \u00c7o\u011falmas\u0131','merge-evolution':'Evrim Arenası','collapse-arena':'Çöken Arena','bounce-waves':'Bounce Waves','goal-arena':'Goal Arena','ball-multiplier':'Ball Multiplier','rock-paper-scissors':'Taş Kâğıt Makas','ball-duel':'Top Düellosu',pi:'Pi Çarpışmaları',track:'Parkur yarışı',arena:'Küre arenası',territory:'Alan Savaşı',spiral:'Spiral çoğalma',statistics:'İstatistik yarışı','glass-breaker':'Cam Kırıcı','spiral-breaker':'Spiral Kırıcı'};
const kindOf=record=>record.contentKind??(record.mode==='arena'&&(record.project?.arenaGame??record.recipe?.arenaGame??record.options?.arenaGame)==='territory'?'territory':record.mode);
export function createWorkbench({capture,openSnapshot,thumbnail,title,notify,isLocked,getChannel}){
  const store=createWorkStore();let source=null,ready=false,submitting=false,offset=0,poll=null,refreshing=false,works=[],exportRevision=0;
  const root=document.createElement('div');root.innerHTML=`
  <dialog id="video-dialog" class="workbench-dialog" aria-labelledby="video-title">
    <div class="wb-heading"><div><p class="eyebrow">PAYLAŞMAYA HAZIRLA</p><h2 id="video-title">Video oluştur</h2></div><button class="wb-close" data-wb-close aria-label="Kapat">×</button></div>
    <div class="wb-source"><img id="video-thumbnail" alt="Çalışmanın önizlemesi"><div><strong id="video-source-name">Çalışma hazırlanıyor…</strong><p id="video-source-description"></p></div></div>
    <form id="video-form">
      <input name="strategy" type="hidden" value="exact"><input name="count" type="hidden" value="1">
      <div id="video-series" hidden><label>Hedef süre<select name="duration"><option value="30">30 saniye</option><option value="55" selected>55 saniye</option><option value="90">90 saniye</option><option value="120">120 saniye</option><option value="150">150 saniye</option><option value="180">180 saniye</option></select></label></div>
      <fieldset class="wb-formats"><legend>Video biçimi</legend><label><input type="radio" name="orientation" value="portrait" checked><span>▯</span><b>Dikey</b><small>9:16</small></label><label><input type="radio" name="orientation" value="landscape"><span>▭</span><b>Yatay</b><small>16:9</small></label><label><input type="radio" name="orientation" value="square"><span>□</span><b>Kare</b><small>1:1</small></label></fieldset>
      <details id="video-advanced"><summary>Gelişmiş seçenekler</summary><div class="wb-pair"><label>Çözünürlük<select name="resolution"><option value="1080">1080p · Yüksek kalite</option><option value="720">720p · Daha küçük dosya</option></select></label><label>Akıcılık<input name="fps" type="number" min="1" step="1" value="${DEFAULT_VIDEO_FPS}" required></label></div>
      <label>Ses<select name="audio"><option value="all">Müzik ve efektler</option><option value="music">Yalnız müzik</option><option value="effects">Yalnız efektler</option><option value="none">Sessiz</option></select></label>
      <div class="wb-pair"><label>Sunum<select name="template"><option value="minimal">Sade</option><option value="broadcast">Yarış yayını</option><option value="cinema">Sinema</option></select></label><label>Dil<select name="language"><option value="en">İngilizce</option></select></label></div>
      <p>Kanal adı video oluşturulmadan önce seçilir.</p><label>Giriş metni (İngilizce)<input name="hook" maxlength="100" placeholder="Otomatik hazırla"></label><label>Kapanış metni (İngilizce)<input name="outro" maxlength="100" placeholder="İsteğe bağlı"></label></details>
      <p id="video-format-note" class="wb-muted"></p><p id="video-message" role="status"></p><button id="video-submit" class="button primary" type="submit" disabled>Videoyu hazırla</button>
    </form>
  </dialog>
  <dialog id="works-dialog" class="workbench-dialog wide" aria-labelledby="works-title"><div class="wb-heading"><div><p class="eyebrow">KALDIĞIN YERDEN DEVAM ET</p><h2 id="works-title">Çalışmalarım</h2></div><button class="wb-close" data-wb-close aria-label="Kapat">×</button></div>
    <form id="work-save-form" class="wb-save"><label>Bu çalışmaya bir isim ver<input id="work-name" maxlength="80" required placeholder="Örneğin: Ülkeler yarışı"></label><button class="button primary" id="work-save">Yeni çalışma kaydet</button></form><p id="works-message" role="status"></p><div id="works-list" class="wb-cards"></div>
  </dialog>
  <dialog id="videos-dialog" class="workbench-dialog wide" aria-labelledby="videos-title"><div class="wb-heading"><div><p class="eyebrow">ÜRETTİĞİN VİDEOLAR</p><h2 id="videos-title">Videolarım</h2></div><button class="wb-close" data-wb-close aria-label="Kapat">×</button></div>
    <p>Yeni videolar indirilene kadar geçici tutulur. İndirme tamamlanınca geçici dosya silinir. İstediğin YouTube yüklemesi varsa temizlik yüklemeden sonra yapılır.</p><div class="wb-archive-controls"><label>Göster<select id="videos-filter"><option value="all">Tüm videolar</option><option value="done">Hazır</option><option value="downloaded">İndirilen</option><option value="queued">Sırada</option><option value="running">Hazırlanıyor</option><option value="failed">Hatalı</option><option value="cancelled">İptal edilen</option></select></label><span id="videos-summary"></span><button id="videos-refresh" class="button secondary">Yenile</button></div><p id="videos-message" role="status"></p><div id="videos-list" class="wb-cards"></div><div class="wb-pages"><button id="videos-previous" class="button secondary">Önceki</button><button id="videos-next" class="button secondary">Sonraki</button></div>
  </dialog>`;
  document.body.append(root);const $=id=>document.getElementById(id),form=$('video-form');
  const origin=factoryOrigin;
  const failure='Video hizmetine bağlanılamadı. Masaüstündeki Marble Studio kısayolunu yeniden açıp Tekrar dene düğmesine bas.';
  async function api(route,body){
    let res;try{res=await fetch(origin()+'/api/'+route,{...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});}catch{throw new Error(failure);}
    const data=await res.json();if(!res.ok)throw new Error(data.error??'İşlem tamamlanamadı.');return data;
  }
  async function checkService(){const data=await api('factory?limit=1');if((source?.mode==='escape-multiply'&&!data.capabilities?.includes('escape-production'))||data.apiVersion<5||!data.capabilities?.includes('temporary-downloads')||!data.capabilities?.includes('studio-workbench')||(isBreaker(source?.mode)&&!data.capabilities?.includes('breaker-production'))||(source?.mode==='merge-evolution'&&!data.capabilities?.includes('merge-production'))||(source?.mode==='bounce-waves'&&!data.capabilities?.includes('waves-production'))||(source?.mode==='goal-arena'&&!data.capabilities?.includes('goal-production'))||(source?.mode==='ball-multiplier'&&!data.capabilities?.includes('multiplier-production'))||(source?.mode==='rock-paper-scissors'&&!data.capabilities?.includes('rps-production'))||(source?.mode==='ball-duel'&&!data.capabilities?.includes('duel-production')))throw new Error('Video hizmetini güncellemek için mevcut render bitince Marble Studio kısayolunu yeniden aç.');return data;}
  function show(dialog){for(const d of root.querySelectorAll('dialog[open]'))d.close();dialog.showModal();}
  for(const dialog of root.querySelectorAll('dialog')){
    dialog.querySelector('[data-wb-close]').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>{dialog.querySelectorAll('video').forEach(v=>v.pause());if(dialog.id==='videos-dialog'){clearInterval(poll);poll=null;}});
  }
  function updateForm(){
    const clip=source?.mode==='spiral-breaker';$('video-series').hidden=!clip;
    $('video-format-note').textContent=`${({portrait:'Dikey',landscape:'Yatay',square:'Kare'})[form.elements.orientation.value]} · ${form.elements.resolution.value}p · ${form.elements.fps.value} FPS · MP4. `+(clip?'Seçili harita baştan oynatılır; hedef süreye kapanış dahildir. Bölüm erken biterse video da biter.':'Aynı düzen ve özgün süre korunur.');
    if(source)$('video-source-description').textContent=modeName[kindOf(source)]+(standalone(source.mode)?' · Seçili görünüm ve hızla baştan otomatik oynatılır':source.mode==='pi'?' · Kütle oranı ve çarpışma ayarlarıyla':source.mode==='statistics'?' · Tablo ve kaynak bilgileriyle':' · Kadro ve seçtiğin müzikle');
  }
  form.addEventListener('change',()=>{updateForm();if(source)try{localStorage.setItem('marble-studio-export-'+kindOf(source)+'-v1',JSON.stringify({...Object.fromEntries(new FormData(form)),fpsDefaultVersion:VIDEO_FPS_DEFAULT_VERSION,wavesAudioVersion:1}));}catch{}});
  async function openExport(snapshot,preview){
    if(isLocked())return;const revision=++exportRevision;show($('video-dialog'));source=null;ready=false;$('video-submit').disabled=true;$('video-submit').textContent='Hazırlanıyor…';$('video-message').textContent='Çalışma hazırlanıyor…';$('video-source-name').textContent='Çalışma hazırlanıyor…';$('video-thumbnail').src=preview??thumbnail();
    try{
      const captured=normalizeSnapshot(snapshot??await capture());if(revision!==exportRevision)return;source=captured;form.reset();form.elements.orientation.value=source.mode==='statistics'?'landscape':'portrait';form.elements.audio.value=source.mode==='bounce-waves'?(source.project.sound?'all':'none'):source.mode==='pi'?(source.project.sound?'effects':'none'):source.mode==='statistics'?'none':source.mode==='spiral'&&source.project.spiralHypnotic?'effects':source.project.sound?'all':'music';
      try{const saved=JSON.parse(localStorage.getItem('marble-studio-export-'+kindOf(source)+'-v1')??'{}');if(source.mode==='bounce-waves'&&saved.wavesAudioVersion!==1&&saved.audio==='music'&&source.project.sound)saved.audio='all';saved.fps=String(source.mode==='escape-multiply'?(saved.fps??60):preferredVideoFps(saved));for(const key of ['orientation','resolution','fps','audio','template','language','channel','hook','outro','duration'])if(typeof saved[key]==='string'&&form.elements[key]){const input=form.elements[key];if(input.tagName==='SELECT'&&![...input.options].some(o=>o.value===saved[key]))continue;if(key==='orientation'&&!['portrait','landscape','square'].includes(saved[key]))continue;input.value=saved[key];}}catch{}
      form.elements.language.value='en';form.elements.strategy.value='exact';$('video-advanced').open=false;
      for(const option of form.elements.audio.options)option.disabled=standalone(source.mode)&&!['ball-multiplier','goal-arena','bounce-waves'].includes(source.mode)&&['all','music'].includes(option.value);
      if(standalone(source.mode)&&!['ball-multiplier','goal-arena','bounce-waves'].includes(source.mode)&&!['effects','none'].includes(form.elements.audio.value))form.elements.audio.value=source.project.sound?'effects':'none';
      $('video-source-name').textContent=source.mode==='statistics'?source.statistics.heading:(source.project.name??modeName[source.mode]);updateForm();
      await checkService();if(revision!==exportRevision)return;ready=true;$('video-message').textContent='Hazır olduğunda videonu bu pencereden izleyip indirebilirsin.';
    }catch(error){if(revision!==exportRevision)return;$('video-message').textContent=error.message;}
    $('video-submit').disabled=!source;$('video-submit').textContent=ready?'Videoyu hazırla':'Tekrar dene';
  }
  form.onsubmit=async e=>{
    e.preventDefault();if(submitting||!source)return;submitting=true;$('video-submit').disabled=true;
    try{
      if(!ready){await checkService();ready=true;$('video-submit').textContent='Videoyu hazırla';$('video-message').textContent='Bağlantı hazır. Videoyu hazırlayabilirsin.';return;}
      const fields=Object.fromEntries(new FormData(form));const options=await brandVideoOptions({...fields,channel:getChannel?.(),strategy:'exact',count:1,duration:Number(fields.duration),resolution:Number(fields.resolution),fps:Number(fields.fps),source});if(!options)return;await api('queue',options);
      notify('Video hazırlanmaya başladı.');await openVideos();
    }catch(error){$('video-message').textContent=error.message;}finally{submitting=false;$('video-submit').disabled=false;}
  };
  async function listWorks(){
    works=await store.list();$('works-list').innerHTML=works.length?works.map(work=>`<article class="wb-card"><img class="wb-cover" src="${work.thumbnail}" alt="${escape(work.name)} önizlemesi"><h3>${escape(work.name)}</h3><p>${modeName[kindOf(work.snapshot)]}</p><div class="wb-buttons"><button class="button secondary" data-work="${work.id}" data-action="open">Aç</button><button class="button secondary" data-work="${work.id}" data-action="copy">Kopyala</button><button class="button primary" data-work="${work.id}" data-action="export">Video oluştur</button></div></article>`).join(''):'<p class="wb-empty">İlk çalışmanı kaydet. Kadron, müziğin ve ayarların bir arada dursun.</p>';
  }
  async function openWorks(){if(isLocked())return;show($('works-dialog'));$('work-name').value=title();$('works-message').textContent='';try{await listWorks();}catch(error){$('works-message').textContent=error.message;}}
  $('work-save-form').onsubmit=async e=>{e.preventDefault();const button=$('work-save');if(button.disabled)return;button.disabled=true;try{const snapshot=await capture(),name=$('work-name').value.trim();if(snapshot.project)snapshot.project.name=name;await store.put({id:crypto.randomUUID(),name,snapshot,thumbnail:thumbnail(),updatedAt:new Date().toISOString()});await listWorks();$('works-message').textContent='Çalışman kaydedildi.';}catch(error){$('works-message').textContent=error.message;}finally{button.disabled=false;}};
  $('works-list').onclick=async e=>{const button=e.target.closest('[data-work]');if(!button)return;const work=works.find(w=>w.id===button.dataset.work);if(!work)return;button.disabled=true;try{if(button.dataset.action==='open'){await openSnapshot(work.snapshot.project?{...work.snapshot,project:{...work.snapshot.project,name:work.name}}:work.snapshot);$('works-dialog').close();notify(work.name+' açıldı.');}else if(button.dataset.action==='copy'){await store.put({...work,id:crypto.randomUUID(),name:work.name.slice(0,70)+' · Kopya',updatedAt:new Date().toISOString()});await listWorks();}else await openExport(work.snapshot.project?{...work.snapshot,project:{...work.snapshot.project,name:work.name}}:work.snapshot,work.thumbnail);}catch(error){$('works-message').textContent=error.message;}finally{button.disabled=false;}};
  async function refreshVideos(){
    if(refreshing)return;refreshing=true;try{
      const data=await api('factory?limit=12&offset='+offset+'&state='+$('videos-filter').value);if(data.apiVersion<3)throw new Error('Video hizmetini yeni sürümle yeniden aç.');
      $('videos-message').textContent=data.storageError?'Kayıt sorunu: '+data.storageError:data.sharedWarning??'';
      $('videos-summary').textContent=`${data.summary.done} hazır · ${data.summary.pending} hazırlanıyor`;$('videos-previous').disabled=offset===0;$('videos-next').disabled=offset+12>=data.total;
      const list=$('videos-list'),ids=new Set(data.jobs.map(j=>j.id));for(const card of [...list.children])if(!ids.has(card.dataset.job))card.remove();
      for(const [index,job] of data.jobs.entries()){
        let card=[...list.children].find(c=>c.dataset.job===job.id);if(!card){card=document.createElement('article');card.className='wb-card';card.dataset.job=job.id;}
        if(list.children[index]!==card)list.insertBefore(card,list.children[index]??null);
        const version=JSON.stringify([job.state,job.copy?.title,job.error,job.youtube]),base=origin()+'/output/'+encodeURIComponent(job.id)+'/';
        if(card.dataset.version!==version){card.dataset.version=version;card.innerHTML=`${job.state==='done'?`<video class="wb-video" controls preload="none" poster="${base}cover.jpg" src="${base}${job.videoFile==='video.webm'?'video.webm':'video.mp4'}?preview=1" aria-label="${escape(job.copy?.title??'Video')} önizlemesi"></video>`:''}<h3>${escape(job.copy?.title??modeName[kindOf(job)])}</h3><p class="wb-job-status"></p>${['queued','running'].includes(job.state)?'<progress max="100"></progress>':''}${job.error?`<p>${escape(job.error)}</p>`:''}<div class="wb-buttons">${job.state==='done'?`<a class="button primary" href="${base}${job.videoFile==='video.webm'?'video.webm':'video.mp4'}" download>İndir</a><button class="button secondary" data-job-action="copy">Başlığı kopyala</button>`:job.state==='downloaded'?'':`<button class="button secondary" data-job-action="${['queued','running'].includes(job.state)?'cancel':'retry'}">${['queued','running'].includes(job.state)?'İptal et':'Yeniden dene'}</button>`}</div>`;}
        if(job.youtube&&card.dataset.version===version&&!card.querySelector('.wb-youtube')){const p=document.createElement('p');p.className='wb-youtube';p.textContent='YouTube: '+({queued:'sırada',uploading:'yükleniyor',done:'yüklendi',failed:'yükleme hatası'}[job.youtube.state]??job.youtube.state)+(job.youtube.error?' · '+job.youtube.error:'');card.querySelector('.wb-buttons').before(p);if(job.youtube.url){const link=document.createElement('a');link.className='button secondary';link.href=job.youtube.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='YouTube’da aç';card.querySelector('.wb-buttons').append(link);}}
        card.querySelector('.wb-job-status').textContent=modeName[kindOf(job)]+' · '+(job.state==='running'?`${job.stage} · %${job.progress}`:job.stage);const progress=card.querySelector('progress');if(progress)progress.value=job.progress??0;
      }
      if(!data.jobs.length)list.innerHTML='<p class="wb-empty">Bu görünümde henüz video yok. Video oluştur düğmesiyle başlayabilirsin.</p>';
    }catch(error){$('videos-message').textContent=error.message;}finally{refreshing=false;}
  }
  async function openVideos(){show($('videos-dialog'));await refreshVideos();if($('videos-dialog').open&&!poll)poll=setInterval(()=>{if($('videos-dialog').open)void refreshVideos();},2000);}
  $('videos-filter').onchange=()=>{offset=0;void refreshVideos();};$('videos-refresh').onclick=()=>void refreshVideos();
  $('videos-previous').onclick=()=>{offset=Math.max(0,offset-12);void refreshVideos();};$('videos-next').onclick=()=>{offset+=12;void refreshVideos();};
  $('videos-list').onclick=async e=>{const button=e.target.closest('[data-job-action]');if(!button)return;button.disabled=true;try{const card=button.closest('[data-job]'),id=card.dataset.job;if(button.dataset.jobAction==='copy'){await navigator.clipboard.writeText(card.querySelector('h3').textContent);notify('Başlık kopyalandı.');}else{await api(button.dataset.jobAction,{id});await refreshVideos();}}catch(error){$('videos-message').textContent=error.message;}finally{button.disabled=false;}};
  return {youtubeAccounts:()=>api('youtube/accounts'),openExport,openWorks,openVideos,works:()=>store.list(),restoreWorks:value=>store.replace(value)};
}
