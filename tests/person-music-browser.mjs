import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  const fixtures=await page.evaluate(async()=>{
    const catalog=(await(await fetch('/catalog/manifest.json')).json()).items;
    const names=['Cristiano Ronaldo','Özgür Özel','Arda Güler','Kemal Sunal','Napolyon Bonapart','Shakira'];
    const items=names.map(name=>catalog.find(i=>i.name===name));
    const {prepareCatalogImage}=await import('/src/image-catalog.js');
    const draft=JSON.parse(localStorage.getItem('marble-studio-draft-v2'));
    draft.count=6;draft.mode='track';draft.ballNames=[...names];draft.ballNames[0]='Yeni isim';
    draft.ballImages=[await prepareCatalogImage(items[0]),null,null,null,null,null];
    draft.presentation.countdown=0;draft.sound=false;
    localStorage.setItem('marble-studio-draft-v2',JSON.stringify(draft));
    localStorage.setItem('marble-studio-music-v1',JSON.stringify({mode:'leader',volume:35}));
    const turkey=catalog.find(i=>i.name==='Türkiye').id;
    // A country override must be inherited by fallback people, while personal songs stay intact.
    localStorage.setItem('marble-studio-country-music-v1',JSON.stringify({[turkey]:'country-us'}));
    return {ids:items.map(i=>i.id),turkey};
  });
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);
  assert.equal(await page.locator('#music-country option').count(),163);
  assert.equal(await page.locator('#music-country optgroup').count(),5);
  for(const [index,track] of [[0,'person-ronaldo'],[1,'country-us'],[2,'country-us'],[3,'person-sunal'],[4,'person-napoleon'],[5,'country-co']]){
    await page.locator('#music-country').selectOption(fixtures.ids[index],{force:true});
    assert.equal(await page.locator('#music-country-track').inputValue(),track);
  }
  await page.evaluate(async()=>{
    const {Race}=await import('/src/physics.js'),original=Race.prototype.ranking;
    window.testLeaderId=0;
    Race.prototype.ranking=function(){const ranked=original.call(this),leader=ranked.find(b=>b.id===window.testLeaderId);return leader?[leader,...ranked.filter(b=>b!==leader)]:ranked;};
  });
  await page.locator('#start').click();
  await page.waitForFunction(id=>window.marbleStudio.getState().music.country===id,fixtures.ids[0]);
  for(let i=0;i<fixtures.ids.length;i++){
    await page.evaluate(index=>{window.testLeaderId=index;},i);
    await page.waitForFunction(id=>window.marbleStudio.getState().music.country===id&&window.marbleStudio.getState().music.position>.15,fixtures.ids[i]);
  }
  const previous=await page.evaluate(()=>window.marbleStudio.getState().music.cursors);
  assert.ok(previous[fixtures.ids[1]]>.15&&previous[fixtures.ids[2]]>.15,'Shared fallback has independent person cursors');
  await page.evaluate(()=>{window.testLeaderId=1;});
  await page.waitForFunction(id=>window.marbleStudio.getState().music.country===id,fixtures.ids[1]);
  assert.ok(await page.evaluate(()=>window.marbleStudio.getState().music.position)>=previous[fixtures.ids[1]]-1e-6);
  assert.deepEqual(errors,[]);
  console.log('PASS: all four person categories play; renamed portrait recognized; country overrides inherited; personal songs retained; separate resume cursors.');
}finally{await browser.close();}
