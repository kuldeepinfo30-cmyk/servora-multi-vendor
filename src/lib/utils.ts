import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Reuse Intl formatters — constructing one per call is surprisingly expensive
// on list-heavy pages (all services, bookings, transactions).
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrCompactFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
  notation: 'compact',
});

const numberFormatter = new Intl.NumberFormat('en-IN');

export const inr = (value: number, compact = false) =>
  (compact ? inrCompactFormatter : inrFormatter).format(value || 0);

export const num = (value: number) => numberFormatter.format(value || 0);

export const pct = (value: number, digits = 1) => `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

export const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export const today = () => new Date().toISOString().slice(0, 10);

export const addDays = (days: number, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
};

export const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const fmtDate = (value: string | Date, opts: Intl.DateTimeFormatOptions = {}) => {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  }).format(d);
};

export const fmtDay = (value: string | Date) =>
  fmtDate(value, { weekday: 'short', day: 'numeric', month: 'short' });

export const timeAgo = (value: string | Date) => {
  const d = typeof value === 'string' ? new Date(value) : value;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
};

export const minsToLabel = (mins: number) => {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const initialsTone: Record<string, string> = {
  brand: 'bg-brand-100 text-brand-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
  info: 'bg-sky-100 text-sky-700',
  neutral: 'bg-ink-100 text-ink-600',
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-700',
  teal: 'bg-teal-100 text-teal-700',
};

export const toneSoft: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/15',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  neutral: 'bg-ink-100 text-ink-600 ring-ink-500/10',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  teal: 'bg-teal-50 text-teal-700 ring-teal-600/15',
};

export const toneSolid: Record<string, string> = {
  brand: 'bg-brand-600 text-white',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-rose-600 text-white',
  info: 'bg-sky-600 text-white',
  neutral: 'bg-ink-700 text-white',
  violet: 'bg-violet-600 text-white',
  amber: 'bg-amber-500 text-white',
  teal: 'bg-teal-600 text-white',
};

export const statusTone: Record<string, { label: string; tone: string }> = {
  pending_payment: { label: 'Pending payment', tone: 'amber' },
  pending_approval: { label: 'Pending approval', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'brand' },
  in_progress: { label: 'In progress', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancellation_requested: { label: 'Cancellation requested', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  rejected: { label: 'Rejected', tone: 'danger' },
  expired: { label: 'Expired', tone: 'neutral' },
  no_show: { label: 'No show', tone: 'danger' },
  disputed: { label: 'Disputed', tone: 'violet' },
  refunded: { label: 'Refunded', tone: 'neutral' },

  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
  partial: { label: 'Partially paid', tone: 'warning' },

  active: { label: 'Active', tone: 'success' },
  blocked: { label: 'Blocked', tone: 'danger' },
  suspended: { label: 'Suspended', tone: 'danger' },
  approved: { label: 'Approved', tone: 'success' },
  under_review: { label: 'Under review', tone: 'warning' },
  open: { label: 'Open', tone: 'warning' },
  resolved: { label: 'Resolved', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
  requested: { label: 'Requested', tone: 'warning' },
  processing: { label: 'Processing', tone: 'info' },
  paid_out: { label: 'Paid', tone: 'success' },
  success: { label: 'Success', tone: 'success' },
  refunded_txn: { label: 'Refunded', tone: 'neutral' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  expired_coupon: { label: 'Expired', tone: 'neutral' },
  disabled: { label: 'Disabled', tone: 'neutral' },
  on_leave: { label: 'On leave', tone: 'warning' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  published: { label: 'Published', tone: 'success' },
  draft: { label: 'Draft', tone: 'neutral' },
  high: { label: 'High', tone: 'danger' },
  medium: { label: 'Medium', tone: 'warning' },
  low: { label: 'Low', tone: 'neutral' },
};

export const getStatus = (key: string) =>
  statusTone[key] || { label: key.replace(/_/g, ' '), tone: 'neutral' };

export const SLOT_TIMES = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
];

export const to12h = (time: string) => {
  const [hStr, m] = time.split(':');
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${suffix}`;
};

export const hash = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
};

export const slotAvailability = (serviceId: string, date: string) =>
  SLOT_TIMES.map((time) => {
    const h = hash(`${serviceId}-${date}-${time}`);
    return { time, available: h % 10 > 2 };
  });

export const downloadFile = (filename: string, content: string, mime = 'text/plain') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const bookingRef = () => `SRV-${Math.floor(10000 + Math.random() * 89999)}`;
