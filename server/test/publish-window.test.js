import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldPublish } from '../bin/publish-window.js';

test('scheduled publish covers first and last wake and skips overnight', () => {
  assert.equal(shouldPublish('2026-07-15T04:46:00-06:00', 'schedule'), false);
  assert.equal(shouldPublish('2026-07-15T04:47:00-06:00', 'schedule'), true);
  assert.equal(shouldPublish('2026-07-15T05:17:00-06:00', 'schedule'), true);
  assert.equal(shouldPublish('2026-07-15T22:15:00-06:00', 'schedule'), true);
  assert.equal(shouldPublish('2026-07-15T22:30:00-06:00', 'schedule'), false);
});

test('manual dispatch outside the refresh window skips publication', () => {
  assert.equal(shouldPublish('2026-07-15T04:47:00-06:00', 'workflow_dispatch'), false);
  assert.equal(shouldPublish('2026-07-15T12:00:00-06:00', 'workflow_dispatch'), true);
  assert.equal(shouldPublish('2026-07-15T22:15:00-06:00', 'workflow_dispatch'), false);
});

test('Mountain window follows winter offset', () => {
  assert.equal(shouldPublish('2026-01-15T04:47:00-07:00', 'schedule'), true);
  assert.equal(shouldPublish('2026-01-15T22:15:00-07:00', 'schedule'), true);
});
