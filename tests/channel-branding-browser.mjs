import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs';

fs.mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[],queued=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',async route=>{
    const url=new URL(route.request().url());
    if(url.pathname==='/api/queue')queued.push(route.request().postDataJSON());
    const value=url.pathname.endsWith('/accounts')?{accounts:[]}:
      url.pathname==='/api/factory'?{apiVersion:5,capabilities:['studio-workbench','temporary-downloads'],jobs:[],summary:{done:0,pending:0},total:0}: {ok:true};
    await route.fulfill({json:value});
  });
  await page.goto('http://127.0.0.1:5173?edit=1&mode=pi');
  await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#studio-export').click();
  await page.waitForFunction(()=>document.querySelector('#video-submit')?.textContent==='Videoyu hazırla');
  await page.locator('#video-submit').click();
  await page.locator('#channel-choice').waitFor();
  assert.equal(queued.length,0);
  await page.locator('#channel-choice select').selectOption('');
  await page.locator('#channel-choice button[type=submit]').click();
  assert.equal(queued.length,0);assert.ok(await page.locator('#channel-choice').isVisible());
  await page.locator('#channel-choice-cancel').click();
  await page.locator('#video-submit').click();
  await page.locator('#channel-choice select').selectOption('VortexBallSpiral');
  await page.locator('#channel-choice button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#videos-dialog').open);
  assert.equal(queued.length,1);assert.equal(queued[0].channel,'VortexBallSpiral');

  await page.goto('http://127.0.0.1:5173?edit=1&mode=pi');
  await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#studio-export').click();
  await page.waitForFunction(()=>document.querySelector('#video-submit').textContent==='Videoyu hazırla');
  await page.locator('#video-submit').click();
  await page.locator('#channel-choice select').selectOption('LastBallStand');
  await page.locator('#channel-choice button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#videos-dialog').open);
  assert.equal(queued.length,2);assert.equal(queued[1].channel,'LastBallStand');
  await page.locator('#videos-dialog [data-wb-close]').click();
  await page.goto('http://127.0.0.1:5173?edit=1');
  await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#webm-options').evaluate(el=>{for(let node=el;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;});
  await page.locator('#record').click();
  await page.locator('#channel-choice-cancel').click();
  assert.equal(await page.evaluate(()=>window.marbleStudio.getState().recording),false);
  await page.locator('#nav-statistics').click();
  await page.locator('#statistics-webm-options').evaluate(el=>{for(let node=el;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;});
  await page.locator('#statistics-record').click();
  await page.locator('#channel-choice-cancel').click();
  assert.equal(await page.evaluate(()=>window.marbleStudio.getStatisticsState().recording),false);

  for(const connected of [true,false]){
    await page.evaluate(connected=>{
      import('/src/channel-branding.js').then(({brandVideoOptions})=>{
        window.brandResult=null;
        brandVideoOptions({youtube:{channelId:'old',privacyStatus:'private'}},async()=>({accounts:connected?[{id:'chosen-account',title:'VortexBallSpiral'}]:[]}))
          .then(result=>window.brandResult=result).catch(error=>window.brandResult={error:error.message});
      });
    },connected);
    await page.locator('#channel-choice select').selectOption('VortexBallSpiral');
    await page.locator('#channel-choice button[type=submit]').click();
    await page.waitForFunction(()=>window.brandResult);
    const result=await page.evaluate(()=>window.brandResult);
    if(connected)assert.equal(result.youtube.channelId,'chosen-account');
    else assert.ok(result.error.includes('bağlı değil'));
  }

  await page.goto('http://127.0.0.1:5173/factory-render.html');
  await page.waitForFunction(()=>window.factoryRenderer);
  const samples=await page.evaluate(async()=>{
    const {DEMO_CSV}=await import('/src/statistics-data.js');
    const renderer=window.factoryRenderer,results=[];
    const original=CanvasRenderingContext2D.prototype.fillText;
    let stamps=[];
    CanvasRenderingContext2D.prototype.fillText=function(text,...args){
      if(text.endsWith('™'))stamps.push({text,alpha:this.globalAlpha});
      return original.call(this,text,...args);
    };
    try{
      for(const mode of ['track','spiral','arena','territory','statistics']){
        const recipe={mode:mode==='territory'?'arena':mode,arenaGame:mode==='territory'?'territory':'links',count:8,seed:42,sequence:['pegs'],statistics:{csv:DEMO_CSV,heading:'Test',unit:'puan',source:'Demo',duration:'30',top:'10',interpolation:'smooth'}};
        for(const channel of ['LastBallStand','VortexBallSpiral']){
          const config={recipe,channel,width:1080,height:1920,fps:30,speed:1,analysis:{simulationSeconds:30},copy:{hook:'',language:'en'},template:'minimal'};
          await renderer.begin(config);stamps=[];const branded=renderer.frame(0);
          const marks=[...stamps];await renderer.begin({...config,channel:''});const plain=renderer.frame(0);
          results.push({mode,channel,marks,changed:branded!==plain});
          if(channel==='VortexBallSpiral'&&['spiral','arena'].includes(mode)){
            await renderer.begin(config);renderer.frame(0);
            results.at(-1).image=document.querySelector('#render').toDataURL('image/png');
          }
        }
      }
    }finally{CanvasRenderingContext2D.prototype.fillText=original;}
    return results;
  });
  for(const sample of samples){
    assert.equal(sample.marks.length,1,JSON.stringify(sample));
    assert.equal(sample.marks[0].text,'@'+sample.channel+'™');
    assert.ok(sample.marks[0].alpha>0&&sample.marks[0].alpha<.2);
    assert.ok(sample.changed,`${sample.mode}: watermark must survive output composition`);
    if(sample.image)fs.writeFileSync(`artifacts/channel-watermark-${sample.mode}.png`,Buffer.from(sample.image.split(',')[1],'base64'));
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: required channel choice, cancel without queueing, chosen channel in manual export, both translucent brands in exported JPEG frames for all five modes.');
}finally{await browser.close();}
