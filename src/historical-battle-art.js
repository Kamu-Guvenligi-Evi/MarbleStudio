import { HISTORICAL_TYPES } from './historical-combat.js';
import { drawWarElephant } from './historical-elephant-art.js';
import { drawCarthaginianElephant } from './carthaginian-elephant-art.js';
import { HISTORICAL_ART_PROFILES } from './historical-art-profiles.js';
import { drawHistoricalWarrior } from './historical-warrior-art.js';
import { drawHistoricalChariot } from './historical-chariot-art.js';
import { MYTHOLOGICAL_BY_ID } from './mythological-units.js';
import { drawMythologicalCreature } from './mythological-art.js';

export function historicalSprite(type, team, frame, action, variant) {
  const cfg = HISTORICAL_TYPES[type];
  const canvas = document.createElement('canvas');
  canvas.width = 240; canvas.height = 228;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  g.setTransform(3, 0, 0, 3, 90, 183);
  if (MYTHOLOGICAL_BY_ID[type]) drawMythologicalCreature(g, type, team, frame, action);
  else if (type === 'carthage_war_elephant') drawCarthaginianElephant(g, team, frame, action);
  else if (cfg.role === 'elephant') drawWarElephant(g, cfg, team, frame, action);
  else {
    const profile = HISTORICAL_ART_PROFILES[type];
    if (!profile) throw new Error(`Historical art profile missing: ${type}`);
    if (profile.chariot) drawHistoricalChariot(g, profile, team, frame, action, variant);
    else drawHistoricalWarrior(g, profile, cfg, team, frame, action, variant);
  }
  return canvas;
}
