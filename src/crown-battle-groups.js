import './crown-battle-groups.css';

export function mountBattleGroups({ host, getBattle, onChange }) {
  const row = document.createElement('div'); row.className = 'battle-groups';
  row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Birlik grupları');
  const label = document.createElement('span'); label.textContent = 'Gruplar';
  const save = document.createElement('button'); save.id = 'save-battle-group';
  save.textContent = 'Gruba kaydet'; save.title = 'Seçimi kaydetmek için ardından 1–5 seç. Klavye: Ctrl + 1–5';
  let current, groups, saving = false;
  const buttons = Array.from({ length: 5 }, (_, i) => {
    const button = document.createElement('button'); button.dataset.battleGroup = i + 1;
    button.onclick = () => activate(i, saving); return button;
  });
  row.append(label, ...buttons, save); host.append(row);
  function refresh() {
    const b = getBattle();
    if (current !== b) { current = b; groups = Array.from({ length: 2 }, () => Array.from({ length: 5 }, () => [])); saving = false; }
    const team = groups[b.activeTeam];
    if (!b.selected.size) saving = false;
    save.disabled = !b.selected.size;
    save.setAttribute('aria-pressed', String(saving));
    save.textContent = saving ? '1–5 seç · İptal' : 'Gruba kaydet';
    buttons.forEach((button, i) => {
      team[i] = team[i].filter(u => u.hp > 0 && !u.removed);
      const n = team[i].length;
      button.textContent = `${i + 1} · ${n || '—'}`;
      button.disabled = !n && !b.selected.size;
      button.title = `${b.activeTeam ? 'Kızıl' : 'Mavi'} grup ${i + 1}: ${n} asker. ${saving || !n ? 'Seçili askerleri kaydet' : 'Grubu seç'}`;
      button.setAttribute('aria-label', button.title);
      button.setAttribute('aria-pressed', String(n > 0 && n === b.selected.size && team[i].every(u => b.selected.has(u.id))));
    });
  }
  function activate(i, overwrite = false) {
    refresh();
    const b = current, team = groups[b.activeTeam];
    if (overwrite || !team[i].length) {
      if (!b.selected.size) return;
      team[i] = b.units.filter(u => u.team === b.activeTeam && u.hp > 0 && b.selected.has(u.id));
    } else b.selected = new Set(team[i].map(u => u.id));
    saving = false; onChange();
  }
  save.onclick = () => { saving = !saving; refresh(); };
  refresh();
  return {
    refresh,
    handleKey(event) {
      if (event.key === 'Escape') { saving = false; refresh(); return false; }
      if (event.repeat || event.altKey || event.shiftKey || event.target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName)) return false;
      const match = /^(?:Digit|Numpad)([1-5])$/.exec(event.code);
      if (!match) return false;
      event.preventDefault(); activate(Number(match[1]) - 1, event.ctrlKey || event.metaKey || saving); return true;
    }
  };
}
