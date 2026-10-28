import fs from 'node:fs';
const dir = 'artifacts/elite-visual-research/';
for (const title of process.argv.slice(2)) {
  const filename = title.replace(/[^a-z0-9_-]/gi, '_') + '.html';
  const html = fs.readFileSync(dir + filename, 'utf8');
  const plain = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const start = plain.indexOf('Description');
  console.log(JSON.stringify({title, metadata: plain.slice(start, start + 2900)}));
}
