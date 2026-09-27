// Pure translation of NWS forecast icon codes and period fields to design icons.
// The complete decision table is docs/nws-condition-map.md.
const codeBases = Object.freeze({
  skc: 'clear', few: 'mostlyClear', sct: 'partly', bkn: 'cloudy', ovc: 'overcast',
  wind_skc: 'wind', wind_few: 'wind', wind_sct: 'wind', wind_bkn: 'wind', wind_ovc: 'wind',
  snow: 'snow', rain_snow: 'mix', rain_sleet: 'mix', snow_sleet: 'mix',
  fzra: 'mix', rain_fzra: 'mix', snow_fzra: 'mix', sleet: 'mix',
  rain: 'rain', rain_showers: 'showers', rain_showers_hi: 'showers',
  tsra: 'thunder', tsra_sct: 'thunder', tsra_hi: 'thunder',
  tornado: 'thunder', hurricane: 'thunder', tropical_storm: 'thunder',
  dust: 'smoke', smoke: 'smoke', haze: 'fog', hot: 'clear', cold: 'clear',
  blizzard: 'flurries', fog: 'fog',
});

const baseTypes = Object.freeze({
  rain: 'Rain', showers: 'Rain', drizzle: 'Rain',
  snow: 'Snow', flurries: 'Snow', mix: 'Mix', thunder: 'Thunder',
});

/** Parse an absolute or relative NWS land icon path, including dual icons. */
export function parseIconUrl(url) {
  if (typeof url !== 'string') throw new TypeError('icon URL must be a string');
  const path = url.match(/^(?:https?:\/\/[^/?#]+)?\/icons\/land\/(day|night)\/([^?#]+)(?:\?[^#]*)?$/);
  if (!path) throw new Error(`invalid NWS land icon URL: ${url}`);
  const parts = path[2].split('/');
  if (parts.length < 1 || parts.length > 2) throw new Error(`invalid NWS icon halves: ${url}`);
  const halves = parts.map(part => {
    const match = part.match(/^([a-z_]+)(?:,(\d{1,3}))?$/);
    if (!match || !Object.hasOwn(codeBases, match[1])) throw new Error(`unknown NWS icon code: ${part}`);
    const pop = match[2] === undefined ? null : Number(match[2]);
    if (pop !== null && pop > 100) throw new Error(`invalid NWS icon chance: ${part}`);
    return { code: match[1], pop };
  });
  return { timeOfDay: path[1], halves };
}

function forecastOverride(forecast) {
  if (/\bthunder(?:storm)?s?\b/i.test(forecast)) return 'thunder';
  if (/\bhail\b/i.test(forecast)) return 'hail';
  if (/\b(?:sleet|freezing|wintry mix|ice pellets)\b|\brain(?:\s+(?:and|or)\s+|\s*\/\s*)snow\b|\bsnow(?:\s+(?:and|or)\s+|\s*\/\s*)rain\b/i.test(forecast)) return 'mix';
  if (/\bflurr(?:y|ies)\b/i.test(forecast)) return 'flurries';
  if (/\bdrizzle\b/i.test(forecast)) return 'drizzle';
  return null;
}

function cloudOverride(forecast) {
  if (/\bovercast\b/i.test(forecast)) return 'overcast';
  if (/\b(?:mostly cloudy|partly sunny)\b/i.test(forecast)) return 'cloudy';
  if (/\b(?:partly cloudy|mostly sunny)\b/i.test(forecast)) return 'partly';
  if (/\bmostly clear\b/i.test(forecast)) return 'mostlyClear';
  if (/\bcloudy\b/i.test(forecast)) return 'cloudy';
  return null;
}

function precipUpgrade(forecast, temperatureF) {
  if (/\bthunder(?:storm)?s?\b|\bhail\b/i.test(forecast)) return 'thunder';
  if (/\b(?:sleet|freezing|wintry mix|ice pellets)\b|\brain(?:\s+(?:and|or)\s+|\s*\/\s*)snow\b|\bsnow(?:\s+(?:and|or)\s+|\s*\/\s*)rain\b/i.test(forecast)) return 'mix';
  if (/\bflurr(?:y|ies)\b/i.test(forecast)) return 'flurries';
  if (/\bsnow\b/i.test(forecast)) return 'snow';
  if (/\b(?:rain|showers?|drizzle)\b/i.test(forecast)) return 'showers';
  if (!Number.isFinite(temperatureF)) throw new TypeError('temperatureF is required for an unspecified precipitation type');
  return temperatureF <= 34 ? 'snow' : 'showers';
}

/** Map one NWS period. The caller supplies civil-day status, not NWS isDaytime. */
export function mapPeriod({ iconUrl, shortForecast, pop, temperatureF, isDay }) {
  if (typeof shortForecast !== 'string') throw new TypeError('shortForecast must be a string');
  if (typeof isDay !== 'boolean') throw new TypeError('isDay must be a boolean');
  if (pop != null && !Number.isFinite(pop)) throw new TypeError('pop must be numeric or null');
  const precip = pop == null ? 0 : Math.max(0, Math.min(100, Math.round(pop)));
  const { halves } = parseIconUrl(iconUrl);
  // Daily icons have two six-hour halves; the wetter half wins, then afternoon.
  const half = halves.length === 1 || (halves[0].pop ?? 0) > (halves[1].pop ?? 0)
    ? halves[0] : halves[1];
  let base = codeBases[half.code];
  if (half.code === 'hot' || half.code === 'cold') base = cloudOverride(shortForecast) ?? base;
  base = forecastOverride(shortForecast) ?? base;
  // Hail has artwork, but the approved positive-PoP validator accepts only
  // Rain, Snow, Mix, and Thunder-bearing names. Use thunder when PoP is shown.
  if (precip > 0 && base === 'hail') base = 'thunder';
  if (precip > 0 && !Object.hasOwn(baseTypes, base)) base = precipUpgrade(shortForecast, temperatureF);
  const icon = base === 'overcast' || base === 'smoke' ? base : `${base}${isDay ? 'Day' : 'Night'}`;
  return { icon, precip, type: precip > 0 ? baseTypes[base] : null };
}
