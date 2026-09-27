import { validateConfig } from './config.js';

export class FetchError extends Error {
  constructor(message, { cause, status } = {}) {
    super(message, { cause });
    this.name = 'FetchError';
    this.status = status;
  }
}

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const parsedTime = value => typeof value === 'string' ? Date.parse(value) : NaN;
const need = (ok, message) => { if (!ok) throw new FetchError(message); };

export function currentHourlyPeriod(periods, now) {
  const instant = new Date(now).getTime();
  return periods.find(p => parsedTime(p.startTime) <= instant && instant < parsedTime(p.endTime));
}

async function getJson(url, config, { fetchImpl, now, lastModified, cached, sleep, random }) {
  const headers = { Accept: 'application/geo+json', 'User-Agent': `(weather-epaper, ${config.contact})` };
  if (lastModified) headers['If-Modified-Since'] = lastModified;
  for (let attempt = 0; attempt <= config.retry.retries; attempt++) {
    let response;
    try {
      response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(config.requestTimeoutMs) });
      if (response.status === 304) {
        need(cached != null, `${url}: 304 without cached body`);
        return { body: cached, lastModified };
      }
      if (response.ok) {
        const modified = response.headers?.get('last-modified') ?? null;
        need(!modified || (Number.isFinite(parsedTime(modified)) && parsedTime(modified) <= now.getTime()), `${url}: future or invalid Last-Modified`);
        let body;
        try { body = await response.json(); } catch (cause) { throw new FetchError(`${url}: invalid JSON`, { cause }); }
        return { body, lastModified: modified };
      }
      if (response.status !== 429 && response.status < 500) throw new FetchError(`${url}: HTTP ${response.status}`, { status: response.status });
      if (attempt === config.retry.retries) throw new FetchError(`${url}: HTTP ${response.status}`, { status: response.status });
    } catch (cause) {
      if (cause instanceof FetchError) throw cause;
      if (attempt === config.retry.retries) throw new FetchError(`${url}: network failure`, { cause });
    }
    await sleep(config.retry.baseDelayMs * 2 ** attempt + Math.floor(random() * config.retry.jitterMs));
  }
}

function validateForecast(body, kind, now) {
  const properties = body?.properties;
  need(properties && Array.isArray(properties.periods), `${kind}: missing periods`);
  need(properties.periods.length >= (kind === 'hourly' ? 12 : 8), `${kind}: too few periods`);
  const generated = parsedTime(properties.generatedAt);
  const updated = parsedTime(properties.updateTime);
  need(Number.isFinite(generated) && generated <= now.getTime() + 5 * 60_000, `${kind}: invalid generatedAt`);
  need(Number.isFinite(updated) && updated <= now.getTime() + 5 * 60_000 && now.getTime() - updated <= 24 * 60 * 60_000, `${kind}: stale updateTime`);
  for (const period of properties.periods) {
    need(Number.isFinite(parsedTime(period.startTime)) && Number.isFinite(parsedTime(period.endTime)) && parsedTime(period.startTime) < parsedTime(period.endTime), `${kind}: invalid period time`);
    need(Number.isFinite(period.temperature) && period.temperatureUnit === 'F' && typeof period.icon === 'string' && typeof period.shortForecast === 'string', `${kind}: invalid period fields`);
    const pop = period.probabilityOfPrecipitation?.value;
    need(pop == null || (Number.isFinite(pop) && pop >= 0 && pop <= 100), `${kind}: invalid precipitation`);
  }
  if (kind === 'hourly') need(currentHourlyPeriod(properties.periods, now), 'hourly: missing current-hour period');
  return properties.periods;
}

/** Fetch fresh point, hourly, daily, and station data. Any bad input means no new frame. */
export async function fetchAll(config, { fetchImpl = fetch, now = new Date(), lastModified = {}, cached = {}, sleep = pause, random = Math.random } = {}) {
  validateConfig(config);
  now = new Date(now);
  need(Number.isFinite(now.getTime()), 'invalid now');
  const request = (key, url) => getJson(url, config, { fetchImpl, now, lastModified: lastModified[key], cached: cached[key], sleep, random });
  const point = await request('point', `https://api.weather.gov/points/${config.latitude},${config.longitude}`);
  const links = point.body?.properties;
  need(links && /^[A-Z]{3}$/.test(links.gridId) && Number.isInteger(links.gridX) && Number.isInteger(links.gridY) && links.timeZone === config.timeZone, 'point: invalid grid or time zone');
  for (const key of ['forecast', 'forecastHourly']) need(/^https:\/\/api\.weather\.gov\//.test(links[key]), `point: invalid ${key} URL`);
  const [hourlyResponse, dailyResponse, observationResponse] = await Promise.all([
    request('hourly', links.forecastHourly), request('daily', links.forecast),
    request('observation', `https://api.weather.gov/stations/${config.station}/observations/latest`),
  ]);
  const hourly = validateForecast(hourlyResponse.body, 'hourly', now);
  const daily = validateForecast(dailyResponse.body, 'daily', now);
  const observation = observationResponse.body?.properties;
  need(observation && Number.isFinite(parsedTime(observation.timestamp)), 'observation: invalid timestamp');
  need(observation.temperature?.value == null || Number.isFinite(observation.temperature.value), 'observation: invalid temperature');
  need(observation.temperature?.value == null || observation.temperature.unitCode === 'wmoUnit:degC', 'observation: temperature is not Celsius');
  return {
    hourly, daily, observation,
    meta: { fetchedAt: now.toISOString(), dataUpdateTime: hourlyResponse.body.properties.updateTime,
      grid: { id: links.gridId, x: links.gridX, y: links.gridY }, station: config.station,
      lastModified: { point: point.lastModified, hourly: hourlyResponse.lastModified, daily: dailyResponse.lastModified, observation: observationResponse.lastModified } },
  };
}
