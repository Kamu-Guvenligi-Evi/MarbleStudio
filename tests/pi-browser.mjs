import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto((process.env.TEST_ORIGIN??'http://127.0.0.1:5173'));await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#automatic-pi').click();
  const state=()=>page.evaluate(()=>window.marbleStudio.getPiState());
  assert.equal(await page.locator('#pi-view').isVisible(),true);
  assert.equal(await page.locator('#watch-view').isVisible(),false);
  await page.locator('#pi-digits').selectOption('1');
  for(let i=0;i<3;i++)await page.locator('#pi-step').click();
  assert.equal((await state()).state,'finished');assert.equal((await state()).collisions,3);
  await page.locator('#pi-reset').click();assert.equal((await state()).collisions,0);
  await page.locator('#pi-play').click();await page.waitForFunction(()=>window.marbleStudio.getPiState().time>.1);
  await page.locator('#pi-play').click();const time=(await state()).time;
  await page.waitForTimeout(120);assert.equal((await state()).time,time);
  await page.locator('#pi-play').click();await page.locator('#nav-track').click();assert.equal((await state()).playing,false);
  await page.locator('#nav-pi').click();await page.locator('#pi-digits').selectOption('2');
  await page.locator('#pi-speed').selectOption('2');await page.locator('#pi-sound').uncheck();
  await page.locator('#studio-works').click();await page.locator('#work-name').fill('Pi test');
  await page.locator('#work-save-form button').click();await page.waitForFunction(()=>document.querySelector('#works-list [data-action="open"]'));
  await page.locator('#works-dialog [data-wb-close]').click();
  await page.locator('#pi-digits').selectOption('4');await page.locator('#studio-works').click();
  await page.locator('#works-list [data-action="open"]').first().click();
  assert.equal((await state()).digits,2);assert.equal((await state()).speed,2);
  await page.locator('#pi-export').click();await page.waitForFunction(()=>document.querySelector('#video-source-name').textContent==='Pi test');
  assert.equal(await page.locator('#video-form [name=strategy] [value=variations]').evaluate(el=>el.disabled),true);
  assert.equal(await page.locator('#video-form [name=audio]').inputValue(),'none');
  await page.locator('#video-dialog [data-wb-close]').click();
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);await page.locator('#automatic-pi').click();
  assert.equal((await state()).digits,2);assert.equal((await state()).sound,false);
  await page.locator('#pi-digits').selectOption('3');await page.locator('#pi-reset').click();
  await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/pi-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No mobile horizontal overflow');
  assert.equal(await page.locator('#pi-play').isVisible(),true);
  assert.deepEqual(errors,[]);
  const render=await browser.newPage();await render.goto((process.env.TEST_ORIGIN??'http://127.0.0.1:5173')+'/factory-render.html');await render.waitForFunction(()=>window.factoryRenderer);
  for(const digits of [1,2,3,4]){
    const result=await render.evaluate(async digits=>{
      const recipe={mode:'pi',digits,speed:.5,exact:true};const analysis=window.factoryRenderer.probe(recipe);
      await window.factoryRenderer.begin({recipe,analysis,fps:30,width:360,height:640,speed:1,intro:0,copy:{language:'en'},template:'minimal'});
      window.factoryRenderer.frame(Math.ceil((analysis.simulationSeconds+1)*30));
      return {...window.factoryRenderer.result(),effects:window.factoryRenderer.audio().effects.length};
    },digits);
    assert.equal(result.collisions,[3,31,314,3141][digits-1]);assert.ok(result.complete&&result.effects>0);
  }
  console.log('Pi browser: navigation, pause, step, presets, saved works, persistence, export dialog, mobile layout and rendered results passed.');
}finally{await browser.close();}
