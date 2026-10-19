import { validateHistoricalArmies, restoreHistoricalArmies } from './historical-combat.js';
import { resolveCommanderIds } from './historical-commander-types.js';

export const ALLIANCE_STORAGE = 'marble-battle-alliances-v1';
export const MAX_ARMIES = 8;
export const allianceName = team => team ? 'Kızıl ittifak' : 'Mavi ittifak';
export function legacyArmyConfigs(rosters, commanders = []) {
  return rosters.map((roster, team) => ({ id: `army-${team}`, team,
    name: team ? 'Kızıl ordu' : 'Mavi ordu', roster, commanderId: commanders[team] || null }));
}
export function validateArmyConfigs(configs) {
  if (!Array.isArray(configs) || configs.length < 2 || configs.length > MAX_ARMIES)
    throw new Error(`Savaşta 2–${MAX_ARMIES} ordu olabilir.`);
  const ids = new Set();
  if (![0, 1].every(team => configs.some(config => config?.team === team)))
    throw new Error('Her ittifakta en az bir ordu olmalı.');
  return configs.map(config => {
    if (!config || typeof config.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(config.id) || ids.has(config.id))
      throw new Error('Ordu kimliği geçersiz veya tekrarlanıyor.');
    ids.add(config.id);
    if (config.team !== 0 && config.team !== 1) throw new Error('Her ordu için bir ittifak seç.');
    const roster = validateHistoricalArmies([config.roster, {}], { allowEmpty: true })[0];
    const commanderId = resolveCommanderIds([config.commanderId, null])[0];
    const presetSize = Number.isSafeInteger(config.presetSize) && config.presetSize > 0 ? config.presetSize : undefined;
    return { id: config.id, team: config.team, name: String(config.name || 'Ordu').trim().slice(0, 48) || 'Ordu', roster, commanderId,
      ...(presetSize !== undefined ? { presetSize } : {}) };
  });
}
export function aggregateArmies(configs) {
  const totals = [{}, {}];
  for (const army of configs) for (const [type, count] of Object.entries(army.roster))
    totals[army.team][type] = (totals[army.team][type] || 0) + count;
  return totals;
}
export function restoreArmyConfigs(saved) {
  if (!Array.isArray(saved)) throw new Error('Ordu kaydı okunamadı.');
  return validateArmyConfigs(saved.map(army => ({ ...army,
    roster: restoreHistoricalArmies([army.roster, {}]).armies[0] })));
}
