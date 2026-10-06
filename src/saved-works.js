import {normalizeSnapshot} from './studio-transfer.js';

export function validateWork(raw){
  if(!raw||typeof raw.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(raw.id))throw new Error('Çalışma kimliği geçersiz.');
  const name=String(raw.name??'').trim();if(!name||name.length>80)throw new Error('Çalışma adı 1–80 karakter olmalı.');
  const thumbnail=raw.thumbnail??'';
  if(typeof thumbnail!=='string'||thumbnail.length>200000||(thumbnail&&!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(thumbnail)))throw new Error('Çalışma önizlemesi geçersiz.');
  return {id:raw.id,name,thumbnail,snapshot:normalizeSnapshot(raw.snapshot),updatedAt:typeof raw.updatedAt==='string'?raw.updatedAt:new Date().toISOString()};
}
export function createWorkStore(){
  let pending;
  function open(){return pending??=new Promise((resolve,reject)=>{
    const request=indexedDB.open('marble-studio-works',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('works',{keyPath:'id'});
    request.onsuccess=()=>{request.result.onversionchange=()=>{request.result.close();pending=null;};resolve(request.result);};
    request.onerror=()=>{pending=null;reject(new Error('Çalışmalar açılamadı: '+request.error.message));};
  });}
  async function transaction(mode,action){
    const db=await open();return new Promise((resolve,reject)=>{
      const tx=db.transaction('works',mode),store=tx.objectStore('works');let result;
      tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(new Error('Çalışma kaydedilemedi. '+(tx.error?.message??'')));
      try{action(store,value=>{result=value;});}catch(error){tx.abort();reject(error);}
    });
  }
  return {
    async list(){return (await transaction('readonly',(store,done)=>{const req=store.getAll();req.onsuccess=()=>done(req.result);})).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));},
    async put(raw){const work=validateWork(raw);return transaction('readwrite',(store)=>{const count=store.count();count.onsuccess=()=>{const existing=store.get(work.id);existing.onsuccess=()=>{if(!existing.result&&count.result>=50){store.transaction.abort();return;}store.put(work);};};});},
    async replace(works){if(!Array.isArray(works)||works.length>50)throw new Error('En fazla 50 çalışma saklanabilir.');const valid=works.map(validateWork);if(new Set(valid.map(w=>w.id)).size!==valid.length)throw new Error('Yedekte yinelenen çalışma var.');return transaction('readwrite',store=>{store.clear();for(const work of valid)store.put(work);});},
  };
}
