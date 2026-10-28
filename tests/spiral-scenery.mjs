import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:5173');
  const results=await page.evaluate(async()=>{
    const {drawSpiralScenery}=await import('/src/spiral-scenery.js');
    const {SPIRAL_THEMES}=await import('/src/spiral-themes.js');
    const sheet=document.createElement('canvas');sheet.width=810;sheet.height=Math.ceil(Object.values(SPIRAL_THEMES).filter(t=>t.scenery).length/3)*480;
    const sheetCtx=sheet.getContext('2d');let index=0;
    const {Spiral}=await import('/src/spiral.js');
    const {renderSpiral}=await import('/src/spiral-renderer.js');
    const results=[],frames=new Set();
    for(const [id,theme] of Object.entries(SPIRAL_THEMES).filter(([,t])=>t.scenery)){
      const canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;
      // Keep readback on one raster backend; GPU-to-CPU migration changes edge antialiasing.
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      const frame=t=>{ctx.clearRect(0,0,540,960);drawSpiralScenery(ctx,theme.scenery,t);return canvas.toDataURL();};
      const a=frame(3),b=frame(5),repeat=frame(3);
      frames.add(a);results.push({id,moving:a!==b,repeat:a===repeat,alpha:ctx.globalAlpha,transform:ctx.getTransform().isIdentity});
      const race=new Spiral({theme:id});race.time=3;renderSpiral(ctx,race);
      sheetCtx.drawImage(canvas,index%3*270,Math.floor(index/3)*480,270,480);index++;
    }
    document.body.replaceChildren(sheet);sheet.id='scenery-preview';
    if(frames.size!==results.length)throw Error('Each theme must have distinct scenery');
    return results;
  });
  assert.equal(results.length,31);
  for(const r of results){assert.ok(r.moving,r.id+' should animate');assert.ok(r.repeat,r.id+' should reproduce paused/exported frames');assert.equal(r.alpha,1);assert.ok(r.transform);}
  await page.locator('#scenery-preview').screenshot({path:'artifacts/spiral-scenery-preview.png'});
  console.log('PASS: 31 animated themes, repeatable frames and restored canvas state.');
}finally{await browser.close();}
