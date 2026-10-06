import {normalizeSnapshot} from './studio-transfer.js';
const $=s=>document.querySelector(s),form=$('#batch');let state=null,signature='',source=null,offset=0,compatible=false;const limit=12;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function options(){const data=new FormData(form);return {channel:data.get('channel'),count:Number(form.elements.count.value),duration:Number(data.get('duration')),language:data.get('language'),modes:data.getAll('mode'),source,arenaGame:data.get('arenaGame'),strategy:data.get('strategy'),orientation:data.get('orientation'),resolution:Number(data.get('resolution')),fps:Number(data.get('fps')),audio:data.get('audio'),template:data.get('template'),hook:data.get('hook'),outro:data.get('outro'),youtube:data.get('youtubeChannel')?{channelId:data.get('youtubeChannel'),privacyStatus:data.get('youtubePrivacy')}:null};}
async function post(route,body){if(!compatible)throw new Error('Atölye hizmetini yeniden başlat. Açık hizmet eski sürümü kullanıyor veya bağlantı kurulamadı.');const res=await fetch('/api/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await res.json();if(!res.ok)throw new Error(value.error);signature='';await refresh();}
async function action(fn){try{$('#notice').textContent='';await fn();}catch(e){$('#notice').textContent=e.message;}}
form.onsubmit=e=>{e.preventDefault();void action(async()=>{const button=form.querySelector('[type=submit]');button.disabled=true;try{await post('queue',options());$('#notice').textContent='Üretim kuyruğuna eklendi.';}finally{button.disabled=false;}});};
$('#schedule').onclick=()=>action(()=>post('schedules',{...options(),action:'add'}));
$('#schedule-status').onclick=e=>{const button=e.target.closest('button');if(!button)return;if(button.dataset.schedule)void action(()=>post('schedules',{action:'remove',id:button.dataset.schedule}));if(button.dataset.legacy)void action(()=>post('schedule',{enabled:false}));};
$('#jobs').onclick=e=>{const button=e.target.closest('button[data-action]');if(button)void action(()=>post(button.dataset.action,{id:button.dataset.id}));};
async function loadYouTube(){
  try{const response=await fetch('/api/youtube/accounts');const info=await response.json();const select=form.elements.youtubeChannel,selected=select.value;
    select.replaceChildren(new Option('Yükleme kapalı',''),...info.accounts.map(a=>new Option(a.title,a.id)));select.value=selected;
    $('#youtube-status').textContent=info.configured?(info.accounts.length?`${info.accounts.length} kanal bağlı. Günlük reçetede kanalı seçebilirsin.`:'Henüz kanal bağlı değil.'):'Google OAuth istemci bilgileri tanımlı değil; kurulum için FACTORY.md dosyasına bak.';
  }catch(error){$('#youtube-status').textContent='YouTube bağlantısı okunamadı: '+error.message;}
}
void loadYouTube();
if(new URLSearchParams(location.search).get('youtube')==='connected'){$('#youtube-status').textContent='Kanal bağlandı.';history.replaceState(null,'',location.pathname+location.hash);}
async function refresh(){
  try{
    const response=await fetch('/api/factory?offset='+offset+'&limit='+limit+'&state='+$('#job-filter').value);if(!response.ok)throw new Error('Üretim hizmetine ulaşılamıyor.');
    state=await response.json();compatible=Boolean(state.summary&&Number.isInteger(state.total));if(!compatible)throw new Error('Açık Atölye eski sürümü kullanıyor. Hizmeti yeniden başlat.');if(state.storageError)$('#notice').textContent='Kayıt hatası: '+state.storageError;
    const current=JSON.stringify(state);if(signature===current)return;signature=current;
    const done=state.summary.done,pending=state.summary.pending;$('#previous-page').disabled=offset===0;$('#next-page').disabled=offset+limit>=state.total;
    $('#summary').textContent=`${done} hazır · ${pending} sırada`;
    $('#output').textContent='Çıktı klasörü: '+state.output;
    $('#schedule-status').innerHTML=(state.schedules??[]).map(s=>`<p>${escape(s.channel)} · günde ${s.count} video · ${s.youtubeChannelId?'YouTube bağlı':'yerel çıktı'} · son gün ${escape(s.lastDay??'bekleniyor')} <button type="button" data-schedule="${escape(s.id)}">Kaldır</button></p>`).join('')+(state.schedule?.enabled?`<p>Eski günlük reçete: ${escape(state.schedule.options.channel)} · ${state.schedule.options.count} video <button type="button" data-legacy="1">Kapat</button></p>`:'');
    $('#jobs').innerHTML=state.jobs.length?state.jobs.map(job=>{
      const base='/output/'+encodeURIComponent(job.id)+'/',title=job.copy?.title??({track:'Değişken parkur',spiral:'Spiral serisi',arena:'Küre arenası',territory:'Alan Savaşı',statistics:'İstatistik'})[job.contentKind??job.mode];
      return `<article class="job">${job.state==='done'?`<img src="${base}cover.jpg" alt="Video kapağı" loading="lazy">`:''}<div class="job-top"><h3>${escape(title)}</h3><span class="badge">${escape(job.stage)}</span></div><p>${escape(job.options.channel)} · ${job.duration??job.options.duration} sn · ${escape(job.options.language.toUpperCase())}</p>${job.state==='running'?`<progress max="100" value="${job.progress}"></progress><p>%${job.progress} tamamlandı</p>`:''}${job.error?`<p>${escape(job.error)}</p>`:''}${job.state==='done'?`<div class="links"><a href="${base}video.mp4" download>MP4 indir</a><a href="${base}cover.jpg" download>Kapak</a><a href="${base}upload.txt" download>Başlık ve açıklama</a><a href="${base}metadata.json" download>Reçete</a></div>${job.youtube?`<p>YouTube: ${escape(({queued:'Sırada',uploading:'Yükleniyor',done:'Yüklendi',failed:'Yükleme hatası'})[job.youtube.state]??job.youtube.state)}</p>${job.youtube.url?`<a href="${escape(job.youtube.url)}" target="_blank" rel="noopener noreferrer">YouTube videosunu aç</a>`:''}${job.youtube.error?`<p>${escape(job.youtube.error)}</p><button data-action="youtube/retry" data-id="${job.id}">Yüklemeyi yeniden dene</button>`:''}`:''}`:`<button data-action="${['running','queued'].includes(job.state)?'cancel':'retry'}" data-id="${job.id}">${['running','queued'].includes(job.state)?'İptal et':'Yeniden dene'}</button>`}</article>`;
    }).join(''):'<div class="empty">İlk serini oluştur.<br>Parkurları sistem hazırlasın, sen hazır videoları al.</div>';
  }catch(e){compatible=false;$('#notice').textContent='Üretim hizmetine ulaşılamıyor. Start-Factory.cmd ile başlat. '+e.message;}
}
void refresh();setInterval(refresh,2000);

$('#previous-page').onclick=()=>{offset=Math.max(0,offset-limit);signature='';void refresh();};
$('#next-page').onclick=()=>{offset+=limit;signature='';void refresh();};
$('#job-filter').onchange=()=>{offset=0;signature='';void refresh();};
function acceptSource(value){
  source=normalizeSnapshot(value);$('#studio-source').hidden=false;
  $('#studio-source-name').textContent='Studio çalışması: '+(source.mode==='statistics'?source.statistics.heading:source.project.name);
  form.querySelector('fieldset').hidden=true;form.elements.strategy.value='exact';form.elements.count.value='1';form.elements.count.disabled=true;form.elements.duration.closest('label').hidden=true;
  form.elements.orientation.value=source.mode==='statistics'?'landscape':'portrait';
  form.elements.audio.value=source.mode==='statistics'?'none':source.project.sound?'all':'music';
  form.elements.language.value='tr';
  form.elements.strategy.querySelector('[value=variations]').disabled=source.mode==='statistics';
  $('#notice').textContent='Çalışman hazır. Aynı çalışma seçildiğinde özgün süre ve düzen korunur.';
}
form.elements.strategy.onchange=()=>{const exact=form.elements.strategy.value==='exact';form.elements.count.disabled=exact;form.elements.duration.closest('label').hidden=exact;if(exact)form.elements.count.value='1';};
$('#clear-source').onclick=()=>{source=null;$('#studio-source').hidden=true;form.querySelector('fieldset').hidden=false;form.elements.count.disabled=false;form.elements.duration.closest('label').hidden=false;};
const studioOrigin='http://127.0.0.1:5173';
window.addEventListener('message',event=>{
  if(event.origin!==studioOrigin||event.source!==window.opener)return;
  if(event.data?.type==='marble-studio-hello')event.source.postMessage({type:'marble-factory-ready'},studioOrigin);
  if(event.data?.type==='marble-studio-transfer'){
    try{acceptSource(event.data.snapshot);event.source.postMessage({type:'marble-factory-received'},studioOrigin);}catch(error){$('#notice').textContent=error.message;}
  }
});
if(location.hash==='#studio'&&window.opener)window.opener.postMessage({type:'marble-factory-ready'},studioOrigin);
