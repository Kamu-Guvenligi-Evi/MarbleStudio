import { Battle } from './crown-battle.js';
import { BattleRenderer } from './crown-battle-renderer.js';

const $ = id => document.getElementById(id);
const descriptions = {
  assemble: ['Kanatlar açılıyor', 'Merkez düşmanı karşılıyor; iki süvari kanadı yanlara açılıyor. Kesikli oklar birliklerin gerçek hareket hedeflerini gösteriyor.'],
  retreat: ['Sahte ricat', 'Merkezdeki süvariler geri çekiliyor. Kanatlar açıkta bekliyor; kuşatma için düşmanın gerçekten takibe gelmesi gerekiyor.'],
  envelop: ['Kanat kuşatması', 'Düşman geri çekilen merkezi takip etti. İki kanat şimdi yanlardan kapanıyor.'],
  charge: ['Süvari hücumuna hazırlık', 'Merkez ve iki kanat, dönüp hızlanabilecekleri hücum mesafesini açıyor. Ardından gerçek süvari hücumuyla saldıracaklar.'],
  regroup: ['Ordu yeniden birleşiyor', 'Kuşatma koşulları oluşmadı; merkez ve kanatlar yeniden birleşiyor.'],
  done: ['Manevra sona erdi', 'Birlikler normal savaş davranışına döndü. Aşama düğmeleriyle manevrayı yeniden inceleyebilirsin.'],
};
let battle, renderer, running = false, accumulator = 0, last = 0, lastPhase;

function status() {
  const state = battle.tactics.teams[0];
  const phase = state?.phase;
  if (phase !== lastPhase) {
    lastPhase = phase;
    const [title, explanation] = descriptions[phase] || ['Hazırlanıyor', ''];
    $('phase').textContent = title;
    $('explanation').textContent = explanation;
    for (const button of document.querySelectorAll('[data-stage]')) button.setAttribute('aria-pressed', String(button.dataset.stage === phase));
  }
  $('clock').textContent = `${battle.time.toFixed(1)} sn · ${running ? 'Oynatılıyor' : 'Duraklatıldı'}${state?.reason ? ` · ${state.reason}` : ''}`;
  $('play').textContent = running ? 'Duraklat' : 'Devam et';
}

function resize() {
  const rect = $('field').getBoundingClientRect();
  renderer.resize(Math.max(1, rect.width), Math.max(1, rect.height), true, 1);
}

function showStage(phase) {
  running = false; accumulator = 0; lastPhase = null;
  battle = new Battle({seed:42, expandedMap:true, commanders:['alp_arslan', null], historicalArmies:[{seljuk_hassa:24}, {roman:24}]});
  battle.setActiveTeam(0); battle.select('all');
  // Replay the actual simulation. Never set tactic phases or soldier positions.
  for (let i = 0; i < 1800 && battle.tactics.teams[0]?.phase !== phase && battle.winner === null; i++) battle.step(1 / 30);
  $('error').textContent = battle.tactics.teams[0]?.phase === phase ? '' : 'İstenen aşama oluşmadı. Gösterim yeniden başlatılabilir.';
  if (renderer) renderer.reset(battle, renderer.terrain);
  else renderer = new BattleRenderer($('battle'), battle);
  resize(); status();
}

$('play').addEventListener('click', () => {
  if (battle.winner !== null) showStage('assemble');
  running = !running; accumulator = 0; status();
});
for (const button of document.querySelectorAll('[data-stage]')) button.addEventListener('click', () => showStage(button.dataset.stage));
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => { last = 0; accumulator = 0; });

showStage('retreat');
function frame(now) {
  const dt = last ? Math.min((now - last) / 1000, .1) : 0; last = now;
  if (running && !document.hidden) {
    accumulator += dt * Number($('speed').value);
    while (accumulator >= 1 / 30 && battle.winner === null) { battle.step(1 / 30); accumulator -= 1 / 30; }
    if (battle.winner !== null) { running = false; accumulator = 0; }
  }
  renderer.renderIfNeeded({running}); status();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
