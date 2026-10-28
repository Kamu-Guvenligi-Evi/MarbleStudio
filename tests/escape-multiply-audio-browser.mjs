import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/escape-multiply.html');
 await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
 const result=await page.evaluate(async()=>{
  const {EscapeAudio}=await import('/src/escape-multiply-audio.js');const context=new AudioContext();await context.resume();const audio=new EscapeAudio(context);audio.setEnabled(true);
  const analyser=context.createAnalyser();analyser.fftSize=2048;audio.master.connect(analyser);const samples=new Float32Array(analyser.fftSize);
  const {EscapeMultiply}=await import('/src/escape-multiply.js');
  const game=new EscapeMultiply({gravity:0,rotation:0});audio.update(game);
  for(let i=0;i<5;i++){audio.update(game);await new Promise(r=>setTimeout(r,30));}
  const idleNotes=audio.index;game.escaped+=100;audio.update(game);const escapeOnlyNotes=audio.index;
  Object.assign(game.balls[0],{x:449,y:500,vx:300,vy:0});game.step();audio.update(game);const wallNotes=audio.index,wallImpacts=game.impactCount;
  await new Promise(r=>setTimeout(r,150));
  game.balls=[{x:260,y:500,vx:100,vy:0,outside:false},{x:268,y:500,vx:-100,vy:0,outside:false}];game.separate();audio.update(game);const pairNotes=audio.index;
  game.created=5000;let peak=0,rms=0,maxVoices=0;
  for(let i=0;i<24;i++){for(let j=0;j<1000;j++)game.impact(300,400);audio.update(game);maxVoices=Math.max(maxVoices,audio.voices.size);await new Promise(r=>setTimeout(r,30));analyser.getFloatTimeDomainData(samples);peak=Math.max(peak,...samples.map(Math.abs));rms=Math.max(rms,Math.sqrt(samples.reduce((s,v)=>s+v*v,0)/samples.length));}
  const beforeSilence=audio.index;await new Promise(r=>setTimeout(r,100));audio.update(game);const afterSilence=audio.index;
  audio.update(game,false);await new Promise(r=>setTimeout(r,250));analyser.getFloatTimeDomainData(samples);const muted=Math.max(...samples.map(Math.abs));
  game.impact(300,100);audio.update(game,false);audio.update(game,true);const resumedNotes=audio.index;
  game.releaseAt=0;game.balls=[];audio.update(game);const tailUntil=audio.tailUntil;audio.update(game);const singleEnding=audio.tailUntil===tailUntil;
  await new Promise(r=>setTimeout(r,180));analyser.getFloatTimeDomainData(samples);const endingPeak=Math.max(...samples.map(Math.abs));
  await new Promise(r=>setTimeout(r,1400));analyser.getFloatTimeDomainData(samples);const tailPeak=Math.max(...samples.map(Math.abs));
  const cache=audio.cache.size;audio.reset();const cleared=audio.voices.size;await context.close();return {endingPeak,tailPeak,singleEnding,idleNotes,escapeOnlyNotes,wallNotes,wallImpacts,pairNotes,beforeSilence,afterSilence,resumedNotes,peak,rms,muted,maxVoices,cache,cleared};
 });
 assert.ok(result.endingPeak>.005&&result.endingPeak<.98);assert.ok(result.tailPeak<.001);assert.equal(result.singleEnding,true);
 assert.equal(result.idleNotes,0);assert.equal(result.escapeOnlyNotes,0,'escapes alone do not play melody');assert.equal(result.wallNotes,1);assert.ok(result.wallImpacts>0);assert.equal(result.pairNotes,2);
 assert.equal(result.beforeSilence,result.afterSilence,'no notes without fresh collisions');assert.equal(result.resumedNotes,result.afterSilence,'no backlog on resume');
 assert.ok(result.rms>.005,'non-silent synthesized audio');assert.ok(result.peak<.98,'no clipping');assert.ok(result.muted<.001,'pause mutes audio');assert.ok(result.maxVoices<=18);assert.equal(result.cleared,0);


 await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');assert.deepEqual(errors,[]);
 console.log(JSON.stringify({audio:result,errors}));
}finally{await browser.close();}
