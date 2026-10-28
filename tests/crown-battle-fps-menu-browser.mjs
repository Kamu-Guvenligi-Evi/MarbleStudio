import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel:'chrome', headless:true });
try {
  const page = await browser.newPage({viewport:{width:1366,height:768}});
  await page.routeWebSocket('**/*',socket=>socket.close());
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=demo');
  await page.waitForFunction(()=>typeof document.getElementById('play')?.onclick==='function');
  await page.evaluate(()=>{
    const render=CanvasRenderingContext2D.prototype.clearRect;
    window.draws=0;
    CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.id==='battle')window.draws++;return render.apply(this,args);};
  });
  // Paused views may finish a bounded queue of new poses after zoom/pause.
  const settle=async()=>{
    await page.evaluate(()=>window.quietDraw={count:window.draws,since:performance.now()});
    await page.waitForFunction(()=>{
      if(window.quietDraw.count!==window.draws)window.quietDraw={count:window.draws,since:performance.now()};
      return performance.now()-window.quietDraw.since>800;
    },null,{timeout:15000});
  };
  await settle(); await page.evaluate(()=>window.draws=0);
  await page.waitForTimeout(700);
  assert.equal(await page.evaluate(()=>window.draws),0,'Paused field must not redraw on every RAF/UI tick');
  await page.locator('[data-unit]:visible').first().click(); await settle();
  assert.ok(await page.evaluate(()=>window.draws)>0,'Selection must redraw while paused');
  await page.evaluate(()=>window.draws=0); await page.locator('#zoom-in').click(); await settle();
  assert.ok(await page.evaluate(()=>window.draws)>0,'Camera must redraw while paused');
  await page.locator('#zoom-reset').click();
  const scroll=await page.locator('#panel-command .menu-scroll').boundingBox(), search=await page.locator('#unit-search').boundingBox();
  assert.ok(search.y>=0 && search.y+search.height<=scroll.y,'Search stays visible above the scrolling roster, including civilization filters');
  assert.equal(await page.locator('#commander-details').getAttribute('open'),null);
  await page.locator('#menu-setup').click();
  for(const fraction of [0,1]){
    await page.locator('#panel-setup .menu-scroll').evaluate((el,f)=>el.scrollTop=f*el.scrollHeight,fraction);
    const apply=await page.locator('#apply').boundingBox();
    assert.ok(apply.y>=0&&apply.y+apply.height<=768,'Apply remains within the PC viewport throughout scrolling');
  }
  await page.locator('#apply').click();
  assert.equal(await page.locator('#menu-command').getAttribute('aria-selected'),'true');
  await page.locator('#play').click();
  await page.waitForFunction(()=>document.getElementById('play').textContent.includes('Duraklat'),null,{timeout:60000});
  await page.waitForTimeout(700);
  assert.ok(await page.evaluate(()=>window.draws)>3,'Battle animation continues');
  await page.locator('#play').click(); await settle(); await page.evaluate(()=>window.draws=0);
  await page.waitForTimeout(500); assert.equal(await page.evaluate(()=>window.draws),0);
  await page.screenshot({path:'artifacts/crown-battle/fps-menu-pc.jpg',type:'jpeg',quality:65});
  // Atlas eviction is bounded and never overwrites a sprite needed this frame.
  const cache=await page.evaluate(async()=>{
    const {BattleSpriteCache}=await import('/src/crown-battle-sprite-cache.js');
    const cache=new BattleSpriteCache(), source=document.createElement('canvas');source.width=source.height=1;
    source.getContext('2d').fillRect(0,0,1,1);
    cache.beginFrame(4); let fallbacks=0;
    for(let i=0;i<260;i++) if(!cache.get(source,i,false,4,source)) fallbacks++;
    const pages=cache.pages.length; cache.beginFrame(4); const fresh=cache.get(source,999,false,4,source);
    return {pages,fallbacks,recovered:!!fresh,after:cache.pages.length};
  });
  assert.equal(cache.pages,16);assert.ok(cache.fallbacks>0&&cache.recovered);assert.equal(cache.after,16);
  const redraw=await page.evaluate(async()=>{
    const {Battle}=await import('/src/crown-battle.js');
    const {BattleRenderer}=await import('/src/crown-battle-renderer.js');
    const renderer=new BattleRenderer(document.createElement('canvas'),new Battle());
    renderer.resize(600,400,true);
    const first=renderer.renderIfNeeded();
    for(let i=0;i<120 && renderer.renderIfNeeded();i++) {}
    const idle=renderer.renderIfNeeded();
    renderer.reset(new Battle()); const reset=renderer.renderIfNeeded();
    renderer.resize(600,400,true); const resize=renderer.renderIfNeeded();
    return {first,idle,reset,resize};
  });
  assert.deepEqual(redraw,{first:true,idle:false,reset:true,resize:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: paused redraw eliminated; selection/zoom/resume repaint; fixed search/apply; bounded atlas eviction; no browser errors');
}finally{await browser.close();}
