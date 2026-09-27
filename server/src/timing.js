import SunCalc from '../vendor/suncalc.cjs';

const TIME_ZONE = 'America/Denver';
const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE, year: 'numeric', month: 'numeric', day: 'numeric',
  weekday: 'short', hour: 'numeric', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

function requireInstant(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError('Invalid instant');
  return date;
}

function localParts(instant) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(instant)
    .filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    weekday: parts.weekday, hour: Number(parts.hour), minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function localDateKey(parts) {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function localDateAtOffset(instant, days) {
  const { year, month, day } = localParts(instant);
  // Calendar arithmetic is done at UTC noon, never by adding 24 hours to a local instant.
  return new Date(Date.UTC(year, month - 1, day + days, 12));
}

function clockLabel(parts, withMinutes = false) {
  const hour = parts.hour % 12 || 12;
  return `${hour}${withMinutes ? `:${String(parts.minute).padStart(2, '0')}` : ''} ${parts.hour < 12 ? 'AM' : 'PM'}`;
}

export function nextThreeHourMarks(now) {
  const start = requireInstant(now).getTime();
  const marks = [];
  // Walk UTC instants. A nonexistent local hour cannot enter the result, and a
  // repeated hour remains in its real chronological position.
  let candidate = Math.floor(start / 3600000) * 3600000 + 3600000;
  while (marks.length < 4) {
    const instant = new Date(candidate);
    const parts = localParts(instant);
    if (parts.hour % 3 === 0 && parts.minute === 0) {
      marks.push({ instant, time: clockLabel(parts) });
    }
    candidate += 3600000;
  }
  return marks;
}

export function nextThreeDays(now) {
  const instant = requireInstant(now);
  return [1, 2, 3].map(offset => {
    const date = localDateAtOffset(instant, offset);
    const parts = localParts(date);
    return { date: localDateKey(parts), day: parts.weekday };
  });
}

function twilightForLocalDate(date, lat, lon) {
  const { dawn, dusk } = SunCalc.getTimes(date, lat, lon);
  if (!Number.isFinite(dawn?.getTime()) || !Number.isFinite(dusk?.getTime())) {
    throw new RangeError('Civil twilight is unavailable for this date and location');
  }
  return { dawn, dusk };
}

export function civilEvents(now, lat, lon) {
  const instant = requireInstant(now);
  const today = twilightForLocalDate(localDateAtOffset(instant, 0), lat, lon);
  let event;
  let next;
  if (instant < today.dawn) {
    event = 'civilDawn'; next = today.dawn;
  } else if (instant < today.dusk) {
    event = 'civilDusk'; next = today.dusk;
  } else {
    event = 'civilDawn';
    next = twilightForLocalDate(localDateAtOffset(instant, 1), lat, lon).dawn;
  }
  return { event, time: clockLabel(localParts(next), true), instant: next };
}

export function isDay(instant, lat, lon) {
  const date = requireInstant(instant);
  const { dawn, dusk } = twilightForLocalDate(localDateAtOffset(date, 0), lat, lon);
  return date >= dawn && date <= dusk;
}

export function footerTimestamp(instant) {
  const parts = localParts(requireInstant(instant));
  return `${parts.month}/${parts.day} ${clockLabel(parts, true)}`;
}

export function refreshWindow(now) {
  const instant = requireInstant(now);
  const parts = localParts(instant);
  const minutes = parts.hour * 60 + parts.minute + parts.second / 60 + instant.getMilliseconds() / 60000;
  const inWindow = minutes >= 5 * 60 && minutes <= 22 * 60;
  let candidate = Math.floor(instant.getTime() / 1800000) * 1800000 + 1800000;
  while (true) {
    const slot = new Date(candidate);
    const local = localParts(slot);
    const slotMinutes = local.hour * 60 + local.minute;
    if (local.minute % 30 === 0 && slotMinutes >= 5 * 60 && slotMinutes <= 22 * 60) {
      return { inWindow, nextSlot: slot };
    }
    candidate += 1800000;
  }
}
