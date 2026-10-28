import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1200,height:700}});
 await page.routeWebSocket('**/*',s=>s.close());
 await page.route('**/compare-empty',r=>r.fulfill({contentType:'text/html',body:'<div style="position:relative;width:1100px;height:500px"><canvas style="position:absolute;inset:0;width:100%;height:100%"></canvas></div>'}));
 await page.goto('http://127.0.0.1:5173/compare-empty');
 console.log(JSON.stringify(await page.evaluate(async()=>{
  const {Battle}=await import('/src/crown-battle.js'),{BattleRenderer}=await import('/src/crown-battle-renderer.js');
  const army={samurai:300,janissary:200,kipchak:200,hussar:200};
  const b=new Battle({historicalArmies:[army,army]}),r=new BattleRenderer(document.querySelector('canvas'),b);
  r.resize(1100,500,true,1);
  for(const u of b.units){u.x=70+u.id%70*6.5;u.y=440+u.team*90+Math.floor(u.id/70)%14*3;}
  for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);b.step(1/30);r.render({running:true});}
  const result=[];
  for(const layered of [false,true,false,true]) {
   r.layered=layered;
   const draws=[],intervals=[];let last=0;
   for(let i=0;i<70;i++) {
    const now=await new Promise(requestAnimationFrame);if(last)intervals.push(now-last);last=now;
    const t=performance.now();r.render({running:true});draws.push(performance.now()-t);
   }
   const stats=a=>{a.sort((a,b)=>a-b);return [a[Math.floor(a.length*.5)],a[Math.floor(a.length*.95)]]};
   result.push({layered,draw:stats(draws),interval:stats(intervals),batch:r.spriteBatch?.frames,pages:r.spriteCache.pages.length});
  }
  return result;
 })));
} finally {await browser.close();}
