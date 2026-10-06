import {spawn} from 'node:child_process';
import {existsSync,createReadStream} from 'node:fs';
import {mkdir,readFile,writeFile,copyFile,rename,readdir,open,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const safeError=e=>String(e.message??e).replace(/https:\/\/[^\s/@]+@/g,'https://').replace(/\b(?:gh[pousr]_[\w]+|github_pat_[\w]+)\b/g,'[redacted]').slice(-1200);
export async function locateGit(){
  const candidates=['git'];
  if(process.platform==='win32'){
    candidates.push(path.join(process.env.ProgramFiles??'C:/Program Files','Git/cmd/git.exe'));
    const desktop=path.join(process.env.LOCALAPPDATA??'','GitHubDesktop');
    try{for(const app of (await readdir(desktop)).filter(x=>x.startsWith('app-')).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true})))candidates.push(path.join(desktop,app,'resources/app/git/cmd/git.exe'));}catch{}
  }
  for(const executable of candidates){try{await command(executable,['--version'],{});return executable;}catch{}}
  throw new Error('Git bulunamadı. GitHub Desktop ile projeyi clone edip uygulamayı yeniden açın.');
}
function command(executable,args,{cwd,env={},allowFailure=false}={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(executable,args,{cwd,windowsHide:true,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never',GIT_LFS_SKIP_SMUDGE:'1',...env},stdio:['ignore','pipe','pipe']});let output='';
    child.stdout.on('data',d=>output=(output+d).slice(-16000));child.stderr.on('data',d=>output=(output+d).slice(-16000));
    const timer=setTimeout(()=>child.kill(),20*60*1000);child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);if(code===0||allowFailure)resolve({code,output:output.trim()});else reject(new Error(output.trim()||'Git işlemi tamamlanamadı.'));});
  });
}
async function hashFile(file){const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex');}
export async function addVideoToArchive({archive,root,job,existing=[]}){
  if(!/^[a-zA-Z0-9-]+$/.test(job.id))throw new Error('Video kaydı geçersiz.');
  const videoFile=job.videoFile??'video.mp4';if(!['video.mp4','video.webm'].includes(videoFile))throw new Error('Video biçimi geçersiz.');
  const source=path.join(root,job.id),digest=await hashFile(path.join(source,videoFile)),id='shared-'+digest.slice(0,16),target=path.join(archive,'work-videos',id);
  const prior=existing.find(j=>j.id===id);if(prior){if(prior.sha256!==digest)throw new Error('Ortak video kimliği çakıştı.');return prior;}
  const meta=JSON.parse(await readFile(path.join(source,'metadata.json'),'utf8'));await mkdir(target,{recursive:true});
  await copyFile(path.join(source,videoFile),path.join(target,videoFile));await copyFile(path.join(source,'cover.jpg'),path.join(target,'cover.jpg'));
  const {size}=await import('node:fs/promises').then(fs=>fs.stat(path.join(target,videoFile)));
  const clean={id,title:String(meta.title??job.copy?.title??'Video').slice(0,160),mode:job.mode,description:String(meta.description??''),recipe:meta.recipe??{},video:meta.video??{},musicCredits:meta.musicCredits??[],sha256:digest,bytes:size};
  await writeFile(path.join(target,'metadata.json'),JSON.stringify(clean,null,2));
  return {id,mode:job.mode,contentKind:job.contentKind??(job.mode==='arena'&&clean.recipe.arenaGame==='territory'?'territory':job.mode),copy:{title:clean.title},createdAt:job.createdAt??new Date().toISOString(),completedAt:job.completedAt??new Date().toISOString(),videoFile,files:[videoFile,'cover.jpg','metadata.json'],options:{channel:'Ortak çalışma videoları'},sha256:digest,bytes:size};
}
export function createVideoGithubSync({project,root,getJobs,save,enabled=true,allowLocalRemote=false}){
  let busy=false,closed=false;
  const cache=path.join(project,'tools/github-video-sync'),lockFile=path.join(project,'tools/github-video-sync.lock');
  async function run(){
    if(!enabled||closed||busy)return;const jobs=getJobs().filter(j=>j.state==='done'&&j.github?.state!=='done'&&(!j.github?.retryAt||j.github.retryAt<=Date.now()));if(!jobs.length)return;
    busy=true;let lock;
    try{
      await mkdir(path.dirname(cache),{recursive:true});
      try{lock=await open(lockFile,'wx');await lock.writeFile(String(process.pid));}catch(error){if(error.code!=='EEXIST')throw error;const owner=Number(await readFile(lockFile,'utf8'));try{process.kill(owner,0);return;}catch(e){if(e.code!=='ESRCH')return;}await unlink(lockFile);lock=await open(lockFile,'wx');await lock.writeFile(String(process.pid));}
      for(const job of jobs)job.github={...job.github,state:'syncing',error:null};await save();
      const git=await locateGit(),bin=path.dirname(git),env={PATH:[bin,path.resolve(bin,'../mingw64/bin'),path.resolve(bin,'../mingw64/libexec/git-core'),process.env.PATH].join(path.delimiter)};
      const sourceGit=(args,options={})=>command(git,args,{cwd:project,env,...options});
      const remote=(await sourceGit(['remote','get-url','origin'])).output;
      if(!allowLocalRemote&&!/github\.com[:/]Kamu-Guvenligi-Evi\/MarbleStudio(?:\.git)?$/i.test(remote))throw new Error('Otomatik paylaşım için Kamu-Guvenligi-Evi/MarbleStudio deposunu clone edin.');
      const gitCache=(args,options={})=>command(git,args,{cwd:cache,env,...options});
      if(!existsSync(cache)){
        await sourceGit(['clone','--shared','--no-checkout',project,cache]);
        await writeFile(path.join(cache,'.git/marble-video-sync.json'),JSON.stringify({project}));
      }
      const marker=JSON.parse(await readFile(path.join(cache,'.git/marble-video-sync.json'),'utf8'));if(marker.project!==project)throw new Error('Video paylaşım çalışma klasörü doğrulanamadı.');
      const gitRoot=(await gitCache(['rev-parse','--show-toplevel'])).output,normalize=p=>process.platform==='win32'?path.resolve(p).toLowerCase():path.resolve(p);
      if(normalize(gitRoot)!==normalize(cache))throw new Error('Video paylaşım Git klasörü doğrulanamadı.');
      await gitCache(['remote','set-url','origin',remote]);await gitCache(['lfs','install','--local']);
      for(const key of ['user.name','user.email']){const value=await sourceGit(['config','--get',key],{allowFailure:true});await gitCache(['config',key,value.code===0?value.output:key==='user.name'?'Marble Studio':'marble-studio@users.noreply.github.com']);}
      let pushed=false,entries=[];
      for(let attempt=0;attempt<3&&!pushed;attempt++){
        await gitCache(['fetch','origin','main']);await gitCache(['reset','--hard']);await gitCache(['clean','-fd','--','work-videos']);await gitCache(['checkout','-B','main','origin/main']);await gitCache(['reset','--hard','origin/main']);
        const manifestFile=path.join(cache,'work-videos/manifest.json');let manifest={version:1,jobs:[]};
        try{manifest=JSON.parse(await readFile(manifestFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
        if(manifest.version!==1||!Array.isArray(manifest.jobs))throw new Error('Ortak video listesi okunamadı.');
        entries=[];for(const job of jobs){const entry=await addVideoToArchive({archive:cache,root,job,existing:manifest.jobs});entries.push(entry);if(!manifest.jobs.some(j=>j.id===entry.id))manifest.jobs.push(entry);}
        await mkdir(path.dirname(manifestFile),{recursive:true});await writeFile(manifestFile+'.tmp',JSON.stringify(manifest,null,2));await rename(manifestFile+'.tmp',manifestFile);
        const attributesFile=path.join(cache,'.gitattributes');let attributes=await readFile(attributesFile,'utf8').catch(e=>{if(e.code==='ENOENT')return '';throw e;});
        for(const ext of ['mp4','webm']){const rule=`work-videos/**/*.${ext} filter=lfs diff=lfs merge=lfs -text`;if(!attributes.split(/\r?\n/).includes(rule))attributes=attributes.replace(/\s*$/,'')+'\n'+rule+'\n';}await writeFile(attributesFile,attributes);
        await gitCache(['add','--','.gitattributes','work-videos']);
        const changed=await gitCache(['diff','--cached','--quiet'],{allowFailure:true});if(changed.code===1)await gitCache(['commit','-m',`Share ${jobs.length} completed video${jobs.length===1?'':'s'} automatically`]);else if(changed.code!==0)throw new Error('Video arşivi kontrol edilemedi.');
        const push=await gitCache(['push','origin','HEAD:main'],{allowFailure:true});if(push.code===0)pushed=true;else if(!/non-fast-forward|fetch first|stale info|failed to update ref/i.test(push.output))throw new Error(push.output);else if(attempt===2)throw new Error('Başka bir güncelleme geldi; video paylaşımı yeniden denenecek.');
      }
      for(let i=0;i<jobs.length;i++)jobs[i].github={state:'done',sharedId:entries[i].id,completedAt:new Date().toISOString(),url:`https://github.com/Kamu-Guvenligi-Evi/MarbleStudio/tree/main/work-videos/${entries[i].id}`};await save();
    }catch(error){for(const job of jobs)job.github={...job.github,state:'retrying',attempts:(job.github?.attempts??0)+1,error:safeError(error),retryAt:Date.now()+Math.min(300000,30000*2**Math.min(job.github?.attempts??0,4))};await save();}
    finally{if(lock){await lock.close();await unlink(lockFile).catch(()=>{});}busy=false;}
  }
  return {run,enabled,get busy(){return busy;},close:async()=>{closed=true;while(busy)await new Promise(r=>setTimeout(r,100));}};
}
