import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { framebufferToPng, pngToFramebuffer, FRAME_BYTES } from '../src/pack.js';
import { writeBundle } from '../src/bundle.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const exportsDir = path.join(root, 'design/exports');
const frames = [
  ...['summer', 'winter', 'spring', 'widths', 'night'].map(name => `normal/normal-${name}.png`),
  'states/state-setup.png', 'states/state-low-battery.png',
];

function framediff(first, second, flags) {
  const args = [path.join(root, 'tools/framediff.py'), first, second,
    '--polarity', flags.whiteIsOne ? 'white' : 'black'];
  if (!flags.msbFirst) args.push('--lsb-first');
  const run = spawnSync('python3', args, { encoding: 'utf8' });
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  assert.match(run.stdout, /Differing pixels: 0/);
}

test('all seven canonical exports round-trip and agree with framediff', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'epaper-pack-'));
  try {
    for (const frame of frames) {
      const original = await readFile(path.join(exportsDir, frame));
      const raw = pngToFramebuffer(original);
      assert.equal(raw.length, FRAME_BYTES);
      const decoded = framebufferToPng(raw);
      const binPath = path.join(temp, 'frame.bin');
      const pngPath = path.join(temp, 'roundtrip.png');
      await writeFile(binPath, raw);
      await writeFile(pngPath, decoded);
      framediff(path.join(exportsDir, frame), binPath, { whiteIsOne: true, msbFirst: true });
      framediff(path.join(exportsDir, frame), pngPath, { whiteIsOne: true, msbFirst: true });
      assert.deepEqual(pngToFramebuffer(decoded), raw);
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('both polarities and both bit orders round-trip through framediff', async () => {
  const originalPath = path.join(exportsDir, 'normal/normal-summer.png');
  const original = await readFile(originalPath);
  const temp = await mkdtemp(path.join(os.tmpdir(), 'epaper-flags-'));
  try {
    for (const whiteIsOne of [true, false]) for (const msbFirst of [true, false]) {
      const flags = { whiteIsOne, msbFirst };
      const raw = pngToFramebuffer(original, flags);
      const binPath = path.join(temp, 'frame.bin');
      await writeFile(binPath, raw);
      framediff(originalPath, binPath, flags);
      assert.deepEqual(pngToFramebuffer(framebufferToPng(raw, flags), flags), raw);
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('rejects bad dimensions, bit depth, and framebuffer size', async () => {
  const valid = await readFile(path.join(exportsDir, frames[0]));
  const python = spawnSync('python3', ['-c', `import io,sys\nfrom PIL import Image\nim=Image.new('L',(400,300),'white')\nim.save(sys.stdout.buffer,format='PNG')`]);
  assert.equal(python.status, 0);
  assert.throws(() => pngToFramebuffer(python.stdout), /1-bit grayscale/);
  const wrongSize = spawnSync('python3', ['-c', `import sys\nfrom PIL import Image\nim=Image.new('1',(399,300),'white')\nim.save(sys.stdout.buffer,format='PNG')`]);
  assert.equal(wrongSize.status, 0);
  assert.throws(() => pngToFramebuffer(wrongSize.stdout), /400x300/);
  assert.throws(() => framebufferToPng(Buffer.alloc(10)), /15000 bytes/);
  assert.throws(() => pngToFramebuffer(valid, { whiteIsOne: 'yes' }), /booleans/);
});

test('bundle writes matching payloads, hashes, and preview page', async () => {
  const normalPng = await readFile(path.join(exportsDir, frames[0]));
  const lowbatPng = await readFile(path.join(exportsDir, frames[6]));
  const dir = await mkdtemp(path.join(os.tmpdir(), 'epaper-bundle-'));
  try {
    const meta = { renderedAt: '2026-09-27T05:00:00Z', dataUpdateTime: '2026-09-27T04:55:00Z', footerTimestamp: '11:00 PM' };
    const result = await writeBundle(dir, { normalPng, lowbatPng, meta });
    assert.deepEqual((await readdir(dir)).sort(), ['frame-lowbat.bin', 'frame-lowbat.png', 'frame.bin', 'frame.png', 'index.html', 'meta.json'].sort());
    assert.deepEqual(await readFile(path.join(dir, 'frame.bin')), pngToFramebuffer(normalPng));
    assert.deepEqual(await readFile(path.join(dir, 'frame-lowbat.bin')), pngToFramebuffer(lowbatPng));
    assert.deepEqual(JSON.parse(await readFile(path.join(dir, 'meta.json'), 'utf8')), result);
    assert.equal(result.schemaVersion, 1);
    assert.deepEqual(result.polarity, { whiteIsOne: true, msbFirst: true });
    for (const [name, hash] of Object.entries(result.sha256)) {
      assert.equal(createHash('sha256').update(await readFile(path.join(dir, name))).digest('hex'), hash);
    }
    const html = await readFile(path.join(dir, 'index.html'), 'utf8');
    assert.match(html, /frame-lowbat.png/);
    assert.match(html, /image-rendering:pixelated/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
