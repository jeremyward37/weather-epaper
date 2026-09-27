import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { mapPeriod, parseIconUrl } from '../src/conditions.js';

const iconMap = readFileSync(new URL('../../design/icon-map.md', import.meta.url), 'utf8');
const manifest = new Set([...iconMap.matchAll(/^\| Condition \| `([a-zA-Z]+)-66\.png` \|/gm)].map(match => match[1]));
assert.equal(manifest.size, 30, 'the approved condition manifest has 30 semantics');

const expected = {
  skc: 'clear', few: 'mostlyClear', sct: 'partly', bkn: 'cloudy', ovc: 'overcast',
  wind_skc: 'wind', wind_few: 'wind', wind_sct: 'wind', wind_bkn: 'wind', wind_ovc: 'wind',
  snow: 'snow', rain_snow: 'mix', rain_sleet: 'mix', snow_sleet: 'mix',
  fzra: 'mix', rain_fzra: 'mix', snow_fzra: 'mix', sleet: 'mix',
  rain: 'rain', rain_showers: 'showers', rain_showers_hi: 'showers',
  tsra: 'thunder', tsra_sct: 'thunder', tsra_hi: 'thunder',
  tornado: 'thunder', hurricane: 'thunder', tropical_storm: 'thunder',
  dust: 'smoke', smoke: 'smoke', haze: 'fog', hot: 'clear', cold: 'clear',
  blizzard: 'flurries', fog: 'fog',
};
assert.equal(Object.keys(expected).length, 34);
const decisionTable = readFileSync(new URL('../../docs/nws-condition-map.md', import.meta.url), 'utf8');
const documentedCodes = [...decisionTable.matchAll(/^\| `([a-z_]+)` \| `([a-zA-Z]+)` \|/gm)];
test('the documented decision table covers exactly the 34 supported NWS codes', () => {
  assert.equal(documentedCodes.length, 34);
  assert.deepEqual(new Set(documentedCodes.map(row => row[1])), new Set(Object.keys(expected)));
  for (const row of documentedCodes) assert.equal(row[2], expected[row[1]], row[1]);
});

const typeForBase = {
  rain: 'Rain', showers: 'Rain', drizzle: 'Rain',
  snow: 'Snow', flurries: 'Snow', mix: 'Mix', thunder: 'Thunder',
};
const validatorRegex = {
  Rain: /rain|showers|drizzle/i,
  Snow: /snow|flurries/i,
  Mix: /mix|sleet/i,
  Thunder: /thunder/i,
};

function verifyResult(result) {
  assert(manifest.has(result.icon), `${result.icon} is missing from icon-map.md`);
  assert(Number.isInteger(result.precip) && result.precip >= 0 && result.precip <= 100);
  assert.equal(result.precip === 0, result.type === null);
  if (result.precip > 0) {
    assert(validatorRegex[result.type]?.test(result.icon), `${result.icon} does not carry ${result.type}`);
  }
}

function mapped(code, overrides = {}) {
  return mapPeriod({
    iconUrl: `/icons/land/day/${code}?size=medium`,
    shortForecast: 'Forecast', pop: 0, temperatureF: 45, isDay: true,
    ...overrides,
  });
}

for (const [code, base] of Object.entries(expected)) {
  for (const isDay of [true, false]) {
    test(`code ${code} in civil ${isDay ? 'day' : 'night'}`, () => {
      const iconUrl = `/icons/land/${isDay ? 'night' : 'day'}/${code}?size=small`;
      const icon = base === 'overcast' || base === 'smoke' ? base : `${base}${isDay ? 'Day' : 'Night'}`;
      const result = mapped(code, { iconUrl, isDay });
      assert.deepEqual(result, { icon, precip: 0, type: null });
      verifyResult(result);
    });
    test(`code ${code} with positive PoP in civil ${isDay ? 'day' : 'night'}`, () => {
      const result = mapped(code, { pop: 35, isDay });
      const expectedBase = typeForBase[base] ? base : (45 <= 34 ? 'snow' : 'showers');
      assert.equal(result.icon, `${expectedBase}${isDay ? 'Day' : 'Night'}`);
      assert.equal(result.type, typeForBase[expectedBase]);
      verifyResult(result);
    });
  }
}

test('relative and absolute paths parse identically; absent icon PoP is null', () => {
  const expectedParts = { timeOfDay: 'night', halves: [{ code: 'rain_showers', pop: 20 }, { code: 'bkn', pop: null }] };
  assert.deepEqual(parseIconUrl('/icons/land/night/rain_showers,20/bkn?size=medium'), expectedParts);
  assert.deepEqual(parseIconUrl('https://api.weather.gov/icons/land/night/rain_showers,20/bkn?size=medium'), expectedParts);
});

test('higher embedded chance chooses its half, while period PoP remains authoritative', () => {
  assert.deepEqual(mapped('skc', { iconUrl: '/icons/land/day/rain_showers,20/tsra_hi,50', pop: 48 }),
    { icon: 'thunderDay', precip: 48, type: 'Thunder' });
  assert.deepEqual(mapped('skc', { iconUrl: '/icons/land/day/snow,90/rain,20', pop: 12 }),
    { icon: 'snowDay', precip: 12, type: 'Snow' });
});

