#!/usr/bin/env node
// Manual fixture refresh; never invoked by tests or CI.
import { mkdir, writeFile } from 'node:fs/promises';
import { loadConfig } from '../src/config.js';

const config = loadConfig();
const headers = { 'User-Agent': `(weather-epaper, ${config.contact})`, Accept: 'application/geo+json' };
async function request(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(config.requestTimeoutMs) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}
const point = await request(`https://api.weather.gov/points/${config.latitude},${config.longitude}`);
const base = point.properties;
const responses = {
  point,
  hourly: await request(base.forecastHourly),
  forecast: await request(base.forecast),
  observation: await request(`https://api.weather.gov/stations/${config.station}/observations/latest`),
};
const stamp = new Date().toISOString().slice(0, 10);
const directory = new URL('./fixtures/nws/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const [name, body] of Object.entries(responses)) {
  const path = new URL(`${name}-${stamp}.json`, directory);
  await writeFile(path, JSON.stringify(body, null, 2) + '\n');
  console.log(path.pathname);
}
