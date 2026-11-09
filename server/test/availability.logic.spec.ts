import { describe, expect, it } from 'vitest';
import { buildDaySlots, defaultRules } from '../src/availability/availability.logic';
import { istToUtc, weekdayForDate } from '../src/common/utils/time';

const MONDAY = '2026-11-09';

const base = {
  dateIso: MONDAY,
  durationMin: 60,
  bufferAfterMin: 0,
  eligibleStaffIds: [null] as Array<string | null>,
  busy: [],
  timeOff: [],
  noticeHours: 0,
  rules: [{ staffId: null, startMinute: 9 * 60, endMinute: 18 * 60, slotIntervalMin: 30 }],
};

const longAgo = new Date('2026-11-08T00:00:00.000Z');

describe('buildDaySlots', () => {
  it('generates every slot inside the working window', () => {
    const slots = buildDaySlots({ ...base, now: longAgo });
    expect(slots).toHaveLength(17);
    expect(slots.every((slot) => slot.available)).toBe(true);
    expect(slots[0]).toMatchObject({ startMinute: 540, label: '9:00 AM' });
    expect(slots[slots.length - 1].startMinute).toBe(1020);
  });

  it('drops slots that fall inside the notice window', () => {
    const slots = buildDaySlots({ ...base, now: istToUtc(MONDAY, 12 * 60) });
    expect(slots).toHaveLength(11);
    expect(slots[0].startMinute).toBe(720);
  });

  it('removes slots that overlap an existing booking', () => {
    const slots = buildDaySlots({
      ...base,
      now: longAgo,
      busy: [{ staffId: null, startsAt: istToUtc(MONDAY, 600), endsAt: istToUtc(MONDAY, 660) }],
    });
    expect(slots).toHaveLength(14);
    expect(slots.some((slot) => slot.startMinute === 570)).toBe(false);
    expect(slots.some((slot) => slot.startMinute === 600)).toBe(false);
  });

  it('removes slots that overlap approved time off', () => {
    const slots = buildDaySlots({
      ...base,
      now: longAgo,
      timeOff: [{ staffId: null, startsAt: istToUtc(MONDAY, 780), endsAt: istToUtc(MONDAY, 900) }],
    });
    expect(slots).toHaveLength(12);
  });

  it('honours the buffer after a service when checking bookings', () => {
    const slots = buildDaySlots({
      ...base,
      bufferAfterMin: 30,
      now: longAgo,
      busy: [{ staffId: null, startsAt: istToUtc(MONDAY, 660), endsAt: istToUtc(MONDAY, 720) }],
    });
    expect(slots.some((slot) => slot.startMinute === 600)).toBe(false);
    expect(slots.some((slot) => slot.startMinute === 570)).toBe(true);
  });

  it('tracks which staff members can serve each slot', () => {
    const slots = buildDaySlots({
      ...base,
      eligibleStaffIds: ['s1', 's2'],
      now: longAgo,
      busy: [{ staffId: 's1', startsAt: istToUtc(MONDAY, 540), endsAt: istToUtc(MONDAY, 600) }],
    });
    expect(slots.find((slot) => slot.startMinute === 540)?.staffIds).toEqual(['s2']);
  });
});

describe('defaultRules', () => {
  it('offers a 9am-6pm fallback for every weekday', () => {
    const rules = defaultRules();
    expect(rules).toHaveLength(7);
    expect(rules[0]).toMatchObject({ startMinute: 540, endMinute: 1080, slotIntervalMin: 30 });
    expect(weekdayForDate(MONDAY)).toBe(1);
  });
});
