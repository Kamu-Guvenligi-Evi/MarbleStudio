import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser = await chromium.launch({channel:'chrome',headless:true});
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const errors=[];
try {
 const page=await browser.newPage();
 page.setDefaultTimeout(20000);
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>{const u=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)||!u.protocol.startsWith('http')?route.continue():route.abort();});
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:900});
  await page.goto(origin+'/index.html?edit=1');
  const link=page.locator('[data-studio-game="crown-battle"]');
  await link.waitFor({state:'attached'});
  if(width===390) await page.locator('.studio-menu-toggle').click();
  assert.equal(await link.textContent(),'♛Taç Savaşı');
  await link.click();
  await page.waitForURL('**/crown-battle.html');
  await page.waitForFunction(()=>document.querySelector('#battle')?.width>0 && document.querySelector('#roster-search'));
  assert.equal(await page.locator('#play').isVisible(),true);

  await page.locator('a[href="/historical-armies.html"]').first().click();
  await page.locator('#launch-battle').waitFor();
  await page.locator('header a[href="/crown-battle.html"]').click();
  await page.locator('#play').waitFor();
  await page.locator('header .back-link').click();
  await page.locator('.studio-navigation').waitFor();
  console.log('PASS '+width+'px: studio menu -> Crown Battle -> army workshop -> game -> studio');
 }
 await page.goto(origin+'/ball-duel.html');
 assert.equal(await page.locator('[data-studio-game="crown-battle"]').getAttribute('href'),'/crown-battle.html');
 assert.deepEqual(errors,[]);
 console.log('PASS shared game menu; no JavaScript errors');
} finally {await browser.close();}
