import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';

export async function serveOutput(req,res,target,{name,id,preview}){
  const info=await stat(target);
  const headers={'Content-Type':name.endsWith('.mp4')?'video/mp4':name.endsWith('.webm')?'video/webm':name.endsWith('.jpg')?'image/jpeg':name.endsWith('.json')?'application/json':'text/plain; charset=utf-8','Accept-Ranges':'bytes','Content-Disposition':`${preview||name.endsWith('.jpg')?'inline':'attachment'}; filename="${id}-${name}"`};
  let start=0,end=info.size-1,status=200;
  if(req.headers.range){
    const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
    if(match[1]){start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
    else start=Math.max(0,info.size-Number(match[2]));
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
    status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
  }
  headers['Content-Length']=end-start+1;res.writeHead(status,headers);
  if(req.method==='HEAD'){res.end();return;}
  const stream=createReadStream(target,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}
