import './historical-armies.css';
import './historical-armies-layout.css';
import units from './historical-catalogue.js';
import { SpriteLibrary } from './crown-battle-art.js';
import { middleEarthArtReady, paintedArtVersion } from './middle-earth-painted-art.js';
import { drawUnitCardArt } from './unit-card-art.js';
import { validateHistoricalArmies, restoreHistoricalArmies, HISTORICAL_TYPES, CIVILIZATIONS } from './historical-combat.js';
import { civilizationPicker, civilizationMatches } from './historical-civilization-ui.js';
import { civilizationSearchTerms } from './historical-culture-groups.js';
import { mountCommanders } from './historical-commanders.js';
import { ALLIANCE_STORAGE } from './crown-battle-alliances.js';
const key='marble-historical-armies-v1';
const $=id=>document.getElementById(id);
const launch=document.createElement('button');launch.id='launch-battle';launch.className='primary';launch.textContent='Orduları meydana çıkar →';$('download').before(launch);
const demo=document.createElement('a');demo.href='/crown-battle.html?historical=demo';demo.textContent='Hazır tarihî savaşı dene ↗';$('download').before(demo);
const commanders = mountCommanders(document.querySelector('main'), { onCreateArmy(team, army) {
 armies[team] = { ...army };
 for (const input of document.querySelectorAll(`.counts input[data-team="${team}"]`)) input.value = army[input.dataset.id] || 0;
 $('download').disabled = [...document.querySelectorAll('.counts input')].some(input => input.value === '' || !input.checkValidity() || !Number.isSafeInteger(Number(input.value)));
 refresh();
 try { localStorage.setItem(key, JSON.stringify(armies)); }
 catch { return 'Ordu hazır; tarayıcı kaydı kapalı. Sayfa açıkken sayılarını düzenleyebilirsin.'; }
 return 'Ordu hazır ve kaydedildi. Sayıları kartlardan da düzenleyebilirsin. “Orduları meydana çıkar” ile savaşa geç.';
} });
document.querySelector('.army-bar').after(commanders.element);
document.querySelector('.design-note').innerHTML='<span>TARİHÎ MUHAREBE</span><p>14 birlik savaş motoruna bağlı. Ordularını meydana çıkar; atlı okçuları, süvari hücumlarını, tüfekli yeniçerileri ve alan hasarı veren filleri yönet. Sayılar ve denge değerleri serbest kurgu içindir.</p><p>Kartlardaki çizimler görsel referanstır. Meydanda özgün, animasyonlu prototip çizimler kullanılır; referans çizimlerin oyun varlığı lisansları doğrulanmadı.</p>';
document.querySelector('.design-note p').textContent = `${units.length} birlik, ${CIVILIZATIONS.length} medeniyet. Bir medeniyet seç, iki ordunun sayılarını belirle ve meydana çık. Farklı medeniyetlerden karma ordular da kurabilirsin. Savaş dengesi serbest kurgu içindir.`;
document.querySelector('.seal strong').textContent = units.length;
document.querySelector('[data-filter="all"] span').textContent = units.length;
let armies=[{},{}],filter='all',civilization='';
$('filters').before(civilizationPicker('civilization', value => { civilization=value;refresh(); }));
const civilizationGroups = new Map();
for (const group of CIVILIZATIONS) {
 const section=document.createElement('section');section.className='civilization-group';section.dataset.civilization=group.name;
 const heading=document.createElement('h3');heading.className='civilization-heading';heading.textContent=group.name;
 const cards=document.createElement('div');cards.className='civilization-units';section.append(heading,cards);
 $('catalog').append(section);civilizationGroups.set(group.name,section);
}
try{const stored=localStorage.getItem(key);if(stored){const restored=restoreHistoricalArmies(JSON.parse(stored));armies=restored.armies;if(restored.note){$('save-note').textContent=restored.note;localStorage.setItem(key,JSON.stringify(armies));}}}catch{$('save-note').textContent='Kayıtlı ordu okunamadı. Ordular boş başlatıldı.';}
const icons={sword:'⚔',spear:'◆',cavalry:'♞',ranged:'➶',elephant:'◈',chariot:'◉'};
const sprites = new SpriteLibrary();
const artViews=document.createElement('div');artViews.className='art-views';artViews.setAttribute('role','group');artViews.setAttribute('aria-label','Birlik görselleri');
artViews.innerHTML='<button type="button" data-art-view="game" aria-pressed="true">Oyun çizimleri</button><button type="button" data-art-view="reference" aria-pressed="false">Tarihî kaynaklar</button>';
$('catalog').dataset.artView='game';$('filters').before(artViews);
artViews.addEventListener('click',event=>{const button=event.target.closest('button[data-art-view]');if(!button)return;$('catalog').dataset.artView=button.dataset.artView;for(const item of artViews.querySelectorAll('button'))item.setAttribute('aria-pressed',String(item===button));});
document.querySelector('.design-note p:last-child').textContent='Oyun çizimleri, birliklerin tarihî miğfer, zırh, kalkan ve silah biçimlerinden esinlenir. Renkler ve bazı ayrıntılar sanatsal yorumdur. Tarihî kaynaklar görünümünde referans görsellerini, atıfları ve belirsizlikleri inceleyebilirsin.';
for(const u of units){
 const card=document.createElement('article');card.className='unit-card';card.dataset.id=u.id;card.style.setProperty('--accent',u.color);
 card.innerHTML=`${u.image ? `<a class="art" href="${u.image}" target="_blank" rel="noopener" aria-label="${u.name} çizimini büyüt"><img src="${u.image}" alt="${u.name} için hazır tarihî savaşçı çizimi" loading="lazy"></a>` : '<div class="art"></div>'}<div class="unit-meta"><span class="faction">${u.faction}</span><h3>${u.name}</h3><span class="role">${icons[u.kind]} &nbsp;${u.role}</span><p class="unit-note">${u.note}</p>${u.source ? `<a class="source" href="${u.source}" target="_blank" rel="noopener noreferrer">${u.credit || 'Kaynak'} ↗</a>` : ''}</div><div class="counts">${[0,1].map(t=>`<label>${t?'KIZIL':'MAVİ'} ORDU<input data-team="${t}" data-id="${u.id}" type="number" min="0" step="1" value="${armies[t][u.id]||0}" aria-label="${t?'Kızıl':'Mavi'} ordu ${u.name} sayısı"></label>`).join('')}</div>`;
 const makePrototype=()=>{
  const art=document.createElement('div');art.className='art prototype-art';
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=240;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`${u.name} oyun çizimi`);
  const sprite=sprites.get(u.id,0,0,'idle',0);drawUnitCardArt(canvas,sprite,16);
  if(u.universe==='middle-earth')middleEarthArtReady.then(()=>{if(paintedArtVersion(u.id))drawUnitCardArt(canvas,sprites.get(u.id,0,0,'idle',0),16);});
  const caption=document.createElement('span');caption.textContent='OYUN ÇİZİMİ';art.append(canvas,caption);return art;
 };
 const reference=card.querySelector('.art');reference.classList.add('reference-art');
 const gameArt=makePrototype();gameArt.classList.add('game-art');card.prepend(gameArt);
 const referenceFallback=()=>{const fallback=makePrototype();fallback.classList.add('reference-art');reference.replaceWith(fallback);};
 if(!u.image)referenceFallback();
 else reference.querySelector('img').addEventListener('error',referenceFallback,{once:true});
 if(u.visualNote){const note=document.createElement('p');note.className='unit-note';note.textContent=u.visualNote;card.querySelector('.unit-meta').append(note);}
 if(u.license){const license=document.createElement('p');license.className='unit-note';license.textContent=`Görsel lisansı: ${u.license}`;card.querySelector('.unit-meta').append(license);}
 for(const source of (u.sources || []).filter(source=>source.url!==u.source)){const link=document.createElement('a');link.className='source';link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=`${source.title} ↗`;card.querySelector('.unit-meta').append(link);}
 for(const ref of (u.referenceImages || [])){
   const link=document.createElement('a');link.className='source';link.href=ref.image;link.target='_blank';link.rel='noopener';link.textContent=`Ek dönem görseli: ${ref.credit} ↗`;
   const source=document.createElement('a');source.className='source';source.href=ref.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent='Görselin kaynağı ↗';
   const license=document.createElement('a');license.className='source';license.href=ref.licenseUrl;license.target='_blank';license.rel='noopener noreferrer';license.textContent=`${ref.license} · Değişiklik: ${ref.changes}`;
   card.querySelector('.unit-meta').append(link,source,license);
 }
 if(u.alternateImage){const link=document.createElement('a');link.className='source';link.href=u.alternateImage;link.target='_blank';link.rel='noopener';link.textContent='İkinci maskeli savaşçı çizimi ↗';card.querySelector('.unit-meta').append(link);const credit=document.createElement('a');credit.className='source';credit.href=u.alternateSource;credit.target='_blank';credit.rel='noopener noreferrer';credit.textContent='İkinci çizimin kaynağı ↗';card.querySelector('.unit-meta').append(credit);}
 civilizationGroups.get(HISTORICAL_TYPES[u.id].faction).querySelector('.civilization-units').append(card);
}
function refresh(){
 const term=$('search').value.toLocaleLowerCase('tr').trim();let visible=0;
 for(const u of units){const cfg=HISTORICAL_TYPES[u.id];const chosen=(armies[0][u.id]||0)+(armies[1][u.id]||0)>0;const card=$('catalog').querySelector(`[data-id="${u.id}"]`);card.classList.toggle('chosen',chosen);const matches=filter==='all'||(filter==='selected'?chosen:filter==='infantry'?['sword','spear','ranged'].includes(u.kind):filter==='ranged'?cfg.role==='archer'||cfg.ranged:u.kind===filter);card.hidden=!(matches&&civilizationMatches(civilization,cfg.faction)&&`${u.name} ${cfg.faction} ${civilizationSearchTerms(cfg.faction)}`.toLocaleLowerCase('tr').includes(term));if(!card.hidden)visible++;}
 for(const section of civilizationGroups.values())section.hidden=![...section.querySelectorAll('.unit-card')].some(card=>!card.hidden);
 $('result-note').textContent=visible?`${visible} birlik gösteriliyor · Her kartta iki ordunun sayısını düzenleyebilirsin.`:'Eşleşen birlik yok.';
 for(let t=0;t<2;t++){const total=units.reduce((sum,u)=>sum+(armies[t][u.id]||0),0);$(`total-${t}`).textContent=total.toLocaleString('tr-TR');$(`mix-${t}`).replaceChildren(...units.filter(u=>armies[t][u.id]>0).map(u=>{const bar=document.createElement('i');bar.style.width=`${armies[t][u.id]/total*100}%`;bar.style.background=u.color;bar.title=`${u.name}: ${armies[t][u.id]}`;return bar;}));}
}
$('catalog').addEventListener('input',e=>{const input=e.target;if(!input.matches('input[data-team]'))return;const n=Number(input.value);if(input.value===''||!input.checkValidity()||!Number.isSafeInteger(n)){$('save-note').textContent='Sıfır veya pozitif tam sayı gir.';$('download').disabled=true;return;}armies[Number(input.dataset.team)][input.dataset.id]=n;$('download').disabled=[...document.querySelectorAll('.counts input')].some(i=>i.value===''||!i.checkValidity()||!Number.isSafeInteger(Number(i.value)));try{localStorage.setItem(key,JSON.stringify(armies));$('save-note').textContent='Ordu planı bu tarayıcıya kaydedildi.';}catch{$('save-note').textContent='Tarayıcı kaydı kapalı; planı indirebilirsin.';}refresh();});
$('filters').addEventListener('click',e=>{const button=e.target.closest('[data-filter]');if(!button)return;filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));refresh();});
$('search').addEventListener('input',refresh);
$('clear').onclick=()=>{armies=[{},{}];document.querySelectorAll('.counts input').forEach(i=>i.value=0);try{localStorage.removeItem(key);}catch{}$('download').disabled=false;$('save-note').textContent='İki ordunun sayıları sıfırlandı.';refresh();};
$('download').onclick=()=>{const leaders=commanders.getSelection();const plan={version:1,mode:'historical-army-design',armies:armies.map((a,t)=>({name:t?'Kızıl Ordu':'Mavi Ordu',commander:leaders[t],units:units.filter(u=>a[u.id]>0).map(u=>({id:u.id,name:u.name,faction:u.faction,count:a[u.id]}))}))};const url=URL.createObjectURL(new Blob([JSON.stringify(plan,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='tarihi-ordu-plani.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('save-note').textContent='Ordu planı indirildi.';};
launch.onclick=()=>{
 try {
  if([...document.querySelectorAll('.counts input')].some(i=>i.value===''||!i.checkValidity()||!Number.isSafeInteger(Number(i.value))))throw new Error('Sıfır veya pozitif tam sayı gir.');
  const plan=validateHistoricalArmies(armies);localStorage.setItem(key,JSON.stringify(plan));localStorage.removeItem(ALLIANCE_STORAGE);location.href='/crown-battle.html?historical=1';
 } catch(error){$('save-note').textContent=error.message;}
};
refresh();
