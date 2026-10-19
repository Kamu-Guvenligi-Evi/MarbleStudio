import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
await mkdir('artifacts/crown-siege',{recursive:true});
try{
  for(const size of [{width:1440,height:1000},{width:390,height:844}]){
    const page=await browser.newPage({viewport:size});const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:5173/crown-siege.html');
    await page.waitForFunction(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.renderer.drawCount>0;});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No horizontal overflow');
    assert.equal(await page.evaluate(async()=>{
      const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);
      const {CASTLE,ATTACKERS,DEFENDERS}=await import('/src/crown-siege.js');
      const left=r.renderer.screenToWorld(0,0),right=r.renderer.screenToWorld(1,1);
      return left.x<CASTLE.left && left.y<CASTLE.top && right.y>CASTLE.bottom &&
        r.battle.units.every(u=>u.x>left.x&&u.x<right.x) &&
        r.battle.activeTeam===Number(document.getElementById('side').value) &&
        r.battle.units.filter(u=>u.team===DEFENDERS).every(u=>u.x<r.battle.gate.x) &&
        r.battle.units.filter(u=>u.team===ATTACKERS).every(u=>u.x>r.battle.gate.x);
    }),true,'Camera frames the large western fortress and the eastern attacking army');
    await page.screenshot({path:'artifacts/crown-siege/deployment-'+size.width+'.png',fullPage:false});
    await page.locator('[data-plan="walls"]').click();
    assert.equal(await page.evaluate(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.battle.units.filter(u=>u.duty==='ladder').length;}),28);
    assert.equal(await page.locator('[data-plan="walls"]').getAttribute('aria-pressed'),'true');
    await page.locator('#shields').click();
    assert.equal(await page.evaluate(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.battle.shields;}),false);
    await page.locator('[data-front="north"]').click();
    assert.equal(await page.evaluate(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.renderer.view.zoom;}),.85);
    await page.locator('#restart').click();
    await page.locator('[data-select="melee"]').click();
    await page.waitForFunction(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.battle.selected.size===60;});
    assert.match(await page.locator('#selection').innerText(),/60 asker/);
    await page.locator('#move').click();
    await page.locator('#battle').click({position:{x:150,y:450}});
    assert.ok(await page.evaluate(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.battle.units.some(u=>u.order?.kind==='move');}));
    await page.locator('#restart').click();
    await page.locator('#side').selectOption('0');
    assert.match(await page.locator('#objective').innerText(),/Doğu kapısını koru/);
    assert.equal(await page.locator('#attack-tactics').isVisible(),false);
    assert.equal(await page.locator('#defense-tactics').isVisible(),true);
    assert.equal(await page.locator('[data-tactic="repair"]').isDisabled(),true);
    await page.locator('#defense-target').selectOption('north');
    await page.locator('[data-tactic="oil"]').click();
    await page.waitForFunction(()=>document.querySelector('[data-tactic="oil"]').disabled);
    assert.equal(await page.locator('[data-tactic="oil"]').isDisabled(),true);
    assert.equal(await page.evaluate(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.battle.hazards[0].y;}),240);
    assert.match(await page.locator('#supplies').innerText(),/65/);
    await page.locator('#restart').click();
    await page.locator('[data-select="all"]').click();assert.match(await page.locator('#selection').innerText(),/28 asker/);
    await page.locator('#hold').click();
    assert.equal(await page.evaluate(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.battle.units.filter(u=>u.order?.kind==='hold').length;}),28);
    await page.locator('#auto').click();
    await page.locator('#fit').click();
    assert.equal(await page.evaluate(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.renderer.view.zoom;}),.25);
    await page.locator('#focus').click();
    assert.equal(await page.evaluate(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.renderer.view.zoom;}),.38);
    await page.locator('#play').click();
    await page.waitForFunction(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.battle.time>.5;});
    await page.locator('#play').click();
    const paused=await page.evaluate(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.battle.time;});
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.battle.time;}),paused);
    await page.evaluate(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);for(let i=0;i<3600 && r.battle.gate.hp>0;i++)r.battle.step(1/30);r.renderer.invalidate();});
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.battle.gate.hp;}),0);
    if(size.width>700)await page.screenshot({path:'artifacts/crown-siege/desktop.png'});
    else await page.screenshot({path:'artifacts/crown-siege/mobile.png',fullPage:true});
    await page.evaluate(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);while(r.battle.winner===null)r.battle.step(1/30);});
    await page.waitForFunction(()=>!document.getElementById('result').hidden);
    await page.locator('#again').click();
    assert.equal(await page.evaluate(async()=>{const {runtime:r}=await import(document.querySelector('script[src*="/src/crown-siege-app.js"]').src);return r.battle.time;}),0);
    assert.equal(await page.locator('#result').isVisible(),false);
    assert.deepEqual(errors,[]);console.log(`PASS siege browser ${size.width}: plans, shields, fronts, defense tactics, commands, camera, start/pause, breach, victory, reset, no errors`);
    await page.close();
  }
}finally{await browser.close();}
