import { chromium } from 'playwright';
import { mkdirSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
const dir='artifacts/battle-visual-study';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.routeWebSocket('**/*',s=>s.close());
  await page.addInitScript(()=>localStorage.setItem('marble-historical-armies-v1','[{"samurai":17},{"janissary":9}]'));
  await page.route(/\/src\/crown-battle-visual-lab\.js(?:\?.*)?$/,async route=>{
    const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.studyProbe={get battle(){return battle},get renderer(){return renderer},get running(){return running}};'});
  });
  await page.goto('http://127.0.0.1:5173/crown-battle-visual-lab.html');
  await page.waitForFunction(()=>window.studyProbe);
  assert.equal(await page.evaluate(()=>studyProbe.battle.units.length),12);
  await page.waitForTimeout(400);
  await page.screenshot({path:`${dir}/desktop.jpg`,quality:76,fullPage:true});
  const snapshot=()=>page.evaluate(()=>JSON.stringify(studyProbe.battle.units.map(u=>[u.id,u.x,u.y,u.hp])));
  const initial=await snapshot();
  await page.locator('#original').click();assert.equal(await snapshot(),initial);
  await page.locator('#study').click();assert.equal(await snapshot(),initial);
  await page.locator('#play').click();await page.waitForTimeout(1200);
  await page.locator('#play').click();assert.notEqual(await snapshot(),initial);
  const paused=await snapshot();await page.locator('#original').click();assert.equal(await snapshot(),paused);
  await page.locator('#reset').click();assert.equal(await snapshot(),initial);
  await page.locator('#study').click();
  const fight=await page.evaluate(()=>{
    const b=studyProbe.battle;for(let i=0;i<2400&&b.winner===null;i++)b.step(1/60);
    studyProbe.renderer.render();
    return {time:b.time,damaged:b.units.some(u=>u.hp<u.maxHp),finite:b.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y))};
  });assert(fight.damaged&&fight.finite);
  await page.locator('#reset').click();
  for(const width of [1000,390]){
    await page.setViewportSize({width,height:900});await page.waitForTimeout(250);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Layout ${width}`);
  }
  await page.screenshot({path:`${dir}/mobile.jpg`,quality:72,fullPage:true});
  const elite=[];
  for(const [unit,type,count] of [['hussar','hussar',6],['sauron','me_sauron',2]]){
    await page.setViewportSize({width:1440,height:1000});
    await page.locator(`[data-unit="${unit}"]`).click();
    assert.equal(await page.evaluate(()=>studyProbe.battle.units.length),count);
    assert(await page.evaluate(t=>studyProbe.battle.units.every(u=>u.type===t),type));
    assert.equal(await page.evaluate(()=>studyProbe.running),false);
    await page.locator('#pose').selectOption('idle');await page.waitForTimeout(250);
    await page.screenshot({path:`${dir}/${unit}.jpg`,quality:78,fullPage:true});
    const before=await snapshot();
    assert.equal(await page.locator('#study').isVisible(),false);
    assert.equal(await page.locator('#new-detail').isVisible(),false);
    assert.equal(await page.evaluate(()=>studyProbe.renderer.sprites.constructor.name),'SpriteLibrary');
    const result=await page.evaluate(()=>{
      const b=studyProbe.battle;for(let i=0;i<4800&&b.winner===null;i++)b.step(1/60);
      studyProbe.renderer.render();
      return{time:b.time,damaged:b.units.some(u=>u.hp<u.maxHp),finite:b.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)),winner:b.winner};
    });assert(result.damaged&&result.finite);assert.notEqual(result.winner,null);
    await page.locator('#reset').click();assert.equal(await snapshot(),before);
    await page.locator('#play').click();await page.waitForTimeout(350);
    await page.locator('#play').click();assert.notEqual(await snapshot(),before);
    await page.setViewportSize({width:390,height:900});await page.waitForTimeout(200);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${unit} mobile`);
    elite.push({unit,...result});
  }
  await page.locator('[data-unit="samurai"]').click();
  assert.equal(await page.locator('#study').isVisible(),true);
  assert.equal(await page.locator('#new-detail').isVisible(),true);
  assert.equal(await page.evaluate(()=>studyProbe.renderer.sprites.constructor.name),'SamuraiStudyLibrary');
  // Direct links select the requested trial on reload.
  await page.goto('http://127.0.0.1:5173/crown-battle-visual-lab.html#hussar');
  await page.waitForFunction(()=>window.studyProbe?.battle.units.length===6);
  assert.equal(await page.evaluate(()=>studyProbe.battle.units.length),6);
  await page.reload();await page.waitForFunction(()=>window.studyProbe?.battle.units.length===6);
  assert.equal(await page.evaluate(()=>localStorage.getItem('marble-historical-armies-v1')),'[{"samurai":17},{"janissary":9}]');
  await page.goto('http://127.0.0.1:5173/crown-battle-visual-lab.html#charge');
  await page.waitForFunction(()=>window.studyProbe?.battle.units.length===12);
  assert.equal(await page.locator('[data-unit="charge"]').getAttribute('aria-pressed'),'true');
  await page.setViewportSize({width:1440,height:1000});
  const chargeStart=await snapshot();
  const charge=await page.evaluate(()=>{
    const b=studyProbe.battle,r=studyProbe.renderer;
    let ready=false,lowered=false,stagger=false;
    for(let i=0;i<600;i++) {
      b.step(1/60);r.render();
      ready ||= b.units.some(u=>u.charge&&u.charge.age<.22);
      lowered ||= b.units.some(u=>u.charge&&u.charge.age>=.22);
      if(b.units.some(u=>u.stagger>0)){stagger=true;break;}
    }
    return {ready,lowered,stagger,charges:b.stats.charges,hits:b.stats.chargeHits};
  });
  assert(charge.ready&&charge.lowered&&charge.stagger);
  await page.locator('#study-battle').screenshot({path:`${dir}/charge-impact.jpg`,quality:78});
  await page.locator('#reset').click();assert.equal(await snapshot(),chargeStart);
  await page.locator('#slow').click();assert.equal(await page.locator('#slow').getAttribute('aria-pressed'),'true');
  await page.locator('#play').click();await page.waitForTimeout(400);
  await page.locator('#play').click();assert.notEqual(await snapshot(),chargeStart);
  await page.setViewportSize({width:390,height:900});await page.waitForTimeout(200);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Charge mobile');
  assert.equal(await page.evaluate(()=>localStorage.getItem('marble-historical-armies-v1')),'[{"samurai":17},{"janissary":9}]');
  console.log(JSON.stringify({charge,chargeImageBytes:statSync(`${dir}/charge-impact.jpg`).size}));
  await page.goto('http://127.0.0.1:5173/crown-battle.html');
  await page.waitForFunction(()=>document.getElementById('stage-view-label')?.textContent.includes('CANLI'));
  await page.setViewportSize({width:1440,height:1000});
  await page.waitForFunction(()=>document.getElementById('stage-view-label')?.textContent.includes('GENİŞ'));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:'PASS',checks:'3 studies; A/B preserves state; play/pause/reset; combat completed; mobile layout; saved armies untouched; original Hussar/Sauron; approved Samurai restored; direct link',fight,elite,images:['desktop','mobile','hussar','sauron'].map(name=>({name,bytes:statSync(`${dir}/${name}.jpg`).size}))}));
}finally{await browser.close();}
