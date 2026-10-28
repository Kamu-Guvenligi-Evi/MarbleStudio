import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1200,height:720}});
 await page.route('**/size-check',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0;background:#30443b"></body>'}));
 await page.goto('http://127.0.0.1:5173/size-check');
 const result=await page.evaluate(async()=>{
  await(await import('/src/middle-earth-painted-art.js')).middleEarthArtReady;
  const {SpriteLibrary}=await import('/src/crown-battle-art.js');
  const {BattleSpriteCache}=await import('/src/crown-battle-sprite-cache.js');
  const {UNIT_TYPES}=await import('/src/crown-battle.js');
  const lib=new SpriteLibrary(),cache=new BattleSpriteCache(),result={};
  const {MIDDLE_EARTH_UNITS}=await import('/src/middle-earth-units.js');
  const ids=['viking','samurai','janissary','spartan','varangian','kipchak',...MIDDLE_EARTH_UNITS.map(u=>u.id)];
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1260;document.body.append(canvas);
  const g=canvas.getContext('2d');g.fillStyle='#30443b';g.fillRect(0,0,1200,1260);
  for(const [i,id]of ids.entries()){
   const source=lib.get(id,0,0,'idle',0),b=cache.boundsOf(source),scale=UNIT_TYPES[id].visualScale||1;
   result[id]={height:(b.bottom-b.top)*scale,width:(b.right-b.left)*scale,base:b.bottom-b.top};
   const x=90+(i%6)*200,y=Math.floor(i/6)*180+145;
   g.fillStyle='#82917b';g.fillRect(x-80,y+2,165,1);
   g.save();g.translate(x,y);g.scale(.85*scale,.85*scale);g.drawImage(source,-30,-61,80,76);g.restore();
   g.fillStyle='#efe8cf';g.font='13px sans-serif';g.fillText(UNIT_TYPES[id].name.slice(0,24),x-70,y+26);
  }
  return result;
 });
 await fs.writeFile('artifacts/middle-earth/size-checks.json',JSON.stringify(result,null,2));
 if(!process.argv.includes('--probe')){
  const h=id=>result[id].height,w=id=>result[id].width;
  assert.equal(Object.keys(result).filter(id=>id.startsWith('me_')).length,36);
  // Viking is the helmet-to-ground infantry reference; taller historical spears
  // and hats are deliberately not treated as human body height.
  for(const id of ['me_aragorn','me_boromir','me_faramir','me_gondor_swordsman','me_gondor_spearman','me_gondor_veteran','me_rohan_warrior','me_legolas','me_elrond','me_haldir','me_lorien_elf','me_gandalf','me_saruman']) {
   assert.ok(h(id)/h('viking')>.95&&h(id)/h('viking')<1.12,`${id}: historical infantry reference`);
  }
  assert.ok(h('me_gimli')/h('me_aragorn')>.6&&h('me_gimli')/h('me_aragorn')<.72);
  for(const id of ['me_dwarf_ram_rider','me_dain']){
   assert.ok(h(id)<h('kipchak')*.85,`${id}: rider must be shorter than Kipchak`);
   assert.ok(w(id)<w('kipchak')*.9,`${id}: mount must be smaller than a horse`);
  }
  assert.ok(h('me_rohirrim')/h('kipchak')>.9&&h('me_rohirrim')/h('kipchak')<1.12);
  assert.ok(h('me_balrog')/h('me_gondor_swordsman')>2.8&&h('me_balrog')/h('me_gondor_swordsman')<3.5);
  for(const id of ['me_nazgul','me_rohirrim','me_gondor_cavalry','me_azog_warg','me_theoden','me_eomer'])assert.ok(Math.abs(h(id)/h('kipchak')-1)<.06,`${id}: historical cavalry reference`);
  for(const id of ['me_elf_stag_rider','me_thranduil'])assert.ok(h(id)>h('kipchak')&&h(id)<h('kipchak')*1.15,id);
  for(const id of ['me_iron_hills_dwarf','me_iron_hills_veteran','me_gimli'])assert.ok(h(id)/h('viking')>.6&&h(id)/h('viking')<.72,id);
  assert.ok(h('me_cave_troll')>h('viking')*1.9&&h('me_cave_troll')<h('viking')*2.2);
  assert.ok(h('me_ent')>h('me_cave_troll')&&h('me_balrog')>h('me_ent')&&h('me_mumakil')>h('me_balrog'));
 }
 await page.locator('canvas').screenshot({path:'artifacts/middle-earth/size-lineup.jpg',type:'jpeg',quality:82});
 if(!process.argv.includes('--probe')){
  await page.route('**/warrior-sprites/middle-earth/*.webp',r=>r.abort());
  await page.reload();
  const fallback=await page.evaluate(async()=>{
   await(await import('/src/middle-earth-painted-art.js')).middleEarthArtReady;
   const {SpriteLibrary}=await import('/src/crown-battle-art.js');
   const {BattleSpriteCache}=await import('/src/crown-battle-sprite-cache.js');
   const {UNIT_TYPES}=await import('/src/crown-battle.js');
   const lib=new SpriteLibrary(),cache=new BattleSpriteCache();
   const {MIDDLE_EARTH_UNITS}=await import('/src/middle-earth-units.js');
   return Object.fromEntries(['kipchak',...MIDDLE_EARTH_UNITS.map(u=>u.id)].map(id=>{
    const b=cache.boundsOf(lib.get(id,0,0,'idle',0));return[id,(b.bottom-b.top)*(UNIT_TYPES[id].visualScale||1)];
   }));
  });
  for(const id of ['me_dwarf_ram_rider','me_dain'])assert.ok(fallback[id]<fallback.kipchak*.85,`fallback ${id}: ${JSON.stringify(fallback)}`);
  for(const [id,height]of Object.entries(fallback))assert.ok(Math.abs(height/result[id].height-1)<.08,`${id}: loading must not change physical scale (${height}/${result[id].height})`);
 }
 console.log(JSON.stringify(Object.fromEntries(Object.entries(result).map(([id,v])=>[id,Math.round(v.height*10)/10]))));
 console.log(process.argv.includes('--probe')?'PROBE':'PASS all 36 units versus historical infantry/cavalry; dwarf and giant proportions; fallback loading scale parity');
} finally {await browser.close();}
