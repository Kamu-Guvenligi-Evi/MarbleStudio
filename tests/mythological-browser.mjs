import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/historical-armies.html');
  const art = await page.evaluate(async () => {
    const { SpriteLibrary } = await import('/src/crown-battle-art.js');
    const sprites = new SpriteLibrary();
    const { MYTHOLOGICAL_UNITS: units } = await import('/src/mythological-units.js');
    const invalid=[], still=[], hashes = new Set(); let frames=0;
    for (const unit of units) {
      const states = new Map();
      for (const team of [0,1]) for (const action of ['idle','walk','attack']) for (let frame=0;frame<8;frame++) {
        const c=sprites.get(unit.id,team,frame,action,0), g=c.getContext('2d');
        if (sprites.get(unit.id,team,frame,action,1)!==c || sprites.get(unit.id,team,frame,action,2)!==c) invalid.push(`${unit.id}/duplicate-variant`);
        const pixels=g.getImageData(0,0,c.width,c.height).data;
        let count=0, clipped=false;
        for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(pixels[(y*c.width+x)*4+3]>20){
          count++;if(!x||!y||x===c.width-1||y===c.height-1)clipped=true;
        }
        if(count<100||clipped)invalid.push(`${unit.id}/${team}/${action}/${frame}`);
        const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',pixels))).join(',');
        const key=`${team}/${action}`;if(!states.has(key))states.set(key,new Set());states.get(key).add(hash);
        if(!team&&action==='idle'&&!frame)hashes.add(hash);
        frames++;
      }
      for(const [key,values] of states)if(values.size<3)still.push(`${unit.id}/${key}`);
    }
    return { frames, invalid, still, unique:hashes.size };
  });
  assert.equal(art.frames,432);assert.deepEqual(art.invalid,[]);assert.deepEqual(art.still,[]);assert.equal(art.unique,9);
  for(const width of [1366,390]) {
    await page.setViewportSize({width,height:850});
    await page.locator('[data-culture="culture:mythology"]').click();
    for(const country of ['Yunan','İskandinav','Mısır']) {
      await page.locator(`[data-country="${country} Mitolojisi"]`).click();
      assert.equal(await page.locator('.unit-card:visible').count(),3);
    }
    await page.locator('[data-country="Yunan Mitolojisi"]').click();
    await page.locator('input[data-id="myth_centaur"][data-team="0"]').fill('6');
    await page.locator('[data-country="İskandinav Mitolojisi"]').click();
    await page.locator('input[data-id="myth_fenrir"][data-team="1"]').fill('6');
    await page.locator('#search').fill('Fenrir');assert.equal(await page.locator('.unit-card:visible').count(),1);
    await page.locator('#search').fill('');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.reload();
  }
  await page.locator('#launch-battle').click();await page.waitForURL('**/crown-battle.html?historical=1');
  await page.locator('#menu-setup').click();
  await page.locator('[data-culture="culture:mythology"]').click();
  await page.locator('[data-country="İskandinav Mitolojisi"]').click();
  assert.equal(await page.locator('#red-myth_fenrir').inputValue(),'6');
  await page.locator('#red-myth_fenrir').fill('0');
  await page.locator('[data-country="Yunan Mitolojisi"]').click();
  assert.equal(await page.locator('#north-myth_centaur').inputValue(),'6');
  await page.locator('#apply').click();
  assert.equal(await page.locator('#north-count').textContent(),'6');
  assert.equal(await page.locator('#red-count').textContent(),'0');
  await page.reload();
  assert.equal(await page.locator('#north-count').textContent(),'6');
  assert.equal(await page.locator('#red-count').textContent(),'0');
  // A compact review sheet, generated locally, includes both facings and attacks.
  await page.route('**/__mythology-preview', route => route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>'}));
  await page.goto('http://127.0.0.1:5173/__mythology-preview');
  await page.evaluate(async()=>{
    const {historicalSprite}=await import('/src/historical-battle-art.js');
    const {MYTHOLOGICAL_UNITS:units}=await import('/src/mythological-units.js');
    document.body.innerHTML='';document.body.style='margin:0;background:#1c292a;color:#eee;font:16px sans-serif';
    const sheet=document.createElement('main');sheet.style='display:grid;grid-template-columns:repeat(3,300px);gap:6px;padding:8px';document.body.append(sheet);
    for(const u of units){const card=document.createElement('div');card.style='height:213px;background:#304143;text-align:center';card.textContent=u.name;
      const c=document.createElement('canvas');c.width=300;c.height=185;const g=c.getContext('2d');
      g.drawImage(historicalSprite(u.id,0,0,'idle',0),0,0,192,182.4);
      g.save();g.translate(299,0);g.scale(-1,1);g.drawImage(historicalSprite(u.id,1,3,'attack',0),0,0,192,182.4);g.restore();card.append(c);sheet.append(card);}
  });
  await page.setViewportSize({width:930,height:680});await fs.mkdir('artifacts/mythology',{recursive:true});
  await page.screenshot({path:'artifacts/mythology/creatures.jpg',type:'jpeg',quality:78});
  assert.deepEqual(errors,[]);
  console.log('PASS 432 animated frames, no clipping/empty/duplicate creatures; desktop/mobile categories, search, mixed-team save transfer and red count removal; no browser errors.');
} finally { await browser.close(); }
