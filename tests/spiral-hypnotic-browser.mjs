const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5173';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
import {productionAudio} from '../scripts/factory-audio.mjs';
import {selectTestChannel} from './browser-channel.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1366,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await selectTestChannel(page);
  await page.addInitScript(()=>{
    window.audioContextCount=0;
    window.AudioContext=new Proxy(window.AudioContext,{construct(Target,args){window.audioContextCount++;return Reflect.construct(Target,args);}});
    const Recorder=window.MediaRecorder;window.hypnoticRecordingStreams=[];window.hypnoticRecordingEvents=[];
    window.MediaRecorder=class extends Recorder{constructor(stream,options){
      super(stream,options);window.hypnoticRecordingStreams.push(stream);
      this.addEventListener('dataavailable',e=>window.hypnoticRecordingEvents.push({type:'data',size:e.data.size}));
      this.addEventListener('error',e=>window.hypnoticRecordingEvents.push({type:'error',message:e.error?.message}));
      this.addEventListener('stop',()=>window.hypnoticRecordingEvents.push({type:'stop'}));
    }};
  });
  await page.route('**/api/matches?**',route=>route.fulfill({json:{events:[],updatedAt:new Date().toISOString(),stale:false}}));
  await page.route('**/api/import-video',route=>route.fulfill({json:{ok:true}}));
  await page.goto((origin+'?edit=1'));await page.waitForFunction(()=>window.marbleStudio);
  await page.evaluate(()=>document.querySelector('#nav-spiral').onclick());
  await page.getByText('Ses ve müzik',{exact:true}).click();
  assert.equal(await page.locator('#spiral-hypnotic').isChecked(),false);assert.equal(await page.evaluate(()=>window.audioContextCount),0);
  await page.locator('#spiral-hypnotic').check();assert.equal(await page.evaluate(()=>window.audioContextCount),1);
  assert.ok(await page.locator('#collision-sound').isHidden());assert.ok(await page.locator('.music-panel').isHidden());
  await page.locator('#open-settings').click();await page.locator('#countdown-seconds').fill('0');await page.locator('#countdown-seconds').dispatchEvent('change');await page.locator('#settings-done').click();
  await page.locator('#pause').click();await page.waitForFunction(()=>window.marbleStudio.getState().spiralAudio?.played>0);
  const first=await page.evaluate(()=>window.marbleStudio.getState());assert.ok(first.spiralAudio.active);
  await page.keyboard.press('m');assert.equal(await page.locator('#spiral-hypnotic-mute').getAttribute('aria-pressed'),'true');
  await page.waitForFunction(()=>!window.marbleStudio.getState().spiralAudio.active);
  await page.waitForTimeout(150);assert.ok((await page.evaluate(()=>window.marbleStudio.getState().time))>first.time,'Muting must not pause the game');
  await page.keyboard.press('m');await page.waitForFunction(()=>window.marbleStudio.getState().spiralAudio.active);
  const beforeOff=await page.evaluate(()=>window.marbleStudio.getState().time);await page.locator('#spiral-hypnotic').uncheck();
  assert.ok((await page.evaluate(()=>window.marbleStudio.getState().time))>=beforeOff,'Changing sound must not reset the race');
  assert.ok(await page.locator('#collision-sound').isVisible());
  await page.locator('#spiral-hypnotic').check();await page.locator('#pause').click();
  await page.waitForFunction(()=>!window.marbleStudio.getState().spiralAudio.active);
  await page.locator('#nav-statistics').click();await page.keyboard.press('m');
  assert.equal(await page.evaluate(()=>window.marbleStudio.getState().spiralHypnoticMuted),false,'M belongs only to the visible Spiral workspace');
  await page.locator('#nav-track').click();assert.ok(await page.locator('#spiral-hypnotic-field').isHidden());
  assert.ok(await page.locator('#collision-sound').isVisible());
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);
  await page.evaluate(()=>document.querySelector('#nav-spiral').onclick());
  assert.ok(await page.locator('#spiral-hypnotic').isChecked());assert.equal(await page.evaluate(()=>window.audioContextCount),0,'A saved option must not bypass autoplay');
  await page.locator('#spiral-hypnotic-mute').click();await page.locator('#spiral-hypnotic-mute').click();
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/spiral-hypnotic-controls.png',fullPage:true});
  await page.setViewportSize({width:1366,height:1000});
  await page.locator('#studio-works').click();await page.locator('#work-name').fill('Sound');await page.keyboard.press('m');
  assert.equal(await page.locator('#work-name').inputValue(),'Soundm');assert.equal(await page.evaluate(()=>window.marbleStudio.getState().spiralHypnoticMuted),false);
  await page.locator('#works-dialog [data-wb-close]').click();
  // The synthesized soundtrack is recorded even with legacy sound/music off.
  await page.evaluate(()=>{document.querySelector('#sound').checked=false;document.querySelector('#music-track').value='';document.querySelector('#music-track').dispatchEvent(new Event('change'));});
  const playedBeforeRecording=await page.evaluate(()=>window.marbleStudio.getState().spiralAudio.played);
  await page.getByText('İzleme ve kayıt',{exact:true}).click();
  await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();
  await page.locator('#race').scrollIntoViewIfNeeded();
  await page.waitForFunction(played=>{const s=window.marbleStudio.getState();return s.recording&&s.time>2.1&&s.spiralAudio?.played>played;},playedBeforeRecording);
  assert.equal(await page.evaluate(()=>window.hypnoticRecordingStreams.at(-1).getAudioTracks().length),1);
  assert.ok(await page.locator('#spiral-hypnotic').isDisabled());
  await page.keyboard.press('m');await page.waitForFunction(()=>window.marbleStudio.getState().spiralHypnoticMuted);await page.keyboard.press('m');
  const download=page.waitForEvent('download',{timeout:10000});await page.locator('#record').click();
  await download.catch(async error=>{console.log(await page.evaluate(()=>({events:window.hypnoticRecordingEvents,toast:document.querySelector('#toast').textContent,state:window.marbleStudio.getState().recording,tracks:window.hypnoticRecordingStreams.map(s=>s.getTracks().map(t=>({kind:t.kind,state:t.readyState}))) })));throw error;});
  assert.ok(await page.evaluate(()=>window.hypnoticRecordingStreams.every(stream=>stream.getTracks().every(track=>track.readyState==='ended'))));
  const audio=await page.evaluate(async()=>{
    const {SpiralHypnoticAudio,renderHypnoticWav}=await import('/src/spiral-hypnotic-audio.js');
    const context=new OfflineAudioContext(2,48000*4,48000),engine=new SpiralHypnoticAudio(context,{offline:true});engine.setEnabled(true);engine.setActive(true);
    const notes=[];for(let i=0;i<40;i++)notes.push(engine.hit({type:'ice',progress:i/40,x:515},i*.015));
    const state=engine.state(),rendered=await context.startRendering();
    const energy=c=>rendered.getChannelData(c).reduce((sum,x)=>sum+x*x,0);
    let peak=0,jump=0;for(const data of [rendered.getChannelData(0),rendered.getChannelData(1)])for(let i=1;i<data.length;i++){peak=Math.max(peak,Math.abs(data[i]));jump=Math.max(jump,Math.abs(data[i]-data[i-1]));}
    const events=[{type:'ice',time:.2,x:60,progress:0},{type:'ice',time:.25,x:515,progress:.4},{type:'ice',time:.4,x:270,progress:.9},{type:'impact',time:.8,x:270}];
    const wav=await renderHypnoticWav(events,4),replay=await renderHypnoticWav(events,4),pad=await renderHypnoticWav(events,4,{effects:false});
    // Offline Web Audio can round the processing tail slightly differently.
    // Compare PCM amplitude instead of requiring identical encoded bytes.
    const first=atob(wav),second=atob(replay),sample=(s,i)=>{const n=s.charCodeAt(i)|(s.charCodeAt(i+1)<<8);return n<32768?n:n-65536;};
    let replayDelta=0;for(let i=44;i<first.length;i+=2)replayDelta=Math.max(replayDelta,Math.abs(sample(first,i)-sample(second,i)));
    return {notes,state,peak,jump,energy:[energy(0),energy(1)],wav,replayDelta,padDifferent:wav!==pad};
  });
  assert.ok(audio.state.peakVoices<=8);assert.ok(audio.state.stolenVoices>0);assert.ok(audio.peak>0&&audio.peak<.8);assert.ok(audio.jump<.1);
  assert.ok(audio.energy[1]>audio.energy[0]);assert.ok(audio.replayDelta<64);assert.ok(audio.padDifferent);
  for(const note of audio.notes)assert.ok(note.delay<=.12+1e-9);
  const generated=await productionAudio({events:{effects:[],leaders:[]},recipe:{mode:'spiral',spiralHypnotic:true},duration:4,audio:'effects',generatedAudio:audio.wav});
  assert.equal(generated.buffer.readUInt16LE(22),2);assert.equal(generated.buffer.readUInt32LE(24),48000);
  await writeFile('artifacts/spiral-hypnotic-preview.wav',generated.buffer);
  // A real spiral export captures spatial progress without changing the game.
  await page.goto((origin+'/factory-render.html'));await page.waitForFunction(()=>window.factoryRenderer);
  const exported=await page.evaluate(async()=>{
    const recipe={mode:'spiral',seed:2048,count:1,spiralHypnotic:true},analysis=window.factoryRenderer.probe(recipe);
    await window.factoryRenderer.begin({recipe,analysis,fps:30,speed:1,copy:{hook:'Test'}});
    window.factoryRenderer.frame(60);const events=window.factoryRenderer.audio();
    const wav=await window.factoryRenderer.hypnoticAudio(3,'effects');return {events,bytes:atob(wav).length};
  });
  assert.ok(exported.events.effects.some(e=>e.type==='ice'&&e.progress>0&&e.progress<1));assert.equal(exported.bytes,44+3*48000*4);
  assert.deepEqual(errors,[]);
  console.log('PASS: opt-in, trusted-gesture unlock, M/mute without game reset, pause/mode isolation, saved settings, mobile, real Web Audio synthesis, eight-voice stealing, soft stereo output, reproducible WAV and production integration.');
}finally{await browser.close();}
