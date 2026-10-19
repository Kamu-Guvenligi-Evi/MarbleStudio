import { ARMY_PRESETS, createCommanderArmy, presetMinimum } from './historical-army-presets.js';
import { HISTORICAL_TYPES } from './historical-combat.js';
import catalogue from './historical-catalogue.js';
import { armyCapacity, ELEPHANT_CAPACITY, CHARIOT_CAPACITY } from './historical-army-capacity.js';
import { armyPoints, createBudgetArmy, minimumArmyBudget, MAX_ARMY_BUDGET } from './historical-army-budget.js';

const unitById = new Map(catalogue.map(unit => [unit.id, unit]));

export function mountArmyPreset(card, team, onCreateArmy, { initialSize, onSizeChange } = {}) {
  const root = document.createElement('div'); root.className = 'commander-auto-army'; root.hidden = true;
  root.innerHTML = `<p class="commander-auto-name"></p><label for="commander-army-size-${team}">Ordu kapasitesi (komutan hariç)</label><div class="commander-army-size"><button type="button" data-army-size="minus" aria-label="Ordu kapasitesini azalt">−</button><input id="commander-army-size-${team}" type="number" min="24" step="1" value="24"><button type="button" data-army-size="plus" aria-label="Ordu kapasitesini artır">+</button></div><p class="commander-auto-preview" aria-live="polite"></p><button type="button" class="commander-auto-create">Otomatik ordu oluştur</button><p class="commander-auto-note">Bu tarafın mevcut askerleri değişir. Karşı ordu korunur. Oluşturduktan sonra birlik sayılarını kartlardan da düzenleyebilirsin.</p><p class="commander-auto-result" role="status"></p>`;
  const capacityHelp = document.createElement('p'); capacityHelp.className = 'commander-capacity-help';
  capacityHelp.textContent = `1 fil = ${ELEPHANT_CAPACITY}, 1 savaş arabası = ${CHARIOT_CAPACITY} kapasite. Diğer birlikler 1 kapasite kaplar. Adet, kapasite ve donanım puanı ayrı gösterilir.`;
  root.querySelector('.commander-army-size').after(capacityHelp);
  card.append(root);
  const budgetControls = document.createElement('div'); budgetControls.className = 'commander-budget-controls';
  budgetControls.innerHTML = `<div class="commander-army-mode" role="group" aria-label="Ordu oluşturma ölçüsü"><button type="button" data-army-mode="count">Ordu kapasitesi</button><button type="button" data-army-mode="budget">Puan bütçesi</button></div><div class="commander-budget-input" hidden><label for="commander-army-budget-${team}">Ordu bütçesi</label><div class="commander-army-size"><input id="commander-army-budget-${team}" type="number" step="1" max="${MAX_ARMY_BUDGET}"></div></div><p class="commander-auto-points" aria-live="polite"></p><div class="commander-budget-help"><button type="button" aria-expanded="false">Puan nasıl hesaplanır?</button><p hidden>Can, zırh, vuruş gücü, saldırı aralığı, hareket, menzil, hücum ve alan etkisi aynı kuralla puanlanır. Aynı bütçeyle daha pahalı birliklerden daha az asker gelir. Puan, oyun içi donanım maliyetidir; eşit kazanma şansı anlamına gelmez. Komutan puana dahil değildir.</p></div>`;
  root.querySelector('.commander-auto-name').after(budgetControls);
  const budgetInput = budgetControls.querySelector('input');
  const budgetHelp = budgetControls.querySelector('.commander-budget-help');
  budgetHelp.querySelector('button').onclick = () => {
    const body = budgetHelp.querySelector('p'); body.hidden = !body.hidden;
    budgetHelp.querySelector('button').setAttribute('aria-expanded', String(!body.hidden));
  };
  const preferenceKey = `marble-army-budget-v1:${team}`;
  let savedPreference = {};
  try { savedPreference = JSON.parse(localStorage.getItem(preferenceKey)) || {}; } catch {}
  let mode = savedPreference.mode === 'budget' ? 'budget' : 'count';
  let preferredBudget = Number.isSafeInteger(savedPreference.budget) && savedPreference.budget > 0 && savedPreference.budget <= MAX_ARMY_BUDGET ? savedPreference.budget : null;
  function rememberBudget() {
    const value = Number(budgetInput.value);
    if (Number.isSafeInteger(value) && value > 0 && value <= MAX_ARMY_BUDGET) preferredBudget = value;
    try { localStorage.setItem(preferenceKey, JSON.stringify({ mode, budget: preferredBudget })); } catch {}
  }
  const history = document.createElement('div'); history.className = 'commander-auto-history';
  history.innerHTML = `<p class="commander-auto-period"></p><button type="button" class="commander-auto-history-toggle" aria-expanded="false">Dönem ve tarihî dayanak</button><div class="commander-auto-history-body" id="commander-army-history-${team}" hidden><p class="commander-auto-scope"></p><p>Birlik oranları oyun ölçeğine göre ayarlanır. Kapasite hesabında bir fil 10, diğer birlikler 1 yer kaplar. Puan bütçesi donanım maliyetine göre ayrı hesaplanır. Komutan bu toplamlara dahil değildir.</p><ul class="commander-auto-sources"></ul></div>`;
  root.querySelector('.commander-auto-note').before(history);
  const historyToggle = history.querySelector('button'), historyBody = history.querySelector('.commander-auto-history-body');
  historyToggle.setAttribute('aria-controls', historyBody.id);
  historyToggle.onclick = () => {
    historyBody.hidden = !historyBody.hidden;
    historyToggle.setAttribute('aria-expanded', String(!historyBody.hidden));
  };
  const size = root.querySelector(`#commander-army-size-${team}`), create = root.querySelector('.commander-auto-create');
  const preview = root.querySelector('.commander-auto-preview'), result = root.querySelector('.commander-auto-result');
  let commanderId = null, locked = false, historyId = null;
  let preferredSize = Number.isSafeInteger(initialSize) && initialSize > 0 ? initialSize : null;
  function rememberSize() {
    const value = Number(size.value);
    if (Number.isSafeInteger(value) && value > 0) { preferredSize = value; onSizeChange?.(value); }
  }
  function refresh() {
    const preset = ARMY_PRESETS[commanderId];
    root.hidden = !commanderId;
    root.querySelector('.commander-auto-name').textContent = preset ? `Hazır ordu · ${preset.name}` : 'Bu komutan için henüz taktiğe uygun hazır ordu yok. Birlikleri ordu ekranından seçebilirsin.';
    for (const node of root.querySelectorAll('.commander-auto-preview, .commander-auto-create, .commander-auto-note, .commander-auto-history, .commander-budget-controls')) node.hidden = !preset;
    size.parentElement.hidden = !preset || mode === 'budget';
    capacityHelp.hidden = !preset || mode === 'budget';
    root.querySelector(`label[for="${size.id}"]`).hidden = !preset || mode === 'budget';
    if (!preset) return;
    budgetInput.min = minimumArmyBudget(commanderId);
    budgetControls.querySelector('.commander-budget-input').hidden = mode !== 'budget';
    budgetInput.disabled = locked;
    for (const button of budgetControls.querySelectorAll('[data-army-mode]')) {
      button.setAttribute('aria-pressed', String(button.dataset.armyMode === mode)); button.disabled = locked;
    }
    if (historyId !== commanderId) {
      historyId = commanderId;
      historyBody.hidden = true;
      historyToggle.setAttribute('aria-expanded', 'false');
      history.querySelector('.commander-auto-period').textContent = preset.history.period;
      history.querySelector('.commander-auto-scope').textContent = preset.history.scope;
      const sources = new Map();
      for (const source of [...preset.history.sources, ...Object.keys(preset.units).flatMap(id => {
        const unit = unitById.get(id);
        return unit?.sources?.length ? unit.sources : unit?.source ? [{ title: unit.name, url: unit.source }] : [];
      })]) {
        if (source?.url && /^https?:\/\//.test(source.url) && !sources.has(source.url)) sources.set(source.url, source);
      }
      history.querySelector('.commander-auto-sources').replaceChildren(...[...sources.values()].map(source => {
        const li = document.createElement('li'), a = document.createElement('a');
        a.href = source.url; a.textContent = source.title || 'Birlik tarihî kaynağı'; a.target = '_blank'; a.rel = 'noopener noreferrer';
        li.append(a); return li;
      }));
    }
    size.min = presetMinimum(preset);
    let army = null;
    size.setCustomValidity(''); budgetInput.setCustomValidity('');
    try { army = mode === 'budget' ? createBudgetArmy(commanderId, Number(budgetInput.value)) : createCommanderArmy(commanderId, Number(size.value)); }
    catch (error) { (mode === 'budget' ? budgetInput : size).setCustomValidity(error.message); preview.textContent = error.message; }
    if (army) preview.textContent = Object.entries(army).map(([type, count]) => `${count} ${HISTORICAL_TYPES[type].name}`).join(' · ') + ' + 1 komutan';
    budgetControls.querySelector('.commander-auto-points').textContent = army ? `${Object.values(army).reduce((sum, n) => sum + n, 0)} birlik · ${armyCapacity(army)} kapasite · ${armyPoints(army)} puan${mode === 'budget' ? ` · ${Number(budgetInput.value) - armyPoints(army)} puan kalan` : ''}` : '';
    size.disabled = locked;
    create.disabled = locked || !army;
    root.querySelector('[data-army-size="minus"]').disabled = locked || Number(size.value) <= Number(size.min);
    root.querySelector('[data-army-size="plus"]').disabled = locked;
  }
  size.addEventListener('input', () => { result.textContent = ''; rememberSize(); refresh(); });
  budgetInput.addEventListener('input', () => { result.textContent = ''; rememberBudget(); refresh(); });
  for (const button of budgetControls.querySelectorAll('[data-army-mode]')) button.onclick = () => {
    if (locked) return;
    mode = button.dataset.armyMode;
    if (mode === 'budget' && !budgetInput.value) budgetInput.value = preferredBudget || minimumArmyBudget(commanderId);
    result.textContent = ''; rememberBudget(); refresh();
  };
  for (const button of root.querySelectorAll('[data-army-size]')) button.onclick = () => {
    const step = Number(size.min), current = Number(size.value);
    size.value = Math.max(step, (Number.isSafeInteger(current) ? current : step) + (button.dataset.armySize === 'plus' ? step : -step));
    result.textContent = ''; rememberSize(); refresh();
  };
  create.onclick = () => {
    if (locked || !(mode === 'budget' ? budgetInput : size).reportValidity()) return;
    try {
      const army = mode === 'budget' ? createBudgetArmy(commanderId, Number(budgetInput.value)) : createCommanderArmy(commanderId, Number(size.value));
      result.textContent = onCreateArmy(team, army) || 'Ordu hazır.';
    } catch (error) { result.textContent = error.message; }
  };
  return {
    render(id) {
      if (id !== commanderId) {
        commanderId = id;
        const minimum = ARMY_PRESETS[id] ? presetMinimum(ARMY_PRESETS[id]) : 24;
        size.value = Math.max(minimum, preferredSize || minimum);
        budgetInput.value = Math.max(ARMY_PRESETS[id] ? minimumArmyBudget(id) : 1, preferredBudget || 0);
        result.textContent = '';
      }
      refresh();
    },
    setLocked(value) { locked = value; refresh(); },
  };
}
