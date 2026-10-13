import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5174';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:672}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/?edit=1');await page.waitForFunction(()=>window.marbleStudio);await page.locator('#nav-territory').click();
 for(const [preset,shape,count,duration] of [['portrait','portrait','8','45'],['crowd','portrait','12','45'],['country','turkey','6','30']]){
  await page.locator('#territory-template').selectOption(preset);assert.equal(await page.locator('#arena-shape').inputValue(),shape);assert.equal(await page.locator('#count').inputValue(),count);assert.equal(await page.locator('#territory-duration').inputValue(),duration);
 }
 await page.locator('#territory-template').selectOption('portrait');await page.reload();await page.waitForFunction(()=>window.marbleStudio);await page.locator('#nav-territory').click();assert.equal(await page.locator('#territory-template').inputValue(),'portrait');
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:1440,height:672});
 await page.goto(origin+'/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
 const report=await page.evaluate(async()=>{
  const {TerritoryBattle}=await import('/src/territory.js'),{renderArena}=await import('/src/arena-renderer.js');
  document.body.replaceChildren();document.body.style.cssText='display:flex;margin:0;background:#080e20;color:white;font:14px Segoe UI';
  const scenes=[[2,0],[15,0],[45,.4],[45,2]];let before,after;
  for(const [time,resultElapsed] of scenes){
   const race=new TerritoryBattle({arenaShape:'portrait',count:8,seed:2048});race.start();while(race.time<time&&race.state==='running')race.step(1000/60);
   const panel=document.createElement('div');panel.style.cssText='width:360px;flex:none';const label=document.createElement('div');label.style.cssText='height:32px;padding:6px;box-sizing:border-box;text-align:center';label.textContent=`${race.time.toFixed(1)}s · ${race.balls.filter(b=>b.eliminatedAt===null).length} alive · outro ${resultElapsed}s`;
   const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;canvas.style.cssText='display:block;width:360px;height:640px';panel.append(label,canvas);document.body.append(panel);
   const ctx=canvas.getContext('2d'),labels=[],original=ctx.fillText.bind(ctx);ctx.fillText=(...args)=>{labels.push(args[0]);original(...args);};renderArena(ctx,race,{resultElapsed});if(time===45&&resultElapsed<1)before=labels;else if(time===45)after=labels;
  }
  return {before,after};
 });
 assert.ok(!report.before.includes('WINNER'));assert.ok(report.after.includes('WINNER'));
 await page.screenshot({path:'artifacts/territory-watchability-after.jpg',type:'jpeg',quality:75});
 assert.deepEqual(errors,[]);console.log('PASS: presets, saved selection, mobile width, delayed final move and winner through shared arena renderer.');
}finally{await browser.close();}
