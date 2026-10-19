import { activeCommander, commanderSupportsDoctrine, armyIdentity, tacticArmies } from './historical-commander-tactics.js';
import { assessOpponents, combatant, preparationUnderFire } from './historical-opponent-analysis.js';
import { armySector, armyEnemies, armyInside, fitArmyFront, fallbackArmy } from './historical-alliance-coordination.js';
import { attachDeploymentSupports, corpsBuilder, corpsExtent } from './historical-deployment-corps.js';
import { selectCorpsFormation } from './historical-formation-policy.js';
import { reinforceLine } from './historical-line-support.js';
import { pikeBlock, mingTeams } from './historical-infantry-deployment.js';
import { ottomanDeployment } from './historical-ottoman-deployment.js';
import { frenchDeployment } from './historical-french-deployment.js';

// Equipment/period mappings come from docs/historical-tactics-research-2026-10-15.txt.
// These are bounded game interpretations, not bonuses attached to ethnicity.
export const CIVILIZATION_DOCTRINES = [
  { id:'TR_OTTOMAN', name:'Osmanlı merkez ve kanatlar', kind:'wings', required:{bow:6, horse:6}, roles:{ottoman_solak:'bow', ottoman_azap_archer:'bow', ottoman_janissary_bow:'bow', janissary:'bow', ottoman_sipah:'horse', ottoman_timariot:'horse', ottoman_cebelu:'horse', ottoman_akinci:'horse', ottoman_akinci_archer:'horse', ottoman_akinci_mace:'horse'} },
  { id:'DE_PIKE', name:'Landsknecht mızrak kütlesi', kind:'pikes', required:{front:12}, roles:{landsknecht:'front', bicocca_spanish_pikeman:'front', german_halberdier:'support', german_doppelsoldner:'support', german_landsknecht_katzbalger:'support', german_pavise_crossbowman:'bow', german_landsknecht_arquebusier:'bow'} },
  { id:'EN_SHIELDWALL', name:'Housecarl savunma hattı', kind:'hold', required:{front:12}, roles:{england_housecarl:'front', english_housecarl_sword:'front'} },
  { id:'FR_OPPORTUNITY', name:'Fransız fırsat hücumu', kind:'opportunity', required:{horse:6}, roles:{french_ordonnance_gendarme:'horse', french_coutilier:'horse', french_ordonnance_archer:'bow', french_franc_archer:'bow', french_franc_crossbowman:'bow', french_scots_guard:'bow', french_dismounted_man_at_arms:'foot'} },
  { id:'IT_CONDOTTA', name:'Condotta süvari ihtiyatı', kind:'reserve', required:{horse:12}, roles:{milan_ducal_cavalry:'horse', italian_condotta_lancer:'horse'} },
  { id:'GR_HOPLITE', name:'Hoplit ortak ilerleyişi', kind:'hoplites', required:{front:12}, roles:{spartan:'front',greek_thespian_hoplite:'front',greek_allied_hoplite:'front',greek_theban_thermopylae_hoplite:'front',greek_phocian_hoplite:'front',greek_opuntian_locrian_infantry:'front'} },
  { id:'PE_ACHAEMENID', name:'Pers mızrak ve yay hattı', kind:'screen', required:{front:6,bow:6}, roles:{persian:'front', achaemenid_archer:'bow'} },
  { id:'JP_INFANTRY', name:'Yari, yumi ve teppō desteği', kind:'yari', required:{front:6,bow:6}, roles:{japan_yari_ashigaru:'front', japan_yumi_ashigaru:'bow', japan_teppo_ashigaru:'bow'} },
  { id:'CN_QIN', name:'Qin arbalet ön hattı', kind:'crossbows', required:{front:6,bow:6}, roles:{qin_ji_infantry:'front', qin_long_spearman:'front', qin_crossbowman:'bow'} },
  { id:'CN_MING', name:'Ming karma silah düzeni', kind:'cells', required:{longShield:2, shield:2, wolf:4, spear:8, short:4}, roles:{ming_long_shield:'longShield', ming_rattan_shield:'shield', ming_langxian:'wolf', ming_long_spearman:'spear', ming_short_weapon_support:'short'} },
];
const free = u => u.hp > 0 && !u.removed && !u.order && !u.tacticalOverride;
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const mean = list => list.length ? list.reduce((p,u)=>({x:p.x+u.x/list.length,y:p.y+u.y/list.length}),{x:0,y:0}) : null;
const project = (u,s) => (u.x-s.origin.x)*s.forward.x+(u.y-s.origin.y)*s.forward.y;
const across = (u,s) => (u.x-s.origin.x)*s.side.x+(u.y-s.origin.y)*s.side.y;
const phaseNames = {assemble:'Düzen kuruluyor', execute:'Birlikler ilerliyor', hold:'Hat korunuyor', wait:'Hücum fırsatı bekleniyor', charge:'Hücum', reserve:'İhtiyat bekliyor', flank:'İhtiyat kanada çıkıyor', fallback:'Arbaletçiler geriye alınıyor'};

