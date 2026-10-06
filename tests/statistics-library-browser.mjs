import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#nav-statistics').click();await page.waitForFunction(()=>document.querySelectorAll('[data-dataset]').length===11);
  const state=()=>page.evaluate(()=>window.marbleStudio.getStatisticsState());
  const select=async id=>{await page.locator(`[data-dataset="${id}"]`).click();await page.waitForFunction(id=>window.marbleStudio.getStatisticsState().datasetId===id,id);};
  for(const id of ['super-lig','f1-wins','space-race','electric-cars','tourism-shock']){
    await select(id);assert.equal((await state()).interpolation,'step');
    const first=(await state()).ranking;
    await page.locator('#statistics-seek').fill('1');
    assert.notDeepEqual((await state()).ranking,first);
    assert.ok((await state()).axisMax>0);
  }
  assert.match(await page.locator('[data-dataset="f1-wins"]').innerText(),/pilot/);
  await select('european-cup');assert.equal((await state()).year,1956);
  assert.equal((await state()).interpolation,'step');await page.locator('#statistics-seek').fill('1');
  assert.equal((await state()).ranking[0].value,15);
  await page.locator('#statistics-provenance summary').click();assert.match(await page.locator('#statistics-dataset-note').innerText(),/1955\/56/);
  assert.ok(await page.locator('#statistics-dataset-sources a').count()>0);
  await page.locator('#statistics-category').selectOption('Nüfus');assert.equal(await page.locator('[data-dataset]').count(),1);
  await select('population');assert.equal((await state()).names.length,30);assert.match(await page.locator('#statistics-unit').inputValue(),/milyon/);
  assert.equal((await state()).interpolation,'linear');
  await page.locator('#statistics-category').selectOption('');await select('gdp');
  assert.match(await page.locator('#statistics-unit').inputValue(),/milyar/);
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);await page.locator('#nav-statistics').click();
  assert.equal((await state()).datasetId,'gdp');assert.match(await page.locator('#statistics-source').inputValue(),/Dünya Bankası/);
  assert.equal(await page.locator('[data-dataset="historical-lifespans"]').count(),0);
  assert.equal(await page.locator('#statistics-category option[value="Tarih"]').count(),0);
  await page.locator('#statistics-csv').fill('Yıl,A,B\n2000,,2');await page.locator('#statistics-apply').click();assert.equal((await state()).datasetId,'gdp');
  await page.locator('#statistics-csv').fill('Yıl,A,B\n2000,1,2\n2001,3,4');await page.locator('#statistics-apply').click();assert.equal((await state()).datasetId,null);
  assert.equal(await page.locator('#statistics-provenance').isHidden(),true);
  assert.equal(await page.locator('#statistics-source').inputValue(),'','Custom data must not keep the previous dataset source credit');
  await page.locator('#statistics-category').selectOption('');await select('european-cup');
  await page.locator('#statistics-webm-options').evaluate(el=>el.open=true);await page.locator('#statistics-record').click();assert.equal(await page.locator('[data-dataset="gdp"]').isDisabled(),true);
  await page.waitForFunction(()=>window.marbleStudio.getStatisticsState().progress>.06);
  const download=page.waitForEvent('download').catch(async error=>{throw new Error(`${error.message}; ${await page.locator('#toast').innerText()}; ${JSON.stringify(await state())}`);});
  await page.locator('#statistics-webm-options').evaluate(el=>el.open=true);await page.locator('#statistics-record').click();await download;
  assert.equal(await page.locator('[data-dataset="gdp"]').isDisabled(),false);
  await page.locator('#statistics-category').selectOption('');
  await page.screenshot({path:'artifacts/statistics-library-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'artifacts/statistics-library-mobile.png',fullPage:true});
  // Switching to a second dataset wins even if the first response arrives late.
  await page.setViewportSize({width:1440,height:1100});
  let release;const held=new Promise(resolve=>release=resolve);
  await page.route('**/statistics/gdp.csv',async route=>{await held;await route.continue();});
  await page.locator('[data-dataset="gdp"]').click();await select('internet');release();
  await page.waitForTimeout(200);assert.equal((await state()).datasetId,'internet');
  await page.evaluate(()=>{
    const key='marble-studio-statistics-v1',saved=JSON.parse(localStorage.getItem(key));
    saved.dataset.id='historical-lifespans';localStorage.setItem(key,JSON.stringify(saved));
  });
  await page.reload();await page.waitForFunction(()=>window.marbleStudio?.getStatisticsState().datasetId==='super-lig');
  assert.deepEqual(errors,[]);
  console.log('PASS: curated categories, selection, units, sources, persistence, retired draft migration, custom data, recording, mobile and stale-load protection.');
}finally{await browser.close();}
