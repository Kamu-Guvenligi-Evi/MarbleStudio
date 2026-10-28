import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const browser = await chromium.launch({channel:'chrome',headless:true});
await mkdir('artifacts/crown-battle',{recursive:true});
try {
  for(const width of [1366,390]) {
    const page=await browser.newPage({viewport:{width,height:844},isMobile:width<900,hasTouch:width<900});
    // Other authorized tabs edit this Vite workspace; keep this test session stable.
    await page.routeWebSocket('**/*',socket=>socket.close());
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:5173/crown-battle.html?map=fortress');
    assert.equal(await page.locator('[data-battle-map="fortress"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#north-count').textContent(),'0');
    assert.equal(await page.locator('#red-count').textContent(),'0');
    await page.evaluate(async()=>{
      const source=await(await fetch('/src/crown-battle-app.js')).text();
      const {BattleRenderer}=await import(source.match(/from ['"]([^'"]*crown-battle-renderer\.js[^'"]*)['"]/)[1]);
      const render=BattleRenderer.prototype.renderIfNeeded;
      BattleRenderer.prototype.renderIfNeeded=function(...args){window.fortressRenderer=this;return render.apply(this,args);};
      for(const side of ['north','red']){
        const input=document.querySelector(`#${side}-samurai`);input.value='8';input.dispatchEvent(new Event('input',{bubbles:true}));
      }
    });
    await page.locator('#apply').click();
    await page.waitForFunction(()=>window.fortressRenderer?.battle.units.length===16);
    assert.equal(await page.evaluate(()=>!!window.fortressRenderer.battle.navigation),true,'Rebuild retains map physics');
    await page.locator('#menu-command').click();
    await page.locator('#select-blue-army').click();
    const clickWorld=async(x,y)=>{
      await page.locator('#battle').scrollIntoViewIfNeeded();
      const p=await page.evaluate(({x,y})=>{
        const r=window.fortressRenderer,c=r.canvas,b=c.getBoundingClientRect(),s=Math.min(b.width/c.width,b.height/c.height);
        return {x:b.x+(b.width-c.width*s)/2+((x-r.view.x)*r.view.zoom/600+.5)*c.width*s,y:b.y+(b.height-c.height*s)/2+((y-r.view.y)*r.view.zoom/960+.5)*c.height*s};
      },{x,y});
      if(width<900)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);
    };
    const positions=()=>page.evaluate(()=>window.fortressRenderer.battle.units.map(u=>[u.x,u.y]));
    const original=await positions();
    await page.locator('#place-formation').click();await clickWorld(300,480);
    assert.deepEqual(await positions(),original,'Water placement rejected by real UI');
    assert.match(await page.locator('#formation-note').textContent(),/nehir|engel|köprü/);
    await clickWorld(80,560);
    assert.notDeepEqual(await positions(),original,'Open land placement succeeds');
    assert.equal(await page.locator('#undo-placement').isDisabled(),false);
    await page.locator('#menu-setup').click();
    await page.locator('[data-battle-map="classic"]').click();
    await page.locator('#menu-command').click();
    await page.waitForFunction(()=>document.querySelector('#undo-placement').disabled);
    assert.equal(await page.evaluate(()=>window.fortressRenderer.battle.navigation),null);
    await page.locator('#menu-setup').click();await page.locator('[data-battle-map="fortress"]').click();
    await page.locator('#menu-command').click();
    await page.locator('#play').click();
    await page.waitForFunction(()=>window.fortressRenderer.battle.time>.2);
    await page.locator('#play').click();
    await page.locator('#battle').screenshot({path:`artifacts/crown-battle/fortress-${width}.jpg`,type:'jpeg',quality:65});
    assert.deepEqual(errors,[]);
    console.log(`PASS fortress browser ${width}: empty start, map URL, rebuild, blocked placement, deploy, undo reset, map switch, play/pause`);
    await page.close();
  }
}finally{await browser.close();}
