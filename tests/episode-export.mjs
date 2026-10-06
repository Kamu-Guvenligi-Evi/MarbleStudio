import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {produce} from '../scripts/factory-worker.mjs';
import {openRepetitionLedger} from '../scripts/repetition-guard.mjs';
import {planAutomatic} from '../scripts/production-automation.mjs';
import {validateBatch} from '../src/factory-recipes.js';
import {EPISODE_FORMATS} from '../src/episode-plan.js';

const root=path.resolve('artifacts/episode-exports-'+Date.now());await mkdir(root,{recursive:true});
const history=[],novelty=await openRepetitionLedger(root),reports=[];
for(const format of EPISODE_FORMATS){
  const options=await planAutomatic(validateBatch({automatic:true,automaticMode:'track',count:1,language:'tr',resolution:720,duration:30}),history,path.resolve('.'));
  options.automation.episodeFormat=format;
  const job={id:format,mode:'track',ordinal:history.length,options};
  const started=Date.now();
  await produce(job,{root,origin:'http://127.0.0.1:5173',history,novelty,cancelled:()=>false,update:async patch=>Object.assign(job,patch)});
  assert.equal(job.state,'done');assert.equal(job.recipe.episode.format,format);
  const metadata=JSON.parse(await readFile(path.join(root,format,'metadata.json'),'utf8'));
  assert.equal(metadata.analysis.episode.winner,metadata.analysis.winner);assert.ok(metadata.outputQuality.accepted);
  assert.ok((await stat(path.join(root,format,'video.mp4'))).size>10000);
  reports.push({format,video:path.join(root,format,'video.mp4'),seconds:(Date.now()-started)/1000,duration:job.duration,winner:job.analysis.winner,candidates:job.candidateReview.length});
  history.push(job);console.log('PASS: real MP4 + complete decode + matching winner:',format);
}
await writeFile(path.join(root,'report.json'),JSON.stringify(reports,null,2));
console.log('Review outputs:',root);
