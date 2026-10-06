import {createReadStream} from 'node:fs';
import {readFile,writeFile,rename,stat} from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';

const scope='https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';
const google='https://oauth2.googleapis.com/token';
const api='https://www.googleapis.com/youtube/v3';
const uploadApi='https://www.googleapis.com/upload/youtube/v3/videos';
const safeMessage=async response=>{const value=await response.text();try{const data=JSON.parse(value);return data.error?.message??data.error_description??value.slice(0,300);}catch{return value.slice(0,300)||`HTTP ${response.status}`;}};

export function createYouTube(root,{clientId=process.env.YOUTUBE_CLIENT_ID,clientSecret=process.env.YOUTUBE_CLIENT_SECRET,port=Number(process.env.FACTORY_PORT||5180),request=fetch}={}){
  const file=path.join(root,'.youtube-accounts.json'),redirect=`http://127.0.0.1:${port}/api/youtube/callback`;
  const pending=new Map();let accounts={};
  const configured=Boolean(clientId&&clientSecret);
  async function load(){try{accounts=JSON.parse(await readFile(file,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}}
  async function save(){const temporary=file+'.tmp';await writeFile(temporary,JSON.stringify(accounts,null,2),{mode:0o600});await rename(temporary,file);}
  function list(){return Object.entries(accounts).map(([id,a])=>({id,title:a.title}));}
  function begin(){
    if(!configured)throw new Error('YouTube OAuth bilgileri tanımlı değil.');
    const state=randomBytes(24).toString('hex');pending.set(state,Date.now()+10*60*1000);
    const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
    for(const [key,value] of Object.entries({client_id:clientId,redirect_uri:redirect,response_type:'code',scope,access_type:'offline',prompt:'consent',state}))url.searchParams.set(key,value);
    return url.href;
  }
  async function token(params){
    const response=await request(google,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,...params})});
    if(!response.ok)throw new Error('Google bağlantısı: '+await safeMessage(response));return response.json();
  }
  async function callback(code,state){
    const expires=pending.get(state);pending.delete(state);
    if(!expires||expires<Date.now()||!code)throw new Error('YouTube bağlantı isteği geçersiz veya süresi dolmuş.');
    const granted=await token({grant_type:'authorization_code',code,redirect_uri:redirect});
    if(!granted.refresh_token)throw new Error('Google yenileme anahtarı vermedi. Bağlantıyı yeniden dene.');
    const response=await request(`${api}/channels?part=snippet&mine=true`,{headers:{Authorization:`Bearer ${granted.access_token}`}});
    if(!response.ok)throw new Error('YouTube kanalı okunamadı: '+await safeMessage(response));
    const items=(await response.json()).items??[],channel=items[0];
    if(!channel?.id)throw new Error('Bu Google hesabında YouTube kanalı bulunamadı.');
    accounts[channel.id]={title:channel.snippet.title,refreshToken:granted.refresh_token,accessToken:granted.access_token,expiresAt:Date.now()+(granted.expires_in??3600)*1000};
    await save();return {id:channel.id,title:channel.snippet.title};
  }
  async function access(id){
    const account=accounts[id];if(!account)throw new Error('Seçilen YouTube kanalı bağlı değil.');
    if(account.accessToken&&account.expiresAt>Date.now()+60000)return account.accessToken;
    const fresh=await token({grant_type:'refresh_token',refresh_token:account.refreshToken});
    account.accessToken=fresh.access_token;account.expiresAt=Date.now()+(fresh.expires_in??3600)*1000;await save();return account.accessToken;
  }
  async function upload(job,videoPath,update){
    const choice=job.options.youtube,channelId=choice?.channelId;
    if(!channelId||!accounts[channelId])throw new Error('YouTube kanalı artık bağlı değil.');
    const size=(await stat(videoPath)).size;
    const uploadText=await readFile(path.join(path.dirname(videoPath),'upload.txt'),'utf8');
    const [title,...descriptionLines]=uploadText.trimEnd().split(/\r?\n/);
    let session=job.youtube?.session;
    const bearer=await access(channelId);
    if(!session){
      const metadata={snippet:{title,description:descriptionLines.join('\n').trim(),tags:job.copy.tags,categoryId:job.mode==='statistics'?'27':'20'},status:{privacyStatus:choice.privacyStatus}};
      const response=await request(`${uploadApi}?uploadType=resumable&part=snippet,status`,{method:'POST',headers:{Authorization:`Bearer ${bearer}`,'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Length':String(size),'X-Upload-Content-Type':'video/mp4'},body:JSON.stringify(metadata)});
      if(!response.ok)throw new Error('YouTube yüklemesi başlatılamadı: '+await safeMessage(response));
      session=response.headers.get('location');if(!session?.startsWith('https://www.googleapis.com/upload/youtube/'))throw new Error('Google geçerli yükleme adresi vermedi.');
      await update({session,state:'uploading'});
    }
    // Always query the persisted session before sending bytes. A process can stop
    // after YouTube accepts the video but before our local result is saved.
    for(let attempt=0;attempt<4;attempt++){
      const auth=await access(channelId);
      const probe=await request(session,{method:'PUT',headers:{Authorization:`Bearer ${auth}`,'Content-Length':'0','Content-Range':`bytes */${size}`}});
      if(probe.ok){const result=await probe.json();if(!result.id||result.snippet?.channelId&&result.snippet.channelId!==channelId)throw new Error('YouTube video kimliği veya kanal eşleşmesi geçersiz.');return result.id;}
      if(probe.status===404)throw new Error('YouTube yükleme oturumu sona erdi. Olası çift yüklemeyi önlemek için otomatik yeniden başlatılmadı.');
      if(probe.status!==308)throw new Error('YouTube yükleme durumu: '+await safeMessage(probe));
      const range=probe.headers.get('range'),offset=range?Number(range.match(/-(\d+)$/)?.[1])+1:0;
      if(!Number.isSafeInteger(offset)||offset<0||offset>=size)throw new Error('YouTube yükleme aralığı geçersiz.');
      try{
        const response=await request(session,{method:'PUT',headers:{Authorization:`Bearer ${auth}`,'Content-Type':'video/mp4','Content-Length':String(size-offset),'Content-Range':`bytes ${offset}-${size-1}/${size}`},body:createReadStream(videoPath,{start:offset}),duplex:'half'});
        if(response.ok){const result=await response.json();if(!result.id||result.snippet?.channelId&&result.snippet.channelId!==channelId)throw new Error('YouTube video kimliği veya kanal eşleşmesi geçersiz.');return result.id;}
        if(response.status!==308&&response.status<500)throw new Error('YouTube yükleme hatası: '+await safeMessage(response));
      }catch(error){if(attempt===3)throw error;}
      await new Promise(resolve=>setTimeout(resolve,1000*2**attempt));
    }
    throw new Error('YouTube yüklemesi tamamlanamadı.');
  }
  return {load,list,begin,callback,upload,configured,has:id=>Boolean(accounts[id])};
}
