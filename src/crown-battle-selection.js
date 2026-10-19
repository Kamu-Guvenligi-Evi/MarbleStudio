import { civilizationMatches, civilizationSearchTerms } from './historical-culture-groups.js';
import { HISTORICAL_TYPES, CIVILIZATIONS } from './historical-combat.js';
import './crown-battle-selection.css';

// Accept both Turkish spelling and an ASCII keyboard (mizrak, tufek, suvari).
const normalize = value => value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
const matches = (text, query) => normalize(query).split(/\s+/).every(word => text.includes(word));

export function mountArmySelection({ getBattle, onChange, rosterInputs }) {
  const grid = document.querySelector('.unit-grid');
  const buttons = [...grid.querySelectorAll('[data-unit]')];
  const headings = [...grid.querySelectorAll('.command-civilization')];
  const rows = [...document.querySelectorAll('.roster-row')];
  const names = new Map(buttons.map(button => [button.dataset.unit, button.childNodes[1]?.textContent || button.textContent]));
  const searchText = id => {
    const cfg = HISTORICAL_TYPES[id] || { role: id };
    const civilization = CIVILIZATIONS.find(c => c.ids.includes(id));
    const role = cfg?.skirmish ? 'atlı okçu yay' : cfg?.projectile === 'bullet' ? 'tüfekli ateşli' : cfg?.role === 'cavalry' ? 'atlı süvari hücum' : cfg?.role === 'pike' ? 'mızraklı yaya' : cfg?.role === 'archer' ? 'yaya okçu yay' : cfg?.role === 'elephant' ? 'fil' : cfg?.role === 'sword' ? 'kılıçlı yaya yakın dövüş' : '';
    return normalize(`${names.get(id) || id} ${civilization?.name || ''} ${civilizationSearchTerms(civilization?.name)} ${role}`);
  };
  function toolbar(id, placeholder) {
    const bar = document.createElement('div'); bar.className = 'army-search';
    bar.innerHTML = `<div class="army-search-field"><input id="${id}" type="search" placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off"><button type="button" aria-label="Aramayı temizle" title="Aramayı temizle">×</button></div>`;
    const input = bar.querySelector('input');
    bar.querySelector('button').onclick = () => { input.value = ''; input.dispatchEvent(new Event('input')); input.focus(); };
    return { bar, input };
  }
  const command = toolbar('unit-search', 'Asker, medeniyet veya silah ara');
  const teamLabel = document.createElement('label'); teamLabel.className = 'command-team-label';
  teamLabel.innerHTML = 'Yönetilen ordu <select id="command-team" aria-label="Yönetilen ordu"><option value="0">Mavi ordu</option><option value="1">Kızıl ordu</option></select>';
  command.bar.prepend(teamLabel);
  const teamSelect = teamLabel.querySelector('select');
  teamSelect.onchange = () => { getBattle().setActiveTeam(Number(teamSelect.value)); onChange(); };
  const fieldTeams = document.createElement('div'); fieldTeams.className = 'field-team-selection';
  fieldTeams.setAttribute('role', 'group'); fieldTeams.setAttribute('aria-label', 'Meydandan ordu seç');
  fieldTeams.innerHTML = '<button type="button" id="select-blue-army" data-select-team="0" aria-pressed="false">Maviyi seç</button><button type="button" id="select-red-army" data-select-team="1" aria-pressed="false">Kırmızıyı seç</button>';
  document.querySelector('.stage-commands').prepend(fieldTeams);
  const fieldTeamButtons = [...fieldTeams.querySelectorAll('button')];
  for (const button of fieldTeamButtons) button.onclick = () => {
    const battle = getBattle(); battle.setActiveTeam(Number(button.dataset.selectTeam)); battle.select(); onChange();
  };
  for (const label of document.querySelectorAll('.army-row small')) label.textContent = 'Seçilebilir · Yönetilebilir';
  command.bar.insertAdjacentHTML('beforeend', '<div class="selection-tools"><button id="multi-select" type="button" aria-pressed="false">Çoklu seçim</button><button id="clear-selection" type="button">Seçimi kaldır</button></div><p class="selection-summary" aria-live="polite"></p>');
  grid.before(command.bar);
  const returnToField = document.createElement('button'); returnToField.type = 'button'; returnToField.id = 'return-to-field'; returnToField.textContent = 'Seçimi tamamla · Meydana dön ↑';
  returnToField.onclick = () => document.querySelector('.battle-stage').scrollIntoView({ block: 'start', behavior: 'instant' });
  command.bar.append(returnToField);
  const multi = command.bar.querySelector('#multi-select');
  multi.onclick = () => multi.setAttribute('aria-pressed', String(multi.getAttribute('aria-pressed') !== 'true'));
  command.bar.querySelector('#clear-selection').onclick = () => { getBattle().selected.clear(); onChange(); };
  const empty = document.createElement('p'); empty.className = 'small-note selection-empty'; empty.textContent = 'Eşleşen birlik yok. Aramayı temizleyebilir veya Ordu menüsünden asker ekleyebilirsin.'; grid.after(empty);
  const entries = buttons.map(button => ({ button, id: button.dataset.unit, text: searchText(button.dataset.unit), role: button.querySelector('small').dataset.role || button.querySelector('small').textContent }));
  for (const { button, id } of entries) button.onclick = event => {
    const battle = getBattle(), units = battle.units.filter(u => u.team === battle.activeTeam && u.hp > 0 && u.type === id);
    const allSelected = units.length && units.every(u => battle.selected.has(u.id));
    if (multi.getAttribute('aria-pressed') === 'true' || event.shiftKey || event.ctrlKey || event.metaKey) {
      for (const unit of units) allSelected ? battle.selected.delete(unit.id) : battle.selected.add(unit.id);
    } else if (allSelected) battle.selected.clear();
    else battle.select(id);
    onChange();
  };
  function refresh() {
    const battle = getBattle(), counts = new Map();
    teamSelect.value = String(battle.activeTeam);
    const teamCounts = [0, 0], selectedCounts = [0, 0];
    for (const unit of battle.units) if (unit.hp > 0 && !unit.removed) {
      teamCounts[unit.team]++; if (battle.selected.has(unit.id)) selectedCounts[unit.team]++;
    }
    for (const button of fieldTeamButtons) {
      const team = Number(button.dataset.selectTeam);
      button.textContent = `${team ? 'Kırmızıyı' : 'Maviyi'} seç (${teamCounts[team]})`;
      button.disabled = !teamCounts[team];
      button.setAttribute('aria-pressed', selectedCounts[team] ? selectedCounts[team] === teamCounts[team] ? 'true' : 'mixed' : 'false');
    }
    for (const u of battle.units) if (u.team === battle.activeTeam && !u.removed) {
      const count = counts.get(u.type) || { total: 0, alive: 0, selected: 0 };
      count.total++; if (u.hp > 0) { count.alive++; if (battle.selected.has(u.id)) count.selected++; }
      counts.set(u.type, count);
    }
    let visible = 0;
    for (const { button, id, text, role } of entries) {
      const count = counts.get(id) || { total: 0, alive: 0, selected: 0 };
      button.hidden = (document.body.classList.contains('historical-mode') && !count.total) || !matches(text, command.input.value);
      button.disabled = !count.alive;
      button.setAttribute('aria-pressed', count.selected ? count.selected === count.alive ? 'true' : 'mixed' : 'false');
      button.querySelector('small').textContent = `${count.alive} asker${count.selected ? ` · ${count.selected} seçili` : ''} · ${role}`;
      if (!button.hidden) visible++;
    }
    for (const heading of headings) heading.hidden = !entries.some(e => heading.dataset.ids.split(',').includes(e.id) && !e.button.hidden);
    empty.hidden = visible > 0;
    command.bar.querySelector('.selection-summary').textContent = `${battle.activeTeam ? 'Kızıl' : 'Mavi'} ordu · ${visible} birlik türü · ${battle.selected.size} asker seçili`;
    command.bar.querySelector('#clear-selection').disabled = !battle.selected.size;
  }
  command.input.addEventListener('input', refresh);

  const roster = toolbar('roster-search', 'Orduya eklemek için asker ara');
  roster.bar.insertAdjacentHTML('beforeend', '<label class="roster-active-filter"><input id="roster-active-only" type="checkbox"> Yalnız ordudaki birlikler</label>');
  document.querySelector('.builder-heading').after(roster.bar);
  const activeOnly = roster.bar.querySelector('#roster-active-only');
  const amount = document.createElement('label'); amount.className = 'roster-amount';
  amount.innerHTML = 'Her tıklamada <select id="roster-step" aria-label="Eklenecek veya azaltılacak asker sayısı"><option value="1">1 asker</option><option value="10" selected>10 asker</option><option value="50">50 asker</option><option value="100">100 asker</option></select>';
  roster.bar.append(amount);
  const step = amount.querySelector('select');
  const rosterEntries = rows.map(row => ({ row, inputs: [...row.querySelectorAll('[data-roster]')], text: searchText(row.querySelector('[data-roster]').dataset.type) }));
  for (const input of rosterInputs) {
    const cell = document.createElement('div'); cell.className = 'roster-stepper';
    input.before(cell); cell.append(input);
    const team = input.dataset.roster === '0' ? 'Mavi' : 'Kızıl', name = names.get(input.dataset.type) || input.dataset.type;
    const label = document.createElement('span'); label.textContent = team; cell.prepend(label);
    for (const [text, action, title] of [['−', -10, '10 azalt'], ['+', 10, '10 ekle'], ['×', 0, 'Ordudan kaldır']]) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = text; button.dataset.rosterAction = String(action);
      button.title = `${team}: ${title}`; button.setAttribute('aria-label', `${team} ${name}: ${title}`);
      button.onclick = () => {
        if (input.disabled) return;
        input.value = action ? Math.max(0, (Number(input.value) || 0) + Math.sign(action) * Number(step.value)) : 0;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      };
      cell.append(button);
    }
  }
  step.onchange = () => {
    for (const input of rosterInputs) for (const button of input.closest('.roster-stepper').querySelectorAll('[data-roster-action]')) {
      const action = Number(button.dataset.rosterAction); if (!action) continue;
      const team = input.dataset.roster === '0' ? 'Mavi' : 'Kızıl';
      const verb = action > 0 ? 'ekle' : 'azalt';
      button.title = `${team}: ${step.value} ${verb}`;
      button.setAttribute('aria-label', `${team} ${names.get(input.dataset.type) || input.dataset.type}: ${step.value} ${verb}`);
    }
  };
  const rosterEmpty = document.createElement('p'); rosterEmpty.className = 'small-note selection-empty'; rosterEmpty.textContent = 'Birlik bulunamadı. Aramayı veya medeniyet filtresini değiştir.';
  document.querySelector('.roster-total').before(rosterEmpty);
  function filterRoster() {
    const civilization = document.getElementById('roster-civilization')?.value;
    const role = document.getElementById('recruit-role')?.value || '';
    let visible = 0;
    for (const { row, inputs, text } of rosterEntries) {
      const group = row.closest('.roster-civilization');
      const cfg = HISTORICAL_TYPES[inputs[0].dataset.type];
      const unitRole = cfg?.role || inputs[0].dataset.type;
      const roleMatch = !role || (role === 'ranged' ? cfg?.ranged || unitRole === 'archer' : role === 'infantry' ? ['sword', 'pike'].includes(unitRole) : role === 'cavalry' ? unitRole === 'cavalry' : unitRole === 'elephant');
      row.hidden = !roleMatch || !matches(text, roster.input.value) || (activeOnly.checked && !inputs.some(i => Number(i.value) > 0)) || !civilizationMatches(civilization, group?.dataset.civilization);
      if (!row.hidden) visible++;
    }
    for (const group of document.querySelectorAll('.roster-civilization')) group.hidden = ![...group.querySelectorAll('.roster-row')].some(row => !row.hidden);
    rosterEmpty.hidden = visible > 0;
    const results = document.getElementById('recruit-results');
    if (results) results.textContent = `${visible} birlik`;
  }
  roster.input.addEventListener('input', filterRoster); activeOnly.addEventListener('change', filterRoster);
  document.getElementById('roster-civilization')?.addEventListener('change', filterRoster);
  for (const input of rosterInputs) input.addEventListener('input', filterRoster);
  filterRoster(); refresh();
  return { refresh, filterRoster, setLocked(active) { for (const button of document.querySelectorAll('[data-roster-action]')) button.disabled = active; } };
}
