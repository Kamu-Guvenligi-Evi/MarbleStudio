import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import {selectTestChannel} from './browser-channel.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try{
  for(const mode of ['track','arena','territory','spiral','pi','statistics','ball-duel','ring-escape','rock-paper-scissors','glass-breaker','spiral-breaker']){
    const page=await browser.newPage({viewport:{width:1366,height:1000}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await selectTestChannel(page);
    const main=['track','arena','territory','spiral','pi','statistics'].includes(mode);
    await page.goto(`http://127.0.0.1:5173/${main?'?mode='+mode:mode+'.html'}`);
    await page.waitForTimeout(1200);
    const selector=mode==='pi'?'#pi-play':mode==='statistics'?'#statistics-play':main?'#pause':null;
    if(selector&&await page.locator(selector).count())await page.locator(selector).click();
    await page.waitForTimeout(1200);
    const result=await page.evaluate(()=>new Promise(resolve=>{
      const samples=[];let start,last;
      function frame(now){start??=now;if(last)samples.push(now-last);last=now;
        if(now-start<2500){requestAnimationFrame(frame);return;}
        samples.sort((a,b)=>a-b);
        const canvas=[...document.querySelectorAll('canvas')].filter(c=>c.getBoundingClientRect().width>250&&c.getBoundingClientRect().height>200).at(-1);
        resolve({fps:Math.round(samples.length*1000/(now-start)),medianMs:samples[Math.floor(samples.length*.5)],p95Ms:samples[Math.floor(samples.length*.95)],width:canvas?.width,height:canvas?.height});
      }requestAnimationFrame(frame);
    }));
    results.push({mode,...result,errors});console.log(JSON.stringify(results.at(-1)));await page.close();
  }
  await writeFile(`artifacts/preview-${process.argv[2]||'benchmark'}.json`,JSON.stringify(results,null,2));
}finally{await browser.close();}
