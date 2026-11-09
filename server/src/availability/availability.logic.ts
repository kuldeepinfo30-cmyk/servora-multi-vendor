import { addMinutes, istToUtc, minutesToLabel } from '../common/utils/time';

export interface SlotRule {
  staffId: string | null;
  startMinute: number;
  endMinute: number;
  slotIntervalMin: number;
}

export interface BusyInterval {
  staffId: string | null;
  startsAt: Date;
  endsAt: Date;
}

export interface TimeOffInterval {
  staffId: string | null;
  startsAt: Date;
  endsAt: Date;
}

export interface DaySlot {
  startMinute: number;
  endMinute: number;
  start: string;
  end: string;
  label: string;
  available: boolean;
  staffIds: string[];
}

export interface BuildSlotsInput {
  dateIso: string;
  durationMin: number;
  bufferAfterMin?: number;
  rules: SlotRule[];
  /** null represents "the business itself" when no staff are modelled. */
  eligibleStaffIds: Array<string | null>;
  busy: BusyInterval[];
  timeOff: TimeOffInterval[];
  now: Date;
  noticeHours: number;
}

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && bStart < aEnd;

/**
 * Pure, deterministic slot builder. This is the heart of the scheduling engine
 * and is unit-tested without a database.
 */
export function buildDaySlots(input: BuildSlotsInput): DaySlot[] {
  const buffer = input.bufferAfterMin ?? 0;
  const earliest = new Date(input.now.getTime() + input.noticeHours * 60 * 60 * 1000);
  const staffSlots = new Map<number, Set<string>>();

  for (const staffId of input.eligibleStaffIds) {
    const rules = input.rules.filter(
      (rule) => rule.staffId === null || (staffId !== null && rule.staffId === staffId),
    );
    for (const rule of rules) {
      const step = Math.max(5, rule.slotIntervalMin || 30);
      for (let minute = rule.startMinute; minute + input.durationMin <= rule.endMinute; minute += step) {
        const start = istToUtc(input.dateIso, minute);
        const end = addMinutes(start, input.durationMin);
        if (start < earliest) continue;

        const blockedEnd = addMinutes(end, buffer);
        const isBusy = input.busy.some(
          (item) =>
            (item.staffId === null || staffId === null || item.staffId === staffId) &&
            overlaps(start, blockedEnd, item.startsAt, item.endsAt),
        );
        if (isBusy) continue;

        const onLeave = input.timeOff.some(
          (item) =>
            (item.staffId === null || staffId === null || item.staffId === staffId) &&
            overlaps(start, blockedEnd, item.startsAt, item.endsAt),
        );
        if (onLeave) continue;

        const key = staffId ?? '__vendor__';
        if (!staffSlots.has(minute)) staffSlots.set(minute, new Set());
        staffSlots.get(minute)!.add(key);
      }
    }
  }

  return Array.from(staffSlots.entries())
    .sort(([a], [b]) => a - b)
    .map(([minute, staff]) => {
      const start = istToUtc(input.dateIso, minute);
      const end = addMinutes(start, input.durationMin);
      return {
        startMinute: minute,
        endMinute: minute + input.durationMin,
        start: start.toISOString(),
        end: end.toISOString(),
        label: minutesToLabel(minute),
        available: staff.size > 0,
        staffIds: Array.from(staff).filter((id) => id !== '__vendor__'),
      };
    });
}

/** Fallback schedule when a vendor has not configured availability yet. */
export function defaultRules(): SlotRule[] {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    staffId: null,
    startMinute: 9 * 60,
    endMinute: 18 * 60,
    slotIntervalMin: 30,
  })) as SlotRule[];
}

export const ACTIVE_BOOKING_STATUSES = [
  'PENDING_PAYMENT',
  'PENDING_APPROVAL',
  'CONFIRMED',
  'IN_PROGRESS',
  'CANCELLATION_REQUESTED',
] as const;
