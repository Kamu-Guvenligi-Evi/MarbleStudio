import { FORMATIONS, FORMATION_DESCRIPTIONS, formationLayout } from './crown-battle-formations.js';
import './crown-battle-formations.css';

export function mountFormations({ host, canvas, renderer, getBattle, getRunning, onActivate, onChange, savedControls = {}, onControlsChange = () => {} }) {
  const bar = document.createElement('div'); bar.className = 'formation-tools';
  bar.innerHTML = `<label>Formasyon<select id="formation-kind">${Object.entries(FORMATIONS).map(([id, name]) => `<option value="${id}"${id === 'block' ? ' selected' : ''}>${name}</option>`).join('')}</select></label><label>Ön cephe<select id="formation-direction"><option value="auto">Rakibe doğru</option><option value="0">Sağ →</option><option value="180">Sol ←</option><option value="270">Yukarı ↑</option><option value="90">Aşağı ↓</option></select></label><button id="place-formation" type="button" aria-pressed="false">Sahaya yerleştir</button><p id="formation-note" role="status">Birlik seç, formasyonu belirle ve sahaya yerleştir.</p>`;
  host.append(bar);
  const sizing = document.createElement('div'); sizing.className = 'formation-size';
  sizing.innerHTML = '<label for="formation-size"><span id="formation-size-label">Diziliş boyutu</span><output id="formation-size-value" for="formation-size">%100</output></label><div><button id="formation-size-less" type="button" aria-label="Formasyonu küçült">−</button><input id="formation-size" type="range" min="75" max="250" step="5" value="100" aria-describedby="formation-size-help"><button id="formation-size-more" type="button" aria-label="Formasyonu büyüt">+</button><button id="apply-formation-size" type="button">Boyutu uygula</button></div><small id="formation-size-help">Seçili gruba bulunduğu yerde uygula. En küçük boyut asker aralığıyla sınırlıdır.</small>';
  bar.querySelector('p').before(sizing);
  const size = sizing.querySelector('input'), sizeValue = sizing.querySelector('output'), applySize = sizing.querySelector('#apply-formation-size');
  if (Number.isFinite(savedControls.scale) && savedControls.scale >= .75 && savedControls.scale <= 2.5) size.value = String(savedControls.scale * 100);
  const guide = document.createElement('div'); guide.className = 'formation-guide';
  guide.innerHTML = '<svg aria-hidden="true" focusable="false"></svg><div><strong></strong><span id="formation-description"></span><small>Diziliş önizlemesi · ok: ön cephe</small></div>';
  bar.querySelector('p').before(guide);
  const undo = document.createElement('button'); undo.id = 'undo-placement'; undo.type = 'button'; undo.textContent = '↶ Geri al'; undo.title = 'Son yerleştirmeyi geri al (Ctrl+Z)';
  bar.querySelector('p').before(undo);
  const button = bar.querySelector('button'), note = bar.querySelector('p'), kind = bar.querySelector('#formation-kind'), direction = bar.querySelector('#formation-direction');
  kind.setAttribute('aria-describedby', 'formation-description');
  for (const [select, value] of [[kind, savedControls.kind], [direction, savedControls.direction]]) {
    if ([...select.options].some(option => option.value === value)) select.value = value;
  }
  let active = false, owner = null, team = null, anchor = null;
  let historyOwner = null, historyMap = null, history = [], message = '', messageUntil = 0;
  const inform = text => { message = text; messageUntil = Date.now() + 5000; note.textContent = text; };
  const options = () => ({ kind: kind.value, scale: Number(size.value) / 100, direction: direction.value === 'auto' ? getBattle().activeTeam ? 180 : 0 : Number(direction.value) });
  let guideKey = '';
  function refreshGuide() {
    const choice = options(), key = `${choice.kind}:${choice.direction}:${choice.scale}`;
    if (key === guideKey) return;
    guideKey = key;
    sizeValue.textContent = `%${size.value}`;
    size.setAttribute('aria-valuetext', `Yüzde ${size.value}`);
    sizing.querySelector('#formation-size-label').textContent = choice.kind === 'circle' ? 'Çember çapı' : choice.kind === 'line' ? 'Hat genişliği' : 'Diziliş boyutu';
    sizing.querySelector('#formation-size-less').disabled = Number(size.value) <= 75;
    sizing.querySelector('#formation-size-more').disabled = Number(size.value) >= 250;
    const plan = formationLayout(Array.from({ length: 16 }, (_, id) => ({ id })), 0, 0, choice,
      { left: -1000, right: 1000, top: -1000, bottom: 1000 }, () => 3);
    const svg = guide.querySelector('svg');
    const extent = Math.max(...plan.slots.flatMap(p => [Math.abs(p.x), Math.abs(p.y)])) + 20;
    svg.setAttribute('viewBox', `${-extent} ${-extent} ${extent * 2} ${extent * 2}`);
    const arrow = extent - 9;
    svg.innerHTML = plan.slots.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" />`).join('') +
      `<path transform="rotate(${choice.direction})" d="M ${arrow - 10} 0 H ${arrow} M ${arrow - 5} -4 L ${arrow} 0 L ${arrow - 5} 4" />`;
    guide.querySelector('strong').textContent = FORMATIONS[choice.kind];
    guide.querySelector('span').textContent = FORMATION_DESCRIPTIONS[choice.kind];
  }
  function cancel() { active = false; anchor = null; renderer.formationPreview = null; renderer.invalidate(); refresh(); }
  function refresh() {
    const b = getBattle();
    refreshGuide();
    if (historyOwner !== b || historyMap !== b.mapRevision || b.time > 0 || getRunning()) { history = []; historyOwner = b; historyMap = b.mapRevision; }
    history = history.filter(entry => entry.every(({ unit }) => unit.hp > 0 && !unit.removed));
    undo.disabled = !history.length || b.winner !== null;
    if (active && (b !== owner || b.activeTeam !== team || !b.selected.size || b.winner !== null)) { active = false; anchor = null; renderer.formationPreview = null; renderer.invalidate(); }
    button.disabled = !b.selected.size || b.winner !== null;
    applySize.disabled = button.disabled;
    applySize.textContent = b.time > 0 || getRunning() ? 'Bu boyutta ilerle' : 'Boyutu uygula';
    button.textContent = active ? 'Yerleştirmeyi iptal et' : b.time > 0 || getRunning() ? 'Formasyonla ilerle' : 'Sahaya yerleştir';
    button.setAttribute('aria-pressed', String(active)); canvas.classList.toggle('placing-formation', active);
    note.textContent = Date.now() < messageUntil && !active ? message : active ? 'Meydanda istediğin yere tıkla / dokun. Esc: iptal.' : b.time > 0 ? 'Boş alana tıkla: seçili birlikler formasyonla ilerler.' : b.selected.size ? 'Boş alana tıkla: yerleştir. Dolu alana yerleştirmek için Sahaya yerleştir düğmesini kullan.' : 'Önce meydandan veya Komuta menüsünden birlik seç.';
  }
  function preview(point) {
    if (!active) return;
    anchor = point;
    renderer.formationPreview = { ...getBattle().formationPlan(point.x, point.y, options()), team };
    renderer.invalidate();
    note.textContent = renderer.formationPreview.valid ? `${renderer.formationPreview.slots.length} asker · Tıkla / dokun: uygula · Esc: iptal` : renderer.formationPreview.message;
  }
  function place(point, direct = false) {
    if (!active && !direct) return;
    const b = getBattle();
    const deploying = b.time === 0 && !getRunning();
    const snapshot = deploying ? b.units.filter(u => u.hp > 0 && u.team === b.activeTeam && b.selected.has(u.id)).map(unit => ({ unit, state: { ...unit } })) : null;
    const result = deploying ? b.deploySelected(point.x, point.y, options()) : b.moveSelected(point.x, point.y, options());
    if (!result.valid) { preview(point); inform(result.message); return; }
    if (snapshot) { history.push(snapshot); if (history.length > 10) history.shift(); }
    cancel(); inform(deploying ? `${result.slots.length} asker yerleştirildi. Geri al: Ctrl+Z veya ↶ Geri al.` : `${result.slots.length} askere formasyonla ilerleme emri verildi.`); onChange();
  }
  undo.onclick = () => {
    refresh(); if (undo.disabled) return;
    for (const { unit, state } of history.pop()) Object.assign(unit, state);
    cancel(); inform('Son yerleştirme geri alındı.'); onChange();
  };
  button.onclick = () => {
    if (active) { cancel(); return; }
    onActivate(); active = true; owner = getBattle(); team = owner.activeTeam; refresh(); canvas.focus();
  };
  const controlsChanged = () => {
    refreshGuide();
    if (anchor) preview(anchor);
    onControlsChange({ kind: kind.value, direction: direction.value, scale: Number(size.value) / 100 });
  };
  for (const select of [kind, direction]) select.onchange = controlsChanged;
  size.oninput = controlsChanged;
  for (const [id, delta] of [['formation-size-less', -5], ['formation-size-more', 5]]) sizing.querySelector(`#${id}`).onclick = () => {
    size.value = String(Math.max(75, Math.min(250, Number(size.value) + delta))); controlsChanged();
  };
  applySize.onclick = () => {
    const b = getBattle(), selected = b.units.filter(u => u.hp > 0 && !u.removed && u.team === b.activeTeam && b.selected.has(u.id));
    if (!selected.length || b.winner !== null) return;
    const xs = selected.map(u => u.x), ys = selected.map(u => u.y);
    onActivate();
    place({ x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 }, true);
  };
  refresh();
  return { get active() { return active; }, cancel, refresh, preview, place, options };
}
