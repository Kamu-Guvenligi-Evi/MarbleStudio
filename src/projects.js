import {SPIRAL_VARIANTS} from './spiral-variants.js';
import {TERRITORY_SHAPES} from './territory.js';
import { normalizeSpiralTheme } from './spiral-themes.js';
import { normalizeSequence } from './section-settings.js';
import { normalizeBallImages } from './ball-images.js';
import { normalizeNames, normalizePresentation } from './presentation.js';
export const DRAFT_KEY = 'marble-studio-draft-v2';
export const LIBRARY_KEY = 'marble-studio-library-v1';
export const clone = value => structuredClone(value);

export function normalizeProject(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Parkur dosyası geçersiz.');
  const name = typeof raw.name === 'string' ? raw.name.trim() : 'Parkurum';
  if(!name || name.length > 80) throw new Error('Parkur adı 1–80 karakter olmalı.');
  const seed = raw.seed ?? 2048, count = raw.count ?? 12;
  if(!Number.isInteger(seed)||seed<1||seed>999999) throw new Error('Yarış düzeni numarası geçersiz.');
  if(!Number.isInteger(count)||count>20||(raw.mode==='spiral'?count!==1&&(count<6||count%2):count<6||count%2)) throw new Error('Top sayısı geçersiz.');
  if(raw.sound !== undefined && typeof raw.sound !== 'boolean' || raw.trails !== undefined && typeof raw.trails !== 'boolean') throw new Error('Görüntü veya ses ayarı geçersiz.');
  if(raw.mode!==undefined&&!['track','arena','spiral'].includes(raw.mode))throw new Error('Oyun modu geçersiz.');
  if(raw.variant!==undefined&&!Object.hasOwn(SPIRAL_VARIANTS,raw.variant))throw new Error('Spiral davranışı geçersiz.');
  if(raw.energy!==undefined&&![.85,1,1.15].includes(raw.energy))throw new Error('Arena hareket seviyesi geçersiz.');
  if(raw.arenaGame!==undefined&&!['links','territory'].includes(raw.arenaGame))throw new Error('Arena oyunu geçersiz.');
  if(raw.arenaShape!==undefined&&!Object.hasOwn(TERRITORY_SHAPES,raw.arenaShape))throw new Error('Arena şekli geçersiz.');
  if(raw.territoryDuration!==undefined&&![30,45,60].includes(raw.territoryDuration))throw new Error('Alan savaşı süresi geçersiz.');
  return {...(raw.mode==='arena'?{arenaGame:raw.arenaGame??'links',arenaShape:raw.arenaShape??'triangle',territoryDuration:raw.territoryDuration??45}:{}),variant:raw.variant??'classic',energy:raw.energy??1,...(['arena','spiral'].includes(raw.mode)?{mode:raw.mode}:{}),spiralTheme:normalizeSpiralTheme(raw.spiralTheme),name,seed,count,sound:raw.sound??false,visualStyle:'neon',trails:raw.trails??true,sequence:normalizeSequence(raw.sequence),ballImages:normalizeBallImages(raw.ballImages),ballNames:normalizeNames(raw.ballNames),presentation:normalizePresentation(raw.presentation)};
}
export function serializeProject(project) {
  return JSON.stringify({format:'marble-studio-course',version:2,project:normalizeProject(project)},null,2);
}
export function parseProject(text) {
  if(typeof text !== 'string'||text.length>1500000)throw new Error('Dosya çok büyük. En fazla 1,5 MB yüklenebilir.');
  let data;try{data=JSON.parse(text);}catch{throw new Error('Dosya okunamadı. Geçerli bir parkur JSON dosyası seç.');}
  if(data?.format!=='marble-studio-course'||data?.version!==2)throw new Error('Bu dosya desteklenen bir Marble Studio parkuru değil.');
  return normalizeProject(data.project);
}
export function loadDraft(storage = localStorage) {
  try {
    const v2=storage.getItem(DRAFT_KEY);
    if(v2)return normalizeProject(JSON.parse(v2));
  } catch { /* Preserve the old draft as a migration fallback. */ }
  try {
    const sequence=JSON.parse(storage.getItem('marble-studio-course-v1'));
    if(Array.isArray(sequence))return normalizeProject({name:'Parkurum',sequence});
  } catch { }
  return null;
}
export function saveDraft(project, storage = localStorage) {
  try{storage.setItem(DRAFT_KEY,JSON.stringify(normalizeProject(project)));return true;}catch{return false;}
}
export function readProjects(storage = localStorage) {
  const raw=storage.getItem(LIBRARY_KEY);if(!raw)return [];
  let entries;try{entries=JSON.parse(raw);}catch{throw new Error('Kayıt listesi okunamadı. Mevcut veriye dokunulmadı.');}
  if(!Array.isArray(entries)||entries.length>100)throw new Error('Kayıt listesi geçersiz.');
  return entries.map(entry=>{
    if(typeof entry?.id!=='string'||!entry.id||typeof entry.updatedAt!=='string')throw new Error('Bir parkur kaydı okunamadı.');
    return {id:entry.id,updatedAt:entry.updatedAt,project:normalizeProject(entry.project)};
  });
}
export function writeProjects(entries, storage = localStorage) {
  if(entries.length>100)throw new Error('En fazla 100 parkur saklanabilir. Önce bir parkuru yedekleyip sil.');
  try{storage.setItem(LIBRARY_KEY,JSON.stringify(entries));}catch{throw new Error('Tarayıcı kaydı dolu veya kapalı. Yedek indir ile dosyaya kaydet.');}
}
export function downloadProject(project) {
  const name=project.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').trim()||'parkurum';
  const url=URL.createObjectURL(new Blob([serializeProject(project)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=`${name}.marble.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}

export function createProjectLibrary({getProject,onLoad,onNameChange,notify}) {
  const $=s=>document.querySelector(s);
  let activeId=null,trash=null;
  const error=message=>{$('#projects-message').textContent=message;};
  function render() {
    const list=$('#saved-projects');list.replaceChildren();
    try {
      const entries=readProjects().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
      if(!entries.length){const empty=document.createElement('p');empty.className='saved-empty';empty.textContent='Henüz kayıt yok. Yukarıdan isim vererek ilk parkurunu kaydet.';list.append(empty);}
      for(const entry of entries) {
        const row=document.createElement('div');row.className='saved-project';
        const info=document.createElement('div'),title=document.createElement('b'),details=document.createElement('small');
        title.textContent=entry.project.name;details.textContent=`${entry.project.sequence.length} bölüm · ${entry.project.count} top · ${new Date(entry.updatedAt).toLocaleDateString('tr-TR')}`;
        info.append(title,details);row.append(info);
        const actions=document.createElement('div');actions.className='saved-actions';
        for(const [label,action] of [['Aç','open'],['İndir','export'],['Sil','delete']]) {
          const button=document.createElement('button');button.textContent=label;button.className='button secondary';button.dataset.projectAction=action;button.dataset.id=entry.id;
          button.setAttribute('aria-label',`${entry.project.name} — ${label}`);actions.append(button);
        }
        row.append(actions);list.append(row);
      }
    }catch(e){error(e.message);}
    $('#undo-project-delete').hidden=!trash;
  }
  function open() {$('#project-name').value=getProject().name;error('');render();$('#projects-dialog').showModal();}
  $('#open-projects').onclick=open;
  $('#save-project').onclick=()=>{
    try {
      const project=normalizeProject({...getProject(),name:$('#project-name').value});
      const entries=readProjects(),current=entries.find(e=>e.id===activeId&&e.project.name===project.name);
      if(entries.some(e=>e.project.name.toLocaleLowerCase('tr')===project.name.toLocaleLowerCase('tr')&&e!==current))throw new Error('Bu adla kayıt var. Başka bir ad seç veya kaydı açıp güncelle.');
      const entry={id:current?.id??crypto.randomUUID(),updatedAt:new Date().toISOString(),project};
      const next=current?entries.map(e=>e.id===current.id?entry:e):[entry,...entries];
      writeProjects(next);activeId=entry.id;onNameChange(project.name);render();error('✓ Parkurun kaydedildi.');notify('İsimli parkur kaydedildi.');
    }catch(e){error(e.message);}
  };
  $('#export-current').onclick=()=>{try{downloadProject(normalizeProject({...getProject(),name:$('#project-name').value}));error('Yedek dosyası indirildi.');}catch(e){error(e.message);}};
  $('#import-project').onclick=()=>$('#project-file').click();
  $('#project-file').onchange=async()=>{
    const input=$('#project-file'),file=input.files[0];if(!file)return;
    try {
      if(file.size>1500000)throw new Error('Dosya çok büyük. En fazla 1,5 MB yüklenebilir.');
      const project=parseProject(await file.text()),entries=readProjects();
      const base=project.name;let suffix=2;
      while(entries.some(e=>e.project.name.toLocaleLowerCase('tr')===project.name.toLocaleLowerCase('tr')))project.name=`${base.slice(0,68)} (${suffix++})`;
      writeProjects([{id:crypto.randomUUID(),updatedAt:new Date().toISOString(),project},...entries]);
      render();error('✓ Parkur içe aktarıldı. Aç düğmesiyle kullanabilirsin.');
    }catch(e){error(e.message);}finally{input.value='';}
  };
  $('#saved-projects').onclick=e=>{
    const button=e.target.closest('[data-project-action]');if(!button)return;
    try {
      const entries=readProjects(),entry=entries.find(p=>p.id===button.dataset.id);if(!entry)return;
      if(button.dataset.projectAction==='open'){onLoad(clone(entry.project));activeId=entry.id;$('#projects-dialog').close();notify(`${entry.project.name} açıldı.`);}
      if(button.dataset.projectAction==='export')downloadProject(entry.project);
      if(button.dataset.projectAction==='delete'){
        writeProjects(entries.filter(p=>p.id!==entry.id));trash=entry;if(activeId===entry.id)activeId=null;render();error('Kayıt silindi. Geri al ile geri getirebilirsin.');
      }
    }catch(err){error(err.message);}
  };
  $('#undo-project-delete').onclick=()=>{
    if(!trash)return;
    try{const entries=readProjects();if(entries.some(p=>p.id===trash.id||p.project.name===trash.project.name))throw new Error('Bu adla başka bir kayıt var.');writeProjects([trash,...entries]);trash=null;render();error('Kayıt geri getirildi.');}catch(e){error(e.message);}
  };
  return {open};
}
