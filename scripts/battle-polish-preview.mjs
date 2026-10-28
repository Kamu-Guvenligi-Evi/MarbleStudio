import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.routeWebSocket('**/*',s=>s.close());
 await page.route(/\/src\/crown-battle-app\.js(?:\?.*)?$/,async route=>{
  const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.battleProbe={get battle(){return battle},get renderer(){return renderer}};'});
 });
 await page.addInitScript(()=>localStorage.setItem('marble-historical-armies-v1',JSON.stringify([{samurai:36,janissary:24,kipchak:12},{spartan:36,roman:24,hussar:12}])));
 await page.goto('http://127.0.0.1:5173/crown-battle.html');
 await page.waitForFunction(()=>window.battleProbe);
 await page.waitForTimeout(1800);
 mkdirSync('artifacts/battle-polish',{recursive:true});
 const name=process.argv[2]||'before';
 await page.screenshot({path:`artifacts/battle-polish/${name}.jpg`,quality:77});
 const view=await page.evaluate(()=>({units:window.battleProbe.battle.units.length,canvas:[window.battleProbe.renderer.canvas.width,window.battleProbe.renderer.canvas.height]}));
 if(name!=='before'){
  assert(view.canvas[1]>=550,'Desktop battlefield must have room above the command desk');
  for(const width of [1440,1000,390]){
   await page.setViewportSize({width,height:900});await page.waitForTimeout(300);
   const layout=await page.evaluate(()=>{
    const rect=s=>{const b=document.querySelector(s).getBoundingClientRect();return {x:b.x,y:b.y,r:b.right,b:b.bottom,w:b.width,h:b.height};};
    return {overflow:document.documentElement.scrollWidth>innerWidth+1,canvas:rect('#battle'),commands:rect('.stage-commands'),transport:rect('.transport'),audio:rect('.battle-audio-controls')};
   });
   assert(!layout.overflow,`No horizontal page overflow at ${width}`);
   assert(layout.commands.y>=layout.canvas.b-1,`Commands below field at ${width}`);
   assert(layout.transport.y>=layout.commands.b-1,`Transport below commands at ${width}`);
   if(width>=1200)assert(layout.audio.x>=layout.transport.r-1,'Audio and playback do not overlap');
  }
  await page.setViewportSize({width:1440,height:900});
  await page.locator('#cinema').click();
  assert(await page.locator('.stage-commands').isHidden(),'Cinema starts with commands collapsed');
  await page.locator('#cinema-commands').click();
  assert(await page.locator('#place-formation').isVisible(),'Formation remains available in cinema');
  await page.locator('#exit-cinema').click();
  const ground=await page.evaluate(async()=>{
   const {makeGround}=await import('/src/crown-battle-ground.js');
   const hash=c=>{let h=2166136261;for(const n of c.getContext('2d').getImageData(0,0,c.width,c.height).data)h=Math.imul(h^n,16777619);return h>>>0;};
   const first=hash(makeGround(1066,'classic',400,220));
   return {same:first===hash(makeGround(1066,'classic',400,220)),changed:first!==hash(makeGround(2000,'classic',400,220)),maps:new Set(['classic','steppe','desert','snow','autumn','stone'].map(id=>hash(makeGround(1066,id,400,220)))).size};
  });
  assert(ground.same&&ground.changed,'Terrain seed is stable and meaningful');assert.equal(ground.maps,6);
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({errors,view,checks:name==='before'?'baseline':'desktop/tablet/mobile layout, cinema, terrain seeds and six maps PASS'}));
}finally{await browser.close();}
