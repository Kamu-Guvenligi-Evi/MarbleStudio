const cache = new Map();

function dominantEffectColor(img) {
  const size=32,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const side=Math.min(img.naturalWidth,img.naturalHeight);
  ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,size,size);
  const pixels=ctx.getImageData(0,0,size,size).data,buckets=new Map();
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    // Only sample the visible circular print, excluding transparent pixels.
    if((x+.5-size/2)**2+(y+.5-size/2)**2>(size/2-1)**2)continue;
    const i=(y*size+x)*4,alpha=pixels[i+3]/255;if(alpha<.15)continue;
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
    const key=(r>>5)*64+(g>>5)*8+(b>>5);
    const group=buckets.get(key)??{weight:0,count:0,r:0,g:0,b:0};
    const saturation=(Math.max(r,g,b)-Math.min(r,g,b))/255;
    group.weight+=alpha*(.65+.35*saturation);group.count+=alpha;
    group.r+=r*alpha;group.g+=g*alpha;group.b+=b*alpha;buckets.set(key,group);
  }
  const dominant=[...buckets.values()].sort((a,b)=>b.weight-a.weight)[0];if(!dominant)return null;
  let rgb=[dominant.r,dominant.g,dominant.b].map(c=>c/dominant.count);
  // Lift dark prints enough for visible light effects while preserving their hue.
  const peak=Math.max(...rgb);
  if(peak<110)rgb=rgb.map(c=>peak>10?c*110/peak:110);
  return '#'+rgb.map(c=>Math.round(c).toString(16).padStart(2,'0')).join('');
}

export function ballImageColor(src,fallback) {return cache.get(src)?.color??fallback;}
export function normalizeBallImages(value = []) {
  if (!Array.isArray(value) || value.length > 20) throw new Error('Top görselleri geçersiz.');
  return Array.from({length:20},(_,i)=>{
    const src=value[i]??null;
    if(src!==null && (typeof src!=='string'||src.length>50000||!/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(src))) throw new Error('Top görseli desteklenmiyor veya çok büyük.');
    return src;
  });
}
export function loadBallImage(src) {
  if(!src)return Promise.resolve(null);
  if(!cache.has(src)) {
    const img=new Image(),entry={img,ready:false};
    entry.promise=new Promise(resolve=>{img.onload=()=>{
      try{entry.color=dominantEffectColor(img);}catch{entry.color=null;}
      entry.ready=true;resolve(img);
    };img.onerror=()=>resolve(null);});
    cache.set(src,entry);img.src=src;
    if(cache.size>80)cache.delete(cache.keys().next().value);
  }
  return cache.get(src).promise;
}
export function ballImage(src) {if(!src)return null;loadBallImage(src);const entry=cache.get(src);return entry?.ready?entry.img:null;}
export async function prepareBallImage(file) {
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('PNG, JPG veya WebP görsel seç.');
  if(file.size>10*1024*1024)throw new Error('Görsel en fazla 10 MB olabilir.');
  const url=URL.createObjectURL(file),img=new Image();
  try {
    img.src=url;await img.decode();
    const c=document.createElement('canvas');c.width=c.height=128;
    const ctx=c.getContext('2d'),side=Math.min(img.naturalWidth,img.naturalHeight);
    ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,128,128);
    const src=c.toDataURL('image/webp',.85);normalizeBallImages([src]);await loadBallImage(src);return src;
  }catch(e){throw new Error(e.message.includes('Top görseli')?e.message:'Görsel okunamadı. Başka bir PNG, JPG veya WebP dosyası seç.');}
  finally{URL.revokeObjectURL(url);}
}
