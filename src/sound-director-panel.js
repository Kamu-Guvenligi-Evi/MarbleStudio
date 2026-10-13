import {ringSoundTrace,ringSignature} from './ring-sound-trace.js';
import {localPlan,memePlan,softPlan,validatePlan,VOICE_NAMES} from './sound-plan.js';
import {SOFT_INSTRUMENTS,SOFT_PHRASES} from './soft-audio.js';
import {MEME_EFFECTS} from './meme-catalog.js';
import './sound-director.css';

const KEY='marble-studio-ring-sound-score-v1';
export function mountSoundDirector({element,settings,audio,restart,save}) {
  element.innerHTML=`<div class="director-heading"><span class="director-icon">♫</span><div><h2>Hazır ses düzenleri</h2><span>TEMAS · KIRILMA · FİNAL</span></div></div>
    <p class="director-intro">Bir düzen seçip uygula. Her olaya ayrı seçtiğin sesler önceliklidir; müzik ve efekt seviyelerini yukarıdan ayarlayabilirsin.</p>
    <div class="director-actions"><button id="sound-generate" type="button" class="button primary">Dengeli düzeni uygula</button></div>
    <label class="field" for="sound-soft-instrument">Yumuşak notalar ve yükseliş<select id="sound-soft-instrument">${Object.entries(SOFT_INSTRUMENTS).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label>
    <label class="field" for="sound-soft-phrase">Kaçışta kısa melodi<select id="sound-soft-phrase"><option value="">Yalnızca temas notaları</option>${Object.entries(SOFT_PHRASES).map(([id,p])=>`<option value="${id}">${p.name}</option>`).join('')}</select></label>
    <div class="director-actions"><button id="sound-soft-preview" type="button" class="button secondary">▶ Yükselişi dinle</button><button id="sound-soft-apply" type="button" class="button primary">Yükselen temasları uygula</button></div>
    <p>Do–Re–Mi–Sol–La: her temasta bir üst nota, sabit ses seviyesi. Aradan sonra yeniden başlar.</p>
    <details class="sound-library" id="soft-phrase-library"><summary>${Object.keys(SOFT_PHRASES).length} kısa nota dizisini dinle</summary><div class="sound-preview-grid">${Object.entries(SOFT_PHRASES).map(([id,p])=>`<button type="button" data-preview-phrase="${id}">▶ ${p.name}<small>${p.hint}</small></button>`).join('')}</div><p id="soft-phrase-status" role="status" aria-live="polite">Dinlediğin melodi kaçış seçimine geçer. Oyunda kullanmak için Yükselen temasları uygula düğmesine bas.</p></details>
    <div class="director-actions"><button id="sound-meme" type="button" class="button secondary">Meme efektlerini uygula</button><button id="sound-reactions" type="button" class="button secondary">Sözlü tepkileri uygula</button></div>
    <details class="sound-library"><summary>${Object.keys(MEME_EFFECTS).length} yeni sesi dinle</summary>${[false,true].map(speech=>`<p>${speech?'Kısa sözlü tepkiler':'Çarpışma ve vurgu'}</p><div class="sound-preview-grid">${Object.entries(MEME_EFFECTS).filter(([,e])=>!!e.speech===speech).map(([id,e])=>`<button type="button" data-preview-sound="${id}" title="${e.hint}">▶ ${e.name}<small>${e.hint}</small></button>`).join('')}</div>`).join('')}<p id="sound-preview-status" role="status" aria-live="polite">Bir sesi dinlemek için adına bas. Hazır düzenler sesleri uygun oyun anlarına yerleştirir.</p></details>
    <p id="director-status" role="status" aria-live="polite">Otomatik ses düzeni hazır. Efektler oyun olaylarına göre yerleştirilir.</p>
    <div id="sound-score" hidden><div class="score-meta"><strong id="sound-score-title"></strong><button id="sound-disable" type="button">Planı kapat</button></div><p id="sound-rationale"></p><div id="sound-sections" class="sound-sections"></div><details><summary id="sound-cue-count">Efekt kararları</summary><ol id="sound-cues"></ol></details><p class="director-footnote">Plan bu akışla birlikte saklanır. Video kaydı aynı planı kullanır. Harita veya hız değişince yeniden planla.</p></div>`;
  const $=id=>element.querySelector('#'+id),status=message=>{$('director-status').textContent=message;};
  let score=null,trace=null;
  try{score=JSON.parse(localStorage.getItem(KEY));}catch{}
  const persist=()=>{try{if(score)localStorage.setItem(KEY,JSON.stringify(score));else localStorage.removeItem(KEY);}catch{status('Plan bu oturumda geçerli; depolama alanına kaydedilemedi.');}};
  function render(){
    $('sound-score').hidden=!score;
    if(!score)return;
    const softVoice=score.plan.cues.find(c=>Object.hasOwn(SOFT_INSTRUMENTS,c.voice.slice(5)))?.voice;
    if(softVoice)$('sound-soft-instrument').value=softVoice.slice(5);
    $('sound-soft-phrase').value=score.plan.cues.find(c=>Object.hasOwn(SOFT_PHRASES,c.voice))?.voice??'';
    $('sound-score-title').textContent=`Hazır düzen · ${score.plan.title} · ${score.plan.bpm} BPM`;
    $('sound-rationale').textContent=score.plan.rationale;
    $('sound-sections').replaceChildren(...score.plan.sections.map(s=>{const d=document.createElement('span');d.textContent=`${(s.start/trace.speed).toFixed(1)} sn · ${s.label}`;return d;}));
    $('sound-cue-count').textContent=`${score.plan.cues.length} efekt / ${trace.events.length} olay · kararları gör`;
    $('sound-cues').replaceChildren(...score.plan.cues.slice().sort((a,b)=>a.eventId-b.eventId).map(c=>{const li=document.createElement('li'),e=trace.events[c.eventId];li.textContent=`${(e.time/trace.speed).toFixed(2)} sn · ${VOICE_NAMES[c.voice]} — ${c.reason}`;return li;}));
  }
  function refresh(){
    const signature=ringSignature(settings);
    if(!trace||trace.signature!==signature)trace=ringSoundTrace(settings);
    if(score){
      try{if(score.version!==1||score.source!=='local'||score.signature!==signature)throw Error();validatePlan(score.plan,trace);}
      catch{score=null;persist();status('Önceki ses planı kapatıldı. Bu akış için bir hazır düzen seçebilirsin.');}
    }
    if(!score&&settings.music==='adaptive'){settings.music='ambient';save();}
    const adaptive=document.querySelector('#music option[value="adaptive"]');if(adaptive)adaptive.disabled=!score;
    audio.setScore(score,trace);render();
  }
  function apply(next){score=next;persist();settings.music='adaptive';settings.sound=true;save();refresh();restart('Ses planı uygulandı. Akış baştan oynatılıyor.');}
  $('sound-soft-apply').onclick=()=>{
    apply({version:1,source:'local',signature:trace.signature,brief:'',plan:softPlan(trace,$('sound-soft-instrument').value,$('sound-soft-phrase').value)});
    status('Yumuşak yükselen temaslar uygulandı. Aynı notalar video çıktısında da kullanılır.');
  };
  $('sound-soft-preview').onclick=async()=>{
    if(!settings.sound){status('Dinlemek için önce Sesleri aç düğmesine bas.');return;}
    try{await audio.preview('soft-'+$('sound-soft-instrument').value+'-rise');status(SOFT_INSTRUMENTS[$('sound-soft-instrument').value]+' · kısa yükseliş');}
    catch{status('Ses dinlenemedi. Tekrar dene.');}
  };
  element.querySelectorAll('[data-preview-phrase]').forEach(button=>button.onclick=async()=>{
    if(!settings.sound){$('soft-phrase-status').textContent='Dinlemek için önce Sesleri aç düğmesine bas.';return;}
    const voice=button.dataset.previewPhrase;
    try{
      const played=await audio.preview(voice);
      if(played){$('sound-soft-phrase').value=voice;$('soft-phrase-status').textContent=SOFT_PHRASES[voice].name+' · '+SOFT_PHRASES[voice].hint;}
      else $('soft-phrase-status').textContent='Dinleme durduruldu.';
    }catch{$('soft-phrase-status').textContent='Ses dinlenemedi. Tekrar dene.';}
  });
  $('sound-generate').onclick=()=>{apply({version:1,source:'local',signature:trace.signature,brief:'',plan:localPlan(trace)});status('Otomatik düzen çalıyor. Temas, kırılma ve final sesleri yerel kurallarla yerleştirildi.');};
  for(const [id,spoken] of [['sound-meme',false],['sound-reactions',true]])$(id).onclick=()=>{
    apply({version:1,source:'local',signature:trace.signature,brief:'',plan:memePlan(trace,spoken)});
    status(spoken?'Sözlü tepkiler uygulandı. Yoink, Nani, Nice ve diğer tepkiler kaçışlarda aralıklı çalar.':'Meme efektleri uygulandı. Kaçışlarda halka, zıplama ve miyav; temaslarda kısa efektler, finalde sonuca uygun vurgu çalar.');
  };
  element.querySelectorAll('[data-preview-sound]').forEach(button=>button.onclick=async()=>{
    if(!settings.sound){$('sound-preview-status').textContent='Dinlemek için önce Sesleri aç düğmesine bas.';return;}
    try{const played=await audio.preview(button.dataset.previewSound);$('sound-preview-status').textContent=played?`${MEME_EFFECTS[button.dataset.previewSound].name} · ${MEME_EFFECTS[button.dataset.previewSound].hint}`:'Dinleme durduruldu.';}
    catch{$('sound-preview-status').textContent='Ses dinlenemedi. Tekrar dene.';}
  });
  $('sound-disable').onclick=()=>{score=null;persist();if(settings.music==='adaptive')settings.music='ambient';save();refresh();restart('Ses planı kapatıldı.');status('Ses planı kapalı.');};
  refresh();
  return {refresh,get score(){return score;}};
}
