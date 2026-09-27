import { readFileSync } from 'node:fs';

export function validateConfig(config) {
  const fail = message => { throw new TypeError(`invalid server config: ${message}`); };
  if (!config || typeof config !== 'object') fail('object required');
  if (!Number.isFinite(config.latitude) || Math.abs(config.latitude) > 90) fail('latitude');
  if (!Number.isFinite(config.longitude) || Math.abs(config.longitude) > 180) fail('longitude');
  if (!/^[A-Z]{3}$/.test(config.grid?.id) || !Number.isInteger(config.grid.x) || config.grid.x < 0 || !Number.isInteger(config.grid.y) || config.grid.y < 0) fail('grid');
  if (!/^[A-Z0-9]{3,6}$/.test(config.station)) fail('station');
  if (typeof config.timeZone !== 'string' || !config.timeZone) fail('timeZone');
  try { new Intl.DateTimeFormat('en-US', { timeZone: config.timeZone }); } catch { fail('timeZone'); }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contact)) fail('contact');
  const { startHour, endHour, intervalMinutes } = config.schedule ?? {};
  if (![startHour, endHour].every(x => Number.isInteger(x) && x >= 0 && x <= 23) || startHour >= endHour || !Number.isInteger(intervalMinutes) || intervalMinutes < 1 || 60 % intervalMinutes) fail('schedule');
  if (!Number.isInteger(config.requestTimeoutMs) || config.requestTimeoutMs < 1) fail('requestTimeoutMs');
  if (!Number.isInteger(config.retry?.retries) || config.retry.retries < 0 || config.retry.retries > 5 || !Number.isInteger(config.retry.baseDelayMs) || config.retry.baseDelayMs < 0 || !Number.isInteger(config.retry.jitterMs) || config.retry.jitterMs < 0) fail('retry');
  return config;
}

export function loadConfig(path = new URL('../config.json', import.meta.url)) {
  return validateConfig(JSON.parse(readFileSync(path, 'utf8')));
}
