import {MATCH_LEAGUES,matchDay,validMatchDate,shiftMatchDay,normalizeMatch} from '../src/match-data.js';

// ESPN's public scoreboard endpoints currently need no API key. Cache and coalesce
// reads; callers cannot choose a remote host or arbitrary URL.
export function createMatchService({fetcher=fetch,now=Date.now}={}){
  const cache=new Map(),pending=new Map();
  return async function getMatches(leagueId,date){
    const league=MATCH_LEAGUES.find(l=>l.id===leagueId);
    if(!league||!validMatchDate(date))throw new Error('Geçerli bir lig ve tarih seç.');
    const key=leagueId+':'+date,previous=cache.get(key),ttl=matchDay(now())===date?60000:300000;
    if(previous&&now()-previous.timestamp<ttl)return {...previous.data,stale:false};
    if(pending.has(key))return pending.get(key);
    const request=(async()=>{
      try{
        // ESPN groups fixtures by its US calendar. Read both days and then filter
        // by Istanbul date so a Monday-night NFL game appears on Tuesday here.
        const pages=await Promise.all([shiftMatchDay(date,-1),date].map(async day=>{
          const url=`https://site.api.espn.com/apis/site/v2/sports/${league.path}/scoreboard?dates=${day.replaceAll('-','')}&limit=100`;
          const response=await fetcher(url,{signal:AbortSignal.timeout(10000),headers:{Accept:'application/json'}});
          if(!response.ok)throw new Error('ESPN yanıt vermedi.');
          const data=await response.json();if(!Array.isArray(data.events))throw new Error('Maç verisi okunamadı.');return data.events;
        }));
        const events=[...new Map(pages.flat().map(event=>[String(event.id),event])).values()]
          .map(event=>normalizeMatch(event,league)).filter(event=>event&&matchDay(event.startsAt)===date)
          .sort((a,b)=>a.startsAt.localeCompare(b.startsAt)||a.id.localeCompare(b.id));
        const timestamp=now(),data={league:league.id,date,source:'ESPN',updatedAt:new Date(timestamp).toISOString(),events,stale:false};
        cache.delete(key);cache.set(key,{timestamp,data});while(cache.size>80)cache.delete(cache.keys().next().value);
        return data;
      }catch{
        if(previous)return {...previous.data,stale:true,warning:'Kaynak güncellenemedi. Son alınan veriler gösteriliyor.'};
        const error=new Error('Maç verisi şu an alınamıyor. İnternet bağlantını kontrol edip yeniden dene.');error.status=502;throw error;
      }finally{pending.delete(key);}
    })();
    pending.set(key,request);return request;
  };
}
