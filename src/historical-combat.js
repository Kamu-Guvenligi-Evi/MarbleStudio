import catalogue, { RETIRED_HISTORICAL_IDS, HISTORICAL_UNIT_REPLACEMENTS } from './historical-catalogue.js';
import { HISTORICAL_EQUIPMENT_BALANCE } from './historical-equipment-balance.js';

// Fictional gameplay balance. Catalogue additions inherit a playable role preset.
const TUNED_TYPES = {
  ...HISTORICAL_EQUIPMENT_BALANCE,
  // Reviewed equipment already represented in the catalogue/art profiles.
  // Heavy armour costs movement; two-handed weapons trade tempo for impact.
  // These are gameplay values, not rankings of peoples or historical armies.
  german_armoured_foot: { hp: 160, speed: 21, damage: 29, reach: 23, cooldown: 1.25, armor: .28 },
  england_housecarl: { hp: 150, speed: 22, damage: 36, reach: 24, cooldown: 1.4, armor: .16 },
  gaelic_gallowglass: { hp: 155, speed: 21, damage: 37, reach: 25, cooldown: 1.5, armor: .16 },
  rome_praetorian: { hp: 140, speed: 22, damage: 22, reach: 16, cooldown: 1, armor: .22 },
  parthian_cataphract: { hp: 230, speed: 31, damage: 28, reach: 35, cooldown: 1.35, armor: .28, chargeDamage: 58 },
  sasanian_aswaran: { hp: 225, speed: 33, damage: 29, reach: 34, cooldown: 1.35, armor: .26, chargeDamage: 56 },
  // Gameplay specializations of the shared lance/shield role, not historical
  // rankings of the orders: charge, endurance, and slower heavy blows.
  templar_knight: { hp: 210, speed: 38, damage: 28, reach: 32, cooldown: 1.3, armor: .2, chargeDamage: 64 },
  hospitaller_knight: { hp: 230, speed: 34, damage: 29, reach: 32, cooldown: 1.3, armor: .24, chargeDamage: 48 },
  teutonic_knight: { hp: 215, speed: 34, damage: 32, reach: 32, cooldown: 1.45, armor: .22, chargeDamage: 56 },
  norse_hird_swordsman: { role: 'sword', hp: 160, speed: 22, damage: 25, reach: 17, cooldown: .95, armor: .24, color: '#496c87' },
  norse_spearman: { role: 'pike', hp: 110, speed: 24, damage: 23, reach: 32, cooldown: 1.1, armor: .08, color: '#a17245' },
  norse_dane_axeman: { role: 'sword', hp: 140, speed: 23, damage: 43, reach: 24, cooldown: 1.55, armor: .16, color: '#805444' },
  norse_longbowman: { role: 'archer', hp: 80, speed: 25, damage: 21, reach: 195, cooldown: 1.9, armor: 0, color: '#586e60' },
  samurai: { name: 'Samuray', role: 'sword', hp: 130, speed: 24, damage: 24, reach: 18, cooldown: .95, armor: .2, color: '#9c392e' },
  janissary: { name: 'Yeniçeri', role: 'archer', hp: 85, speed: 21, damage: 36, reach: 195, cooldown: 2.8, projectile: 'bullet', color: '#44816e' },
  kipchak: { name: 'Maskeli Kıpçak', role: 'cavalry', hp: 145, speed: 43, damage: 16, reach: 170, cooldown: 1.5, ranged: true, skirmish: true, armor: .16, color: '#c1a166' },
  hussar: { name: 'Kanatlı Hussar', role: 'cavalry', hp: 210, speed: 38, damage: 29, reach: 36, cooldown: 1.35, chargeDamage: 68, armor: .28, color: '#ad4547' },
  timur: { name: 'Savaş Fili', role: 'elephant', hp: 850, speed: 19, damage: 42, reach: 35, cooldown: 1.8, chargeDamage: 55, armor: .12, splash: 32, color: '#5e8d8a' },
  spartan: { name: 'Spartalı Hoplit', role: 'pike', hp: 150, speed: 18, damage: 24, reach: 27, cooldown: 1.15, armor: .22, color: '#a24134' },
  mongol: { name: 'Moğol Atlısı', role: 'cavalry', hp: 120, speed: 48, damage: 14, reach: 165, cooldown: 1.3, ranged: true, skirmish: true, color: '#937852' },
  mamluk: { name: 'Memlük Süvarisi', role: 'cavalry', hp: 190, speed: 39, damage: 27, reach: 30, cooldown: 1.25, chargeDamage: 52, armor: .2, color: '#51836e' },
  viking: { name: 'Viking Savaşçısı', role: 'sword', hp: 145, speed: 24, damage: 31, reach: 17, cooldown: 1.15, armor: .18, color: '#877d63' },
  roman: { name: 'Roma Lejyoneri', role: 'sword', hp: 135, speed: 21, damage: 20, reach: 15, cooldown: .9, armor: .25, color: '#ae4d39' },
  persian: { name: 'Pers Ölümsüzü', role: 'pike', hp: 105, speed: 23, damage: 22, reach: 28, cooldown: 1, armor: .14, color: '#a584b0' },
  knight: { name: 'Avrupa Şövalyesi', role: 'cavalry', hp: 245, speed: 34, damage: 30, reach: 33, cooldown: 1.3, chargeDamage: 62, armor: .28, color: '#6d87a4' },
  varangian: { name: 'Varang Muhafızı', role: 'sword', hp: 170, speed: 20, damage: 38, reach: 22, cooldown: 1.45, armor: .16, color: '#79518d' },
  landsknecht: { name: 'Landsknecht', role: 'pike', hp: 95, speed: 22, damage: 25, reach: 39, cooldown: 1.2, color: '#c19b42' },
};
const PRESETS = {
  chariot: { role: 'cavalry', hp: 280, speed: 35, damage: 25, reach: 180, cooldown: 1.8, armor: .1, radius: 9, ranged: true, skirmish: true, chargeDamage: 0 },
  sword: { role: 'sword', hp: 120, speed: 24, damage: 23, reach: 17, cooldown: 1, armor: .1 },
  spear: { role: 'pike', hp: 110, speed: 21, damage: 23, reach: 30, cooldown: 1.2, armor: .1 },
  ranged: { role: 'archer', hp: 80, speed: 23, damage: 16, reach: 170, cooldown: 1.5 },
  cavalry: { role: 'cavalry', hp: 180, speed: 40, damage: 26, reach: 22, cooldown: 1.2, chargeDamage: 50, armor: .12 },
  elephant: { role: 'elephant', hp: 800, speed: 19, damage: 40, reach: 35, cooldown: 1.8, chargeDamage: 55, armor: .12, splash: 32 },
};
export function createHistoricalTypes(units) {
  const result = {};
  for (const unit of units) {
    if (!/^[a-z][a-z0-9_-]*$/.test(unit.id) || Object.hasOwn(result, unit.id)) throw new Error(`Geçersiz veya tekrarlanan birlik kimliği: ${unit.id}`);
    if (!Object.hasOwn(PRESETS, unit.kind)) throw new Error(`Bilinmeyen birlik türü: ${unit.kind}`);
    const cfg = { ...PRESETS[unit.kind] };
    const role = (unit.role || '').toLocaleLowerCase('tr');
    if (unit.kind === 'cavalry' && /okçu|archer/.test(role)) Object.assign(cfg, { ranged: true, skirmish: true, damage: 15, reach: 155, cooldown: 1.5, chargeDamage: 0 });
    if (unit.kind === 'ranged' && /tüfek|gun|musket/.test(role)) Object.assign(cfg, { projectile: 'bullet', damage: 34, cooldown: 2.8, reach: 190 });
    result[unit.id] = { ...cfg, color: unit.color || '#8d8066', ...TUNED_TYPES[unit.id], ...unit.combat, name: unit.name, faction: unit.civilization || unit.faction || 'Diğer' };
  }
  return result;
}
export const HISTORICAL_TYPES = createHistoricalTypes(catalogue);
export function groupCivilizations(types = HISTORICAL_TYPES) {
  const groups = new Map();
  for (const [id, cfg] of Object.entries(types)) {
    if (!groups.has(cfg.faction)) groups.set(cfg.faction, []);
    groups.get(cfg.faction).push(id);
  }
  return [...groups].map(([name, ids]) => ({ name, ids })).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}
