import { VISUAL_SCALES, FALLBACK_SCALES } from './middle-earth-visual-profiles.js';
import { stylizedMiddleEarthSprite } from './middle-earth-stylized-base.js';
// Legacy readiness/version API retained. Battle poses now come straight from
// paths, like historical troops, without a WebP resize round trip.
// SpriteLibrary caches each shared pose, never draw paths per soldier.
export const middleEarthArtRevision = 1;
export const middleEarthArtReady = Promise.resolve(Object.keys(VISUAL_SCALES));
export function paintedArtVersion(type) { return type in VISUAL_SCALES ? 1 : 0; }
export function paintedMiddleEarthSprite(type, team, frame, action) {
 if (!(type in VISUAL_SCALES)) return null;
 const density = VISUAL_SCALES[type] > 1.5 ? 6 : 3;
 return stylizedMiddleEarthSprite(type, team, frame, action, {density, scale:FALLBACK_SCALES[type] || 1});
}
