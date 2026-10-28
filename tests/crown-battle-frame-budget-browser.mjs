import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1366,height:768}});
  await page.routeWebSocket('**/*',s=>s.close());
  await page.route('**/budget-empty',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html></html>'}));
  await page.goto('http://127.0.0.1:5173/budget-empty');
  const result=await page.evaluate(async()=>{
    const {SpriteLibrary}=await import('/src/crown-battle-art.js');
    const {BattleSpriteCache}=await import('/src/crown-battle-sprite-cache.js');
    const {makeContactShadow}=await import('/src/crown-battle-pc-scene.js');
    const {BATTLE_MAPS,battleMap}=await import('/src/crown-battle-maps.js');
    const {Battle}=await import('/src/crown-battle.js');
    const {BattleRenderer}=await import('/src/crown-battle-renderer.js');
    const library=new SpriteLibrary();
    const idle=library.get('samurai',0,0,'idle',0);
    library.beginFrame();let visible=true;
    for(let i=0;i<8;i++)visible&&=!!library.get('samurai',0,i,'attack',0);
    const bounded=library.generated<=1 && library.deferred;
    let rounds=0;
    while(library.deferred && rounds++<40){
      library.beginFrame();for(let i=0;i<8;i++)library.get('samurai',0,i,'attack',0);library.endFrame();
    }
    const complete=library.cache.size===9 && !library.deferred;
    const cache=new BattleSpriteCache(),shadow=makeContactShadow();
    cache.beginFrame(1);const first=cache.get(idle,1,false,1,shadow);
    cache.beginFrame(4,0);const duringZoom=cache.get(idle,1,false,4,shadow);
    const retained=first===duringZoom && cache.deferred;
    cache.beginFrame(4);const sharp=cache.get(idle,1,false,4,shadow);
    cache.beginFrame(1,0);const zoomOut=cache.get(idle,1,false,1,shadow);
    const upgraded=sharp.resolution===4 && sharp===zoomOut && !cache.deferred;
    // Adjacent packed cells cannot overlap, including mixed resolutions.
    const noOverlap=first.page!==sharp.page || first.x+first.width<=sharp.x || sharp.x+sharp.width<=first.x || first.y+first.height<=sharp.y || sharp.y+sharp.height<=first.y;
    const battle=new Battle({allowEmpty:true,historicalArmies:[{},{}],mapId:'fortress'});
    const renderer=new BattleRenderer(document.createElement('canvas'),battle,{mapId:'fortress'});
    const probe={type:'samurai',team:0,id:3,face:1};
    const family=renderer.spriteFamily(probe), identity=renderer.spriteIdentity(probe);
    const stableFamily=family===renderer.spriteFamily(probe);
    probe.face=-1;
    const facingKeys=renderer.spriteFamily(probe)===family && renderer.spriteIdentity(probe)!==identity
      && family.poses[1].keys.attack.length===8 && family.poses[-1].keys.attack[7]!==family.poses[1].keys.attack[7];
    probe.team=1;
    const teamKeys=renderer.spriteFamily(probe)!==family && renderer.spriteIdentity(probe).includes('/1/');
    probe.type='hussar';
    const typeKeys=renderer.spriteFamily(probe).horse && renderer.spriteIdentity(probe).startsWith('hussar/');
    probe.id=4;
    const idKeys=renderer.spriteFamily(probe).id===4;
    if(!stableFamily || !facingKeys || !teamKeys || !typeKeys || !idKeys)throw new Error('Cached pose identity did not follow soldier changes');
    const retired=renderer.mapId==='classic' && !battle.navigation && battleMap('fortress').id==='classic';
    const open=BATTLE_MAPS.every(map=>{renderer.setMap(map.id);return !battle.navigation;});
    renderer.resize(1200,700,true,2);
    const world=renderer.screenToWorld(.3,.4),scale=renderer.spriteScaleX;
    for(let i=0;i<60;i++)renderer.adaptPerformance(60);
    const adaptive=renderer.pixelRatio===1 && renderer.canvas.width===1200 && renderer.spriteScaleX===scale && JSON.stringify(renderer.screenToWorld(.3,.4))===JSON.stringify(world);
    for(let i=0;i<60;i++)renderer.adaptPerformance(16);
    const stable=renderer.pixelRatio===1;
    const exportRenderer=new BattleRenderer(document.createElement('canvas'),battle,{sprites:library});
    exportRenderer.resize(1080,1920,false,2);exportRenderer.adaptPerformance(100);
    const exportSize=exportRenderer.canvas.width===1080 && exportRenderer.canvas.height===1920;
    return {visible,bounded,complete,retained,upgraded,noOverlap,retired,open,adaptive,stable,exportSize,maps:BATTLE_MAPS.length};
  });
  assert.deepEqual(result,{visible:true,bounded:true,complete:true,retained:true,upgraded:true,noOverlap:true,retired:true,open:true,adaptive:true,stable:true,exportSize:true,maps:6});
  await page.addInitScript(()=>localStorage.setItem('marble-crown-battle-map-v1','fortress'));
  for(const suffix of ['', '?map=fortress']){
    await page.goto('http://127.0.0.1:5173/crown-battle.html'+suffix);
    assert.equal(await page.locator('[data-battle-map]').count(),6);
    assert.equal(await page.locator('[data-battle-map="fortress"]').count(),0);
    assert.equal(await page.locator('[data-battle-map="classic"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.evaluate(()=>localStorage.getItem('marble-crown-battle-map-v1')),'classic');
  }
  console.log('PASS: bounded pose generation completes; zoom reuses then upgrades atlas; packed cells do not overlap; six open maps; retired URL/save migrate to classic');
}finally{await browser.close();}
