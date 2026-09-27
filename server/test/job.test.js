import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { runCli } from '../bin/render.js';
import { timeInputs } from '../src/job.js';
import { loadConfig } from '../src/config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const at = '2026-09-27T05:35:00Z';
const config = { ...loadConfig(), retry: { retries: 2, baseDelayMs: 0, jitterMs: 0 } };
const recorded = Object.fromEntries(['point', 'hourly', 'forecast', 'observation'].map(name =>
  [name, JSON.parse(readFileSync(new URL(`./fixtures/nws/${name}-2026-09-27.json`, import.meta.url)))]));
const clone = value => structuredClone(value);

function mockFetch(bodies = recorded, statuses = {}, modified = 'Sun, 27 Sep 2026 05:25:00 GMT') {
  return async url => {
    const key = url.includes('/points/') ? 'point' : url.includes('/forecast/hourly') ? 'hourly' :
      url.includes('/forecast') ? 'forecast' : 'observation';
    const status = statuses[key]?.shift() ?? 200;
    return new Response(status === 200 ? JSON.stringify(bodies[key]) : null, {
      status, headers: { 'Last-Modified': modified },
    });
  };
}

function logger() {
  const out = [], err = [];
  return { io: { out: line => out.push(JSON.parse(line)), err: line => err.push(JSON.parse(line)) }, out, err };
}

async function dependencies(fetchImpl) {
  const normal = await readFile(path.join(root, 'design/exports/normal/normal-summer.png'));
  const lowbat = await readFile(path.join(root, 'design/exports/states/state-low-battery.png'));
  return { config, fetchImpl, fetchOptions: { sleep: async () => {}, random: () => 0 },
    validateNormal: () => {}, renderFixture: async (_fixture, battery) => battery ? lowbat : normal };
}

test('time inputs use Denver wall time, future marks, and a successful-update footer', () => {
  const times = timeInputs(new Date(at), config);
  assert.equal(times.localNow, '2026-09-26T23:35:00-06:00');
  assert.equal(times.lastUpdate, '9/26 11:35 PM');
  assert.deepEqual(times.marks.map(mark => mark.time), ['12 AM', '3 AM', '6 AM', '9 AM']);
  assert.deepEqual(times.days.map(day => day.day), ['Sun', 'Mon', 'Tue']);
});

test('live run writes a complete bundle and one structured log line', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'epaper-job-'));
  const out = path.join(tmp, 'public');
  try {
    const log = logger();
    const code = await runCli(['--now', at, '--out', out], await dependencies(mockFetch()), log.io);
    assert.equal(code, 0, JSON.stringify(log.err));
    assert.deepEqual((await readdir(out)).sort(),
      ['frame.bin', 'frame-lowbat.bin', 'frame.png', 'frame-lowbat.png', 'meta.json', 'index.html'].sort());
    assert.equal((await readFile(path.join(out, 'frame.bin'))).length, 15000);
    const meta = JSON.parse(await readFile(path.join(out, 'meta.json'), 'utf8'));
    assert.equal(meta.footerTimestamp, '9/26 11:35 PM');
    assert.equal(meta.dataUpdateTime, recorded.hourly.properties.updateTime);
    assert.equal(log.out.length, 1);
    assert.equal(log.err.length, 0);
    assert.equal(log.out[0].step, 'complete');
    assert.equal(log.out[0].dataUpdateTime, meta.dataUpdateTime);
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test('500s, future Last-Modified, and out-of-range data exit 2 and preserve public', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'epaper-fail-'));
  const out = path.join(tmp, 'public');
  await mkdir(out);
  await writeFile(path.join(out, 'sentinel.txt'), 'previous published frame');
  try {
    const badTemperature = clone(recorded);
    badTemperature.hourly.properties.periods.forEach(period => { period.temperature = 200; });
    const cases = [
      mockFetch(recorded, { hourly: [500, 500, 500] }),
      mockFetch(recorded, {}, 'Sun, 27 Sep 2026 06:00:00 GMT'),
      mockFetch(badTemperature),
    ];
    for (const fetchImpl of cases) {
      const log = logger();
      const code = await runCli(['--now', at, '--out', out], await dependencies(fetchImpl), log.io);
      assert.equal(code, 2);
      assert.equal(log.out.length, 0);
      assert.equal(log.err.length, 1);
      assert.equal(log.err[0].level, 'error');
      assert.deepEqual(await readdir(out), ['sentinel.txt']);
      assert.equal(await readFile(path.join(out, 'sentinel.txt'), 'utf8'), 'previous published frame');
    }
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test('a bundle write failure keeps the previous published directory intact', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'epaper-stage-'));
  const out = path.join(tmp, 'public');
  await mkdir(out);
  await writeFile(path.join(out, 'sentinel.txt'), 'previous');
  try {
    const deps = await dependencies(mockFetch());
    deps.writeBundle = async dir => {
      await writeFile(path.join(dir, 'partial.bin'), 'incomplete');
      throw new Error('simulated bundle failure');
    };
    const log = logger();
    assert.equal(await runCli(['--now', at, '--out', out], deps, log.io), 2);
    assert.deepEqual(await readdir(out), ['sentinel.txt']);
    assert.equal(await readFile(path.join(out, 'sentinel.txt'), 'utf8'), 'previous');
    assert.match(log.err[0].error, /simulated bundle failure/);
    assert.deepEqual((await readdir(tmp)).sort(), ['public']);
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test('dry run leaves output untouched and low-battery is restricted to fixture mode', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'epaper-dry-'));
  const out = path.join(tmp, 'public');
  const fixture = path.join(root, 'design/fixtures/normal-night.json');
  await mkdir(out);
  await writeFile(path.join(out, 'sentinel.txt'), 'unchanged');
  try {
    const deps = await dependencies(mockFetch());
    const dry = logger();
    assert.equal(await runCli(['--fixture', fixture, '--dry-run', '--out', out], deps, dry.io), 0);
    assert.deepEqual(await readdir(out), ['sentinel.txt']);
    const invalid = logger();
    assert.equal(await runCli(['--low-battery', '--out', out], deps, invalid.io), 2);
    assert.deepEqual(await readdir(out), ['sentinel.txt']);
    assert.equal(invalid.err.length, 1);
    const badNow = logger();
    assert.equal(await runCli(['--now', '2026-09-27', '--out', out], deps, badNow.io), 2);
    assert.deepEqual(await readdir(out), ['sentinel.txt']);
    const low = logger();
    assert.equal(await runCli(['--fixture', fixture, '--low-battery', '--out', out], deps, low.io), 0);
    assert.deepEqual(await readdir(out), ['frame.png']);
    assert.deepEqual(await readFile(path.join(out, 'frame.png')),
      await readFile(path.join(root, 'design/exports/states/state-low-battery.png')));
  } finally { await rm(tmp, { recursive: true, force: true }); }
});
