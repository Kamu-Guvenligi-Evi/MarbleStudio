import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const slugs=['spider_man','octopus','dragon','fish','ship'];
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();await page.goto('http://127.0.0.1:5173');
for(let start=0;start<slugs.length;start+=10){const data=await page.evaluate(async slugs=>{const c=document.createElement('canvas');c.width=1750;c.height=slugs.length*100;const x=c.getContext('2d');x.fillStyle='#252833';x.fillRect(0,0,c.width,c.height);for(const [row,slug]of slugs.entries()){x.fillStyle='white';x.font='14px Arial';x.fillText(slug,4,row*100+25);for(let i=0;i<12;i++){const im=new Image();im.src=`/merge-cutouts/${slug}-${i}.png`;try{await im.decode();}catch{continue;}const r=Math.min(95/im.width,80/im.height);x.drawImage(im,150+i*130,row*100,im.width*r,im.height*r);x.fillText(String(i),150+i*130,row*100+95);}}return c.toDataURL('image/jpeg',.84).split(',')[1];},slugs.slice(start,start+10));await fs.writeFile(`artifacts/extra-candidates-${start}.jpg`,Buffer.from(data,'base64'));}await browser.close();

