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

test('external dispatch covers prepublish and retains overnight boundaries', () => {
  assert.equal(shouldPublish('2026-07-15T04:46:59-06:00', 'workflow_dispatch'), false);
  assert.equal(shouldPublish('2026-07-15T04:47:00-06:00', 'workflow_dispatch'), true);
  assert.equal(shouldPublish('2026-07-15T04:59:59-06:00', 'workflow_dispatch'), true);
  assert.equal(shouldPublish('2026-07-15T05:00:00-06:00', 'workflow_dispatch'), true);
  assert.equal(shouldPublish('2026-07-15T12:00:00-06:00', 'workflow_dispatch'), true);
  assert.equal(shouldPublish('2026-07-15T22:00:00-06:00', 'workflow_dispatch'), true);
  assert.equal(shouldPublish('2026-07-15T22:01:00-06:00', 'workflow_dispatch'), false);
  assert.equal(shouldPublish('2026-07-15T22:15:00-06:00', 'workflow_dispatch'), false);
  assert.equal(shouldPublish('2026-07-15T23:00:00-06:00', 'workflow_dispatch'), false);
});

test('Mountain window follows winter offset', () => {
  assert.equal(shouldPublish('2026-01-15T04:47:00-07:00', 'schedule'), true);
  assert.equal(shouldPublish('2026-01-15T22:15:00-07:00', 'schedule'), true);
});

test('external prepublish follows Mountain winter and both DST boundaries', () => {
  for (const [before, opens, closes] of [
    ['2026-01-15T11:46:59Z', '2026-01-15T11:47:00Z', '2026-01-15T11:59:59Z'],
    ['2026-03-08T10:46:59Z', '2026-03-08T10:47:00Z', '2026-03-08T10:59:59Z'],
    ['2026-11-01T11:46:59Z', '2026-11-01T11:47:00Z', '2026-11-01T11:59:59Z'],
  ]) {
    assert.equal(shouldPublish(before, 'workflow_dispatch'), false);
    assert.equal(shouldPublish(opens, 'workflow_dispatch'), true);
    assert.equal(shouldPublish(closes, 'workflow_dispatch'), true);
  }
});
