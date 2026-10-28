import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/glass-breaker.html');
 const results=await page.evaluate(async()=>{
  const {beginBreaker,breakerFrame}=await import('/src/breaker-video-render.js');
  const sheet=document.createElement('canvas');sheet.width=1000;sheet.height=1080;const c=sheet.getContext('2d');c.fillStyle='#0c151b';c.fillRect(0,0,1000,1080);
  const results=[];let i=0;
  for(const theme of ['sahlale','yesilturbe','dantel','rumi','hatayi','tulip','penc','cintemani','revzen','rosewindow','lattice']){
   await beginBreaker({width:1080,height:1920,speed:1,analysis:{simulationSeconds:10},recipe:{mode:'glass-breaker',seed:42,theme,liveColors:false,playbackSpeed:1}});
   const frame=breakerFrame(0);c.drawImage(frame,100,450,880,880,(i%4)*250,Math.floor(i/4)*360+30,250,250);
   c.fillStyle='#edf6ed';c.font='16px sans-serif';c.fillText(theme,(i%4)*250+15,Math.floor(i/4)*360+310);
   const hash=()=>{const bytes=frame.getContext('2d').getImageData(100,450,880,880).data;let h=2166136261;for(let j=0;j<bytes.length;j+=4)h=Math.imul(h^bytes[j]^bytes[j+1]^bytes[j+2],16777619);return h;};
   const first=hash();breakerFrame(6);results.push({theme,first,later:hash()});i++;
  }
  sheet.id='tile-review';document.body.append(sheet);return results;
 });
 assert.equal(new Set(results.map(r=>r.first)).size,11);
 assert.ok(results.every(r=>r.first!==r.later));assert.deepEqual(errors,[]);
 await page.locator('#tile-review').screenshot({path:'artifacts/ottoman-tiles.png'});
 await page.evaluate(()=>{const detail=document.createElement('canvas');detail.width=750;detail.height=340;detail.id='new-tile-detail';detail.getContext('2d').drawImage(document.querySelector('#tile-review'),0,0);document.body.append(detail);});
 await page.locator('#new-tile-detail').screenshot({path:'artifacts/new-tiles-detail.png'});
 console.log('PASS: eleven distinct tile/window exports at 1080p; fracture changes every design; no browser errors.');
}finally{await browser.close();}
