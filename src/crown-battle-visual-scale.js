import { UNIT_TYPES } from './crown-battle.js';
// Presentation only: IDs, army saves and combat stats retain their existing meaning.
export const visualScaleOf = unit => UNIT_TYPES[unit.type]?.visualScale || 1;
