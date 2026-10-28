import fs from 'node:fs/promises';
import path from 'node:path';

// Cached Commons file pages; download only bounded previews, never an image set.
const [title, filename, mode = 'preview'] = process.argv.slice(2);
const previewWidth = mode === 'small' ? 330 : 500;
if (!title?.startsWith('File:') || !/^[a-z0-9-]+\.(jpg|png)$/i.test(filename || '')) throw Error('Usage: File:title filename.jpg [original]');
const dir = 'artifacts/elite-visual-research';
const cache = path.join(dir, title.replace(/[^a-z0-9_-]/gi, '_') + '.html');
let html;
try { html = await fs.readFile(cache, 'utf8'); }
catch {
  const r = await fetch('https://commons.wikimedia.org/wiki/' + encodeURIComponent(title.replaceAll(' ', '_')));
  if (!r.ok) throw Error('File page HTTP ' + r.status);
  html = await r.text();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(cache, html);
}
const section = html.slice(html.indexOf('class="fullImageLink"'));
const raw = mode === 'original' ? section.match(/<a href="([^"]+)"/)?.[1] : section.match(/<img[^>]+src="([^"]+)"/)?.[1];
if (!raw) throw Error('No file image found');
let url = raw.split('?')[0].replaceAll('&amp;', '&');
if (mode !== 'original') {
  if (!url.includes('/thumb/')) {
    const parts = url.split('/');
    url = url.replace('/commons/', '/commons/thumb/') + '/' + previewWidth + 'px-' + parts.at(-1);
  } else url = url.replace(/\/\d+px-/, '/' + previewWidth + 'px-');
}
const dest = path.join('public/warrior-references', filename);
try { const s = await fs.stat(dest); console.log(JSON.stringify({ filename, bytes: s.size, cached: true })); process.exit(0); } catch {}
const r = await fetch(url);
if (!r.ok) throw Error('Image HTTP ' + r.status);
if (!r.headers.get('content-type')?.startsWith('image/')) throw Error('Not an image');
const max = 500_000;
if (Number(r.headers.get('content-length')) > max) { await r.body.cancel(); throw Error('Image exceeds 500 KB'); }
const chunks = []; let bytes = 0;
for await (const chunk of r.body) {
  bytes += chunk.length;
  if (bytes > max) throw Error('Image exceeds 500 KB');
  chunks.push(chunk);
}
const data = Buffer.concat(chunks);
const valid = filename.endsWith('.png') ? data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : data[0] === 255 && data[1] === 216;
if (!valid) throw Error('Unexpected file signature');
await fs.writeFile(dest, data);
console.log(JSON.stringify({ filename, bytes, url }));
