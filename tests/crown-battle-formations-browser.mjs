import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1366, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: width < 900, hasTouch: width < 900 });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5173/crown-battle.html');
    assert.ok(await page.locator('body.historical-mode').count(), 'Plain game URL opens civilizations');
    assert.ok(await page.locator('#roster-civilization option').count() > 20);
    assert.equal(await page.locator('#north-count').textContent(), '0');
    assert.equal(await page.locator('#red-count').textContent(), '0');
    await page.locator('#menu-setup').click();
    await page.locator('#roster-step').selectOption('50');
    await page.locator('#north-samurai').locator('..').locator('[data-roster-action="10"]').click();
    assert.equal(await page.locator('#north-samurai').inputValue(), '50');
    assert.equal(await page.locator('#red-samurai').inputValue(), '0');
    await page.locator('#roster-step').selectOption('1');
    await page.locator('#north-samurai').locator('..').locator('[data-roster-action="-10"]').click();
    assert.equal(await page.locator('#north-samurai').inputValue(), '49');
    assert.equal(await page.locator('.setup-actions').getAttribute('data-pending'), 'true');
    await page.locator('#north-samurai').fill('9');
    await page.locator('#red-janissary').fill('9');
    await page.locator('#apply').click();
    const attachRenderer = async () => { await page.evaluate(async () => {
      const source = await (await fetch('/src/crown-battle-app.js')).text();
      const url = source.match(/from ['"]([^'"]*crown-battle-renderer\.js[^'"]*)['"]/)[1];
      const { BattleRenderer } = await import(url);
      const render = BattleRenderer.prototype.renderIfNeeded;
      BattleRenderer.prototype.renderIfNeeded = function(...args) { window.formationRenderer = this; return render.apply(this, args); };
    });
    await page.waitForFunction(() => window.formationRenderer); };
    await attachRenderer();
    const positions = team => page.evaluate(team => window.formationRenderer.battle.units.filter(u => u.team === team).map(u => [u.x,u.y]), team);
    const point = async (x,y) => {
      await page.locator('#battle').scrollIntoViewIfNeeded();
      return page.evaluate(({x,y}) => {
        const r=window.formationRenderer,c=r.canvas,box=c.getBoundingClientRect(),s=Math.min(box.width/c.width,box.height/c.height);
        return { x:box.x+(box.width-c.width*s)/2+((x-r.view.x)*r.view.zoom/r.viewWidth+.5)*c.width*s, y:box.y+(box.height-c.height*s)/2+((y-r.view.y)*r.view.zoom/r.viewHeight+.5)*c.height*s };
      }, {x,y});
    };
    const clickPoint = async (x,y) => { const p=await point(x,y); if(width<900) await page.touchscreen.tap(p.x,p.y); else await page.mouse.click(p.x,p.y); };
    const redBefore=await positions(1);
    await page.locator('#select-blue-army').click();
    const originalBlue = await positions(0);
    await clickPoint(200,650);
    assert.notDeepEqual(await positions(0), originalBlue, 'Plain click deploys before battle');
    assert.deepEqual(await positions(1), redBefore);
    await page.waitForTimeout(350);
    assert.match(await page.locator('#formation-note').textContent(), /asker yerleştirildi/);
    await page.locator('#undo-placement').click();
    assert.deepEqual(await positions(0), originalBlue, 'Undo restores the exact previous positions');
    assert.ok(await page.locator('#undo-placement').isDisabled());
    await clickPoint(200,650);
    await page.locator('#battle').focus(); await page.keyboard.press('Control+z');
    assert.deepEqual(await positions(0), originalBlue, 'Ctrl+Z also undoes placement');
    assert.equal(await page.locator('#formation-kind option').count(), 10);
    for (const kind of ['column', 'crescent', 'hollowSquare', 'circle', 'echelonLeft', 'echelonRight']) {
      await page.locator('#formation-kind').selectOption(kind);
      assert.equal(await page.locator('.formation-guide circle').count(), 16);
      assert.ok((await page.locator('#formation-description').textContent()).length > 20);
      await page.locator('#place-formation').click();
      await clickPoint(200, 650);
      assert.notDeepEqual(await positions(0), originalBlue, `${kind}: deployed through the UI`);
      assert.deepEqual(await positions(1), redBefore, `${kind}: opponent unchanged`);
      await page.locator('#undo-placement').click();
      assert.deepEqual(await positions(0), originalBlue, `${kind}: exact undo`);
    }
    assert.ok(await page.locator('.formation-guide').evaluate(el => el.getBoundingClientRect().width <= innerWidth), 'Guide fits mobile width');
    await page.locator('#formation-kind').selectOption('wedge');
    await page.locator('#place-formation').click();
    if(width>=900) {
      const p=await point(180,550); await page.mouse.move(p.x,p.y);
      assert.equal(await page.evaluate(()=>window.formationRenderer.formationPreview.slots.length),9);
    }
    await clickPoint(180,550);
    assert.equal(await page.locator('#place-formation').getAttribute('aria-pressed'),'false');
    assert.equal(await page.evaluate(()=>window.formationRenderer.battle.time),0);
    assert.deepEqual(await positions(1),redBefore);
    const blue=await positions(0);
    assert.ok(Math.abs(blue.reduce((sum,p)=>sum+p[1],0)/blue.length-550)<1);
    assert.ok(blue.every(p=>p[0]>=150 && p[0]<=210));
    await page.locator('#select-red-army').click();
    await page.locator('#formation-kind').selectOption('line');
    await page.locator('#formation-direction').selectOption('270');
    await page.locator('#place-formation').click(); await clickPoint(430,400);
    assert.notDeepEqual(await positions(1),redBefore);
    assert.deepEqual(await positions(0),blue);
    assert.ok(await page.evaluate(()=>window.formationRenderer.battle.units.filter(u=>u.team===1).every(u=>u.headingY===-1)));
    const deploymentState = () => page.evaluate(() => window.formationRenderer.battle.units.filter(u=>!u.removed).map(u => [u.team,u.type,u.x,u.y,u.face,u.headingX,u.headingY].map(v=>v===0?0:v)));
    const deployed = await deploymentState();
    await page.reload(); await attachRenderer();
    assert.deepEqual(await deploymentState(), deployed, 'Reload restores both armies, their individual positions and headings');
    assert.equal(await page.locator('#formation-kind').inputValue(), 'line');
    assert.equal(await page.locator('#formation-direction').inputValue(), '270');
    await page.locator('#restart').click();
    assert.deepEqual(await deploymentState(), deployed, 'Rebuilding retains deployment');
    await page.locator('#select-red-army').click();
    await page.locator('#place-formation').click(); await page.keyboard.press('Escape');
    assert.equal(await page.locator('#place-formation').getAttribute('aria-pressed'),'false');
    assert.equal(await page.evaluate(()=>window.formationRenderer.battle.selected.size),9);
    if(width<900) {
      await page.locator('#place-formation').click();
      const p=await point(300,500),before=await positions(1),cdp=await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x-15,y:p.y,id:0}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x-15,y:p.y,id:0},{x:p.x+15,y:p.y,id:1}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      assert.deepEqual(await positions(1),before,'Pinch never deploys soldiers');
      assert.equal(await page.locator('#place-formation').getAttribute('aria-pressed'),'false');
      await cdp.detach();
    }
    await page.locator('#play').click();
    await page.waitForFunction(()=>window.formationRenderer.battle.time>0);
    assert.ok(await page.locator('#undo-placement').isDisabled(), 'Battle start clears deployment undo');
    await page.locator('#play').click();
    assert.equal(await page.locator('#place-formation').textContent(),'Formasyonla ilerle');
    const before=await positions(1);
    await page.locator('#place-formation').click(); await clickPoint(440,700);
    assert.deepEqual(await positions(1),before,'Paused battle issues move orders without teleport');
    assert.ok(await page.evaluate(()=>window.formationRenderer.battle.units.filter(u=>u.team===1).every(u=>u.order?.kind==='move')));
    await page.reload(); await attachRenderer();
    assert.deepEqual(await deploymentState(), deployed, 'Combat movement and paused orders never replace deployment');
    await page.locator('#army-setup-shortcut').click();
    await page.locator('#north-samurai').fill('11');
    assert.ok(await page.locator('#play').isDisabled(), 'Pending army edits cannot silently start an old roster');
    await page.locator('#battle').focus(); await page.keyboard.press('Space');
    assert.equal(await page.locator('#menu-setup').getAttribute('aria-selected'),'true');
    await page.locator('#apply').click();
    assert.equal(await page.locator('#north-count').textContent(),'11');
    assert.equal(await page.locator('.setup-actions').getAttribute('data-pending'),'false');
    assert.ok(await page.locator('#undo-placement').isDisabled(), 'Rebuild clears placement undo');
    assert.deepEqual((await positions(0)).slice(0,9), blue, 'Adding recruits retains existing soldiers positions');
    await page.locator('#select-blue-army').click();
    await page.evaluate(() => { const b=window.formationRenderer.battle; b.selected=new Set([b.units[3].id]); });
    await page.locator('#remove-selected').click();
    const afterRemoval=await deploymentState();
    const manualAfterRemoval=await page.evaluate(()=>window.formationRenderer.battle.units.filter(u=>!u.removed).map(u=>u.tacticalOverride===true));
    await page.reload(); await attachRenderer();
    // Manual placements survive exactly; automatic recruits are redeployed for
    // the new roster size, as BattleDeployment.restore deliberately specifies.
    const regenerated=await page.evaluate(()=>{
      const b=window.formationRenderer.battle;
      const fresh=new b.constructor({seed:b.seed,preset:b.preset,armyConfigs:b.armyConfigs,expandedMap:true,allowEmpty:true});
      return fresh.units.map(u=>[u.team,u.type,u.x,u.y,u.face,u.headingX,u.headingY].map(v=>v===0?0:v));
    });
    assert.deepEqual(await deploymentState(), afterRemoval.map((u,i)=>manualAfterRemoval[i]?u:regenerated[i]),
      'Removal preserves manual placements and regenerates automatic recruits for the current roster');
    await page.locator('#army-setup-shortcut').click();
    if (width < 900) await page.locator('[data-recruit-view="armies"]').click();
    await page.locator('[data-clear-team="0"]').click(); await page.locator('#apply').click();
    await page.reload(); await attachRenderer();
    assert.equal(await page.locator('#north-count').textContent(), '0', 'Empty army stays empty after refresh');
    assert.deepEqual(await positions(1), deployed.filter(u=>u[0]===1).map(u=>[u[2],u[3]]), 'Clearing blue preserves red deployment');
    assert.deepEqual(errors,[]);
    console.log(`PASS ${width}px: default civilizations, zero armies, placement preview, both armies, direction, cancellation, movement${width<900?', pinch cancellation':''}`);
    await page.close();
  }
} finally { await browser.close(); }
