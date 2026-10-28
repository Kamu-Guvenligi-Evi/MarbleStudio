import {englishRosterName} from './output-language.js';
import { loadBallImage, normalizeBallImages } from './ball-images.js';
import { portraitFrame } from './portrait-framing.js';

const prepared=new Map();
const preparing=new Map();
const fold=value=>value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
export function prepareCatalogImage(item) {
  if(prepared.has(item.id))return Promise.resolve(prepared.get(item.id));
  if(!preparing.has(item.id))preparing.set(item.id,renderCatalogImage(item).finally(()=>preparing.delete(item.id)));
  return preparing.get(item.id);
}
async function renderCatalogImage(item) {
  const img=new Image();img.src=item.src;await img.decode();
  const face=portraitFrame(item,img),size=face?256:128;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#f4f6fb';ctx.fillRect(0,0,size,size);
  // Fill the marble with a sharp square crop; the renderer clips it to a circle.
  const side=Math.min(img.naturalWidth,img.naturalHeight);
  const offsetY=(img.naturalHeight-side)*(item.fit==='contain'?.5:.22);
  if(item.fit==='flag') {
    // Extend the flag's edge colors into a round badge, keeping the original
    // proportions of crescents, discs and coats of arms inside it.
    const probe=document.createElement('canvas');probe.width=probe.height=32;
    const scan=probe.getContext('2d',{willReadFrequently:true});scan.drawImage(img,0,0,32,32);
    const pixels=scan.getImageData(0,0,32,32).data,colors=new Map();
    for(let i=0;i<pixels.length;i+=4){
      if(pixels[i+3]<240)continue;
      const key=[pixels[i]>>4,pixels[i+1]>>4,pixels[i+2]>>4].join(',');
      const color=colors.get(key)??{count:0,r:pixels[i],g:pixels[i+1],b:pixels[i+2]};
      color.count++;colors.set(key,color);
    }
    const base=[...colors.values()].sort((a,b)=>b.count-a.count)[0]??{r:30,g:40,b:55};
    const scale=Math.min(size/img.naturalWidth,size/img.naturalHeight);
    const w=img.naturalWidth*scale,h=img.naturalHeight*scale,x=(size-w)/2,y=(size-h)/2;
    ctx.clearRect(0,0,size,size);
    ctx.save();ctx.beginPath();ctx.arc(size/2,size/2,size/2,0,Math.PI*2);ctx.clip();
    ctx.fillStyle=`rgb(${base.r},${base.g},${base.b})`;ctx.fillRect(0,0,size,size);
    if(y>0){
      ctx.drawImage(img,0,0,img.naturalWidth,1,x,0,w,y+1);
      ctx.drawImage(img,0,img.naturalHeight-1,img.naturalWidth,1,x,y+h-1,w,y+1);
    }
    if(x>0){
      ctx.drawImage(img,0,0,1,img.naturalHeight,0,y,x+1,h);
      ctx.drawImage(img,img.naturalWidth-1,0,1,img.naturalHeight,x+w-1,y,x+1,h);
    }
    ctx.drawImage(img,x,y,w,h);ctx.restore();
  }else if(item.fit==='contain') {
    // Trim transparent asset margins before cropping the visible artwork.
    const probe=document.createElement('canvas');probe.width=probe.height=128;
    const scan=probe.getContext('2d',{willReadFrequently:true});scan.drawImage(img,0,0,128,128);
    const data=scan.getImageData(0,0,128,128).data;let left=128,top=128,right=-1,bottom=-1;
    for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(data[(y*128+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    if(right>=left) {
      const sx=left/128*img.naturalWidth,sy=top/128*img.naturalHeight;
      const sw=(right-left+1)/128*img.naturalWidth,sh=(bottom-top+1)/128*img.naturalHeight;
      const crop=Math.min(sw,sh);
      ctx.drawImage(img,sx+(sw-crop)/2,sy+(sh-crop)/2,crop,crop,0,0,size,size);
    }
  }else if(face)ctx.drawImage(img,face.x,face.y,face.side,face.side,0,0,size,size);
  else ctx.drawImage(img,(img.naturalWidth-side)/2,offsetY,side,side,0,0,size,size);
  const src=canvas.toDataURL('image/webp',.9);normalizeBallImages([src]);await loadBallImage(src);
  prepared.set(item.id,src);return src;
}

let legacyCatalog;
export async function upgradeCatalogImages(images) {
  if(!images.some(Boolean))return images;
  try {
    legacyCatalog??=Promise.all(['/catalog/legacy-padding.json','/catalog/manifest.json'].map(async url=>{
      const response=await fetch(url);if(!response.ok)throw new Error('Kütüphane okunamadı.');return response.json();
    }));
    const [hashes,catalog]=await legacyCatalog;
    return await Promise.all(images.map(async src=>{
      if(!src)return src;
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(src));
      const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      const item=catalog.items.find(item=>item.id===hashes[hash]);
      // Exact old-image matches only: personal uploads and existing crops stay intact.
      return item?await prepareCatalogImage(item):src;
    }));
  }catch {legacyCatalog=null;return images;}
}

export function createImageCatalog({getImages,getNames,getCount,onRosterChange,onApplied,notify}) {
  const $=id=>document.getElementById(id),dialog=$('catalog-dialog');
  let catalog=null,category='countries',selected=0,busy=false,loading=false,loadError='',previewObserver=null;
  const status=message=>{$('catalog-status').textContent=message;};
  const filtered=()=>{
    const query=fold($('catalog-search').value.trim());
    return (catalog?.items??[]).filter(item=>(category==='all'||item.category===category)&&(!query||fold(item.name+' '+(item.localName??'')+' '+(item.keywords??'')).includes(query)));
  };
  function renderRoster() {
    $('catalog-roster').replaceChildren();$('catalog-target').replaceChildren();
    for(let i=0;i<getCount();i++) {
      const name=getNames()[i]||`${i+1}. top`,button=document.createElement('button');
      button.type='button';button.className='catalog-slot';button.setAttribute('aria-label',`${i+1}. top: ${name}`);button.setAttribute('aria-pressed',String(i===selected));button.disabled=busy;
      const src=getImages()[i];if(src){const img=document.createElement('img');img.src=src;img.alt='';button.append(img);}else button.textContent=i+1;
      button.onclick=()=>{selected=i;renderRoster();};$('catalog-roster').append(button);
      $('catalog-target').add(new Option(`${i+1}. top · ${name}`,String(i)));
    }
    $('catalog-target').value=String(selected);$('catalog-target').disabled=busy;
  }
  function renderCategories() {
    $('catalog-categories').replaceChildren();
    for(const group of [{id:'all',name:'Tümü'},...(catalog?.categories??[])]) {
      const count=(catalog?.items??[]).filter(item=>group.id==='all'||item.category===group.id).length;
      const button=document.createElement('button');button.type='button';button.textContent=`${group.name} ${count}`;
      button.dataset.category=group.id;button.setAttribute('aria-pressed',String(category===group.id));
      button.onclick=()=>{category=group.id;renderCategories();renderGrid();};$('catalog-categories').append(button);
    }
  }
  function renderGrid() {
    previewObserver?.disconnect();
    previewObserver=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        previewObserver.unobserve(entry.target);
        entry.target.loadPreview();
      }
    },{root:dialog,rootMargin:'100px'});
    const items=filtered();$('catalog-grid').replaceChildren();$('catalog-count').textContent=`${items.length} görsel`;
    $('catalog-fill').disabled=busy||!items.length;
    $('catalog-fill').textContent=`${Math.min(items.length,getCount())} top için kadro oluştur`;
    if(!items.length&&!loading){const empty=document.createElement('p');empty.className='catalog-empty';empty.textContent=loadError||'Bu aramada görsel bulunamadı. Tümü kategorisini veya başka bir isim dene.';$('catalog-grid').append(empty);}
    for(const item of items) {
      const card=document.createElement('article');card.className='catalog-card';
      const button=document.createElement('button');button.type='button';button.dataset.catalogItem=item.id;button.disabled=busy;button.setAttribute('aria-label',`${item.name} görselini topa ekle`);
      const img=document.createElement('img');img.alt='';img.decoding='async';
      // Decode/crop only cards near the visible part of the dialog. Eagerly
      // preparing every card defeats lazy loading and stalls slower computers.
      button.loadPreview=()=>prepareCatalogImage(item).then(src=>{
        if(button.isConnected){img.src=src;img.style.objectPosition='center';}
      }).catch(()=>{
        if(!button.isConnected)return;
        button.disabled=true;img.alt='Görsel dosyası eksik';
        status('Bazı görsel dosyaları okunamadı. Uygulamanın public/catalog klasörünü eksiksiz kopyalayın.');
      });
      previewObserver.observe(button);
      img.onerror=()=>{button.disabled=true;img.alt='Görsel yüklenemedi';};
      const label=document.createElement('span');label.textContent=item.localName?`${item.localName} · ${item.name}`:item.name;button.append(img,label);button.onclick=()=>apply([item],false);
      const source=document.createElement('a');source.href=item.source;source.target='_blank';source.rel='noopener';source.textContent='Kaynak ↗';source.title=`${item.credit} · ${item.license}`;source.setAttribute('aria-label',`${item.name}: kaynak ve kullanım bilgisi`);
      card.append(button);
      if(item.historicalNote){const note=document.createElement('small');note.className='catalog-history';note.textContent=item.historicalNote;card.append(note);}
      card.append(source);$('catalog-grid').append(card);
    }
  }
  async function apply(items,bulk) {
    if(busy)return;
    const original=getImages(),namesOriginal=getNames(),index=selected;
    busy=true;renderRoster();renderGrid();status('Görseller toplara hazırlanıyor…');
    try {
      const sources=await Promise.all(items.map(prepareCatalogImage));
      if(!dialog.open||original!==getImages()||namesOriginal!==getNames())throw new Error('Seçim değişti. Görselleri yeniden seç.');
      const images=[...original],names=[...namesOriginal];
      sources.forEach((src,i)=>{const target=bulk?i:index;images[target]=src;names[target]=englishRosterName(items[i].englishName??items[i].name);});
      onRosterChange(images,names);onApplied();
      if(!bulk)selected=(selected+1)%getCount();
      status(bulk?`${sources.length} topa görsel ve isim eklendi. Kadron hazır.`:`${items[0].name}, ${index+1}. topa eklendi. Sırada ${selected+1}. top var.`);
    }catch(error){status(`Görsel eklenemedi: ${error.message}`);notify(error.message);}
    finally{
      busy=false;renderRoster();renderGrid();
      if(dialog.open)(bulk?$('catalog-fill'):$('catalog-grid').querySelector(`[data-catalog-item="${items[0].id}"]`))?.focus({preventScroll:true});
    }
  }
  async function load() {
    if(loading)return;loading=true;loadError='';$('catalog-retry').hidden=true;status('Yerel görsel kütüphanesi açılıyor…');
    try {
      const response=await fetch('/catalog/manifest.json',{cache:'no-cache',signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('Kütüphane dosyası okunamadı.');
      const next=await response.json();
      if(!Array.isArray(next.items)||!next.items.length||!Array.isArray(next.categories)||next.items.some(item=>!item||typeof item.id!=='string'||typeof item.name!=='string'||typeof item.src!=='string'||!item.src.startsWith('/catalog/'))||next.categories.some(group=>!group||typeof group.id!=='string'||typeof group.name!=='string'))throw new Error('Kütüphane dosyası eksik veya geçersiz.');
      catalog=next;
      if(!catalog.items.some(item=>item.category===category))category='all';
      $('catalog-total').textContent=`${catalog.items.length} görsel · ${catalog.categories.length} kategori · Cihazında hazır`;
      status('Kategoriyi seç, ardından bir görsele dokun.');renderCategories();
    }catch(error){catalog=null;loadError='Görsel kütüphanesi yüklenemedi. Uygulamayı ZIP içinden değil, tüm dosyalarını çıkardığın klasördeki Baslat.cmd ile açıp yeniden dene.';status(loadError);$('catalog-total').textContent='Kütüphane yüklenemedi';$('catalog-categories').replaceChildren();$('catalog-retry').hidden=false;}
    finally{loading=false;renderGrid();}
  }
  $('catalog-target').onchange=()=>{selected=Number($('catalog-target').value);renderRoster();};
  dialog.addEventListener('close',()=>previewObserver?.disconnect());
  $('catalog-search').oninput=renderGrid;$('catalog-retry').onclick=load;
  $('catalog-fill').onclick=()=>{
    const items=[...filtered()];for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}
    apply(items.slice(0,getCount()),true);
  };
  return {open(index=0){selected=Math.max(0,Math.min(index,getCount()-1));renderRoster();dialog.showModal();if(!catalog)load();else{renderCategories();renderGrid();}}};
}