export const CIVILIZATIONS = groupCivilizations();
export const HISTORICAL_STORAGE = 'marble-historical-armies-v1';
export const DEMO_ARMIES = [{ timur: 3, kipchak: 20, janissary: 25, samurai: 35 }, { spartan: 65, hussar: 18, roman: 30, landsknecht: 25 }];
export function restoreHistoricalArmies(saved) {
  let removed = 0, merged = 0;
  const cleaned = Array.isArray(saved) ? saved.map(army => {
    if (!army || typeof army !== 'object' || Array.isArray(army)) return army;
    const result = Object.create(null);
    for (const [id, count] of Object.entries(army)) {
      if (!Number.isSafeInteger(count) || count < 0) throw new Error('Birlik sayıları sıfır veya pozitif tam sayı olmalı.');
      if (Object.hasOwn(HISTORICAL_UNIT_REPLACEMENTS, id)) {
        const target = HISTORICAL_UNIT_REPLACEMENTS[id];
        result[target] = (result[target] || 0) + count;
        merged += count;
      } else if (RETIRED_HISTORICAL_IDS.includes(id)) removed += count;
      else result[id] = (result[id] || 0) + count;
    }
    return result;
  }) : saved;
  const notes = [];
  if (merged) notes.push(`Eski Osmanlı süvari kartlarındaki ${merged} asker Kapıkulu süvarilerinde birleştirildi.`);
  if (removed) notes.push(`Katalogdan çıkarılan birliklere ait ${removed} asker eski kayıttan kaldırıldı. Diğer birlikler korundu.`);
  return { armies: validateHistoricalArmies(cleaned, { allowEmpty: true }), note: notes.join(' ') };
}
export function validateHistoricalArmies(armies, { allowEmpty = false } = {}) {
  if (!Array.isArray(armies) || armies.length !== 2) throw new Error('İki ordu seçmelisin.');
  return armies.map(army => {
    if (!army || typeof army !== 'object' || Array.isArray(army)) throw new Error('Ordu planı okunamadı.');
    const result = {};
    for (const [id, count] of Object.entries(army)) {
      if (!Object.hasOwn(HISTORICAL_TYPES, id)) throw new Error(`Bilinmeyen birlik: ${id}`);
      if (!Number.isSafeInteger(count) || count < 0) throw new Error('Birlik sayıları sıfır veya pozitif tam sayı olmalı.');
      if (count) result[id] = count;
    }
    const total = Object.values(result).reduce((a, b) => a + b, 0);
    if (!Number.isSafeInteger(total) || (!allowEmpty && total === 0)) throw new Error('Her orduya en az bir birlik ekle.');
    return result;
  });
}
