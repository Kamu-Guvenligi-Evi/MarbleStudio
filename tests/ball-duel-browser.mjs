import assert from 'node:assert/strict';
import {mkdir,stat} from 'node:fs/promises';
import {chromium} from 'playwright';
import {productionBrowserOptions} from '../scripts/browser-runtime.mjs';
import {selectTestChannel} from './browser-channel.mjs';
import {validateBatch,sourceRecipe} from '../src/factory-recipes.js';

const origin=process.env.TEST_FACTORY_ORIGIN??'http://127.0.0.1:5174';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch(productionBrowserOptions());
try{
  const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await selectTestChannel(page);
  await page.addInitScript(()=>{
    window.duelAudioProbe={count:0,peak:0,running:false};
    const start=AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start=function(...args){
      const probe=window.duelAudioProbe;probe.count++;probe.running=this.context.state==='running';
      for(const value of this.buffer?.getChannelData(0)??[])probe.peak=Math.max(probe.peak,Math.abs(value));
      return start.apply(this,args);
    };
  });
  let queued;
  await page.route('**/api/**',async route=>{if(route.request().url().endsWith('/queue'))queued=validateBatch(route.request().postDataJSON());await route.fulfill({json:{apiVersion:4,capabilities:['studio-workbench','duel-production'],jobs:[],total:0,summary:{done:0,pending:0}}});});
  await page.goto(origin+'/ball-duel.html');await page.waitForFunction(()=>window.duelStudio?.snapshot().ballImages.every(Boolean)&&window.duelStudio.state().time>0);
  assert.equal(await page.locator('#portrait-0').evaluate(img=>img.complete&&img.naturalWidth>0),true);
  const start=await page.evaluate(()=>window.duelStudio.state());await page.waitForTimeout(350);assert.ok((await page.evaluate(()=>window.duelStudio.state().time))>start.time);
  await page.click('#pause');const paused=await page.evaluate(()=>window.duelStudio.state().time);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.duelStudio.state().time),paused);
  await page.click('[data-theme=gold]');await page.click('#pick-0');await page.waitForSelector('[data-catalog-item]');
  await page.fill('#catalog-search','Türkiye');await page.waitForTimeout(200);
  const item=page.locator('[data-catalog-item]').first();await item.click();await page.waitForFunction(()=>window.duelStudio.snapshot().names[0]==='Türkiye'||window.duelStudio.snapshot().names[0]==='Turkey');
  await page.click('[data-close=catalog-dialog]');await page.fill('#name-1','Rakip');await page.locator('#name-1').press('Tab');
  await page.selectOption('#hp','10');await page.selectOption('#speed','2');
  const settings=await page.evaluate(()=>window.duelStudio.snapshot());assert.equal(settings.theme,'gold');assert.equal(settings.hp,10);assert.equal(settings.playbackSpeed,2);assert.equal(settings.names[1],'Rakip');assert.ok(settings.ballImages.every(x=>x.startsWith('data:image/')));
  await page.reload();await page.waitForFunction(()=>window.duelStudio?.state().time>0);assert.deepEqual(await page.evaluate(()=>window.duelStudio.snapshot()),settings);
  await page.click('[data-theme=aurora]');await page.click('#studio-export');await page.waitForFunction(()=>document.querySelector('#video-submit').textContent==='Videoyu hazırla');
  assert.equal(await page.locator('[name=strategy] option[value=variations]').evaluate(el=>el.disabled),true);
  assert.equal(await page.locator('#video-series').isVisible(),false);
  await page.click('#video-advanced summary');await page.locator('[name=fps]').fill('30');await page.selectOption('[name=audio]','effects');await page.click('#video-submit');await page.waitForFunction(()=>document.querySelector('#videos-dialog').open);
  assert.equal(queued.source.mode,'ball-duel');assert.equal(queued.source.project.theme,'aurora');assert.deepEqual(queued.source.project.ballImages,settings.ballImages);await page.locator('#videos-dialog [data-wb-close]').click();
  // Use the same snapshot for the full offscreen video simulation and compare its probe.
  const render=await browser.newPage();await render.goto(origin+'/factory-render.html');await render.waitForFunction(()=>window.factoryRenderer);
  const recipe=sourceRecipe(queued.source,queued.source.project.seed);const result=await render.evaluate(async recipe=>{const r=window.factoryRenderer,analysis=r.probe(recipe);await r.begin({recipe,analysis,speed:1,intro:0,width:360,height:640,fps:30,template:'minimal',copy:{hook:''},channel:''});for(let t=0;t<=analysis.simulationSeconds+.1;t+=.25)r.frame(Math.ceil(t*30));r.frame(Math.ceil((analysis.simulationSeconds+1)*30));return {analysis,result:r.result(),effects:r.audio().effects.length,sounds:[...new Set(r.audio().effects.map(e=>e.duelSound))]};},recipe);
  assert.equal(result.result.complete,true);assert.equal(result.result.winner,result.analysis.winner);assert.ok(result.effects>0);
  for(const sound of ['wall','bounce','hit','pickup','blaster'])assert.ok(result.sounds.includes(sound),'video contains '+sound);
  const laser=await render.evaluate(async()=>{
    const {BallDuel}=await import('/src/ball-duel.js'),{renderDuel}=await import('/src/ball-duel-renderer.js');
    const game=new BallDuel(),shooter=game.balls[0];
    Object.assign(shooter,{x:300,y:514,vx:205,vy:0,weapon:'laser',weaponUntil:6,laserAim:0});
    Object.assign(game.balls[1],{x:300,y:350});game.fire(shooter,game.balls[1]);
    const canvas=document.createElement('canvas');canvas.width=600;canvas.height=1067;
    const c=canvas.getContext('2d');renderDuel(c,game,{english:true});
    return {hp:shooter.hp,points:game.beams[0].points.length,pixel:[...c.getImageData(450,567,1,1).data],widePixel:[...c.getImageData(450,574,1,1).data]};
  });
  assert.equal(laser.hp,12);assert.equal(laser.points,3);assert.ok(laser.pixel[1]>180&&laser.pixel[2]>180,'reflected laser is visible on the shared video/preview canvas');
  assert.ok(laser.widePixel[1]>180&&laser.widePixel[2]>180,'the beam has a visibly wider body');
  await render.close();
  await page.click('#replay');await page.waitForTimeout(2700);
  const audio=await page.evaluate(()=>window.duelAudioProbe);assert.ok(audio.count>0&&audio.peak>.15&&audio.running,'live effects must reach a running audio context');
  await page.click('#sound');const mutedCount=await page.evaluate(()=>window.duelAudioProbe.count);await page.waitForTimeout(600);
  assert.equal(await page.evaluate(()=>window.duelAudioProbe.count),mutedCount);
  await page.click('#sound');await page.click('#replay');await page.waitForFunction(count=>window.duelAudioProbe.count>count,mutedCount);
  await page.screenshot({path:'artifacts/duel-desktop.jpg',type:'jpeg',quality:72});
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.locator('.duel-preview').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/duel-mobile.jpg',type:'jpeg',quality:65});
  assert.deepEqual(errors,[]);console.log('PASS: catalog selection, image persistence, controls, video queue snapshot, matching rendered winner, audio and mobile layout.');
  console.log('Screenshot bytes:',(await stat('artifacts/duel-desktop.jpg')).size,(await stat('artifacts/duel-mobile.jpg')).size);
}finally{await browser.close();}
