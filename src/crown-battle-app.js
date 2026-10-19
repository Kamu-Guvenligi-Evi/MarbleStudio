import './crown-battle.css';
import { Battle } from './crown-battle.js';
import { advanceBattleFrame } from './crown-battle-timing.js';
import { conditionSummary } from './crown-battle-condition.js';
import { BattleRenderer, formatTime } from './crown-battle-renderer.js';
import { HISTORICAL_TYPES, HISTORICAL_STORAGE, DEMO_ARMIES, restoreHistoricalArmies, CIVILIZATIONS } from './historical-combat.js';
import { civilizationPicker, civilizationMatches } from './historical-civilization-ui.js';
import { drawUnitCardArt } from './unit-card-art.js';
import { readCommanders } from './historical-commanders.js';
import { mountAllianceArmies } from './crown-battle-alliance-ui.js';
import { aggregateArmies } from './crown-battle-alliances.js';
import { mountArmySelection } from './crown-battle-selection.js';
import { mountRecruitment } from './crown-battle-recruitment.js';
import { mountBattleCamera } from './crown-battle-camera.js';
import { unitAtPoint } from './crown-battle-hit-test.js';
import { mountFormations } from './crown-battle-formation-ui.js';
import { BattleDeployment } from './crown-battle-deployment.js';
import { mountBattleGroups } from './crown-battle-groups.js';
import { mountBattleMaps } from './crown-battle-map-ui.js';
import './crown-battle-cinema.css';
import { BattleAudio } from './crown-battle-audio.js';
import { BattleFeedback } from './crown-battle-feedback.js';
import { mountBattleAudio } from './crown-battle-audio-ui.js';

