import assert from 'node:assert/strict';
import {canvasLayer} from '../src/canvas-layer.js';
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({scale(){}})})};
try{
  const preview={canvas:{width:540}},exported={canvas:{width:1080}};
  let paints=0;const paint=()=>paints++;
  const a=canvasLayer(preview,'theme-a',540,960,paint);
  assert.equal(canvasLayer(preview,'theme-a',540,960,paint),a);assert.equal(paints,1);
  assert.notEqual(canvasLayer(preview,'theme-b',540,960,paint),a);assert.equal(paints,2);
  const b=canvasLayer(exported,'theme-b',540,960,paint);assert.equal(b.width,1080);assert.equal(b.height,1920);
  preview.canvas.width=720;
  const c=canvasLayer(preview,'theme-b',540,960,paint);assert.equal(c.width,720);assert.equal(c.height,1280);assert.equal(paints,4);
  const cropped=canvasLayer(preview,'mascots',540,160,paint);assert.equal(cropped.height,213);
  console.log('PASS static layer reuse, theme invalidation, independent export resolution and resize');
}finally{delete globalThis.document;}
