import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {SPIRAL_GUIDE_SECONDS,spiralRail,spiralRailLength,spiralGuide} from '../src/spiral-guide.js';

assert.deepEqual(spiralGuide(0).head,{x:530,y:480});
assert.deepEqual(spiralGuide(SPIRAL_GUIDE_SECONDS).head,{x:284,y:480});
assert.deepEqual(spiralGuide(100).head,spiralGuide(SPIRAL_GUIDE_SECONDS).head);
for(let time=0;time<=16;time+=.1){
  const guide=spiralGuide(time);
  assert.ok(guide.tailOpacity>=0&&guide.tailOpacity<=1);
  assert.ok(guide.distance>=0&&guide.distance<=spiralRailLength);
}
assert.equal(spiralGuide(SPIRAL_GUIDE_SECONDS+1.3).tailOpacity,0);
assert.equal(spiralRail.length,2501);
assert.ok(Math.abs(spiralGuide(7).distance/spiralRailLength-.5)<1e-12);

await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1200,height:1080}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  const samples=await page.evaluate(async()=>{
    const {Spiral}=await import('/src/spiral.js');
    const {SPIRAL_THEMES}=await import('/src/spiral-themes.js');
    const {renderSpiral}=await import('/src/spiral-renderer.js');
    const {spiralGuide}=await import('/src/spiral-guide.js');
    const sheet=document.createElement('div');sheet.id='guide-sheet';
    sheet.style='position:absolute;inset:0;z-index:999999;background:#080e16;display:grid;grid-template-columns:repeat(4,270px);gap:12px;padding:18px;align-content:start';
    document.body.append(sheet);
    const pixels=[];
    for(const theme of Object.keys(SPIRAL_THEMES))for(const time of [0,3.5,7,14]){
      const race=new Spiral({theme});race.time=time;race.balls=[];
      const canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;
      canvas.style='width:270px;height:480px';const ctx=canvas.getContext('2d');
      const snapshot=[race.time,race.ice.remaining,race.state];renderSpiral(ctx,race);
      const point=spiralGuide(time).head;
      pixels.push({theme,time,pixel:[...ctx.getImageData(Math.round(point.x),Math.round(point.y),1,1).data],unchanged:JSON.stringify(snapshot)===JSON.stringify([race.time,race.ice.remaining,race.state])});
      if(theme==='ice'){
        const tile=document.createElement('div'),label=document.createElement('p');
        label.textContent=`${time}s`;label.style='color:#d5f5ff;font:18px Arial';tile.append(label,canvas);sheet.append(tile);
      }
    }
    return pixels;
  });
  for(const sample of samples){
    assert.ok(sample.pixel[0]>190&&sample.pixel[1]>235&&sample.pixel[2]>235,JSON.stringify(sample));
    assert.ok(sample.unchanged,'Drawing must preserve simulation state');
  }
  await page.locator('#guide-sheet').screenshot({path:'artifacts/spiral-guide.png'});
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);await page.locator('#nav-spiral').click();
  await page.locator('#pause').click();await page.waitForFunction(()=>window.marbleStudio.getState().time>.2);
  await page.locator('#pause').click();const time=await page.evaluate(()=>window.marbleStudio.getState().time);
  await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>window.marbleStudio.getState().time),time);
  await page.locator('#reset').click();assert.equal(await page.evaluate(()=>window.marbleStudio.getState().time),0);
  await page.goto('http://127.0.0.1:5173/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
  const exported=await page.evaluate(async()=>{
    const {spiralGuide}=await import('/src/spiral-guide.js');
    await window.factoryRenderer.begin({recipe:{mode:'spiral',count:1,seed:2048},fps:240,width:540,height:960,speed:1,intro:0,analysis:{simulationSeconds:30},copy:{hook:'Test'}});
    const frame=window.factoryRenderer.frame(7*240),image=new Image();image.src='data:image/jpeg;base64,'+frame;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const point=spiralGuide(7).head;
    return [...ctx.getImageData(Math.round(point.x),Math.round(point.y),1,1).data];
  });
  assert.ok(exported[0]>180&&exported[1]>215&&exported[2]>215,'Video frame must include the light');
  assert.deepEqual(errors,[]);
  console.log('PASS: rail start/end, constant travel speed, fading trail, all themes, unchanged physics, pause/reset and 240 FPS video rendering.');
}finally{await browser.close();}
