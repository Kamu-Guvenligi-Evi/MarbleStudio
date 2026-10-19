import './crown-battle-audio.css';

export function mountBattleAudio(audio) {
  const controls = document.createElement('div'); controls.className = 'battle-audio-controls';
  controls.innerHTML = '<button type="button" id="battle-sound" class="quiet" aria-pressed="true">Ses açık</button><label for="battle-volume">Ses <input id="battle-volume" type="range" min="0" max="100" step="5"><output id="battle-volume-value"></output></label><button type="button" id="battle-sound-test" class="quiet">Sesi dene</button><span id="battle-sound-status" role="status"></span>';
  document.querySelector('.transport').after(controls);
  document.getElementById('record-note').textContent = 'Dikey WebM · Meydan ve savaş sesleri · Ses ayarın kayda da uygulanır.';
  const toggle = controls.querySelector('#battle-sound'), volume = controls.querySelector('input'), output = controls.querySelector('output'), status = controls.querySelector('[role="status"]');
  const sync = () => { toggle.textContent = audio.enabled ? 'Ses açık' : 'Ses kapalı'; toggle.setAttribute('aria-pressed', String(audio.enabled)); volume.value = Math.round(audio.volume * 100); output.value = `%${volume.value}`; };
  toggle.onclick = async () => { audio.configure(!audio.enabled); sync(); if (audio.enabled) status.textContent = await audio.unlock() ? '' : 'Tarayıcı sesi başlatamadı.'; };
  volume.oninput = () => { audio.configure(audio.enabled, Number(volume.value) / 100); sync(); };
  const previews = [['bow', 'Yay'],
    ['hit', 'Ok isabeti · kumaş', { projectileKind:'arrow', contact:'soft', weight:.65 }],
    ['hit', 'Ok isabeti · zırh', { projectileKind:'arrow', contact:'armor', weight:.65 }],
    ['clash', 'Kılıç teması'], ['hit', 'Gövde darbesi'], ['gun', 'Tüfek'], ['stomp', 'Ağır darbe']];
  let previewIndex = 0;
  const preview = controls.querySelector('#battle-sound-test');
  preview.title = 'Sırayla yay, kumaşa ok isabeti, zırha ok isabeti, kılıç, darbe, tüfek ve ağır darbeyi dinle';
  preview.onclick = async () => {
    preview.disabled = true;
    try {
      audio.configure(true, audio.volume || .55); sync();
      const ready = await audio.unlock(); audio.stop();
      const [kind, label, perspective] = previews[previewIndex];
      if (ready) { audio.play(kind, 0, perspective); previewIndex = (previewIndex + 1) % previews.length; }
      status.textContent = ready ? `${label} çalındı.` : 'Tarayıcı sesi başlatamadı.';
    } finally { preview.disabled = false; }
  };
  sync();
  return { unlock: async () => { if (audio.enabled && !await audio.unlock()) status.textContent = 'Ses açılamadı; Sesi dene düğmesini kullan.'; } };
}
