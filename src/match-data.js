export const MATCH_LEAGUES=[
  {id:'nfl',name:'Amerikan Futbolu · NFL',path:'football/nfl'},
  {id:'nba',name:'Basketbol · NBA',path:'basketball/nba'},
  {id:'tur.1',name:'Futbol · Süper Lig',path:'soccer/tur.1'},
  {id:'eng.1',name:'Futbol · Premier League',path:'soccer/eng.1'},
  {id:'esp.1',name:'Futbol · La Liga',path:'soccer/esp.1'},
  {id:'ita.1',name:'Futbol · Serie A',path:'soccer/ita.1'},
  {id:'ger.1',name:'Futbol · Bundesliga',path:'soccer/ger.1'},
  {id:'fra.1',name:'Futbol · Ligue 1',path:'soccer/fra.1'},
  {id:'por.1',name:'Futbol · Portekiz Ligi',path:'soccer/por.1'},
  {id:'bra.1',name:'Futbol · Brezilya Ligi',path:'soccer/bra.1'},
  {id:'arg.1',name:'Futbol · Arjantin Ligi',path:'soccer/arg.1'},
];
export const MATCH_TIMEZONE='Europe/Istanbul';
const dayFormat=new Intl.DateTimeFormat('en-CA',{timeZone:MATCH_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'});
export function matchDay(value=new Date()){
  const parts=Object.fromEntries(dayFormat.formatToParts(new Date(value)).map(p=>[p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function validMatchDate(value){
  return typeof value==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
}
export function shiftMatchDay(day,offset){return new Date(Date.parse(day+'T12:00:00Z')+offset*86400000).toISOString().slice(0,10);}
export function espnURL(value,image=false){
  try{const url=new URL(value);return url.protocol==='https:'&&(image?url.hostname==='a.espncdn.com':['www.espn.com','www.espn.co.uk'].includes(url.hostname))?url.href:null;}catch{return null;}
}
export function normalizeMatch(event,league){
  const competition=event.competitions?.[0],teams=competition?.competitors;
  if(!Array.isArray(teams))return null;
  const home=teams.find(t=>t.homeAway==='home'),away=teams.find(t=>t.homeAway==='away');
  const startsAt=competition.date??event.date;
  if(!home?.team||!away?.team||!Number.isFinite(Date.parse(startsAt)))return null;
  const status=competition.status??event.status??{},type=status.type??{},name=type.name??'';
  let state='scheduled',label='Başlamadı';
  if(/POSTPONED/.test(name)){state='postponed';label='Ertelendi';}
  else if(/CANCEL/.test(name)){state='cancelled';label='İptal edildi';}
  else if(/SUSPEND|DELAY/.test(name)){state='delayed';label='Ara verildi / gecikiyor';}
  else if(type.completed||type.state==='post'){state='final';label='Maç bitti';}
  else if(type.state==='in'){
    state='live';label='Canlı';
    if(/HALFTIME/.test(name))label='Devre arası';
    else if(status.displayClock){
      const period=Number(status.period)||0;
      label=league.path.startsWith('soccer/')?status.displayClock:`${period>4?'Uzatma':period+'. çeyrek'} · ${status.displayClock}`;
    }
  }
  const team=value=>({id:String(value.team.id??value.id),name:String(value.team.displayName??value.team.name??'Takım'),
    abbreviation:String(value.team.abbreviation??''),logo:espnURL(value.team.logo,true),
    score:state==='scheduled'||['postponed','cancelled'].includes(state)?null:(value.score==null||value.score===''?null:String(value.score)),winner:!!value.winner});
  return {id:String(event.id),league:league.id,startsAt,state,label,home:team(home),away:team(away),
    venue:competition.venue?.fullName??'',sourceUrl:espnURL(event.links?.find(l=>l.rel?.includes('summary'))?.href??event.links?.[0]?.href)};
}
