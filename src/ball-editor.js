import { COLORS, NAMES } from './physics.js';
import {prepareBallImage} from './ball-images.js';
import {createImageCatalog} from './image-catalog.js';
export function createBallEditor({getImages,getNames,getCount,onChange,onNamesChange,onRosterChange,notify}) {
  const dialog=document.querySelector('#balls-dialog'),list=document.querySelector('#ball-image-list'),input=document.querySelector('#ball-image-file');
  let selected=null,busy=false;
  const catalog=createImageCatalog({getImages,getNames,getCount,onRosterChange,onApplied:render,notify});
  document.querySelector('#open-catalog').onclick=()=>catalog.open();
  function render(){
    list.replaceChildren();
    for(let i=0;i<getCount();i++) {
      const row=document.createElement('div');row.className='ball-image-row';
      const portrait=document.createElement('span');portrait.className='ball-portrait';portrait.style.background=COLORS[i];
      const src=getImages()[i];
      if(src){const img=document.createElement('img');img.src=src;img.alt='';portrait.append(img);}else portrait.textContent=i+1;
      const name=document.createElement('input');name.className='ball-name-input';name.type='text';name.maxLength=24;name.placeholder=NAMES[i];name.value=getNames()[i]??'';name.dataset.name=i;name.setAttribute('aria-label',`${i+1}. topun ismi`);name.disabled=busy;
      const upload=document.createElement('button');upload.className='button secondary';upload.textContent=src?'Değiştir':'Görsel ekle';upload.dataset.upload=i;upload.disabled=busy;
      const library=document.createElement('button');library.className='button secondary';library.textContent='Kütüphane';library.dataset.library=i;library.disabled=busy;
      const remove=document.createElement('button');remove.className='button subtle';remove.textContent='Kaldır';remove.dataset.remove=i;remove.disabled=!src||busy;
      row.append(portrait,name,library,upload,remove);list.append(row);
    }
  }
  document.querySelector('#open-balls').onclick=()=>{render();dialog.showModal();};
  list.onchange=e=>{const field=e.target.closest('[data-name]');if(!field)return;
    try{const next=[...getNames()];next[Number(field.dataset.name)]=field.value.trim()||null;onNamesChange(next);field.value=next[Number(field.dataset.name)]??'';}
    catch(err){notify(err.message);render();}
  };
  list.onclick=e=>{const b=e.target.closest('button');if(!b||busy)return;
    if(b.dataset.upload!==undefined){selected=Number(b.dataset.upload);input.click();}
    if(b.dataset.library!==undefined)catalog.open(Number(b.dataset.library));
    if(b.dataset.remove!==undefined){const next=[...getImages()];next[Number(b.dataset.remove)]=null;onChange(next);render();}
  };
  input.onchange=async()=>{const file=input.files[0],index=selected,original=getImages();if(!file||index===null)return;
    busy=true;render();document.querySelector('#ball-image-status').textContent='Görsel hazırlanıyor…';
    try{const src=await prepareBallImage(file);if(getImages()!==original)throw new Error('Parkur değişti. Görseli yeniden seç.');const next=[...getImages()];next[index]=src;onChange(next);document.querySelector('#ball-image-status').textContent='Görsel eklendi ve taslağa işlendi.';}
    catch(e){document.querySelector('#ball-image-status').textContent=e.message;notify(e.message);}
    finally{input.value='';busy=false;render();}
  };
}
