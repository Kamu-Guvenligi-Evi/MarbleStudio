// Bake the facing and contact shadow once per animation frame. The battlefield
// can then draw an ordinary soldier with one image operation and no path work.
export class BattleSpriteCache {
  constructor() { this.sourceBounds = new WeakMap(); this.clear(); }
  clear() { this.entries = new WeakMap(); this.pages = []; this.resolution = 0; this.frame = 0; this.pageRevision = (this.pageRevision || 0) + 1; }
  beginFrame(resolution, budgetMs = Infinity) {
    // Zoom must not discard every uploaded pose. Existing entries stay usable
    // while sharper replacements are prepared within the upload budget.
    this.resolution = resolution;
    this.frame++; this.remainingMs = budgetMs; this.deferred = false;
  }
  boundsOf(source) {
    if (this.sourceBounds.has(source)) return this.sourceBounds.get(source);
    // SpriteLibrary creates CPU-backed sources. Read each source only once;
    // never read the GPU atlas or the battlefield canvas.
    const { width, height } = source;
    const pixels = source.getContext('2d').getImageData(0, 0, width, height).data;
    let left = width, right = 0, top = height, bottom = 0;
    // Only the outermost opaque pixels of each row affect its bounds.
    for (let y = 0; y < height; y++) {
      const row = y * width * 4;
      let first = 0;
      while (first < width && !pixels[row + first * 4 + 3]) first++;
      if (first === width) continue;
      let last = width - 1;
      while (last > first && !pixels[row + last * 4 + 3]) last--;
      left = Math.min(left, first); right = Math.max(right, last + 1);
      top = Math.min(top, y); bottom = y + 1;
    }
    const bounds = right > left ? { left: left / width * 80 - 30, right: right / width * 80 - 30, top: top / height * 76 - 61, bottom: bottom / height * 76 - 61 } : null;
    this.sourceBounds.set(source, bounds); return bounds;
  }
  get(source, face, horse, resolution, shadow) {
    let variants = this.entries.get(source);
    if (!variants) { variants = new Map(); this.entries.set(source, variants); }
    const key = `${face}:${horse}:${Boolean(shadow)}`;
    const previous = variants.get(key);
    if (previous) {
      previous.page.lastUsed = this.frame;
      if (previous.resolution >= resolution) return previous;
    }
    if (this.remainingMs <= 0) { this.deferred = true; return previous || null; }
    const started = performance.now();
    const radius = horse ? 25 : 13;
    const bounds = this.boundsOf(source);
    let left = 4 - radius, right = 4 + radius, top = -3, bottom = horse ? 10 : 6;
    if (bounds) {
      left = Math.min(left, face > 0 ? bounds.left : -bounds.right);
      right = Math.max(right, face > 0 ? bounds.right : -bounds.left);
      top = Math.min(top, bounds.top); bottom = Math.max(bottom, bounds.bottom);
    }
    // Keep a transparent pixel around the content for bilinear interpolation.
    const cropX = Math.max(0, Math.floor((50 + left) * resolution) - 1);
    const cropY = Math.max(0, Math.floor((65 + top) * resolution) - 1);
    // Visual scale can be fractional (especially Middle-earth giants). Atlas
    // rectangles and row strides must still be integer pixels: fractional
    // offsets make typed-array writes invalid and poison following tile rows.
    const cropRight = Math.min(Math.ceil(100 * resolution), Math.ceil((50 + right) * resolution) + 1);
    const cropBottom = Math.min(Math.ceil(80 * resolution), Math.ceil((65 + bottom) * resolution) + 1);
    const width = cropRight - cropX, height = cropBottom - cropY;
    const offsetX = cropX / resolution - 50, offsetY = cropY / resolution - 65;
    // Pack the visible rectangle instead of reserving 100x80 for every pose.
    // Smaller pages bound individual uploads; sixteen 1024px pages cap the
    // atlas at 64 MiB and hold more poses than the old 128 MiB fixed-slot atlas.
    const fits = p => p.cursorX + width <= 1024 && p.cursorY + height <= 1024 || p.cursorY + p.rowHeight + height <= 1024;
    let page = this.pages.findLast(fits);
    if (!page) {
      if (this.pages.length >= 16) {
        const oldest = this.pages.filter(p => p.lastUsed < this.frame).sort((a,b)=>a.lastUsed-b.lastUsed)[0];
        if (!oldest) { this.remainingMs -= performance.now() - started; return previous || null; }
        for (const [map, entryKey] of oldest.keys) if (map.get(entryKey)?.page === oldest) map.delete(entryKey);
        this.pages.splice(this.pages.indexOf(oldest),1);
      }
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
      // The batch renderer uploads from this staging surface. Keeping it on
      // the CPU avoids a GPU readback between the 2D and WebGL contexts.
      page = { canvas, ctx: canvas.getContext('2d', { willReadFrequently: true }), cursorX: 0, cursorY: 0, rowHeight: 0, keys: [], lastUsed: this.frame }; this.pages.push(page); this.pageRevision++;
    }
    if (page.cursorX + width > 1024 || page.cursorY + height > 1024) {
      page.cursorX = 0; page.cursorY += page.rowHeight; page.rowHeight = 0;
    }
    const x = page.cursorX, y = page.cursorY; page.cursorX += width; page.rowHeight = Math.max(page.rowHeight, height);
    const ctx = page.ctx;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.save(); ctx.beginPath(); ctx.rect(x,y,width,height); ctx.clip();
    ctx.translate(x - offsetX * resolution, y - offsetY * resolution); ctx.scale(resolution, resolution);
    if (shadow) ctx.drawImage(shadow, 4 - radius, -3, radius * 2, horse ? 13 : 9);
    ctx.scale(face, 1); ctx.drawImage(source, -30, -61, 80, 76); ctx.restore();
    // Flush only this new tile while the bake budget is still being measured.
    // Keep premultiplied CPU pixels for uploads, so GPU submission never forces
    // an unbudgeted canvas readback of a whole dirty atlas rectangle.
    const pixels = ctx.getImageData(x, y, width, height).data;
    page.pixels ||= new Uint8Array(1024 * 1024 * 4);
    for (let row = 0; row < height; row++) {
      let dest = ((y + row) * 1024 + x) * 4;
      for (let col = 0, src = row * width * 4; col < width; col++, src += 4, dest += 4) {
        const alpha = pixels[src + 3];
        page.pixels[dest] = Math.round(pixels[src] * alpha / 255);
        page.pixels[dest + 1] = Math.round(pixels[src + 1] * alpha / 255);
        page.pixels[dest + 2] = Math.round(pixels[src + 2] * alpha / 255);
        page.pixels[dest + 3] = alpha;
      }
    }
    page.version = (page.version || 0) + 1;
    (page.regions ||= []).push({ x, y, width, height });
    page.lastUsed = this.frame; page.keys.push([variants,key]);
    const entry = { canvas: page.canvas, x, y, width, height, offsetX, offsetY, resolution, page };
    variants.set(key, entry); this.remainingMs -= performance.now() - started; return entry;
  }
}
