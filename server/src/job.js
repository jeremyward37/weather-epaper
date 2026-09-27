import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { lstat, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { fetchAll } from './nws.js';
import { buildFixture } from './normalize.js';
import { writeBundle } from './bundle.js';
import { civilEvents, footerTimestamp, isDay, nextThreeDays, nextThreeHourMarks } from './timing.js';

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

function localTimestamp(instant, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit',
    minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset',
  }).formatToParts(instant).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  const match = /^GMT(?:([+-])(\d{1,2})(?::(\d{2}))?)?$/.exec(parts.timeZoneName);
  if (!match) throw new RangeError(`unsupported time zone offset: ${parts.timeZoneName}`);
  const offset = match[1] ? `${match[1]}${match[2].padStart(2, '0')}:${match[3] ?? '00'}` : '+00:00';
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
}

export function timeInputs(now, config) {
  const { latitude, longitude, timeZone } = config;
  return {
    now: now.toISOString(), timeZone,
    localNow: localTimestamp(now, timeZone),
    lastUpdate: footerTimestamp(now),
    currentIsDay: isDay(now, latitude, longitude),
    marks: nextThreeHourMarks(now).map(mark => ({
      at: mark.instant.toISOString(), time: mark.time,
      isDay: isDay(mark.instant, latitude, longitude),
    })),
    days: nextThreeDays(now),
    sun: (({ event, time }) => ({ event, time }))(civilEvents(now, latitude, longitude)),
  };
}

async function renderFixture(fixture, lowBattery) {
  // The pinned container supplies sharp through NODE_PATH. Delay loading the
  // renderer so data failures never depend on image libraries being present.
  const { renderNormal, toOneBitPng } = require('../../design/lib/render.js');
  const oneBit = await toOneBitPng(await renderNormal(fixture, { lowBattery }));
  return canonicalPng(oneBit);
}

function canonicalPng(png) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.WEATHER_EPAPER_PYTHON || 'python3',
      [fileURLToPath(new URL('./canonical_png.py', import.meta.url))]);
    const output = [];
    const errors = [];
    child.stdout.on('data', data => output.push(data));
    child.stderr.on('data', data => errors.push(data));
    child.on('error', reject);
    child.stdin.on('error', reject);
    child.on('close', code => code === 0 ? resolve(Buffer.concat(output)) :
      reject(new Error(`PNG encoding failed: ${Buffer.concat(errors).toString('utf8').trim()}`)));
    child.stdin.end(png);
  });
}

function outputPath(value) {
  const out = path.resolve(value ?? path.join(projectRoot, 'public'));
  if (out === path.parse(out).root || out === projectRoot || projectRoot.startsWith(`${out}${path.sep}`)) {
    throw new RangeError('output directory cannot contain the project root');
  }
  return out;
}

async function present(pathname) {
  try { return await lstat(pathname); } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function installStage(stage, out) {
  const existing = await present(out);
  if (existing && !existing.isDirectory()) throw new Error('output path must be a directory');
  const previous = `${stage}.previous`;
  let movedOld = false;
  try {
    if (existing) { await rename(out, previous); movedOld = true; }
    await rename(stage, out);
  } catch (error) {
    if (movedOld) await rename(previous, out);
    throw error;
  }
  // A failed cleanup cannot turn a completed publish into a reported failure.
  if (movedOld) await rm(previous, { recursive: true, force: true }).catch(() => {});
}

/** Produce a validated frame or bundle. Dependencies can be injected for offline tests. */
export async function runJob(options = {}, deps = {}) {
  if (options.now != null && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(options.now)) {
    throw new RangeError('--now must be an offset-bearing ISO instant');
  }
  const now = options.now == null ? new Date() : new Date(options.now);
  if (!Number.isFinite(now.getTime())) throw new RangeError('--now must be an ISO instant');
  if (options.lowBattery && !options.fixture) throw new RangeError('--low-battery requires --fixture');
  const out = outputPath(options.out);
  const config = deps.config ?? loadConfig();
  const render = deps.renderFixture ?? renderFixture;
  const bundle = deps.writeBundle ?? writeBundle;
  const step = deps.onStep ?? (() => {});
  let fixture;
  let dataUpdateTime;
  let footer;
  if (options.fixture) {
    step('fixture');
    fixture = JSON.parse(await readFile(path.resolve(options.fixture), 'utf8'));
    dataUpdateTime = fixture.localNow;
    footer = fixture.lastUpdate;
  } else {
    step('timing');
    const times = timeInputs(now, config);
    step('fetch');
    const nws = await (deps.fetchAll ?? fetchAll)(config, { now, fetchImpl: deps.fetchImpl, ...deps.fetchOptions });
    step('normalize');
    fixture = (deps.buildFixture ?? buildFixture)({ nws, times });
    dataUpdateTime = nws.meta?.dataUpdateTime ?? nws.meta?.fetchedAt;
    footer = times.lastUpdate;
  }
  step('validate');
  const validate = deps.validateNormal ?? require('../../design/lib/render.js').validateNormal;
  validate(fixture);
  step('render');
  const normalPng = await render(fixture, options.fixture ? fixture.lowBattery === true : false);
  const lowbatPng = options.fixture
    ? (options.lowBattery ? await render(fixture, true) : null)
    : await render(fixture, true);

  step('stage');
  await mkdir(path.dirname(out), { recursive: true });
  const stage = await mkdtemp(path.join(path.dirname(out), `.${path.basename(out)}.stage-`));
  try {
    let meta;
    if (options.fixture) {
      await writeFile(path.join(stage, 'frame.png'), options.lowBattery ? lowbatPng : normalPng);
    } else {
      meta = await bundle(stage, {
        normalPng, lowbatPng,
        meta: { renderedAt: now.toISOString(), dataUpdateTime, footerTimestamp: footer },
      });
    }
    if (!options.dryRun) {
      step('publish');
      await installStage(stage, out);
    }
    return { dataUpdateTime, footerTimestamp: footer, meta, output: out };
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}
