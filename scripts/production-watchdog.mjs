// A slow export is healthy while it continues producing frames. Only time out
// when a single operation stops making progress for the whole idle interval.
export function createProductionWatchdog(onTimeout,{idleMs=20*60*1000}={}){
  let error=null,closed=false;
  const timeout=()=>{
    if(closed)return;
    error=Object.assign(new Error('Video üretimi uzun süre ilerlemediği için durduruldu. Otomatik olarak baştan denenmeyecek.'),{code:'PRODUCTION_STALLED',nonRetryable:true});
    onTimeout(error);
  };
  let timer=setTimeout(timeout,idleMs);
  return {
    progress(){if(!closed&&!error){clearTimeout(timer);timer=setTimeout(timeout,idleMs);}},
    get error(){return error;},
    close(){closed=true;clearTimeout(timer);}
  };
}
