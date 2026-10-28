import data from './historical-commanders.json' with { type: 'json' };
import { commanderPortrait } from './historical-commander-art.js';
import './crown-battle-alliances.css';

export const COMMANDER_CATALOG = Array.isArray(data) ? data : data.commanders;
export const commanderById = new Map(COMMANDER_CATALOG.map(c => [c.id, c]));
const fold = value => value.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
export function commanderArt(commander) {
  const art = document.createElement('span'); art.className = 'leader-portrait'; art.setAttribute('aria-hidden', 'true');
  if (commander?.portrait === 'game') art.append(commanderPortrait(commander.id));
  else if (commander?.image?.startsWith('/warrior-references/')) {
    const img = document.createElement('img'); img.src = commander.image; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    img.onerror = () => { img.remove(); art.textContent = commander.name.slice(0, 1); };
    art.append(img);
  } else art.textContent = '—';
  return art;
}
export function mountCommanderPicker() {
  const dialog = document.createElement('dialog'); dialog.className = 'leader-picker'; dialog.setAttribute('aria-labelledby', 'leader-picker-title');
  dialog.innerHTML = `<header><div><span>KOMUTAN SEÇİMİ</span><h2 id="leader-picker-title">Ordunun komutanı</h2></div><button type="button" data-close aria-label="Komutan seçimini kapat">×</button></header><div class="leader-filters"><input type="search" aria-label="Komutan ara" placeholder="İsim veya medeniyet ara…"><select aria-label="Komutan medeniyeti"><option value="">Tüm medeniyetler</option></select></div><p class="leader-picker-note">Bir karta tıklayarak seç. Komutan kendi ordusunun gerisinde hareket eder.</p><div class="leader-results" role="status"></div><div class="leader-cards"></div>`;
  dialog.querySelector('.leader-picker-note').textContent = 'Komutan kendi ordusunun açılış dizilişini ve uygun özel taktiğini belirler; geriden yönetir. Elle verdiğin emirler önceliklidir.';
  const search = dialog.querySelector('input'), culture = dialog.querySelector('select'), list = dialog.querySelector('.leader-cards');
  const families = [...new Set(COMMANDER_CATALOG.map(c => c.faction))].sort((a, b) => a.localeCompare(b, 'tr'));
  for (const name of families) culture.add(new Option(name, name));
  let callback = null, selected = null;
  function render() {
    const query = fold(search.value.trim());
    const matches = COMMANDER_CATALOG.filter(c => (!culture.value || c.faction === culture.value) &&
      (!query || fold(`${c.name} ${c.faction} ${c.cultureName || ''}`).includes(query)));
    list.replaceChildren();
    for (const commander of [null, ...matches]) {
      const card = document.createElement('button'); card.type = 'button'; card.className = 'leader-option';
      card.dataset.leader = commander?.id || ''; card.setAttribute('aria-pressed', String((commander?.id || null) === selected));
      const copy = document.createElement('span'); copy.className = 'leader-option-copy';
      const title = document.createElement('strong'); title.textContent = commander?.name || 'Komutansız ordu';
      const faction = document.createElement('span'); faction.textContent = commander?.faction || 'Yalnız askerleri kullan';
      const role = document.createElement('small'); role.textContent = commander?.role || 'Komutana bağlı özel taktik uygulanmaz.';
      copy.append(title, faction, role); card.append(commanderArt(commander), copy);
      card.onclick = () => { const choose = callback; dialog.close(); choose?.(commander?.id || null); };
      list.append(card);
    }
    dialog.querySelector('.leader-results').textContent = matches.length ? `${matches.length} komutan` : 'Eşleşen komutan yok. Aramayı veya medeniyet filtresini değiştir.';
  }
  search.oninput = culture.onchange = render;
  dialog.querySelector('[data-close]').onclick = () => dialog.close();
  dialog.addEventListener('keydown', event => event.stopPropagation());
  document.body.append(dialog);
  return { open(id, name, choose) {
    selected = id; callback = choose; search.value = ''; culture.value = '';
    dialog.querySelector('h2').textContent = `${name} · Komutan seç`;
    render(); dialog.showModal(); search.focus();
  }, close: () => dialog.close() };
}
