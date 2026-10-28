import { CIVILIZATIONS } from './historical-combat.js';
import { CULTURE_GROUPS, cultureForCivilization } from './historical-culture-groups.js';
import './historical-culture-picker.css';
export { civilizationMatches } from './historical-culture-groups.js';

export function civilizationPicker(id, onChange) {
  const root = document.createElement('section');
  root.className = 'civilization-picker culture-picker';
  root.setAttribute('aria-label', 'Medeniyet grubu ve ülke seçimi');
  const heading = document.createElement('strong'); heading.textContent = 'Medeniyet grubu';
  const cultures = document.createElement('div'); cultures.className = 'culture-tabs';
  cultures.setAttribute('role', 'group'); cultures.setAttribute('aria-label', 'Medeniyet grupları');
  const countries = document.createElement('div'); countries.className = 'country-tabs';
  countries.setAttribute('role', 'group'); countries.setAttribute('aria-label', 'Ülkeler ve devletler');
  const countryLabel = document.createElement('strong'); countryLabel.textContent = 'Medeniyet / devlet';
  const hint = document.createElement('small'); hint.textContent = 'Önce bir grup, ardından içinden medeniyet seç. Birlik sayıların korunur.';
  // Preserve the change-event contract used by roster search and existing integrations.
  const select = document.createElement('select'); select.id = id;
  select.className = 'culture-value'; select.tabIndex = -1; select.setAttribute('aria-hidden', 'true');
  select.add(new Option('Tümü', ''));
  for (const group of CULTURE_GROUPS) select.add(new Option(group.name, `culture:${group.id}`));
  for (const country of CIVILIZATIONS) select.add(new Option(country.name, country.name));
  function choose(value) {
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function button(label, value, kind) {
    const node = document.createElement('button'); node.type = 'button'; node.textContent = label;
    node.dataset[kind] = value; node.addEventListener('click', () => choose(value));
    return node;
  }
  cultures.append(button('Tümü', '', 'culture'));
  for (const group of CULTURE_GROUPS) cultures.append(button(group.name, `culture:${group.id}`, 'culture'));
  let shownGroup;
  function sync() {
    const value = select.value;
    const group = value.startsWith('culture:') ? CULTURE_GROUPS.find(g => g.id === value.slice(8)) : cultureForCivilization(value);
    for (const node of cultures.children) node.setAttribute('aria-pressed', String(node.dataset.culture === (group ? `culture:${group.id}` : '')));
    if (shownGroup !== group || !countries.childElementCount) {
      countries.replaceChildren();
      if (group) {
        countries.append(button(`${group.name} · Tümü`, `culture:${group.id}`, 'country'));
        for (const country of group.countries) countries.append(button(`${country.name} · ${country.ids.length}`, country.name, 'country'));
      }
      shownGroup = group;
    }
    countryLabel.hidden = countries.hidden = !group;
    for (const node of countries.children) node.setAttribute('aria-pressed', String(node.dataset.country === value));
  }
  select.addEventListener('change', () => { sync(); onChange(select.value); });
  root.append(heading, cultures, countryLabel, countries, hint, select);
  sync();
  return root;
}
