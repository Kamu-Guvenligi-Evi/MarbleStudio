import { paintedMiddleEarthSprite } from './middle-earth-painted-art.js';
export function middleEarthSprite(type, team, frame, action) {
 const sprite = paintedMiddleEarthSprite(type, team, frame, action);
 if (!sprite) throw new Error('Unknown Middle-earth unit: '+type);
 return sprite;
}
