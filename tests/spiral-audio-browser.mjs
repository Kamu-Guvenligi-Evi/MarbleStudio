import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#nav-spiral').click();assert.ok(await page.locator('#sound').isChecked());
  await page.locator('#sound').uncheck();await page.reload();await page.waitForFunction(()=>window.marbleStudio);await page.locator('#nav-spiral').click();assert.equal(await page.locator('#sound').isChecked(),false);
  const results=await page.evaluate(async()=>{
    const {playEffect}=await import('/src/impact-audio.js'),results=[];
    for(const type of ['drop','impact','ice','multiply','complete']){
      const context=new OfflineAudioContext(2,48000,48000);playEffect(context,context.destination,{type,x:515,seed:31,theme:'ice'});
      const rendered=await context.startRendering();
      const energy=channel=>rendered.getChannelData(channel).reduce((sum,x)=>sum+x*x,0);
      results.push({type,left:energy(0),right:energy(1)});
    }
    return results;
  });
  for(const r of results){assert.ok(r.left>0);assert.ok(r.right>r.left,r.type+' stereo position');}
  await page.goto('http://127.0.0.1:5180/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
  const captured=await page.evaluate(()=>{
    const recipe={mode:'spiral',seed:2048,variant:'classic',theme:'ice',count:1},analysis=window.factoryRenderer.probe(recipe);
    window.factoryRenderer.begin({recipe,analysis,speed:3,fps:30,copy:{hook:'Test',language:'en'}});
    window.factoryRenderer.frame(Math.ceil((analysis.simulationSeconds/3+1)*30));
    return {events:window.factoryRenderer.audio(),result:window.factoryRenderer.result()};
  });
  assert.ok(captured.result.complete);
  for(const type of ['drop','impact','ice','multiply','complete'])assert.ok(captured.events.some(e=>e.type===type),type+' export event');
  assert.deepEqual(errors,[]);console.log('PASS: spiral sound enabled by default, mute persists, five stereo Web Audio effects and all event types captured for export.');
}finally{await browser.close();}
