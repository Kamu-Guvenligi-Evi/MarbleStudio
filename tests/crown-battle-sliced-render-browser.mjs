import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1100,height:600}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.routeWebSocket('**/*',s=>s.close());
  await page.route('**/sliced-render',r=>r.fulfill({contentType:'text/html',body:'<div style="position:relative"><canvas></canvas></div>'}));
  await page.goto('http://127.0.0.1:5173/sliced-render');
  const result=await page.evaluate(async()=>{
    const {Battle}=await import('/src/crown-battle.js');
    const {BattleRenderer}=await import('/src/crown-battle-renderer.js');
    const army={sword:0,pike:5000,archer:0,cavalry:0};
    const b=new Battle({seed:1066,armies:[army,army]}),r=new BattleRenderer(document.querySelector('canvas'),b);
    r.resize(1100,500,true,1);r.enableLayers();
    for(const u of b.units){const i=u.id%5000;u.x=70+i%100*5;u.y=300+u.team*220+Math.floor(i/100)*3;}
    r.renderIfNeeded({running:true});
    // Keep every pose available before testing publication and cancellation.
    for(let i=0;i<12;i++){r.render({running:true});await new Promise(requestAnimationFrame);}
    let clears=0,frames=0,pendingFrames=0,publications=0,previousGeneration=r.spriteBatch.generation;
    const clear=r.ctx.clearRect.bind(r.ctx);r.ctx.clearRect=(...args)=>{clears++;return clear(...args);};
    while(publications<3 && frames++<400){
      await new Promise(requestAnimationFrame);
      b.time+=.01; b.simulationRevision++;b.completedSimulationRevision=(b.completedSimulationRevision||0)+1;for(const u of b.units)u.x+=.1;
      const before=clears;r.renderIfNeeded({running:true});
      if(r.pendingRender){pendingFrames++;if(clears!==before)throw Error('Incomplete overlay published');}
      if(r.spriteBatch.generation>previousGeneration){publications++;previousGeneration=r.spriteBatch.generation;}
    }
    if(publications<3||pendingFrames<3)throw Error('Large render did not complete across multiple frames');
    async function startPending(){
      for(let i=0;i<200;i++){
        await new Promise(requestAnimationFrame);b.time+=.01;b.simulationRevision++;b.completedSimulationRevision=(b.completedSimulationRevision||0)+1;r.renderIfNeeded({running:true});
        if(r.pendingRender)return;
      }throw Error('No pending render');
    }
    // Publish one slow completed tick, then change only partial-tick state.
    // The old behavior rebuilt these unchanged targets and stopped movement.
    b.completedStepInterval=800;
    await startPending();
    while(r.pendingRender){await new Promise(requestAnimationFrame);r.renderIfNeeded({running:true});}
    const stableGeneration=r.spriteBatch.generation;
    if(r.spriteBatch.motionDuration<800)throw Error('Motion does not bridge the simulation cadence');
    for(let i=0;i<8;i++){
      await new Promise(requestAnimationFrame);b.simulationRevision++;b.time+=.001;
      r.sprites.deferred=true;r.spriteCache.deferred=true;
      r.renderIfNeeded({running:true});
      if(r.pendingRender||r.spriteBatch.generation!==stableGeneration)throw Error('Partial tick restarted movement');
    }
    await startPending();
    const generation=r.spriteBatch.generation;
    r.invalidate();
    if(r.pendingRender||r.spriteBatch.generation!==generation)throw Error('Cancelled preparation changed displayed motion');
    r.view.zoom*=1.1;r.renderIfNeeded({running:true});
    if(r.pendingRender||r.spriteBatch.smoothActive)throw Error('Camera did not draw immediately');
    await startPending();r.renderIfNeeded({running:false});
    if(r.pendingRender||r.spriteBatch.smoothActive)throw Error('Pause did not cancel pending animation');
    await startPending();
    r.spriteBatch.gl.getExtension('WEBGL_lose_context').loseContext();
    await new Promise(requestAnimationFrame);r.renderIfNeeded({running:true});
    if(r.pendingRender||r.spriteBatch.canvas.style.display!=='none')throw Error('Context loss did not use canvas fallback');
    return {soldiers:b.units.length,pendingFrames,publications,clears};
  });
  assert.equal(result.soldiers,10000);assert.deepEqual(errors,[]);
  console.log('PASS sliced 10000-soldier rendering: complete publications only, cancellation preserves motion, immediate camera/pause, context-loss fallback',JSON.stringify(result));
}finally{await browser.close();}
