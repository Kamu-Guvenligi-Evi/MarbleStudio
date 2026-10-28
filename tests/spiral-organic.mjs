import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1080,height:820}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
 await page.locator('#nav-spiral').click();
 for(const id of ['pearlShells','pomegranate','bubbleCells']){
  await page.locator('#spiral-theme').selectOption(id);
  assert.equal(await page.evaluate(()=>window.marbleStudio.getState().spiralTheme),id);
 }
 await page.evaluate(async()=>{
  const {Spiral}=await import('/src/spiral.js'),{renderSpiral}=await import('/src/spiral-renderer.js');
  const {SPIRAL_THEMES}=await import('/src/spiral-themes.js'),{drawMaterialParticle}=await import('/src/spiral-materials.js');
  const sheet=document.createElement('canvas');sheet.id='organic-preview';sheet.width=1080;sheet.height=640;sheet.style='position:absolute;left:0;top:0;z-index:999999';document.body.append(sheet);
  const c=sheet.getContext('2d');c.fillStyle='#080d15';c.fillRect(0,0,1080,640);
  for(const [i,id] of ['pearlShells','pomegranate','bubbleCells'].entries()){
   const race=new Spiral({theme:id,seed:2048}),canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;
   renderSpiral(canvas.getContext('2d'),race);c.drawImage(canvas,0,210,540,540,i*360,45,360,360);
   const hit=race.ice.contact(275,716,10);race.ice.chip(hit,()=>.5);renderSpiral(canvas.getContext('2d'),race);
   c.drawImage(canvas,190,650,160,100,i*360+20,430,320,150);
   c.fillStyle='#fff';c.font='18px Arial';c.textAlign='center';c.fillText(SPIRAL_THEMES[id].englishName,i*360+180,28);
   for(let j=0;j<10;j++)drawMaterialParticle(c,{x:i*360+25+j*34,y:610,size:7,life:1,rotation:j*.4,white:j%3===0},SPIRAL_THEMES[id]);
  }
 });
 await page.locator('#organic-preview').screenshot({path:'artifacts/spiral-organic.png'});
 assert.deepEqual(errors,[]);console.log('PASS: new material selection, rendering and fracture preview without browser errors.');
}finally{await browser.close();}
