import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5174';
const browser=await chromium.launch({channel:'chrome',headless:true});
await mkdir('artifacts',{recursive:true});
try{
  const page=await browser.newPage(),errors=[],aiRequests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(request.url().includes('/api/sound-director/'))aiRequests.push(request.url());});
  for(const [mode,api,stage] of [['ring-escape','ringStudio','.stage'],['ball-duel','duelStudio','.duel-stage'],['glass-breaker','glassBreaker','.game-shell'],['spiral-breaker','spiralBreaker','.game-shell']]){
    for(const [width,height] of [[1366,768],[768,1024],[390,844]]){
      await page.setViewportSize({width,height});
      await page.goto(`${origin}/${mode}.html`);
      await page.waitForFunction(api=>!!window[api],api);
      await page.locator('.studio-setting-group > summary').filter({hasText:'Ses ve müzik'}).click();
      await page.locator('.manual-sounds summary').click();
      const measure=await page.evaluate(stage=>{
        const game=document.querySelector(stage).getBoundingClientRect();
        const menu=document.querySelector('.game-sound-director').getBoundingClientRect();
        return {overflow:document.documentElement.scrollWidth>innerWidth,game:{x:game.x,y:game.y,right:game.right,bottom:game.bottom,height:game.height},menu:{x:menu.x,y:menu.y,right:menu.right},groups:document.querySelectorAll('.sound-event-group').length};
      },stage);
      assert.equal(measure.overflow,false,`${mode} ${width}: horizontal overflow`);
      assert.ok(measure.game.x>=0&&measure.game.right<=width,`${mode} ${width}: stage fits screen`);
      assert.ok(measure.game.height<=height,`${mode} ${width}: stage fits viewport height`);
      assert.ok(measure.groups>=2,`${mode}: sound events grouped`);
      if(width<=800)assert.ok(measure.game.bottom<=measure.menu.y,`${mode}: preview before settings on mobile`);
      else{
        assert.ok(measure.menu.right<=measure.game.x,`${mode}: settings beside preview`);
        await page.locator('.game-sound-director').scrollIntoViewIfNeeded();
        const box=await page.locator(stage).boundingBox();
        assert.ok(box.y>=0&&box.y+box.height<=height,`${mode}: stage stays visible while editing sound`);
      }
      if(mode==='ring-escape'&&width===1366)await page.screenshot({path:'artifacts/sound-menu-desktop.png'});
      if(mode==='ball-duel'&&width===390){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'artifacts/sound-menu-mobile.png'});}
      console.log(`PASS: ${mode} ${width}×${height} layout`);
    }
  }
  assert.deepEqual(errors,[]);
  assert.deepEqual(aiRequests,[],'no AI endpoint requests');
}finally{await browser.close();}
