import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldPublish } from '../bin/publish-window.js';

test('scheduled and external publishes are allowed all day, including overnight and DST', () => {
  for (const event of ['schedule', 'workflow_dispatch']) {
    for (const day of ['2026-07-15', '2026-01-15', '2026-03-08', '2026-11-01']) {
      for (let minute = 0; minute < 1440; minute += 1) {
        const now = new Date(`${day}T00:00:00Z`);
        now.setUTCMinutes(minute);
        assert.equal(shouldPublish(now, event), true, `${event} ${now.toISOString()}`);
      }
    }
  }
});

test('invalid instants and unrelated events remain rejected', () => {
  assert.throws(() => shouldPublish('invalid', 'schedule'), /invalid time/);
  assert.throws(() => shouldPublish(new Date(), 'push'), /unsupported event/);
});
