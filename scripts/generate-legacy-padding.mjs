import {chromium} from 'playwright';import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:5173');
const hashes=await page.evaluate(async()=>{
 const catalog=await(await fetch('/catalog/manifest.json')).json(),hashes={};
 for(const item of catalog.items.filter(i=>i.fit==='contain'||i.category==='politicians')){
  const img=new Image();img.src=item.src;await img.decode();const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#f4f6fb';ctx.fillRect(0,0,128,128);
  const scale=112/Math.hypot(img.naturalWidth,img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;ctx.drawImage(img,(128-w)/2,(128-h)/2,w,h);
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(c.toDataURL('image/webp',.9)));
  hashes[Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')]=item.id;
  ctx.fillStyle='#f4f6fb';ctx.fillRect(0,0,128,128);
  const side=Math.min(img.naturalWidth,img.naturalHeight);
  ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)*(item.fit==='contain'?.5:.22),side,side,0,0,128,128);
  const coverHash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(c.toDataURL('image/webp',.9)));
  hashes[Array.from(new Uint8Array(coverHash),b=>b.toString(16).padStart(2,'0')).join('')]=item.id;
 }
 return hashes;
});const existing=JSON.parse(fs.readFileSync('public/catalog/legacy-padding.json','utf8'));fs.writeFileSync('public/catalog/legacy-padding.json',JSON.stringify({...existing,...hashes}));console.log('Legacy image fingerprints:',Object.keys({...existing,...hashes}).length);
}finally{await browser.close();}
