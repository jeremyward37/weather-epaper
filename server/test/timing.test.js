import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  nextThreeHourMarks, nextThreeDays, civilEvents, isDay,
  footerTimestamp, refreshWindow,
} from '../src/timing.js';

const LAT = 41.25;
const LON = -112.03;

test('all five design fixtures have the expected three-hour and daily labels', () => {
  for (const name of ['summer', 'winter', 'spring', 'widths', 'night']) {
    const fixture = JSON.parse(readFileSync(new URL(`../../design/fixtures/normal-${name}.json`, import.meta.url)));
    const marks = nextThreeHourMarks(fixture.localNow);
    const days = nextThreeDays(fixture.localNow);
    assert.deepEqual(marks.map(mark => mark.time), fixture.threeHourly.map(mark => mark.time), name);
    assert.deepEqual(days.map(day => day.day), fixture.daily.map(day => day.day), name);
    assert.ok(marks.every(mark => mark.instant instanceof Date));
    assert.ok(days.every(day => /^\d{4}-\d{2}-\d{2}$/.test(day.date)));
    assert.equal(footerTimestamp(fixture.localNow), fixture.lastUpdate, name);
  }
});

test('marks are strictly future and use the exact hour across midnight', () => {
  assert.deepEqual(nextThreeHourMarks('2026-07-15T16:58:00-06:00').map(x => x.time),
    ['6 PM', '9 PM', '12 AM', '3 AM']);
  assert.deepEqual(nextThreeHourMarks('2026-07-15T15:00:00-06:00').map(x => x.time),
    ['6 PM', '9 PM', '12 AM', '3 AM']);
  assert.deepEqual(nextThreeHourMarks('2026-12-31T23:58:00-07:00').map(x => x.time),
    ['12 AM', '3 AM', '6 AM', '9 AM']);
});

test('DST changes preserve real-instant order and local labels', () => {
  const spring = nextThreeHourMarks('2026-03-08T01:30:00-07:00');
  assert.deepEqual(spring.map(x => x.time), ['3 AM', '6 AM', '9 AM', '12 PM']);
  assert.equal(spring[0].instant.toISOString(), '2026-03-08T09:00:00.000Z');
  const fall = nextThreeHourMarks('2026-11-01T00:30:00-06:00');
  assert.deepEqual(fall.map(x => x.time), ['3 AM', '6 AM', '9 AM', '12 PM']);
  assert.equal(fall[0].instant.toISOString(), '2026-11-01T10:00:00.000Z');
  assert.ok(fall.every((mark, i) => i === 0 || mark.instant > fall[i - 1].instant));
});

test('daily dates and footer formatting handle month and year boundaries', () => {
  assert.deepEqual(nextThreeDays('2026-12-31T23:58:00-07:00'), [
    { date: '2027-01-01', day: 'Fri' },
    { date: '2027-01-02', day: 'Sat' },
    { date: '2027-01-03', day: 'Sun' },
  ]);
  assert.equal(footerTimestamp('2026-12-31T12:58:00-07:00'), '12/31 12:58 PM');
  assert.equal(footerTimestamp('2027-01-01T00:08:00-07:00'), '1/1 12:08 AM');
});

test('civil events choose dawn, dusk, or next dawn and day includes the endpoints', () => {
  const morning = civilEvents('2026-09-24T05:00:00-06:00', LAT, LON);
  assert.equal(morning.event, 'civilDawn');
  assert.equal(morning.time, '6:51 AM');
  const afternoon = civilEvents(morning.instant, LAT, LON);
  assert.equal(afternoon.event, 'civilDusk');
  assert.equal(afternoon.time, '7:51 PM');
  const night = civilEvents(afternoon.instant, LAT, LON);
  assert.equal(night.event, 'civilDawn');
  assert.ok(night.instant > afternoon.instant);
  assert.equal(isDay(new Date(morning.instant.getTime() - 1), LAT, LON), false);
  assert.equal(isDay(morning.instant, LAT, LON), true);
  assert.equal(isDay(afternoon.instant, LAT, LON), true);
  assert.equal(isDay(new Date(afternoon.instant.getTime() + 1), LAT, LON), false);
});

test('civil twilight agrees with the published Ogden almanac within three minutes', () => {
  // https://www.timeanddate.com/sun/usa/ogden?month=3&year=2026
  // https://www.timeanddate.com/sun/usa/ogden?month=12&year=2026
  // Civil Twilight Start/End columns, March 8 and December 21 respectively.
  // Ogden is close to the fixed Marriott-Slaterville coordinates used here.
  const cases = [
    { date: '2026-03-08', dawn: '2026-03-08T13:23:00Z', dusk: '2026-03-09T01:54:00Z' },
    { date: '2026-12-21', dawn: '2026-12-21T14:18:00Z', dusk: '2026-12-22T00:33:00Z' },
  ];
  for (const row of cases) {
    const dawn = civilEvents(`${row.date}T12:00:00Z`, LAT, LON);
    const dusk = civilEvents(dawn.instant, LAT, LON);
    assert.equal(dawn.event, 'civilDawn');
    assert.equal(dusk.event, 'civilDusk');
    assert.ok(Math.abs(dawn.instant - new Date(row.dawn)) <= 3 * 60000, `${row.date} dawn`);
    assert.ok(Math.abs(dusk.instant - new Date(row.dusk)) <= 3 * 60000, `${row.date} dusk`);
  }
});

test('refresh window includes 5 AM through 10 PM and finds the next real slot', () => {
  const before = refreshWindow('2026-07-15T04:59:00-06:00');
  assert.equal(before.inWindow, false);
  assert.equal(before.nextSlot.toISOString(), '2026-07-15T11:00:00.000Z');
  assert.equal(refreshWindow('2026-07-15T05:00:00-06:00').inWindow, true);
  assert.equal(refreshWindow('2026-07-15T21:59:00-06:00').nextSlot.toISOString(),
    '2026-07-16T04:00:00.000Z');
  const last = refreshWindow('2026-07-15T22:00:00-06:00');
  assert.equal(last.inWindow, true);
  assert.equal(last.nextSlot.toISOString(), '2026-07-16T11:00:00.000Z');
  assert.equal(refreshWindow('2026-07-15T22:00:01-06:00').inWindow, false);
  assert.equal(refreshWindow('2026-07-15T22:01:00-06:00').inWindow, false);
  const spring = refreshWindow('2026-03-08T01:30:00-07:00');
  assert.equal(spring.inWindow, false);
  assert.equal(spring.nextSlot.toISOString(), '2026-03-08T11:00:00.000Z');
  const fall = refreshWindow('2026-11-01T00:30:00-06:00');
  assert.equal(fall.inWindow, false);
  assert.equal(fall.nextSlot.toISOString(), '2026-11-01T12:00:00.000Z');
  const repeatedHour = refreshWindow('2026-11-01T01:30:00-07:00');
  assert.equal(repeatedHour.inWindow, false);
  assert.equal(repeatedHour.nextSlot.toISOString(), '2026-11-01T12:00:00.000Z');
});
