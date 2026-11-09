/**
 * Time helpers. The marketplace operates in Asia/Kolkata (IST, +05:30, no DST).
 * Slots are computed in IST wall-clock minutes, then converted to UTC Date.
 */
export const IST_OFFSET_MINUTES = 5 * 60 + 30;
export const DAY_MS = 24 * 60 * 60 * 1000;

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** "2026-11-12" → weekday index in IST (0 = Sunday). */
export function weekdayForDate(dateIso: string): number {
  const [y, m, d] = dateIso.split('-').map(Number);
  const utcNoon = Date.UTC(y, m - 1, d, 12, 0, 0);
  return new Date(utcNoon).getUTCDay();
}

/**
 * Convert a local IST date + minute-of-day to the UTC instant.
 * Example: 2026-11-12 10:00 IST → 2026-11-12T04:30:00.000Z
 */
export function istToUtc(dateIso: string, minuteOfDay: number): Date {
  const [y, m, d] = dateIso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, minuteOfDay - IST_OFFSET_MINUTES, 0, 0));
}

/** UTC instant → IST date string (YYYY-MM-DD). */
export function utcToIstDate(date: Date): string {
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
  return shifted.toISOString().slice(0, 10);
}

/** UTC instant → minutes from IST midnight. */
export function utcToIstMinutes(date: Date): number {
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function eachDate(fromIso: string, toIso: string): string[] {
  const out: string[] = [];
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  let cursor = Date.UTC(fy, fm - 1, fd);
  const end = Date.UTC(ty, tm - 1, td);
  let guard = 0;
  while (cursor <= end && guard < 120) {
    out.push(new Date(cursor).toISOString().slice(0, 10));
    cursor += DAY_MS;
    guard += 1;
  }
  return out;
}
