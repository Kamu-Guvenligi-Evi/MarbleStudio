export function createStatisticsLibrary({onSelect,isLocked,getSelected}) {
  const root=document.getElementById('statistics-library');
  root.innerHTML=`<div class="statistics-data-heading"><div><p class="eyebrow">HAZIR VERİ KÜTÜPHANESİ</p><h2>Bir konu seç, yarışı başlat.</h2><p id="statistics-library-status" role="status">Kaynaklı veri setleri yükleniyor…</p></div><label for="statistics-category">Kategori<select id="statistics-category"><option value="">Tüm konular</option></select></label></div><div id="statistics-datasets" class="statistics-datasets"></div><details id="statistics-provenance" hidden><summary>Seçili verinin kaynağı ve kapsamı</summary><p id="statistics-dataset-note"></p><p id="statistics-dataset-date"></p><div id="statistics-dataset-sources"></div></details><button id="statistics-library-retry" class="button secondary" hidden>Veri kütüphanesini yeniden yükle</button>`;
  const $=id=>document.getElementById('statistics-'+id);
  let items=[],revision=0,loading=false,locked=false;
  const icons={'Futbol':'⚽','Nüfus':'◉','Ekonomi':'↗','Teknoloji':'⌁','Motor sporları':'⚑','Uzay':'✦','Otomotiv':'↗','Seyahat':'✈'};
  function render(){
    const grid=$('datasets');grid.replaceChildren();
    for(const item of items.filter(item=>!$('category').value||item.category===$('category').value)){
      const button=document.createElement('button');button.className='statistics-dataset';button.dataset.dataset=item.id;
      button.setAttribute('aria-pressed',String(getSelected()?.id===item.id));button.disabled=locked;
      const icon=document.createElement('span');icon.className='statistics-dataset-icon';icon.textContent=icons[item.category]??'↗';icon.setAttribute('aria-hidden','true');
      const title=document.createElement('b');title.textContent=item.title;
      const description=document.createElement('small');description.textContent=`${item.snapshot?'Sabit karşılaştırma':item.start+'–'+item.end} · ${item.entities} ${item.entityLabel??(item.category==='Futbol'?'kulüp':'ülke/ekonomi')}`;
      const unit=document.createElement('span');unit.className='statistics-dataset-unit';unit.textContent=item.unit;
      button.append(icon,title,description,unit);
      if(item.story){const story=document.createElement('small');story.className='statistics-dataset-story';story.textContent=item.story;button.append(story);}
      button.onclick=()=>select(item);grid.append(button);
    }
  }
  function details(){
    const item=getSelected();$('provenance').hidden=!item;if(!item)return;
    $('dataset-note').textContent=item.note;
    $('dataset-date').textContent=`Alındı: ${String(item.retrievedAt??'').slice(0,10)} · ${item.license??''}`;
    const links=$('dataset-sources');links.replaceChildren();
    for(const source of item.sources??[]){
      if(!/^https:\/\//.test(source.url))continue;
      const link=document.createElement('a');link.href=source.url;link.textContent=source.title;link.target='_blank';link.rel='noopener noreferrer';links.append(link);
    }
  }
  async function select(item){
    if(locked||isLocked())return;
    const current=++revision;loading=true;$('library-status').textContent=`${item.title} açılıyor…`;
    try{
      const response=await fetch(item.csv,{signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('Veri dosyası yüklenemedi.');
      const csv=await response.text();if(current!==revision||locked||isLocked())return;
      onSelect(item,csv);render();details();$('library-status').textContent=`✓ ${item.title} hazır. Başlat düğmesiyle izle.`;
    }catch(error){if(current===revision)$('library-status').textContent=error.message+' Başka bir konu seçebilir veya yeniden deneyebilirsin.';}
    finally{if(current===revision)loading=false;}
  }
  async function load(){
    $('library-retry').hidden=true;
    try{
      const response=await fetch('/statistics/manifest.json',{signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('Kütüphane yüklenemedi.');
      const manifest=await response.json();
      if(!Array.isArray(manifest.items)||!manifest.items.every(item=>typeof item.id==='string'&&typeof item.title==='string'&&/^\/statistics\/[a-z0-9-]+\.csv$/.test(item.csv)))throw new Error('Veri kütüphanesi geçersiz.');
      items=manifest.items;
      if(!items.length)throw new Error('Veri kütüphanesi boş.');
      $('category').replaceChildren(new Option('Tüm konular',''));
      for(const category of new Set(items.map(item=>item.category)))$('category').add(new Option(category,category));
      render();details();$('library-status').textContent=`${items.length} gerçek veri seti · Kaynağıyla birlikte hazır · İnternetten yeniden indirmen gerekmez.`;
      // Retired presets should not reappear through an older saved draft.
      if(getSelected()&&!items.some(item=>item.id===getSelected().id))await select(items[0]);
    }catch(error){$('library-status').textContent=error.message;$('library-retry').hidden=false;}
  }
  $('category').onchange=render;$('library-retry').onclick=load;load();
  return {busy:()=>loading,lock(value){locked=value;$('category').disabled=value;$('library-retry').disabled=value;render();},refresh(){revision++;loading=false;render();details();}};
}
