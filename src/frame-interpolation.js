// Draw between fixed physics steps without changing simulation state or outcomes.
export class FrameInterpolation {
  capture(race) {
    this.race = race;
    this.time = race.time;
    this.bodies = new Map([...race.balls.map(b => b.body), ...(race.obstacles ?? [])].map(body => [body, {
      x: body.position.x, y: body.position.y, angle: body.angle,
      vertices: body.circleRadius ? null : body.vertices?.map(v => ({x:v.x,y:v.y}))
    }]));
    this.particles = new Map((race.particles ?? []).map(p => [p, {x:p.x,y:p.y,life:p.life,rotation:p.rotation}]));
  }
  draw(race, alpha, render) {
    if (race !== this.race || !this.bodies) return render();
    alpha = Math.max(0, Math.min(1, alpha));
    const restore = [];
    const blend = (object, key, previous) => {
      const current = object[key];
      if (!Number.isFinite(current) || !Number.isFinite(previous)) return;
      object[key] = previous + (current - previous) * alpha;
      restore.push(() => { object[key] = current; });
    };
    try {
      blend(race, 'time', this.time);
      for (const [body, old] of this.bodies) {
        // Respawns and rescue jumps are discrete events, never stretched across the world.
        if (Math.hypot(body.position.x-old.x, body.position.y-old.y)>120) continue;
        blend(body.position, 'x', old.x); blend(body.position, 'y', old.y);
        blend(body, 'angle', old.angle);
        old.vertices?.forEach((v,i) => {
          if(body.vertices?.[i]) { blend(body.vertices[i],'x',v.x); blend(body.vertices[i],'y',v.y); }
        });
      }
      for (const [p, old] of this.particles) {
        for (const key of ['x','y','life','rotation']) blend(p,key,old[key]);
      }
      return render();
    } finally { for (let i=restore.length-1;i>=0;i--) restore[i](); }
  }
}
