import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {sourceRecipe,validateBatch} from '../src/factory-recipes.js';
const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5174';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  for(const [mode,api,restart] of [['spiral-breaker','spiralBreaker','restart'],['glass-breaker','glassBreaker','restart'],['ball-duel','duelStudio','replay']]){
    const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`${origin}/${mode}.html`);
    await page.waitForFunction(api=>window[api]?.getAudioState,api);
    await page.selectOption('#game-sound-style','reactions');
    if(await page.locator('#sound').getAttribute('aria-pressed')!=='true')await page.click('#sound');
    await page.click('#'+restart);
    await page.waitForFunction(api=>window[api].getAudioState().played>0,api);
    await page.click('#pause');
    const paused=await page.evaluate(api=>window[api].getAudioState(),api);
    assert.equal(paused.active,0,mode+' pause stops current voices');
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(api=>window[api].getAudioState().played,api),paused.played);
    await page.click(mode==='ball-duel'?'#pause':'#resume');
    await page.click('#sound');
    const muted=await page.evaluate(api=>window[api].getAudioState().played,api);
    await page.click('#'+restart);
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(api=>window[api].getAudioState().played,api),muted,'Muted replay is silent');
    await page.click('#sound');
    await page.waitForFunction(({api,played})=>window[api].getAudioState().played>played,{api,played:muted});
    for(const style of ['balanced','meme','reactions']){
      await page.selectOption('#game-sound-style',style);
      const state=await page.evaluate(api=>window[api].getAudioState(),api);
      assert.equal(state.soundStyle??state.style,style);
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Controls fit a phone');
    await page.reload();await page.waitForFunction(api=>window[api]?.getAudioState,api);
    assert.equal(await page.locator('#game-sound-style').inputValue(),'reactions','Preset persists');
    assert.deepEqual(errors,[]);await context.close();
    console.log('PASS: '+mode+' live audio, mute, pause, replay, 3 presets, persistence and mobile controls.');
  }
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
  // Exercise the actual offscreen game adapters with sped-up output and an intro.
  for(const mode of ['glass-breaker','spiral-breaker','ball-duel']){
    const recipe=sourceRecipe(validateBatch({source:{mode,project:{seed:42,sound:true,soundStyle:'reactions'}}}).source,42);
    const result=await page.evaluate(async recipe=>{
      const renderer=window.factoryRenderer,analysis=renderer.probe(recipe);
      await renderer.begin({recipe,analysis,speed:2,intro:1,width:180,height:320,fps:30,template:'minimal',copy:{hook:''},channel:''});
      renderer.frame(Math.ceil((analysis.simulationSeconds/2+2)*30));
      const effects=renderer.audio().effects;
      return {count:effects.length,voices:[...new Set(effects.map(e=>e.cue?.voice))],finite:effects.every(e=>Number.isFinite(e.time)&&e.time>=1),finals:effects.filter(e=>e.priority===3).length,complete:renderer.result().complete,gameComplete:analysis.gameComplete??true};
    },recipe);
    assert.ok(result.count>0&&result.finite&&result.complete,JSON.stringify({mode,result}));
    assert.ok(result.voices.some(v=>['bubble-pop','bonk','anime-wow','bruh'].includes(v)),mode+' renderer uses the selected reaction preset');
    if(result.gameComplete)assert.equal(result.finals,1,mode+' exports one final');
    console.log('PASS: '+mode+' real video adapter, selected voices, speed/intro timing and final.',result.count+' effects');
  }
  // The production player bounds simultaneous long voices and gives the final priority.
  const bounded=await page.evaluate(async()=>{
    const {GameSoundPlayer,createGameSoundDirector}=await import('/src/game-sound-director.js');
    const player=new GameSoundPlayer('glass-breaker','reactions');await player.unlock();
    const cue=createGameSoundDirector('glass-breaker','reactions')({type:'wave'},0);
    for(let i=0;i<100;i++)player.play(cue);
    const crowd=player.state();player.play(createGameSoundDirector('glass-breaker','reactions')({type:'won'},0));
    const final=player.state();player.stop();const stopped=player.state();await player.context.close();
    return {crowd,final,stopped};
  });
  assert.equal(bounded.crowd.active,3);assert.equal(bounded.crowd.skipped,0);assert.equal(bounded.crowd.played,100);assert.equal(bounded.final.active,1);assert.equal(bounded.stopped.active,0);
  assert.deepEqual(errors,[]);console.log('PASS: Web Audio voice limit and final interruption.');
}finally{await browser.close();}
