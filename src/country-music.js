import {LeaderMusic} from './leader-music.js';
import {prepareCatalogImage} from './image-catalog.js';

const fold=value=>String(value??'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').trim();
export async function createCountryMusic({tracks,getAudio,notify,onChange}) {
  const $=id=>document.getElementById(id),engine=new LeaderMusic(getAudio);
  const selector=$('music-country'),song=$('music-country-track');
  const preview=$('country-music-preview');
  let assignments={},countries=[],byImage=new Map(),fallbackIds=new Map(),imageLookup,lastStatus='',mode='track';
  try {
    const responses=await Promise.all([fetch('/catalog/manifest.json'),fetch('/music/countries.json'),fetch('/music/people.json')]);
    if(responses.some(r=>!r.ok))throw new Error('Müzik eşleştirmeleri yüklenemedi.');
    const [catalog,defaults,people]=await Promise.all(responses.map(r=>r.json()));
    const trackIds=new Set(tracks.map(track=>track.id));
    const personIds=new Set(people.map(person=>person.entityId));
    for(const person of people){
      fallbackIds.set(person.entityId,person.fallbackCountryId);
      if(trackIds.has(person.trackId))defaults[person.entityId]=person.trackId;
    }
    countries=catalog.items.filter(item=>item.category==='countries'||personIds.has(item.id)||Object.hasOwn(defaults,item.id));assignments=defaults;
    try {assignments={...assignments,...JSON.parse(localStorage.getItem('marble-studio-country-music-v1')||'{}')};}catch{}
    for(const category of catalog.categories){
      const items=countries.filter(item=>item.category===category.id);if(!items.length)continue;
      const group=document.createElement('optgroup');group.label=category.name;
      for(const item of items)group.append(new Option(item.name,item.id));
      selector.append(group);
    }
    for(const track of tracks)song.add(new Option(track.title,track.id));
  }catch(error){notify(error.message);}
  function trackFor(country){return tracks.find(track=>track.id===(assignments[country]??assignments[fallbackIds.get(country)]));}
  function identify(ball){
    if(!ball)return null;
    return byImage.get(ball.imageSrc)??countries.find(c=>fold(c.name)===fold(ball.name))?.id??null;
  }
  function render(){
    const track=trackFor(selector.value);song.value=track?.id??'';
    preview.pause();
    if(track)preview.src=track.src;else preview.removeAttribute('src');
    preview.hidden=!track;preview.load();
  }
  selector.onchange=render;render();
  song.onchange=()=>{
    assignments[selector.value]=song.value;
    try{localStorage.setItem('marble-studio-country-music-v1',JSON.stringify(assignments));}catch{}
    engine.reset();lastStatus='';render();onChange();
  };
  function status(text){if(text!==lastStatus){$('music-leader-status').textContent=text;lastStatus=text;}}
  return {
    setVolume:value=>{engine.setVolume(value);preview.volume=value;},
    reset:()=>{engine.reset();preview.pause();lastStatus='';},
    pause:()=>engine.pause(),
    state:()=>engine.state(),
    setMode(next){mode=next;},
    lock(locked){selector.disabled=locked||!countries.length;song.disabled=locked||!countries.length;preview.hidden=locked||!trackFor(selector.value);if(locked)preview.pause();},
    enabled(gameMode){return gameMode==='track'&&countries.some(c=>trackFor(c.id));},
    async prepare(balls) {
      engine.reset();
      // Catalog portraits remain identifiable even after the user renames a ball.
      if(!imageLookup)imageLookup=Promise.all(countries.map(async country=>{
        try{byImage.set(await prepareCatalogImage(country),country.id);}catch{}
      }));
      await imageLookup;
      const ids=new Set(balls.map(identify).filter(Boolean));
      const tracksToLoad=[...new Map([...ids].map(id=>trackFor(id)).filter(Boolean).map(track=>[track.src,track])).values()];
      engine.retain(tracksToLoad);
      // Decode only this roster, in small batches; large libraries stay on disk.
      for(let i=0;i<tracksToLoad.length;i+=2)await Promise.all(tracksToLoad.slice(i,i+2).map(track=>engine.load(track)));
    },
    importPlan(roster){for(const item of roster)if(countries.some(c=>c.id===item.entity))assignments[item.entity]=item.track;try{localStorage.setItem('marble-studio-country-music-v1',JSON.stringify(assignments));}catch{}render();},
    async exportPlan(balls){
      await this.prepare(balls);
      return balls.map(ball=>{const entity=identify(ball);return {entity:entity??String(ball.id),track:trackFor(entity)?.id??''};});
    },
    sync(active,ball) {
      if(mode!=='track'){engine.pause();status('Lidere göre müzik yalnızca parkur yarışında çalışır.');return;}
      const country=identify(ball),track=trackFor(country),name=countries.find(c=>c.id===country)?.name;
      if(!active){engine.pause();status('Parkur lideri değişince müzik anında değişir.');return;}
      engine.switchTo(country,track);
      status(track?`${name} · ${track.title}`:name?`${name} için müzik seçilmedi.`:'Öndeki top için müzik eşleştirmesi yok.');
    },
  };
}
