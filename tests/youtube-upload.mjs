import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createYouTube} from '../scripts/youtube-api.mjs';
import {validateBatch} from '../src/factory-recipes.js';

const root=await mkdtemp(path.join(os.tmpdir(),'marble-youtube-'));
const channelId='UC'+'a'.repeat(22),videoId='v1234567890',calls=[];
let completed=false;
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json',...headers}});
const request=async(url,options={})=>{
  calls.push({url,method:options.method??'GET'});
  if(url.includes('/token'))return json({access_token:'token',refresh_token:'refresh',expires_in:3600});
  if(url.includes('/channels'))return json({items:[{id:channelId,snippet:{title:'Kanal 1'}}]});
  if(url.includes('uploadType=resumable'))return new Response(null,{status:200,headers:{Location:'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=test'}});
  if(url.includes('upload_id=test')){
    if(options.headers['Content-Length']==='0')return completed?json({id:videoId,snippet:{channelId}}):new Response(null,{status:308});
    assert.equal(options.headers['Content-Range'],'bytes 0-4/5');completed=true;return json({id:videoId,snippet:{channelId}},201);
  }
  throw new Error('Beklenmeyen istek: '+url);
};
try{
  const youtube=createYouTube(root,{clientId:'client',clientSecret:'secret',request});await youtube.load();
  const url=new URL(youtube.begin()),state=url.searchParams.get('state');
  await assert.rejects(youtube.callback('code','wrong'),/geçersiz/);
  await youtube.callback('code',state);
  assert.deepEqual(youtube.list(),[{id:channelId,title:'Kanal 1'}]);
  const saved=await readFile(path.join(root,'.youtube-accounts.json'),'utf8');assert.match(saved,/refresh/);
  const video=path.join(root,'video.mp4');await writeFile(video,'hello');
  await writeFile(path.join(root,'upload.txt'),'Test\n\nAçıklama\n\nMüzik atfı\n');
  const job={copy:{title:'Test',description:'Açıklama',tags:['shorts']},options:{youtube:{channelId,privacyStatus:'private'}},youtube:{state:'queued'}};
  assert.equal(await youtube.upload(job,video,async patch=>Object.assign(job.youtube,patch)),videoId);
  assert.equal(job.youtube.session?.includes('upload_id=test'),true);
  const sends=calls.filter(c=>c.method==='PUT').length;
  assert.equal(await youtube.upload(job,video,async()=>{}),videoId);
  assert.equal(calls.filter(c=>c.method==='PUT').length,sends+1,'restart probes existing upload instead of sending video twice');
  assert.throws(()=>validateBatch({youtube:{channelId:'wrong',privacyStatus:'public'}}),/YouTube/);
  console.log('YouTube bağlantısı ve tekrar yükleme koruması: OK');
}finally{await rm(root,{recursive:true,force:true});}
