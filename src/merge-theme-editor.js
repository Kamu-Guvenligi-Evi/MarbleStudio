import {MERGE_THEMES,getMergeTheme} from './merge-themes.js';
import {MERGE_IMAGES} from './merge-image-manifest.js';

export function normalizeThemeEdits(raw){
 const edits={};
 for(const theme of MERGE_THEMES){
  const rows=raw?.[theme.id];
  if(!Array.isArray(rows)||rows.length<2||rows.length>6)continue;
  const valid=rows.every(r=>r&&MERGE_THEMES.some(t=>t.id===r.theme&&Number.isInteger(r.level)&&t.stages[r.level]));
  if(valid)edits[theme.id]=rows.map(r=>({theme:r.theme,level:r.level,name:String(r.name??getMergeTheme(r.theme).stages[r.level].name).trim().slice(0,40)||getMergeTheme(r.theme).stages[r.level].name}));
 }
 return edits;
}

export function editedMergeTheme(settings){
 const theme=getMergeTheme(settings.theme),rows=settings.themeEdits?.[theme.id];
 if(!rows)return theme;
 return {...theme,stages:rows.map(r=>({...getMergeTheme(r.theme).stages[r.level],name:r.name,imageTheme:r.theme,imageLevel:r.level}))};
}

export function mountMergeEditor({root,settings,onApply}){
 let draft=[],active='';
 const note=document.createElement('p');note.className='muted';note.textContent='2–6 basamak seç. Görseller mevcut kütüphaneden alınır. Değişiklikler bu tarayıcıda saklanır ve videoya aktarılır.';
 const list=document.createElement('div');list.id='theme-editor-rows';
 const controls=document.createElement('div');controls.className='editor-actions';
 const add=button('Basamak ekle',()=>{const theme=getMergeTheme(settings.theme);draft.push({theme:theme.id,level:0,name:theme.stages[0].name});draw();});add.id='editor-add';
 const apply=button('Uygula',()=>{settings.themeEdits={...settings.themeEdits,[settings.theme]:draft.map(r=>({...r}))};onApply();});apply.id='editor-apply';apply.className='primary';
 const reset=button('Orijinale dön',()=>{delete settings.themeEdits[settings.theme];active='';onApply();});reset.id='editor-reset';
 controls.append(add,apply,reset);root.append(note,list,controls);
 function button(text,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=action;return b;}
 function draw(){
  add.disabled=draft.length>=6;
  list.replaceChildren(...draft.map((r,index)=>{
   const row=document.createElement('div');row.className='editor-row';
   const label=document.createElement('label');label.textContent=`${index+1}. basamak`;
   const select=document.createElement('select');select.setAttribute('aria-label',`${index+1}. basamak görseli`);
   for(const t of MERGE_THEMES){const group=document.createElement('optgroup');group.label=t.name;for(let level=0;level<t.stages.length;level++){const o=document.createElement('option');o.value=t.id+':'+level;o.textContent=t.stages[level].name;group.append(o);}select.append(group);}
   select.value=r.theme+':'+r.level;
   select.onchange=()=>{const [theme,level]=select.value.split(':');draft[index]={theme,level:Number(level),name:getMergeTheme(theme).stages[Number(level)].name};draw();};
   const name=document.createElement('input');name.value=r.name;name.maxLength=40;name.setAttribute('aria-label',`${index+1}. basamak adı`);name.oninput=()=>{r.name=name.value;};
   const preview=document.createElement('img');preview.className='editor-preview';preview.src=MERGE_IMAGES[r.theme]?.[r.level]?.src??'';preview.alt=r.name;
   label.append(preview,select,name);
   const actions=document.createElement('div');actions.className='editor-actions';
   const up=button('↑',()=>{[draft[index-1],draft[index]]=[draft[index],draft[index-1]];draw();});up.disabled=index===0;up.setAttribute('aria-label',`${index+1}. basamağı yukarı taşı`);
   const down=button('↓',()=>{[draft[index+1],draft[index]]=[draft[index],draft[index+1]];draw();});down.disabled=index===draft.length-1;down.setAttribute('aria-label',`${index+1}. basamağı aşağı taşı`);
   const remove=button('Kaldır',()=>{draft.splice(index,1);draw();});remove.disabled=draft.length<=2;
   actions.append(up,down,remove);row.append(label,actions);return row;
  }));
 }
 return {refresh(){active=settings.theme;draft=(settings.themeEdits?.[active]??getMergeTheme(active).stages.map((s,level)=>({theme:active,level,name:s.name}))).map(r=>({...r}));draw();}};
}
