import commanders from './historical-commanders.json' with { type: 'json' };

// Explicit state/period associations, never inferred from a name or ethnicity.
const leaders = new Map(commanders.map(leader => [leader.id, leader]));

export const armyIdentity = unit => unit.armyId ?? `army-${unit.team}`;

// Partition once per decision. Allies share enemies, never doctrine membership.
export function tacticArmies(teams) {
  const armies = new Map();
  for (const units of teams) for (const unit of units) {
    const id = armyIdentity(unit);
    if (!armies.has(id)) armies.set(id, { id, team: unit.team, units: [] });
    armies.get(id).units.push(unit);
  }
  return armies.values();
}

export function activeCommander(battle, team, armyId) {
  const unit = armyId !== undefined && battle.armyCommanders
    ? battle.armyCommanders.get(armyId) : battle.commanders?.[team];
  return unit && unit.team === team && unit.hp > 0 && !unit.removed
    && (armyId === undefined || armyIdentity(unit) === armyId)
    && leaders.has(unit.commanderId) && unit.type === `commander_${unit.commanderId}` ? unit : null;
}

export function commanderSupportsDoctrine(battle, team, doctrineId, armyId) {
  const unit = activeCommander(battle, team, armyId);
  return !!unit && !!leaders.get(unit.commanderId).doctrineIds?.includes(doctrineId);
}