const $ = id => document.getElementById(id), canvas = $('battle');
let battle = new Battle({ expandedMap: true }), renderer = new BattleRenderer(canvas, battle);
renderer.enableLayers();
const battleAudio = new BattleAudio(), soundControls = mountBattleAudio(battleAudio);
let running = false, speed = 1, accumulator = 0, last = performance.now(), lastUI = 0, lastEvents = '';
let starting = false, startVersion = 0;
let recorder = null, recordingStream = null, recordingRenderer = null, lastRecordFrame = 0, chunks = [], recordingSeconds = 0, recordingStarted = 0;
let recordingStarting = false;
let targeting = false;
let armySelection = null;
let recruitment = null;
let formations = null;
let battleGroups = null;
let setupPending = false;
const description = {
  field: 'Dengeli iki ordu, açık arazi. Kazananı birliklerin uyumu belirler.',
  wall: 'Kızıl ordunun mızrak hattı güçlü. Okçularla yıprat, süvariyi kanada gönder.',
  flank: 'Süvarilerin kuzey kanadında hazır. Mızraklılara doğrudan hücum etmekten kaçın.',
};
const historicalMode = new URLSearchParams(location.search).get('mode') !== 'classic';
const historicalEntry = new URLSearchParams(location.search).get('historical');
const deployment = new BattleDeployment(historicalMode ? 'historical' : 'classic', {
  reset: historicalMode && ['new', 'demo'].includes(historicalEntry),
});
let deploymentReady = false;
let historicalPlan = historicalEntry === 'demo' ? DEMO_ARMIES : [{}, {}], importNote = '';
let commanderPanel = null;
let alliancePanel = null;
if (historicalMode) {
  document.body.classList.add('historical-mode');
  const commands = document.querySelector('.armies');
  document.querySelector('.controls').prepend(commands);
  commands.querySelector('.panel-title h2').textContent = 'Birliklerini yönet';
  commands.querySelector('.panel-title > span').textContent = '01';
  document.querySelector('#preset').closest('.panel').querySelector('.panel-title > span').textContent = '02';
  document.querySelector('.stage-help').textContent = 'Birlik seç → meydana tıkla: ilerle · A: tümünü seç · H: hücum · Boşluk: duraklat';
  if (!['new', 'demo'].includes(historicalEntry)) {
    try {
      const saved = localStorage.getItem(HISTORICAL_STORAGE);
      if (saved) { const restored = restoreHistoricalArmies(JSON.parse(saved)); historicalPlan = restored.armies; importNote = restored.note; }
    } catch { importNote = 'Kayıtlı ordu okunamadı. Ordular boş başlatıldı; birlik ekleyebilirsin.'; }
  }
  document.querySelector('.builder-heading h3').textContent = 'Tarihî ordular';
  document.querySelector('.builder-heading > span').textContent = 'MAVİ / KIZIL';
  document.querySelector('.roster-head > span:nth-child(2)').textContent = 'Mavi';
  document.querySelector('.army-row b').textContent = 'Mavi ordu';
  document.querySelectorAll('.roster-row').forEach(row => row.remove());
  const rosterGroups = [];
  document.querySelector('.roster-head').before(civilizationPicker('roster-civilization', value => {
    for (const group of rosterGroups) group.hidden = !civilizationMatches(value, group.dataset.civilization);
  }));
  for (const civilization of CIVILIZATIONS) {
    const group = document.createElement('section'); group.className = 'roster-civilization'; group.dataset.civilization = civilization.name;
    const heading = document.createElement('h4'); heading.textContent = civilization.name; group.append(heading);
    document.querySelector('.roster-total').before(group); rosterGroups.push(group);
    for (const id of civilization.ids) {
    const cfg = HISTORICAL_TYPES[id];
    const row = document.createElement('div'); row.className = 'roster-row';
    row.innerHTML = `<label for="north-${id}"><canvas class="unit-portrait" data-portrait="${id}" width="96" height="80" aria-hidden="true"></canvas>${cfg.name}</label>${[0,1].map(team => `<input id="${team?'red':'north'}-${id}" data-roster="${team}" data-type="${id}" type="number" min="0" step="1" value="${historicalPlan[team][id] || 0}" aria-label="${team?'Kızıl':'Mavi'} ${cfg.name} sayısı">`).join('')}`;
    group.append(row);
    }
  }
  document.querySelector('.unit-grid').innerHTML = Object.entries(HISTORICAL_TYPES).map(([id,cfg]) => `<button data-unit="${id}" aria-pressed="false"><span>◆</span>${cfg.name}<small>${cfg.role==='elephant'?'Alan hasarı':cfg.skirmish?'Atlı okçu':cfg.projectile==='bullet'?'Tüfekli':cfg.role==='archer'?'Okçu':cfg.role==='cavalry'?'Hücum':cfg.role==='pike'?'Süvari karşıtı':'Yakın dövüş'}</small></button>`).join('');
  const grid = document.querySelector('.unit-grid');
  for (const civilization of CIVILIZATIONS) {
    const heading = document.createElement('h4'); heading.className = 'command-civilization'; heading.textContent = civilization.name; heading.dataset.ids = civilization.ids.join(','); grid.append(heading);
    for (const id of civilization.ids) grid.append(grid.querySelector(`[data-unit="${id}"]`));
  }
  for (const id of ['size','difficulty']) $(id).closest('.field-row').hidden = true;
}
// Keep battlefield commands beside the field, independent of the open menu.
const stageCommands = document.createElement('div'); stageCommands.className = 'stage-commands';
const conditionStatus = document.createElement('p'); conditionStatus.id = 'condition-status'; conditionStatus.className = 'small-note';
const conditionRow = document.createElement('div'); conditionRow.className = 'condition-row';
const restButton = document.createElement('button'); restButton.id = 'rest-selected'; restButton.className = 'quiet';
restButton.textContent = 'Dinlen'; restButton.title = 'Seçili birlikler durup saldırıyı bırakır. Yeniden savaşmak için Serbest hücum emri ver.';
conditionRow.append(conditionStatus, restButton);
conditionStatus.title = 'Yorgunluk yükseldikçe hareket ve saldırı yavaşlar. Durup ateşi kesmek dinlendirir. Hasar, asker ve komutan kayıpları morali düşürür. Morali bozulan birlik 8 saniye toparlanır; sonra emrine geri döner.';
stageCommands.append(document.querySelector('.command-row'), $('selection-note'));
stageCommands.append(conditionRow);
document.querySelector('.transport').before(stageCommands);
const stopButton = document.createElement('button'); stopButton.id = 'stop'; stopButton.className = 'quiet';
stopButton.textContent = 'Dur'; stopButton.title = 'Seçili birlikleri durdur (S)';
const targetButton = document.createElement('button'); targetButton.id = 'target-attack'; targetButton.className = 'quiet';
targetButton.textContent = 'Hedefe saldır'; targetButton.title = 'Meydandan düşman seç (T)'; targetButton.setAttribute('aria-pressed', 'false');
const removeButton = document.createElement('button'); removeButton.id = 'remove-selected'; removeButton.className = 'quiet';
removeButton.textContent = 'Seçilenleri kaldır'; removeButton.title = 'Seçili askerleri meydandan kaldır (Delete)';
document.querySelector('.command-row').append(targetButton, stopButton, removeButton);
$('charge').textContent = 'Serbest hücum'; $('charge').title = 'Otomatik savaşa dön (H)';
$('select-all').title = 'Tüm birlikleri seç (A)';
document.querySelector('.stage-help').textContent = 'Tıkla: tek asker · Çift tıkla: aynı tür · Shift: seçime ekle · Sağ tık: emir · Ctrl+1–5: grup kaydet · 1–5: grubu seç';
canvas.setAttribute('aria-label', 'Savaş meydanı. Mavi veya kızıl askere tıklayarak seç. Sağ tıkla ilerle veya saldır. Sahaya yerleştir düğmesiyle formasyonu yerleştir.');
const menus = [
  ['command', 'Komuta', document.querySelector('.armies')],
  ['setup', 'Ordu ve alan', $('preset').closest('.panel')],
  ['recording', 'Günlük / kayıt', document.querySelector('.chronicle')],
];
const menuTabs = document.createElement('nav'); menuTabs.className = 'menu-tabs';
menuTabs.setAttribute('role', 'tablist'); menuTabs.setAttribute('aria-label', 'Muharebe menüleri');
function showMenu(name, focus = false, openRecruitment = true) {
  if (name !== 'setup') recruitment?.close();
  for (const [id, , panel] of menus) {
    const active = name === id, tab = $(`menu-${id}`);
    panel.hidden = !active; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
    if (active && focus) tab.focus();
  }
  if (name === 'setup' && openRecruitment) recruitment?.open();
}
for (const [id, label, panel] of menus) {
  panel.id = `panel-${id}`; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', `menu-${id}`);
  const tab = document.createElement('button'); tab.id = `menu-${id}`; tab.type = 'button';
  tab.textContent = label; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', panel.id);
  tab.onclick = () => showMenu(id); menuTabs.append(tab);
}
menuTabs.addEventListener('keydown', event => {
  const index = menus.findIndex(([id]) => `menu-${id}` === event.target.id);
  if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? menus.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + menus.length) % menus.length;
  showMenu(menus[next][0], true);
});
document.querySelector('.controls').prepend(menuTabs); showMenu('command');
const armyLink = document.createElement('p'); armyLink.className = 'small-note';
armyLink.innerHTML = historicalMode ? '<a href="/historical-armies.html">Ordu atölyesine dön ↗</a> · <a href="/crown-battle.html?historical=new">Orduları sıfırdan kur</a> · <a href="/crown-battle.html?mode=classic">Klasik birlikler</a>' : '<a href="/historical-armies.html">Tarihî ordunu kur ↗</a> · <a href="/crown-battle.html?historical=demo">Tarihî örnek savaşı dene →</a>';
document.querySelector('.army-builder').before(armyLink);
const rosterInputs = [...document.querySelectorAll('[data-roster]')];
let customRoster = true;
if (!historicalMode) {
  const savedArmies = deployment.armyCounts();
  for (const input of rosterInputs) input.value = savedArmies[Number(input.dataset.roster)][input.dataset.type] || 0;
}
function readArmies() { return [0, 1].map(team => Object.fromEntries(rosterInputs.filter(input => Number(input.dataset.roster) === team).map(input => [input.dataset.type, input.value === '' ? NaN : Number(input.value)]))); }
function rosterTotals() {
  const totals = readArmies().map(army => Object.values(army).reduce((a, n) => a + n, 0));
  $('roster-north').textContent = Number.isFinite(totals[0]) ? totals[0] : '—'; $('roster-red').textContent = Number.isFinite(totals[1]) ? totals[1] : '—';
  $('roster-note').textContent = totals[0] + totals[1] > 2000 ? 'Çok kalabalık ordular simülasyonu yavaşlatabilir. Sayılar azaltılmadan uygulanır.' : 'Ekleme miktarını seç, − / + ile sayıyı değiştir. Kesin sayıyı kutuya yazabilirsin. Son olarak Orduları uygula.';
}
function fillTemplate() {
  if (historicalMode) return;
  customRoster = false;
  const template = new Battle({ size: Number($('size').value), preset: $('preset').value, difficulty: $('difficulty').value });
  for (const input of rosterInputs) input.value = template.units.filter(u => u.team === Number(input.dataset.roster) && u.type === input.dataset.type).length;
  rosterTotals();
  armySelection?.filterRoster();
}
function markSetupPending() {
  setupPending = true;
  setupActions.dataset.pending = 'true';
  const totals = readArmies().map(army => Object.values(army).reduce((a, n) => a + n, 0));
  $('settings-note').textContent = `Henüz uygulanmadı · Düzenlenen ordular: Mavi ${Number.isFinite(totals[0]) ? totals[0] : '—'} · Kızıl ${Number.isFinite(totals[1]) ? totals[1] : '—'}. Orduları uygula ile meydan yeniden kurulur.`;
  update();
}
for (const input of rosterInputs) input.addEventListener('input', () => { customRoster = true; rosterTotals(); markSetupPending(); });
for (const button of document.querySelectorAll('[data-unit]')) {
  const portrait = document.createElement('canvas'); portrait.width = 96; portrait.height = 80; portrait.className = 'unit-portrait'; portrait.dataset.portrait = button.dataset.unit; portrait.setAttribute('aria-hidden','true'); button.querySelector('span').replaceWith(portrait);
}
for (const portrait of document.querySelectorAll('[data-portrait]')) {
  const sprite = renderer.sprites.get(portrait.dataset.portrait,0,0,'idle',0);
  drawUnitCardArt(portrait,sprite,4);
}
if (historicalMode) {
  const note = document.createElement('p'); note.className = 'small-note';
  const link = document.createElement('a'); link.href = '/historical-armies.html';
  link.textContent = 'Birlik çizimleri ve tarihî görsel kaynakları ↗';
  note.append(link); document.querySelector('.unit-grid').after(note);
}
function settings() { return { expandedMap: true, allowEmpty: true, seed: Math.max(1, Math.min(999999, Math.round(Number($('seed').value) || 1066))), preset: $('preset').value, ...(historicalMode ? { armyConfigs: alliancePanel.getConfigs() } : { armies: readArmies() }) }; }
function rebuild() {
  if (recorder) return;
  if (rosterInputs.some(input => !input.checkValidity() || input.value === '')) { $('settings-note').textContent = 'Birlik sayıları sıfır veya pozitif tam sayı olmalı.'; rosterInputs.find(input => !input.checkValidity() || input.value === '').reportValidity(); return false; }
  let next, config;
  try { config = settings(); next = new Battle(config); } catch(error) { $('settings-note').textContent = error.message; return false; }
  $('seed').value = config.seed;
  next.setActiveTeam(battle.activeTeam);
  startVersion++; starting = false;
  battle = next; renderer.reset(battle); running = false; accumulator = 0; targeting = false; formations?.cancel();
  deployment.restore(battle); deployment.capture(battle); deploymentReady = true;
  battleAudio.stop(); new BattleFeedback(battle, battleAudio, () => renderer.view);
  setupPending = false; setupActions.dataset.pending = 'false';
  if (historicalMode) { try { localStorage.setItem(HISTORICAL_STORAGE, JSON.stringify(aggregateArmies(config.armyConfigs))); } catch {} }
  $('settings-note').textContent = battle.counts().every(Boolean) ? 'Meydan hazır. Muharebeyi başlatabilirsin.' : 'Orduları kur: iki tarafa da birlik ekle ve meydanı yeniden kur.';
  $('scenario-copy').textContent = description[config.preset];
  document.querySelectorAll('[data-unit]').forEach(b => b.setAttribute('aria-pressed', 'false'));
  update(); renderer.render(); return true;
}
async function togglePlay() {
  if (starting) { startVersion++; starting = false; update(); return; }
  if (setupPending && !running) { showMenu('setup'); return; }
  if (battle.winner !== null && recorder) return;
  if (battle.winner !== null && !rebuild()) return;
  if (!battle.counts().every(Boolean)) return;
  formations?.cancel(); accumulator = 0;
  if (running) { running = false; battleAudio.stop(); update(); return; }
  const version = ++startVersion, next = battle;
  starting = true; update();
  // AudioContext creation and pose rasterization must finish before simulation.
  const audioReady = soundControls.unlock();
  while (version === startVersion && battle === next && !document.hidden &&
    renderer.landscape && battle.time === 0 &&
    (renderer.warmBattle !== battle || renderer.warmCount !== battle.units.length || renderer.warmIndex < renderer.warmJobs?.length)) {
    await new Promise(requestAnimationFrame);
  }
  await audioReady;
  if (version !== startVersion || battle !== next) return;
  starting = false;
  if (!document.hidden && !setupPending && battle.counts().every(Boolean)) running = true;
  accumulator = 0; last = performance.now(); update();
}
function removeSelected() {
  const removed = battle.removeSelected();
  if (!removed.length) return;
  deployment.remove(battle, removed);
  if (historicalMode) alliancePanel.removeUnits(removed);
  else for (const unit of removed) {
      const input = rosterInputs.find(input => Number(input.dataset.roster) === unit.team && input.dataset.type === unit.type);
      if (input) input.value = Math.max(0, (Number(input.value) || 0) - 1);
  }
  customRoster = true; targeting = false;
  if (battle.winner !== null) {
    running = false;
    const finishingRecorder = recorder;
    if (finishingRecorder) setTimeout(() => { if (recorder === finishingRecorder) stopRecording(); }, 1500);
  }
  rosterTotals(); armySelection?.filterRoster();
  $('settings-note').textContent = `${removed.length} asker kaldırıldı. Ordu sayıları güncellendi.`;
  update(); renderer.render({ running });
}
function update(redraw = true) {
  if (!running) battleAudio.stop();
  if (redraw) renderer.invalidate();
  commanderPanel?.setBattle(battle);
  const [north, red] = battle.counts();
  conditionStatus.textContent = conditionSummary(battle);
  $('north-count').textContent = north; $('red-count').textContent = red;
  $('north-bar').style.width = `${battle.initial[0] ? north / battle.initial[0] * 100 : 0}%`; $('red-bar').style.width = `${battle.initial[1] ? red / battle.initial[1] * 100 : 0}%`;
  $('total-count').textContent = `${north + red} ASKER`;
  $('clock').textContent = formatTime(battle.time);
  armySelection?.refresh();
  formations?.refresh();
  battleGroups?.refresh();
  const ready = north > 0 && red > 0;
  $('play').disabled = (!running && setupPending) || (battle.winner === null && !ready);
  $('record').disabled = starting || recordingStarting || (!recorder && (setupPending || (battle.winner === null && !ready)));
  $('play').textContent = running ? 'Ⅱ Duraklat' : setupPending ? 'Önce orduları uygula' : battle.winner !== null ? '↺ Yeni muharebe' : battle.time > 0 ? '▶ Devam et' : '▶ Muharebeyi başlat';
  if (starting) $('play').textContent = `Hazırlanıyor… %${Math.min(100, Math.round(100 * (renderer.warmIndex || 0) / (renderer.warmJobs?.length || 1)))} · İptal`;
  $('stage-state').textContent = battle.winner !== null ? 'MUHAREBE TAMAMLANDI' : !ready ? 'ORDULARI KUR' : running ? 'MUHAREBE SÜRÜYOR' : battle.time ? 'DURAKLATILDI' : 'KONUŞLANMA';
  if (!battle.selected.size) targeting = false;
  $('selection-note').textContent = targeting ? 'Saldırılacak düşmana dokun veya tıkla. Esc: iptal.' : battle.selected.size ? `${battle.activeTeam ? 'Kızıl' : 'Mavi'} · ${battle.selected.size} asker seçili · Boş alana tıkla: ${battle.time > 0 || running ? 'ilerle' : 'yerleştir'} · Delete: kaldır` : !ready ? 'Başlamak için iki orduya da asker ekle ve Orduları uygula düğmesine bas.' : 'Mavi veya kızıl askere tıkla ya da meydanda sürükleyerek seç.';
  $('play').title = setupPending ? 'Ordu ve alan menüsündeki değişiklikleri önce uygula.' : !ready ? 'İki orduya da asker ekle.' : 'Boşluk: başlat / duraklat';
  $('charge').disabled = !battle.selected.size || battle.winner !== null;
  $('stop').disabled = $('target-attack').disabled = $('charge').disabled;
  removeButton.disabled = !battle.selected.size;
  restButton.disabled = !battle.selected.size || battle.winner !== null;
  $('target-attack').setAttribute('aria-pressed', String(targeting));
  canvas.classList.toggle('targeting', targeting);
  const key = battle.events.map(e => e.time + e.message).join('|');
  if (lastEvents !== key) {
    $('events').replaceChildren(...battle.events.slice(0, 4).map(e => { const item = document.createElement('li'), time = document.createElement('time'), message = document.createElement('span'); time.textContent = formatTime(e.time); message.textContent = e.message; item.append(time, message); return item; })); lastEvents = key;
  }
}
$('play').onclick = togglePlay;
removeButton.onclick = removeSelected;
$('restart').onclick = rebuild;
$('apply').onclick = () => {
  if (!rebuild()) return;
  showMenu('command');
  if (matchMedia('(max-width: 899px)').matches) document.querySelector('.battle-stage').scrollIntoView({ block: 'start', behavior: 'instant' });
};
$('new-seed').onclick = () => { $('seed').value = 1 + Math.floor(Math.random() * 999999); markSetupPending(); };
for (const id of ['preset', 'size', 'difficulty', 'seed']) $(id).addEventListener('change', () => { if (id === 'size' || id === 'difficulty' || (id === 'preset' && !customRoster)) fillTemplate(); if (id === 'preset') $('scenario-copy').textContent = description[$('preset').value]; markSetupPending(); });
document.querySelectorAll('[data-speed]').forEach(button => button.onclick = () => { speed = Number(button.dataset.speed); document.querySelectorAll('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); });
armySelection = mountArmySelection({ getBattle: () => battle, onChange: () => { targeting = false; formations?.cancel(); update(); }, rosterInputs });
formations = mountFormations({ host: stageCommands, canvas, renderer, getBattle: () => battle, getRunning: () => running,
  onActivate: () => { targeting = false; update(); },
  onChange: () => { if (!running) deployment.capture(battle); update(); },
  savedControls: deployment.controls, onControlsChange: controls => deployment.setControls(controls),
});
battleGroups = mountBattleGroups({ host: stageCommands, getBattle: () => battle, onChange: () => { targeting = false; formations.cancel(); update(); } });
// Keep the common controls visible while long rosters scroll independently.
const commandPanel = $('panel-command'), setupPanel = $('panel-setup');
const setupShortcut = document.createElement('button'); setupShortcut.id = 'army-setup-shortcut'; setupShortcut.type = 'button'; setupShortcut.textContent = '+ Asker ekle / Orduları düzenle';
setupShortcut.onclick = () => { showMenu('setup'); document.querySelector('.controls').scrollIntoView({ block: 'start', behavior: 'instant' }); $('roster-search').focus({ preventScroll: true }); };
commandPanel.querySelector('.panel-title').after(setupShortcut);
const commandScroll = document.createElement('div'); commandScroll.className = 'menu-scroll';
commandScroll.append(document.querySelector('.unit-grid'), document.querySelector('.selection-empty'));
for (const element of [...commandPanel.querySelectorAll('.army-row, .army-track')]) commandScroll.append(element);
commandPanel.append(commandScroll);
const setupScroll = document.createElement('div'); setupScroll.className = 'menu-scroll';
const setupActions = document.createElement('div'); setupActions.className = 'setup-actions';
setupActions.append($('apply'), $('settings-note'));
for (const element of [...setupPanel.children]) if (!element.classList.contains('panel-title')) setupScroll.append(element);
setupScroll.prepend(setupScroll.querySelector('.army-builder'));
setupPanel.append(setupScroll, setupActions);
$('apply').textContent = 'Orduları uygula';
recruitment = mountRecruitment({ rosterInputs, filterRoster: armySelection.filterRoster, onClose: () => showMenu('command') });
if (historicalMode) {
  alliancePanel = mountAllianceArmies({ rosters: historicalPlan,
    commanders: historicalEntry === 'new' ? [null, null] : readCommanders(),
    reset: ['new', 'demo'].includes(historicalEntry), rosterInputs,
    onChange: markSetupPending, onApply: rebuild, recruitment, host: commandScroll,
    onSelect: (id, leaderOnly = false) => {
      const army = battle.armyConfigs.find(a => a.id === id); if (!army) return;
      battle.setActiveTeam(army.team);
      battle.selected = new Set(battle.units.filter(u => u.armyId === id && u.hp > 0 && !u.removed && (!leaderOnly || u.commanderId)).map(u => u.id));
      targeting = false; formations.cancel(); update();
    },
  });
  commanderPanel = alliancePanel;
  armySelection.filterRoster();
}
$('select-all').onclick = () => { battle.select(); document.querySelectorAll('[data-unit]').forEach(b => b.setAttribute('aria-pressed', 'true')); update(); };
$('charge').onclick = () => { formations.cancel(); targeting = false; battle.engageSelected(); update(); };
$('stop').onclick = () => { formations.cancel(); targeting = false; battle.stopSelected(); update(); };
restButton.onclick = () => { formations.cancel(); targeting = false; battle.restSelected(); update(); };
$('target-attack').onclick = () => { formations.cancel(); targeting = !targeting; update(); canvas.focus(); };
stageCommands.id = 'battle-commands';
const cinemaCommands = document.createElement('button');
cinemaCommands.id = 'cinema-commands'; cinemaCommands.className = 'quiet'; cinemaCommands.type = 'button';
cinemaCommands.setAttribute('aria-controls', stageCommands.id);
function showCinemaCommands(open) {
  document.body.classList.toggle('cinema-commands-open', open);
  cinemaCommands.setAttribute('aria-expanded', String(open));
  cinemaCommands.textContent = open ? 'Kapat ▾' : 'Komutlar ▴';
}
showCinemaCommands(false);
cinemaCommands.onclick = () => showCinemaCommands(cinemaCommands.getAttribute('aria-expanded') !== 'true');
document.querySelector('.transport').append(cinemaCommands);
function cinema(enable) {
  showCinemaCommands(false);
  document.body.classList.toggle('cinema', enable);
  $('cinema').setAttribute('aria-pressed', String(enable));
  if (enable) canvas.focus({ preventScroll: true }); else $('cinema').focus({ preventScroll: true });
}
$('cinema').onclick = () => cinema(true); $('exit-cinema').onclick = () => cinema(false);
document.addEventListener('keydown', event => {
  if (battleGroups.handleKey(event)) return;
  if ((event.ctrlKey || event.metaKey) && event.code === 'KeyZ' && !event.shiftKey && !/INPUT|SELECT|TEXTAREA/.test(event.target.tagName) && !event.target.isContentEditable) {
    const undo = $('undo-placement'); if (!undo.disabled) { event.preventDefault(); undo.click(); }
  }
  if (event.key === 'Escape') { cinema(false); if (!targeting && !formations.active) battle.selected.clear(); formations.cancel(); targeting = false; drag = null; renderer.box = null; update(); }
  if (!/INPUT|SELECT|TEXTAREA/.test(event.target.tagName) && !event.target.isContentEditable && !event.ctrlKey && !event.metaKey && !event.altKey) {
    if (event.key === 'Delete' && !event.target.isContentEditable) { event.preventDefault(); removeButton.click(); }
    if (event.code === 'KeyA') { event.preventDefault(); $('select-all').click(); }
    if (event.code === 'KeyH' && battle.selected.size) { event.preventDefault(); $('charge').click(); }
    if (event.code === 'KeyS' && battle.selected.size) { event.preventDefault(); $('stop').click(); }
    if (event.code === 'KeyT' && battle.selected.size) { event.preventDefault(); $('target-attack').click(); }
  }
  if (event.code === 'Space' && !/INPUT|SELECT|BUTTON|TEXTAREA/.test(event.target.tagName) && !event.target.isContentEditable) { event.preventDefault(); togglePlay(); }
});
function point(event) {
  const r = canvas.getBoundingClientRect(), scale = Math.min(r.width / canvas.width, r.height / canvas.height);
  return renderer.screenToWorld((event.clientX - r.left - (r.width - canvas.width * scale) / 2) / scale / canvas.width, (event.clientY - r.top - (r.height - canvas.height * scale) / 2) / scale / canvas.height);
}
const camera = mountBattleCamera(canvas, renderer, () => battle, () => { drag = null; renderer.box = null; formations.cancel(); });
let drag = null;
function commandAt(p, directPlacement = false) {
  if (battle.winner !== null) return;
  const bounds = renderer.bounds;
  if (p.x < bounds.left || p.x > bounds.right || p.y < bounds.top || p.y > bounds.bottom || !battle.selected.size) return;
  const enemy = unitAtPoint(battle, renderer, p, 1 - battle.activeTeam, 18);
  if (enemy) { battle.attackSelected(enemy.id); targeting = false; }
  else if (!targeting) {
    if (directPlacement && battle.time === 0 && !running) formations.place(p, true);
    else battle.moveSelected(p.x, p.y, formations.options());
  }
  update();
}
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => {
  canvas.focus(); const p = point(e);
  const bounds = renderer.bounds;
  if (p.x < bounds.left || p.x > bounds.right || p.y < bounds.top || p.y > bounds.bottom) return;
  if (formations.active) { drag = { a: p, z: p, formation: true }; formations.preview(p); canvas.setPointerCapture(e.pointerId); return; }
  // Wait for touch release so a second finger can turn this into a camera gesture.
  if (targeting && e.pointerType === 'touch') {
    drag = { a: p, z: p, command: true }; canvas.setPointerCapture(e.pointerId); return;
  }
  if (e.button === 2 || targeting) { commandAt(p); return; }
  drag = { a: p, z: p, additive: e.shiftKey || e.ctrlKey || e.metaKey }; canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => { if (formations.active) { formations.preview(point(e)); return; } if (!drag || drag.command) return; drag.z = point(e); if (Math.hypot(drag.a.x - drag.z.x, drag.a.y - drag.z.y) > 7) renderer.box = drag; });
canvas.addEventListener('pointerup', e => {
  if (!drag) return;
  const p = point(e);
  if (drag.formation) { drag = null; formations.place(p); return; }
  if (drag.command) { drag = null; if (targeting) commandAt(p); return; }
  if (Math.hypot(drag.a.x - p.x, drag.a.y - p.y) > 7) {
    const previous = drag.additive ? [...battle.selected] : []; battle.selectArea(drag.a, p);
    for (const id of previous) battle.selected.add(id);
  } else {
    const friendly = unitAtPoint(battle, renderer, p, null);
    if (friendly) {
      if (friendly.team !== battle.activeTeam) battle.setActiveTeam(friendly.team);
      if (drag.additive) battle.selected.has(friendly.id) ? battle.selected.delete(friendly.id) : battle.selected.add(friendly.id);
      else { battle.selected.clear(); battle.selected.add(friendly.id); }
      targeting = false;
    } else if (battle.selected.size) commandAt(p, true);
  }
  drag = null; renderer.box = null; update();
});
canvas.addEventListener('pointercancel', () => { drag = null; renderer.box = null; });
canvas.addEventListener('dblclick', e => {
  if (formations.active || targeting || e.shiftKey || e.ctrlKey || e.metaKey) return;
  const unit = unitAtPoint(battle, renderer, point(e), null);
  if (!unit) return;
  if (unit.team !== battle.activeTeam) battle.setActiveTeam(unit.team);
  battle.select(unit.type); update();
});
function setRecordingUI(active) {
  commanderPanel?.setLocked(active);
  rosterInputs.forEach(input => input.disabled = active);
  armySelection?.setLocked(active);
  for (const id of ['restart', 'apply', 'preset', 'size', 'difficulty', 'seed', 'new-seed']) $(id).disabled = active;
  $('record').textContent = active ? '■ Kaydı bitir ve indir' : '● Video kaydını başlat';
}
function stopRecording() { if (recorder?.state === 'recording') recorder.stop(); }
$('record').onclick = async () => {
  if (recordingStarting) return;
  if (recorder) { stopRecording(); return; }
  if (battle.winner !== null && !rebuild()) return;
  if (!battle.counts().every(Boolean)) return;
  if (!canvas.captureStream || !window.MediaRecorder) { $('record-note').textContent = 'Bu tarayıcı kayıt özelliğini desteklemiyor.'; return; }
  const mimeType = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
  if (!mimeType) { $('record-note').textContent = 'WebM kaydı bu tarayıcıda desteklenmiyor.'; return; }
  // Lock this button while the user-gesture AudioContext is starting.
  recordingStarting = true; $('record').disabled = true;
  await battleAudio.unlock();
  recordingStarting = false;
  if (document.hidden || recorder) { update(); return; }
  try {
    // Keep export resolution independent of PC resizing and the landscape display.
    const exportCanvas = document.createElement('canvas'); exportCanvas.width = 1080; exportCanvas.height = 1920;
    recordingRenderer = new BattleRenderer(exportCanvas, battle, { sprites: renderer.sprites, terrain: renderer.terrain, mapId: renderer.mapId });
    recordingRenderer.fitMap();
    recordingRenderer.render({ running: true }); lastRecordFrame = 0;
    chunks = []; recordingStream = exportCanvas.captureStream(30);
    const audioTrack = battleAudio.recordingTrack();
    if (audioTrack) recordingStream.addTrack(audioTrack);
    recorder = new MediaRecorder(recordingStream, { mimeType, videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 128_000 });
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size > 100) {
        const url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = `tac-muharebesi-${battle.seed}-${Date.now()}.webm`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
      }
      recordingStream?.getTracks().forEach(track => track.stop()); recordingStream = null; recordingRenderer = null; recorder = null; chunks = []; setRecordingUI(false);
      $('record-note').textContent = blob.size > 100 ? `${Math.round(recordingSeconds)} sn kayıt hazır; indirme başlatıldı. WebM · ${audioTrack ? 'Ses kanallı' : 'Sessiz'}` : 'Kayıt çok kısa olduğu için görüntü oluşmadı. Birkaç saniye kaydedip tekrar dene.';
    };
    recorder.onerror = () => { $('record-note').textContent = 'Kayıt sırasında hata oluştu. Kaydı durdurup yeniden deneyebilirsin.'; };
    recorder.start(1000); recordingSeconds = 0; recordingStarted = performance.now(); running = true; setRecordingUI(true); update();
  } catch (error) {
    recordingStream?.getTracks().forEach(track => track.stop()); recordingStream = null; recordingRenderer = null; recorder = null; setRecordingUI(false); $('record-note').textContent = `Kayıt açılamadı: ${error.message}`;
  } finally { update(); }
};
document.addEventListener('visibilitychange', () => { if (document.hidden) { startVersion++; starting = false; running = false; accumulator = 0; stopRecording(); update(); } last = performance.now(); });
function frame(now) {
  const elapsed = Math.min(.1, (now - last) / 1000); last = now;
  if (running && !document.hidden) renderer.adaptPerformance(elapsed * 1000);
  camera.tick(elapsed, running && !document.hidden);
  if (running && battle.winner === null) {
    accumulator = advanceBattleFrame(battle, accumulator, elapsed, speed);
    if (battle.winner !== null) {
      running = false; renderer.render(); update();
      // Leave the result visible in the exported video before ending the stream.
      const finishingRecorder = recorder;
      if (finishingRecorder) setTimeout(() => { if (recorder === finishingRecorder) stopRecording(); }, 1500);
    }
  }
  renderer.renderIfNeeded({ running });
  if (!running && !document.hidden) renderer.prepareBattle();
  if (recordingRenderer && now - lastRecordFrame >= 1000 / 30) { recordingRenderer.render({ running }); lastRecordFrame = now; }
  if (now - lastUI > 200) {
    // Updating counters must not cancel a partly prepared crowd frame or reset
    // GPU interpolation. Commands and selection changes still invalidate it.
    if (running || starting) update(false); lastUI = now;
    if (recorder?.state === 'recording') { recordingSeconds = (now - recordingStarted) / 1000; $('record-note').textContent = `Kayıt sürüyor · ${formatTime(recordingSeconds)} · Dikey WebM`; if (recordingSeconds >= 300) stopRecording(); }
  }
  requestAnimationFrame(frame);
}
const desktopView = window.matchMedia('(min-width:900px)');
let viewportSignature = '';
function resizeBattle() {
  const rect = canvas.parentElement.getBoundingClientRect(), desktop = desktopView.matches;
  const width = Math.floor(rect.width), height = Math.floor(rect.height);
  if (!width || !height) return;
  const signature = `${width}:${height}:${desktop}:${devicePixelRatio}`;
  if (signature === viewportSignature) return;
  viewportSignature = signature; renderer.resize(width, height, desktop, devicePixelRatio);
  $('stage-view-label').textContent = desktop ? 'PC · GENİŞ MEYDAN' : '9:16 · CANLI SİMÜLASYON';
  renderer.render({ running });
}
new ResizeObserver(resizeBattle).observe(canvas.parentElement);
desktopView.addEventListener('change', resizeBattle);
window.addEventListener('resize', resizeBattle);
mountBattleMaps({ renderer, getRecordingRenderer: () => recordingRenderer, onChange: () => {
  if (deploymentReady && !running) deployment.capture(battle);
  update();
} });
rebuild(); rosterTotals(); if (importNote) $('settings-note').textContent = importNote;
// New/demo are entry actions, not instructions to erase the army on every reload.
if (historicalMode && ['new', 'demo'].includes(historicalEntry)) {
  const url = new URL(location.href); url.searchParams.delete('historical'); history.replaceState(history.state, '', url);
}
if (battle.counts().every(count => count === 0)) showMenu('setup', false, false);
resizeBattle();
update(); requestAnimationFrame(frame);
