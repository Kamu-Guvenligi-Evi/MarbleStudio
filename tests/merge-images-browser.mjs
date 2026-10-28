import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:5173')&&!r.url().startsWith('data:'))external.push(r.url());});
 await page.goto('http://127.0.0.1:5173/merge-evolution.html');
 await page.evaluate(()=>localStorage.setItem('marble-studio-merge-evolution-v1',JSON.stringify({theme:'planets',gravity:420,spawnInterval:.34,bounce:.98,speed:2})));
 await page.reload();await page.waitForFunction(()=>window.mergeStudio);
 const settings=await page.evaluate(()=>window.mergeStudio.snapshot());
 assert.equal(settings.gravity,180);assert.equal(settings.spawnInterval,.65);assert.equal(settings.speed,2);
 assert.equal(await page.locator('#evolution-chain img').count(),8);
 const report=await page.evaluate(async()=>{
  const {MERGE_IMAGES}=await import('/src/merge-image-manifest.js');
  const {MERGE_THEMES}=await import('/src/merge-themes.js');
  const {MergeEvolution}=await import('/src/merge-evolution.js');
  const {prepareMergeImages,mergeImage}=await import('/src/merge-images.js');
  let loaded=0;for(const theme of MERGE_THEMES){await prepareMergeImages(theme);for(let i=0;i<theme.stages.length;i++)if(MERGE_IMAGES[theme.id]?.[i]){if(!mergeImage(theme,i))throw Error(theme.id+':'+i);loaded++;}}
  const game=new MergeEvolution();game.step();const initial=game.balls[0];return {loaded,radius:initial.r,vy:initial.vy,interval:game.settings.spawnInterval};
 });
 assert.ok(report.loaded>=200);assert.equal(report.radius,28);assert.ok(report.vy<40);assert.equal(report.interval,.65);
 await page.locator('#theme-search').fill('pokemon');
 const creatures=await page.evaluate(async()=>{const {MERGE_IMAGES}=await import('/src/merge-image-manifest.js');return ['fire','water','grass','bug'].every(k=>MERGE_IMAGES[k+'-pokemon'].every(x=>x.src.includes('pokemon-')));});
 assert.ok(creatures);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log(JSON.stringify({migration:true,customSpeedPreserved:true,localImages:report.loaded,largerRadius:report.radius,slowEntry:true,externalRequests:0}));
}finally{await browser.close();}
