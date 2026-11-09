import { describe, expect, it } from 'vitest';
import {
  IST_OFFSET_MINUTES,
  addMinutes,
  eachDate,
  istToUtc,
  minutesToLabel,
  rangesOverlap,
  utcToIstDate,
  utcToIstMinutes,
  weekdayForDate,
} from '../src/common/utils/time';

describe('time helpers (Asia/Kolkata)', () => {
  it('keeps a fixed +05:30 offset', () => {
    expect(IST_OFFSET_MINUTES).toBe(330);
  });

  it('converts an IST wall-clock time to UTC', () => {
    expect(istToUtc('2026-11-12', 10 * 60).toISOString()).toBe('2026-11-12T04:30:00.000Z');
  });

  it('round-trips a UTC instant back to IST date and minutes', () => {
    const instant = new Date('2026-11-12T04:30:00.000Z');
    expect(utcToIstDate(instant)).toBe('2026-11-12');
    expect(utcToIstMinutes(instant)).toBe(600);
  });

  it('resolves the IST weekday for a date', () => {
    expect(weekdayForDate('2026-11-09')).toBe(1); // Monday
    expect(weekdayForDate('2026-11-08')).toBe(0); // Sunday
  });

  it('formats minutes-of-day as a 12-hour label', () => {
    expect(minutesToLabel(0)).toBe('12:00 AM');
    expect(minutesToLabel(720)).toBe('12:00 PM');
    expect(minutesToLabel(810)).toBe('1:30 PM');
  });

  it('adds minutes to a date', () => {
    expect(addMinutes(new Date('2026-11-12T04:30:00.000Z'), 90).toISOString()).toBe('2026-11-12T06:00:00.000Z');
  });

  it('detects overlapping ranges', () => {
    const a = new Date('2026-11-12T09:00:00.000Z');
    const b = new Date('2026-11-12T10:00:00.000Z');
    const c = new Date('2026-11-12T09:30:00.000Z');
    expect(rangesOverlap(a, b, c, b)).toBe(true);
    expect(rangesOverlap(a, c, b, new Date('2026-11-12T11:00:00.000Z'))).toBe(false);
  });

  it('enumerates every date in an inclusive range', () => {
    expect(eachDate('2026-11-01', '2026-11-05')).toEqual([
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
    ]);
  });
});
