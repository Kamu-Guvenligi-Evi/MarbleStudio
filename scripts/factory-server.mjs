import {openRepetitionLedger} from './repetition-guard.mjs';
import {serveOutput} from './output-file.mjs';
import {assertManualExport,recordDownload,cleanDownloadedVideo} from './manual-export.mjs';
import {createFactoryStore} from './factory-store.mjs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,unlink,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {build} from 'vite';
import {validateBatch} from '../src/factory-recipes.js';
import {produce} from './factory-worker.mjs';
import {createYouTube} from './youtube-api.mjs';
import {createMatchService} from './match-service.mjs';
const getMatches=createMatchService();

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),root=path.resolve(process.env.FACTORY_OUTPUT||path.join(project,'output'));
const port=Number(process.env.FACTORY_PORT||5180),origin='http://127.0.0.1:'+port;
await mkdir(root,{recursive:true});
const lockFile=path.join(root,'.factory.lock');
try{await writeFile(lockFile,String(process.pid),{flag:'wx'});}catch(error){
  if(error.code!=='EEXIST')throw error;
  const owner=Number(await readFile(lockFile,'utf8'));let alive=true;
  try{process.kill(owner,0);}catch(e){if(e.code==='ESRCH')alive=false;else throw e;}
  if(alive)throw new Error('Bu çıktı klasörünü kullanan üretim hizmeti zaten açık.');
  await unlink(lockFile);await writeFile(lockFile,String(process.pid),{flag:'wx'});
}
process.on('exit',()=>{try{const fs=process.getBuiltinModule('fs');if(fs.readFileSync(lockFile,'utf8')===String(process.pid))fs.unlinkSync(lockFile);}catch{}});
const store=createFactoryStore(root);
let state=await store.load(),busy=false,active=null,closing=false,storageError=null;const uncommitted=new Set();
state.schedule=null;state.schedules=[];
for(const job of state.jobs)if(['queued','running'].includes(job.state)){try{assertManualExport(job.options);}catch{job.state='cancelled';job.stage='Otomatik üretim kaldırıldı';}}
const youtube=createYouTube(root,{port});await youtube.load();let uploadBusy=false;
for(const job of state.jobs)if(job.state==='done'&&job.options?.youtube&&!job.youtube)job.youtube={state:'queued',channelId:job.options.youtube.channelId};
const novelty=await openRepetitionLedger(root,state.jobs.filter(j=>j.state==='done'));
for(const job of state.jobs)if(job.state==='running'){job.state='queued';job.stage='Kesilen üretim yeniden başlatılacak';job.cancelRequested=false;}
async function save(){try{await store.save(state);storageError=null;}catch(error){storageError=error.message;throw error;}}
function enqueue(options,scheduleKey=null){
  if(state.jobs.filter(j=>['queued','running'].includes(j.state)).length+options.count>100)throw new Error('Kuyruk sınırı 100 video.');
  const offset=state.jobs.length;
  const added=[];for(let i=0;i<options.count;i++){const job={id:randomUUID(),ordinal:offset+i,mode:options.modes[(offset+i)%options.modes.length],options,transient:true,state:'queued',stage:'Sırada',progress:0,createdAt:new Date().toISOString(),scheduleKey};state.jobs.push(job);added.push(job.id);uncommitted.add(job.id);}return added;
}
async function work(){
  if(busy||closing)return;const job=state.jobs.find(j=>!uncommitted.has(j.id)&&j.state==='queued'&&(!j.retryAt||j.retryAt<=Date.now()));if(!job)return;
  busy=true;active=job;
  try{job.state='running';job.error=null;job.attempts=(job.attempts??0)+1;await save();await produce(job,{root,origin,novelty,history:state.jobs.filter(j=>j.state==='done'),cancelled:()=>job.cancelRequested||closing,update:async patch=>{Object.assign(job,patch);await save();}});if(job.options.youtube){job.youtube={state:'queued',channelId:job.options.youtube.channelId};await save();}}
  catch(e){
    // Export failures must not silently throw away progress and start over.
    job.state=job.cancelRequested?'cancelled':closing?'queued':'failed';
    if(closing&&!job.cancelRequested)job.attempts=Math.max(0,job.attempts-1);
    job.stage=job.cancelRequested?'İptal edildi':job.state==='queued'?'Hizmet açılınca yeniden başlatılacak':'Üretim durdu';
    if(e.code==='REPETITION_LIMIT')job.stage='Tekrar önlendi';
    job.retryAt=Date.now()+15000;job.error=e.message;try{await save();}catch(storage){console.error('Kuyruk kaydedilemedi:',storage.message);}console.error(job.id,e.message);
  }
  finally{busy=false;active=null;if(!closing)setTimeout(()=>void work().catch(console.error),1000);}
}
async function uploadReady(){
  if(uploadBusy||closing)return;
  const job=state.jobs.find(j=>j.state==='done'&&j.youtube&&['queued','uploading'].includes(j.youtube.state)&&(!j.youtube.retryAt||j.youtube.retryAt<=Date.now()));
  if(!job)return;uploadBusy=true;
  try{
    job.youtube.state='uploading';await save();
    const id=await youtube.upload(job,path.join(root,job.id,'video.mp4'),async patch=>{Object.assign(job.youtube,patch);await save();});
    Object.assign(job.youtube,{state:'done',videoId:id,url:`https://www.youtube.com/watch?v=${id}`,error:null,completedAt:new Date().toISOString()});await save();
  }catch(error){job.youtube.error=error.message;job.youtube.attempts=(job.youtube.attempts??0)+1;job.youtube.state=job.youtube.attempts<3&&job.youtube.session?'queued':'failed';job.youtube.retryAt=Date.now()+30000;try{await save();}catch(storage){console.error('YouTube durumu kaydedilemedi:',storage.message);}console.error('YouTube yükleme:',error.message);}
  finally{uploadBusy=false;}
}
let cleaning=false;
async function cleanDownloads(){
  if(cleaning)return;cleaning=true;
  try{for(const job of state.jobs)try{if(await cleanDownloadedVideo(root,job))await save();}catch(error){console.error('Geçici video temizliği:',error.message);}}
  finally{cleaning=false;}
}
async function tick(){
  if(closing)return;
  await work();void uploadReady().catch(console.error);await cleanDownloads();
}
async function body(req){let value='';for await(const chunk of req){value+=chunk;if(Buffer.byteLength(value)>2000000)throw new Error('İstek çok büyük.');}return JSON.parse(value||'{}');}
await build({root:project,logLevel:'error'});
const staticRoot=path.join(project,'dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.txt':'text/plain; charset=utf-8','.csv':'text/csv; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,origin);
  const json=(value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  try{
    const allowedOrigins=new Set([origin,'http://127.0.0.1:'+(process.env.MARBLE_STUDIO_PORT||5173)]);
    if(req.headers.origin&&allowedOrigins.has(req.headers.origin)){res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');}
    if(req.headers.host!==`127.0.0.1:${port}`||req.headers.origin&&!allowedOrigins.has(req.headers.origin))return json({error:'Yalnızca yerel üretim paneli erişebilir.'},403);
    if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Methods':'GET, HEAD, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Range, X-Marble-Mode, X-Marble-Title','Access-Control-Max-Age':'600'});res.end();return;}
    if(url.pathname==='/api/matches'&&req.method==='GET'){
      try{return json(await getMatches(url.searchParams.get('league'),url.searchParams.get('date')));}
      catch(error){return json({error:error.message},error.status??400);}
    }
    if(url.pathname==='/api/youtube/connect'&&req.method==='GET'){res.writeHead(302,{Location:youtube.begin(),'Cache-Control':'no-store'});res.end();return;}
    if(url.pathname==='/api/youtube/callback'&&req.method==='GET'){
      const account=await youtube.callback(url.searchParams.get('code'),url.searchParams.get('state'));
      res.writeHead(302,{Location:'/index.html?youtube=connected','Cache-Control':'no-store'});res.end();console.log('YouTube kanalı bağlandı: '+account.id);return;
    }
    if(url.pathname==='/api/youtube/accounts'&&req.method==='GET')return json({configured:youtube.configured,accounts:youtube.list()});
    if(url.pathname==='/api/factory'&&req.method==='GET'){
      const offset=Math.max(0,Math.floor(Number(url.searchParams.get('offset'))||0)),limit=Math.max(1,Math.min(50,Math.floor(Number(url.searchParams.get('limit'))||12))),filter=url.searchParams.get('state')??'all';
      const allJobs=state.jobs;
      const jobs=allJobs.filter(j=>filter==='all'||j.state===filter).slice().reverse();
      const summary={done:allJobs.filter(j=>j.state==='done').length,pending:state.jobs.filter(j=>['running','queued'].includes(j.state)).length};
      return json({sharedWarning:null,githubSharing:false,apiVersion:5,capabilities:['studio-workbench','temporary-downloads','youtube-upload','territory-production','breaker-production','duel-production','rps-production','escape-production','multiplier-production','goal-production','waves-production','merge-production'],jobs:jobs.slice(offset,offset+limit).map(({recipe,analysis,structure,similarity,selectionScore,candidateReview,outputQuality,...job})=>({...job,contentKind:job.contentKind??(job.mode==='arena'&&(recipe?.arenaGame??job.options?.source?.project?.arenaGame??job.options?.arenaGame)==='territory'?'territory':job.mode),youtube:job.youtube?{state:job.youtube.state,channelId:job.youtube.channelId,url:job.youtube.url,error:job.youtube.error}:null,options:{channel:job.options?.channel??'Marble Studio',duration:job.options?.duration??job.duration,language:job.options?.language??'en'}})),summary,total:jobs.length,schedule:null,schedules:[],storageError});
    }
    if(['/api/import-video','/api/reveal','/api/schedule','/api/schedules'].includes(url.pathname))return json({error:'Otomatik üretim ve video arşivleme kaldırıldı.'},410);
    if(url.pathname.startsWith('/api/')&&req.method==='POST'){
      if(!allowedOrigins.has(req.headers.origin)||req.headers['content-type']!=='application/json')return json({error:'Geçersiz istek kaynağı.'},403);
      const input=await body(req);
      if(url.pathname==='/api/queue'){assertManualExport(input);const options=validateBatch(input);if(options.youtube&&!youtube.has(options.youtube.channelId))throw new Error('Önce seçilen YouTube kanalını bağla.');const added=enqueue(options);try{await save();}catch(error){state.jobs=state.jobs.filter(j=>!added.includes(j.id));throw error;}finally{added.forEach(id=>uncommitted.delete(id));}void work().catch(console.error);return json({ok:true});}
      if(url.pathname==='/api/youtube/retry'){
        const job=state.jobs.find(j=>j.id===input.id);if(job?.state!=='done'||job.youtube?.state!=='failed')throw new Error('Yeniden denenebilir YouTube yüklemesi bulunamadı.');
        job.youtube.state='queued';job.youtube.error=null;job.youtube.attempts=0;job.youtube.retryAt=0;await save();void uploadReady().catch(console.error);return json({ok:true});
      }
      if(url.pathname==='/api/cancel'){
        const job=state.jobs.find(j=>j.id===input.id);if(!job||!['queued','running'].includes(job.state))throw new Error('İptal edilebilir iş bulunamadı.');
        if(job.state==='queued'){job.state='cancelled';job.stage='İptal edildi';}else job.cancelRequested=true;
        await save();return json({ok:true});
      }
      if(url.pathname==='/api/retry'){
        const job=state.jobs.find(j=>j.id===input.id);if(!job||!['failed','cancelled'].includes(job.state))throw new Error('Yeniden denenebilir iş bulunamadı.');
        assertManualExport(job.options);job.transient=true;job.state='queued';job.error=null;job.cancelRequested=false;job.attempts=0;job.retryAt=0;job.progress=0;job.stage='Sırada';await save();void work().catch(console.error);return json({ok:true});
      }
      return json({error:'Adres bulunamadı.'},404);
    }
    if(url.pathname.startsWith('/output/')){
      const [, ,id,name]=url.pathname.split('/'),job=state.jobs.find(j=>j.id===id);
      if(job?.state!=='done'||!job.files?.includes(name)||url.pathname!==`/output/${id}/${name}`)return json({error:'Dosya bulunamadı.'},404);
      await serveOutput(req,res,path.join(root,id,name),{name,id,preview:url.searchParams.get('preview')==='1',onDownload:async range=>{recordDownload(job,range);await save();await cleanDownloads();}});return;
    }
    if(url.pathname==='/'){res.writeHead(302,{Location:'/index.html'});res.end();return;}
    const target=path.resolve(staticRoot,'.'+decodeURIComponent(url.pathname));
    if(!target.startsWith(staticRoot+path.sep))return json({error:'Dosya bulunamadı.'},404);
    let info;try{info=await stat(target);}catch{return json({error:'Dosya bulunamadı.'},404);}
    if(!info.isFile())return json({error:'Dosya bulunamadı.'},404);
    res.writeHead(200,{'Content-Length':info.size,'Content-Type':mime[path.extname(target)]??'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    const stream=createReadStream(target);stream.on('error',()=>res.destroy());stream.pipe(res);
  }catch(e){json({error:e.message},400);}
});
server.listen(port,'127.0.0.1',()=>{console.log('Marble Studio üretim paneli: '+origin);void save().then(tick).catch(console.error);});
const timer=setInterval(()=>void tick().catch(console.error),1000);
async function close(){closing=true;clearInterval(timer);while(busy||uploadBusy)await new Promise(resolve=>setTimeout(resolve,100));await save();server.close();await unlink(lockFile);}
process.on('SIGINT',()=>void close());process.on('SIGTERM',()=>void close());
