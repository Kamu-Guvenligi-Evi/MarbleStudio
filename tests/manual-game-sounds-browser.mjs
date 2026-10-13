import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {sourceRecipe,validateBatch} from '../src/factory-recipes.js';
const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5174';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  for(const [mode,event,api] of [['glass-breaker','wave','glassBreaker'],['spiral-breaker','multiply','spiralBreaker'],['ball-duel','heal','duelStudio'],['ring-escape','break','ringStudio']]){
    const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/'+mode+'.html');await page.waitForFunction(api=>!!window[api],api);
    await page.getByText('Ses ve müzik',{exact:true}).click();
    assert.ok(await page.getByRole('heading',{name:'Ses menüsü',exact:true}).isVisible());
    assert.equal(await page.locator('#all-game-sounds option[value="resolve"]').evaluate(el=>el.parentElement.label),'Ses efektleri ve müzikal sesler');
    assert.equal(await page.locator('#all-game-sounds option[value="bruh"]').evaluate(el=>el.parentElement.label),'Konuşma ve tepki sesleri');
    await page.selectOption('#all-game-sounds','bonk');
    assert.ok(await page.locator('[data-sound-event]').evaluateAll(selects=>selects.every(select=>select.value==='bonk')));
    if(mode==='ring-escape'&&await page.locator('#sound').getAttribute('aria-pressed')!=='true')await page.click('#sound');
    await page.getByRole('button',{name:'Seçili efekti dinle',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.sound-menu-status').textContent==='Ön dinleme');
    await page.reload();await page.waitForFunction(api=>!!window[api],api);
    await page.getByText('Ses ve müzik',{exact:true}).click();
    assert.equal(await page.locator('#all-game-sounds').inputValue(),'bonk');
    await page.selectOption('#all-game-sounds','off');
    assert.ok(await page.locator('[data-sound-event]').evaluateAll(selects=>selects.every(select=>select.value==='off')));
    assert.ok(await page.getByRole('button',{name:'Seçili efekti dinle',exact:true}).isDisabled());
    await page.getByRole('button',{name:'Orijinal seslerle başla',exact:true}).click();
    await page.locator('.manual-sounds summary').click();
    await page.selectOption('#manual-sound-'+event,'bonk');
    assert.equal(await page.locator('#all-game-sounds').inputValue(),'mixed');
    const other=mode==='glass-breaker'?'ice':mode==='spiral-breaker'?'brick':mode==='ball-duel'?'shot':'hit';
    assert.equal(await page.locator('#manual-sound-'+other).inputValue(),mode==='ring-escape'?'original':'inherit');
    if(mode==='ring-escape'&&await page.locator('#sound').getAttribute('aria-pressed')!=='true')await page.click('#sound');
    const row=page.locator('.manual-sound-row').filter({has:page.locator('#manual-sound-'+event)});
    await row.getByRole('button').click();
    await page.waitForFunction(()=>document.querySelector('.manual-sounds [role=status]').textContent==='Ön dinleme');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Manual controls fit mobile');
    await page.reload();await page.waitForFunction(api=>!!window[api],api);await page.getByText('Ses ve müzik',{exact:true}).click();await page.locator('.manual-sounds summary').click();
    assert.equal(await page.locator('#manual-sound-'+event).inputValue(),'bonk','Manual selection survives reload');
    if(mode!=='ring-escape'){
      assert.equal(await page.locator('#game-sound-style').inputValue(),'original');
      await page.selectOption('#game-sound-style','reactions');
      assert.equal(await page.locator('#manual-sound-'+event).inputValue(),'bonk','Preset leaves manual selection intact');
    }
    await page.selectOption('#manual-sound-'+event,'off');await row.getByRole('button').click();
    assert.match(await page.locator('.manual-sounds [role=status]').textContent(),/kapalı/);
    assert.deepEqual(errors,[]);await context.close();console.log('PASS: '+mode+' original preset, partial override, preview, mute choice, persistence and mobile.');
  }
  const page=await browser.newPage();await page.goto(origin+'/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
  for(const [mode,event,contact] of [['glass-breaker','wave','ice'],['spiral-breaker','break','brick'],['ball-duel','hit','shot']]){
    const recipe=sourceRecipe(validateBatch({source:{mode,project:{seed:42,sound:true,soundStyle:'original',soundOverrides:{[event]:'bonk',[contact]:'off'}}}}).source,42);
    const effects=await page.evaluate(async recipe=>{
      const r=window.factoryRenderer,analysis=r.probe(recipe);await r.begin({recipe,analysis,speed:2,intro:1,width:180,height:320,fps:30,template:'minimal',copy:{hook:''},channel:''});r.frame(Math.ceil((analysis.simulationSeconds/2+2)*30));
      return r.audio().effects.map(e=>({type:e.type,originalType:e.originalType,duelSound:e.duelSound,voice:e.cue?.voice,clip:e.clip}));
    },recipe);
    assert.ok(effects.some(e=>e.voice==='bonk'&&e.type==='directed'),mode+' exports manual cue');
    assert.ok(!effects.some(e=>e.originalType===contact),mode+' omits muted event');
    if(mode==='spiral-breaker')assert.ok(effects.some(e=>e.type==='reference'),'Unassigned original WAV clips remain in the video');
    console.log('PASS: '+mode+' real renderer respects partial choices and silence.');
  }
  const ring=await page.evaluate(async()=>{
    const {RingAudio}=await import('/src/ring-escape-audio.js'),{ringSoundTrace}=await import('/src/ring-sound-trace.js'),{localPlan}=await import('/src/sound-plan.js');
    const settings={sound:true,music:'off',speed:1,musicVolume:.5,effectsVolume:.5,soundOverrides:{hit:'original',break:'bonk',win:'yippee',timeout:'off'}};
    const trace=ringSoundTrace({seed:6}),audio=new RingAudio(settings);await audio.unlock(false);audio.setScore({source:'local',plan:localPlan(trace)},trace);audio.director.sync(0,true);
    let original=0;const originalEvent=audio.originalEvent.bind(audio);audio.originalEvent=e=>{original++;originalEvent(e);};
    audio.event({type:'hit',time:0});audio.event({type:'break',time:.1});
    const before=audio.director.eventIndex;await audio.previewEvent('break');const after=audio.director.eventIndex;
    const result={original,before,after,voices:audio.tones.size,stream:audio.capture.stream.getAudioTracks().length};audio.stop();result.stopped=audio.tones.size;await audio.context.close();return result;
  });
  assert.equal(ring.original,1);assert.equal(ring.before,2);assert.equal(ring.after,2,'Preview does not advance the score');assert.ok(ring.voices>0);assert.equal(ring.stream,1);assert.equal(ring.stopped,0);
  console.log('PASS: Ring original and manual voices share the recording bus; preview preserves event ordering and stop clears voices.');
}finally{await browser.close();}
