import {MEME_EFFECTS} from './meme-catalog.js';
import {isSoftSound} from './soft-audio.js';

// Keep saved sound IDs unchanged while separating spoken clips from effects.
export function appendSoundOptions(select,names){
  for(const [label,kind] of [['Yumuşak notalar ve yükseliş','soft'],['Ses efektleri ve müzikal sesler','effect'],['Konuşma ve tepki sesleri','speech']]){
    const group=document.createElement('optgroup');group.label=label;
    for(const [id,name] of Object.entries(names)){
      const spoken=MEME_EFFECTS[id]?.speech===true||['roblox-oof','cartoon-gulp'].includes(id);
      if((isSoftSound(id)?'soft':spoken?'speech':'effect')===kind)group.append(new Option(name,id));
    }
    if(group.children.length)select.append(group);
  }
}
