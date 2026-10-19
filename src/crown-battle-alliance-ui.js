import { ALLIANCE_STORAGE, MAX_ARMIES, allianceName, legacyArmyConfigs, validateArmyConfigs, restoreArmyConfigs, aggregateArmies } from './crown-battle-alliances.js';
import { HISTORICAL_STORAGE } from './historical-combat.js';
import { COMMANDER_STORAGE } from './historical-commanders.js';
import { commanderById, commanderArt, mountCommanderPicker } from './historical-commander-picker.js';
import { mountArmyPreset } from './historical-army-preset-ui.js';
import { armyTacticalLabel } from './crown-battle-tactical-visuals.js';
import { armyCapacity } from './historical-army-capacity.js';

export function mountAllianceArmies({ rosters, commanders, reset, rosterInputs, onChange, onApply, onSelect, recruitment, host }) {
  let armies = legacyArmyConfigs(rosters, commanders), locked = false, battle = null, active = [null, null];
  let saveNote = '';
  if (!reset) try {
    const saved = localStorage.getItem(ALLIANCE_STORAGE);
    if (saved) armies = restoreArmyConfigs(JSON.parse(saved));
  } catch { saveNote = 'İttifak kaydı okunamadı; mevcut iki ordu yüklendi.'; }
  const picker = mountCommanderPicker();
  const dialog = document.createElement('dialog'); dialog.id = 'alliance-planner';
  dialog.setAttribute('aria-labelledby', 'alliance-title');
  dialog.innerHTML = `<header><div><span>ORDULAR VE İTTİFAKLAR</span><h2 id="alliance-title">Savaşa kimler katılıyor?</h2></div><button type="button" data-close aria-label="İttifak ekranını kapat">×</button></header><p class="alliance-intro">Aynı ittifaktaki ordular birlikte savaşır. Her orduya ayrı komutan seç, askerlerini düzenle; toplam 8 orduya kadar kurabilirsin.</p><div class="alliance-columns"></div><footer><p role="status"></p><button type="button" data-apply>Orduları uygula</button><button type="button" data-done>Meydana dön</button></footer>`;
  document.body.append(dialog);
  const live = document.createElement('section'); live.className = 'alliance-live';
  const openButton = document.createElement('button'); openButton.type = 'button'; openButton.className = 'alliance-open'; openButton.textContent = 'Ordular, ittifaklar ve komutanlar';
  const liveList = document.createElement('div'); liveList.className = 'alliance-live-list'; live.append(openButton, liveList); host.prepend(live);
  const selectors = [0, 1].map(team => {
    const label = document.createElement('label'); label.className = 'alliance-roster-choice';
    label.append(document.createTextNode(`${allianceName(team)} · Düzenlenen ordu`));
    const select = document.createElement('select'); select.dataset.armyEditor = team; select.setAttribute('aria-label', `${allianceName(team)} düzenlenen ordu`); label.append(select);
    document.querySelector(`.recruit-army[data-team="${team}"]`).prepend(label);
    select.onchange = () => {
      if (!flush()) { select.value = active[team]; return; }
      active[team] = select.value; loadInputs(); onEditorChange();
    };
    return select;
  });
  const editing = document.createElement('div'); editing.className = 'alliance-editing-note';
  document.querySelector('.recruit-toolbar').prepend(editing);
  const recruitOpen = openButton.cloneNode(true); recruitOpen.className = 'recruit-map-button'; recruitOpen.textContent = 'İttifaklar / Komutanlar';
  document.querySelector('.recruit-heading').insertBefore(recruitOpen, document.querySelector('.recruit-close'));
  const setupOpen = openButton.cloneNode(true); document.querySelector('#panel-setup .panel-title').after(setupOpen);
  function save() {
    try {
      localStorage.setItem(ALLIANCE_STORAGE, JSON.stringify(validateArmyConfigs(armies)));
      localStorage.setItem(HISTORICAL_STORAGE, JSON.stringify(aggregateArmies(armies)));
      localStorage.setItem(COMMANDER_STORAGE, JSON.stringify([0, 1].map(team => armies.find(a => a.team === team)?.commanderId || null)));
    } catch { saveNote = 'Değişiklikler bu sayfada tutuluyor; tarayıcıya kaydedilemedi.'; }
  }
  function flush() {
    const invalid = rosterInputs.find(input => input.value === '' || !input.checkValidity());
    if (invalid) { saveNote = 'Birlik sayıları sıfır veya pozitif tam sayı olmalı.'; dialog.querySelector('[role=status]').textContent = saveNote; return false; }
    for (const team of [0, 1]) {
      const army = armies.find(a => a.id === active[team]); if (!army) continue;
      army.roster = Object.fromEntries(rosterInputs.filter(input => Number(input.dataset.roster) === team && Number(input.value) > 0).map(input => [input.dataset.type, Number(input.value)]));
    }
    return true;
  }
  function loadInputs() {
    for (const team of [0, 1]) {
      if (!armies.some(a => a.id === active[team] && a.team === team)) active[team] = armies.find(a => a.team === team)?.id;
      const army = armies.find(a => a.id === active[team]);
      for (const input of rosterInputs.filter(input => Number(input.dataset.roster) === team)) input.value = army?.roster[input.dataset.type] || 0;
      selectors[team].replaceChildren(...armies.filter(a => a.team === team).map(a => new Option(a.name, a.id)));
      selectors[team].value = active[team] || '';
    }
    editing.textContent = [0, 1].map(team => `${team ? 'Kızıl' : 'Mavi'} sütun: ${armies.find(a => a.id === active[team])?.name || 'Ordu yok'}`).join(' · ');
  }
  function onEditorChange() {
    // Also clear recruitment undo: the same inputs now belong to another army.
    recruitment.resetDraft?.();
    rosterInputs[0]?.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function change({ reload = false } = {}) {
    if (reload) loadInputs();
    save(); render(); onChange();
    if (reload) onEditorChange();
  }
  function editArmy(army) {
    if (locked || !flush()) return;
    active[army.team] = army.id; loadInputs(); onEditorChange(); dialog.close(); recruitment.open();
    const input = document.getElementById('roster-search'); input?.focus();
  }
  function render() {
    const columns = dialog.querySelector('.alliance-columns');
    const expanded = new Set([...columns.querySelectorAll('.alliance-army-card')].filter(card => card.querySelector('details')?.open).map(card => card.dataset.armyId));
    columns.replaceChildren();
    for (const team of [0, 1]) {
      const column = document.createElement('section'); column.dataset.alliance = team;
      const title = document.createElement('h3'); title.textContent = allianceName(team); column.append(title);
      for (const army of armies.filter(a => a.team === team)) {
        const card = document.createElement('article'); card.className = 'alliance-army-card'; card.dataset.armyId = army.id;
        const name = document.createElement('input'); name.value = army.name; name.maxLength = 48; name.setAttribute('aria-label', 'Ordu adı');
        name.onchange = () => { army.name = name.value.trim() || 'Ordu'; change({ reload: true }); };
        const teamSelect = document.createElement('select'); teamSelect.setAttribute('aria-label', `${army.name} ittifakı`);
        teamSelect.append(new Option('Mavi ittifak', '0'), new Option('Kızıl ittifak', '1')); teamSelect.value = team;
        teamSelect.onchange = () => {
          if (!flush()) { teamSelect.value = team; return; }
          if (armies.filter(a => a.team === team).length === 1) { teamSelect.value = team; dialog.querySelector('[role=status]').textContent = 'Bu ittifakta en az bir ordu bırak. Önce başka bir ordu ekleyebilirsin.'; return; }
          army.team = Number(teamSelect.value); change({ reload: true });
        };
        const commander = commanderById.get(army.commanderId);
        const choose = document.createElement('button'); choose.type = 'button'; choose.className = 'alliance-choose-leader';
        const copy = document.createElement('span'); const strong = document.createElement('strong'); strong.textContent = commander?.name || 'Komutan seç';
        const small = document.createElement('small'); small.textContent = commander?.faction || 'Portreleri incele ve seç'; copy.append(strong, small);
        choose.append(commanderArt(commander), copy);
        choose.onclick = () => picker.open(army.commanderId, army.name, id => { army.commanderId = id; change(); });
        const count = document.createElement('p'); count.textContent = `${Object.values(army.roster).reduce((sum, n) => sum + n, 0)} birlik · ${armyCapacity(army.roster)} kapasite${commander ? ' + 1 komutan' : ''}`;
        const actions = document.createElement('div'); actions.className = 'alliance-card-actions';
        const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Asker ekle / düzenle'; edit.onclick = () => editArmy(army);
        const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Orduyu kaldır';
        remove.disabled = locked || armies.filter(a => a.team === team).length === 1;
        remove.onclick = () => { if (locked || !flush()) return; armies = armies.filter(a => a !== army); change({ reload: true }); };
        actions.append(edit, remove); card.append(name, teamSelect, choose, count, actions);
        const presets = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = 'Komutana uygun hazır ordu'; presets.append(summary); card.append(presets);
        presets.open = expanded.has(army.id);
        const preset = mountArmyPreset(presets, army.id, (_, roster) => {
          if (locked || !flush()) return 'Önce geçersiz birlik sayısını düzelt.';
          army.roster = roster; change({ reload: true }); return 'Ordu hazır. Orduları uygula ile meydana taşı.';
        }, {
          initialSize: army.presetSize ?? armyCapacity(army.roster),
          onSizeChange: value => { army.presetSize = value; save(); },
        });
        presets.querySelector('.commander-auto-note').textContent = 'Yalnız bu ordunun askerleri değiştirilir. Diğer müttefik ordular korunur.';
        preset.render(army.commanderId); preset.setLocked(locked);
        for (const node of [name, teamSelect, choose, edit]) node.disabled = locked;
        column.append(card);
      }
      const add = document.createElement('button'); add.type = 'button'; add.className = 'alliance-add'; add.dataset.addArmy = team; add.textContent = '+ Müttefik ordu ekle'; add.disabled = locked || armies.length >= MAX_ARMIES;
      add.onclick = () => {
        if (locked || !flush()) return;
        const army = { id: `army-${crypto.randomUUID()}`, team, name: `${team ? 'Kızıl' : 'Mavi'} müttefik ${armies.filter(a => a.team === team).length + 1}`, roster: {}, commanderId: null };
        armies.push(army); active[team] = army.id; change({ reload: true });
      };
      column.append(add); columns.append(column);
    }
    dialog.querySelector('[role=status]').textContent = saveNote || `${armies.length} ordu · ${armies.filter(a => a.commanderId).length} komutan. Değişiklikler Orduları uygula ile meydana taşınır.`;
    dialog.querySelector('[data-apply]').disabled = locked;
    renderLive();
  }
  function renderLive() {
    liveList.replaceChildren();
    for (const army of battle?.armyConfigs || []) {
      const row = document.createElement('div'); row.className = 'alliance-live-row';
      const button = document.createElement('button'); button.type = 'button'; button.dataset.selectArmy = army.id; button.dataset.team = army.team;
      button.onclick = () => onSelect(army.id);
      const leader = document.createElement('button'); leader.type = 'button'; leader.dataset.selectLeader = army.id; leader.textContent = 'Komutanı seç';
      leader.onclick = () => onSelect(army.id, true); row.append(button, leader); liveList.append(row);
    }
    updateLive();
  }
  function updateLive() {
    if (!battle) return;
    const counts = new Map();
    for (const unit of battle.units) if (unit.hp > 0 && !unit.removed && !unit.commanderId) counts.set(unit.armyId, (counts.get(unit.armyId) || 0) + 1);
    for (const button of liveList.querySelectorAll('[data-select-army]')) {
      const army = battle.armyConfigs.find(a => a.id === button.dataset.selectArmy), leader = battle.armyCommanders.get(army.id);
      const tactic = armyTacticalLabel(battle, army.id);
      button.textContent = `${army.name} · ${counts.get(army.id) || 0} asker · ${leader ? `${leader.name} · ${leader.hp <= 0 ? 'Düştü' : `${Math.ceil(leader.hp)}/${leader.maxHp} can`}` : 'Komutansız'}${tactic ? ` · ${tactic}` : ''}`;
      button.disabled = battle.winner !== null || !counts.get(army.id) && !(leader?.hp > 0);
      button.nextElementSibling.disabled = battle.winner !== null || !(leader?.hp > 0);
    }
  }
  function open() { if (!flush()) return; render(); dialog.showModal(); }
  openButton.onclick = recruitOpen.onclick = setupOpen.onclick = open;
  for (const button of dialog.querySelectorAll('[data-close], [data-done]')) button.onclick = () => dialog.close();
  dialog.querySelector('[data-apply]').onclick = () => { if (!locked && flush() && onApply()) { dialog.close(); recruitment.close(); } };
  dialog.addEventListener('keydown', event => event.stopPropagation());
  for (const input of rosterInputs) input.addEventListener('input', () => { if (flush()) save(); });
  loadInputs(); save(); render();
  return {
    element: live,
    getConfigs() { if (!flush()) throw new Error('Birlik sayıları sıfır veya pozitif tam sayı olmalı.'); return validateArmyConfigs(armies); },
    setBattle(value) { const changed = battle !== value; battle = value; if (changed) renderLive(); else updateLive(); },
    setLocked(value) { if (locked === value) return; locked = value; selectors.forEach(select => select.disabled = value); render(); if (locked) picker.close(); },
    removeUnits(units) {
      flush();
      for (const unit of units) {
        const army = armies.find(a => a.id === unit.armyId); if (!army) continue;
        if (unit.commanderId) army.commanderId = null;
        else army.roster[unit.type] = Math.max(0, (army.roster[unit.type] || 0) - 1);
      }
      loadInputs(); save(); render(); recruitment.resetDraft?.();
    },
  };
}
