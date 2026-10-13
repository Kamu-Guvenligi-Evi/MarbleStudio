import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export function productionBrowserOptions(){
  const bundled=fileURLToPath(new URL('../tools/browser/chrome-headless-shell.exe',import.meta.url));
  const manifest=JSON.parse(readFileSync(new URL('../node_modules/playwright-core/browsers.json',import.meta.url),'utf8'));
  const revision=manifest.browsers.find(b=>b.name==='chromium-headless-shell').revision;
  const cached=fileURLToPath(new URL(`../tools/playwright/chromium_headless_shell-${revision}/chrome-headless-shell-win64/chrome-headless-shell.exe`,import.meta.url));
  const executable=[cached,bundled].find(existsSync);
  // Headless shell otherwise disables GPU canvas rendering even on this machine.
  // Chromium retains its normal software fallback if no usable GPU is present.
  return {headless:true,args:['--disable-background-timer-throttling','--enable-gpu'],...(executable?{executablePath:executable}:{channel:'chrome'})};
}
