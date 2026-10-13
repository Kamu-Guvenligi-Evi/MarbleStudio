import './channel-picker.css';
import './studio-navigation.css';
import {mountChannelPicker} from './channel-branding.js';

const groups = [
  ['Yarış ve mücadele', [['track','Parkur','↘'],['arena','Küre Arenası','◉'],['territory','Alan Savaşı','⬡'],['ball-duel','Top Düellosu','⚔'],['rock-paper-scissors','Taş Kâğıt Makas','✂']]],
  ['Akış ve kırma', [['spiral','Spiral','◎'],['spiral-breaker','Spiral Kırıcı','▧'],['glass-breaker','Cam Kırıcı','◇'],['ring-escape','Halka Kaçışı','◌']]],
  ['Veri ve deney', [['pi','Pi Çarpışmaları','π'],['statistics','İstatistik','▥']]],
];
const standalone = new Set(['ball-duel','spiral-breaker','glass-breaker','ring-escape','rock-paper-scissors']);

// Move the existing controls, keeping their listeners, values and recording locks.
function settingGroup(parent, title, description, nodes, open = false) {
  nodes = nodes.filter(Boolean);
  if (!nodes.length) return;
  const details = document.createElement('details');
  details.className = 'studio-setting-group';
  details.open = open;
  const summary = document.createElement('summary');
  const label = document.createElement('strong'); label.textContent = title;
  const hint = document.createElement('span'); hint.textContent = description;
  summary.append(label, hint);
  const content = document.createElement('div');content.className = 'studio-setting-content';
  content.append(...nodes);details.append(summary, content);parent.append(details);
}

function organizeSettings(mode) {
  const select = selector => document.querySelector(selector);
  if (mode === 'main') {
    const sidebar = select('.watch-sidebar');
    if (!sidebar) return;
    const settings = document.createElement('div');settings.className = 'studio-settings';
    sidebar.prepend(settings);
    settingGroup(settings, 'Ses ve müzik', 'Oyun efektleri ve arka plan müziği', [select('.watch-sidebar .game-sound-director'), select('.watch-sidebar .music-panel')]);
    settingGroup(settings, 'İzleme ve kayıt', 'Kamera, oynatma hızı ve tarayıcı kaydı', [select('.watch-sidebar .playback-settings'), select('.watch-sidebar .video-panel')]);
    select('.watch-sidebar .music-panel').open = true;
    select('.watch-sidebar .playback-settings').open = true;
    return;
  }
  const parent = select(mode === 'ring-escape' ? '#settings' : mode === 'ball-duel' ? '.duel-controls' : '.game-info');
  const settings = document.createElement('div');settings.className = 'studio-settings';
  if(mode === 'ring-escape')parent.prepend(settings);
  else parent.querySelector('.intro,.description').after(settings);
  const sections = [...parent.querySelectorAll(':scope > .control-section')];
  const nodes = selector => [...parent.querySelectorAll(':scope > '+selector)];
  if (mode === 'ring-escape') {
    settingGroup(settings, 'Oyun ve akış', 'Hazır akışlar, halka sayısı ve tempo', [sections[1]], true);
    settingGroup(settings, 'Görünüm', 'Tema, top ve sahne renkleri', [sections[0]]);
    settingGroup(settings, 'Ses ve müzik', 'Efektler, müzik ve hazır ses düzenleri', [sections[2], ...nodes('.game-sound-director'), select('#sound-director')]);
  } else if (mode === 'ball-duel') {
    settingGroup(settings, 'Karşılaşma', 'Oyuncular ve top görselleri', [sections[0]], true);
    settingGroup(settings, 'Sahne ve tempo', 'Tema, başlangıç canı ve hız', [sections[1]]);
    settingGroup(settings, 'Ses ve müzik', 'Hazır ses düzenleri ve oyun efektleri', nodes('.game-sound-director'));
  } else if (mode === 'glass-breaker') {
    settingGroup(settings, 'Oyun ayarları', 'Topların gelişi ve simülasyon hızı', [...nodes('.auto-spawn'),...nodes('.speed-label'),...nodes('.control-switch')], true);
    settingGroup(settings, 'Görünüm', 'Cam, top ve renk seçenekleri', nodes('.appearance'));
    settingGroup(settings, 'Ses ve müzik', 'Hazır ses düzenleri ve oyun efektleri', nodes('.game-sound-director'));
    settingGroup(settings, 'Nasıl oynanır?', 'Kontroller ve klavye kısayolları', [...nodes('.hint'),...nodes('.keyboard'),...nodes('.reference-link')]);
  } else {
    settingGroup(settings, 'Harita ve oyun', 'Parkur seçimi, kontrol ve akış hızı', [...nodes('.map-heading'),...nodes('.map-picker'),...nodes('.watch-tour'),...nodes('.control-switch'),select('#control-hint'),...nodes('.watch-settings'),...nodes('.sequence-setting')], true);
    settingGroup(settings, 'Ses ve müzik', 'Oyun efektleri ve videodaki sesler', [...nodes('.game-sound-director'),...nodes('.breaker-sounds')]);
    settingGroup(settings, 'Nasıl oynanır?', 'Bonuslar ve klavye kısayolları', [...nodes('.bonus-legend'),...nodes('.keyboard')]);
  }
}

