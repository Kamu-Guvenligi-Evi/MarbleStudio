import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, openSync, closeSync } from 'node:fs';
import { resolve } from 'node:path';

// One repeatable gate for deployment, decisions and local combat behaviour.
// Browser checks require the local Vite server; no downloads are performed.
const folder = 'artifacts/battle-behavior-suite';
mkdirSync(folder, { recursive: true });
const tests = [
  'historical-ottoman-openings', 'historical-infantry-openings',
  'historical-new-unit-formations',
  'historical-adaptive-openings',
  'historical-line-support', 'historical-cavalry-support',
  'crown-battle-screening', 'crown-battle-npc-routing',
  'historical-turan-horse-archers', 'historical-multi-army-tactics',
  'historical-alliance-battles', 'historical-doctrine-spacing',
  'historical-civilization-tactics',
];
if (process.argv.includes('--browser')) tests.push(
  'historical-line-support-browser', 'historical-infantry-openings-browser');
const sources = () => Object.fromEntries(readdirSync('src').filter(f => /\.(js|json)$/.test(f)).sort()
  .map(f => [f, createHash('sha256').update(readFileSync(`src/${f}`)).digest('hex')]));
const before = sources(), results = [];
let next = 0;
await Promise.all(Array.from({ length: 2 }, async () => {
  while (next < tests.length) {
    const name = tests[next++], started = Date.now(), log = `${folder}/${name}.log`;
    const fd = openSync(log, 'w');
    const code = await new Promise(resolveResult => {
      const child = spawn(process.execPath, [resolve(`tests/${name}.mjs`)], { stdio: ['ignore', fd, fd], windowsHide: true });
      child.once('error', error => { console.error(`${name}: ${error.message}`); resolveResult(-1); });
      child.once('close', resolveResult);
    });
    closeSync(fd);
    results.push({ name, code, seconds: (Date.now() - started) / 1000, log });
    console.log(`${code === 0 ? 'PASS' : 'FAIL'} ${name}`);
    if (code !== 0) console.error(readFileSync(log, 'utf8').slice(-1600));
  }
}));
const after = sources();
const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(f => before[f] !== after[f]);
const passed = results.every(r => r.code === 0) && !changed.length;
writeFileSync(`${folder}/report.json`, JSON.stringify({ passed, changed, sources: before, results }));
if (changed.length) console.error(`Source changed during validation: ${changed.join(', ')}`);
console.log(`${passed ? 'PASS' : 'FAIL'} behavior suite: ${results.filter(r => r.code === 0).length}/${results.length} tests; ${changed.length} changed source files.`);
process.exitCode = passed ? 0 : 1;
