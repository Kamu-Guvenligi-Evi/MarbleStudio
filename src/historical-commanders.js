import data from './historical-commanders.json' with { type: 'json' };
import './historical-commanders.css';
import { COMMANDER_BALANCE, resolveCommanderIds } from './historical-commander-types.js';
import { commanderPortrait } from './historical-commander-art.js';
import { mountArmyPreset } from './historical-army-preset-ui.js';

export const COMMANDERS = Array.isArray(data) ? data : data.commanders;
export const COMMANDER_STORAGE = 'marble-historical-commanders-v1';
const byId = new Map(COMMANDERS.map(commander => [commander.id, commander]));
const armyNames = ['Mavi ordu', 'Kızıl ordu'];
const normalize = resolveCommanderIds;

export function readCommanders() {
  try { return normalize(JSON.parse(localStorage.getItem(COMMANDER_STORAGE))); }
  catch { return [null, null]; }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function mountCommanders(parent, { compact = false, onApply, onSelect, onCreateArmy } = {}) {
  let selected = readCommanders();
  const root = element('section', `commander-panel${compact ? ' commander-panel--compact' : ''}`);
  root.setAttribute('aria-label', 'Ordu liderleri');
  root.append(element('h3', 'commander-heading', 'Ordunun başında kim var?'));
  root.append(element('p', 'commander-intro', `Liderler kültür gruplarında listelenir; aynı gruptaki devletler için ortak lider seçebilirsin. Seçilen lider ordusuna ${COMMANDER_BALANCE.hp} canlı 1 atlı komutan ekler. Komutan saldırmaz; ordunun gerisinde hareket eder, cepheyi takip eder ve tehlikeden uzaklaşır. Askerleri tükenen ordu yenilir; yalnız komutanlar kalırsa savaş berabere biter. Lider seçimi tek başına bütün kültür taktiklerini açmaz; etkin taktik için uygun birlikler ve yaşayan, eşleşen komutan gerekir.${compact ? ' Değişiklikler meydanı yeniden kurunca uygulanır.' : ''}`));
  const grid = element('div', 'commander-grid'); root.append(grid);
  const status = element('p', 'commander-status'); status.setAttribute('role', 'status');
  const views = [];
  const battleViews = [];
  const armyViews = [];

  for (const team of [0, 1]) {
    const card = element('article', 'commander-card'); card.dataset.commanderTeam = team;
    const label = element('label', 'commander-label', armyNames[team]);
    const select = element('select'); select.id = `commander-${team}`;
    select.setAttribute('aria-label', `${armyNames[team]} lideri`); label.htmlFor = select.id;
    const none = element('option', '', 'Lider seçilmedi'); none.value = ''; select.append(none);
    const factions = new Map();
    for (const commander of COMMANDERS) {
      const family = commander.cultureName || commander.faction;
      if (!factions.has(family)) {
        const group = element('optgroup'); group.label = family;
        select.append(group); factions.set(family, group);
      }
      const option = element('option', '', commander.name); option.value = commander.id;
      factions.get(family).append(option);
    }
    const profile = element('div', 'commander-profile');
    const art = element('div', 'commander-art');
    const copy = element('div', 'commander-copy');
    profile.append(art, copy);
    const details = element('details', 'commander-details');
    const summary = element('summary', '', 'Tarihçe ve görsel kaynağı');
    const facts = element('div'); details.append(summary, facts);
    card.append(label, select, profile, details); grid.append(card);
    const armyView = onCreateArmy ? mountArmyPreset(card, team, onCreateArmy) : null;
    if (armyView) armyViews.push(armyView);
    if (compact) {
      const battleStatus = element('p', 'commander-battle-status');
      battleStatus.dataset.commanderStatus = team;
      const selectUnit = element('button', 'commander-select-unit', 'Meydandaki komutanı seç');
      let activeUnit = null;
      if (selectUnit) {
        selectUnit.type = 'button'; selectUnit.disabled = true;
        selectUnit.addEventListener('click', () => { if (activeUnit?.hp > 0) onSelect?.(activeUnit); });
        card.append(selectUnit);
      }
      card.append(battleStatus);
      battleViews.push(battle => {
        activeUnit = battle.commanders[team];
        battleStatus.textContent = activeUnit ? `Meydanda: ${activeUnit.name} · ${activeUnit.hp > 0 ? `${Math.ceil(activeUnit.hp)}/${activeUnit.maxHp} can` : 'Düştü'}` : 'Meydanda komutan yok.';
        if (selectUnit) {
          selectUnit.disabled = !activeUnit || activeUnit.hp <= 0 || battle.winner !== null;
          selectUnit.setAttribute('aria-pressed', String(!!activeUnit && battle.selected.has(activeUnit.id)));
        }
      });
    }
    const render = () => {
      const commander = byId.get(selected[team]); select.value = commander?.id || '';
      art.replaceChildren(); copy.replaceChildren(); facts.replaceChildren(); details.hidden = !commander;
      card.dataset.commanderId = commander?.id || '';
      armyView?.render(commander?.id || null);
      const fallback = element('span', 'commander-monogram', commander ? commander.name.split(' ').map(word => word[0]).slice(0,2).join('') : '—');
      art.append(fallback);
      if (!commander) { copy.append(element('strong', '', 'Lider seçilmedi')); return; }
      if (commander.portrait === 'game') {
        const portrait = commanderPortrait(commander.id);
        portrait.setAttribute('role', 'img');
        portrait.setAttribute('aria-label', `${commander.name} — stilize oyun portresi`);
        art.append(portrait); fallback.hidden = true;
      } else if (commander.image?.startsWith('/warrior-references/')) {
        const img = element('img'); img.alt = commander.imageType === 'historical_scene' ? `${commander.name} ile ilgili tarihî sahne` : `${commander.name} portresi`; img.decoding = 'async';
        img.addEventListener('load', () => { if (img.parentNode === art) fallback.hidden = true; }, { once: true });
        img.addEventListener('error', () => { img.remove(); fallback.hidden = false; }, { once: true });
        img.src = commander.image; art.append(img);
      }
      copy.append(element('strong', 'commander-name', commander.name), element('span', 'commander-faction', commander.faction));
      if (commander.rule) copy.append(element('span', 'commander-rule', commander.rule));
      if (commander.imageType === 'historical_scene') copy.append(element('span', 'commander-rule', 'Görsel: tarihî sahne'));
      for (const text of [commander.role, commander.life && `Yaşamı: ${commander.life}`, commander.historicalNote, commander.visualNote, commander.credit, commander.license && `Görsel lisansı: ${commander.license}`]) {
        if (text) facts.append(element('p', '', text));
      }
      const sources = [{ url: commander.source, title: 'Görsel kaynağı' }, ...(commander.sources || []).map(source => typeof source === 'string' ? { url: source, title: 'Tarihî kaynak' } : source)];
      for (const source of sources) {
        if (!/^https?:\/\//.test(source.url || '')) continue;
        const link = element('a', '', `${source.title || 'Kaynak'} ↗`); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; facts.append(link);
      }
    };
    select.addEventListener('change', () => {
      selected[team] = byId.has(select.value) ? select.value : null;
      render();
      try { localStorage.setItem(COMMANDER_STORAGE, JSON.stringify(selected)); status.textContent = compact ? 'Seçim kaydedildi. Uygulamak için meydanı yeniden kur.' : 'Lider seçimleri kaydedildi. Her seçili lider orduya 1 komutan ekleyecek.'; }
      catch { status.textContent = 'Tarayıcı kaydı kapalı; lider seçimleri yalnız bu sayfada tutuluyor.'; }
    });
    views.push(render); render();
  }
  window.addEventListener('storage', event => {
    if (event.key !== COMMANDER_STORAGE && event.key !== null) return;
    selected = readCommanders(); views.forEach(render => render());
  });
  const apply = compact && onApply ? element('button', 'commander-apply', 'Komutan ve orduları uygula · Meydanı yeniden kur') : null;
  if (apply) { apply.type = 'button'; apply.addEventListener('click', () => onApply()); root.append(apply); }
  root.append(status); parent.append(root);
  return {
    element: root,
    setBattle: battle => battleViews.forEach(render => render(battle)),
    setLocked: locked => { root.querySelectorAll('select').forEach(select => select.disabled = locked); armyViews.forEach(view => view.setLocked(locked)); if (apply) apply.disabled = locked; },
    getSelection: () => selected.map(id => {
      const commander = byId.get(id);
      return commander ? { id, name: commander.name, faction: commander.faction } : null;
    }),
  };
}