export class CivilizationTactics {
  constructor() { this.teams=[null,null]; this.armies=new Map(); this.intents=new Map(); this.initialized=false; this.nextUpdate=0; this.stats={decisions:0,scanned:0}; }
  point(s,f,a) { return {x:s.origin.x+s.forward.x*f+s.side.x*a,y:s.origin.y+s.forward.y*f+s.side.y*a}; }
  inside(b,p,armyId,radius=0) { const r=b.bounds; return p.x>=r.left+30&&p.x<=r.right-30&&p.y>=r.top+118&&p.y<=r.bottom-93&&armyInside(b,armyId,p,radius); }
  change(b,s,phase,reason) {
    s.phase=phase; s.since=b.time; s.reason=reason;
    s.phaseLabel=phase==='done'?'':phaseNames[phase];
    s.label=phase==='done'?'':`${s.profile.name} · ${phaseNames[phase]}`;
    s.history.push({phase,time:b.time,...(reason?{reason}:{})});
    b.log(`${s.team?'Kızıl':'Mavi'}: ${reason || s.label}`);
    if(phase==='done') for(const m of s.members) this.intents.delete(m.unit.id);
  }
  layout(s,units,army=units) {
    const groups=new Map();
    for(const u of units) { const role=s.profile.roles[u.type]; if(!groups.has(role))groups.set(role,[]); groups.get(role).push(u); }
    const sections=[];
    const add=corpsBuilder(s.members,sections,list=>list.slice().sort((a,b)=>across(a,s)-across(b,s)||a.id-b.id));
    const shape=(corps,options)=>selectCorpsFormation(corps,s.strategy,options);
    const kind=s.profile.kind, front=groups.get('front')||[], bow=groups.get('bow')||[], horses=groups.get('horse')||[];
    if(kind==='pikes') pikeBlock(s,groups);
    else if(kind==='cells') {
      mingTeams(s,groups,army);
    } else if(kind==='wings') {
      ottomanDeployment(s,groups);
    } else if(kind==='reserve') {
      const split=Math.ceil(horses.length*2/3);
      const first=horses.slice(0,split), half=Math.ceil(first.length/2);
      add(first.slice(0,half),'front','cavalry-left',shape('horse',{side:-1}),35,-18,-1);
      add(first.slice(half),'front','cavalry-right',shape('horse',{side:1}),35,18,1);
      add(horses.slice(split),'reserve','cavalry-reserve','block',corpsExtent(s.members).rear-28,60);
    } else if(kind==='opportunity') frenchDeployment(s,groups);
    else {
      add(front,'front','centre',shape('infantry'),kind==='crossbows'?0:25);
      const support=groups.get('support')||[];
      add(support,'support','rear-support','block',corpsExtent(s.members).rear-22);
      // Split ranged support to leave the central melee approach unobstructed.
      const split=Math.ceil(bow.length/2), f=kind==='crossbows'?60:-20;
      const box=corpsExtent(s.members);
      add(bow.slice(0,split),'bow','missile-left',shape('missile'),f,box.left-24,-1);
      add(bow.slice(split),'bow','missile-right',shape('missile'),f,box.right+24,1);
    }
    if(sections.length)s.formationGeometry={kind:'adaptive-corps',sections};
    for(const m of s.members)m.visualRole??=m.a<0?'left':m.a>0?'right':'bait';
    // Assign adjacent soldiers to adjacent files, rather than sending the back
    // of one file across already occupied ranks. Sorting is initialization-only.
    const assignmentKey=m=>`${m.role}:${m.duty||''}`;
    for(const key of new Set(s.members.map(assignmentKey))) {
      const slots=s.members.filter(m=>assignmentKey(m)===key).sort((a,b)=>a.a-b.a||b.f-a.f);
      const soldiers=slots.map(m=>m.unit).sort((a,b)=>across(a,s)-across(b,s)||project(b,s)-project(a,s)||a.id-b.id);
      slots.forEach((m,i)=>{m.unit=soldiers[i];});
    }
  }
  initialize(b,armies,reserved) {
    this.initialized=true;
    if(b.navigation)return;
    for(const {id:armyId,team,units:own} of tacticArmies(armies)) {
      if(this.armies.has(armyId))continue;
      if(reserved.has(armyId)||!armies[1-team].length)continue;
      for(const profile of CIVILIZATION_DOCTRINES) {
        if(!commanderSupportsDoctrine(b,team,profile.id,armyId))continue;
        const strategy=b.tactics?.strategy?.plans.get(armyId);
        // Keep period-specific responses (exposed targets, protected flanks,
        // reserves). The strategic layer adjusts their advance, not ownership.
        const units=own.filter(u=>free(u)&&profile.roles[u.type]);
        const counts={}; for(const u of units) { const role=profile.roles[u.type]; counts[role]=(counts[role]||0)+1; }
        if(units.length<12||units.length<own.length*.6||Object.entries(profile.required).some(([r,n])=>(counts[r]||0)<n))continue;
        const origin=mean(units),enemy=mean(armyEnemies(b,armyId,armies[1-team])),gap=distance(origin,enemy);
        if(gap<140)continue;
        const forward=armySector(b,armyId)?.forward||{x:(enemy.x-origin.x)/gap,y:(enemy.y-origin.y)/gap};
        const state={team,armyId,profile,commander:activeCommander(b,team,armyId),origin,forward,side:{x:-forward.y,y:forward.x},members:[],history:[],advance:0,started:b.time};
        state.strategy=strategy;
        const localEnemy=assessOpponents(state,armyEnemies(b,armyId,armies[1-team]));
        state.strategy={...strategy,enemy:localEnemy,flank:localEnemy.leftThreat<localEnemy.rightThreat?-1:1};
        this.layout(state,units,own.filter(free));
        if(strategy?.kind==='close'&&profile.kind==='wings')
          for(const m of state.members)m.a*=1.2;
        attachDeploymentSupports(state,own.filter(free));
        if(state.members.length<units.length*.6||!fitArmyFront(b,state,state.members.map(m=>({...this.point(state,m.f,m.a),radius:m.unit.combatProfile.radius})))
          ||state.members.some(m=>!this.inside(b,this.point(state,m.f,m.a),armyId,m.unit.combatProfile.radius)))continue;
        state.speed=Math.min(...state.members.map(m=>m.unit.combatProfile.config.speed));
        // Every doctrine needs time to physically form its ranks. Estimate the
        // slow tail once, allowing for files yielding while changing ranks and
        // keeping the legacy limit on compact/old deployments.
        // An obstructed outlier must not hold an army indefinitely; contact
        // still releases individual soldiers immediately in steer().
        const travel=state.members.map(m=>distance(m.unit,this.point(state,m.f,m.a))
          /Math.max(1,m.unit.combatProfile.config.speed)).sort((a,b)=>a-b);
        state.assembleLimit=b.deploymentSpacing?.frontGap>160
          ?Math.min(30,Math.max(12,1+travel[Math.floor(travel.length*.9)]*2.4)):12;
        this.armies.set(armyId,state); this.teams[team] ||= state; this.change(b,state,'assemble'); break;
      }
    }
  }
  exposed(s,target,enemies) {
    if(!target)return false;
    const origin=mean(s.members.filter(m=>free(m.unit)).map(m=>m.unit));
    if(!origin)return false;
    const dx=target.x-origin.x,dy=target.y-origin.y,length=Math.hypot(dx,dy);
    return !enemies.some(u=>{
      if(!combatant(u)||u===target||u.combatProfile.ranged)return false;
      const along=((u.x-origin.x)*dx+(u.y-origin.y)*dy)/Math.max(1,length);
      const side=Math.abs((u.x-origin.x)*dy-(u.y-origin.y)*dx)/Math.max(1,length);
      return distance(u,target)<85 || (along>0&&along<length+25&&side<55);
    });
  }
  chooseFlank(b,s,front,members) {
    // Keep even the inner files outside the enemy frontage.
    const spread=Math.max(0,...members.map(m=>Math.abs(m.role==='reserve'?m.a-60:m.a)));
    const width=Math.max(90,front.width+45+spread);
    const options=front.leftThreat<front.rightThreat?[-width,width]:[width,-width];
    return options.find(side=>members.every(m=>[m.f+s.advance,s.advance+Math.max(35,front.nearest)+25].every(f=>
      this.inside(b,this.point(s,f,side+(m.role==='reserve'?m.a-60:m.a)),s.armyId,m.unit.combatProfile.radius)))) ?? null;
  }
  update(b,alive,reserved=new Set()) {
    // Retain the old standalone caller shape while the wrapper passes army IDs.
    if(Array.isArray(reserved))reserved=new Set(reserved.flatMap((value,team)=>value?[`army-${team}`]:[]));
    // Commander loss and manual orders release stale intents between decisions.
    for(const s of this.armies.values()) if(s.phase!=='done') {
      if(b.navigation||reserved.has(s.armyId)||activeCommander(b,s.team,s.armyId)!==s.commander||!commanderSupportsDoctrine(b,s.team,s.profile.id,s.armyId)) this.change(b,s,'done','Komuta veya açık alan şartı kayboldu.');
    }
    if(b.time<=0||b.time+1e-8<this.nextUpdate)return;
    if(this.initialized&&[...this.armies.values()].every(s=>s.phase==='done'))return;
    this.nextUpdate=b.time+.5;this.stats.decisions++;this.stats.scanned+=alive.length;
    const armies=[[],[]];for(const u of alive)if(combatant(u))armies[u.team].push(u);
    if(!this.initialized)this.initialize(b,armies,reserved);
    this.intents.clear();
    for(const s of this.armies.values()) {
      if(!s||s.phase==='done')continue;
      const members=s.members.filter(m=>free(m.unit)),enemies=armyEnemies(b,s.armyId,armies[1-s.team]),kind=s.profile.kind;
      this.stats.scanned+=s.members.length+enemies.length;
      const counts={}; for(const m of members) { const r=s.profile.roles[m.unit.type];counts[r]=(counts[r]||0)+1; }
      if(!enemies.length||members.length<s.members.length*.65||Object.entries(s.profile.required).some(([r,n])=>(counts[r]||0)<Math.ceil(n/2))) {this.change(b,s,'done','Düzen için yeterli kuvvet kalmadı.');continue;}
      const front=assessOpponents(s,enemies),age=b.time-s.since;
      s.opponent=front;
      // The anchor may be far behind the occupied ranks. Actual projectile
      // hits must also trigger a response when its range estimate misses them.
      const underFire=front.missilePressure>=Math.max(2,front.count*.3)||
        s.members.filter(m=>!m.unit.order&&!m.unit.tacticalOverride&&
          b.time-(m.unit.lastMissileDamage??-Infinity)<2).length>=Math.max(1,members.length*.05);
      const counterFront=(front.pikes+front.elephants)>=front.count*.3;
      if(kind==='wings'||kind==='reserve')reinforceLine(b,s,members,enemies);
      const contact=members.some(m=>!m.unit.combatProfile.ranged&&combatant(m.unit.target)&&
        distance(m.unit,m.unit.target)<=m.unit.combatProfile.config.reach+18);
      if(contact)s.contactAt??=b.time;else s.contactAt=undefined;
      if(s.phase==='assemble') {
        const sectors = ['left','bait','right'].map(id => {
          const sector = members.filter(m => m.visualRole === id);
          return { id, members: sector, units: sector.map(m => m.unit), ready: sector.filter(m =>
            m.engaged || distance(m.unit,this.point(s,m.f,m.a))<35).length >= sector.length*.6 };
        });
        if(preparationUnderFire(s,sectors,enemies,b.time)) {
          // Release the exposed sector to local combat. Other ranks can keep
          // forming, and must count these committed soldiers as deployed.
          for(const sector of sectors) if(sector.pressured) for(const m of sector.members) {
            m.engaged=true;m.preparationReleased=true;
          }
        }
        // Soldiers already fighting have left deployment for good. Waiting for
        // them at obsolete slots can strand the remaining support in assemble.
        // Troops exchanging ranks under pressure are already responding to
        // contact; do not time out assembly waiting for their obsolete slots.
        const ready=members.filter(m=>m.engaged||m.unit.screening||m.unit.screenYield?.until>b.time||distance(m.unit,this.point(s,m.f,m.a))<35).length;
        // An approaching enemy can force the Qin missile screen to withdraw
        // before the last soldiers reach their deployment slots.
        if(kind==='crossbows'&&age>2&&front.meleeNearest<155)this.change(b,s,'fallback');
        else if(ready>=members.length*.6) this.change(b,s,kind==='hold'?'hold':kind==='opportunity'?'wait':kind==='reserve'?'reserve':'execute');
        else if(age>s.assembleLimit) {this.change(b,s,'done','Düzen kurulamadı; normal muharebe.');continue;}
      } else if(s.phase==='wait') {
        // Four sector candidates maximum. A protected central archer must not
        // hide an exposed wing; the chosen opportunity stays fixed during charge.
        let target=null;
        for(const candidate of front.candidates) {
          this.stats.scanned+=enemies.length;
          if(this.exposed(s,candidate,enemies)&&(!target||distance(candidate,this.point(s,s.advance,0))<distance(target,this.point(s,s.advance,0))))target=candidate;
        }
        if(target){s.chargeTarget=target;this.change(b,s,'charge');}
        else if(age>(underFire?2:6)) {
          s.flankAll=true;
          // French cavalry already has separate approach lanes on both wings.
          // Do not send the opposite wing across its own infantry and bows.
          s.flank=kind==='opportunity'?s.formationGeometry.lead:this.chooseFlank(b,s,front,members.filter(m=>!m.auxiliary));
          if(s.flank!==null)this.change(b,s,'flank','Korunan cephe yerine açık kanada yaklaşılıyor.');
          else if(age>18){this.change(b,s,'done','Kanat yolu açılamadı; birlikler yerel muharebeye geçiyor.');continue;}
        }
      } else if(s.phase==='charge'&&age>6&&members.some(m=>m.engaged&&!m.auxiliary)) {this.change(b,s,'done','Temas kuran süvari yerel muharebeye geçti.');continue;}
      else if(s.phase==='hold') {
        if(age>=2&&(underFire||b.tactics?.strategy?.plans.get(s.armyId)?.kind==='close'||(s.braced&&front.cavalry<front.count*.25)))this.change(b,s,'execute','Savunma hattı rakibe yaklaşmak için ilerliyor.');
        else if(age>20&&front.meleeNearest>180)this.change(b,s,'execute','Rakip yaklaşmıyor; savunma hattı birlikte mesafe kapatıyor.');
      }
      else if(s.phase==='reserve') {
        const engaged=members.some(m=>m.role==='front'&&m.unit.target?.hp>0&&distance(m.unit,m.unit.target)<m.unit.combatProfile.config.reach+18);
        if(engaged||counterFront) {
          s.flankAll=counterFront;
          s.flank=this.chooseFlank(b,s,front,members.filter(m=>!m.auxiliary&&(s.flankAll||m.role==='reserve')));
          if(s.flank!==null)this.change(b,s,'flank');
        }
      }
      if(s.phase==='charge') {
        this.stats.scanned+=enemies.length;
        if(!combatant(s.chargeTarget)||!this.exposed(s,s.chargeTarget,enemies)) {
          this.change(b,s,'wait','Hücum fırsatı kapandı; hedefler yeniden değerlendiriliyor.');
        }
        for(const m of s.phase==='charge'?members.filter(m=>!m.auxiliary):[]) {
          if(!m.unit.target||!combatant(m.unit.target)||distance(m.unit,m.unit.target)>m.unit.combatProfile.config.reach+18) {
            m.unit.target=s.chargeTarget;m.unit.retarget=.6;
          }
        }
      }
      if(kind==='pikes'&&s.phase==='execute'&&front.cavalry>=front.count*.35&&front.meleeNearest<180&&!underFire) {
        s.braced=true;this.change(b,s,'hold','Yaklaşan süvariye karşı mızrak hattı korunuyor.');
      }
      if(kind==='crossbows'&&s.phase==='execute'&&front.meleeNearest<155)this.change(b,s,'fallback');
      const cavalryPlan=kind==='opportunity'||kind==='reserve';
      if(['execute','fallback'].includes(s.phase)||(cavalryPlan&&['wait','reserve','charge','flank'].includes(s.phase))) {
        let stop=kind==='screen'?140:kind==='yari'?110:kind==='crossbows'?85:kind==='wings'?170:35;
        if((underFire||b.tactics?.strategy?.plans.get(s.armyId)?.kind==='close')&&front.meleeNearest>100)stop=35;
        // A formation advances at the pace of its ranks, not an invisible
        // timer-driven anchor. Flanking horses do not hold back the bow centre.
        // Cavalry can maneuver independently, but its infantry and missile
        // support must keep closing. Waiting for flanking horses strands the
        // supporting line at its opening positions.
        const supporting=members.filter(m=>m.auxiliary&&!m.engaged&&!m.supportCommitted&&!m.preparationReleased);
        const foot=supporting.filter(m=>!m.unit.combatProfile.ranged);
        const line=cavalryPlan?(foot.length?foot:supporting):members.filter(m=>!m.auxiliary&&(kind!=='wings'||m.role==='bow'));
        const ready=line.filter(m=>m.engaged||distance(m.unit,m.goal||this.point(s,m.f+s.advance,m.a))<40).length;
        if(front.nearest>stop&&ready>=line.length*.6) s.advance+=Math.min(s.speed*.5*.85,front.nearest-stop);
      }
      s.advanceProgressAt??=b.time;
      if(s.advance>(s.lastAdvance||0)+1){s.lastAdvance=s.advance;s.advanceProgressAt=b.time;}
      const goals=[];
      for(const m of members) {
        // Once melee begins, preserve the local fight rather than pulling a
        // soldier back to an obsolete slot between successive weapon swings.
        if(m.supportCommitted||m.preparationReleased||(m.engaged&&s.phase!=='hold'))continue;
        // Once the line is fighting, ready melee ranks fill gaps through local
        // targeting. A single enemy beside/behind the anchor must not freeze
        // every rear rank at its original slot while the front dies.
        if((['execute','fallback'].includes(s.phase)||(cavalryPlan&&m.auxiliary&&['reserve','wait','charge','flank'].includes(s.phase)))&&kind!=='wings'&&!m.unit.combatProfile.ranged&&
          ((s.contactAt!==undefined&&b.time-s.contactAt>=2)||(underFire&&b.time-s.advanceProgressAt>=3)||
            (cavalryPlan&&m.auxiliary&&b.time-(m.unit.lastMissileDamage??-Infinity)<2))&&
          distance(m.unit,m.goal||this.point(s,m.f+s.advance,m.a))<40) {
          m.engaged=true;m.rankReleasedAt=b.time;continue;
        }
        let f=m.f+s.advance,a=m.a,retreat=false;
        if(!m.auxiliary&&(s.phase==='charge'||(s.phase==='reserve'&&m.role==='front'&&!counterFront)||(s.phase==='flank'&&m.role==='front'&&!s.flankAll)))continue;
        if(kind==='wings'&&s.phase==='execute'&&m.role==='reserve') {
          // Reserve joins once the front is engaged; imminent danger is
          // handled earlier by reinforceLine, without waiting for this timer.
          if(s.contactAt!==undefined&&b.time-s.contactAt>=2) {m.rankReleasedAt=b.time;m.engaged=true;continue;}
        }
        if(kind==='wings'&&s.phase==='execute'&&['left','right'].includes(m.role)&&
          (m.maneuver||front.nearest<=220||contact||underFire)) {
          const sign=m.role==='left'?-1:1;
          m.maneuver ||= { a:sign*Math.max(m.wingCenter||140,front.width+65)+(m.a-sign*(m.wingCenter||110)), f:s.advance+Math.max(20,front.nearest)+20, started:b.time, progressed:b.time, best:Infinity };
          a=m.maneuver.a;
          // Without a usable flank corridor, let local combat choose a target
          // instead of waiting indefinitely at a blocked maneuver point.
          m.flankBlocked=!this.inside(b,this.point(s,m.maneuver.f,a),s.armyId,m.unit.combatProfile.radius)||!this.inside(b,this.point(s,m.f+s.advance,a),s.armyId,m.unit.combatProfile.radius);
          if(m.flankBlocked){m.rounded=true;continue;}
          if(Math.abs(across(m.unit,s)-a)<20)m.cleared=true;
          f=m.cleared?m.maneuver.f:m.f+s.advance;
          if(m.cleared&&!m.flankBlocked&&distance(m.unit,this.point(s,f,a))<30)m.rounded=true;
          if(m.rounded)continue;
        }
        if(s.phase==='flank'&&!m.auxiliary&&(m.role==='reserve'||s.flankAll)) {
          m.maneuver ||= { f:s.advance+Math.max(35,front.nearest)+25, started:b.time, progressed:b.time, best:Infinity };
          a=kind==='opportunity'
            ?m.wingSide*Math.max(Math.abs(m.wingCenter),front.width+65)+m.a-m.wingCenter
            :s.flank+(m.role==='reserve'?m.a-60:m.a);
          if(!this.inside(b,this.point(s,m.maneuver.f,a),s.armyId,m.unit.combatProfile.radius)) {m.rounded=true;continue;}
          // Clear the front sideways before advancing; do not cut diagonally
          // through pikes. The chosen side stays fixed for the maneuver.
          if(Math.abs(across(m.unit,s)-a)<28)m.cleared=true;
          f=m.cleared?m.maneuver.f:m.f+s.advance;
          if(m.cleared&&distance(m.unit,this.point(s,f,a))<30)m.rounded=true;
          if(m.rounded)continue;
        }
        if(kind==='crossbows'&&s.phase==='fallback'&&m.role==='bow') { f=s.advance-45-Math.max(0,60-m.f);retreat=true; }
        if(kind==='yari'&&s.phase==='execute'&&front.meleeNearest<130&&!m.auxiliary) {
          if(m.role==='bow'){f=m.f+s.advance-25;retreat=true;}else f+=35;
        }
        const goal=this.point(s,f,a);
        if(m.maneuver) {
          const remaining=distance(m.unit,goal)+(m.cleared?0:Math.abs(m.maneuver.f-f));
          if(remaining<m.maneuver.best-3){m.maneuver.best=remaining;m.maneuver.progressed=b.time;}
          if(b.time-m.maneuver.progressed>6||b.time-m.maneuver.started>24){m.rounded=true;continue;}
        }
        m.goal=goal;
        goals.push([m.unit.id,{goal,retreat,member:m}]);
      }
      if(goals.some(([,intent])=>!this.inside(b,intent.goal,s.armyId,intent.member.unit.combatProfile.radius))) {fallbackArmy(b,s.armyId);this.change(b,s,'done','Manevra alanı daraldı; cephe düzenine geçiliyor.');continue;}
      for(const [id,intent] of goals)this.intents.set(id,intent);
    }
  }
  steer(b,u,target,dt) {
    if(!free(u))return false;
    const s=this.armies.get(armyIdentity(u)),intent=this.intents.get(u.id);
    if(!s||s.phase==='done'||!intent||activeCommander(b,u.team,s.armyId)!==s.commander||!commanderSupportsDoctrine(b,u.team,s.profile.id,s.armyId))return false;
    const cfg=u.combatProfile.config,ranged=u.combatProfile.ranged,d=distance(u,target);
    const enemyReach=target.combatProfile?.ranged?0:target.combatProfile?.config.reach||0;
    if(intent.member.auxiliary&&ranged&&d<=cfg.reach)return false;
    if(s.phase==='hold'&&!ranged) {
      // Fight at the line and permit a short local step into weapon range.
      // A retreating target must not drag the whole defensive formation away.
      u.charge=null;
      if(u.attack>0){u.speed=0;u.runDistance=0;return true;}
      const leash=Math.max(40,cfg.reach+18);
      if(d<=cfg.reach&&b.clearShot(u,target,false)) {
        u.speed=0;u.runDistance=0;b.turn(u,target,dt);
        const facing=((target.x-u.x)*u.headingX+(target.y-u.y)*u.headingY)/Math.max(1,d);
        if(u.cooldown<=0&&facing>.35)b.attack(u,target,d);
      } else if(distance(target,intent.goal)<=leash+cfg.reach&&distance(u,intent.goal)<leash) b.walk(u,target,cfg.speed,dt);
      else if(distance(u,intent.goal)>7)b.walk(u,intent.goal,cfg.speed,dt);
      else {u.speed=0;u.runDistance=0;b.turn(u,target,dt);}
      return true;
    }
    if(u.charge||(!ranged&&!intent.retreat&&d<=Math.max(cfg.reach+6,enemyReach+12))) {
      intent.member.engaged=true;
      this.intents.delete(u.id);
      return false;
    }
    if(!intent.retreat&&d<=(ranged?30:cfg.reach+6))return false;
    u.charge=null;
    if(u.attack>0)return true;
    if(distance(u,intent.goal)>7)b.walk(u,intent.goal,cfg.speed,dt);
    else {u.speed=0;u.runDistance=0;b.turn(u,target,dt);}
    if(ranged&&d<=cfg.reach&&d>20&&u.cooldown<=0&&b.clearShot(u,target))b.attack(u,target,d);
    return true;
  }
}