export function mountStudioNavigation(mode = 'main') {
  if (new URLSearchParams(location.search).has('video-render') || document.querySelector('.studio-navigation')) return;
  const main = mode === 'main';
  document.body.classList.add('studio-organized');
  const rail = document.createElement('aside');rail.className = 'studio-navigation';rail.setAttribute('aria-label','Stüdyo menüsü');
  const brand = document.createElement('a');brand.className = 'studio-brand';brand.href = '/index.html';
  brand.innerHTML = '<span aria-hidden="true">◉</span><span>Marble <b>Studio</b><small>OYUN STÜDYOSU</small></span>';
  const toggle = document.createElement('button');toggle.type = 'button';toggle.className = 'studio-menu-toggle';toggle.setAttribute('aria-controls','studio-game-menu');
  const menu = document.createElement('div');menu.id = 'studio-game-menu';
  const nav = document.createElement('nav');nav.className = 'studio-game-list';nav.setAttribute('aria-label','Oyunlar ve stüdyolar');
  for (const [title, games] of groups) {
    const section = document.createElement('section');section.className = 'studio-nav-group';
    const heading = document.createElement('h2');heading.textContent = title;section.append(heading);
    for (const [id, name, icon] of games) {
      const existing = main && document.getElementById('nav-'+id);
      const item = existing || document.createElement('a');
      if (!existing) item.href = standalone.has(id) ? `/${id}.html` : `/index.html?mode=${id}`;
      item.dataset.studioGame = id;
      item.innerHTML = `<span aria-hidden="true">${icon}</span><span>${name}</span>`;
      if(id === mode)item.setAttribute('aria-current','page');
      section.append(item);
    }
    nav.append(section);
  }
  document.querySelector('.app-header .view-tabs')?.remove();
  const footer = document.createElement('div');footer.className = 'studio-nav-tools';
  const automatic = document.getElementById('automatic-back');if(automatic)footer.append(automatic);
  const backups = document.querySelector('.studio-actions');if(backups)footer.append(backups);
  menu.append(nav,footer);rail.append(brand,toggle,menu);document.body.prepend(rail);

  let header = document.querySelector('.app-header,.ring-header,.duel-header');
  if (!header) {header = document.createElement('header');rail.after(header);}
  header.classList.add('studio-toolbar');
  mountChannelPicker(header);
  header.querySelector('.brand')?.remove();
  header.querySelector('nav > a[href="/"]')?.remove();
  document.querySelector('.game-info > .back')?.remove();
  const context = document.createElement('div');context.className = 'studio-context';header.prepend(context);
  const exports = document.querySelector('.studio-export-bar');if(exports)header.append(exports);
  const breakerActions = document.querySelector('.breaker-video-actions');
  if(breakerActions){
    const actions=document.createElement('nav');actions.setAttribute('aria-label','Video işlemleri');
    actions.append(document.getElementById('studio-videos'),document.getElementById('studio-export'));header.append(actions);
    breakerActions.remove();
  }
  header.querySelector('nav')?.setAttribute('aria-label','Video işlemleri');
  const mobile = matchMedia('(max-width: 1050px)');
  const setOpen = open => {rail.classList.toggle('menu-open',open);toggle.setAttribute('aria-expanded',String(open));};
  setOpen(!mobile.matches);mobile.addEventListener('change',()=>setOpen(!mobile.matches));
  toggle.addEventListener('click',()=>setOpen(toggle.getAttribute('aria-expanded')!=='true'));
  rail.addEventListener('keydown',event=>{if(event.key==='Escape'&&mobile.matches){setOpen(false);toggle.focus();}});
  nav.addEventListener('click',event=>{
    const item=event.target.closest('[data-studio-game]');if(!item||item.disabled)return;
    if(main && document.getElementById('nav-track').disabled){event.preventDefault();event.stopPropagation();return;}
    if(main)document.getElementById('automatic-manual')?.click();
    if(mobile.matches)setOpen(false);
  },true);
  function sync(){
    const active=main?nav.querySelector('[aria-pressed="true"]'):nav.querySelector('[aria-current="page"]');
    const automaticOpen=document.body.classList.contains('automatic-home');
    context.textContent=automaticOpen?'Otomatik üretim':active?.querySelector('span:last-child')?.textContent||'Oyun stüdyosu';
    toggle.textContent='☰  '+(active?.querySelector('span:last-child')?.textContent||'Oyunlar')+' · Oyun seç';
    for(const item of nav.querySelectorAll('button')){
      if(item===active&&!automaticOpen)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');
    }
  }
  const observer=new MutationObserver(sync);observer.observe(nav,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  organizeSettings(mode);
  if(main){const requested=new URLSearchParams(location.search).get('mode');document.getElementById('nav-'+requested)?.click();}
  sync();
}
