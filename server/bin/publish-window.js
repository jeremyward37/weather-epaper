#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { refreshWindow } from '../src/timing.js';

const timeZone = 'America/Denver';
const clock = new Intl.DateTimeFormat('en-US', {
  timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function shouldPublish(now, eventName) {
  if (eventName !== 'schedule' && eventName !== 'workflow_dispatch') {
    throw new Error(`unsupported event: ${eventName}`);
  }
  const instant = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(instant.getTime())) throw new Error('invalid time');
  const { inWindow } = refreshWindow(instant);
  if (inWindow) return true;

  // Both built-in and external dispatches at 4:47 prepare the 5:00 wake.
  // A late built-in 21:47 run retains its short grace after the 22:00 wake.
  const parts = Object.fromEntries(clock.formatToParts(instant).map(({ type, value }) => [type, value]));
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  return (minutes >= 4 * 60 + 47 && minutes < 5 * 60)
    || (eventName === 'schedule' && minutes > 22 * 60 && minutes < 22 * 60 + 30);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const eventName = process.argv[2];
  if (!eventName) throw new Error('event name required');
  const now = new Date();
  const publish = shouldPublish(now, eventName);
  console.error(JSON.stringify({ publish, eventName, now: now.toISOString(), timeZone }));
  console.log(publish ? 'true' : 'false');
}
