// Army-building slots, separate from equipment points and actual model counts.
// Explicit elephant identities: giants also use the elephant combat role.
export const ELEPHANT_CAPACITY = 5;
export const CHARIOT_CAPACITY = 3;
const CHARIOTS = new Set(['egypt_new_chariot', 'qin_war_chariot']);
const ELEPHANTS = new Set(['timur', 'me_mumakil', 'carthage_war_elephant']);

export function unitCapacity(type) {
  return ELEPHANTS.has(type) ? ELEPHANT_CAPACITY : CHARIOTS.has(type) ? CHARIOT_CAPACITY : 1;
}

export function armyCapacity(roster) {
  return Object.entries(roster).reduce((sum, [type, count]) => sum + count * unitCapacity(type), 0);
}
