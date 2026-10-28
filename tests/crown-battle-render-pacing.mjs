import assert from 'node:assert/strict';
import {BattleRenderer} from '../src/crown-battle-renderer.js';

// Exercise the real invalidation gate with a costly draw and a controlled clock.
const originalPerformance = globalThis.performance;
let clock = 0, draws = 0;
globalThis.performance = {now: () => clock};
try {
  const renderer = Object.assign(Object.create(BattleRenderer.prototype), {
    view: {x: 300, y: 480, zoom: 1}, canvas: {width: 1100, height: 500},
    battle: {units: {length: 10000}, time: 0, winner: null},
    sprites: {}, revision: 0,
    render() { draws++; clock += 60; },
  });
  const draw = running => renderer.renderIfNeeded({running});
  assert.equal(draw(true), true);
  renderer.battle.time += .05;
  clock += 10;
  assert.equal(draw(true), false, 'slow draws leave time for soldier updates');
  let replays=0;
  renderer.spriteBatch={animate(now){assert.equal(now,clock);replays++;return true;}};
  assert.equal(draw(true),true,'GPU intermediate frames fill the interval without a full scene refresh');
  assert.equal(draws,1);assert.equal(replays,1);
  clock = 150;
  assert.equal(draw(true), true, 'crowd animation resumes after the bounded interval');
  renderer.view.zoom = 2;
  assert.equal(draw(true), true, 'camera changes render immediately');
  renderer.invalidate();
  assert.equal(draw(true), true, 'selection and other explicit invalidations render immediately');
  renderer.canvas.width++;
  assert.equal(draw(true), true, 'resizing renders immediately');
  assert.equal(draw(false), true, 'pause renders immediately');
  assert.equal(draw(false), false, 'unchanged paused scenes stay cached');
  assert.equal(replays,1,'pause never replays GPU movement');
  renderer.battle.units.length = 320;
  assert.equal(draw(true), true);
  renderer.battle.time += 1/30;
  assert.equal(draw(true), true, 'small battles do not inherit crowd pacing');
  assert.equal(draws, 8);
  console.log('PASS adaptive crowd pacing, camera/selection/resize/pause invalidation and small battles');
} finally {
  globalThis.performance = originalPerformance;
}
