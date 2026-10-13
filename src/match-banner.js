import {MATCH_LEAGUES,MATCH_TIMEZONE,matchDay,shiftMatchDay,validMatchDate} from './match-data.js';
import {fetchMatches} from './match-client.js';
import './match-banner.css';

const time=new Intl.DateTimeFormat('tr-TR',{timeZone:MATCH_TIMEZONE,hour:'2-digit',minute:'2-digit'});
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups=[{id:'soccer',name:'Futbol',leagues:MATCH_LEAGUES.filter(l=>l.path.startsWith('soccer/'))},
  {id:'nfl',name:'Amerikan futbolu · NFL',leagues:MATCH_LEAGUES.filter(l=>l.id==='nfl')}];

export function createMatchBanner({open,prepareLogos,logoFor}){
  const banner=document.createElement('section');banner.id='match-banner';banner.setAttribute('aria-labelledby','match-banner-title');
  banner.innerHTML=`<div class="match-banner-heading"><div><span class="match-banner-dot" aria-hidden="true"></span><h2 id="match-banner-title">Maç gündemi</h2></div>
    <div class="match-banner-actions"><button id="match-banner-prev" aria-label="Maçlarda önceki gün">←</button><input id="match-banner-date" type="date" aria-label="Maç tarihi" min="2000-01-01" max="2099-12-31"><button id="match-banner-next" aria-label="Maçlarda sonraki gün">→</button><button id="match-banner-today">Bugün</button><button id="match-banner-refresh">Yenile</button></div></div>
    <div class="match-banner-groups">${groups.map(g=>`<div class="match-banner-group" data-banner-sport="${g.id}"><div class="match-banner-label"><h3>${g.name}</h3><span class="match-banner-summary">Yükleniyor…</span></div><div class="match-banner-strip" tabindex="0" role="region" aria-label="${g.name} maçları"></div></div>`).join('')}</div>
    <div class="match-banner-footer"><p id="match-banner-status" role="status">Maçlar yükleniyor…</p><button id="match-banner-calendar">Maç takvimi ↗</button></div>`;
  document.querySelector('.app-header').after(banner);
  const $=id=>banner.querySelector('#'+id),date=$('match-banner-date'),status=$('match-banner-status'),entries=new Map();
  date.value=matchDay();let selectedDate=date.value,followToday=true,timer=null,controller=null,revision=0;
  function renderGroup(group){
    const root=banner.querySelector(`[data-banner-sport="${group.id}"]`),strip=root.querySelector('.match-banner-strip'),scroll=strip.scrollLeft;
    const focused=strip.contains(document.activeElement)?document.activeElement.dataset.matchKey:null;
    const records=group.leagues.map(l=>entries.get(l.id)).filter(Boolean),available=records.filter(r=>r.data),failed=records.filter(r=>r.error||r.data?.stale).length;
    const events=available.flatMap(r=>r.data.events).sort((a,b)=>(b.state==='live')-(a.state==='live')||a.startsAt.localeCompare(b.startsAt));
    const oldest=available.length?Math.min(...available.map(r=>Date.parse(r.data.updatedAt))):null;
    root.querySelector('.match-banner-summary').textContent=(available.length?`${events.length} maç · ${time.format(oldest)}`:records.length===group.leagues.length?'Veri alınamadı':'Yükleniyor…')+(failed?' · Güncellenemedi':'');
    strip.replaceChildren();
    for(const match of events){
      const card=document.createElement('button');card.type='button';card.className='banner-match';card.dataset.state=match.state;card.dataset.matchKey=match.league+':'+match.id;
      const league=MATCH_LEAGUES.find(l=>l.id===match.league)?.name.replace(/^Futbol · /,'')??group.name;
      const team=t=>{
        const logo=logoFor(t);
        return `<span class="banner-match-team"><span class="banner-team-logo">${logo?`<img src="${escape(logo)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:`<span>${escape(t.abbreviation?.slice(0,3)??'')}</span>`}</span><span class="banner-team-name">${escape(t.name)}</span><strong>${escape(t.score??'–')}</strong></span>`;
      };
      card.innerHTML=`<span class="banner-match-meta"><span>${escape(league)}</span><time datetime="${escape(match.startsAt)}">${time.format(new Date(match.startsAt))}</time></span>${team(match.home)}${team(match.away)}<span class="banner-match-state">${match.state==='live'?'● Canlı · ':''}${escape(match.label)}</span>`;
      card.setAttribute('aria-label',`${league}: ${match.home.name} – ${match.away.name}, ${match.label}. Maçı aç`);
      card.onclick=()=>open({league:match.league,date:selectedDate});
      for(const [i,row] of [...card.querySelectorAll('.banner-match-team')].entries()){
        const image=row.querySelector('img');if(image)image.onerror=()=>{const t=i===0?match.home:match.away;image.replaceWith(document.createTextNode(t.abbreviation||t.name.slice(0,3)));};
      }
      strip.append(card);
      if(focused===card.dataset.matchKey)card.focus({preventScroll:true});
    }
    if(!events.length){
      const empty=document.createElement('p');empty.className='match-banner-empty';
      empty.textContent=records.length<group.leagues.length?'Maçlar yükleniyor…':failed?(available.length?'Bazı liglere ulaşılamadı. Yenileyerek tekrar dene.':'Maç verisi alınamadı. Yenileyerek tekrar dene.'):'Bu tarihte maç yok. Önceki veya sonraki günü seçebilirsin.';
      strip.append(empty);
    }
    strip.scrollLeft=scroll;
  }
  async function refresh(){
    if(document.hidden)return;
    clearTimeout(timer);controller?.abort();const request=++revision;
    if(followToday)date.value=matchDay();
    if(!validMatchDate(date.value)){status.textContent='Geçerli bir tarih seç.';$('match-banner-refresh').disabled=false;return;}
    if(selectedDate!==date.value){selectedDate=date.value;entries.clear();}
    groups.forEach(renderGroup);status.textContent='Maçlar güncelleniyor…';$('match-banner-refresh').disabled=true;
    const current=new AbortController();controller=current;const timeout=setTimeout(()=>current.abort(),15000);
    const leagues=groups.flatMap(g=>g.leagues);let cursor=0;
    try{
      await prepareLogos();if(request!==revision)return;
      // Four concurrent local requests keep initial loading quick without a burst
      // of all upstream league requests. The service also caches identical reads.
      await Promise.all(Array.from({length:4},async()=>{
        while(cursor<leagues.length&&request===revision){
          const league=leagues[cursor++];
          try{
            const data=await fetchMatches(league.id,selectedDate,current.signal);if(request!==revision)return;
            entries.set(league.id,{data,error:false});
          }catch{
            if(request!==revision)return;
            entries.set(league.id,{data:entries.get(league.id)?.data,error:true});
          }
          renderGroup(groups.find(g=>g.leagues.includes(league)));
        }
      }));
      if(request!==revision)return;
      const failed=[...entries.values()].some(r=>r.error||r.data?.stale);
      status.textContent=failed?'ESPN · Bazı veriler güncellenemedi; görünen son saatleri kontrol et.':'ESPN · Türkiye saati · Dakikada bir yenilenir';
    }finally{
      clearTimeout(timeout);
      if(request===revision){$('match-banner-refresh').disabled=false;if(!document.hidden)timer=setTimeout(refresh,60000);}
    }
  }
  date.onchange=()=>{followToday=date.value===matchDay();void refresh();};
  for(const [id,offset] of [['match-banner-prev',-1],['match-banner-next',1]])$(id).onclick=()=>{date.value=shiftMatchDay(validMatchDate(date.value)?date.value:matchDay(),offset);followToday=date.value===matchDay();void refresh();};
  $('match-banner-today').onclick=()=>{followToday=true;void refresh();};$('match-banner-refresh').onclick=refresh;
  $('match-banner-calendar').onclick=()=>open({date:validMatchDate(date.value)?date.value:matchDay()});
  document.addEventListener('visibilitychange',()=>{
    clearTimeout(timer);
    if(document.hidden){++revision;controller?.abort();$('match-banner-refresh').disabled=false;}
    else void refresh();
  });
  void refresh();
}
