import {MERGE_IMAGES} from './merge-image-manifest.js';
const images=new Map(),pending=new Map();
export const mergeImageInfo=(theme,level)=>MERGE_IMAGES[theme.stages[level]?.imageTheme??theme.id]?.[theme.stages[level]?.imageLevel??level];
export const mergeImage=(theme,level)=>images.get(mergeImageInfo(theme,level)?.src);
export function prepareMergeImages(theme){
 return Promise.all(theme.stages.map((_,i)=>mergeImageInfo(theme,i)).filter(Boolean).map(({src})=>{
  if(!pending.has(src))pending.set(src,new Promise(resolve=>{
   const img=new Image();img.onload=()=>{images.set(src,img);resolve(true);};img.onerror=()=>{pending.delete(src);resolve(false);};img.src=src;
  }));return pending.get(src);
 }));
}
