import { HISTORICAL_TYPES } from './historical-combat.js';
import { armyCapacity, unitCapacity, ELEPHANT_CAPACITY, CHARIOT_CAPACITY } from './historical-army-capacity.js';
import './crown-battle-recruitment.css';

// Reuse the live roster inputs: saves, validation and battle setup keep one source of truth.
export function mountRecruitment({ rosterInputs, filterRoster, onClose }) {
  const builder = document.querySelector('.army-builder');
  const actions = document.querySelector('.setup-actions');
  const actionsHome = document.createComment('army actions'); actions.before(actionsHome);
  const dialog = document.createElement('dialog'); dialog.id = 'recruitment';
  dialog.setAttribute('aria-labelledby', 'recruit-title');
  dialog.innerHTML = `<header class="recruit-heading"><div><span>TAÇ MUHAREBESİ</span><h2 id="recruit-title">Orduları kur</h2></div><button type="button" class="recruit-close" aria-label="Ordu ekranını kapat">Meydana dön <b>×</b></button></header><div class="recruit-workspace"><aside class="recruit-factions" aria-label="Halk ve ülke seçimi"></aside><section class="recruit-library" aria-label="Birlik seçimi"><div class="recruit-toolbar"></div><div class="recruit-cards"></div></section><aside class="recruit-armies" aria-label="Kurulan ordular"><h3>Muharebeye katılacaklar</h3><div class="recruit-army-lists"></div><button type="button" id="recruit-undo" disabled>Son çıkarmayı geri al</button><p class="recruit-draft-note">Değişiklikleri meydana taşımak için orduları uygula.</p></aside></div><footer class="recruit-footer"><span id="recruit-results" role="status"></span></footer>`;
  document.body.append(dialog);
  const toolbar = dialog.querySelector('.recruit-toolbar');
  const cards = dialog.querySelector('.recruit-cards');
  const factions = dialog.querySelector('.recruit-factions');
  const picker = builder.querySelector('.culture-picker');
  if (picker) factions.append(picker);
  else { factions.hidden = true; dialog.classList.add('recruit-classic'); }
  const search = builder.querySelector('.army-search'); toolbar.append(search);
  if (picker) {
    const countryPath = document.createElement('div'); countryPath.className = 'recruit-countries';
    countryPath.append(...[...picker.children].filter(node => node.classList.contains('country-tabs') || node.textContent === 'Ülke / devlet'));
    toolbar.append(countryPath);
  }
  search.querySelector('input[type=search]').placeholder = 'Birlik, halk veya silah ara…';
  const roleLabel = document.createElement('label'); roleLabel.className = 'recruit-role-label';
  roleLabel.innerHTML = 'Birlik türü <select id="recruit-role"><option value="">Tüm birlikler</option><option value="infantry">Yakın dövüş</option><option value="ranged">Menzilli</option><option value="cavalry">Süvari</option><option value="elephant">Devler ve filler</option></select>';
  search.append(roleLabel); roleLabel.querySelector('select').onchange = filterRoster;
  const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'recruit-reset'; reset.textContent = 'Filtreleri temizle';
  reset.onclick = () => {
    document.getElementById('roster-search').value = '';
    document.getElementById('roster-active-only').checked = false;
    document.getElementById('recruit-role').value = '';
    const select = document.getElementById('roster-civilization');
    if (select) { select.value = ''; select.dispatchEvent(new Event('change', { bubbles: true })); }
    filterRoster();
  };
  search.append(reset);
  // Search the whole catalogue even when a previous country was selected.
  document.getElementById('roster-search').addEventListener('input', () => {
    const select = document.getElementById('roster-civilization');
    if (select?.value && document.getElementById('roster-search').value.trim()) {
      select.value = ''; select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  const empty = builder.querySelector('.selection-empty');
  cards.append(builder);
  if (empty) { empty.textContent = 'Bu filtrelerle birlik bulunamadı. Filtreleri temizleyip yeniden ara.'; builder.append(empty); }
  const inputByKey = new Map(rosterInputs.map(input => [`${input.dataset.roster}:${input.dataset.type}`, input]));
  const unitNames = new Map();
  for (const row of builder.querySelectorAll('.roster-row')) {
    const id = row.querySelector('[data-roster]').dataset.type;
    const label = row.querySelector('label');
    unitNames.set(id, label.textContent.trim());
    const faction = document.createElement('span'); faction.className = 'recruit-unit-faction';
    faction.textContent = row.closest('.roster-civilization')?.dataset.civilization || 'Klasik birlik'; row.prepend(faction);
    const cfg = HISTORICAL_TYPES[id];
    const role = cfg?.role || id;
    const caption = document.createElement('small'); caption.className = 'recruit-unit-role';
    caption.textContent = cfg?.skirmish ? 'Atlı okçu' : cfg?.projectile === 'bullet' ? 'Tüfekli' : role === 'cavalry' ? 'Süvari' : cfg?.ranged || role === 'archer' ? 'Menzilli' : role === 'pike' ? 'Mızraklı' : role === 'elephant' ? 'Ağır / dev birlik' : 'Yakın dövüş';
    label.append(caption);
    if (unitCapacity(id) > 1) caption.textContent += ` · ${unitCapacity(id)} kapasite / adet`;
    for (const cell of row.querySelectorAll('.roster-stepper')) {
      const input = cell.querySelector('input'); cell.dataset.team = input.dataset.roster;
      const minus = cell.querySelector('[data-roster-action="-10"]'); input.before(minus);
      cell.querySelector('[data-roster-action="0"]').onclick = () => remove([input]);
    }
  }
  const lists = dialog.querySelector('.recruit-army-lists');
  const mobileTabs = document.createElement('div'); mobileTabs.className = 'recruit-mobile-tabs';
  mobileTabs.innerHTML = '<button type="button" data-recruit-view="units" aria-pressed="true">Birlikler</button><button type="button" data-recruit-view="armies" aria-pressed="false">Ordular</button>';
  dialog.querySelector('.recruit-heading').after(mobileTabs); dialog.dataset.view = 'units';
  const workspace = dialog.querySelector('.recruit-workspace');
  const scrollPositions = { units: 0, armies: 0 };
  function switchView(view) {
    if (dialog.dataset.view === view) return;
    scrollPositions[dialog.dataset.view] = workspace.scrollTop;
    dialog.dataset.view = view;
    for (const tab of mobileTabs.children) tab.setAttribute('aria-pressed', String(tab.dataset.recruitView === view));
    workspace.scrollTop = scrollPositions[view];
  }
  for (const button of mobileTabs.children) button.onclick = () => switchView(button.dataset.recruitView);
  function resetScroll() {
    cards.scrollTop = 0;
    dialog.querySelector('.recruit-library').scrollTop = 0;
    scrollPositions.units = 0;
    if (dialog.dataset.view === 'units') workspace.scrollTop = 0;
  }
  for (const id of ['roster-civilization', 'recruit-role', 'roster-active-only']) document.getElementById(id)?.addEventListener('change', resetScroll);
  document.getElementById('roster-search').addEventListener('input', resetScroll);
  reset.addEventListener('click', resetScroll);
  function editUnit(input) {
    if (input.disabled) return;
    switchView('units');
    const row = input.closest('.roster-row');
    if (row.hidden) {
      reset.click();
      const searchInput = document.getElementById('roster-search');
      searchInput.value = unitNames.get(input.dataset.type);
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    row.scrollIntoView({ block: 'center', behavior: 'instant' });
    input.focus({ preventScroll: true }); input.select();
  }
  const summaries = [0, 1].map(team => {
    const section = document.createElement('section'); section.className = 'recruit-army'; section.dataset.team = team;
    section.innerHTML = `<div class="recruit-army-title"><h4>${team ? 'Kızıl' : 'Mavi'} ordu <strong>0</strong></h4><button type="button" data-clear-team="${team}" aria-label="${team ? 'Kızıl' : 'Mavi'} orduyu boşalt">Boşalt</button></div><ul></ul><p class="recruit-no-units">Henüz asker yok. Birlik kartındaki + ile ekle.</p>`;
    lists.append(section); return section;
  });
  let undo = null, batching = false;
  const undoButton = dialog.querySelector('#recruit-undo');
  undoButton.title = 'Son çıkarmayı geri al (Ctrl+Z / ⌘Z)';
  undoButton.setAttribute('aria-keyshortcuts', 'Control+Z Meta+Z');
  const canFocus = element => element?.isConnected && !element.disabled && element.getClientRects().length > 0;
  function validateUndo() {
    // Presets and battlefield edits can change the live inputs without input events.
    if (undo && rosterInputs.some((input, index) => input.value !== undo.counts[index])) undo = null;
  }
  function setCount(input, value) {
    input.value = value; input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function remove(inputs) {
    const editable = inputs.filter(input => !input.disabled && Number(input.value) > 0);
    if (!editable.length) return;
    const source = document.activeElement;
    const entries = editable.map(input => [input, input.value]); batching = true;
    for (const input of editable) setCount(input, 0);
    undo = { entries, source, counts: rosterInputs.map(input => input.value) };
    batching = false; renderSummary();
    if (!canFocus(source)) undoButton.focus({ preventScroll: true });
  }
  for (const button of lists.querySelectorAll('[data-clear-team]')) button.onclick = () => remove(rosterInputs.filter(input => input.dataset.roster === button.dataset.clearTeam));
  undoButton.onclick = () => {
    validateUndo();
    if (!undo || undo.entries.some(([input]) => input.disabled)) { renderSummary(); return; }
    const { entries, source } = undo;
    const restoreFocus = document.activeElement === undoButton;
    batching = true;
    for (const [input, value] of entries) setCount(input, value);
    undo = null; batching = false; renderSummary();
    if (restoreFocus) {
      const input = entries[0][0];
      const item = [...summaries[Number(input.dataset.roster)].querySelectorAll('li')].find(item => item.dataset.type === input.dataset.type);
      const target = canFocus(source) ? source : item?.querySelector('.recruit-remove-unit');
      if (canFocus(target)) target.focus({ preventScroll: true });
      else mobileTabs.querySelector(`[data-recruit-view="${dialog.dataset.view}"]`).focus({ preventScroll: true });
    }
  };
  function renderSummary() {
    if (batching) return;
    for (let team = 0; team < 2; team++) {
      const selected = rosterInputs.filter(input => Number(input.dataset.roster) === team && Number(input.value) > 0);
      const section = summaries[team];
      section.querySelector('strong').textContent = selected.reduce((n, input) => n + Number(input.value), 0).toLocaleString('tr-TR');
      let capacity = section.querySelector('.recruit-capacity');
      if (!capacity) { capacity = document.createElement('p'); capacity.className = 'recruit-capacity'; section.querySelector('.recruit-army-title').after(capacity); }
      capacity.hidden = !selected.some(input => unitCapacity(input.dataset.type) > 1);
      capacity.textContent = `${armyCapacity(Object.fromEntries(selected.map(input => [input.dataset.type, Number(input.value)])))} kapasite · 1 fil = ${ELEPHANT_CAPACITY}, 1 savaş arabası = ${CHARIOT_CAPACITY} kapasite`;
      section.querySelector('.recruit-no-units').hidden = selected.length > 0;
      section.querySelector('[data-clear-team]').disabled = !selected.length || selected.every(input => input.disabled);
      const list = section.querySelector('ul');
      const existing = new Map([...list.children].map(item => [item.dataset.type, item]));
      for (const input of selected) {
        const id = input.dataset.type; let item = existing.get(id);
        if (!item) {
          item = document.createElement('li'); item.dataset.type = id;
          const name = document.createElement('button'); name.type = 'button'; name.className = 'recruit-edit-unit'; name.textContent = unitNames.get(id);
          name.setAttribute('aria-label', `${team ? 'Kızıl' : 'Mavi'} ${unitNames.get(id)} sayısını düzenle`);
          name.title = 'Birlik kartına git ve sayıyı düzenle'; name.onclick = () => editUnit(input);
          const count = document.createElement('b');
          const button = document.createElement('button'); button.type = 'button'; button.textContent = '×';
          button.className = 'recruit-remove-unit';
          button.setAttribute('aria-label', `${team ? 'Kızıl' : 'Mavi'} ordudan ${unitNames.get(id)} kaldır`);
          button.onclick = () => remove([inputByKey.get(`${team}:${id}`)]);
          item.append(name, count, button); list.append(item);
        }
        item.querySelector('b').textContent = input.value;
        for (const button of item.querySelectorAll('button')) button.disabled = input.disabled;
        existing.delete(id);
      }
      for (const item of existing.values()) item.remove();
    }
    for (const row of builder.querySelectorAll('.roster-row')) row.classList.toggle('recruit-chosen', [...row.querySelectorAll('input')].some(input => Number(input.value) > 0));
    undoButton.disabled = !undo || undo.entries.some(([input]) => input.disabled);
    mobileTabs.lastElementChild.textContent = `Ordular (${rosterInputs.reduce((n, input) => n + (Number(input.value) || 0), 0).toLocaleString('tr-TR')})`;
  }
  builder.addEventListener('input', renderSummary);
  // A subsequent manual edit makes a previous undo snapshot stale.
  builder.addEventListener('input', () => { if (!batching) { undo = null; undoButton.disabled = true; } });
  const footer = dialog.querySelector('.recruit-footer');
  // Reveal invalid draft fields before the existing apply handler validates them.
  // They may be hidden by a country/search filter or the mobile armies tab.
  document.getElementById('apply').addEventListener('click', () => {
    if (!dialog.open) return;
    const invalid = rosterInputs.find(input => !input.disabled && (!input.validity.valid || input.value === ''));
    if (invalid) editUnit(invalid);
  }, { capture: true });
  const feedback = document.createElement('div'); feedback.className = 'recruit-feedback';
  feedback.append(document.getElementById('recruit-results'), undoButton); footer.prepend(feedback);
  let previousFocus;
  function open() {
    if (dialog.open) return;
    previousFocus = document.activeElement;
    footer.append(actions); dialog.showModal(); document.body.classList.add('recruitment-open');
    validateUndo(); renderSummary(); filterRoster();
    if (matchMedia('(min-width: 701px)').matches) document.getElementById('roster-search').focus({ preventScroll: true });
  }
  function close() {
    if (!dialog.open) return;
    dialog.close(); document.body.classList.remove('recruitment-open');
    actionsHome.after(actions);
    previousFocus?.focus({ preventScroll: true });
  }
  dialog.querySelector('.recruit-close').onclick = () => { close(); onClose(); };
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); onClose(); });
  dialog.addEventListener('keydown', event => {
    event.stopPropagation();
    const editing = event.target.closest('input, select, textarea') || event.target.isContentEditable;
    if (!editing && (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'z' && !undoButton.disabled) {
      event.preventDefault(); undoButton.click();
    }
  });
  const reopen = document.createElement('button'); reopen.type = 'button'; reopen.className = 'recruit-open-button'; reopen.textContent = 'Orduları düzenle'; reopen.onclick = open;
  document.querySelector('#panel-setup .panel-title').after(reopen);
  const title = document.querySelector('#panel-setup .panel-title h2'); if (title) title.textContent = 'Harita ve savaş ayarları';
  const tab = document.getElementById('menu-setup'); tab.textContent = 'Orduları kur';
  // Map settings remain reachable without having to traverse the unit catalogue.
  const mapButton = document.createElement('button'); mapButton.type = 'button'; mapButton.className = 'recruit-map-button'; mapButton.textContent = 'Harita ve ayarlar';
  mapButton.onclick = close; dialog.querySelector('.recruit-heading').insertBefore(mapButton, dialog.querySelector('.recruit-close'));
  return { open, close, resetDraft() { undo = null; renderSummary(); filterRoster(); } };
}
