import { mapPeriod } from './conditions.js';
import { currentHourlyPeriod } from './nws.js';

const fail = message => { throw new RangeError(`invalid fixture: ${message}`); };
const dateMs = value => Date.parse(value);
const roundHalfAway = number => Math.sign(number) * Math.floor(Math.abs(number) + 0.5);
const ymd = (instant, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(instant));
  const get = type => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
};

function temperature(value, label) {
  const rounded = roundHalfAway(value);
  if (!Number.isFinite(value) || rounded < -99 || rounded > 199 || String(rounded).length > 3) fail(`${label} temperature out of bounds`);
  return rounded;
}

function map(period, isDay) {
  const temp = temperature(period.temperature, 'forecast');
  return { ...mapPeriod({ iconUrl: period.icon, shortForecast: period.shortForecast,
    pop: period.probabilityOfPrecipitation?.value, temperatureF: temp, isDay }) };
}

/** times is supplied by T09: now, currentIsDay, marks[{at,time,isDay}], days[{date,day}], timeZone, plus optional display fields. */
export function buildFixture({ nws, times }) {
  if (!nws || !times || !Array.isArray(nws.hourly) || !Array.isArray(nws.daily)) fail('NWS data missing');
  const now = dateMs(times.now);
  if (!Number.isFinite(now) || typeof times.currentIsDay !== 'boolean' || !Array.isArray(times.marks) || times.marks.length !== 4 || !Array.isArray(times.days) || times.days.length !== 3) fail('time inputs missing');
  const timeZone = times.timeZone ?? 'America/Denver';
  const currentPeriod = currentHourlyPeriod(nws.hourly, now);
  if (!currentPeriod) fail('current-hour forecast missing');
  const observation = nws.observation;
  const age = now - dateMs(observation?.timestamp);
  const useObservation = Number.isFinite(age) && age >= 0 && age < 90 * 60_000 && Number.isFinite(observation?.temperature?.value);
  const currentTemp = useObservation ? temperature(observation.temperature.value * 9 / 5 + 32, 'observation') : temperature(currentPeriod.temperature, 'current forecast');
  // Observation text/icon may be absent. The current-hour forecast then provides
  // the condition while the fresh station reading still provides temperature.
  const observationIcon = observation?.icon;
  const iconPeriod = useObservation && typeof observationIcon === 'string' && /\/icons\/land\//.test(observationIcon)
    ? { ...currentPeriod, icon: observationIcon, shortForecast: observation.textDescription || currentPeriod.shortForecast,
      probabilityOfPrecipitation: { value: 0 } }
    : currentPeriod;
  const current = { temp: currentTemp, icon: map(iconPeriod, times.currentIsDay).icon };
  const threeHourly = times.marks.map(mark => {
    const at = dateMs(mark.at);
    if (!Number.isFinite(at) || typeof mark.isDay !== 'boolean' || !/^(?:[1-9]|1[0-2]) (?:AM|PM)$/.test(mark.time)) fail('invalid mark');
    const period = nws.hourly.find(p => dateMs(p.startTime) === at);
    if (!period) fail(`missing hourly mark at ${mark.at}`);
    return { time: mark.time, temp: temperature(period.temperature, 'hourly'), ...map(period, mark.isDay) };
  });
  const daily = times.days.map(({ date, day }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/.test(day)) fail('invalid daily label');
    const daytime = nws.daily.find(p => p.isDaytime === true && ymd(p.startTime, timeZone) === date);
    if (!daytime) fail(`missing daytime forecast for ${date}`);
    const nextNight = nws.daily.find(p => p.isDaytime === false && dateMs(p.startTime) === dateMs(daytime.endTime));
    if (!nextNight) fail(`missing following night forecast for ${date}`);
    return { day, high: temperature(daytime.temperature, 'daily high'), low: temperature(nextNight.temperature, 'daily low'), ...map(daytime, true) };
  });
  const fixture = { id: 'live', description: 'NWS live weather', lowBattery: false, current, daily, threeHourly };
  for (const key of ['localNow', 'lastUpdate', 'sun']) if (times[key] !== undefined) fixture[key] = times[key];
  return fixture;
}
