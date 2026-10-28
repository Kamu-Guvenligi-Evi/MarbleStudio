// Export editable canvas artwork to the existing six-pose atlas contract.
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const dir='public/warrior-sprites/middle-earth';
const backup='artifacts/middle-earth/before-flat-heroes';
await fs.mkdir(backup,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage();
 await page.route('**/flat-hero-bake',r=>r.fulfill({contentType:'text/html',body:'<body></body>'}));
 await page.goto('http://127.0.0.1:5173/flat-hero-bake');
 for(const name of ['aragorn','legolas','gimli']){
  const result=await page.evaluate(async name=>{
   const {drawFlatHero}=await import('/src/middle-earth-flat-heroes.js');
   const c=document.createElement('canvas');c.width=1536;c.height=1024;const g=c.getContext('2d');
   const poses=[['idle',0],['walk',2],['walk',6],['attack',2],['attack',4],['attack',6]];
   for(const [i,[action,frame]]of poses.entries()){
    g.save();g.beginPath();g.rect(i%3*512,Math.floor(i/3)*512,512,512);g.clip();
    g.translate(i%3*512+256,Math.floor(i/3)*512+450);g.scale(10,10);
    drawFlatHero(g,name,frame,action);g.restore();
   }
   const portrait=document.createElement('canvas');portrait.width=portrait.height=360;
   portrait.getContext('2d').drawImage(c,0,0,512,512,0,0,360,360);
   return {sheet:c.toDataURL('image/webp',.94).split(',')[1],portrait:portrait.toDataURL('image/webp',.94).split(',')[1]};
  },name);
  for(const [key,suffix]of [['sheet',''],['portrait','-portrait']]){
   const file=`${name}${suffix}.webp`;
   try{await fs.copyFile(`${dir}/${file}`,`${backup}/${file}`,fs.constants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST')throw e;}
   const bytes=Buffer.from(result[key],'base64');await fs.writeFile(`${dir}/${file}`,bytes);
   console.log(`${file}: ${bytes.length} bytes`);
  }
 }
}finally{await browser.close();}
