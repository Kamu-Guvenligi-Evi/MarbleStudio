// One ordered GPU draw for the atlas sprites. Canvas2D still owns the map,
// labels and controls; unavailable/lost WebGL contexts use the existing path.
import { visualScaleOf } from './crown-battle-visual-scale.js';
import { combatPose, combatRows } from './crown-battle-combat-motion.js';
const INSTANCE_FLOATS = 20;
export class BattleSpriteBatch {
  constructor() {
    this.canvas = document.createElement('canvas');
    const gl = this.canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    this.gl = gl;
    if (!gl) return;
    const shader = (kind, source) => {
      const s = gl.createShader(kind); gl.shaderSource(s, source); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const vertex = shader(gl.VERTEX_SHADER, `#version 300 es
      in vec4 origins; in vec4 transform; in vec4 rect; in vec2 bend;
      in vec4 uv; in vec2 material;
      uniform vec4 camera; uniform float progress;
      out vec2 texcoord; flat out int page; out float alpha;
      void main() {
        float right = float(gl_VertexID & 1), row = float(gl_VertexID >> 1);
        vec2 p = vec2(rect.x + right * rect.y + mix(bend.x, bend.y, row), mix(rect.z, rect.w, row));
        vec2 world = mix(origins.xy, origins.zw, progress)
          + vec2(transform.x * p.x + transform.z * p.y, transform.y * p.x + transform.w * p.y);
        gl_Position = vec4((world - camera.xy) * camera.zw, 0., 1.);
        texcoord = uv.xy + vec2(right, row) * uv.zw; page = int(material.x); alpha = material.y;
      }`);
    const fragment = shader(gl.FRAGMENT_SHADER, `#version 300 es
      precision highp float; precision highp sampler2DArray;
      uniform sampler2DArray atlas;
      in vec2 texcoord; flat in int page; in float alpha; out vec4 color;
      void main() { color = texture(atlas, vec3(texcoord, float(page))) * alpha; }`);
    this.program = gl.createProgram(); gl.attachShader(this.program, vertex); gl.attachShader(this.program, fragment); gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program));
    gl.deleteShader(vertex); gl.deleteShader(fragment); gl.useProgram(this.program);
    this.buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    for (const [name, size, offset] of [['origins',4,0], ['transform',4,4], ['rect',4,8], ['bend',2,12], ['uv',4,14], ['material',2,18]]) {
      const location = gl.getAttribLocation(this.program, name);
      gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, gl.FLOAT, false, INSTANCE_FLOATS * 4, offset * 4);
      gl.vertexAttribDivisor(location, 1);
    }
    this.cameraUniform = gl.getUniformLocation(this.program, 'camera');
    this.progressUniform = gl.getUniformLocation(this.program, 'progress');
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.pages = new Map(); this.vertices = new Float32Array(0); this.frames = 0;
    this.motion = new WeakMap(); this.generation = 0;
    this.canvas.addEventListener('webglcontextlost', () => { this.gl = null; });
  }
  reserveLayers(required) {
    if (required <= (this.layers || 0)) return;
    const gl = this.gl;
    this.layers = Math.min(16, Math.max(2, 2 ** Math.ceil(Math.log2(required))));
    if (this.texture) gl.deleteTexture(this.texture);
    this.texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texture);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, 1024, 1024, this.layers);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    for (const record of this.pages.values()) record.version = 0;
  }
  uploadPages(livePages, upload = true) {
    const gl = this.gl;
    if (!gl || gl.isContextLost()) return false;
    for (const page of this.pages.keys()) if (!livePages.includes(page)) this.pages.delete(page);
    const used = new Set([...this.pages.values()].map(p => p.layer));
    if (upload) this.reserveLayers(Math.max(livePages.length, ...[...used].map(layer => layer + 1)));
    for (const page of livePages) {
      let record = this.pages.get(page);
      if (!record) {
        let layer = 0; while (used.has(layer)) layer++;
        if (layer >= 16) return false;
        record = { layer, version: 0 }; used.add(layer); this.pages.set(page, record);
      }
      if (upload && record.version !== page.version) {
        // Pages only append sprites. Transfer the newly written rectangle,
        // instead of re-uploading a 4 MiB page for a single animation pose.
        let left=1024, top=1024, right=0, bottom=0;
        for(let i=record.version;i<page.regions.length;i++) {
          const r=page.regions[i];left=Math.min(left,r.x);top=Math.min(top,r.y);
          right=Math.max(right,r.x+r.width);bottom=Math.max(bottom,r.y+r.height);
        }
        gl.pixelStorei(gl.UNPACK_ROW_LENGTH, 1024);
        gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, left, top, record.layer, right-left, bottom-top, 1, gl.RGBA, gl.UNSIGNED_BYTE, page.pixels, (top * 1024 + left) * 4);
        gl.pixelStorei(gl.UNPACK_ROW_LENGTH, 0);
        record.version = page.version;
      }
    }
    return true;
  }
  render(renderer, fallen, units, offsetOf) {
    const work = this.renderBatches(renderer, fallen, units, offsetOf);
    let result;
    do { result = work.next(); } while (!result.done);
    return result.value;
  }
  *renderBatches(renderer, fallen, units, offsetOf, deferred = false) {
    const gl = this.gl;
    if (!gl || gl.isContextLost()) return false;
    // Do not hide a soldier while its first atlas entry is still being prepared.
    for (const list of [fallen, units]) for (const u of list) if (!renderer.frameSprites.get(u)) return false;
    // Assign layers now, but keep displayed textures intact until publication.
    if (!this.uploadPages(renderer.spriteCache.pages, !deferred)) return false;
    const length = (fallen.length * 4 + units.length) * INSTANCE_FLOATS;
    if (this.vertices.length < length) this.vertices = new Float32Array(Math.max(length, this.vertices.length * 2));
    const data = this.vertices, view = renderer.view;
    const smooth = !!renderer.motionInterval && renderer.layersActive;
    const motions = [];
    this.pose ||= {}; this.rows ||= new Float64Array(15);
    const rows = this.rows;
    let index = 0, processed = 0;
    for (const list of [fallen, units]) for (const u of list) {
      if (++processed % 256 === 0) yield;
      const size=visualScaleOf(u),sx=renderer.spriteScaleX*size,sy=renderer.spriteScaleY*size;
      const e = renderer.frameSprites.get(u), layer = this.pages.get(e.page).layer;
      const pose = combatPose(u, renderer.combatTime ?? renderer.battle.time, offsetOf(u), this.pose);
      const x = u.x + pose.x * sx, y = u.y + pose.y * sy;
      const left = e.offsetX, top = e.offsetY, width = e.width / e.resolution, height = e.height / e.resolution;
      const rowCount = combatRows(pose, top, top + height, rows);
      if (smooth) motions.push({u,x,y,index,strips:rowCount-1});
      // One instance per body (four for a falling foot soldier). The GPU
      // expands its corners instead of transforming six vertices in JS.
      for (let strip = 0; strip < rowCount - 1; strip++) {
        const row = strip * 3;
        data[index++] = x; data[index++] = y; data[index++] = x; data[index++] = y;
        data[index++] = pose.a * sx; data[index++] = pose.b * sy;
        data[index++] = pose.c * sx; data[index++] = pose.d * sy;
        data[index++] = left; data[index++] = width;
        data[index++] = rows[row + 2]; data[index++] = rows[row + 5];
        data[index++] = rows[row + 1]; data[index++] = rows[row + 4];
        data[index++] = e.x / 1024; data[index++] = (e.y + (rows[row] - top) * e.resolution) / 1024;
        data[index++] = e.width / 1024; data[index++] = (rows[row + 3] - rows[row]) * e.resolution / 1024;
        data[index++] = layer; data[index++] = pose.alpha;
      }
    }
    const commit = () => {
    if (!this.gl || gl.isContextLost()) return false;
    if (deferred && !this.uploadPages(renderer.spriteCache.pages)) return false;
    // Sample the old GPU motion at publication, not when preparation began.
    // Preparing or cancelling a sliced frame never mutates displayed motion.
    const previousProgress = this.motionProgress(), generation = ++this.generation;
    for (const sample of motions) {
      const {u,x,y,index:at,strips} = sample;
      let motion = this.motion.get(u), startX = x, startY = y;
      if (this.smoothActive && motion?.generation === generation - 1) {
        startX = motion.startX + (motion.x - motion.startX) * previousProgress;
        startY = motion.startY + (motion.y - motion.startY) * previousProgress;
      }
      if (!motion) { motion = {}; this.motion.set(u, motion); }
      Object.assign(motion, {startX,startY,x,y,generation});
      for (let strip=0; strip<strips; strip++) {
        data[at+strip*INSTANCE_FLOATS] = startX; data[at+strip*INSTANCE_FLOATS+1] = startY;
      }
    }
    if (this.canvas.width !== renderer.canvas.width || this.canvas.height !== renderer.canvas.height) {
      this.canvas.width = renderer.canvas.width; this.canvas.height = renderer.canvas.height;
    }
    gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, index), gl.STREAM_DRAW);
    gl.uniform4f(this.cameraUniform, view.x, view.y, view.zoom * 2 / renderer.viewWidth, -view.zoom * 2 / renderer.viewHeight);
    this.instanceCount = index / INSTANCE_FLOATS;
    this.smoothActive = smooth; this.motionStarted = performance.now();
    this.motionDuration = smooth ? renderer.motionInterval : 0;
    this.draw(smooth ? 0 : 1);
    if (renderer.layersActive) {
      // Let the browser composite the GPU surface directly. Copying WebGL into
      // Canvas2D synchronizes the two contexts on every battle frame.
      if (!this.canvas.parentNode) {
        this.canvas.setAttribute('aria-hidden', 'true');
        this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
        renderer.canvas.before(this.canvas);
      }
      this.canvas.style.display = 'block';
    } else {
      const ctx = renderer.ctx;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.canvas, 0, 0); ctx.restore();
    }
    this.frames++; return true;
    };
    return deferred ? commit : commit();
  }
  motionProgress(now = performance.now()) {
    return this.motionDuration ? Math.min(1, Math.max(0, (now - this.motionStarted) / this.motionDuration)) : 1;
  }
  draw(progress) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(this.progressUniform, progress);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.instanceCount);
    this.lastProgress = progress;
  }
  animate(now = performance.now()) {
    if (!this.smoothActive || !this.gl || this.gl.isContextLost() || this.canvas.style.display === 'none') return false;
    const progress = this.motionProgress(now);
    if (progress === this.lastProgress) return false;
    // Reuse the uploaded atlas and geometry. No soldier loops, canvas redraw,
    // texture uploads or simulation mutations on these intermediate frames.
    this.draw(progress); this.frames++; return true;
  }
}
