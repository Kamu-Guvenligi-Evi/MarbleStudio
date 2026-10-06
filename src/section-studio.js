import { Race } from './physics.js';
import { MODULES } from './courses.js';
import { SECTION_SETTINGS, normalizeSection } from './section-settings.js';
import { renderRace } from './renderer.js';

export function createSectionStudio({getRace,onApply}) {
  const $=s=>document.querySelector(s),dialog=$('#section-dialog'),ctx=$('#section-canvas').getContext('2d');
  let index=null,draft=null,testRace=null,accumulator=0,last=0,frameId=null;
  function render() {
    if(!testRace)return;
    renderRace(ctx,testRace,{cameraY:300,countdown:0,paused:false,trails:false,preview:0});
    $('#section-test-status').textContent=testRace.state==='ready'?'6 top ile bu bölümü deneyebilirsin.':testRace.state==='finished'?`6 / 6 top geçti · ${testRace.time.toFixed(1)} saniye`:`${testRace.finished.length} / 6 top geçti · ${testRace.time.toFixed(1)} saniye`;
    $('#test-section').textContent=testRace.state==='ready'?'▶ Bu bölümü dene':'↺ Yeniden dene';
  }
  function rebuild() {
    testRace?.dispose();
    const main=getRace(),sequence=structuredClone(main.sequence);sequence[index]=draft;
    testRace=new Race({seed:main.seed,sequence,previewIndex:index,count:6,ballImages:main.ballImages,ballNames:main.ballNames});
    accumulator=0;render();
  }
  function tick(now) {
    if(!dialog.open){frameId=null;return;}
    const dt=Math.min((now-last)/1000||0,.05);last=now;
    if(testRace?.state==='running'){accumulator+=dt;while(accumulator>=1/120){testRace.step();accumulator-=1/120;}render();}
    frameId=requestAnimationFrame(tick);
  }
  function fields() {
    $('#section-fields').innerHTML=SECTION_SETTINGS[draft.type].map(spec=>spec.options?
      `<label class="section-field" for="section-${spec.key}"><span>${spec.label}</span><select id="section-${spec.key}" data-setting="${spec.key}">${spec.options.map(([value,label])=>`<option value="${value}" ${draft.settings[spec.key]===value?'selected':''}>${label}</option>`).join('')}</select></label>`:
      `<label class="section-field" for="section-${spec.key}"><span>${spec.label}<output id="output-${spec.key}">${draft.settings[spec.key]}${spec.unit}</output></span><input id="section-${spec.key}" data-setting="${spec.key}" type="range" min="${spec.min}" max="${spec.max}" step="${spec.step}" value="${draft.settings[spec.key]}"><small>${spec.min}${spec.unit}<span>${spec.max}${spec.unit}</span></small></label>`).join('');
  }
  $('#section-fields').oninput=e=>{
    const input=e.target.closest('[data-setting]');if(!input)return;
    const spec=SECTION_SETTINGS[draft.type].find(s=>s.key===input.dataset.setting);
    draft.settings[spec.key]=spec.options?input.value:Number(input.value);
    const output=$(`#output-${spec.key}`);if(output)output.textContent=`${draft.settings[spec.key]}${spec.unit}`;
    rebuild();
  };
  $('#test-section').onclick=()=>{rebuild();testRace.start();render();};
  $('#reset-section-settings').onclick=()=>{draft=normalizeSection(draft.type);fields();rebuild();};
  $('#apply-section').onclick=()=>{onApply(index,structuredClone(draft));dialog.close();};
  dialog.addEventListener('close',()=>{if(dialog.open)return;if(frameId)cancelAnimationFrame(frameId);frameId=null;testRace?.dispose();testRace=null;index=null;});
  return {
    open(nextIndex) {
      index=nextIndex;draft=structuredClone(getRace().sequence[index]);
      $('#section-title').textContent=MODULES[draft.type].name;
      $('#section-number').textContent=`${index+1}. BÖLÜM`;
      $('#section-description').textContent=MODULES[draft.type].subtitle;
      fields();dialog.showModal();rebuild();last=performance.now();frameId=requestAnimationFrame(tick);
    },
    state:()=>dialog.open&&testRace?{index,time:testRace.time,state:testRace.state,finished:testRace.finished.length,settings:structuredClone(draft.settings)}:null,
  };
}
