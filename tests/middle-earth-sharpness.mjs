import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1400,height:850}});
 await page.route('**/sharpness-check',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0"></body>'}));
 await page.goto('http://127.0.0.1:5173/sharpness-check');
 const result=await page.evaluate(async()=>{
  const {Battle}=await import('/src/crown-battle.js');
  const {BattleRenderer}=await import('/src/crown-battle-renderer.js');
  const {MIDDLE_EARTH_UNITS}=await import('/src/middle-earth-units.js');
  const {middleEarthArtReady}=await import('/src/middle-earth-painted-art.js');await middleEarthArtReady;
  const ids=['viking','kipchak',...MIDDLE_EARTH_UNITS.map(u=>u.id)];
  const army=Object.fromEntries(ids.map(id=>[id,5]));
  const battle=new Battle({historicalArmies:[army,{roman:1}],seed:1});
  const canvas=document.createElement('canvas');document.body.append(canvas);
  const renderer=new BattleRenderer(canvas,battle);renderer.resize(1400,850,true,1);
  renderer.view={x:300,y:480,zoom:1.4};
  const screen=(x,y)=>renderer.screenToWorld(x/1400,y/850);
  const poses=[];let pages=0;const passes=[];
  // All 36 types, both facing directions, all walk/attack frames. Prepare
  // cache entries synchronously here so the test measures residency, not RAF.
  for(let pass=0;pass<3;pass++){
   const revision=renderer.spriteCache?.pageRevision||0;let missing=0;
   for(const action of ['walk','attack'])for(let f=0;f<8;f++){
   renderer.sprites.endFrame();renderer.spriteCache?.beginFrame(3);
   renderer.framePoses?.clear();
   for(const u of battle.units){
    Object.assign(u,{moving:action==='walk',attack:action==='attack'?.24*(1-f/8):0,phase:0,face:u.id%2?1:-1});
    battle.time=f/11;
    const entry=renderer.cachedSprite(u);if(entry)poses.push(entry.resolution);else missing++;
   }
   pages=Math.max(pages,renderer.spriteCache.pages.length);
   }
   passes.push({pass,pageAllocations:renderer.spriteCache.pageRevision-revision,missing});
  }
  // A real renderer scene: same zoom for history, heroes, cavalry and giants.
  const shown=['viking','me_gondor_swordsman','me_aragorn','me_legolas','me_gimli','me_witch_king','me_sauron','kipchak','me_rohirrim','me_dwarf_ram_rider','me_azog_warg','me_balrog','me_mumakil','me_ent'];
  const locations=[[65,165],[180,165],[295,165],[410,165],[525,165],[650,165],[810,165],[75,345],[255,345],[430,345],[620,345],[150,770],[580,770],[1100,770]];
  const used=new Set();
  for(const u of battle.units){
   const i=shown.indexOf(u.type);u.removed=i<0||used.has(u.type);used.add(u.type);
   if(!u.removed)Object.assign(u,{...screen(...locations[i]),face:1,moving:false,attack:0});
  }
  battle.time=0;renderer.invalidate();
  for(let i=0;i<45;i++)renderer.render();
  const g=canvas.getContext('2d');g.setTransform(1,0,0,1,0,0);g.fillStyle='#ffffff';g.font='14px sans-serif';
  shown.forEach((id,i)=>g.fillText(id.replace('me_',''),locations[i][0]-40,locations[i][1]+27));
  const density=Object.fromEntries(shown.map(id=>{const u=battle.units.find(u=>u.type===id);const s=renderer.sprites.get(id,0,0,'idle',0);return[id,{source:s.width/80,atlas:renderer.sourceResolution(s,u.visualScale||((MIDDLE_EARTH_UNITS.find(x=>x.id===id)?.combat.visualScale)||1))}];}));
  return {pages,poseEntries:poses.length,density,passes};
 });
 assert.ok(result.pages<=16);assert.ok(result.poseEntries>1000);
 assert.ok(result.passes.every(p=>p.missing===0),'All poses must remain visible');
 assert.equal(result.passes.at(-1).pageAllocations,0,'Repeated warmed roster must stop replacing atlas pages');
 for(const id of ['me_balrog','me_mumakil']){assert.equal(result.density[id].source,6);assert.ok(result.density[id].atlas>=4.5);}
 await page.locator('canvas').first().screenshot({path:'artifacts/middle-earth/sharp-battlefield.jpg',type:'jpeg',quality:88});
 await fs.writeFile('artifacts/middle-earth/sharpness-checks.json',JSON.stringify(result,null,2));
 console.log('PASS dense mixed roster, source/atlas giant density, atlas page cap:',JSON.stringify(result));
} finally {await browser.close();}
