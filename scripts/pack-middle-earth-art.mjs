// Local, reproducible format conversion. Creative source images are kept in artifacts.
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173');
  for (const name of ['balrog','witch-king','sauron']) {
    const data = await page.evaluate(async name => {
      const image = new Image(); image.src = `/artifacts/middle-earth/source/${name}.png`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width=1536;canvas.height=1024;
      const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
      return canvas.toDataURL('image/webp',.9).split(',')[1];
    },name);
    const bytes=Buffer.from(data,'base64');
    await fs.writeFile(`public/warrior-sprites/middle-earth/${name}.webp`,bytes);
    console.log(`${name}: ${bytes.length} bytes`);
  }
} finally { await browser.close(); }
