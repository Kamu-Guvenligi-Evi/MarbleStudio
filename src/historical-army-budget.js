import { HISTORICAL_TYPES } from './historical-combat.js';
import { ARMY_PRESETS } from './historical-army-presets.js';

// Fictional purchase points, shared by every civilization. This is an equipment
// estimate, not a win probability or a historical ranking. No commander bonuses.
export function equipmentPoints(cfg) {
  const endurance = cfg.hp / (1 - (cfg.armor || 0));
  const ranged = cfg.role === 'archer' || cfg.ranged;
  const tempo = cfg.damage / cfg.cooldown;
  const mobility = 1 + Math.max(0, cfg.speed - 24) / 100;
  const reach = ranged ? 1 + Math.min(300, cfg.reach) / 400 : 1 + Math.min(50, cfg.reach) / 250;
  const area = cfg.splash ? 1 + Math.min(64, cfg.splash) / 32 : 1;
  return Math.max(1, Math.round(.18 * Math.sqrt(endurance * tempo * area) * mobility * reach + (cfg.chargeDamage || 0) / 18));
}

export const UNIT_POINTS = Object.freeze(Object.fromEntries(Object.entries(HISTORICAL_TYPES)
  .map(([id, cfg]) => [id, equipmentPoints(cfg)])));
export const MAX_ARMY_BUDGET = 100000;

export function armyPoints(roster) {
  let total = 0;
  for (const [id, count] of Object.entries(roster)) {
    if (!Object.hasOwn(UNIT_POINTS, id) || !Number.isSafeInteger(count) || count < 0) throw new Error('Ordu puanı için geçerli birlik ve adet gerekli.');
    total += UNIT_POINTS[id] * count;
  }
  if (!Number.isSafeInteger(total)) throw new Error('Ordu puanı çok büyük.');
  return total;
}

export function minimumArmyBudget(commanderId) {
  const preset = ARMY_PRESETS[commanderId];
  if (!preset) throw new Error('Bu komutan için hazır ordu bulunamadı.');
  return armyPoints(preset.units);
}

export function createBudgetArmy(commanderId, budget) {
  const minimum = minimumArmyBudget(commanderId);
  if (!Number.isSafeInteger(budget) || budget < minimum || budget > MAX_ARMY_BUDGET)
    throw new Error(`Bütçe ${minimum}–${MAX_ARMY_BUDGET} arasında tam sayı olmalı.`);
  const weights = ARMY_PRESETS[commanderId].units;
  // Whole compositions first: bounded work even for large budgets. Then add
  // proportionally by highest quotient; never omit the doctrine's core roles.
  const cycles = Math.floor(budget / minimum);
  const rows = Object.entries(weights).map(([id, weight]) => ({ id, weight, count: weight * cycles }));
  let spent = cycles * minimum;
  while (true) {
    let next = rows[0];
    for (const row of rows) if (row.weight / (row.count + .5) > next.weight / (next.count + .5)) next = row;
    if (spent + UNIT_POINTS[next.id] > budget) break;
    next.count++; spent += UNIT_POINTS[next.id];
  }
  return Object.fromEntries(rows.map(({ id, count }) => [id, count]));
}
