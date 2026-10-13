import {GAME_SOUND_STYLES,normalizeSoundStyle} from './game-sound-director.js';
import {SOUND_EVENTS,normalizeSoundOverrides} from './game-sound-settings.js';
import {VOICE_NAMES} from './sound-plan.js';
import {appendSoundOptions} from './sound-menu-options.js';
import './game-sound-panel.css';
export function savedSoundStyle(mode){try{return normalizeSoundStyle(localStorage.getItem('marble-sound-style-'+mode));}catch{return 'balanced';}}
export function savedSoundOverrides(mode){try{return normalizeSoundOverrides(mode,JSON.parse(localStorage.getItem('marble-sound-overrides-'+mode)));}catch{return {};}}
export function mountManualSoundControls({mode,element,overrides={},onOverrides,onPreview}){
  let choices=normalizeSoundOverrides(mode,overrides);
  const bulk=document.createElement('div');bulk.className='manual-sound-row sound-menu-bulk';
  const bulkLabel=document.createElement('label');bulkLabel.textContent='Tüm oyun efektleri';bulkLabel.htmlFor='all-game-sounds';
  const bulkSelect=document.createElement('select');bulkSelect.id=bulkLabel.htmlFor;
  const mixed=new Option('Olaylara göre farklı sesler','mixed');mixed.disabled=true;bulkSelect.add(mixed);
  for(const [value,name] of Object.entries({inherit:'Seçili ses düzeni',original:'Orijinal oyun sesleri',off:'Tüm efektleri kapat'}))bulkSelect.add(new Option(name,value));
  appendSoundOptions(bulkSelect,VOICE_NAMES);
  const bulkPreview=document.createElement('button');bulkPreview.type='button';bulkPreview.textContent='▶ Dinle';bulkPreview.setAttribute('aria-label','Seçili efekti dinle');
  const bulkStatus=document.createElement('p');bulkStatus.setAttribute('role','status');bulkStatus.className='sound-menu-status';
  bulk.append(bulkLabel,bulkSelect,bulkPreview);element.append(bulk,bulkStatus);
  const details=document.createElement('details');details.className='manual-sounds';
  const summary=document.createElement('summary');summary.textContent='Her olaya ayrı ses seç';
  const help=document.createElement('p');help.textContent='Her olay için farklı bir efekt seçebilirsin. “Düzeni kullan” hazır düzeni, “Orijinal ses” oyunun kendi sesini çalar. Bu seçimler müziği değiştirmez.';
  const status=document.createElement('p');status.setAttribute('role','status');
  details.append(summary,help);
  const groups=new Map();
  const selects=[];
  for(const [event,title] of Object.entries(SOUND_EVENTS[mode])){
    const row=document.createElement('div');row.className='manual-sound-row';
    const label=document.createElement('label');label.textContent=title;label.htmlFor='manual-sound-'+event;
    const select=document.createElement('select');select.id=label.htmlFor;select.dataset.soundEvent=event;
    for(const [value,name] of Object.entries({inherit:'Düzeni kullan',original:'Orijinal ses',off:'Kapalı'}))select.add(new Option(name,value));
    appendSoundOptions(select,VOICE_NAMES);
    select.value=choices[event]??'inherit';selects.push(select);
    select.onchange=()=>{if(select.value==='inherit')delete choices[event];else choices[event]=select.value;persist();};
    const preview=document.createElement('button');preview.type='button';preview.textContent='▶ Dinle';preview.setAttribute('aria-label',title+' sesini dinle');
    preview.onclick=async()=>{preview.disabled=true;try{const played=select.value!=='off'&&await onPreview(event,select.value);status.textContent=played===false?'Bu seçimde olay sesi kapalı veya orijinalinde ses yok.':'Ön dinleme';}catch(error){status.textContent=error.message==='Ön dinleme için Sesleri aç düğmesine bas.'?error.message:'Ses başlatılamadı. Tekrar deneyebilirsin.';}finally{preview.disabled=false;}};
    const groupName=['win','won','timeout','lost','finish'].includes(event)?'Bitiş ve sonuç':['multiply','bonus','pickup','heal','wave'].includes(event)?'Bonus ve ilerleme':'Çarpışma ve hareket';
    if(!groups.has(groupName)){const group=document.createElement('fieldset');group.className='sound-event-group';const legend=document.createElement('legend');legend.textContent=groupName;group.append(legend);groups.set(groupName,group);details.append(group);}
    row.append(label,select,preview);groups.get(groupName).append(row);
  }
  function syncBulk(){const values=Object.keys(SOUND_EVENTS[mode]).map(event=>choices[event]??'inherit');bulkSelect.value=values.every(value=>value===values[0])?values[0]:'mixed';bulkPreview.disabled=['mixed','off'].includes(bulkSelect.value);}
  function persist(){syncBulk();try{localStorage.setItem('marble-sound-overrides-'+mode,JSON.stringify(choices));}catch{}onOverrides({...choices});}
  bulkSelect.onchange=()=>{const value=bulkSelect.value;choices=value==='inherit'?{}:Object.fromEntries(Object.keys(SOUND_EVENTS[mode]).map(event=>[event,value]));for(const select of selects)select.value=value;persist();bulkStatus.textContent=value==='off'?'Oyun efektleri kapalı.':'Seçim tüm olaylara uygulandı. Aşağıdan ayrı ayrı değiştirebilirsin.';};
  bulkPreview.onclick=async()=>{bulkPreview.disabled=true;try{const played=await onPreview(Object.keys(SOUND_EVENTS[mode])[0],bulkSelect.value);bulkStatus.textContent=played===false?'Bu seçimde olay sesi kapalı veya orijinalinde ses yok.':'Ön dinleme';}catch(error){bulkStatus.textContent=error.message==='Ön dinleme için Sesleri aç düğmesine bas.'?error.message:'Ses başlatılamadı. Tekrar deneyebilirsin.';}finally{syncBulk();}};
  syncBulk();
  details.append(status);element.append(details);
  return {clear(){choices={};for(const select of selects)select.value='inherit';persist();},useOriginal(){choices=Object.fromEntries(Object.keys(SOUND_EVENTS[mode]).map(event=>[event,'original']));for(const select of selects)select.value='original';persist();}};
}
export function mountGameSoundPanel({mode,style,onChange,reference=false,overrides={},onOverrides,onPreview}){
  const panel=document.createElement('section');panel.className='game-sound-director';
  panel.setAttribute('aria-label','Ses menüsü');const heading=document.createElement('h2');heading.textContent='Ses menüsü';panel.append(heading);
  const label=document.createElement('label');label.textContent='Hazır ses düzeni';
  const select=document.createElement('select');select.id='game-sound-style';select.setAttribute('aria-label','Hazır ses düzeni');
  for(const [id,name] of Object.entries(GAME_SOUND_STYLES))select.add(new Option(name,id));
  if(reference)select.add(new Option('Videodan seçtiğim sesler','reference'));
  select.value=style;label.append(select);
  const detail=document.createElement('p');detail.textContent='Orijinal oyun seslerini koruyabilir, yalnız istediğin olaylara efekt seçebilirsin. Seçimler video çıktısına da uygulanır. Ses düğmesiyle açılır.';
  select.onchange=()=>{try{localStorage.setItem('marble-sound-style-'+mode,select.value);}catch{}onChange(select.value);};
  panel.append(label,detail);
  if(onOverrides){
    const manual=mountManualSoundControls({mode,element:panel,overrides,onOverrides,onPreview});
    const original=document.createElement('button');original.type='button';original.textContent='Orijinal seslerle başla';
    original.onclick=()=>{select.value='original';select.onchange();manual.clear();};panel.insertBefore(original,panel.querySelector('details'));
  }
  document.getElementById('status').before(panel);return panel;
}
