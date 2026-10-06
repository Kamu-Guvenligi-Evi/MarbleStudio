import {createRepetitionGuard,repetitionError,REPEAT_DAYS,REPEAT_COUNT} from './repetition-guard.mjs';
import {planAutomatic,automaticCandidate,outputQuality} from './production-automation.mjs';
import {productionAudio} from './factory-audio.mjs';
import {videoTiming} from './video-timing.mjs';
import {visualSimilarity} from '../src/production-quality.js';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHash,randomInt} from 'node:crypto';
import {mkdir,writeFile,rename,stat} from 'node:fs/promises';
import path from 'node:path';
import ffmpeg from 'ffmpeg-static';
import {chromium} from 'playwright';
import {productionBrowserOptions} from './browser-runtime.mjs';
import {recipe,sourceRecipe,identity,structure,copyFor} from '../src/factory-recipes.js';
import {SPIRAL_THEMES} from '../src/spiral-themes.js';

function processFFmpeg(args){
  const child=spawn(ffmpeg,args,{windowsHide:true,stdio:['pipe','ignore','pipe']});let log='';
  child.stderr.on('data',data=>{log=(log+data.toString()).slice(-6000);});
  const done=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error('FFmpeg: '+log)));});
  done.catch(()=>{});child.stdin.on('error',()=>{});return {child,done};
}
export async function produce(job,{root,origin,history,update,cancelled,novelty}){
  const guard=createRepetitionGuard(history,novelty?.entries()??[],Date.now(),job.id);
  if(!ffmpeg)throw new Error('FFmpeg kurulu değil. npm install çalıştır.');
  if(job.options.automatic&&!job.options.automation){const options=await planAutomatic(job.options,history,path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),guard);job.options=options;job.mode=options.modes[0];await update({options,mode:job.mode});}
  const dir=path.join(root,job.id);await mkdir(dir,{recursive:true});
  const browser=await chromium.launch(productionBrowserOptions());
  let encoder;const controller=new AbortController();
  const deadline=setTimeout(()=>{controller.abort();encoder?.child.kill();void browser.close();},20*60*1000);
  const check=()=>{if(cancelled())throw new Error('Üretim iptal edildi.');};
  try{
    const page=await browser.newPage();await page.goto(origin+'/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
    if(job.options.automation?.catalogItems?.length&&!job.options.automation.ballImages.length){job.options.automation.ballImages=await page.evaluate(items=>window.factoryRenderer.prepareRoster(items),job.options.automation.catalogItems);await update({options:job.options});}
    await update({stage:'Aday parkurlar deneniyor',progress:0});
    const candidateReview=[],attempted=[],automatic=job.options.automatic===true;
    const candidates=[],seen=new Set(history.map(x=>x.fingerprint)),recent=history.slice(-24).map(x=>x.recipe).filter(Boolean),exact=job.options.strategy==='exact';
    for(let attempt=0;attempt<(exact?1:automatic?16:12)&&candidates.length<(automatic?5:3);attempt++){
      check();
      const themes=Object.keys(SPIRAL_THEMES),theme=themes[(job.ordinal+attempt)%themes.length];
      const seed=exact?(job.options.source.project?.seed??1):randomInt(1,1000000);
      let r;try{r=automatic&&job.mode!=='statistics'?automaticCandidate(job.options,seed,history,attempted,guard):job.options.source?sourceRecipe(job.options.source,seed):recipe(seed,job.mode,theme);}catch(error){if(error.code==='REPETITION_LIMIT'&&candidates.length)break;throw error;}r.exact=exact;attempted.push(r);
      const fingerprint=createHash('sha256').update(identity(r)).digest('hex'),shape=structure(r);
      if(!exact&&seen.has(fingerprint))continue;
      if(automatic&&!guard.check(r).allowed){if(exact)throw repetitionError(guard.check(r).reason);continue;}
      const analysis=await page.evaluate(r=>window.factoryRenderer.probe(r),r);
      const intro=exact&&r.mode!=='statistics'?(r.presentation?.countdown??0):0;
      const outroSeconds=exact&&r.mode!=='statistics'?(r.presentation?.outro??2):2;
      const timing=videoTiming(analysis.simulationSeconds,job.options.duration,{exact,intro,outro:outroSeconds});
      const duration=timing?.duration??null,speed=timing?.speed??1;
      const review={attempt:attempt+1,seed:r.seed,structure:shape,score:analysis.score,duration,speed,output:outputQuality(analysis,speed),accepted:false};candidateReview.push(review);
      if(!analysis.complete||!analysis.finite){if(exact)throw new Error('Bu çalışma süre sınırı içinde tamamlanmadı. Ayarları değiştirip yeniden dene.');continue;}
      if(!exact&&(!timing||analysis.hits<3||analysis.rescues>40))continue;
      if(automatic&&!review.output.accepted)continue;
      review.accepted=true;
      const similarity=recent.length?Math.max(...recent.map(previous=>visualSimilarity(r,previous))):0;
      candidates.push({recipe:r,analysis,speed,duration,intro,outroSeconds,fingerprint,structure:shape,similarity,selectionScore:analysis.score-similarity*30-(timing.durationDifference??0)*.15});
    }
    if(!candidates.length)throw new Error('Normal hızda tamamlanan uygun parkur bulunamadı. Başka bir düzenle yeniden dene.');
    candidates.sort((a,b)=>b.selectionScore-a.selectionScore);const best=candidates[0];best.candidateReview=candidateReview;best.outputQuality=outputQuality(best.analysis,best.speed);
    const copy=copyFor(best.recipe,job.options.language,job.ordinal);if(job.options.hook){copy.description=copy.description.replace(copy.hook,job.options.hook);copy.hook=job.options.hook;copy.title=job.options.hook;}
    const fps=job.options.fps??60,duration=best.duration,frames=duration*fps,resolution=job.options.resolution??1080,orientation=job.options.orientation??'portrait';
    const width=orientation==='landscape'?Math.round(resolution*16/9):resolution,height=orientation==='portrait'?Math.round(resolution*16/9):resolution;
    const format={fps,width,height,template:job.options.template,channel:job.options.channel,outro:job.options.outro};
    await update({...best,copy,stage:'Video işleniyor',progress:2});
    await page.evaluate(config=>window.factoryRenderer.begin(config),{...best,copy,...format});
    const silent=path.join(dir,'silent.mp4');
    encoder=processFFmpeg(['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',silent]);
    for(let frame=0;frame<frames;frame++){
      check();const jpeg=Buffer.from(await page.evaluate(i=>window.factoryRenderer.frame(i),frame),'base64');
      if(encoder.child.exitCode!==null)throw new Error('Video kodlayıcı kareler bitmeden kapandı.');
      if(!encoder.child.stdin.write(jpeg))await Promise.race([once(encoder.child.stdin,'drain'),encoder.done.then(()=>{throw new Error('Video kodlayıcı erken kapandı.');})]);
      const coverFrame=Math.min(frames-1,Math.floor(Math.max(best.intro+3.6,best.intro+(best.analysis.coverTime??best.analysis.simulationSeconds*.5)/best.speed)*fps));
      if(frame===coverFrame)await writeFile(path.join(dir,'cover.jpg'),jpeg);
      if(frame%30===0)await update({progress:Math.round(2+frame/frames*90)});
    }
    encoder.child.stdin.end();await encoder.done;encoder=null;check();
    const actual=await page.evaluate(()=>window.factoryRenderer.result());
    if(best.recipe.episode&&JSON.stringify(actual.episode)!==JSON.stringify(best.analysis.episode))throw new Error('Etap sonuçları ön simülasyonla eşleşmedi; video hazır olarak işaretlenmedi.');
    if(!actual.complete||actual.winner!==best.analysis.winner)throw new Error('Kaydedilen sonuç ön simülasyonla eşleşmedi; video hazır olarak işaretlenmedi.');
    await update({stage:'Ses ve dosya kontrolü',progress:94});
    const events=await page.evaluate(()=>window.factoryRenderer.audio());
    const audio=path.join(dir,'impacts.wav'),project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
    const soundtrack=await productionAudio({events,recipe:best.recipe,duration,audio:job.options.audio??'all',project,signal:controller.signal});await writeFile(audio,soundtrack.buffer);check();
    const temporary=path.join(dir,'video.pending.mp4'),output=path.join(dir,'video.mp4');
    encoder=processFFmpeg(['-hide_banner','-loglevel','error','-y','-i',silent,'-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k','-t',String(duration),'-movflags','+faststart',temporary]);encoder.child.stdin.end();await encoder.done;encoder=null;check();
    // Decode the entire result before publishing it as a completed job.
    encoder=processFFmpeg(['-hide_banner','-loglevel','error','-xerror','-i',temporary,'-f','null','-']);encoder.child.stdin.end();await encoder.done;encoder=null;check();
    if((await stat(temporary)).size<1024)throw new Error('Video dosyası beklenenden küçük.');
    const metadata={id:job.id,channel:job.options.channel,...copy,recipe:best.recipe,analysis:best.analysis,fingerprint:best.fingerprint,structure:best.structure,video:{width,height,fps,duration,speed:best.speed,codec:'H.264',audio:job.options.audio??'all',template:job.options.template??'minimal',intro:best.intro,outroSeconds:best.outroSeconds,outro:job.options.outro??''},musicCredits:soundtrack.credits,repetition:{...guard.check(best.recipe).keys,days:REPEAT_DAYS,videos:REPEAT_COUNT},candidateReview,selection:{score:best.selectionScore,similarity:best.similarity,considered:candidateReview.length},outputQuality:best.outputQuality,automation:job.options.automation??null,engineVersion:'studio-production-5',createdAt:new Date().toISOString()};
    await writeFile(path.join(dir,'metadata.json'),JSON.stringify(metadata,null,2));
    await writeFile(path.join(dir,'upload.txt'),copy.title+'\n\n'+copy.description+'\n\n'+soundtrack.credits.join('\n\n')+'\n');
    await rename(temporary,output);
    if(novelty)await novelty.remember({id:job.id,recipe:best.recipe,completedAt:metadata.createdAt});
    await update({state:'done',stage:'Hazır',progress:100,completedAt:metadata.createdAt,files:['video.mp4','cover.jpg','metadata.json','upload.txt'],...best,copy});
    // Intermediate files are scoped to this job, never to user-selected paths.
    const {unlink}=await import('node:fs/promises');await Promise.allSettled([unlink(silent),unlink(audio)]);
  }finally{controller.abort();clearTimeout(deadline);encoder?.child.kill();await browser.close();}
}
