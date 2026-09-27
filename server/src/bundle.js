import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pngToFramebuffer } from './pack.js';

const CONFIG = new URL('../config.json', import.meta.url);

function digest(data) {
  return createHash('sha256').update(data).digest('hex');
}

const INDEX = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Weather frame preview</title><style>
body{font:16px system-ui,sans-serif;margin:1rem;max-width:1280px}h1{font-size:1.3rem}h2{font-size:1.1rem}
img{display:block;image-rendering:pixelated;image-rendering:crisp-edges;border:1px solid #aaa}
.large{width:1200px;height:900px}.scroll{overflow:auto;max-width:100%}pre{white-space:pre-wrap;overflow-wrap:anywhere}
</style></head><body><h1>Weather frame preview</h1><pre id="meta">Loading metadata…</pre>
<h2>Normal · 1×</h2><img src="frame.png" width="400" height="300" alt="Normal weather frame">
<h2>Normal · 3×</h2><div class="scroll"><img class="large" src="frame.png" alt="Normal weather frame enlarged"></div>
<h2>Low battery · 1×</h2><img src="frame-lowbat.png" width="400" height="300" alt="Low battery weather frame">
<h2>Low battery · 3×</h2><div class="scroll"><img class="large" src="frame-lowbat.png" alt="Low battery weather frame enlarged"></div>
<script>fetch('meta.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(m=>{
document.getElementById('meta').textContent=JSON.stringify(m,null,2)
}).catch(e=>{document.getElementById('meta').textContent='Metadata unavailable: '+e.message})</script></body></html>
`;

export async function writeBundle(dir, { normalPng, lowbatPng, meta }) {
  if (!Buffer.isBuffer(normalPng) || !Buffer.isBuffer(lowbatPng)) {
    throw new TypeError('normalPng and lowbatPng must be PNG Buffers');
  }
  for (const key of ['renderedAt', 'dataUpdateTime', 'footerTimestamp']) {
    if (typeof meta?.[key] !== 'string' || !meta[key]) throw new TypeError(`meta.${key} is required`);
  }
  const flags = JSON.parse(await readFile(CONFIG, 'utf8'));
  const files = {
    'frame.bin': pngToFramebuffer(normalPng, flags),
    'frame-lowbat.bin': pngToFramebuffer(lowbatPng, flags),
    'frame.png': normalPng,
    'frame-lowbat.png': lowbatPng,
    'index.html': Buffer.from(INDEX),
  };
  const metadata = {
    renderedAt: meta.renderedAt,
    dataUpdateTime: meta.dataUpdateTime,
    footerTimestamp: meta.footerTimestamp,
    sha256: Object.fromEntries(Object.entries(files).map(([name, contents]) => [name, digest(contents)])),
    polarity: { whiteIsOne: flags.whiteIsOne, msbFirst: flags.msbFirst },
    schemaVersion: 1,
  };
  await mkdir(dir, { recursive: true });
  await Promise.all(Object.entries(files).map(([name, contents]) => writeFile(path.join(dir, name), contents)));
  await writeFile(path.join(dir, 'meta.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  return metadata;
}
