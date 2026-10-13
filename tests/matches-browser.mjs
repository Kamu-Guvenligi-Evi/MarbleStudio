const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5173';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {matchDay} from '../src/match-data.js';

const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  let fail=false,empty=false,slow=false;
  await page.route('https://a.espncdn.com/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="#387faf"/></svg>'}));
  await page.route('**/api/matches?**',async route=>{
    const query=new URL(route.request().url()).searchParams,league=query.get('league'),date=query.get('date');requests.push({league,date});
    if(slow&&league==='nba')await new Promise(resolve=>setTimeout(resolve,300));
    if(fail)return route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'Maç verisi şu an alınamıyor.'})});
    const soccer=league.includes('.');
    const fixture=(id,state,label,score)=>({id,league,startsAt:date+'T00:15:00Z',state,label:soccer&&state==='live'?"67'":label,
      home:{name:soccer?'Galatasaray':league==='nba'?'Boston Celtics':'Kansas City Chiefs',score:score===null?null:soccer?'2':score,abbreviation:soccer?'GS':'KC',logo:'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png'},
      away:{name:soccer?'Fenerbahçe':league==='nba'?'Chicago Bulls':'Buffalo Bills',score:score===null?null:soccer?'1':'17',abbreviation:soccer?'FB':'BUF',logo:null},venue:'Test Stadium',sourceUrl:'javascript:alert(1)'});
    return route.fulfill({contentType:'application/json',body:JSON.stringify({league,date,updatedAt:date+'T12:00:00Z',source:'ESPN',stale:false,events:empty?[]:[fixture('live','live','2. çeyrek · 04:32','21'),fixture('next','scheduled','Başlamadı',null),fixture('final','final','Maç bitti','28'),fixture('postponed','postponed','Ertelendi',null)]})});
  });
  await page.goto((origin+'?edit=1'));await page.waitForFunction(()=>window.marbleStudio);
  const before=await page.evaluate(()=>localStorage.getItem('marble-studio-track-v1'));
  await page.waitForFunction(()=>!document.querySelector('#match-banner-refresh').disabled);
  assert.ok(requests.some(r=>r.league==='nfl')&&requests.some(r=>r.league==='tur.1'),'Opening Studio automatically loads the football and NFL banner');
  await page.locator('#studio-matches').click();await page.waitForFunction(()=>document.querySelectorAll('.match-card').length===4);
  assert.equal(await page.locator('#matches-league').inputValue(),'tur.1');
  assert.equal(await page.locator('[data-match-sport="soccer"]').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('.match-card[data-state=live]').innerText(),/67'/);
  assert.match(await page.locator('.match-team').first().innerText(),/Galatasaray/);
  assert.equal(await page.locator('#matches-date').inputValue(),matchDay());
  assert.equal(await page.locator('.match-card time').first().innerText(),'03:15');
  assert.equal(await page.locator('.match-card[data-state=scheduled] strong').first().innerText(),'–');
  assert.equal(await page.locator('.match-card a').count(),0,'Unsafe upstream links must never be rendered');
  await page.locator('#matches-filter').selectOption('live');assert.equal(await page.locator('.match-card').count(),1);
  await page.locator('#matches-filter').selectOption('all');
  await page.locator('#matches-league').selectOption('eng.1');await page.waitForFunction(()=>!document.querySelector('#matches-refresh').disabled);
  await page.locator('[data-match-sport="nba"]').click();await page.waitForFunction(()=>document.querySelector('.match-team')?.textContent.includes('Boston Celtics'));
  await page.locator('[data-match-sport="soccer"]').click();await page.waitForFunction(()=>document.querySelector('.match-team')?.textContent.includes('Galatasaray'));
  assert.equal(await page.locator('#matches-league').inputValue(),'eng.1','Returning to football retains the selected league');
  await page.locator('[data-match-sport="nba"]').click();await page.waitForFunction(()=>document.querySelector('.match-team')?.textContent.includes('Boston Celtics'));
  await page.locator('#matches-date').fill('2026-10-13');await page.locator('#matches-date').dispatchEvent('change');
  await page.waitForFunction(()=>document.querySelector('#matches-status').textContent.includes('4 maç'));
  await page.locator('#matches-next').click();await page.waitForFunction(()=>!document.querySelector('#matches-refresh').disabled);
  assert.equal(await page.locator('#matches-date').inputValue(),'2026-10-14');
  await page.locator('#matches-prev').click();await page.waitForFunction(()=>!document.querySelector('#matches-refresh').disabled);
  assert.equal(await page.locator('#matches-date').inputValue(),'2026-10-13');
  fail=true;await page.locator('#matches-refresh').click();await page.waitForFunction(()=>document.querySelector('#matches-status').textContent.includes('Son alınan'));
  assert.equal(await page.locator('.match-card').count(),4,'A network failure must retain the last received scores with a warning');
  fail=false;empty=true;await page.locator('#matches-next').click();await page.waitForFunction(()=>document.querySelector('.matches-empty'));
  assert.match(await page.locator('.matches-empty').innerText(),/Bu tarihte maç/);
  empty=false;slow=true;await page.locator('#matches-league').selectOption('nfl');await page.locator('#matches-league').selectOption('nba');await page.locator('#matches-league').selectOption('nfl');
  await page.waitForFunction(()=>document.querySelector('.match-team')?.textContent.includes('Kansas City'));
  await page.waitForTimeout(400);assert.match(await page.locator('.match-team').first().innerText(),/Kansas City/);
  await page.screenshot({path:'artifacts/matches-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.querySelector('#matches-dialog').scrollWidth<=innerWidth));
  await page.screenshot({path:'artifacts/matches-mobile.png'});
  await page.locator('#matches-close').click();assert.equal(await page.locator('#matches-dialog').isVisible(),false);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await page.evaluate(()=>localStorage.getItem('marble-studio-track-v1')),before);
  assert.deepEqual(errors,[]);
  console.log('PASS: automatic banner loading, Istanbul times, score/status filters, date/league navigation, stale/error/empty states, racing requests, mobile layout and preserved Studio draft.');
}finally{await browser.close();}
