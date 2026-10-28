import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
  const page = await browser.newPage();
  await page.routeWebSocket('**/*',socket=>socket.close());
  await page.route('**/crop-empty',r=>r.fulfill({contentType:'text/html',body:'<html></html>'}));
  await page.goto('http://127.0.0.1:5173/crop-empty');
  const result = await page.evaluate(async()=>{
    const {SpriteLibrary}=await import('/src/crown-battle-art.js');
    const {BattleSpriteCache}=await import('/src/crown-battle-sprite-cache.js');
    const {makeContactShadow}=await import('/src/crown-battle-pc-scene.js');
    const {UNIT_TYPES,roleOf}=await import('/src/crown-battle.js');
    const types=['sword','pike','archer','cavalry',Object.keys(UNIT_TYPES).find(k=>UNIT_TYPES[k].projectile==='bullet'),Object.keys(UNIT_TYPES).find(k=>UNIT_TYPES[k].role==='elephant')].filter(Boolean);
    const library=new SpriteLibrary(),cache=new BattleSpriteCache(),shadow=makeContactShadow();
    const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=b.width=240;a.height=b.height=200;
    const ac=a.getContext('2d',{willReadFrequently:true}),bc=b.getContext('2d',{willReadFrequently:true});
    let checks=0,originalPixels=0,croppedPixels=0,maxDifference=0,maxMeanDifference=0,maxUnzoomedDifference=0,worst=null;
    for(const resolution of [1,2,4]) {
      cache.clear(); cache.beginFrame(resolution);
      for(const type of types) for(const action of ['idle','walk','attack']) for(const frame of [0,4,7]) for(const face of [-1,1]) {
        const horse=['cavalry','elephant'].includes(roleOf({type}));
        const source=library.get(type,0,frame,action,frame%3);
        const entry=cache.get(source,face,horse,resolution,shadow);
        const reference=document.createElement('canvas');reference.width=100*resolution;reference.height=80*resolution;
        // Match the production CPU staging surface. GPU canvas downsampling
        // uses a different filter and would confound this crop comparison.
        const rc=reference.getContext('2d',{willReadFrequently:true});
        // Use the atlas filter so this checks cropping independently of resampling.
        rc.imageSmoothingEnabled=true;rc.imageSmoothingQuality='high';
        rc.translate(50*resolution,65*resolution);rc.scale(resolution,resolution);
        const radius=horse?25:13;rc.drawImage(shadow,4-radius,-3,radius*2,horse?13:9);
        rc.scale(face,1);rc.drawImage(source,-30,-61,80,76);
        for(const scale of [.7,1,1.3]) {
          ac.fillStyle=bc.fillStyle='#445a32';ac.fillRect(0,0,240,200);bc.fillRect(0,0,240,200);
          ac.drawImage(reference,0,0,100*resolution,80*resolution,120-50*scale,100-65*scale,100*scale,80*scale);
          bc.drawImage(entry.canvas,entry.x,entry.y,entry.width,entry.height,120+entry.offsetX*scale,100+entry.offsetY*scale,entry.width/resolution*scale,entry.height/resolution*scale);
          const ap=ac.getImageData(0,0,240,200).data,bp=bc.getImageData(0,0,240,200).data;
          let difference=0;
          for(let i=0;i<ap.length;i++) {
            const delta=Math.abs(ap[i]-bp[i]); difference+=delta;
            if(scale===1)maxUnzoomedDifference=Math.max(maxUnzoomedDifference,delta);
            if(delta>maxDifference){maxDifference=delta;worst={type,action,frame,face,resolution,scale};}
          }
          maxMeanDifference=Math.max(maxMeanDifference,difference/ap.length);
          checks++;
        }
        originalPixels+=8000*resolution*resolution;croppedPixels+=entry.width*entry.height;
      }
    }
    return {checks,types,maxDifference,maxMeanDifference,maxUnzoomedDifference,worst,pixelReductionPercent:Math.round(100*(1-croppedPixels/originalPixels))};
  });
  assert.ok(result.checks>=800);
  // Without fractional zoom the crop must preserve pixels within 1/255.
  // CPU Canvas interpolation at fractional zoom depends on the source rect;
  // constrain both edge error and mean error to detect clipped/missing art.
  assert.ok(result.maxUnzoomedDifference<=1,JSON.stringify(result));
  assert.ok(result.maxDifference<=12 && result.maxMeanDifference<.02,JSON.stringify(result));
  assert.ok(result.pixelReductionPercent>20,JSON.stringify(result));
  console.log('PASS: cropped atlas retains sprite/shadow pixels across facing, attacks, zoom and resolution:',JSON.stringify(result));
} finally {await browser.close();}
