import {prepareMergeImages} from './merge-images.js';
import {MergeEvolution} from './merge-evolution.js';
import {renderMerge} from './merge-evolution-renderer.js';
import {createMergeSound} from './merge-sound.js';
let game,job,canvas,ctx,effects;
export async function beginMerge(config){job=config;game=new MergeEvolution(config.recipe);await prepareMergeImages(game.theme);effects=[];canvas??=document.createElement('canvas');canvas.width=1080;canvas.height=1920;ctx=canvas.getContext('2d');const direct=createMergeSound(game.theme.stages.length);game.onEvent=e=>{if(!game.settings.sound)return;const cue=direct(e,(job.intro??0)+e.time/game.settings.speed/job.speed);if(cue)effects.push(cue);};}
export function mergeFrame(elapsed){const time=Math.min(Math.max(0,elapsed-(job.intro??0))*job.speed,job.analysis.simulationSeconds)*game.settings.speed;const target=Math.ceil(time*120);while(game.ticks<target&&game.state==='running')game.step();renderMerge(ctx,game,{channel:job.channel});return canvas;}
export const mergeAudio=()=>({effects,leaders:[]});
export const mergeResult=()=>({complete:game.state==='finished',winner:null,balls:game.balls.length,outcome:game.outcome});
