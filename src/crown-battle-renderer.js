import { WORLD, roleOf } from './crown-battle.js';
import { visualScaleOf } from './crown-battle-visual-scale.js';
import { middleEarthArtRevision } from './middle-earth-painted-art.js';
import { SpriteLibrary } from './crown-battle-art.js';
import { makePCScene, makeContactShadow } from './crown-battle-pc-scene.js';
import { BattleSpriteCache } from './crown-battle-sprite-cache.js';
import { BattleSpriteBatch } from './crown-battle-sprite-batch.js';
import { battleMap, makeBattleMap } from './crown-battle-maps.js';
import { drawCombatEffect, combatOffset, isGroundEffect } from './crown-battle-feedback.js';
import { combatPose, drawPosedSprite } from './crown-battle-combat-motion.js';
import { drawProjectile, projectilePose } from './crown-battle-projectiles.js';
import { TacticalVisuals, tacticalPhaseLabel, hasChargePose, soldierAction, soldierFrame } from './crown-battle-tactical-visuals.js';
export class BattleRenderer {
  constructor(canvas, battle, { sprites, terrain, mapId = 'classic' } = {}) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.sprites = sprites || new SpriteLibrary(); this.mapId = battleMap(mapId).id; this.landscape = false; this.spriteScaleX = this.spriteScaleY = 1; this.reset(battle, terrain); }
  reset(battle, terrain) { this.battle = battle; this.finishStarted = null; this.combatTime = battle.time; battle.setMap(this.mapId); this.box = null; this.formationPreview = null; this.terrain = terrain || this.makeMapTerrain(); this.pcScene = null; this.clampView(); this.invalidate(); }
  makeMapTerrain() { return makeBattleMap(this.battle.seed, this.mapId === 'classic' && this.battle.preset === 'flank' ? 'steppe' : this.mapId); }
  setMap(id) {
    const next = battleMap(id).id;
    if (next === this.mapId) return;
    this.mapId = next; this.battle.setMap(next); this.terrain = this.makeMapTerrain(); this.pcScene = null; this.formationPreview = null; this.invalidate();
  }
  resize(width, height, landscape, pixelRatio = 1) {
    this.invalidate();
    this.viewport = { width, height, landscape, pixelRatio };
    this.landscape = landscape;
    this.pixelRatio = landscape ? Math.min(2, pixelRatio, this.performanceRatio ?? 2, this.battle.units.length > 800 ? 1 : 2) : 1;
    this.canvas.width = landscape ? Math.max(1, Math.round(width * this.pixelRatio)) : 1080;
    this.canvas.height = landscape ? Math.max(1, Math.round(height * this.pixelRatio)) : 1920;
    this.pcScene = null;
    // A wider screen reveals more world; it must not stretch troop spacing.
    // Sprites and tactical geometry use the same world scale at every size.
    this.spriteScaleX = this.spriteScaleY = 1;
    this.clampView();
  }
  adaptPerformance(frameMs) {
    if (!this.landscape || !this.viewport || this.pixelRatio <= 1) return;
    this.performanceFrames = (this.performanceFrames || 0) + 1;
    this.performanceTime = (this.performanceTime || 0) + Math.min(100, frameMs);
    const crowded = this.battle.units.length > 800;
    if (!crowded && this.performanceFrames < 30) return;
    const slow = this.performanceTime / this.performanceFrames > 40;
    this.performanceTime = this.performanceFrames = 0;
    if (!crowded && !slow) return;
    // Only lower during a session: alternating sharp/soft frames and repeated
    // terrain rebuilds would create another source of stutter. Export is separate.
    this.performanceRatio = crowded ? 1 : Math.max(1, this.pixelRatio - .5);
    const {width,height,landscape,pixelRatio} = this.viewport;
    this.resize(width,height,landscape,pixelRatio);
  }
  atUnit(x, y, size=1) { this.ctx.translate(x, y); this.ctx.scale(this.spriteScaleX*size, this.spriteScaleY*size); }
  revision = 0;
  drawCount = 0;
  invalidate() { this.cancelRender(); this.revision++; }
  cancelRender() {
    if (!this.pendingRender) return;
    this.pendingRender.work.return();
    this.pendingRender = null;
    this.sprites.endFrame();
  }
  advanceRender() {
    const job = this.pendingRender, started = performance.now();
    const ctx = this.ctx, under = this.underCanvas;
    let result;
    try {
      this.ctx = this.renderScratch.getContext('2d'); this.underCanvas = this.underScratch;
      do { result = job.work.next(); } while (!result.done && performance.now() - started < 4);
    } finally { this.ctx = ctx; this.underCanvas = under; }
    job.cost += performance.now() - started;
    if (!result.done) { this.spriteBatch?.animate(); return true; }
    this.pendingRender = null;
    // Publish the complete overlay together with the new GPU geometry. The
    // displayed canvases are never cleared while the next frame is preparing.
    for (const [target, source] of [[this.canvas,this.renderScratch],[under,this.underScratch]]) {
      const out = target.getContext('2d');
      out.setTransform(1,0,0,1,0,0); out.clearRect(0,0,target.width,target.height); out.drawImage(source,0,0);
    }
    this.drawCost = job.cost; this.lastDrawKey = job.key; this.lastViewKey = job.viewKey; this.lastDrawAt = job.started;
    return true;
  }
  enableLayers() { this.layered = true; this.invalidate(); }
  prepareBatch() {
    if (!this.spriteBatch && !this.batchUnavailable && this.spriteBatchEnabled !== false) {
      try { this.spriteBatch = new BattleSpriteBatch(); }
      catch { this.batchUnavailable = true; }
    }
  }
  prepareBattle() {
    if (!this.landscape || !this.battle.units.length || this.battle.time > 0) return;
    if (this.warmBattle !== this.battle || this.warmCount !== this.battle.units.length || this.warmRevision !== middleEarthArtRevision) {
      this.warmBattle = this.battle; this.warmCount = this.battle.units.length; this.warmRevision = middleEarthArtRevision;
      const families = new Map();
      for (const u of this.battle.units) {
        const variant = this.sprites.variantOf(u.type, u.id % 3);
        families.set(`${u.type}/${u.team}/${variant}`, { type:u.type, team:u.team, variant, size:visualScaleOf(u), horse:['cavalry','elephant'].includes(roleOf(u)) });
      }
      this.warmJobs = [];
      for (let frame=0; frame<8; frame++) for (const action of ['walk','attack'])
        for (const family of families.values()) {
          this.warmJobs.push({...family, frame, action});
        }
      for (const family of families.values()) {
        this.warmJobs.push({...family, frame:0, action:'idle'});
        if (hasChargePose(family.type)) for (let frame=0; frame<8; frame++)
          for (const action of ['charge-ready','charge']) this.warmJobs.push({...family, frame, action});
      }
      this.warmIndex = 0;
    }
    if (this.warmIndex >= this.warmJobs.length) return;
    // Leave atlas room for the poses actually used in combat. Speculative
    // warm-up used to evict visible poses and then rebuild them every idle RAF.
    if (this.spriteCache?.pages.length >= 12) {
      this.warmIndex = this.warmJobs.length;
      return;
    }
    // One shared pose per idle frame, before battle starts. Never advance the
    // simulation, and never fill the live atlas with unlimited speculative art.
    this.prepareBatch();
    const job = this.warmJobs[this.warmIndex++];
    const sourceDeferred = this.sprites.deferred, atlasDeferred = this.spriteCache?.deferred;
    this.sprites.beginFrame();
    const source = this.sprites.get(job.type,job.team,job.frame,job.action,job.variant);
    this.sprites.endFrame();
    this.spriteCache ||= new BattleSpriteCache(); this.contactShadow ||= makeContactShadow();
    this.spriteCache.beginFrame(this.cacheResolution || 1);
    for (const face of [-1,1]) this.spriteCache.get(source,face,job.horse,this.sourceResolution(source,job.size),this.contactShadow);
    this.spriteBatch?.uploadPages(this.spriteCache.pages);
    // Preparing future movement poses must not change the paused redraw queue.
    this.sprites.deferred = sourceDeferred; this.spriteCache.deferred = atlasDeferred;
  }
  prepareLayers() {
    const active = this.layered && this.landscape && this.canvas.isConnected;
    if (active && !this.groundCanvas) {
      this.groundCanvas = document.createElement('canvas');
      this.groundCanvas.setAttribute('aria-hidden', 'true');
      this.groundCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
      this.canvas.before(this.groundCanvas); this.canvas.style.zIndex = '1';
      this.underCanvas = document.createElement('canvas');
      this.underCanvas.setAttribute('aria-hidden','true');
      this.underCanvas.style.cssText = this.groundCanvas.style.cssText;
      this.canvas.before(this.underCanvas);
    }
    for (const layer of [this.groundCanvas,this.underCanvas]) if (layer) layer.style.display = active ? 'block' : 'none';
    if (!active && this.spriteBatch?.canvas.parentNode) this.spriteBatch.canvas.style.display = 'none';
    this.layersActive = active;
    if (active && (this.groundCanvas.width !== this.canvas.width || this.groundCanvas.height !== this.canvas.height)) {
      this.groundCanvas.width = this.canvas.width; this.groundCanvas.height = this.canvas.height;
      this.underCanvas.width = this.canvas.width; this.underCanvas.height = this.canvas.height;
      this.groundKey = null;
    }
    if (active) {
      const under = this.underCanvas.getContext('2d');
      under.setTransform(1,0,0,1,0,0); under.clearRect(0,0,this.canvas.width,this.canvas.height);
    }
  }
  renderIfNeeded({ running = false } = {}) {
    const v = this.view, box = this.box;
    const now = performance.now();
    const viewKey = `${this.revision}:${running}:${v.x}:${v.y}:${v.zoom}:${this.canvas.width}:${this.canvas.height}:${box?.a.x}:${box?.a.y}:${box?.z.x}:${box?.z.y}`;
    const lost = this.spriteBatch?.canvas?.parentNode && this.spriteBatch.canvas.style.display !== 'none'
      && (!this.spriteBatch.gl || this.spriteBatch.gl.isContextLost());
    if (this.pendingRender) {
      if (viewKey === this.pendingRender.viewKey && this.spriteBatch?.gl && !lost) return this.advanceRender();
      this.cancelRender();
    }
    // Refresh costly poses/overlays less often, but animate the uploaded GPU
    // soldiers between refreshes. Camera and pause changes bypass interpolation.
    const crowded = running && this.battle.units.length >= 2500;
    const sliced = crowded && this.layersActive && this.spriteBatch?.gl && !lost && viewKey === this.lastViewKey;
    const drawInterval = sliced ? 1000 / 30 : Math.max(1000 / 30, Math.min(150, (this.drawCost || 0) * 3));
    if (!lost && crowded && viewKey === this.lastViewKey && now - this.lastDrawAt < drawInterval - .5) return this.spriteBatch?.animate(now) || false;
    // A sliced tick can span many display frames. Replacing its unchanged
    // positions each slice repeatedly restarts movement and makes ranks stop
    // between updates. Publish once per completed tick and bridge its cadence.
    // Slow crowd ticks can exceed 500 ms. Keep interpolating until the next
    // measured tick instead of stopping every soldier midway through the wait.
    this.motionInterval = crowded && viewKey === this.lastViewKey
      ? Math.max(drawInterval, Math.min(2000, this.battle.completedStepInterval || 0)) : 0;
    this.updateCombatTime();
    const simulationKey = crowded ? this.battle.completedSimulationRevision || 0 : this.battle.simulationRevision || 0;
    const poseTime = crowded ? 0 : this.combatTime;
    const key = `${middleEarthArtRevision}:${this.revision}:${simulationKey}:${poseTime}:${running}:${v.x}:${v.y}:${v.zoom}:${this.canvas.width}:${this.canvas.height}:${box?.a.x}:${box?.a.y}:${box?.z.x}:${box?.z.y}`;
    // A missing cached pose can wait for the next completed crowd tick. A
    // second rebuild of identical positions wastes the frame budget and
    // restarts interpolation before soldiers reach their current destination.
    if (!lost && key === this.lastDrawKey && (crowded || (!this.sprites.deferred && !this.spriteCache?.deferred))) return running && this.spriteBatch?.animate(now) || false;
    if (sliced) {
      this.renderScratch ||= document.createElement('canvas'); this.underScratch ||= document.createElement('canvas');
      for (const scratch of [this.renderScratch,this.underScratch]) { scratch.width = this.canvas.width; scratch.height = this.canvas.height; }
      this.pendingRender = {work:this.renderBatches({running},true),key,viewKey,started:now,cost:0};
      return this.advanceRender();
    }
    this.render({ running });
    const cost = performance.now() - now;
    this.drawCost = this.drawCost === undefined ? cost : this.drawCost * .8 + cost * .2;
    this.lastDrawKey = key; this.lastViewKey = viewKey; this.lastDrawAt = now; return true;
  }
  updateCombatTime(now = performance.now()) {
    // Pausing freezes every pose. Only a completed battle gets a short visual
    // tail, so the last casualty can land without changing simulation results.
    if (this.battle.winner === null) this.finishStarted = null;
    else this.finishStarted ??= now;
    this.combatTime = this.battle.time + (this.finishStarted === null ? 0 : Math.min(1.4, Math.max(0, (now - this.finishStarted) / 1000)));
  }
  view = { x: WORLD.width / 2, y: WORLD.height / 2, zoom: 1 };
  get bounds() { return this.battle.bounds || { left: 0, right: WORLD.width, top: 0, bottom: WORLD.height }; }
  get viewWidth() { return this.landscape ? WORLD.height * this.canvas.width / this.canvas.height : WORLD.width; }
  get viewHeight() { return WORLD.height; }
  get minZoom() { const b = this.bounds; return Math.min(1, this.viewWidth / (b.right - b.left), this.viewHeight / (b.bottom - b.top)); }
  screenToWorld(x, y) { return { x: this.view.x + (x - .5) * this.viewWidth / this.view.zoom, y: this.view.y + (y - .5) * this.viewHeight / this.view.zoom }; }
  clampView() {
    const b = this.bounds;
    this.view.zoom = Math.max(this.minZoom, Math.min(3, this.view.zoom));
    const halfX = this.viewWidth / this.view.zoom / 2, halfY = this.viewHeight / this.view.zoom / 2;
    this.view.x = halfX * 2 >= b.right - b.left ? (b.left + b.right) / 2 : Math.max(b.left + halfX, Math.min(b.right - halfX, this.view.x));
    this.view.y = halfY * 2 >= b.bottom - b.top ? (b.top + b.bottom) / 2 : Math.max(b.top + halfY, Math.min(b.bottom - halfY, this.view.y));
  }
  zoomAt(factor, x = .5, y = .5) {
    const before = this.screenToWorld(x, y);
    this.view.zoom = Math.max(this.minZoom, Math.min(3, this.view.zoom * factor));
    const after = this.screenToWorld(x, y);
    this.view.x += before.x - after.x; this.view.y += before.y - after.y; this.clampView();
  }
  pan(dx, dy) { this.view.x -= dx * this.viewWidth / this.view.zoom; this.view.y -= dy * this.viewHeight / this.view.zoom; this.clampView(); }
  resetView() { this.view = { x: WORLD.width / 2, y: WORLD.height / 2, zoom: 1 }; }
  fitMap() { const b = this.bounds; this.view = { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2, zoom: this.minZoom }; }
  spriteFamily(u) {
    this.unitFamilies ||= new WeakMap();
    let family = this.unitFamilies.get(u);
    if (family && family.type === u.type && family.team === u.team && family.id === u.id) return family;
    const variant = this.sprites.variantOf(u.type,u.id%3), base = `${u.type}/${u.team}/${variant}`;
    this.spriteFamilies ||= new Map();
    let poses = this.spriteFamilies.get(base);
    if (!poses) {
      poses = {};
      for (const face of [-1,1]) {
        const identity = `${base}/${face}`, keys = {};
        for (const action of ['idle','walk','attack','charge-ready','charge','fallen'])
          keys[action] = Array.from({length:8},(_,frame)=>`${identity}/${action}/${frame}`);
        poses[face] = { identity, fallenIdentity: `${identity}/fallen`, keys };
      }
      this.spriteFamilies.set(base,poses);
    }
    const role = roleOf(u);
    family = {type:u.type, team:u.team, id:u.id, horse:role==='cavalry'||role==='elephant', chargePose:hasChargePose(u.type), size:visualScaleOf(u), poses};
    this.unitFamilies.set(u,family);
    return family;
  }
  spriteIdentity(u) { const pose = this.spriteFamily(u).poses[u.face]; return u.hp <= 0 ? pose.fallenIdentity : pose.identity; }
  spriteDensity(size = 1) {
    // Match screen coverage, including small armies. A fixed 4x minimum made
    // their overview tiles larger than close-ups of a crowded battlefield.
    let density = 1.5 * Math.max(1, size);
    const displayed = this.spriteScaleX * this.canvas.width / this.viewWidth * this.view.zoom * size;
    // Promote only at meaningful magnification. Coarse tiers avoid filling the
    // bounded atlas with almost-identical tiles during small camera movements.
    while (displayed > density * 1.5 && density < 6) density *= 2;
    return Math.min(6, density);
  }
  sourceResolution(source, size = 1) {
    return Math.max(1, Math.min(this.spriteDensity(size), source.width / 80, source.height / 76));
  }
  cachedSprite(u) {
    const b = this.battle, family = this.spriteFamily(u), horse = family.horse;
    const action = soldierAction(u, family.chargePose);
    const frame = soldierFrame(u, action, b.time);
    const pose = family.poses[u.face], identity = u.hp <= 0 ? pose.fallenIdentity : pose.identity;
    const key = pose.keys[u.hp <= 0 ? 'fallen' : action][frame];
    // A formation shares poses. Resolve each pose once per draw instead of
    // repeating library lookups, fallback checks and allocation per soldier.
    const shared = this.framePoses?.get(key);
    if (shared) { shared.page.lastUsed = this.spriteCache.frame; return shared; }
    const retained = this.readyPoses?.get(key);
    if (retained && this.spriteCache.pages.includes(retained.page)) { retained.page.lastUsed = this.spriteCache.frame; this.framePoses?.set(key, retained); return retained; }
    if (retained) this.readyPoses.delete(key);
    this.spriteCache ||= new BattleSpriteCache(); this.contactShadow ||= makeContactShadow();
    const source = this.sprites.get(u.type,u.team,frame,action,u.id%3);
    const entry = this.spriteCache.get(source,u.face,horse,this.sourceResolution(source,family.size),u.hp <= 0 ? null : this.contactShadow);
    this.readySprites ||= new Map();
    if (entry) {
      this.readySprites.set(identity, entry); this.framePoses?.set(key,entry);
      // A budget fallback must never become the permanent animation frame.
      if (entry.resolution >= this.sourceResolution(source,family.size) && this.sprites.isExactPose?.(source, frame, action)) this.readyPoses?.set(key, entry);
      return entry;
    }
    const ready = this.readySprites.get(identity);
    if (ready && this.spriteCache.pages.includes(ready.page)) {
      ready.page.lastUsed = this.spriteCache.frame; this.framePoses?.set(key,ready); return ready;
    }
    return null;
  }
  soldier(u) {
    if (u.removed) return;
    const ctx = this.ctx, b = this.battle, horse = ['cavalry','elephant'].includes(roleOf(u)), selected = b.selected.has(u.id);
    if (this.landscape && u.hp > 0 && !u.commanderId && this.frameSprites.get(u)) {
      const entry = this.frameSprites.get(u);
      if (selected) {
        ctx.save(); this.atUnit(u.x,u.y,visualScaleOf(u)); ctx.fillStyle='#e6d58e25';ctx.strokeStyle='#ffe5a0';ctx.lineWidth=1.25;
        ctx.beginPath();ctx.ellipse(0,1,horse?17:8,horse?5:3,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
      }
      const size=visualScaleOf(u);
      if (u.moving || u.attack > 0 || u.flash > 0 || u.stagger > 0) {
        ctx.save(); this.atUnit(u.x,u.y,size); this.drawCombatSprite(u, entry); ctx.restore();
      } else ctx.drawImage(entry.canvas,entry.x,entry.y,entry.width,entry.height,u.x+(entry.offsetX+combatOffset(u))*this.spriteScaleX*size,u.y+entry.offsetY*this.spriteScaleY*size,entry.width/entry.resolution*this.spriteScaleX*size,entry.height/entry.resolution*this.spriteScaleY*size);
      if (selected && u.hp < u.maxHp) {
        ctx.save(); this.atUnit(u.x,u.y,visualScaleOf(u));
        if (selected && u.hp < u.maxHp) { ctx.fillStyle='#192e29';ctx.fillRect(-6,-(horse?47:30),12,2);ctx.fillStyle='#c7d696';ctx.fillRect(-6,-(horse?47:30),12*u.hp/u.maxHp,2); }
        ctx.restore();
      }
      return;
    }
    ctx.save(); this.atUnit(u.x, u.y,visualScaleOf(u));
    if (u.hp <= 0) {
      const entry = this.landscape && this.frameSprites?.get(u);
      this.drawCombatSprite(u, entry || null);
      ctx.restore(); return;
    }
    if (this.landscape && this.detailedShadows) {
      this.contactShadow ||= makeContactShadow();
      const radius = horse ? 25 : 13;
      ctx.drawImage(this.contactShadow, 4 - radius, -3, radius * 2, horse ? 13 : 9);
    } else {
      ctx.fillStyle = '#16231c45'; ctx.beginPath(); ctx.ellipse(5,2,horse?17:9,horse?4.5:3,.2,0,Math.PI*2); ctx.fill();
    }
    if(selected) { ctx.fillStyle='#e6d58e25';ctx.strokeStyle='#ffe5a0';ctx.lineWidth=1.25;ctx.beginPath();ctx.ellipse(0,1,horse?17:8,horse?5:3,0,0,Math.PI*2);ctx.fill();ctx.stroke(); }
    if(u.moving && (horse || u.id%4===0)) {
      for(let i=0;i<3;i++) { const age=((b.time*(u.charge?2.5:1.3)+u.phase+i*.33)%1);ctx.fillStyle='rgba(211,194,144,'+((1-age)*(u.charge?.17:.07))+')';ctx.beginPath();ctx.ellipse(-u.face*(age*20+5),2+i,2+age*5,1+age*2,0,0,Math.PI*2);ctx.fill(); }
    }
    this.drawCombatSprite(u);
    ctx.scale(u.face,1);
    if (u.commanderId) {
      // Gold sash and pennant identify a commander; no claim of exact period dress.
      ctx.strokeStyle = '#f3d77e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-4,-31); ctx.lineTo(5,-25); ctx.stroke();
      ctx.fillStyle = '#d9bd67'; ctx.fillRect(-13,-52,1.5,46);
      ctx.fillStyle = u.team ? '#943f3b' : '#32768c';
      ctx.beginPath(); ctx.moveTo(-11,-52); ctx.lineTo(8,-48); ctx.lineTo(-11,-39); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f3d77e'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.restore();
    if(selected && u.hp<u.maxHp) {ctx.save();this.atUnit(u.x,u.y,visualScaleOf(u));ctx.fillStyle='#192e29';ctx.fillRect(-6,-(horse?47:30),12,2);ctx.fillStyle='#c7d696';ctx.fillRect(-6,-(horse?47:30),12*u.hp/u.maxHp,2);ctx.restore();}
  }
  drawCombatSprite(u, entry = null) {
    this.combatPose ||= {}; this.combatRows ||= new Float64Array(15);
    const pose = combatPose(u, this.combatTime ?? this.battle.time, combatOffset(u), this.combatPose);
    if (!entry) {
      const action = soldierAction(u);
      const frame = soldierFrame(u, action, this.battle.time);
      const source = this.sprites.get(u.type,u.team,frame,action,u.id%3);
      // The unbatched portrait path reflects texture coordinates, not the
      // world-space impulse: a soldier facing left still falls away from a hit.
      this.ctx.save(); this.ctx.scale(u.face,1);
      pose.b *= u.face; pose.c *= u.face; pose.x *= u.face; pose.direction *= u.face;
      drawPosedSprite(this.ctx,{canvas:source,x:0,y:0,width:source.width,height:source.height,resolution:source.width/80,offsetX:-30,offsetY:-61},pose,this.combatRows);
      this.ctx.restore(); return;
    }
    drawPosedSprite(this.ctx,entry,pose,this.combatRows);
  }
  batchSelection(u) {
    if (!this.battle.selected.has(u.id)) return;
    const ctx = this.ctx, horse = ['cavalry', 'elephant'].includes(roleOf(u));
    ctx.save(); this.atUnit(u.x, u.y,visualScaleOf(u)); ctx.fillStyle = '#e6d58e25'; ctx.strokeStyle = '#ffe5a0'; ctx.lineWidth = 1.25;
    ctx.beginPath(); ctx.ellipse(0, 1, horse ? 17 : 8, horse ? 5 : 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  batchOverlay(u) {
    const selected = this.battle.selected.has(u.id);
    if (!u.commanderId && !(selected && u.hp < u.maxHp)) return;
    const ctx = this.ctx, horse = ['cavalry', 'elephant'].includes(roleOf(u));
    ctx.save(); this.atUnit(u.x, u.y,visualScaleOf(u));
    if (selected && u.hp < u.maxHp) { ctx.fillStyle = '#192e29'; ctx.fillRect(-6, -(horse ? 47 : 30), 12, 2); ctx.fillStyle = '#c7d696'; ctx.fillRect(-6, -(horse ? 47 : 30), 12 * u.hp / u.maxHp, 2); }
    if (u.commanderId) {
      ctx.scale(u.face, 1); ctx.strokeStyle = '#f3d77e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-4, -31); ctx.lineTo(5, -25); ctx.stroke();
      ctx.fillStyle = '#d9bd67'; ctx.fillRect(-13, -52, 1.5, 46); ctx.fillStyle = u.team ? '#943f3b' : '#32768c';
      ctx.beginPath(); ctx.moveTo(-11, -52); ctx.lineTo(8, -48); ctx.lineTo(-11, -39); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#f3d77e'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.restore();
  }
  commanderLabel(u) {
    const ctx = this.ctx, alive = u.hp > 0;
    ctx.save(); ctx.font = 'bold 11px Segoe UI, sans-serif';
    const text = `${u.name}${alive ? '' : ' · DÜŞTÜ'}`, width = Math.min(200, ctx.measureText(text).width + 18);
    const half = width / 2 * this.spriteScaleX;
    const x = Math.max(this.bounds.left + half + 4, Math.min(this.bounds.right - half - 4, u.x));
    const y = Math.max(this.bounds.top + 16, u.y - 60 * this.spriteScaleY * visualScaleOf(u));
    this.atUnit(x, y); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#15211fee'; ctx.fillRect(-width/2,-18,width,32);
    ctx.strokeStyle = alive ? '#dec67a' : '#8c8270'; ctx.lineWidth = 1; ctx.strokeRect(-width/2,-18,width,32);
    ctx.fillStyle = alive ? '#f3df9c' : '#c4b8a2'; ctx.fillText(text,0,-7,width-8);
    ctx.fillStyle = '#583e36'; ctx.fillRect(-width/2+5,3,width-10,4);
    ctx.fillStyle = u.team ? '#d77b69' : '#7bc6cf'; ctx.fillRect(-width/2+5,3,(width-10)*Math.max(0,u.hp/u.maxHp),4);
    ctx.restore();
  }
  banner(u) {
    const ctx = this.ctx, x = -5, y = -14, flutter = Math.sin(this.battle.time * 3 + u.id) * 2;
    ctx.save(); this.atUnit(u.x, u.y,visualScaleOf(u));
    ctx.fillStyle = '#493d26'; ctx.fillRect(x, y - 31, 2, 34); ctx.fillStyle = '#d3c284'; ctx.fillRect(x, y - 33, 2, 2);
    ctx.fillStyle = u.team ? '#843e33' : '#38667a'; ctx.beginPath(); ctx.moveTo(x + 2, y - 30); ctx.lineTo(x + 17, y - 29 + flutter); ctx.lineTo(x + 15, y - 13 + flutter); ctx.lineTo(x + 2, y - 15); ctx.fill();
    ctx.fillStyle = '#d7cba3'; ctx.fillRect(x + 8, y - 26, 2, 8); ctx.fillRect(x + 5, y - 23, 8, 2);
    ctx.restore();
  }
  render({ running = false } = {}) {
    this.cancelRender();
    const work = this.renderBatches({running});
    while (!work.next().done) { /* Synchronous draws for exports and view changes. */ }
  }
  *renderBatches({ running = false } = {}, sliced = false) {
    if (!running) this.motionInterval = 0;
    this.updateCombatTime();
    this.drawCount++;
    this.prepareLayers();
    this.sprites.beginFrame();
    const ctx = this.ctx, b = this.battle;
    const maxResolution = b.units.length > 600 ? 2 : 4;
    this.cacheResolution = Math.max(1, Math.min(maxResolution, Math.ceil(this.spriteScaleX * this.canvas.width / this.viewWidth * this.view.zoom)));
    ctx.setTransform(this.canvas.width / this.viewWidth, 0, 0, this.canvas.height / this.viewHeight, 0, 0);
    ctx.clearRect(0, 0, this.viewWidth, this.viewHeight);
    if (!this.layersActive) { ctx.fillStyle = '#293624'; ctx.fillRect(0, 0, this.viewWidth, this.viewHeight); }
    ctx.save();
    ctx.translate(this.viewWidth / 2, this.viewHeight / 2); ctx.scale(this.view.zoom, this.view.zoom); ctx.translate(-this.view.x, -this.view.y);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const bounds = this.bounds, mapWidth = bounds.right - bounds.left, mapHeight = bounds.bottom - bounds.top;
    if (this.landscape) {
      this.pcScene ||= this.mapId === 'classic'
        ? makePCScene(this.terrain, this.canvas.width / this.pixelRatio * mapWidth / this.viewWidth, this.canvas.height / this.pixelRatio * mapHeight / this.viewHeight, this.pixelRatio, b.seed, b.preset)
        : makeBattleMap(b.seed, this.mapId, this.canvas.width * mapWidth / this.viewWidth, this.canvas.height * mapHeight / this.viewHeight);
      if (this.layersActive) {
        const key = `${this.view.x}/${this.view.y}/${this.view.zoom}`;
        if (this.groundScene !== this.pcScene || this.groundKey !== key) {
          const ground = this.groundCanvas.getContext('2d');
          ground.setTransform(1,0,0,1,0,0); ground.fillStyle = '#293624'; ground.fillRect(0,0,this.canvas.width,this.canvas.height);
          ground.setTransform(ctx.getTransform()); ground.drawImage(this.pcScene,bounds.left,bounds.top,mapWidth,mapHeight);
          this.groundKey = key; this.groundScene = this.pcScene;
        }
      } else ctx.drawImage(this.pcScene, bounds.left, bounds.top, mapWidth, mapHeight);
    } else ctx.drawImage(this.terrain, bounds.left, bounds.top, mapWidth, mapHeight);
    ctx.imageSmoothingEnabled = true;
    const halfX = this.viewWidth / this.view.zoom / 2, halfY = this.viewHeight / this.view.zoom / 2;
    const visible = u => !u.removed && Math.abs(u.x - this.view.x) <= halfX+85*this.spriteScaleX*visualScaleOf(u) && Math.abs(u.y - this.view.y) <= halfY+85*this.spriteScaleY*visualScaleOf(u);
    const under = this.layersActive ? this.underCanvas.getContext('2d') : ctx;
    if (under !== ctx) under.setTransform(ctx.getTransform());
    this.drawBattlefield?.(under, b);
    this.tacticalVisuals ||= new TacticalVisuals();
    this.tacticalVisuals.draw(under, b, this.view.zoom, this.revision);
    for (const e of b.effects) if (e.kind === 'arrow-ground' && visible(e)) drawProjectile(under, e, this.spriteScaleX, this.spriteScaleY);
    for (const effects of [b.effects, b.feedback?.effects || []]) for (const e of effects) if (isGroundEffect(e) && visible(e)) {
      under.save(); under.translate(e.x, e.y); under.scale(this.spriteScaleX * (e.scale || 1), this.spriteScaleY * (e.scale || 1));
      drawCombatEffect(under, e, this.combatTime); under.restore();
    }
    if (sliced) yield;
    let processed = 0;
    const fallen = [], units = [];
    for (const u of b.units) {
      if (visible(u)) (u.hp > 0 ? units : fallen).push(u);
      if (sliced && ++processed % 128 === 0) yield;
    }
    units.sort((a,c) => a.y-c.y);
    if (sliced) yield;
    // Finish texture-page writes before issuing any draws from those pages.
    // Interleaved writes/draws force the browser to flush the entire texture.
    this.frameSprites ||= new Map(); this.frameSprites.clear();
    this.framePoses ||= new Map(); this.framePoses.clear();
    const poseRevision = `${middleEarthArtRevision}/${this.spriteDensity()}`;
    this.readyPoses ||= new Map();
    if (this.poseRevision !== poseRevision) { this.readyPoses.clear(); this.poseRevision = poseRevision; }
    if (this.landscape) {
      this.spriteCache ||= new BattleSpriteCache(); this.spriteCache.beginFrame(this.cacheResolution, 3);
      if (this.readyPageRevision !== this.spriteCache.pageRevision) {
        // A fallback pose must not retain a retired atlas page after eviction.
        const pages = new Set(this.spriteCache.pages);
        for (const [key, entry] of this.readySprites || []) if (!pages.has(entry.page)) this.readySprites.delete(key);
        for (const [key, entry] of this.readyPoses) if (!pages.has(entry.page)) this.readyPoses.delete(key);
        this.readyPageRevision = this.spriteCache.pageRevision;
      }
      // Give a newly visible type/direction priority over another animation pose.
      for (const list of [fallen, units]) for (const u of list) {
        if (sliced && ++processed % 128 === 0) yield;
        const ready = this.readySprites?.get(this.spriteIdentity(u));
        if (!ready || !this.spriteCache.pages.includes(ready.page)) this.cachedSprite(u);
        if (this.spriteCache.remainingMs <= 0) break;
      }
      // Rotate the warm-up order so a busy front rank cannot starve the rest.
      for (const list of [fallen, units]) for (let i = 0; i < list.length; i++) {
        if (sliced && i % 128 === 0) yield;
        const u = list[(i + this.spriteCache.frame * 37) % list.length];
        this.frameSprites.set(u, this.cachedSprite(u));
      }
    }
    // Dense army overviews keep inexpensive contact ellipses; zooming into a
    // smaller group restores the soft shadows without changing unit scale.
    this.detailedShadows = units.length <= 600;
    let batched = false;
    let commitBatch;
    let batchedUnits, batchedFallen;
    if (this.landscape && this.spriteBatchEnabled !== false && (this.spriteBatch?.gl || fallen.length + units.length >= 32)) {
      this.prepareBatch();
      // Selection circles remain below the bodies; combat/commander indicators
      // stay legible above the ordered sprite layer.
      if (this.spriteBatch?.gl) {
        // A newly visible pose must not force the entire army back through
        // Canvas2D. Only the soldiers awaiting an atlas slot use that fallback.
        batchedUnits = units.filter(u => this.frameSprites.get(u));
        batchedFallen = fallen.filter(u => this.frameSprites.get(u));
        for (const u of batchedUnits) {
          this.ctx = under; this.batchSelection(u); this.ctx = ctx;
          if (sliced && ++processed % 128 === 0) yield;
        }
        if (sliced) {
          commitBatch = yield* this.spriteBatch.renderBatches(this, batchedFallen, batchedUnits, combatOffset, true);
          batched = !!commitBatch;
        } else batched = this.spriteBatch.render(this, batchedFallen, batchedUnits, combatOffset);
      }
    }
    if (!batched && this.spriteBatch?.canvas.parentNode) this.spriteBatch.canvas.style.display = 'none';
    if (batched) {
      for (const u of fallen) {
        if (!this.frameSprites.get(u)) this.soldier(u);
        if (sliced && ++processed % 128 === 0) yield;
      }
      for (const u of units) {
        if (sliced && ++processed % 128 === 0) yield;
        if (this.frameSprites.get(u)) this.batchOverlay(u); else this.soldier(u);
        if (u.type === 'sword' && u.id % 24 === 0) this.banner(u);
      }
    } else {
      for (const u of fallen) this.soldier(u);
      for (const u of units) { this.soldier(u); if (u.type === 'sword' && u.id % 24 === 0) this.banner(u); }
    }
    for (const u of b.commanders) if (u && visible(u)) this.commanderLabel(u);
    for (const p of b.projectiles) {
      const pose = projectilePose(p, this.spriteScaleX, this.spriteScaleY);
      if (!visible(pose)) continue;
      drawProjectile(ctx, p, this.spriteScaleX, this.spriteScaleY, pose);
    }
    for (const effects of [b.effects, b.feedback?.effects || []]) for (const e of effects) {
      if (e.kind === 'arrow-ground' || isGroundEffect(e)) continue;
      if (!visible(e)) continue;
      ctx.save(); this.atUnit(e.x, e.y, e.scale || 1); drawCombatEffect(ctx, e, this.combatTime); ctx.restore();
    }
    const preview = this.formationPreview;
    if (preview?.valid) {
      ctx.save(); ctx.strokeStyle = preview.team ? '#ffae9f' : '#a9e1ff'; ctx.fillStyle = preview.team ? '#ffae9f55' : '#a9e1ff55'; ctx.lineWidth = 1.5 / this.view.zoom;
      ctx.beginPath();
      for (const slot of preview.slots) { const r = slot.radius + 2; ctx.moveTo(slot.x + r, slot.y); ctx.arc(slot.x, slot.y, r, 0, Math.PI * 2); }
      ctx.fill(); ctx.stroke();
      const x = preview.x, y = preview.y, dx = preview.dx, dy = preview.dy;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * 35, y + dy * 35); ctx.lineTo(x + dx * 25 - dy * 8, y + dy * 25 + dx * 8); ctx.moveTo(x + dx * 35, y + dy * 35); ctx.lineTo(x + dx * 25 + dy * 8, y + dy * 25 - dx * 8); ctx.stroke(); ctx.restore();
    }
    if (this.box) { const { a, z } = this.box; ctx.fillStyle = '#e4d89918'; ctx.fillRect(a.x, a.y, z.x - a.x, z.y - a.y); ctx.strokeStyle = '#e4d899'; ctx.lineWidth = 1; ctx.strokeRect(a.x, a.y, z.x - a.x, z.y - a.y); }
    ctx.restore();
    this.sprites.endFrame();
    if (commitBatch) {
      this.motionInterval = Math.max(this.motionInterval, 1000 / 30, performance.now() - this.pendingRender.started + 1000 / 60);
      commitBatch();
    }
    if (this.landscape) { this.desktopHUD(running); return; }
    const top = ctx.createLinearGradient(0, 0, 0, 160); top.addColorStop(0, '#111b15e8'); top.addColorStop(1, '#111b1500'); ctx.fillStyle = top; ctx.fillRect(0, 0, 600, 160);
    ctx.textAlign = 'center'; ctx.fillStyle = '#d5c898'; ctx.font = '11px Segoe UI, sans-serif'; ctx.fillText('M A R B L E   S T U D I O', 300, 33);
    ctx.shadowColor = '#172117'; ctx.shadowBlur = 8; ctx.font = 'bold 30px Georgia, serif'; ctx.fillStyle = '#eeead1'; ctx.fillText('TAÇ MUHAREBESİ', 300, 68); ctx.shadowBlur = 0;
    ctx.font = '11px Segoe UI, sans-serif'; ctx.fillStyle = '#d5d6b8'; ctx.fillText(b.historical ? 'TARİHÎ ORDULAR / ÇAĞLAR ARASI MUHAREBE' : { field: 'YEŞİL VADİ  /  MEYDAN SAVAŞI', wall: 'DEMİR HAT  /  KALKAN DUVARI', flank: 'KIZIL KUM  /  KANAT HÜCUMU' }[b.preset], 300, 91);
    const counts = b.counts();
    const bottom = ctx.createLinearGradient(0, 855, 0, 960); bottom.addColorStop(0, '#111b1500'); bottom.addColorStop(1, '#111b15ed'); ctx.fillStyle = bottom; ctx.fillRect(0, 855, 600, 105);
    ctx.fillStyle = '#a9c9cc'; ctx.font = '11px Segoe UI, sans-serif'; ctx.fillText(b.historical ? 'MAVİ ORDU' : 'KUZEY ORDUSU', 140, 903); ctx.fillStyle = '#dcaa95'; ctx.fillText('KIZIL ORDU', 460, 903);
    ctx.font = '27px Georgia, serif'; ctx.fillStyle = '#eee8ce'; ctx.fillText(String(counts[0]), 140, 935); ctx.fillText(String(counts[1]), 460, 935);
    ctx.font = '11px Consolas, monospace'; ctx.fillStyle = '#c4c8a7'; ctx.fillText(formatTime(b.time), 300, 924);
    ctx.font = '9px Segoe UI, sans-serif'; ctx.fillText(b.winner !== null ? 'SONUÇ' : running ? 'MUHAREBE' : b.time ? 'DURAKLATILDI' : 'KONUŞLANMA', 300, 943);
    if (b.winner !== null) {
      ctx.fillStyle = '#142017e8'; ctx.fillRect(50, 402, 500, 146); ctx.strokeStyle = '#c6b276'; ctx.lineWidth = 1; ctx.strokeRect(57, 409, 486, 132);
      ctx.fillStyle = '#d7c58a'; ctx.font = '11px Segoe UI, sans-serif'; ctx.fillText('MEYDANIN HÜKMÜ', 300, 437);
      ctx.font = 'bold 27px Georgia, serif'; ctx.fillStyle = '#f0ead1'; ctx.fillText(b.winner === 'draw' ? 'Berabere' : b.winner === 0 ? `${b.historical ? 'Mavi' : 'Kuzey'} ordusu kazandı` : 'Kızıl ordu kazandı', 300, 477);
      ctx.fillStyle = '#b5c0a5'; ctx.font = '12px Segoe UI, sans-serif'; ctx.fillText(b.outcomeReason === 'time-limit' ? 'Süre doldu · Kalan asker sayısına göre sonuç' : `${formatTime(b.time)}  ·  ${counts[0] + counts[1]} asker meydanda kaldı`, 300, 511);
    }
  }
  desktopHUD(running) {
    const ctx = this.ctx, b = this.battle, w = this.canvas.width / this.pixelRatio, h = this.canvas.height / this.pixelRatio, counts = b.counts();
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    // Compact plates leave the ground visible. No full-screen filter, blur or
    // moving lighting pass: the atmosphere is already baked into the terrain.
    ctx.fillStyle = '#111c20d9'; ctx.fillRect(w/2-113,10,226,42);
    ctx.fillStyle = '#c5ad72'; ctx.fillRect(w/2-28,10,56,1);
    ctx.textAlign = 'center'; ctx.fillStyle = '#eee4c9'; ctx.font = '15px Georgia, serif'; ctx.fillText('TAÇ MUHAREBESİ', w/2,30);
    ctx.font = '8px Segoe UI, sans-serif'; ctx.fillStyle = '#abb7ac'; ctx.fillText('M A R B L E   S T U D I O', w/2,44);
    const cardWidth=Math.min(210,(w-160)/2), cardY=h-66;
    for(let team=0;team<2;team++) {
      const x=team?w-cardWidth-16:16, color=team?'#dca38a':'#95c8d6';
      ctx.fillStyle='#111c20e8';ctx.fillRect(x,cardY,cardWidth,50);
      ctx.fillStyle=color;ctx.fillRect(team?x+cardWidth-2:x,cardY,2,50);
      ctx.textAlign=team?'right':'left'; const textX=team?x+cardWidth-14:x+14;
      ctx.font='9px Segoe UI, sans-serif';ctx.fillText(team?'KIZIL ORDU':b.historical?'MAVİ ORDU':'KUZEY ORDUSU',textX,cardY+17);
      ctx.font='20px Georgia, serif';ctx.fillStyle='#f0ead9';ctx.fillText(String(counts[team]),textX,cardY+38);
      const tactic = tacticalPhaseLabel(b, team);
      if (tactic && cardWidth >= 170) {
        ctx.textAlign = team ? 'left' : 'right'; ctx.font = '9px Segoe UI, sans-serif'; ctx.fillStyle = color;
        ctx.fillText(tactic, team ? x + 14 : x + cardWidth - 14, cardY + 17, cardWidth - 86);
      }
      const trackX=x+14,trackWidth=cardWidth-28,ratio=b.initial[team]?Math.min(1,counts[team]/b.initial[team]):0;
      ctx.fillStyle='#c9d3c21c';ctx.fillRect(trackX,cardY+45,trackWidth,2);
      ctx.fillStyle=color;ctx.fillRect(team?trackX+trackWidth*(1-ratio):trackX,cardY+45,trackWidth*ratio,2);
    }
    ctx.fillStyle='#111c20d9';ctx.fillRect(w/2-56,h-60,112,44);
    ctx.textAlign='center';ctx.font='15px Consolas, monospace';ctx.fillStyle='#eee4c9';ctx.fillText(formatTime(b.time),w/2,h-39);
    ctx.font='8px Segoe UI, sans-serif';ctx.fillStyle='#b5c1b6';ctx.fillText(b.winner!==null?'SONUÇ':running?'MUHAREBE':b.time?'DURAKLATILDI':'KONUŞLANMA',w/2,h-24);
    if (b.winner !== null) {
      const boxWidth = Math.min(480, w - 40), x = (w - boxWidth) / 2, y = (h - 136) / 2;
      ctx.fillStyle = '#142017ed'; ctx.fillRect(x, y, boxWidth, 136); ctx.strokeStyle = '#c6b276'; ctx.lineWidth = 1; ctx.strokeRect(x + 7, y + 7, boxWidth - 14, 122);
      ctx.fillStyle = '#d7c58a'; ctx.font = '11px Segoe UI, sans-serif'; ctx.fillText('MEYDANIN HÜKMÜ', w / 2, y + 32);
      ctx.fillStyle = '#f0ead1'; ctx.font = 'bold 25px Georgia, serif'; ctx.fillText(b.winner === 'draw' ? 'Berabere' : b.winner === 0 ? `${b.historical ? 'Mavi' : 'Kuzey'} ordusu kazandı` : 'Kızıl ordu kazandı', w / 2, y + 73);
      ctx.fillStyle = '#b5c0a5'; ctx.font = '12px Segoe UI, sans-serif'; ctx.fillText(b.outcomeReason === 'time-limit' ? 'Süre doldu · Kalan asker sayısına göre sonuç' : `${formatTime(b.time)}  ·  ${counts[0] + counts[1]} asker meydanda kaldı`, w / 2, y + 107);
    }
  }
}
export function formatTime(seconds) { const s = Math.floor(seconds); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
