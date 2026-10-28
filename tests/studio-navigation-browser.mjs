import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const browser = await chromium.launch({channel:'chrome',headless:true});
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
await mkdir('artifacts',{recursive:true});
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  // Local interface checks should not download remote image/music libraries.
  await page.route('**/*',route=>{const url=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(url.hostname)||!url.protocol.startsWith('http')?route.continue():route.abort();});
  const standaloneGames=['ring-escape','ball-duel','glass-breaker','spiral-breaker','rock-paper-scissors','goal-arena','ball-multiplier','bounce-waves'];
  for(const path of ['/?edit=1',...standaloneGames.map(id=>`/${id}.html`)]) {
    await page.setViewportSize({width:1440,height:900});
    await page.goto(origin+path);
    await page.waitForFunction(()=>!!document.querySelector('.studio-navigation .studio-game-list [aria-current="page"]'));
    assert.equal(await page.locator('.studio-game-list [data-studio-game]').count(),15);
    assert.equal(await page.locator('.studio-navigation a[href="/crown-battle.html"]').count(),1);
    assert.equal(await page.locator('.studio-navigation a[href*="historical-armies"]').count(),0);
    assert.equal(await page.locator('.studio-game-list [data-studio-game="rock-paper-scissors"]').count(),1);
    assert.equal(await page.locator('.studio-game-list [aria-current=page]').count(),1,path+' active game');
    assert.equal(await page.locator('.studio-toolbar #studio-export,.studio-toolbar #export').count(),1,path+' single export');
    assert.equal(await page.locator('#studio-channel').count(),1,path+' single channel picker');
    const groups=page.locator('.studio-setting-group');
    if (/edit=1|ring-escape|ball-duel|glass-breaker|spiral-breaker/.test(path)) assert.ok(await groups.count()>=2);
    for(let i=0;i<await groups.count();i++){
      const group=groups.nth(i);if(!(await group.getAttribute('open')!==null))await group.locator(':scope > summary').click();
      assert.equal(await group.locator('.studio-setting-content').isVisible(),true);
    }
    for(const [width,height] of [[1440,900],[1100,800],[768,1024],[390,844]]){
      await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,path+' '+width+' overflow');
      if(width<=1050){
        const toggle=page.locator('.studio-menu-toggle');
        if(await toggle.getAttribute('aria-expanded')==='false')await toggle.click();
        assert.equal(await page.locator('.studio-game-list [data-studio-game]').first().isVisible(),true,path+' '+width+' menu opens');
        await toggle.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');
      }
    }
    await page.setViewportSize({width:1440,height:900});
    for(let i=0;i<await groups.count();i++)await groups.nth(i).evaluate((el,i)=>el.open=i===0,i);
    await page.evaluate(()=>scrollTo(0,0));
    if(path==='/?edit=1'||path==='/ring-escape.html')await page.screenshot({path:'artifacts/menu-'+(path==='/?edit=1'?'main':'ring')+'.jpg',quality:65});
    console.log('PASS: '+path+' navigation, controls, desktop/tablet/mobile');
  }
  await page.setViewportSize({width:1440,height:900});
  for (const game of standaloneGames) {
    await page.locator(`[data-studio-game="${game}"]`).click();
    await page.waitForURL(`**/${game}.html`);
    await page.waitForFunction(game=>document.querySelector(`[data-studio-game="${game}"]`)?.getAttribute('aria-current')==='page',game);
  }
  await page.locator('[data-studio-game="territory"]').click();
  await page.waitForFunction(()=>document.querySelector('#nav-territory')?.getAttribute('aria-current')==='page');
  console.log('PASS: every standalone menu link and return to the main studio');
  await page.goto(origin+'/index.html?mode=territory');await page.waitForFunction(()=>window.marbleStudio?.getState().mode==='arena');
  assert.equal(await page.locator('#nav-territory').getAttribute('aria-current'),'page');
  for(const mode of ['track','arena','spiral','pi','statistics']){
    await page.locator('#nav-'+mode).click();
    await page.waitForFunction(mode=>window.marbleStudio.getState().workspace===mode,mode);
    assert.equal(await page.locator('#nav-'+mode).getAttribute('aria-current'),'page');
    console.log('PASS: main mode '+mode);
  }
  await page.locator('#nav-track').click();
  await page.locator('.studio-setting-group > summary').filter({hasText:'Ses ve müzik'}).click();
  await page.locator('#sound').check();assert.equal(await page.locator('#sound').isChecked(),true);
  await page.locator('#count').selectOption('8');assert.equal(await page.evaluate(()=>window.marbleStudio.getState().count),8);
  await page.locator('#pause').click();
  await page.waitForFunction(()=>!document.querySelector('#nav-track').disabled);
  await page.waitForFunction(()=>window.marbleStudio.getState().countdown>0||window.marbleStudio.getState().state==='running');
  await page.locator('#pause').click();
  assert.equal(await page.evaluate(()=>window.marbleStudio.getState().paused),true);
  assert.equal(await page.locator('#nav-track').isEnabled(),true);
  await page.locator('#nav-pi').click();assert.equal(await page.locator('#pi-view').isVisible(),true);
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>document.querySelector('.studio-menu-toggle').getAttribute('aria-expanded')==='false');
  await page.locator('.studio-menu-toggle').click();
  await page.locator('#nav-track').click();assert.equal(await page.locator('.studio-menu-toggle').getAttribute('aria-expanded'),'false');
  await page.screenshot({path:'artifacts/menu-mobile.jpg',quality:65});
  await page.goto(origin+'/ring-escape.html');await page.waitForFunction(()=>window.ringStudio);
  await page.locator('.studio-setting-group>summary').filter({hasText:'Görünüm'}).click();
  await page.locator('[data-theme="aurora"]').click();assert.equal(await page.locator('[data-theme="aurora"]').getAttribute('aria-pressed'),'true');
  await page.goto(origin+'/glass-breaker.html?video-render=1');
  await page.waitForFunction(()=>window.breakerVideo);assert.equal(await page.locator('.studio-navigation').count(),0);
  await page.goto(origin+'/crown-battle.html');
  await page.locator('#play').waitFor();
  assert.equal(await page.locator('.studio-navigation').count(),0);
  await page.locator('a[href="/historical-armies.html"]').first().click();
  await page.locator('#launch-battle').waitFor();
  assert.equal(await page.locator('.studio-navigation').count(),0);
  await page.locator('header a[href="/crown-battle.html"]').click();
  await page.locator('#play').waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS: all main modes, controls, mobile selection, video render isolation, separate army pages; no JS errors');
} finally {await browser.close();}
