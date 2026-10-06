import {episodeCopy} from './episode-plan.js';
import {random} from './physics.js';
import {SECTION_SETTINGS} from './section-settings.js';
import {SPIRAL_THEMES} from './spiral-themes.js';
import {SPIRAL_VARIANTS} from './spiral-variants.js';
import {normalizeSnapshot} from './studio-transfer.js';

export const COURSE_PROFILES={
  sprint:['crossramps','slalom','fork','shortcut'],
  pinball:['pegs','wheels','drift','funnel'],
  timing:['pulse','pendulum','wheels','drift'],
  crossroads:['fork','shortcut','crossramps','funnel'],
  gauntlet:['pendulum','pegs','pulse','wheels'],
  medley:Object.keys(SECTION_SETTINGS),
};

export function validateBatch(raw={}){
  if(raw.automatic===true){const mode=raw.automaticMode??'auto';if(!['auto','track','arena','spiral','statistics'].includes(mode))throw new Error('Otomatik tür geçersiz.');return {...validateBatch({...raw,automatic:false,source:null,strategy:'variations',modes:[['auto','statistics'].includes(mode)?'track':mode]}),automatic:true,automaticMode:mode};}
  const count=Number(raw.count??3),duration=Number(raw.duration??55);
  if(!Number.isInteger(count)||count<1||count>30)throw new Error('Video sayısı 1–30 olmalı.');
  if(!Number.isInteger(duration)||duration<25||duration>90)throw new Error('Süre 25–90 saniye olmalı.');
  const source=raw.source?normalizeSnapshot(raw.source):null;
  const modes=source?[source.mode]:raw.modes??['track','spiral','arena'];
  if(!Array.isArray(modes)||!modes.length||modes.some(x=>!['track','spiral','arena','statistics'].includes(x))||(!source&&modes.includes('statistics')))throw new Error('En az bir geçerli format seç.');
  const language=raw.language??'en';if(!['en','tr'].includes(language))throw new Error('Dil geçersiz.');
  const channel=String(raw.channel??'Marble Shorts').trim();
  if(!channel||channel.length>60)throw new Error('Kanal adı 1–60 karakter olmalı.');
  const youtube=raw.youtube?.channelId?{
    channelId:String(raw.youtube.channelId),
    privacyStatus:raw.youtube.privacyStatus??'private'
  }:null;
  if(youtube&&(!/^UC[A-Za-z0-9_-]{22}$/.test(youtube.channelId)||!['private','unlisted','public'].includes(youtube.privacyStatus)))throw new Error('YouTube yükleme ayarı geçersiz.');
  const choose=(key,allowed,fallback)=>{const value=raw[key]??fallback;if(!allowed.includes(value))throw new Error('Geçersiz dışa aktarma ayarı: '+key);return value;};
  const strategy=source?choose('strategy',['exact','variations'],'exact'):'variations';
  if(source?.mode==='statistics'&&strategy!=='exact')throw new Error('İstatistik tablosu aynı çalışma olarak dışa aktarılır.');
  return {count:strategy==='exact'?1:count,duration,modes:[...new Set(modes)],language,channel,source,strategy,youtube,
    orientation:choose('orientation',['portrait','landscape','square'],source?.mode==='statistics'?'landscape':'portrait'),
    resolution:choose('resolution',[720,1080],1080),fps:choose('fps',[30,60],60),audio:choose('audio',['all','effects','music','none'],'all'),
    template:choose('template',['minimal','broadcast','cinema'],'minimal'),hook:String(raw.hook??'').trim().slice(0,100),outro:String(raw.outro??'').trim().slice(0,100)};
}
export function sourceRecipe(source,seed){
  if(source.mode==='statistics')return {version:3,mode:'statistics',seed,statistics:source.statistics};
  return {...source.project,version:3,mode:source.mode,theme:source.project.spiralTheme,seed,music:source.music};
}
export function recipe(seed,mode,theme){
  const rng=random(seed),pick=a=>a[Math.floor(rng()*a.length)];
  const profile=pick(Object.keys(COURSE_PROFILES)),rhythm=pick(['build','waves','steady']);
  const types=Object.keys(SECTION_SETTINGS),sequence=[],length=pick([4,5,6,7,8]);
  for(let i=0;i<length;i++){
    const pool=i%3===2?types:COURSE_PROFILES[profile];
    let available=pool.filter(t=>sequence.at(-1)?.type!==t&&sequence.filter(s=>s.type===t).length<2);
    if(!available.length)available=types.filter(t=>sequence.at(-1)?.type!==t&&sequence.filter(s=>s.type===t).length<2);
    const type=pick(available),settings={},pace=rhythm==='build'?.25+.65*i/(length-1):rhythm==='waves'?(i%2?.8:.25):.5;
    for(const spec of SECTION_SETTINGS[type]){
      if(spec.options)settings[spec.key]=spec.key==='direction'?(i%2?'clockwise':'counterclockwise'):pick(spec.options)[0];
      else{
        const fraction=spec.key==='speed'?Math.max(0,Math.min(1,pace+(rng()-.5)*.2)):rng();
        settings[spec.key]=Number(Math.max(spec.min,Math.min(spec.max,spec.min+Math.round(fraction*(spec.max-spec.min)/spec.step)*spec.step)).toFixed(3));
      }
    }
    sequence.push({type,settings});
  }
  return {version:2,seed,mode,theme:theme??pick(Object.keys(SPIRAL_THEMES)),count:mode==='spiral'?1:pick([6,8,10,12,14,16,18,20]),sequence:mode==='track'?sequence:null,
    ...(mode==='track'?{profile,rhythm}:mode==='spiral'?{variant:pick(Object.keys(SPIRAL_VARIANTS))}:{energy:pick([.85,1,1.15])})};
}
export function identity(r){return JSON.stringify(r);}
export function structure(r){if(r.episode)return JSON.stringify([r.mode,r.episode.format,r.episode.heats.map(h=>h.sequence.map(s=>s.type))]);return JSON.stringify([r.mode,r.mode==='statistics'?r.statistics.csv:r.mode==='track'?[r.profile,r.rhythm,(r.sequence??[]).map(s=>s.type)]:r.mode==='spiral'?[r.theme,r.variant]:[r.count,r.energy,r.arenaGame??'links',r.arenaShape??'triangle',r.territoryDuration??45]]);}
export function copyFor(r,language,ordinal=0){
  if(r.episode)return episodeCopy(r,language);
  if(r.mode==='arena'&&r.arenaGame==='territory')return {hook:language==='tr'?'Bu alanı kim ele geçirecek?':'Who will claim this territory?',title:language==='tr'?'Alan Savaşı · '+r.arenaShape:'Territory Battle · '+r.arenaShape,description:language==='tr'?'İz çiz, kapalı bölgeleri ele geçir, rakibinin izini kes. En çok alanı olan kazanır.':'Draw loops, capture land and cut rival trails. Most territory wins.',tags:['marbles','territory','battle',r.arenaShape],language};
  if(r.mode==='statistics')return {hook:r.statistics.heading,title:r.statistics.heading,description:r.statistics.source,tags:['statistics','data'],language};
  const hooks={
    en:{track:['Pick a color. Can it win?','Which marble wins this course?','Who will take the lead?'],spiral:['How many marbles to break it all?','One marble. Can it reach the center?','Will the spiral survive?'],arena:['Pick your survivor.','Who keeps the last link?','Which color will be the last one?']},
    tr:{track:['Rengini seç. Kazanabilecek mi?','Bu parkuru hangi top kazanır?','Liderliği kim ele geçirecek?'],spiral:['Hepsini kırmak için kaç top gerekir?','Tek top merkeze ulaşabilir mi?','Spiral ayakta kalabilecek mi?'],arena:['Hayatta kalacak rengi seç.','Son bağı kim koruyacak?','En sona hangi renk kalacak?']}
  };
  const extra=language==='tr'?{
    track:[`${r.count} yarışmacı. Tek finiş. Senin favorin kim?`,'Son engelde lider değişir mi?','Önde başlamak kazanmaya yeter mi?','Son ana kadar takip et.','En hızlısı mı, en şanslısı mı?'],
    spiral:['Küçük darbeler, büyük kırılma.','Son katman kaç darbeye dayanır?','Merkeze giden yolu takip et.','Her dalgada biraz daha yakın.','Bu dalga yolu açabilecek mi?'],
    arena:[`${r.count} yarışmacıdan kim kalacak?`,'Bir bağ her şeyi değiştirebilir.','En çok bağı olan kazanır mı?','Son iki yarışmacıyı tahmin et.','Favorin son darbeyi atabilecek mi?']
  }:{
    track:[`${r.count} racers. One finish. Pick yours.`,'Will the final obstacle change the leader?','Does a head start mean a win?','Follow your favorite to the finish.','Speed or luck: which wins?'],
    spiral:['Small impacts. A big breakthrough.','How long will the last layer hold?','Follow the path to the center.','Every wave gets closer.','Can this wave open the way?'],
    arena:[`Who survives these ${r.count} contenders?`,'One link can change everything.','Does the most connected marble win?','Predict the final two.','Can your favorite land the last cut?']
  };
  if(r.rosterCategory&&r.rosterCategory!=='colors'){
    const noun=language==='tr'?({countries:'ülke',teams:'takım',zodiac:'burç'})[r.rosterCategory]:({countries:'country',teams:'team',zodiac:'zodiac sign'})[r.rosterCategory];
    if(noun){hooks[language][r.mode]=language==='tr'?[`Hangi ${noun} kazanacak?`,'Favorini seç. Sonuna kadar takip et.']:[`Which ${noun} will win?`,'Pick your favorite. Follow the finish.'];extra[r.mode]=language==='tr'?[`${r.count} yarışmacı. Tek kazanan.`,'Son anda lider değişir mi?']:[`${r.count} contenders. One winner.`,'Will the lead change at the end?'];}
  }
  const variants=[...hooks[language][r.mode],...extra[r.mode]],hook=variants[(ordinal+Math.floor(r.seed/7))%variants.length];
  const theme=language==='tr'?SPIRAL_THEMES[r.theme].name:({ice:'Ice Breaker',lava:'Lava Core',aurora:'Aurora',gold:'Gold Rush',candy:'Candy Spiral',cosmic:'Cosmic Crystal'})[r.theme];
  const title=(r.mode==='spiral'?theme+' — ':'')+hook;
  return {hook,title,description:hook+'\n\n'+(language==='tr'?'Marble Studio ile oluşturulmuş özgün fizik simülasyonu.':'An original physics simulation created with Marble Studio.')+'\n#shorts #marblerace #simulation',tags:['shorts','marble race','physics simulation',r.mode],language};
}
