#!/usr/bin/env node
import { loadConfig } from '../src/config.js';
import { fetchAll } from '../src/nws.js';
import { buildFixture } from '../src/normalize.js';

if (process.argv.slice(2).join(' ') !== '--json') {
  console.error('Usage: node server/bin/fetch.js --json');
  process.exit(2);
}

// T09 will supply civil twilight, exact mark selection, and display formatting.
// These provisional NWS period labels make this CLI a live data/shape probe only.
function probeTimes(nws, now, timeZone) {
  const date = instant => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(instant));
    const value = key => parts.find(part => part.type === key).value;
    return `${value('year')}-${value('month')}-${value('day')}`;
  };
  const today = date(now);
  const future = nws.hourly.filter(p => new Date(p.startTime) > now && Number(p.startTime.slice(11, 13)) % 3 === 0);
  const marks = future.slice(0, 4).map(p => ({ at: p.startTime,
    time: `${Number(p.startTime.slice(11, 13)) % 12 || 12} ${Number(p.startTime.slice(11, 13)) < 12 ? 'AM' : 'PM'}`,
    isDay: p.isDaytime }));
  const dayPeriods = nws.daily.filter(p => p.isDaytime && date(p.startTime) > today);
  const days = dayPeriods.slice(0, 3).map(p => ({ date: date(p.startTime), day: new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(new Date(p.startTime)) }));
  return { now: now.toISOString(), timeZone, currentIsDay: nws.hourly.find(p => new Date(p.startTime) <= now && now < new Date(p.endTime)).isDaytime, marks, days };
}

try {
  const config = loadConfig();
  const now = new Date();
  const nws = await fetchAll(config, { now });
  const fixture = buildFixture({ nws, times: probeTimes(nws, now, config.timeZone) });
  console.log(JSON.stringify(fixture, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
