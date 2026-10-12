import {OUTPUT_LANGUAGE,englishOutput,englishRosterName} from './output-language.js';
import {COURSE_META} from './courses.js';
import {PI_MAX_DIGITS} from './pi-collisions.js';
import {episodeCopy} from './episode-plan.js';
import {random} from './physics.js';
import {SECTION_SETTINGS} from './section-settings.js';
import {SPIRAL_THEMES} from './spiral-themes.js';
import {SPIRAL_VARIANTS} from './spiral-variants.js';
import {normalizeSnapshot} from './studio-transfer.js';
import {isBreaker} from './breaker-video.js';

export const COURSE_PROFILES={
  ...Object.fromEntries(Object.entries(COURSE_META).map(([id,c])=>[id,c.modules])),
  sprint:['crossramps','slalom','fork','shortcut'],
  pinball:['pegs','wheels','drift','funnel'],
  timing:['pulse','pendulum','wheels','drift'],
  crossroads:['fork','shortcut','crossramps','funnel'],
  gauntlet:['pendulum','pegs','pulse','wheels'],
  medley:Object.keys(SECTION_SETTINGS),
};

export function validateBatch(raw={}){
  if(raw.automatic===true){const mode=raw.automaticMode??'auto';if(!['auto','track','arena','territory','spiral','statistics'].includes(mode))throw new Error('Otomatik tür geçersiz.');return {...validateBatch({...raw,automatic:false,source:null,strategy:'variations',modes:[['auto','statistics'].includes(mode)?'track':mode==='territory'?'arena':mode]}),arenaGame:mode==='territory'?'territory':'links',automatic:true,automaticMode:mode};}
  const count=Number(raw.count??3),duration=Number(raw.duration??55);
  if(!Number.isInteger(count)||count<1||count>30)throw new Error('Video sayısı 1–30 olmalı.');
  if(!Number.isInteger(duration)||duration<30||duration>180)throw new Error('Süre 30–180 saniye olmalı.');
  const source=raw.source?normalizeSnapshot(raw.source):null;
  const modes=source?[source.mode]:raw.modes??['track','spiral','arena'];
  if(!Array.isArray(modes)||!modes.length||modes.some(x=>!['track','spiral','arena','statistics','pi'].includes(x)&&!isBreaker(x))||(!source&&modes.some(mode=>['statistics','pi'].includes(mode)||isBreaker(mode))))throw new Error('En az bir geçerli format seç.');
  if(raw.language!=null&&!['en','tr'].includes(raw.language))throw new Error('Dil geçersiz.');
  const language=OUTPUT_LANGUAGE;
  const channel=String(raw.channel??'Marble Shorts').trim();
  if(!channel||channel.length>60)throw new Error('Kanal adı 1–60 karakter olmalı.');
  const youtube=raw.youtube?.channelId?{
    channelId:String(raw.youtube.channelId),
    privacyStatus:raw.youtube.privacyStatus??'private'
  }:null;
  if(youtube&&(!/^UC[A-Za-z0-9_-]{22}$/.test(youtube.channelId)||!['private','unlisted','public'].includes(youtube.privacyStatus)))throw new Error('YouTube yükleme ayarı geçersiz.');
  const choose=(key,allowed,fallback)=>{const value=raw[key]??fallback;if(!allowed.includes(value))throw new Error('Geçersiz dışa aktarma ayarı: '+key);return value;};
  const fps=Number(raw.fps??240);
  if(!Number.isSafeInteger(fps)||fps<1)throw new Error('Kare hızı pozitif tam sayı olmalı.');
  const strategy=source?choose('strategy',['exact','variations'],'exact'):'variations';
  if((['statistics','pi'].includes(source?.mode)||isBreaker(source?.mode))&&strategy!=='exact')throw new Error('Bu mod aynı çalışma olarak dışa aktarılır.');
  return {count:strategy==='exact'?1:count,duration,modes:[...new Set(modes)],language,channel,source,strategy,youtube,
    arenaGame:choose('arenaGame',['links','territory'],source?.project?.arenaGame??'links'),
    orientation:choose('orientation',['portrait','landscape','square'],source?.mode==='statistics'?'landscape':'portrait'),
    resolution:choose('resolution',[720,1080],1080),fps,audio:choose('audio',['all','effects','music','none'],'all'),
    template:choose('template',['minimal','broadcast','cinema'],'minimal'),hook:String(raw.hook??'').trim().slice(0,100),outro:String(raw.outro??'').trim().slice(0,100)};
}
export function sourceRecipe(source,seed){
  if(isBreaker(source.mode))return {...source.project,version:3,mode:source.mode,seed,presentation:{countdown:0,outro:2},music:{mode:'fixed',track:'',volume:0,roster:[]}};
  if(source.mode==='pi')return {...source.project,name:englishOutput(source.project.name),version:3,mode:'pi',seed,presentation:{countdown:0,outro:3},music:{mode:'fixed',track:'',volume:0,roster:[]}};
  if(source.mode==='statistics')return {version:3,mode:'statistics',seed,statistics:{...source.statistics,...Object.fromEntries(['heading','unit','source'].map(key=>[key,englishOutput(source.statistics[key])]))}};
  return {...source.project,version:3,mode:source.mode,ballNames:(source.project.ballNames??[]).map(englishRosterName),theme:source.project.spiralTheme,seed,music:source.music};
}
export function recipe(seed,mode,theme){
  const rng=random(seed),pick=a=>a[Math.floor(rng()*a.length)];
  const profile=pick(Object.keys(COURSE_PROFILES)),rhythm=pick(['build','waves','steady']);
  const types=Object.keys(SECTION_SETTINGS),sequence=[],length=pick([6,7,8,9,10,12,14,16]);
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
export function structure(r){if(isBreaker(r.mode))return JSON.stringify([r.mode,r.theme,r.liveColors,r.mapId,r.playbackSpeed,r.clipSeconds]);if(r.mode==='pi')return JSON.stringify([r.mode,r.digits,r.speed,...(r.autoIncrease?[true,PI_MAX_DIGITS]:[])]);if(r.episode)return JSON.stringify([r.mode,r.episode.format,r.episode.heats.map(h=>h.sequence.map(s=>s.type))]);return JSON.stringify([r.mode,r.mode==='statistics'?r.statistics.csv:r.mode==='track'?[r.profile,r.rhythm,(r.sequence??[]).map(s=>s.type)]:r.mode==='spiral'?[r.theme,r.variant]:[r.count,r.energy,r.arenaGame??'links',r.arenaShape??'triangle',r.territoryDuration??45]]);}
export function copyFor(r,language,ordinal=0){
  if(isBreaker(r.mode)){const hook=r.mode==='glass-breaker'?'Will all the glass break?':'Can the marbles clear every block?';return {hook,title:hook,description:hook+'\nAn original physics simulation created with Marble Studio.',tags:['shorts','marbles','physics',r.mode],language:OUTPUT_LANGUAGE};}
  language=OUTPUT_LANGUAGE;
  if(r.mode==='pi')return {hook:'Count your way to π',title:englishOutput(r.name),description:'Galperin’s pi experiment with two blocks and a wall.',tags:['pi','physics','simulation'],language};
  if(r.episode)return episodeCopy(r,language);
  if(r.mode==='arena'&&r.arenaGame==='territory')return {hook:'Who will claim this territory?',title:'Territory Battle · '+r.arenaShape,description:'Draw loops, capture land and cut rival trails. Most territory wins.',tags:['marbles','territory','battle',r.arenaShape],language};
  if(r.mode==='statistics')return {hook:englishOutput(r.statistics.heading),title:englishOutput(r.statistics.heading),description:englishOutput(r.statistics.source),tags:['statistics','data'],language};
  const hooks={
    en:{track:['Pick a color. Can it win?','Which marble wins this course?','Who will take the lead?'],spiral:['How many marbles to break it all?','One marble. Can it reach the center?','Will the spiral survive?'],arena:['Pick your survivor.','Who keeps the last link?','Which color will be the last one?']},
  };
  const extra={
    track:[`${r.count} racers. One finish. Pick yours.`,'Will the final obstacle change the leader?','Does a head start mean a win?','Follow your favorite to the finish.','Speed or luck: which wins?'],
    spiral:['Small impacts. A big breakthrough.','How long will the last layer hold?','Follow the path to the center.','Every wave gets closer.','Can this wave open the way?'],
    arena:[`Who survives these ${r.count} contenders?`,'One link can change everything.','Does the most connected marble win?','Predict the final two.','Can your favorite land the last cut?']
  };
  if(r.rosterCategory&&r.rosterCategory!=='colors'){
    const noun=({countries:'country',teams:'team',zodiac:'zodiac sign'})[r.rosterCategory];
    if(noun){hooks[language][r.mode]=[`Which ${noun} will win?`,'Pick your favorite. Follow the finish.'];extra[r.mode]=[`${r.count} contenders. One winner.`,'Will the lead change at the end?'];}
  }
  const variants=[...hooks[language][r.mode],...extra[r.mode]],hook=variants[(ordinal+Math.floor(r.seed/7))%variants.length];
  const theme=({ice:'Ice Breaker',lava:'Lava Core',aurora:'Aurora',gold:'Gold Rush',candy:'Candy Spiral',cosmic:'Cosmic Crystal'})[r.theme];
  const title=(r.mode==='spiral'?theme+' — ':'')+hook;
  return {hook,title,description:hook+'\n\n'+'An original physics simulation created with Marble Studio.'+'\n#shorts #marblerace #simulation',tags:['shorts','marble race','physics simulation',r.mode],language};
}
