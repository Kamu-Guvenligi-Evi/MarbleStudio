import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{
  window.outputTexts=[];
  const fillText=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(value,...args){window.outputTexts.push(String(value));return fillText.call(this,value,...args);};
 });
 await page.goto('http://127.0.0.1:5173/factory-render.html');
 await page.waitForFunction(()=>window.factoryRenderer);
 const results=await page.evaluate(async()=>{
  const {Race}=await import('/src/physics.js'),{Arena}=await import('/src/arena.js');
  const {renderRace}=await import('/src/renderer.js'),{renderArena}=await import('/src/arena-renderer.js');
  const {Spiral}=await import('/src/spiral.js'),{renderSpiral}=await import('/src/spiral-renderer.js');
  const {EpisodeRace,drawEpisode}=await import('/src/episode-race.js');
  const {recipe,copyFor}=await import('/src/factory-recipes.js'),{withEpisode}=await import('/src/episode-plan.js');
  const canvas=document.querySelector('#render'),ctx=canvas.getContext('2d');
  const capture=draw=>{window.outputTexts=[];draw();return [...window.outputTexts];};
  const track=new Race({ballNames:['Almanya','Türkiye']});track.language='tr';track.start();track.balls[0].body.position.y=500;
  const trackTexts=capture(()=>renderRace(ctx,track,{cameraY:0,countdown:0,paused:false,preview:null}));
  track.finished=[track.balls[0]];track.balls[0].finishedAt=1;track.state='finished';
  trackTexts.push(...capture(()=>renderRace(ctx,track,{cameraY:0,countdown:0,paused:false,preview:null})));track.dispose();
  const arena=new Arena({ballNames:['Almanya','Türkiye']});arena.language='tr';arena.start();
  const arenaTexts=capture(()=>renderArena(ctx,arena));arena.state='finished';arena.winners=[arena.balls[0]];
  arenaTexts.push(...capture(()=>renderArena(ctx,arena)));arena.dispose();
  const territory=new Arena({arenaGame:'territory',ballNames:['Almanya','Türkiye']});territory.language='tr';territory.start();territory.step(1000);
  const territoryTexts=capture(()=>renderArena(ctx,territory));territory.state='finished';territory.winners=[territory.balls[0]];
  territoryTexts.push(...capture(()=>renderArena(ctx,territory)));territory.dispose();
  const spiral=new Spiral({});
  const spiralTexts=capture(()=>renderSpiral(ctx,spiral,{paused:true,countdown:0}));spiral.dispose();
  const episode=new EpisodeRace(withEpisode({...recipe(123,'track'),language:'tr',ballNames:['Türkiye']},'teams'));
  const episodeTexts=capture(()=>drawEpisode(ctx,episode));episode.dispose();
  const stats=[];
  for(const item of (await (await fetch('/statistics/manifest.json')).json()).items){
   const csv=await (await fetch(item.csv)).text(),r={mode:'statistics',statistics:{csv,dataset:item,heading:item.title,source:item.source,unit:item.unit,duration:'30',top:'10'}};
   await window.factoryRenderer.begin({recipe:r,analysis:window.factoryRenderer.probe(r),speed:1,fps:30,copy:copyFor(r,'tr')});
   const texts=capture(()=>window.factoryRenderer.frame(899));
   stats.push({id:item.id,title:item.title,unit:item.unit,texts});
  }
  return {trackTexts,arenaTexts,territoryTexts,spiralTexts,episodeTexts,stats};
 });
 assert.ok(results.trackTexts.includes('LIVE LEADERS'));
 assert.ok(results.trackTexts.includes('Germany'));
 assert.ok(results.trackTexts.includes('R A C E  W I N N E R'));
 assert.ok(results.arenaTexts.includes('ORBIT • LINK BATTLE'));
 assert.ok(results.arenaTexts.includes('WINNER'));
 assert.ok(results.territoryTexts.includes('TERRITORY BATTLE'));
 assert.ok(results.territoryTexts.includes('WINNER'));
 assert.ok(results.spiralTexts.includes('Paused'));
 assert.ok(results.episodeTexts.some(s=>s.includes('Team challenge · Round')));
 for(const item of results.stats){assert.ok(item.texts.includes('MARBLE STUDIO / STATISTICS RACE'));assert.ok(!item.texts.includes(item.title),item.id);assert.ok(!item.texts.includes(item.unit),item.id);assert.ok(!item.texts.includes('Almanya'));}
 assert.doesNotMatch(JSON.stringify(results),/KAZANAN|ALAN LİDERLERİ|İLK \d|Duraklatıldı|EN ÇOK BAĞ/);
 await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
 assert.match(await page.locator('#nav-track').textContent(),/Parkur/);
 assert.equal(await page.locator('select[name="language"] option[value="tr"]').count(),0);
 await page.goto('http://127.0.0.1:5173/factory.html');
 assert.equal(await page.locator('select[name="language"]').inputValue(),'en');
 assert.equal(await page.locator('select[name="language"] option[value="tr"]').count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: actual canvas text is English across five video modes and all 11 statistics datasets; studio controls stay Turkish.');
}finally{await browser.close();}
