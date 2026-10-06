import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export function productionBrowserOptions(){
  const bundled=fileURLToPath(new URL('../tools/browser/chrome-headless-shell.exe',import.meta.url));
  return {headless:true,args:['--disable-background-timer-throttling'],...(existsSync(bundled)?{executablePath:bundled}:{channel:'chrome'})};
}
