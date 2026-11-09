import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock3, Sun, Sunset, MoonStar } from 'lucide-react';
import { cn, hash, iso } from '@/lib/utils';

export interface Slot {
  time: string;
  available: boolean;
}

export function BookingCalendar({
  value,
  onChange,
  monthsAhead = 3,
  className,
  dense,
}: {
  value: string;
  onChange: (date: string) => void;
  monthsAhead?: number;
  className?: string;
  dense?: boolean;
}) {
  const now = startOfDay(new Date());
  const [cursor, setCursor] = useState(() => (value ? new Date(value) : now));
  const maxDate = addMonths(now, monthsAhead);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const canPrev = isAfter(startOfMonth(cursor), startOfMonth(now));
  const canNext = isBefore(startOfMonth(cursor), startOfMonth(maxDate));

  return (
    <div className={cn('rounded-2xl border border-ink-200 bg-white p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => setCursor(addMonths(cursor, -1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 transition hover:bg-ink-50 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-[13.5px] font-bold text-ink-900">{format(cursor, 'MMMM yyyy')}</p>
          <p className="text-[10px] text-ink-400">Select a service date</p>
        </div>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => setCursor(addMonths(cursor, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 transition hover:bg-ink-50 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-ink-400">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = iso(day);
          const disabled = isBefore(day, now) || isAfter(day, maxDate);
          const selected = value === key;
          const today = isSameDay(day, now);
          const muted = !isSameMonth(day, cursor);
          const demand = hash(key) % 5;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(key)}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-lg text-[12.5px] font-semibold transition',
                dense ? 'h-9' : 'h-10',
                disabled && 'cursor-not-allowed text-ink-300',
                muted && !disabled && 'text-ink-300',
                !disabled && !selected && 'text-ink-700 hover:bg-brand-50 hover:text-brand-700',
                selected && 'bg-brand-600 text-white shadow-sm shadow-brand-600/30',
                today && !selected && 'ring-1 ring-inset ring-brand-300',
              )}
            >
              <span>{format(day, 'd')}</span>
              {!disabled && (
                <span
                  className={cn(
                    'absolute bottom-1 h-1 w-1 rounded-full',
                    selected ? 'bg-white/80' : demand === 0 ? 'bg-amber-400' : 'bg-emerald-400',
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-ink-100 pt-3 text-[10px] text-ink-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Good availability
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Filling fast
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] ring-1 ring-brand-300" /> Today
        </span>
      </div>
    </div>
  );
}

/* -------------------------------- Time slots ------------------------------- */

export function TimeSlotPicker({
  slots,
  value,
  onChange,
  className,
  showGroups = true,
}: {
  slots: Slot[];
  value: string;
  onChange: (time: string) => void;
  className?: string;
  showGroups?: boolean;
}) {
  const groups = [
    { label: 'Morning', icon: Sun, test: (t: string) => parseInt(t, 10) < 12 },
    { label: 'Afternoon', icon: Sunset, test: (t: string) => parseInt(t, 10) >= 12 && parseInt(t, 10) < 17 },
    { label: 'Evening', icon: MoonStar, test: (t: string) => parseInt(t, 10) >= 17 },
  ];
  const to12 = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:${String(m).padStart(2, '0')} ${suffix}`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {groups.map((group) => {
        const items = slots.filter((s) => group.test(s.time));
        if (!items.length) return null;
        return (
          <div key={group.label}>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-400">
              <group.icon className="h-3.5 w-3.5" /> {group.label}
              <span className="font-medium normal-case tracking-normal text-ink-300">
                · {items.filter((i) => i.available).length} available
              </span>
            </div>
            <div className={cn('grid gap-2', showGroups ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-3')}>
              {items.map((slot) => {
                const selected = value === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => onChange(slot.time)}
                    className={cn(
                      'relative rounded-lg border py-2 text-[11.5px] font-semibold transition',
                      selected
                        ? 'border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-600/25'
                        : slot.available
                          ? 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700'
                          : 'cursor-not-allowed border-ink-100 bg-ink-50 text-ink-300 line-through',
                    )}
                  >
                    {to12(slot.time)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {!slots.some((s) => s.available) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
          <Clock3 className="mr-1.5 inline h-3.5 w-3.5" />
          No slots left for this date. Try another day.
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Slot hold timer ---------------------------- */

export function SlotHoldTimer({ seconds = 600 }: { seconds?: number }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const urgent = left < 120;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold',
        urgent ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700',
      )}
    >
      <Clock3 className="h-3 w-3" />
      Slot held for {mm}:{ss}
    </span>
  );
}

/* ------------------------------- Week schedule ----------------------------- */

export function WeekSchedule({
  events,
  weekStart,
  onPrev,
  onNext,
  onSelect,
  selectedStaff,
  className,
}: {
  events: {
    id: string;
    day: number;
    start: number;
    duration: number;
    title: string;
    customer: string;
    tone?: string;
    status?: string;
  }[];
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onSelect?: (id: string) => void;
  selectedStaff?: string;
  className?: string;
}) {
  const days = eachDayOfInterval({ start: weekStart, end: new Date(weekStart.getTime() + 6 * 86400000) });
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);
  const toneBg: Record<string, string> = {
    brand: 'border-brand-200 bg-brand-50 text-brand-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    violet: 'border-violet-200 bg-violet-50 text-violet-800',
    teal: 'border-teal-200 bg-teal-50 text-teal-800',
    neutral: 'border-ink-200 bg-ink-50 text-ink-700',
  };

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-ink-200 bg-white', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={onPrev} className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[13px] font-bold text-ink-900">
            {format(weekStart, 'd MMM')} – {format(days[6], 'd MMM yyyy')}
          </span>
          <button onClick={onNext} className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-3 text-[10.5px] text-ink-500">
          {selectedStaff && <span className="font-semibold">{selectedStaff}</span>}
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-brand-400" /> Booked</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-400" /> Completed</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-ink-100 bg-ink-50/50">
            <div />
            {days.map((d) => {
              const isToday = isSameDay(d, new Date());
              return (
                <div key={d.toISOString()} className={cn('border-l border-ink-100 px-2 py-2.5 text-center', isToday && 'bg-brand-50/60')}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">{format(d, 'EEE')}</p>
                  <p className={cn('mt-0.5 text-[15px] font-extrabold', isToday ? 'text-brand-700' : 'text-ink-800')}>
                    {format(d, 'd')}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="relative grid grid-cols-[56px_repeat(7,1fr)]">
            <div>
              {hours.map((h) => (
                <div key={h} className="h-14 border-b border-ink-100 pr-2 pt-1 text-right text-[9.5px] font-semibold text-ink-400">
                  {h > 12 ? h - 12 : h}:00
                </div>
              ))}
            </div>
            {days.map((d, dayIdx) => (
              <div key={d.toISOString()} className="relative border-l border-ink-100">
                {hours.map((h) => (
                  <div key={h} className="h-14 border-b border-ink-100/80" />
                ))}
                {events
                  .filter((e) => e.day === dayIdx)
                  .map((e) => (
                    <button
                      key={e.id}
                      onClick={() => onSelect?.(e.id)}
                      style={{ top: `${(e.start - 8) * 56 + 2}px`, height: `${Math.max(e.duration / 60, 0.6) * 56 - 4}px` }}
                      className={cn(
                        'absolute inset-x-1 z-10 overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-left text-[9.5px] shadow-sm transition hover:z-20 hover:shadow-md',
                        toneBg[e.tone ?? 'brand'] ?? toneBg.brand,
                      )}
                    >
                      <span className="block truncate font-bold leading-tight">{e.title}</span>
                      <span className="block truncate opacity-70">{e.customer}</span>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
