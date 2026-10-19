import { makeGround } from './crown-battle-ground.js';

// Terrain is baked at the viewport aspect ratio, without enlarging a portrait crop.
export function makePCScene(terrain, width, height, pixelRatio, seed, preset) {
  return makeGround(seed, preset === 'flank' ? 'steppe' : 'classic', width, height, pixelRatio);
}

export function makeContactShadow() {
  const canvas = document.createElement('canvas'); canvas.width = 96; canvas.height = 32;
  // Atlas poses are baked/read on the CPU; a GPU-backed shadow would force a
  // graphics synchronization for every new pose, even with CPU sprite sources.
  const g = canvas.getContext('2d', { willReadFrequently: true }); g.scale(3, 1);
  const shade = g.createRadialGradient(16, 16, 2, 16, 16, 16);
  shade.addColorStop(0, '#101d23a0'); shade.addColorStop(.4, '#101d2355'); shade.addColorStop(1, '#101d2300');
  g.fillStyle = shade; g.fillRect(0, 0, 32, 32);
  return canvas;
}
