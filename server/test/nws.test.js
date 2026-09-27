import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { loadConfig } from '../src/config.js';
import { fetchAll, FetchError } from '../src/nws.js';
import { buildFixture } from '../src/normalize.js';

const config = loadConfig();
const recorded = Object.fromEntries(['point', 'hourly', 'forecast', 'observation'].map(name =>
  [name, JSON.parse(readFileSync(new URL(`./fixtures/nws/${name}-2026-09-27.json`, import.meta.url)))]));
const at = new Date('2026-09-27T05:35:00Z');
const clone = value => structuredClone(value);

function mockFetch(bodies = recorded, statuses = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    const key = url.includes('/points/') ? 'point' : url.includes('/forecast/hourly') ? 'hourly' :
      url.includes('/forecast') ? 'forecast' : 'observation';
    calls.push({ key, headers: options.headers });
    const status = statuses[key]?.shift() ?? 200;
    return new Response(status === 200 ? JSON.stringify(bodies[key]) : null, {
      status, headers: { 'Last-Modified': statuses.lastModified ?? 'Sun, 27 Sep 2026 05:25:00 GMT' },
    });
  };
  return { fetchImpl, calls };
}

function times(nws, now = at) {
  const marks = nws.hourly.filter(p => new Date(p.startTime) > now && Number(p.startTime.slice(11, 13)) % 3 === 0).slice(0, 4)
    .map(p => ({ at: p.startTime, time: `${Number(p.startTime.slice(11, 13)) % 12 || 12} ${Number(p.startTime.slice(11, 13)) < 12 ? 'AM' : 'PM'}`, isDay: p.isDaytime }));
  const days = [{ date: '2026-09-27', day: 'Sun' }, { date: '2026-09-28', day: 'Mon' }, { date: '2026-09-29', day: 'Tue' }];
  return { now: now.toISOString(), currentIsDay: false, timeZone: config.timeZone, marks, days };
}

test('recorded happy path produces a four-mark, three-day fixture', async () => {
  const stub = mockFetch();
  const nws = await fetchAll(config, { fetchImpl: stub.fetchImpl, now: at, sleep: async () => {} });
  const fixture = buildFixture({ nws, times: times(nws) });
  assert.equal(fixture.current.temp, 64); // 18 C -> 64.4 F
  assert.equal(fixture.current.icon, 'clearNight');
  assert.equal(fixture.threeHourly.length, 4);
  assert.equal(fixture.daily.length, 3);
  assert.equal(fixture.daily[0].high, 81);
  assert.equal(stub.calls.length, 4);
  assert(stub.calls.every(call => call.headers['User-Agent'].includes(config.contact)));
});

test('stale and null observations fall back to the current hourly period', async () => {
  const nws = await fetchAll(config, { fetchImpl: mockFetch().fetchImpl, now: at });
  const forecastTemp = nws.hourly.find(p => new Date(p.startTime) <= at && at < new Date(p.endTime)).temperature;
  nws.observation.timestamp = new Date(at.getTime() - 90 * 60_000).toISOString();
  assert.equal(buildFixture({ nws, times: times(nws) }).current.temp, forecastTemp);
  nws.observation.timestamp = at.toISOString();
  nws.observation.temperature.value = null;
  assert.equal(buildFixture({ nws, times: times(nws) }).current.temp, forecastTemp);
});

test('500 retries then succeeds; conditional header is sent', async () => {
  const stub = mockFetch(recorded, { hourly: [500, 200] });
  const delays = [];
  await fetchAll(config, { fetchImpl: stub.fetchImpl, now: at, sleep: async ms => delays.push(ms), random: () => 0,
    lastModified: { hourly: 'Sat, 26 Sep 2026 18:00:00 GMT' } });
  assert.deepEqual(delays, [2000]);
  assert.equal(stub.calls.filter(call => call.key === 'hourly').length, 2);
  assert.equal(stub.calls.find(call => call.key === 'hourly').headers['If-Modified-Since'], 'Sat, 26 Sep 2026 18:00:00 GMT');
});

test('three 500 responses exhaust a two-retry policy with FetchError', async () => {
  const stub = mockFetch(recorded, { hourly: [500, 500, 500] });
  await assert.rejects(fetchAll({ ...config, retry: { ...config.retry, retries: 2 } },
    { fetchImpl: stub.fetchImpl, now: at, sleep: async () => {} }), FetchError);
});

test('future Last-Modified fails closed', async () => {
  const stub = mockFetch(recorded, { lastModified: 'Sun, 27 Sep 2026 06:00:00 GMT' });
  await assert.rejects(fetchAll(config, { fetchImpl: stub.fetchImpl, now: at, sleep: async () => {} }), FetchError);
});

test('stale updateTime and future generatedAt fail closed', async () => {
  for (const [field, value] of [
    ['updateTime', '2026-09-25T05:00:00Z'],
    ['generatedAt', '2026-09-27T06:00:00Z'],
  ]) {
    const bodies = clone(recorded);
    bodies.forecast.properties[field] = value;
    await assert.rejects(fetchAll(config, { fetchImpl: mockFetch(bodies).fetchImpl, now: at }), FetchError);
  }
});

test('304 without a cached body fails closed', async () => {
  const stub = mockFetch(recorded, { hourly: [304] });
  await assert.rejects(fetchAll(config, { fetchImpl: stub.fetchImpl, now: at,
    lastModified: { hourly: 'Sat, 26 Sep 2026 18:00:00 GMT' } }), FetchError);
});

test('missing current-hour period fails closed', async () => {
  const bodies = clone(recorded);
  bodies.hourly.properties.periods = bodies.hourly.properties.periods.filter(p => !(new Date(p.startTime) <= at && at < new Date(p.endTime)));
  await assert.rejects(fetchAll(config, { fetchImpl: mockFetch(bodies).fetchImpl, now: at }), FetchError);
});

test('out-of-bounds temperature and missing exact mark reject normalization', async () => {
  const nws = await fetchAll(config, { fetchImpl: mockFetch().fetchImpl, now: at });
  const inputs = times(nws);
  nws.hourly.find(p => p.startTime === inputs.marks[0].at).temperature = 200;
  assert.throws(() => buildFixture({ nws, times: inputs }), RangeError);
  nws.hourly.find(p => p.startTime === inputs.marks[0].at).temperature = 60;
  inputs.marks[0].at = '2026-12-01T03:00:00Z';
  assert.throws(() => buildFixture({ nws, times: inputs }), RangeError);
});
