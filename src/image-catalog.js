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
  // Keep the circle filled, with the complete emblem sharp over a soft backdrop.
  const side=Math.min(img.naturalWidth,img.naturalHeight);
  const offsetY=(img.naturalHeight-side)*(item.fit==='contain'?.5:.22);
  if(item.fit==='contain') {
    ctx.save();ctx.filter='blur(7px)';
    ctx.drawImage(img,(img.naturalWidth-side)/2,offsetY,side,side,-12,-12,152,152);ctx.restore();
    // Trim transparent asset margins before fitting the visible artwork.
    const probe=document.createElement('canvas');probe.width=probe.height=128;
    const scan=probe.getContext('2d',{willReadFrequently:true});scan.drawImage(img,0,0,128,128);
    const data=scan.getImageData(0,0,128,128).data;let left=128,top=128,right=-1,bottom=-1;
    for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(data[(y*128+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    if(right>=left) {
      const sx=left/128*img.naturalWidth,sy=top/128*img.naturalHeight;
      const sw=(right-left+1)/128*img.naturalWidth,sh=(bottom-top+1)/128*img.naturalHeight;
      // Round badges can fill the marble; rectangular flags still keep all corners.
      let radius=0;
      const cx=(left+right+1)/2,cy=(top+bottom+1)/2;
      for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)if(data[(y*128+x)*4+3]>16) {
        radius=Math.max(radius,Math.hypot((x+.5-cx)*img.naturalWidth/128,(y+.5-cy)*img.naturalHeight/128));
      }
      const scale=62/(radius+Math.max(img.naturalWidth,img.naturalHeight)/256),w=sw*scale,h=sh*scale;
      ctx.drawImage(img,sx,sy,sw,sh,(128-w)/2,(128-h)/2,w,h);
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
  let catalog=null,category='countries',selected=0,busy=false,loading=false;
  const status=message=>{$('catalog-status').textContent=message;};
  const filtered=()=>{
    const query=fold($('catalog-search').value.trim());
    return (catalog?.items??[]).filter(item=>(category==='all'||item.category===category)&&(!query||fold(item.name+' '+(item.localName??'')).includes(query)));
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
    const items=filtered();$('catalog-grid').replaceChildren();$('catalog-count').textContent=`${items.length} görsel`;
    $('catalog-fill').disabled=busy||!items.length;
    $('catalog-fill').textContent=`${Math.min(items.length,getCount())} top için kadro oluştur`;
    if(!items.length&&!loading){const empty=document.createElement('p');empty.className='catalog-empty';empty.textContent='Bu aramada görsel bulunamadı. Tümü kategorisini veya başka bir isim dene.';$('catalog-grid').append(empty);}
    for(const item of items) {
      const card=document.createElement('article');card.className='catalog-card';
      const button=document.createElement('button');button.type='button';button.dataset.catalogItem=item.id;button.disabled=busy;button.setAttribute('aria-label',`${item.name} görselini topa ekle`);
      const img=document.createElement('img');img.src=item.src;img.alt='';img.loading='lazy';img.decoding='async';img.className=item.fit==='contain'?'catalog-contain':'';
      prepareCatalogImage(item).then(src=>{img.src=src;img.className='';img.style.objectPosition='center';}).catch(()=>{});
      img.onerror=()=>{button.disabled=true;img.alt='Görsel yüklenemedi';};
      const label=document.createElement('span');label.textContent=item.localName?`${item.localName} · ${item.name}`:item.name;button.append(img,label);button.onclick=()=>apply([item],false);
      const source=document.createElement('a');source.href=item.source;source.target='_blank';source.rel='noopener';source.textContent='Kaynak ↗';source.title=`${item.credit} · ${item.license}`;source.setAttribute('aria-label',`${item.name}: kaynak ve kullanım bilgisi`);
      card.append(button,source);$('catalog-grid').append(card);
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
      sources.forEach((src,i)=>{const target=bulk?i:index;images[target]=src;names[target]=items[i].name.slice(0,24);});
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
    if(loading)return;loading=true;$('catalog-retry').hidden=true;status('Yerel görsel kütüphanesi açılıyor…');
    try {
      const response=await fetch('/catalog/manifest.json');if(!response.ok)throw new Error('Kütüphane dosyası okunamadı.');
      catalog=await response.json();if(!Array.isArray(catalog.items)||!catalog.items.length)throw new Error('Kütüphane boş.');
      $('catalog-total').textContent=`${catalog.items.length} görsel · ${catalog.categories.length} kategori · Cihazında hazır`;
      status('Kategoriyi seç, ardından bir görsele dokun.');renderCategories();
    }catch(error){status(error.message);$('catalog-retry').hidden=false;}
    finally{loading=false;renderGrid();}
  }
  $('catalog-target').onchange=()=>{selected=Number($('catalog-target').value);renderRoster();};
  $('catalog-search').oninput=renderGrid;$('catalog-retry').onclick=load;
  $('catalog-fill').onclick=()=>{
    const items=[...filtered()];for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}
    apply(items.slice(0,getCount()),true);
  };
  return {open(index=0){selected=Math.max(0,Math.min(index,getCount()-1));renderRoster();dialog.showModal();if(!catalog)load();else{renderCategories();renderGrid();}}};
}
