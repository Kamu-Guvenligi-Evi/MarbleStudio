import {createWorkbench} from './workbench.js';
import './breaker-workbench.css';

export const videoRenderMode=new URLSearchParams(location.search).has('video-render');
export function setupBreakerWorkbench({capture,canvas,getChannel}){
  if(videoRenderMode)return;
  const panel=document.createElement('div');panel.className='breaker-video-actions';
  panel.innerHTML='<button id="studio-export" class="restart primary-action">Video oluştur</button><button id="studio-videos" class="restart">Videolarım</button><p>Seçili görünüm ve hızla, oyun baştan otomatik oynatılır. Spiral Kırıcı’da yalnız seçili harita kaydedilir.</p>';
  document.querySelector('aside #status').before(panel);
  const workbench=createWorkbench({capture,getChannel,thumbnail:()=>canvas.toDataURL('image/jpeg',.7),title:()=>capture().project.name,notify:message=>document.getElementById('status').textContent=message,isLocked:()=>false,openSnapshot:()=>{}});
  document.getElementById('studio-export').onclick=()=>workbench.openExport();
  document.getElementById('studio-videos').onclick=()=>workbench.openVideos();
}
