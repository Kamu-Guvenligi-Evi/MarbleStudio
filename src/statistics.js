import './statistics.css';
import {DEMO_CSV,STATISTICS_KEY,parseStatistics,statisticsAt} from './statistics-data.js';
import {createStatisticsLibrary} from './statistics-library.js';
import {statisticsScale,animateStatisticsScale} from './statistics-scale.js';

const COLORS=['#bbef83','#79cfea','#c3a1ff','#ffbd83','#f38fad','#78dcc4','#eddb80','#94b4ff','#c3d9ba','#d5b08b'];
const number=new Intl.NumberFormat('tr-TR',{maximumFractionDigits:1});
const compact=new Intl.NumberFormat('tr-TR',{notation:'compact',maximumFractionDigits:1});

export function createStatistics({notify,onRecordingChange,onVideoRecorded}) {
  const root=document.getElementById('statistics-view');
  root.innerHTML=`
    <div class="page-heading"><div><p class="eyebrow">MARBLE STUDIO / VERİ ATÖLYESİ</p><h1 id="statistics-title" tabindex="-1">İstatistik yarışı</h1><p>Verini seç. Zamanı oynat. Değişimi izle.</p></div><a class="button secondary statistics-library-link" href="#statistics-library">Veri kütüphanesi ↗</a></div>
    <div class="statistics-layout">
      <section class="statistics-stage" aria-label="İstatistik yarışı önizlemesi">
        <div class="statistics-stage-top"><div class="statistics-preview-label"><span class="statistics-live-dot" aria-hidden="true"></span><strong>Önizleme</strong><span id="statistics-status" role="status">Hazır</span></div><button id="statistics-fullscreen" class="button subtle">⛶ Tam ekran</button></div>
        <canvas id="statistics-canvas" width="1920" height="1080" aria-label="Yıllara göre değişen yatay sıralama"></canvas>
        <div class="statistics-timeline"><label for="statistics-seek">Yıl <output id="statistics-year">2000</output></label><input id="statistics-seek" type="range" min="0" max="1" step="0.001" value="0"><div><span id="statistics-first"></span><span id="statistics-last"></span></div></div>
        <div class="statistics-transport"><button id="statistics-play" class="button primary">▶ Başlat</button><button id="statistics-reset" class="button secondary">↺ Başa al</button><span id="statistics-progress">00:00 / 00:30</span></div>
        <p id="statistics-summary" class="statistics-summary"></p>
      </section>
      <aside class="statistics-options">
        <section class="statistics-card"><p class="eyebrow">SUNUM</p><label for="statistics-heading">Video başlığı</label><input id="statistics-heading" maxlength="60" value="Zamanla değişen sıralama"><div class="statistics-fields"><div><label for="statistics-unit">Değer birimi</label><input id="statistics-unit" maxlength="24" value="puan"></div><div><label for="statistics-top">Gösterilecek sıra</label><select id="statistics-top"><option value="5">İlk 5</option><option value="10" selected>İlk 10</option><option value="15">İlk 15</option></select></div></div><label for="statistics-source">Veri kaynağı / açıklama</label><input id="statistics-source" maxlength="120" value="Örnek veri · Gerçek istatistik değildir."><label for="statistics-duration">Yarış süresi</label><select id="statistics-duration"><option value="15">15 saniye</option><option value="30" selected>30 saniye</option><option value="60">1 dakika</option><option value="120">2 dakika</option></select><p id="statistics-save" class="statistics-note" role="status">Bu tarayıcıda otomatik saklanır.</p></section>
        <section class="statistics-card statistics-export"><details id="statistics-webm-options"><summary>Tarayıcı kaydı · WebM</summary><button id="statistics-record" class="button primary">● Videoya kaydet</button><span class="statistics-note">Yatay · 1920 × 1080 · WebM · Sessiz</span><a id="statistics-download" class="button secondary" download hidden>Son videoyu indir ↓</a><p class="statistics-note">Kayıt boyunca bu sekmeyi görünür tut.</p></details></section>
      </aside>
    </div>
    <section id="statistics-library" class="statistics-card statistics-library" aria-label="Hazır veri kütüphanesi"></section>
    <section class="statistics-card statistics-data"><div class="statistics-data-heading"><div><p class="eyebrow">VERİ TABLOSU</p><h2>Senin verin, senin yarışın.</h2></div><div class="statistics-data-actions"><button id="statistics-import" class="button secondary">CSV yükle</button><button id="statistics-export" class="button secondary">CSV indir</button><button id="statistics-demo" class="button subtle">Örnek veriyi getir</button></div></div><p>İlk sütun yıl, diğer sütunlar yarışmacı adları. Her yıl için bütün değerleri doldur. Ara yıllar iki veri noktası arasında doğrusal olarak hesaplanır.</p><label for="statistics-csv">Yıllar ve değerler</label><textarea id="statistics-csv" spellcheck="false" aria-describedby="statistics-csv-help"></textarea><p id="statistics-csv-help" class="statistics-note">2–30 yarışmacı, 2–301 yıl. Pozitif sayılar veya 0; binlik ayıracı kullanma. Virgül veya noktalı virgülle ayrılmış CSV kabul edilir.</p><div class="statistics-data-footer"><button id="statistics-apply" class="button primary">Veriyi uygula</button><p id="statistics-data-status" role="status"></p></div><input id="statistics-file" type="file" accept=".csv,text/csv,text/plain" hidden></section>`;
  const $=id=>document.getElementById(`statistics-${id}`);
  const canvas=$('canvas'),ctx=canvas.getContext('2d');
  let csv=DEMO_CSV,data=parseStatistics(csv),progress=0,playing=false,active=false,last=0,uiElapsed=0;
  let recorder=null,recordStream=null,recordBusy=false,downloadURL=null,ending=0,dataset=null,library;
  const interpolationLabel=document.createElement('label');interpolationLabel.htmlFor='statistics-interpolation';interpolationLabel.textContent='Yıllar arası geçiş';
  const interpolationSelect=document.createElement('select');interpolationSelect.id='statistics-interpolation';
  interpolationSelect.add(new Option('Akıcı · Ara değerleri hesapla','linear'));interpolationSelect.add(new Option('Yıllık · Değerleri tam koru','step'));
  $('save').before(interpolationLabel,interpolationSelect);
  $('csv-help').textContent='2–30 yarışmacı, 1–301 yıl. Tek satır sabit karşılaştırmadır. Pozitif sayılar veya 0; binlik ayıracı kullanma. Virgül veya noktalı virgülle ayrılmış CSV kabul edilir.';
  root.querySelector('.statistics-data > p').textContent='İlk sütun yıl, diğer sütunlar yarışmacı adları. Her yıl için bütün değerleri doldur. Akıcı geçiş ara değerleri hesaplar; yıllık geçiş verilen değerleri korur. Tek yıl satırı sabit karşılaştırma oluşturur.';
  const positions=new Map();
  let axisMax=0;
  const settings=['heading','unit','source','duration','top','interpolation'];
  try {
    const saved=JSON.parse(localStorage.getItem(STATISTICS_KEY));
    if(saved){
      const parsed=parseStatistics(saved.csv);csv=saved.csv;data=parsed;
      if(saved.dataset&&typeof saved.dataset.id==='string'&&Array.isArray(saved.dataset.sources))dataset=saved.dataset;
      for(const key of settings)if(typeof saved[key]==='string'){
        const input=$(key);
        if(input.tagName==='SELECT'){if([...input.options].some(option=>option.value===saved[key]))input.value=saved[key];}
        else input.value=saved[key].slice(0,input.maxLength);
      }
    }
  }catch{notify('İstatistik taslağı okunamadı; örnek veri açıldı.');}
  $('csv').value=csv;
  const duration=()=>Number($('duration').value);
  const year=()=>data.frames[0].year+(data.frames.at(-1).year-data.frames[0].year)*progress;
  const ranking=()=>statisticsAt(data,year(),$('interpolation').value);
  const snapshot=()=>data.frames.length===1;
  const top=()=>Math.min(Number($('top').value),data.names.length);
  function persist(){
    try{localStorage.setItem(STATISTICS_KEY,JSON.stringify({csv,dataset,...Object.fromEntries(settings.map(key=>[key,$(key).value]))}));$('save').textContent='✓ İstatistik taslağı kaydedildi.';}
    catch{$('save').textContent='Taslak kaydedilemedi. Verini CSV indir ile sakla.';}
  }
  function syncPositions(){positions.clear();ranking().forEach((entry,index)=>positions.set(entry.id,index));}
  function ui(){
    $('play').textContent=playing?'Ⅱ Duraklat':progress>=1?'↻ Yeniden oynat':'▶ Başlat';
    $('status').textContent=recordBusy?'● Kayıt alınıyor':playing?(snapshot()?'Karşılaştırma gösteriliyor':'Yıllar ilerliyor'):progress>=1?'Son sıralama':progress>0?'Duraklatıldı':'Başlamaya hazır';
    $('year').textContent=snapshot()?'Sabit karşılaştırma':String(Math.floor(year()));$('seek').value=String(progress);
    $('seek').disabled=recordBusy||snapshot();
    $('seek').setAttribute('aria-valuetext',snapshot()?'Sabit karşılaştırma':`${Math.floor(year())} yılı`);
    $('first').textContent=snapshot()?'Zaman serisi değildir':data.frames[0].year;$('last').textContent=snapshot()?'':data.frames.at(-1).year;
    const time=seconds=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
    $('progress').textContent=`${time(progress*duration())} / ${time(duration())}`;
    const leaders=ranking().slice(0,3).map((entry,index)=>`${index+1}. ${entry.name}: ${number.format(entry.value)}`).join(' · ');
    $('summary').textContent=leaders;canvas.setAttribute('aria-label',`${snapshot()?'Sabit karşılaştırma':Math.floor(year())+' yılı'}, ${leaders}`);
  }
  function text(value,x,y,size,color,weight=400,align='left',width){
    ctx.fillStyle=color;ctx.font=`${weight} ${size}px "Segoe UI", sans-serif`;ctx.textAlign=align;ctx.fillText(value,x,y,width);
  }
  function draw(dt=0){
    const rows=ranking(),count=top(),gap=690/count,barHeight=Math.min(52,gap*.72);
    const left=370,width=1280,startY=245,peak=rows[0].value;
    const scale=statisticsScale(peak||1);
    axisMax=animateStatisticsScale(axisMax,scale.max,peak,dt);
    const max=axisMax;
    ctx.fillStyle='#111820';ctx.fillRect(0,0,1920,1080);
    ctx.fillStyle='#bbef83';ctx.fillRect(70,70,5,75);
    text('MARBLE STUDIO / İSTATİSTİK YARIŞI',96,83,18,'#a6bdaf',600);
    text($('heading').value.trim()||'Yıllara göre sıralama',94,137,44,'#f2f6f0',650,'left',1450);
    const demo=csv.trim()===DEMO_CSV.trim();
    text(demo?'ÖRNEK VERİ':snapshot()?'SABİT KARŞILAŞTIRMA':`${data.frames[0].year} — ${data.frames.at(-1).year}`,1835,84,19,demo?'#bbef83':'#9faeb7',600,'right');
    text($('unit').value||'Değer',left,192,19,'#8ca2af');
    const tickStep=statisticsScale(max/1.15).step;
    for(let i=0;i*tickStep<=max*(1+1e-10);i++){
      const value=i*tickStep,x=left+width*value/max;
      ctx.strokeStyle='#ffffff0d';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,220);ctx.lineTo(x,947);ctx.stroke();
      const label=tickStep<1?new Intl.NumberFormat('tr-TR',{maximumSignificantDigits:3}).format(value):compact.format(value);
      text(label,x,218,18,'#748c9b',400,'center');
    }
    ctx.save();ctx.beginPath();ctx.rect(50,229,1830,715);ctx.clip();
    for(let rank=rows.length-1;rank>=0;rank--){
      const entry=rows[rank],old=positions.get(entry.id)??rank;
      const slot=dt?old+(rank-old)*(1-Math.exp(-dt*10)):old;positions.set(entry.id,slot);
      if(slot>count+.5)continue;
      const y=startY+slot*gap,barWidth=entry.value/max*width,color=COLORS[entry.id%COLORS.length];
      const fade=Math.max(0,Math.min(1,count-slot));ctx.globalAlpha=fade;
      text(String(rank+1).padStart(2,'0'),82,y+barHeight*.66,19,'#6d8797',500);
      text(entry.name,left-26,y+barHeight*.68,25,'#e1e8ee',550,'right',245);
      if(barWidth>0){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(left,y,barWidth,barHeight,Math.min(5,barWidth/2));ctx.fill();}
      text(number.format(entry.value),left+barWidth+17,y+barHeight*.68,24,color,650,'left',170);
    }
    ctx.restore();ctx.globalAlpha=1;
    text(snapshot()?(dataset?.periodLabel??'Karşılaştırma'):String(Math.floor(year())),1835,1014,snapshot()?42:88,'#e5efe7',700,'right',snapshot()?500:undefined);
    text(demo?'Örnek veri · Gerçek istatistik değildir.':($('source').value.trim()||'Kaynak belirtilmedi'),75,991,20,'#8ca2af',400,'left',1280);
    text(`İLK ${count}  /  ${data.names.length} YARIŞMACI`,75,1026,17,'#647c8a',500);
    ctx.fillStyle='#213039';ctx.fillRect(0,1068,1920,12);ctx.fillStyle='#bbef83';ctx.fillRect(0,1068,1920*progress,12);
  }
  function reset(){progress=0;playing=false;ending=0;syncPositions();draw();ui();}
  function toggle(){if(recordBusy)return;if(progress>=1)reset();playing=!playing;if(!playing){syncPositions();draw();}last=performance.now();ui();}
  function lock(value){
    recordBusy=value;
    library?.lock(value);
    for(const id of [...settings,'seek','play','reset','apply','import','export','demo','csv'])$(id).disabled=value;
    $('record').textContent=value?'■ Kaydı bitir ve indir':'● Videoya kaydet';
    onRecordingChange(value);
  }
  function stopRecording(){if(recorder?.state==='recording'){playing=false;syncPositions();draw();recorder.stop();$('record').disabled=true;ui();}}
  function record(){
    if(recordBusy){stopRecording();return;}
    if(library?.busy()){notify('Veri seti açılıyor; ardından kaydı başlatabilirsin.');return;}
    if(!window.MediaRecorder||!canvas.captureStream){notify('Video kaydı için Chrome veya Edge ile aç.');return;}
    const mime=['video/webm;codecs=vp8','video/webm;codecs=vp9','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));
    if(!mime){notify('Bu tarayıcı WebM kaydını desteklemiyor.');return;}
    let stream;
    try {
      reset();lock(true);stream=canvas.captureStream(60);recordStream=stream;
      const session=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8_000_000}),chunks=[];
      let failed=false;recorder=session;
      session.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      session.onerror=()=>{failed=true;stopRecording();};
      session.onstop=()=>{
        stream.getTracks().forEach(track=>track.stop());recorder=null;recordStream=null;lock(false);$('record').disabled=false;ui();
        if(failed||!chunks.length){notify('Video oluşturulamadı. Tekrar deneyebilirsin.');return;}
        if(downloadURL)URL.revokeObjectURL(downloadURL);
        const videoBlob=new Blob(chunks,{type:'video/webm'});downloadURL=URL.createObjectURL(videoBlob);
        const link=$('download');link.href=downloadURL;link.download=`istatistik-${data.frames[0].year}-${data.frames.at(-1).year}.webm`;link.hidden=false;link.click();notify('İstatistik videosu hazır.');
        onVideoRecorded?.(videoBlob,{name:$('heading').value,mode:'statistics'});
      };
      session.start(250);playing=true;last=performance.now();ui();canvas.scrollIntoView({block:'center',behavior:'instant'});
    }catch{stream?.getTracks().forEach(track=>track.stop());recorder=null;recordStream=null;playing=false;lock(false);$('record').disabled=false;ui();notify('Video kaydı başlatılamadı. Tekrar deneyebilirsin.');}
  }
  function applyCSV(value,item=null){
    const parsed=parseStatistics(value); // Validate everything before replacing the current project.
    if(item&&(parsed.names.length!==item.entities||parsed.frames.length!==item.rows))throw new Error('Veri dosyası kütüphane kaydıyla eşleşmiyor.');
    if(!item&&dataset&&$('source').value===dataset.source)$('source').value='';
    dataset=item;
    data=parsed;csv=value;$('csv').value=value;
    if(item){$('heading').value=item.title;$('unit').value=item.unit;$('source').value=item.source;$('interpolation').value=item.interpolation==='step'?'step':'linear';}
    if(csv.trim()!==DEMO_CSV.trim()&&$('source').value==='Örnek veri · Gerçek istatistik değildir.')$('source').value='';
    reset();persist();library?.refresh();$('data-status').textContent=`✓ ${data.names.length} yarışmacı · ${snapshot()?'sabit karşılaştırma':data.frames.length+' yıl'} yüklendi.`;
  }
  $('play').onclick=toggle;$('reset').onclick=reset;$('record').onclick=record;
  $('seek').oninput=()=>{playing=false;progress=Number($('seek').value);syncPositions();draw();ui();};
  for(const key of settings)$(key).oninput=()=>{persist();syncPositions();draw();ui();};
  $('apply').onclick=()=>{try{applyCSV($('csv').value);}catch(error){$('data-status').textContent=error.message;}};
  $('demo').onclick=()=>{$('csv').value=DEMO_CSV;$('data-status').textContent='Örnek tablo hazır. Yarışa aktarmak için Veriyi uygula düğmesine bas.';};
  $('import').onclick=()=>$('file').click();
  $('file').onchange=async()=>{
    const file=$('file').files[0];if(!file)return;
    try{if(file.size>300000)throw new Error('CSV en fazla 300 KB olabilir.');const value=await file.text();if(recordBusy)return;applyCSV(value);}
    catch(error){$('data-status').textContent=error.message;}finally{$('file').value='';}
  };
  $('export').onclick=()=>{
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='istatistik-verileri.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await root.querySelector('.statistics-stage').requestFullscreen();}catch{notify('Tam ekran açılamadı.');}};
  root.addEventListener('keydown',event=>{if(event.code==='Space'&&!['INPUT','TEXTAREA','SELECT','BUTTON','A'].includes(event.target.tagName)){event.preventDefault();toggle();}});
  function frame(now){
    const dt=Math.min((now-last)/1000||0,.1);last=now;
    if(active){
      if(playing){
        if(progress<1)progress=Math.min(1,progress+dt/duration());
        else {ending+=dt;if(recordBusy){if(ending>=2)stopRecording();}else if(ending>=.6){playing=false;syncPositions();draw();}}
      }
      if(playing||recordBusy)draw(dt);
      uiElapsed+=dt;if(uiElapsed>.15){ui();uiElapsed=0;}
    }
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange',()=>{last=performance.now();});
  window.addEventListener('pagehide',()=>{recordStream?.getTracks().forEach(track=>track.stop());if(downloadURL)URL.revokeObjectURL(downloadURL);});
  library=createStatisticsLibrary({onSelect:(item,value)=>applyCSV(value,item),isLocked:()=>recordBusy,getSelected:()=>dataset});
  syncPositions();draw();ui();requestAnimationFrame(frame);
  return {
    pause(){playing=false;syncPositions();draw();ui();},
    persist,
    snapshot:()=>({csv,dataset,...Object.fromEntries(settings.map(key=>[key,$(key).value]))}),
    loadSnapshot(value){
      const parsed=parseStatistics(value.csv);data=parsed;csv=value.csv;dataset=value.dataset??null;$('csv').value=csv;
      for(const key of settings)if(value[key]!==undefined)$(key).value=String(value[key]);
      reset();
    },
    renderFrame(value,dt){progress=Math.max(0,Math.min(1,value));draw(dt);return canvas;},
    isRecording:()=>recordBusy,
    setActive(value){active=value;if(!active){playing=false;syncPositions();}last=performance.now();if(active){draw();ui();}},
    state:()=>({progress,year:year(),playing,recording:recordBusy,names:[...data.names],ranking:ranking(),duration:duration(),datasetId:dataset?.id??null,snapshot:snapshot(),interpolation:$('interpolation').value,axisMax}),
  };
}
