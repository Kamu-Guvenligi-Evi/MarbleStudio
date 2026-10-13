import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {SPIRAL_THEMES} from '../src/spiral-themes.js';
import {normalizeProject,serializeProject,parseProject} from '../src/projects.js';
import {copyFor,validateBatch} from '../src/factory-recipes.js';
import {automaticCandidate} from '../scripts/production-automation.mjs';

assert.equal(Object.keys(SPIRAL_THEMES).length,12);
for(const [id,theme] of Object.entries(SPIRAL_THEMES)){
  const project=normalizeProject({name:theme.name,mode:'spiral',spiralTheme:id,count:1,sequence:[]});
  assert.equal(parseProject(serializeProject(project)).spiralTheme,id);
  assert.ok(copyFor({mode:'spiral',theme:id,seed:2048},'en').title.startsWith(theme.englishName+' — '));
}
const options={...validateBatch({modes:['spiral']}),automation:{rosterCategory:'colors',ballNames:[],ballImages:[],music:{mode:'fixed',track:'',volume:25}}};
for(const theme of ['wood','honey','marble','copper','sand','coral']){
  const guard={check:r=>({allowed:r.theme===theme})};
  assert.equal(automaticCandidate(options,42,[],[],guard).theme,theme,'Automatic generation must reach every new material');
}
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1160,height:1640}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  const results=await page.evaluate(async()=>{
    const {Spiral}=await import('/src/spiral.js');
    const {SPIRAL_THEMES}=await import('/src/spiral-themes.js');
    const {spiralMaterial,drawMaterialParticle}=await import('/src/spiral-materials.js');
    const {renderSpiral}=await import('/src/spiral-renderer.js');
    const sheet=document.createElement('main');sheet.id='material-sheet';
    sheet.style='position:absolute;left:0;top:0;z-index:999999;background:#080e15;padding:24px;display:grid;grid-template-columns:repeat(3,360px);gap:16px;color:#ecf7ff;font:600 17px Arial';document.body.append(sheet);
    const results=[];
    for(const [id,theme] of Object.entries(SPIRAL_THEMES)){
      const race=new Spiral({theme:id,seed:2048}),control=new Spiral({theme:id,seed:2048});
      race.balls=[];race.multipliers=[];
      const canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;const ctx=canvas.getContext('2d');
      const snapshot=JSON.stringify([race.time,race.ice.remaining,race.ice.revision,race.state]);
      renderSpiral(ctx,race);const intact=canvas.toDataURL(),stateUnchanged=snapshot===JSON.stringify([race.time,race.ice.remaining,race.ice.revision,race.state]);
      const sample=(x,y)=>[...ctx.getImageData(x,y,1,1).data];
      const contact=race.ice.contact(275,716,10),far=sample(270,480);
      race.ice.chip(contact,()=>.5);renderSpiral(ctx,race);
      const hole=sample(contact.x,contact.y),farAfter=sample(270,480);
      const crop=document.createElement('canvas');crop.width=crop.height=540;crop.getContext('2d').drawImage(canvas,0,210,540,540,0,0,540,540);crop.style='width:360px;height:360px';
      const tile=document.createElement('section'),label=document.createElement('p');label.textContent=theme.name;label.style='margin:0 0 10px';tile.append(label,crop);
      const debris=document.createElement('canvas');debris.width=540;debris.height=48;debris.style='width:360px;height:32px';const dc=debris.getContext('2d');
      for(let i=0;i<14;i++)drawMaterialParticle(dc,{x:18+i*38,y:24,size:7,life:1,rotation:i*.7,white:i%3===0},theme);
      tile.append(debris);sheet.append(tile);
      race.ice.clear();renderSpiral(ctx,race);const clear=sample(contact.x,contact.y);
      const material=spiralMaterial(theme),data=material.getContext('2d').getImageData(400,700,128,128).data,colors=new Set();
      for(let i=0;i<data.length;i+=4)colors.add((data[i]>>3)+','+(data[i+1]>>3)+','+(data[i+2]>>3));
      results.push({id,intact,hole,clear,far,farAfter,colors:colors.size,cached:spiralMaterial(theme)===material,rngUnchanged:race.rng()===control.rng(),stateUnchanged});
    }
    // A skin change on an already damaged field must retain the hole.
    const race=new Spiral();race.balls=[];race.multipliers=[];const contact=race.ice.contact(275,716,10);race.ice.chip(contact,()=>.5);
    const canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;const ctx=canvas.getContext('2d');
    const holes=[];for(const id of Object.keys(SPIRAL_THEMES)){race.theme=id;renderSpiral(ctx,race);holes.push([...ctx.getImageData(contact.x,contact.y,1,1).data]);}
    return {results,holes};
  });
  await page.locator('#material-sheet').screenshot({path:'artifacts/spiral-materials.png'});
  // Downsampling the transparent texture can round background channels by one.
  const samePixel=(a,b)=>a.every((value,i)=>Math.abs(value-b[i])<=2);
  assert.equal(new Set(results.results.map(r=>r.intact)).size,12,'Every material must have its own appearance');
  for(const r of results.results){
    assert.ok(samePixel(r.hole,r.clear),r.id+': removed material must stay empty, including light effects: '+JSON.stringify([r.hole,r.clear]));
    assert.deepEqual(r.far,r.farAfter,r.id+': local fracture must preserve distant material');
    assert.ok(r.colors>15,r.id+': surface must contain actual texture detail');
    assert.ok(r.cached&&r.rngUnchanged&&r.stateUnchanged,r.id+': rendering must reuse material and preserve physics');
  }
  assert.ok(results.holes.every((hole,i)=>samePixel(hole,results.results[i].clear)),'Changing the skin must preserve the removed material');
  await page.goto('http://127.0.0.1:5173/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
  const exports=await page.evaluate(async()=>{
    const frames=[];
    for(const theme of ['lava','candy','cosmic','wood','honey','copper']){
      await window.factoryRenderer.begin({recipe:{mode:'spiral',theme,count:1,seed:2048},fps:240,width:540,height:960,speed:1,intro:0,analysis:{simulationSeconds:30},copy:{hook:'Test'}});
      frames.push(window.factoryRenderer.frame(240));
    }
    return frames;
  });
  assert.equal(new Set(exports).size,6,'Exported video must use the selected material');
  assert.deepEqual(errors,[]);
  console.log('PASS: 12 distinct textured materials, material debris, permanent fracture masks, cached surfaces, unchanged physics RNG, saved themes, automatic candidates, English titles and 240 FPS video frames.');
}finally{await browser.close();}