test('dual tie chooses the second half, including two absent percentages', () => {
  assert.equal(mapped('skc', { iconUrl: '/icons/land/day/snow,20/rain,20' }).icon, 'rainDay');
  assert.equal(mapped('skc', { iconUrl: '/icons/land/day/skc/bkn' }).icon, 'cloudyDay');
});

for (const [forecast, icon, type] of [
  ['Slight Chance Drizzle', 'drizzleDay', 'Rain'],
  ['Chance Snow Flurries', 'flurriesDay', 'Snow'],
  ['Hail', 'thunderDay', 'Thunder'],
  ['Isolated Showers And Thunderstorms', 'thunderDay', 'Thunder'],
  ['Rain and Snow', 'mixDay', 'Mix'],
  ['Rain/Snow', 'mixDay', 'Mix'],
  ['Wintry Mix', 'mixDay', 'Mix'],
  ['Freezing Rain', 'mixDay', 'Mix'],
]) {
  test(`free-text refinement: ${forecast}`, () => {
    const result = mapped('skc', { shortForecast: forecast, pop: 25 });
    assert.deepEqual(result, { icon, precip: 25, type });
    verifyResult(result);
  });
}

test('hail artwork is available when no percentage is shown', () => {
  assert.deepEqual(mapped('skc', { shortForecast: 'Hail', pop: 0 }),
    { icon: 'hailDay', precip: 0, type: null });
});

for (const [forecast, icon, type] of [
  ['Chance Snow', 'snowDay', 'Snow'],
  ['Chance Sleet', 'mixDay', 'Mix'],
  ['Chance Thunderstorms', 'thunderDay', 'Thunder'],
  ['Slight Chance Rain Showers', 'showersDay', 'Rain'],
  ['Chance Drizzle', 'drizzleDay', 'Rain'],
  ['No named type', 'snowDay', 'Snow'],
]) {
  test(`generic positive-PoP icon upgrades: ${forecast}`, () => {
    const result = mapped('bkn', { shortForecast: forecast, pop: 5, temperatureF: 34 });
    assert.deepEqual(result, { icon, precip: 5, type });
    verifyResult(result);
  });
}

test('unspecified precipitation is showers above 34 °F', () => {
  assert.equal(mapped('skc', { pop: 1, temperatureF: 35 }).icon, 'showersDay');
});

test('hot/cold code may be refined by cloud wording', () => {
  assert.equal(mapped('hot', { shortForecast: 'Hot and Mostly Cloudy' }).icon, 'cloudyDay');
  assert.equal(mapped('cold', { shortForecast: 'Cold and Partly Cloudy' }).icon, 'partlyDay');
  assert.equal(mapped('hot', { shortForecast: 'Hot and Overcast' }).icon, 'overcast');
});

test('zero and null PoP keep a weather icon but return no type', () => {
  assert.deepEqual(mapped('snow', { pop: null }), { icon: 'snowDay', precip: 0, type: null });
  assert.deepEqual(mapped('rain', { pop: 0 }), { icon: 'rainDay', precip: 0, type: null });
});

test('period PoP rounds and clamps', () => {
  assert.equal(mapped('snow', { pop: -4 }).precip, 0);
  assert.equal(mapped('snow', { pop: 104 }).precip, 100);
  assert.equal(mapped('snow', { pop: 5.6 }).precip, 6);
});

test('invalid inputs fail closed', () => {
  for (const url of ['/icons/land/day/unknown', '/icons/land/day/skc/rain/snow', '/icons/sea/day/skc', '/icons/land/day/skc,101']) {
    assert.throws(() => parseIconUrl(url));
  }
  assert.throws(() => mapped('skc', { pop: NaN }), /pop/);
  assert.throws(() => mapped('skc', { isDay: 'yes' }), /isDay/);
  assert.throws(() => mapped('skc', { pop: 2, temperatureF: null }), /temperatureF/);
});

for (const fixture of ['forecast-2026-09-26.json', 'hourly-2026-09-26.json']) {
  const data = JSON.parse(readFileSync(new URL(`fixtures/nws/${fixture}`, import.meta.url), 'utf8'));
  assert(data.properties.periods.length > 0);
  for (const [index, period] of data.properties.periods.entries()) {
    test(`recorded ${fixture} period ${index}: ${period.shortForecast}`, () => {
      const result = mapPeriod({
        iconUrl: period.icon,
        shortForecast: period.shortForecast,
        pop: period.probabilityOfPrecipitation.value,
        temperatureF: period.temperature,
        isDay: index % 2 === 0,
      });
      verifyResult(result);
    });
  }
}

test('recorded daily dual icon chooses the wetter later thunder half', () => {
  const forecast = JSON.parse(readFileSync(new URL('fixtures/nws/forecast-2026-09-26.json', import.meta.url), 'utf8'));
  const period = forecast.properties.periods.find(p => p.shortForecast === 'Chance Rain Showers');
  assert(period);
  assert.deepEqual(mapPeriod({ iconUrl: period.icon, shortForecast: period.shortForecast,
    pop: period.probabilityOfPrecipitation.value, temperatureF: period.temperature, isDay: true }),
  { icon: 'thunderDay', precip: 48, type: 'Thunder' });
});
