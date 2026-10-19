import commanders from './historical-commanders.json' with { type: 'json' };

// Equal, fictional balance values: these are not ratings of historical leaders.
export const COMMANDER_BALANCE = Object.freeze({ role: 'cavalry', hp: 220, speed: 36, damage: 0, reach: 20, cooldown: 1.15, armor: .12 });
export const commanderType = id => `commander_${id}`;
export const COMMANDER_TYPES = Object.fromEntries(commanders.map(commander => [commanderType(commander.id), {
  ...COMMANDER_BALANCE, name: commander.name, commanderId: commander.id,
}]));
export function resolveCommanderIds(value) {
  return [0, 1].map(team => Array.isArray(value) && Object.hasOwn(COMMANDER_TYPES, commanderType(value[team])) ? value[team] : null);
}
