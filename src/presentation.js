export function normalizeNames(raw = []) {
  if(!Array.isArray(raw)||raw.length>20)throw new Error('Top isimleri geçersiz.');
  return Array.from({length:20},(_,i)=>{
    if(raw[i]==null||raw[i]==='')return null;
    if(typeof raw[i]!=='string'||raw[i].trim().length>24)throw new Error('Top ismi en fazla 24 karakter olabilir.');
    return raw[i].trim()||null;
  });
}
export function normalizePresentation(raw = {}) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Video ayarları geçersiz.');
  const {countdown=3,outro=4,camera='smart'}=raw;
  if(!Number.isInteger(countdown)||countdown<0||countdown>5||!Number.isInteger(outro)||outro<1||outro>10||!['smart','leader','pack'].includes(camera))throw new Error('Video süresi veya kamera ayarı geçersiz.');
  return {countdown,outro,camera};
}

// Keep a group for a short interval to avoid cutting on every overtake.
export function createCameraDirector() {
  let anchor=null,hold=0;
  return {target(race,mode,elapsed) {
    const active=race.balls.filter(b=>b.finishedAt===null).sort((a,b)=>b.body.position.y-a.body.position.y);
    const limit=Math.max(0,race.finishY-600),front=active[0];
    if(!front)return limit;
    let y=front.body.position.y;
    if(mode==='pack')y=active[Math.floor(active.length/2)].body.position.y;
    if(mode==='smart') {
      // Return early enough to see the first crossing; then hold the finish.
      if(race.finished.length)return limit;
      if(race.finishY-y<1600)return Math.min(limit,Math.max(0,y-380));
      hold-=elapsed;
      let chosen=active.find(b=>b.id===anchor);
      if(hold<=0||!chosen) {
        let best=[];
        for(let i=0;i<active.length;i++) {
          const group=active.slice(i).filter(b=>active[i].body.position.y-b.body.position.y<240);
          if(group.length>best.length)best=group;
        }
        chosen=best[Math.floor((best.length-1)/2)]??front;anchor=chosen.id;hold=1.2;
      }
      y=chosen.body.position.y;
    }
    return Math.max(0,Math.min(limit,y-460));
  }};
}
