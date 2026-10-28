import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {SPIRAL_THEMES} from '../src/spiral-themes.js';
import {normalizeProject} from '../src/projects.js';

assert.equal(normalizeProject({name:'Legacy',mode:'spiral',count:1,sequence:[]}).spiralTheme,'ice');
assert.equal(normalizeProject({name:'Invalid',spiralTheme:'missing',sequence:[]}).spiralTheme,'ice');
assert.equal(normalizeProject({sequence:[]}).spiralBackground,true);
assert.equal(normalizeProject({sequence:[],spiralBackground:false}).spiralBackground,false);
const browser=await chromium.launch({channel:'chrome',headless:true});
const lastTheme=Object.keys(SPIRAL_THEMES).at(-1);
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173?edit=1');
  await page.waitForFunction(()=>window.marbleStudio);
  assert.ok(await page.locator('#spiral-theme-field').isHidden());
  await page.locator('#nav-spiral').click();
  assert.equal(await page.locator('#spiral-theme').inputValue(),'ice');
  for(const [id,theme] of Object.entries(SPIRAL_THEMES)){
    await page.locator('#spiral-theme').selectOption(id);
    const state=await page.evaluate(()=>window.marbleStudio.getState());
    assert.equal(state.spiralTheme,id);assert.equal(state.state,'ready');
    assert.equal(await page.locator('#race-description').textContent(),theme.description);
  }
  const before=await page.evaluate(()=>window.marbleStudio.getState());
  await page.locator('#spiral-background').uncheck();
  const after=await page.evaluate(()=>window.marbleStudio.getState());
  assert.equal(after.spiralBackground,false);assert.deepEqual(after.positions,before.positions);
  assert.equal(after.seed,before.seed);
  await page.locator('#nav-arena').click();
  assert.ok(await page.locator('#spiral-background-field').isHidden());
  assert.ok(await page.locator('#spiral-theme-field').isHidden());
  await page.locator('#nav-spiral').click();
  assert.equal(await page.locator('#spiral-theme').inputValue(),lastTheme);
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#nav-spiral').click();
  assert.equal(await page.locator('#spiral-theme').inputValue(),lastTheme);
  assert.equal(await page.locator('#spiral-background').isChecked(),false);
  await page.locator('#spiral-background').check();
  assert.equal((await page.evaluate(()=>window.marbleStudio.getState())).spiralBackground,true);
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.setViewportSize({width:900,height:1080});
  await page.evaluate(async()=>{
    const {Spiral}=await import('/src/spiral.js');
    const {SPIRAL_THEMES}=await import('/src/spiral-themes.js');
    const {renderSpiral}=await import('/src/spiral-renderer.js');
    const probe=document.createElement('canvas');probe.width=540;probe.height=960;
    const off=new Spiral({theme:'alien',spiralBackground:false}),pc=probe.getContext('2d');
    renderSpiral(pc,off);const plain=Array.from(pc.getImageData(0,480,1,1).data);
    if(plain.join(',')!=='8,13,21,255')throw Error('Background was not removed');
    const first=probe.toDataURL();off.spiralBackground=true;renderSpiral(pc,off);
    if(first===probe.toDataURL())throw Error('Background toggle has no visible effect');
    document.body.insertAdjacentHTML('beforeend','<main id="theme-sheet" style="position:absolute;top:0;left:0;z-index:99999;display:grid;grid-template-columns:repeat(3,270px);gap:18px;padding:20px;background:#080d15;width:864px"></main>');
    for(const [id,theme] of Object.entries(SPIRAL_THEMES)){
      const tile=document.createElement('div'),label=document.createElement('div'),canvas=document.createElement('canvas');
      label.textContent=theme.name;label.style='color:#e9eef5;font:600 17px Arial;padding:12px 0';
      canvas.width=540;canvas.height=960;canvas.style='width:270px;height:480px;border-radius:12px';
      const race=new Spiral({theme:id});race.start();race.step(4500);
      renderSpiral(canvas.getContext('2d'),race);
      tile.append(label,canvas);document.querySelector('#theme-sheet').append(tile);
    }
  });
  await page.locator('#theme-sheet').screenshot({path:'artifacts/spiral-theme-collection.png'});
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${Object.keys(SPIRAL_THEMES).length} themes, legacy defaults, persistence, mode isolation, mobile layout and rendering.`);
}finally{await browser.close();}
