import { BATTLE_MAPS, battleMap, makeBattleMap } from './crown-battle-maps.js';
import './crown-battle-maps.css';

const STORAGE = 'marble-crown-battle-map-v1';
export function mountBattleMaps({ renderer, getRecordingRenderer, onChange = () => {} }) {
  const section = document.createElement('section'); section.className = 'battle-map-picker';
  section.setAttribute('aria-labelledby', 'battle-map-heading');
  section.innerHTML = '<h3 id="battle-map-heading">Haritalar</h3><div class="battle-map-grid" role="group" aria-label="Harita seç"></div><p id="battle-map-description" aria-live="polite"></p>';
  document.querySelector('label[for="preset"]').before(section);
  const grid = section.querySelector('.battle-map-grid');
  for (const map of BATTLE_MAPS) {
    const button = document.createElement('button'); button.type = 'button';
    button.dataset.battleMap = map.id; button.setAttribute('aria-pressed', 'false');
    const preview = map.id === 'classic' ? document.createElement('canvas') : makeBattleMap(1066, map.id, 160, 64);
    if (map.id === 'classic') {
      preview.width = 160; preview.height = 64;
      preview.getContext('2d').drawImage(renderer.terrain, 0, 0, 160, 64);
    }
    preview.setAttribute('aria-hidden', 'true'); button.append(preview, document.createTextNode(map.name));
    button.onclick = () => apply(map.id); grid.append(button);
  }
  function apply(id) {
    const map = battleMap(id);
    renderer.setMap(map.id); getRecordingRenderer()?.setMap(map.id);
    for (const button of grid.children) button.setAttribute('aria-pressed', String(button.dataset.battleMap === map.id));
    section.querySelector('#battle-map-description').textContent = `${map.name} · ${map.description}`;
    try { localStorage.setItem(STORAGE, map.id); } catch { /* Session selection still works. */ }
    onChange();
  }
  let saved; try { saved = localStorage.getItem(STORAGE); } catch {}
  apply(new URLSearchParams(location.search).get('map') || saved);
}
