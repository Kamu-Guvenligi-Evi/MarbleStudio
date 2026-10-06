import {mkdir,readFile,writeFile,rename,copyFile} from 'node:fs/promises';
import path from 'node:path';

export function recoverableWriter(write){
  let pending=Promise.resolve();
  return value=>{const operation=pending.catch(()=>{}).then(()=>write(value));pending=operation;return operation;};
}
export function createFactoryStore(root){
  const index=path.join(root,'factory.json'),details=path.join(root,'.jobs'),cache=new Map();
  async function atomic(file,value){
    await writeFile(file+'.tmp',value);
    try{await copyFile(file,file+'.bak');}catch(error){if(error.code!=='ENOENT')throw error;}
    await rename(file+'.tmp',file);
  }
  async function readJSON(file){
    try{return JSON.parse(await readFile(file,'utf8'));}
    catch(error){
      if(error.code==='ENOENT')throw error;
      try{return JSON.parse(await readFile(file+'.bak','utf8'));}catch{throw new Error('Üretim kaydı ve yedeği okunamadı: '+file);}
    }
  }
  const write=recoverableWriter(async snapshot=>{
    await mkdir(details,{recursive:true});
    const state=JSON.parse(snapshot),jobs=[];
    for(const job of state.jobs){
      if(!/^[a-zA-Z0-9-]+$/.test(job.id))throw new Error('Geçersiz iş kimliği.');
      const data=JSON.stringify(job);
      if(cache.get(job.id)!==data){await atomic(path.join(details,job.id+'.json'),data);cache.set(job.id,data);}
      jobs.push({id:job.id,detail:true});
    }
    await atomic(index,JSON.stringify({...state,version:2,jobs},null,2));
  });
  return {
    async load(){
      let state;try{state=await readJSON(index);}catch(error){if(error.code==='ENOENT')return {version:2,jobs:[],schedule:null};throw error;}
      if(!Array.isArray(state.jobs)||![1,2].includes(state.version))throw new Error('Üretim geçmişinin biçimi geçersiz.');
      for(let i=0;i<state.jobs.length;i++){
        const job=state.jobs[i];if(!/^[a-zA-Z0-9-]+$/.test(job.id))throw new Error('Geçersiz iş kimliği.');
        if(job.detail){state.jobs[i]=await readJSON(path.join(details,job.id+'.json'));cache.set(job.id,JSON.stringify(state.jobs[i]));}
      }
      return state;
    },
    save(state){return write(JSON.stringify(state));},
  };
}
