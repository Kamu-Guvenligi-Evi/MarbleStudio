import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage();await page.goto('http://127.0.0.1:5173?edit=1');
  const result=await page.evaluate(async()=>{
    const {Race,COLORS,loadBallImage,ballImageColor,prepareCatalogImage}=await import('/tests/effect-colors.fixture.js');
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
    ctx.fillStyle='#e02030';ctx.fillRect(0,0,128,128);ctx.fillStyle='#2050d0';ctx.fillRect(100,0,28,128);
    const src=canvas.toDataURL('image/png');
    const race=new Race({count:6,sequence:['wheels'],ballImages:Array(6).fill(src)});
    const before=race.balls[0].color;await loadBallImage(src);const after=race.balls[0].color;
    race.start();for(let i=0;i<210;i++)race.step();
    const particles=race.particles.map(p=>p.color);
    race.balls[0].imageSrc=null;const removed=race.balls[0].color;race.dispose();
    ctx.clearRect(0,0,128,128);const empty=canvas.toDataURL('image/png');await loadBallImage(empty);
    ctx.fillStyle='#080808';ctx.fillRect(0,0,128,128);const dark=canvas.toDataURL('image/png');await loadBallImage(dark);
    const catalog=await(await fetch('/catalog/manifest.json')).json();
    const turkey=await prepareCatalogImage(catalog.items.find(i=>i.name==='Türkiye'));
    return {before,after,removed,fallback:COLORS[0],particles,empty:ballImageColor(empty,'#123456'),dark:ballImageColor(dark,null),turkey:ballImageColor(turkey,null)};
  });
  assert.equal(result.before,result.fallback);assert.equal(result.removed,result.fallback);
  assert.equal(result.after,'#e02030');assert.ok(result.particles.length>0);assert.ok(result.particles.every(c=>c===result.after));
  assert.equal(result.empty,'#123456');assert.equal(result.dark,'#6e6e6e');
  const red=parseInt(result.turkey.slice(1,3),16),green=parseInt(result.turkey.slice(3,5),16),blue=parseInt(result.turkey.slice(5,7),16);
  assert.ok(red>180&&green<60&&blue<60,`Expected red effects for the Turkish flag, got ${result.turkey}`);
  console.log('PASS: dominant print color, late image load, collision sparks, image removal, transparent fallback, dark effects and catalog flag color.');
}finally{await browser.close();}
