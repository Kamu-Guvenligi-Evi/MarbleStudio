import {MATCH_LEAGUES,MATCH_TIMEZONE,matchDay,validMatchDate,shiftMatchDay,espnURL} from './match-data.js';
import {englishOutput} from './output-language.js';
import {fetchMatches} from './match-client.js';
import {createMatchBanner} from './match-banner.js';
import './matches.css';

const timeFormat=new Intl.DateTimeFormat('tr-TR',{timeZone:MATCH_TIMEZONE,hour:'2-digit',minute:'2-digit'});
const dateFormat=new Intl.DateTimeFormat('tr-TR',{timeZone:MATCH_TIMEZONE,day:'numeric',month:'long',year:'numeric'});
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function createMatches(){
  const dialog=document.createElement('dialog');dialog.id='matches-dialog';dialog.className='matches-dialog';dialog.setAttribute('aria-labelledby','matches-title');
  dialog.innerHTML=`<div class="matches-heading"><div><p class="eyebrow">FİKSTÜR VE SKORLAR</p><h2 id="matches-title">Maçlar</h2><p>Saatler Türkiye saatidir. Canlı skorlar kaynak güncellendikçe yenilenir.</p></div><button id="matches-close" class="button" aria-label="Maçları kapat">×</button></div>
    <div class="matches-sports" role="group" aria-label="Spor seç"><button class="button secondary" data-match-sport="soccer" aria-pressed="true">Futbol</button><button class="button secondary" data-match-sport="nba" aria-pressed="false">Basketbol · NBA</button><button class="button secondary" data-match-sport="nfl" aria-pressed="false">Amerikan Futbolu · NFL</button></div>
    <div class="matches-controls"><label>Lig<select id="matches-league"></select></label><label>Tarih<input id="matches-date" type="date" min="2000-01-01" max="2099-12-31"></label><label>Durum<select id="matches-filter"><option value="all">Tüm maçlar</option><option value="live">Canlı</option><option value="scheduled">Başlamadı</option><option value="final">Bitti</option></select></label></div>
    <div class="matches-actions"><div><button class="button secondary" id="matches-prev" aria-label="Önceki gün">←</button><button class="button secondary" id="matches-today">Bugün</button><button class="button secondary" id="matches-next" aria-label="Sonraki gün">→</button></div><button class="button secondary" id="matches-refresh">Yenile</button></div>
    <p id="matches-status" role="status" aria-live="polite"></p><div id="matches-list" class="matches-list"></div>
    <footer class="matches-footer"><span>Kaynak: ESPN · Ekran açıkken dakikada bir güncellenir.</span><a href="https://www.espn.com/" target="_blank" rel="noopener noreferrer">ESPN ↗</a></footer>`;
  document.body.append(dialog);
  const $=id=>dialog.querySelector('#'+id),league=$('matches-league'),date=$('matches-date'),list=$('matches-list'),status=$('matches-status');
  for(const [label,filter] of [['Futbol',item=>item.path.startsWith('soccer/')],['Basketbol',item=>item.id==='nba'],['Amerikan futbolu',item=>item.id==='nfl']]){
    const group=document.createElement('optgroup');group.label=label;
    for(const item of MATCH_LEAGUES.filter(filter))group.append(new Option(item.name,item.id));league.append(group);
  }
  league.value='tur.1';
  try{const saved=localStorage.getItem('marble-studio-match-league');if(MATCH_LEAGUES.some(l=>l.id===saved))league.value=saved;}catch{}
  date.value=matchDay();
  let timer=null,controller=null,revision=0,data=null,dataKey='',catalogPromise,localLogos=new Map();
  let lastFootball=MATCH_LEAGUES.find(item=>item.id===league.value)?.path.startsWith('soccer/')?league.value:'tur.1';
  function syncSport(){
    const soccer=MATCH_LEAGUES.find(item=>item.id===league.value)?.path.startsWith('soccer/');
    if(soccer)lastFootball=league.value;
    for(const button of dialog.querySelectorAll('[data-match-sport]'))button.setAttribute('aria-pressed',String(button.dataset.matchSport===(soccer?'soccer':league.value)));
  }
  syncSport();
  const nameKey=name=>String(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
  function loadLogos(){
    return catalogPromise??=fetch('/catalog/manifest.json').then(response=>response.json()).then(catalog=>{
      const logos=new Map();
      for(const item of catalog.items??[]){
        if(!['teams','nba','nfl'].includes(item.category)||!/^\/catalog\/[a-z0-9-]+\.(png|webp|jpg|svg)$/.test(item.src))continue;
        logos.set(nameKey(item.name),item.src);logos.set(nameKey(englishOutput(item.name)),item.src);
        if(item.name==='LA Lakers')logos.set(nameKey('Los Angeles Lakers'),item.src);
      }
      return logos;
    }).catch(()=>new Map());
  }
  function render(){
    list.replaceChildren();if(!data)return;
    const filter=$('matches-filter').value,events=data.events.filter(e=>filter==='all'||e.state===filter);
    if(!events.length){const empty=document.createElement('p');empty.className='matches-empty';empty.textContent=filter==='all'?'Bu tarihte maç görünmüyor. Başka bir gün veya lig seçebilirsin.':'Bu durumda maç yok. Tüm maçlar seçeneğine geçebilirsin.';list.append(empty);return;}
    const teamHTML=team=>{
      const logo=localLogos.get(nameKey(team.name))??espnURL(team.logo,true);
      return `<div class="match-team"><span class="match-logo">${logo?`<img src="${escape(logo)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:`<span>${escape(team.abbreviation.slice(0,3))}</span>`}</span><span>${escape(team.name)}</span><strong>${escape(team.score??'–')}</strong></div>`;
    };
    for(const match of events){
      const card=document.createElement('article');card.className='match-card';card.dataset.state=match.state;
      const url=espnURL(match.sourceUrl);
      card.innerHTML=`<div class="match-heading"><span class="match-state">${match.state==='live'?'● Canlı · ':''}${escape(match.label)}</span><time datetime="${escape(match.startsAt)}">${timeFormat.format(new Date(match.startsAt))}</time></div>${teamHTML(match.home)}${teamHTML(match.away)}<div class="match-footer"><span>${escape(match.venue)}</span>${url?`<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">Detay ↗</a>`:''}</div>`;
      for(const [i,img] of [...card.querySelectorAll('.match-team')].map((row,i)=>[i,row.querySelector('img')]))if(img)img.onerror=()=>{
        const fallback=document.createElement('span'),team=i===0?match.home:match.away;fallback.textContent=team.abbreviation||team.name.slice(0,3);img.replaceWith(fallback);
      };
      list.append(card);
    }
  }
  async function refresh(){
    if(!dialog.open)return;
    syncSport();
    clearTimeout(timer);controller?.abort();const request=++revision;
    if(!validMatchDate(date.value)){status.textContent='Geçerli bir tarih seç.';data=null;list.replaceChildren();list.setAttribute('aria-busy','false');$('matches-refresh').disabled=false;return;}
    const key=league.value+':'+date.value;
    if(dataKey!==key){data=null;list.replaceChildren();}
    status.textContent='Maçlar yükleniyor…';$('matches-refresh').disabled=true;list.setAttribute('aria-busy','true');
    const requestController=new AbortController();controller=requestController;
    const timeout=setTimeout(()=>requestController.abort(),15000);
    try{
      const [result,logos]=await Promise.all([fetchMatches(league.value,date.value,requestController.signal),loadLogos()]);
      if(request!==revision||!dialog.open)return;
      data=result;dataKey=key;localLogos=logos;render();
      status.textContent=`${result.events.length} maç · ${dateFormat.format(new Date(result.updatedAt))} ${timeFormat.format(new Date(result.updatedAt))} itibarıyla${result.stale?' · '+result.warning:''}`;
      try{localStorage.setItem('marble-studio-match-league',league.value);}catch{}
    }catch(error){
      if(request!==revision||!dialog.open)return;
      status.textContent=(error.name==='AbortError'?'Bağlantı zaman aşımına uğradı. Yeniden dene.':error instanceof TypeError?'Maç hizmetine bağlanılamadı. Marble Studio kısayolunu yeniden açıp tekrar dene.':error.message)+(data?' Son alınan veriler gösteriliyor.':'');
    }finally{
      clearTimeout(timeout);
      if(request===revision){$('matches-refresh').disabled=false;list.setAttribute('aria-busy','false');if(dialog.open&&!document.hidden)timer=setTimeout(refresh,60000);}
    }
  }
  $('matches-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{++revision;clearTimeout(timer);controller?.abort();$('matches-refresh').disabled=false;list.setAttribute('aria-busy','false');});
  league.onchange=date.onchange=$('matches-refresh').onclick=refresh;
  for(const button of dialog.querySelectorAll('[data-match-sport]'))button.onclick=()=>{league.value=button.dataset.matchSport==='soccer'?lastFootball:button.dataset.matchSport;void refresh();};
  $('matches-filter').onchange=render;
  for(const [id,offset] of [['matches-prev',-1],['matches-next',1]])$(id).onclick=()=>{date.value=shiftMatchDay(validMatchDate(date.value)?date.value:matchDay(),offset);void refresh();};
  $('matches-today').onclick=()=>{date.value=matchDay();void refresh();};
  document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(dialog.open&&!document.hidden)void refresh();});
  function open(options={}){
    if(options.league&&MATCH_LEAGUES.some(l=>l.id===options.league)){league.value=options.league;$('matches-filter').value='all';}
    if(validMatchDate(options.date))date.value=options.date;
    if(!dialog.open)dialog.showModal();void refresh();
  }
  createMatchBanner({open,prepareLogos:async()=>{localLogos=await loadLogos();},logoFor:team=>localLogos.get(nameKey(team.name))??espnURL(team.logo,true)});
  return {open};
}
