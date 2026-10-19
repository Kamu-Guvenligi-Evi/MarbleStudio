import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage();
  await page.route('**/atlas-empty',r=>r.fulfill({contentType:'text/html',body:'<!doctype html>'}));
  await page.goto('http://127.0.0.1:5173/atlas-empty');
  const result=await page.evaluate(async()=>{
    const {BattleSpriteCache}=await import('/src/crown-battle-sprite-cache.js');
    const cache=new BattleSpriteCache(); cache.beginFrame(1);
    const source=document.createElement('canvas');source.width=80;source.height=76;
    const g=source.getContext('2d');g.fillStyle='#ff8040';g.fillRect(0,0,80,76);
    const shadow=document.createElement('canvas');shadow.width=shadow.height=1;
    const entries=[];
    // Real Middle-earth scale factors cause fractional clipping at tile edges.
    for(const resolution of [1.60395,1.409,1.699,2.67327,5.05713]) {
      for(const face of [-1,1]) entries.push(cache.get(source,face,false,resolution,shadow));
    }
    const invalid=entries.filter(e=>[e.x,e.y,e.width,e.height].some(v=>!Number.isInteger(v)));
    let mismatches=0;
    for(const page of cache.pages) {
      const actual=page.ctx.getImageData(0,0,1024,1024).data;
      for(let i=0;i<actual.length;i+=4) for(let c=0;c<4;c++) {
        const expected=c===3?actual[i+3]:Math.round(actual[i+c]*actual[i+3]/255);
        if(page.pixels[i+c]!==expected)mismatches++;
      }
    }
    return {entries:entries.length,invalid:invalid.length,example:invalid.slice(0,2).map(({x,y,width,height})=>({x,y,width,height})),mismatches};
  });
  console.log(JSON.stringify(result));
  assert.equal(result.invalid,0,'Atlas positions and sizes must be whole pixels');
  assert.equal(result.mismatches,0,'GPU upload pixels must match the Canvas atlas');
  console.log('PASS: fractional Middle-earth scales pack and upload exact atlas pixels');
}finally{await browser.close();}
