import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage();await page.goto('http://127.0.0.1:5173?edit=1');
  const results=await page.evaluate(async()=>{
    const {prepareCatalogImage,upgradeCatalogImages}=await import('/src/image-catalog.js');
    const catalog=await(await fetch('/catalog/manifest.json')).json(),results=[];
    for(const item of catalog.items.filter(i=>i.category==='politicians')) {
      const original=new Image();original.src=item.src;await original.decode();
      const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
      const ctx=canvas.getContext('2d'),side=Math.min(original.naturalWidth,original.naturalHeight);
      ctx.fillStyle='#f4f6fb';ctx.fillRect(0,0,128,128);
      ctx.drawImage(original,(original.naturalWidth-side)/2,(original.naturalHeight-side)*.22,side,side,0,0,128,128);
      const old=canvas.toDataURL('image/webp',.9),prepared=await prepareCatalogImage(item);
      const img=new Image();img.src=prepared;await img.decode();
      const [upgraded]=await upgradeCatalogImages([old]);
      results.push({name:item.name,width:img.naturalWidth,length:prepared.length,migrated:upgraded===prepared&&old!==prepared});
    }
    return results;
  });
  assert.equal(results.length,20);
  for(const result of results){assert.equal(result.width,256,result.name);assert.ok(result.length<50000,result.name);assert.ok(result.migrated,result.name);}
  console.log('PASS: all 20 face crops decode at 256px, fit saved-image limits and migrate old portraits.');
}finally{await browser.close();}
