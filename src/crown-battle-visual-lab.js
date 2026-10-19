import { Battle } from './crown-battle.js';
import { BattleRenderer } from './crown-battle-renderer.js';
import { SpriteLibrary } from './crown-battle-art.js';
import { SamuraiStudyLibrary } from './crown-battle-samurai-study.js';
import { BattleFeedback } from './crown-battle-feedback.js';

const $=id=>document.getElementById(id),canvas=$('study-battle');
const original=new SpriteLibrary(),study=new SamuraiStudyLibrary();
const studies={
  charge:{type:'hussar',name:'Hussar hücumu',count:3,enemy:{roman:9},gap:70,spacing:65,title:'Hücum ve ilk çarpışma',note:'3 Hussar, mevzisini tutan 9 Roma piyadesine hücum ediyor. Hızlanmayı, mızrakların indirilmesini ve ilk çarpışmadaki sendelemeyi ½ Yavaşlat ile takip edebilirsin.'},
  samurai:{type:'samurai',name:'Samuray',count:6,gap:46,spacing:70,title:'Zırh, duruş ve hareket',note:'Katmanlı zırh, belirgin ışık-gölge, eklemli adımlar ve iki elle kılıç hareketi.'},
  hussar:{type:'hussar',name:'Kanatlı Hussar',count:3,gap:70,spacing:90,title:'Kanatlı Hussar',note:'Kanatlı Hussarlar eski görünümleriyle, üçe üç muharebede.'},
  sauron:{type:'me_sauron',name:'Sauron',count:1,gap:62,spacing:0,title:'Sauron',note:'Sauron eski görünümüyle. İki Sauron yalnızca deneme için karşı karşıya.'},
};
let unit=Object.hasOwn(studies,location.hash.slice(1))?location.hash.slice(1):'samurai';
let running=false,slow=false,newLook=true,close=true,accumulator=0,battle,renderer;
function reset(){
  running=false;accumulator=0;
  const config=studies[unit],army={[config.type]:config.count};
  battle=new Battle({seed:1066,historicalArmies:[army,config.enemy||{...army}]});
  battle.units.forEach((u,i)=>{const slot=i%config.count,rows=Math.min(config.count,3);u.x=300+(u.team?1:-1)*(config.gap+Math.floor(slot/3)*16);u.y=480+((slot%rows)-(rows-1)/2)*config.spacing;});
  if(unit==='charge') {
    const slots=[0,0];
    for(const u of battle.units) {
      const i=slots[u.team]++;
      u.x=u.team?355+Math.floor(i/3)*24:155;
      u.y=480+((i%3)-1)*65;
      if(u.team)u.order={kind:'hold',x:u.x,y:u.y};
    }
  }
  new BattleFeedback(battle);
  if(renderer)renderer.reset(battle);else renderer=new BattleRenderer(canvas,battle,{sprites:study});
  renderer.readySprites?.clear();renderer.frameSprites?.clear();
  const comparison=unit==='samurai';
  $('study-description').textContent=unit==='charge'?'3 kanatlı Hussar, 9 Roma piyadesine karşı.':`${config.count} mavi, ${config.count} kızıl ${config.name}. ${comparison?'Aynı muharebe, iki farklı çizim.':'Eski görünüm.'}`;
  document.querySelector('.switch').hidden=!comparison;
  $('new-detail').parentElement.hidden=!comparison;
  document.querySelector('.comparison').classList.toggle('original-only',!comparison);
  document.querySelector('.details').setAttribute('aria-label',comparison?'Yakından animasyon karşılaştırması':'Yakından animasyon');
  setLook(newLook);
  $('detail-heading').textContent=config.title;$('detail-note').textContent=config.note;
  canvas.setAttribute('aria-label',`${battle.units.length} birlik ile ${config.name} deneme muharebesi`);
  document.querySelectorAll('[data-unit]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.unit===unit)));
  resize();update();
}
function resize(){
  const rect=canvas.getBoundingClientRect();
  renderer.resize(rect.width,rect.height,true,Math.min(devicePixelRatio,2));
  // Same camera and soldier scale for both styles, including narrow screens.
  renderer.view={x:300,y:480,zoom:close?(rect.width<650?1.5:2.3):1};renderer.clampView();renderer.invalidate();
}
function update(){
  $('play').textContent=battle.winner!==null?'▶ Tekrar dene':running?'Ⅱ Duraklat':battle.time?'▶ Devam et':'▶ Savaşı başlat';
  const count=team=>battle.units.filter(u=>u.team===team&&u.hp>0).length;
  $('survivors').textContent=`${count(0)} MAVİ / ${count(1)} KIZIL${battle.winner!==null?' · TAMAMLANDI':''}`;
}
function setLook(value){
  if(unit==='samurai')newLook=value;
  const showStudy=unit==='samurai'&&newLook;
  renderer.sprites=showStudy?study:original;
  // Remove fallback references so the next frame cannot contain the previous style.
  renderer.readySprites?.clear();renderer.frameSprites?.clear();renderer.invalidate();
  $('original').setAttribute('aria-pressed',String(!showStudy));$('study').setAttribute('aria-pressed',String(showStudy));
  $('style-label').textContent=showStudy?'YENİ GÖRÜNÜM':'MEVCUT GÖRÜNÜM';
}
$('original').onclick=()=>setLook(false);$('study').onclick=()=>setLook(true);
$('play').onclick=()=>{if(battle.winner!==null)reset();running=!running;update();};
$('reset').onclick=reset;
$('slow').onclick=()=>{slow=!slow;$('slow').setAttribute('aria-pressed',String(slow));};
$('zoom').onclick=()=>{close=!close;$('zoom').setAttribute('aria-pressed',String(close));$('zoom').textContent=close?'Yakın görünüm':'Meydan görünümü';resize();};
window.addEventListener('resize',resize);
document.querySelectorAll('[data-unit]').forEach(button=>button.onclick=()=>{
  if(unit===button.dataset.unit)return;
  unit=button.dataset.unit;history.replaceState(null,'',`#${unit}`);detailKey='';reset();
});
window.addEventListener('hashchange',()=>{
  const requested=location.hash.slice(1);
  if(Object.hasOwn(studies,requested)&&requested!==unit){unit=requested;detailKey='';reset();}
});
document.addEventListener('visibilitychange',()=>{last=performance.now();accumulator=0;});
let last=performance.now(),detailKey='',lastStatus=0;
function drawDetail(id,library,frame,action){
  const c=$(id),g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);
  g.fillStyle='#101e1766';g.beginPath();g.ellipse(216,260,studies[unit].type==='hussar'?78:46,10,0,0,Math.PI*2);g.fill();
  g.drawImage(library.get(studies[unit].type,0,frame,action,0),96,16,320,304);
}
function tick(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;
  if(!document.hidden){
    if(running){accumulator+=dt*(slow?.5:1);while(accumulator>=1/60){battle.step(1/60);accumulator-=1/60;if(battle.winner!==null){running=false;accumulator=0;break;}}}
    renderer.renderIfNeeded({running});
    const action=$('pose').value,frame=action==='idle'?0:Math.floor(now/(unit==='sauron'?190:130))%8,key=`${unit}/${action}/${frame}`;
    if(key!==detailKey){drawDetail('old-detail',original,frame,action);if(unit==='samurai')drawDetail('new-detail',study,frame,action);detailKey=key;}
    if(now-lastStatus>250){update();lastStatus=now;}
  }
  requestAnimationFrame(tick);
}
reset();requestAnimationFrame(tick);
