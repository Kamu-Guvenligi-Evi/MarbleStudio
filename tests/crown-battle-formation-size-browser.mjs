import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  for(const width of [1366,390]) {
    const page=await browser.newPage({viewport:{width,height:844},isMobile:width<900,hasTouch:width<900});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:5173/crown-battle.html');
    await page.locator('#menu-setup').click();
    await page.locator('#north-samurai').fill('16');
    await page.locator('#red-janissary').fill('9');
    await page.locator('#apply').click();
    const attach=async()=>{
      await page.evaluate(async()=>{
        const source=await(await fetch('/src/crown-battle-app.js')).text();
        const url=source.match(/from ['"]([^'"]*crown-battle-renderer\.js[^'"]*)['"]/)[1];
        const {BattleRenderer}=await import(url), render=BattleRenderer.prototype.renderIfNeeded;
        BattleRenderer.prototype.renderIfNeeded=function(...args){window.sizeRenderer=this;return render.apply(this,args);};
      });
      await page.waitForFunction(()=>window.sizeRenderer);
    };
    await attach();
    const positions=()=>page.evaluate(()=>window.sizeRenderer.battle.units.map(u=>[u.id,u.x,u.y]));
    const span=()=>page.evaluate(()=>{const u=window.sizeRenderer.battle.units.filter(u=>u.team===0);return Math.max(...u.map(u=>u.y))-Math.min(...u.map(u=>u.y));});
    const setSize=async value=>page.locator('#formation-size').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
    await page.locator('#select-blue-army').click();
    for(const kind of ['circle','line']) {
      await page.locator('#formation-kind').selectOption(kind);
      assert.equal(await page.locator('#formation-size-label').textContent(),kind==='circle'?'Çember çapı':'Hat genişliği');
      await setSize(100);await page.locator('#apply-formation-size').click();
      const normal=await span(),before=await positions();
      await setSize(180);await page.locator('#apply-formation-size').click();
      assert.ok(Math.abs(await span()/normal-1.8)<1e-8,`${width}/${kind}: enlarged`);
      const grown=await positions();
      assert.deepEqual(grown.slice(16),before.slice(16),'Other army unchanged');
      await page.locator('#undo-placement').click();assert.deepEqual(await positions(),before,'Exact undo');
      await setSize(75);await page.locator('#apply-formation-size').click();
      assert.ok(await span()<normal,'Shrink closes spacing safely');
    }
    await setSize(150);await page.locator('#formation-size-more').click();
    assert.equal(await page.locator('#formation-size').inputValue(),'155');
    await page.locator('#formation-size-less').click();
    assert.equal(await page.locator('#formation-size-value').textContent(),'%150');
    await page.locator('#apply-formation-size').click();
    const saved=await positions();
    await page.reload();await attach();
    assert.equal(await page.locator('#formation-size').inputValue(),'150','Size preference persisted');
    assert.deepEqual(await positions(),saved,'Actual resized deployment persisted');
    await page.locator('#select-blue-army').click();
    assert.ok(await page.locator('.formation-size').evaluate(el=>{const r=el.getBoundingClientRect();return r.width<=innerWidth && el.scrollWidth<=r.width+1;}),'Compact controls fit mobile');
    await page.locator('#place-formation').click();
    await page.locator('#battle').evaluate(el=>{const r=el.getBoundingClientRect();el.dispatchEvent(new PointerEvent('pointermove',{clientX:r.x+r.width/2,clientY:r.y+r.height/2,bubbles:true}));});
    const previewSpan=()=>page.evaluate(()=>{const p=window.sizeRenderer.formationPreview;return Math.max(...p.slots.map(s=>s.y))-Math.min(...p.slots.map(s=>s.y));});
    const previewBefore=await previewSpan();await setSize(200);
    assert.ok(Math.abs(await previewSpan()/previewBefore-2/1.5)<1e-8,'Placement preview updates with size');
    assert.deepEqual(await positions(),saved,'Preview does not change deployment');
    await page.keyboard.press('Escape');
    await page.locator('#play').click();await page.waitForFunction(()=>window.sizeRenderer.battle.time>0);
    await page.locator('#play').click();
    const stopped=await positions();await setSize(200);await page.locator('#apply-formation-size').click();
    assert.deepEqual(await positions(),stopped,'Battle resize issues movement without teleporting');
    assert.ok(await page.evaluate(()=>window.sizeRenderer.battle.units.filter(u=>u.team===0).every(u=>u.order?.kind==='move')));
    assert.deepEqual(errors,[]);
    console.log(`PASS ${width}px formation sizing: circle/line resize, undo, opponent, +/- controls, reload, mobile fit, combat movement`);
    await page.close();
  }
} finally {await browser.close();}
