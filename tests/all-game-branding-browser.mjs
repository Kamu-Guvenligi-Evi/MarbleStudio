import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const origin=process.env.STUDIO_ORIGIN||'http://127.0.0.1:5174';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext();
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.addInitScript(()=>{
  window.canvasCopy=new Map();
  window.visibleChannelTitles=new Set();
  const fill=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(value,...args){
    if(this.canvas.id&&this.canvas.isConnected){
      if(!window.canvasCopy.has(this.canvas.id))window.canvasCopy.set(this.canvas.id,new Set());
      const values=window.canvasCopy.get(this.canvas.id);if(values.size<400)values.add(String(value));
    }
    const check=this.canvas.isConnected&&/^@(LastBallStand|VortexBallSpiral|Clipverseuni)$/.test(value)&&!window.visibleChannelTitles.has(value);
    if(!check)return fill.call(this,value,...args);
    const point=new DOMPoint(args[0],args[1]).matrixTransform(this.getTransform());
    const top=Math.max(0,Math.floor(point.y-48)),height=Math.min(96,this.canvas.height-top);
    if(height<=0)return fill.call(this,value,...args);
    const before=this.getImageData(0,top,this.canvas.width,height).data;
    fill.call(this,value,...args);
    const after=this.getImageData(0,top,this.canvas.width,height).data;
    if(after.some((v,i)=>v!==before[i]))window.visibleChannelTitles.add(value);
  };
});
const games=['track','arena','territory','spiral','pi','statistics','ball-duel','spiral-breaker','glass-breaker','ring-escape','rock-paper-scissors'];
try{
  for(const [index,game] of games.entries()){
    await page.goto(origin+(index<6?'/?mode='+game:'/'+game+'.html'));
    const picker=page.locator('#studio-channel');await picker.waitFor();
    assert.deepEqual(await picker.locator('option').allTextContents(),['@LastBallStand','@VortexBallSpiral','@Clipverseuni']);
    if(index>0)assert.equal(await picker.inputValue(),'Clipverseuni',game+' persists across games');
    await page.evaluate(()=>window.canvasCopy.clear());
    await picker.selectOption('VortexBallSpiral');
    await page.waitForFunction(()=>[...window.canvasCopy.values()].some(values=>values.has('@VortexBallSpiral')));
    await page.waitForFunction(()=>window.visibleChannelTitles.has('@VortexBallSpiral'));
    await page.evaluate(()=>window.canvasCopy.clear());
    await picker.selectOption('Clipverseuni');
    await page.waitForFunction(()=>[...window.canvasCopy.values()].some(values=>values.has('@Clipverseuni')));
    await page.waitForFunction(()=>window.visibleChannelTitles.has('@Clipverseuni'));
    const copy=await page.evaluate(()=>[...window.canvasCopy.values()].flatMap(values=>[...values]));
    assert.ok(!copy.some(t=>/MARBLE\s*\/?\s*STUDIO|M A R B L E|TAP TO ADD|Pick your|CUT AN OPEN TRAIL|TOUCH THE WALL|HALKA KALDI|DURAKLATILDI|KAZANDI|ZİNCİRLEME/i.test(t)),game+' clean viewer copy');
    console.log(game+': channel selector, live title, persistence and viewer copy passed');
  }
  await page.reload();assert.equal(await page.locator('#studio-channel').inputValue(),'Clipverseuni');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.locator('#studio-channel').isVisible());
  await page.goto(origin+'/factory-render.html');
  const states=await page.evaluate(async()=>{
    const {RingEscape}=await import('/src/ring-escape.js'),{renderRingEscape}=await import('/src/ring-escape-renderer.js');
    const {RockPaperScissors}=await import('/src/rock-paper-scissors.js'),{renderRps}=await import('/src/rock-paper-scissors-renderer.js');
    const {BallDuel}=await import('/src/ball-duel.js'),{renderDuel}=await import('/src/ball-duel-renderer.js');
    const canvas=document.querySelector('#render');canvas.width=1080;canvas.height=1920;
    const ctx=canvas.getContext('2d'),results={};
    const capture=(name,draw)=>{ctx.resetTransform();window.canvasCopy.clear();draw();results[name]=[...window.canvasCopy.values()].flatMap(values=>[...values]);};
    const options={channel:'LastBallStand'},ring=new RingEscape(),rps=new RockPaperScissors(),duel=new BallDuel();
    capture('ringPause',()=>renderRingEscape(ctx,ring,{...options,paused:true}));
    ring.state='won';ring.broken=ring.settings.count;capture('ringWon',()=>renderRingEscape(ctx,ring,options));
    ring.state='timeout';capture('ringTimeout',()=>renderRingEscape(ctx,ring,options));
    capture('rpsPause',()=>renderRps(ctx,rps,rps.settings,{...options,paused:true}));
    rps.state='won';rps.winner='rock';capture('rpsWon',()=>renderRps(ctx,rps,rps.settings,options));
    rps.winner=null;capture('rpsDraw',()=>renderRps(ctx,rps,rps.settings,options));
    capture('duelPause',()=>renderDuel(ctx,duel,{...options,paused:true}));
    duel.state='finished';duel.winner=0;capture('duelWon',()=>renderDuel(ctx,duel,options));
    duel.winner=null;capture('duelDraw',()=>renderDuel(ctx,duel,options));
    return results;
  });
  for(const [name,texts] of Object.entries(states)){
    assert.ok(texts.includes('@LastBallStand'),name+' explicit export channel overrides live selection');
    assert.ok(!texts.includes('@Clipverseuni'),name+' keeps export channel');
    assert.doesNotMatch(texts.join('\n'),/DURAKLATILDI|KAZANDI|BERABERE|TAMAMLANDI|HALKA|Silahsız/);
  }
  assert.ok(states.ringWon.includes('ESCAPED!'));assert.ok(states.ringTimeout.includes('TIME UP'));
  assert.ok(states.rpsWon.includes('ROCK WINS'));assert.ok(states.rpsDraw.includes('DRAW'));
  assert.ok(states.duelPause.includes('PAUSED'));assert.ok(states.duelDraw.includes('Draw'));
  console.log('English pause/results and explicit export channels passed');
  assert.equal(errors.length,0,errors.join('\n'));
}finally{await browser.close();}
