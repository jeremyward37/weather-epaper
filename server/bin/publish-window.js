#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { refreshWindow } from '../src/timing.js';

const timeZone = 'America/Denver';

export function shouldPublish(now, eventName) {
  if (eventName !== 'schedule' && eventName !== 'workflow_dispatch') {
    throw new Error(`unsupported event: ${eventName}`);
  }
  const instant = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(instant.getTime())) throw new Error('invalid time');
  return refreshWindow(instant).inWindow;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const eventName = process.argv[2];
  if (!eventName) throw new Error('event name required');
  const now = new Date();
  const publish = shouldPublish(now, eventName);
  console.error(JSON.stringify({ publish, eventName, now: now.toISOString(), timeZone }));
  console.log(publish ? 'true' : 'false');
}
