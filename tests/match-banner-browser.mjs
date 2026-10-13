const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5173';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1366,height:1000}}),requests=[],errors=[];
  await page.clock.install({time:new Date('2026-10-13T12:00:00Z')});
  page.on('pageerror',error=>errors.push(error.message));
  let fail=false,partial=false,empty=false;
  await page.route('**/api/matches?**',route=>{
    const query=new URL(route.request().url()).searchParams,league=query.get('league'),date=query.get('date');requests.push({league,date});
    if(fail||partial&&league==='tur.1')return route.fulfill({status:502,contentType:'application/json',body:'{"error":"offline"}'});
    return route.fulfill({contentType:'application/json',body:JSON.stringify({league,date,updatedAt:'2026-10-13T12:00:00Z',stale:false,events:empty?[]:[{
      id:league,league,startsAt:date+'T17:00:00Z',state:league==='nfl'?'scheduled':'live',label:league==='nfl'?'Başlamadı':"67'",
      home:{name:league==='nfl'?'Kansas City Chiefs':'Galatasaray',abbreviation:'GS',score:league==='nfl'?null:'2'},
      away:{name:league==='nfl'?'Buffalo Bills':'Fenerbahçe',abbreviation:'FB',score:league==='nfl'?null:'1'},
    }]})});
  });
  await page.goto((origin+''));await page.waitForFunction(()=>window.marbleStudio&&!document.querySelector('#match-banner-refresh').disabled);
  assert.equal(requests.length,10);assert.equal(new Set(requests.map(r=>r.league)).size,10);
  assert.equal(await page.locator('[data-banner-sport="soccer"] .banner-match').count(),9);
  assert.equal(await page.locator('[data-banner-sport="nfl"] .banner-match').count(),1);
  assert.equal(await page.locator('#matches-dialog').isVisible(),false,'Banner must work without opening a dialog');
  assert.ok(await page.evaluate(()=>document.querySelector('#match-banner').getBoundingClientRect().top<250));
  await page.locator('[data-banner-sport="nfl"] .banner-match').click();
  assert.equal(await page.locator('#matches-league').inputValue(),'nfl');assert.equal(await page.locator('#matches-date').inputValue(),'2026-10-13');
  await page.locator('#matches-close').click();
  const count=requests.length;await page.clock.fastForward(61000);await page.waitForFunction(()=>!document.querySelector('#match-banner-refresh').disabled);
  assert.equal(requests.length,count+10,'Visible banner must refresh every minute');
  await page.locator('#automatic-back').click();assert.ok(await page.locator('#match-banner').isVisible());
  await page.screenshot({path:'artifacts/match-banner-automatic.png'});
  await page.locator('#automatic-manual').click();
  await page.setViewportSize({width:390,height:844});assert.ok(await page.locator('#match-banner').isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'artifacts/match-banner-mobile.png'});
  partial=true;await page.locator('#match-banner-refresh').click();await page.waitForFunction(()=>!document.querySelector('#match-banner-refresh').disabled);
  assert.equal(await page.locator('[data-banner-sport="soccer"] .banner-match').count(),9,'Keep previous scores when one league fails');
  assert.match(await page.locator('[data-banner-sport="soccer"] .match-banner-summary').innerText(),/Güncellenemedi/);
  fail=true;await page.locator('#match-banner-next').click();await page.waitForFunction(()=>!document.querySelector('#match-banner-refresh').disabled);
  assert.equal(await page.locator('.banner-match').count(),0,'Old-date fixtures must not appear under the new date');
  assert.match(await page.locator('[data-banner-sport="nfl"] .match-banner-empty').innerText(),/alınamadı/);
  fail=false;partial=false;empty=true;await page.locator('#match-banner-refresh').click();await page.waitForFunction(()=>!document.querySelector('#match-banner-refresh').disabled);
  assert.match(await page.locator('[data-banner-sport="nfl"] .match-banner-empty').innerText(),/Bu tarihte maç yok/);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  const hiddenCount=requests.length;await page.clock.fastForward(61000);assert.equal(requests.length,hiddenCount,'Hidden tabs must not poll');
  empty=false;await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>!document.querySelector('#match-banner-refresh').disabled);assert.equal(requests.length,hiddenCount+10);
  assert.deepEqual(errors,[]);
  console.log('PASS: football/NFL banner on startup and automatic home, live cards, detail navigation, minute refresh, hidden-tab pause, mobile overflow, partial failures and date isolation.');
}finally{await browser.close();}
