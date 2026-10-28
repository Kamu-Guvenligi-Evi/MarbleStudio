// Card framing is independent of battlefield sprite origins. Include the whole
// silhouette (helmet, weapon, mount), without the source canvas's empty margins.
const visibleBounds = new WeakMap();

export function drawUnitCardArt(canvas, sprite, padding = 8) {
  let bounds = visibleBounds.get(sprite);
  if (bounds === undefined) {
    const { width, height } = sprite;
    const pixels = sprite.getContext('2d').getImageData(0, 0, width, height).data;
    let left = width, top = height, right = 0, bottom = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (!pixels[(y * width + x) * 4 + 3]) continue;
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
    }
    bounds = right > left ? { left, top, width: right - left, height: bottom - top } : null;
    visibleBounds.set(sprite, bounds);
  }
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, canvas.width, canvas.height);
  if (!bounds) return;
  const scale = Math.min((canvas.width - padding * 2) / bounds.width, (canvas.height - padding * 2) / bounds.height);
  const width = bounds.width * scale, height = bounds.height * scale;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(sprite, bounds.left, bounds.top, bounds.width, bounds.height,
    (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
}
