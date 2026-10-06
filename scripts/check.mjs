import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {mkdtemp,mkdir} from 'node:fs/promises';
import path from 'node:path';

const browserTests=process.argv.includes('--browser')||process.argv.includes('--export'),exports=process.argv.includes('--export'),children=[];
const environment={...process.env},from=process.argv.find(arg=>arg.startsWith('--from='))?.slice(7);
async function command(args){
  const child=spawn(process.execPath,args,{stdio:'inherit',windowsHide:true,env:environment});
  const [code]=await once(child,'exit');if(code!==0)throw new Error(args.join(' ')+' failed ('+code+')');
}
async function online(url){try{return (await fetch(url,{signal:AbortSignal.timeout(1000)})).ok;}catch{return false;}}
async function serve(args,url,env={}){
  const child=spawn(process.execPath,args,{stdio:'inherit',windowsHide:true,env:{...environment,...env}});children.push(child);
  const start=Date.now();while(Date.now()-start<60000){if(await online(url))return;if(child.exitCode!==null)throw new Error('Test service stopped');await new Promise(r=>setTimeout(r,250));}throw new Error('Test service did not start');
}
async function freePort(){const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;}
try{
  await mkdir('artifacts',{recursive:true});
  if(!from)for(const name of ['physics','arena','territory','shared-videos','video-github-sync','spiral','statistics','statistics-library','statistics-scale','presentation','leader-music','generation-effects','production-data','video-timing','automatic-diversity','repetition-guard','episode-formats','youtube-upload'])await command(['tests/'+name+'.mjs']);
  await command(['node_modules/vite/bin/vite.js','build']);
  if(browserTests){
    if(!await online('http://127.0.0.1:5173'))await serve(['node_modules/vite/bin/vite.js'],'http://127.0.0.1:5173');
    const port=await freePort(),root=await mkdtemp(path.resolve('artifacts/check-factory-'));environment.TEST_FACTORY_ORIGIN='http://127.0.0.1:'+port;
    await serve(['scripts/factory-server.mjs'],environment.TEST_FACTORY_ORIGIN+'/api/factory',{FACTORY_PORT:String(port),FACTORY_OUTPUT:root});
    const browserNames=['studio-workspaces','recording-start-browser','statistics-browser','statistics-library-browser','arena-browser','territory-browser','presentation-browser','catalog-browser','catalog-fill','ball-images','spiral-themes','spiral-audio-browser','factory','automatic-browser','video-fps-browser','episode-browser','repetition-browser','production-browser','production-service','repetition-service'];
    if(from&&!browserNames.includes(from))throw new Error('Unknown test: '+from);
    for(const name of browserNames.slice(from?browserNames.indexOf(from):0))await command(['tests/'+name+'.mjs']);
    if(exports)await command(['tests/production-export.mjs']);
  }
  console.log('PASS: '+(from?'focused browser':exports?'full production':browserTests?'browser + data + build':'data + build')+' checks.');
}catch(error){console.error(error.message);process.exitCode=1;}
finally{for(const child of children)if(child.exitCode===null)child.kill();}
