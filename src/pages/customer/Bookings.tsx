import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  Clock,
  CreditCard,
  MapPin,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  Star,
  XCircle,
} from 'lucide-react';
import { getService, getVendor } from '@/lib/data';
import { cn, fmtDate, inr, iso, slotAvailability, to12h } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import type { Booking } from '@/lib/types';
import { Avatar, Badge, Button, buttonStyles, Card, EmptyState, Skeleton, Tabs } from '@/components/ui/primitives';
import { PageHeader, StatusBadge } from '@/components/ui/data-display';
import { ConfirmDialog, Modal } from '@/components/ui/overlays';
import { BookingCalendar, TimeSlotPicker } from '@/components/booking';

type Filter = 'all' | 'upcoming' | 'pending' | 'completed' | 'cancelled';

const upcomingStatuses = ['confirmed', 'in_progress', 'pending_payment'];
const pendingStatuses = ['pending_approval', 'cancellation_requested'];
const cancelledStatuses = ['cancelled', 'rejected', 'expired', 'refunded', 'no_show'];

export default function CustomerBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const loading = useMockLoad(420);
  const bookings = useApp((s) => s.bookings);
  const updateBookingStatus = useApp((s) => s.updateBookingStatus);
  const addNotification = useApp((s) => s.addNotification);

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const mine = useMemo(
    () =>
      bookings
        .filter((b) => b.customerId === (user?.id ?? 'u1'))
        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    [bookings, user?.id],
  );

  const counts = {
    all: mine.length,
    upcoming: mine.filter((b) => upcomingStatuses.includes(b.status)).length,
    pending: mine.filter((b) => pendingStatuses.includes(b.status)).length,
    completed: mine.filter((b) => b.status === 'completed').length,
    cancelled: mine.filter((b) => cancelledStatuses.includes(b.status)).length,
  };

  const filtered = useMemo(() => {
    let list = mine;
    if (filter === 'upcoming') list = list.filter((b) => upcomingStatuses.includes(b.status));
    if (filter === 'pending') list = list.filter((b) => pendingStatuses.includes(b.status));
    if (filter === 'completed') list = list.filter((b) => b.status === 'completed');
    if (filter === 'cancelled') list = list.filter((b) => cancelledStatuses.includes(b.status));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((b) => {
        const s = getService(b.serviceId);
        const v = getVendor(b.vendorId);
        return `${s?.name} ${v?.name} ${b.ref}`.toLowerCase().includes(q);
      });
    }
    return list;
  }, [mine, filter, query]);

  const confirmCancel = () => {
    if (!cancelTarget) return;
    const refundable = ['confirmed', 'pending_approval', 'pending_payment'].includes(cancelTarget.status);
    updateBookingStatus(cancelTarget.id, refundable ? 'refunded' : 'cancelled', {
      refundAmount: refundable ? cancelTarget.amount : 0,
    });
    addNotification({
      kind: 'booking',
      title: 'Booking cancelled',
      body: `Booking ${cancelTarget.ref} was cancelled.${refundable ? ` A refund of ${inr(cancelTarget.amount)} has been initiated.` : ''}`,
      time: 'just now',
      read: false,
      audience: 'customer',
      href: `/customer/bookings/${cancelTarget.id}`,
    });
    toast.success('Booking cancelled', refundable ? `${inr(cancelTarget.amount)} will be refunded in 5–7 business days.` : 'Your booking has been cancelled.');
    setCancelTarget(null);
  };

  const openReschedule = (b: Booking) => {
    setRescheduleTarget(b);
    setNewDate(b.date);
    setNewTime(b.time);
  };

  const confirmReschedule = () => {
    if (!rescheduleTarget) return;
    if (!newDate || !newTime) {
      toast.error('Pick a date and time', 'Both are required to reschedule.');
      return;
    }
    updateBookingStatus(rescheduleTarget.id, 'confirmed', { date: newDate, time: newTime, paymentStatus: rescheduleTarget.paymentStatus });
    addNotification({
      kind: 'booking',
      title: 'Booking rescheduled',
      body: `${rescheduleTarget.ref} moved to ${fmtDate(newDate)} at ${to12h(newTime)}.`,
      time: 'just now',
      read: false,
      audience: 'customer',
      href: `/customer/bookings/${rescheduleTarget.id}`,
    });
    toast.success('Booking rescheduled', `New slot: ${fmtDate(newDate)} at ${to12h(newTime)}.`);
    setRescheduleTarget(null);
  };

  return (
    <div>
      <PageHeader
        title="My bookings"
        description="Track upcoming visits, reschedule in a tap and keep every receipt in one place."
        actions={
          <Link to="/services" className={buttonStyles({ size: 'md' })}>
            <Plus className="h-4 w-4" /> New booking
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filter}
          onChange={(k) => setFilter(k as Filter)}
          items={[
            { key: 'all', label: 'All', count: counts.all },
            { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
            { key: 'pending', label: 'Pending', count: counts.pending },
            { key: 'completed', label: 'Completed', count: counts.completed },
            { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
          ]}
        />
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search service, vendor or ref"
            className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-10 pr-3 text-[12.5px] placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[150px]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-5 w-5" />}
          title={query ? 'No bookings match your search' : filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
          description={
            query
              ? 'Try a different keyword or clear the search to see everything.'
              : 'When you book a service it will show up here with live status and receipts.'
          }
          action={
            query ? (
              <Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear search</Button>
            ) : (
              <Link to="/services" className={buttonStyles({ size: 'sm' })}>Explore services</Link>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const service = getService(b.serviceId);
            const vendor = getVendor(b.vendorId);
            const canCancel = ['confirmed', 'pending_approval', 'pending_payment'].includes(b.status);
            const canReschedule = ['confirmed', 'pending_approval'].includes(b.status);
            const canReview = b.status === 'completed';
            return (
              <Card key={b.id} hover className="overflow-hidden">
                <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <div className={cn('hidden h-14 w-14 shrink-0 items-center justify-center rounded-xl sm:flex', b.status === 'in_progress' ? 'bg-sky-50 text-sky-600' : b.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-600')}>
                      {b.status === 'completed' ? <CalendarCheck className="h-6 w-6" /> : <CalendarClock className="h-6 w-6" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/customer/bookings/${b.id}`} className="truncate text-[14px] font-bold text-ink-900 hover:text-brand-700">
                          {service?.name ?? 'Service'}
                        </Link>
                        <StatusBadge status={b.status} size="sm" />
                        {b.date === iso(new Date()) && b.status !== 'completed' && (
                          <Badge tone="info" size="sm" dot>Today</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-ink-500">
                        {vendor?.name} · {b.ref}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5" /> {fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {to12h(b.time)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> {b.duration} min
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{b.address}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-ink-100 pt-3 lg:border-0 lg:pt-0">
                    <div className="lg:text-right">
                      <p className="font-display text-[16px] font-extrabold text-ink-900">{inr(b.amount)}</p>
                      <p className="text-[10px] text-ink-400">{b.paymentStatus === 'refunded' ? `Refunded ${inr(b.refundAmount ?? b.amount)}` : b.paymentMethod}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Link to={`/customer/bookings/${b.id}`} className={buttonStyles({ variant: 'outline', size: 'sm' })}>
                        Details
                      </Link>
                      {canReschedule && (
                        <Button variant="ghost" size="sm" onClick={() => openReschedule(b)}>Reschedule</Button>
                      )}
                      {canCancel && (
                        <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50" onClick={() => setCancelTarget(b)}>
                          Cancel
                        </Button>
                      )}
                      {canReview && (
                        <Link to={`/customer/reviews?booking=${b.id}`} className={buttonStyles({ variant: 'soft', size: 'sm' })}>
                          <Star className="h-3.5 w-3.5" /> Review
                        </Link>
                      )}
                      {['cancelled', 'refunded', 'completed'].includes(b.status) && (
                        <Link to={`/services/${service?.slug ?? ''}`} className={buttonStyles({ variant: 'soft', size: 'sm' })}>
                          <RotateCcw className="h-3.5 w-3.5" /> Rebook
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                {b.status === 'in_progress' && (
                  <div className="flex items-center gap-2 border-t border-sky-100 bg-sky-50/70 px-4 py-2.5 sm:px-5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
                    <p className="text-[11px] font-semibold text-sky-800">Professional is on the job — tap details for live tracking.</p>
                    <Link to={`/customer/bookings/${b.id}`} className="ml-auto inline-flex items-center gap-1 text-[10.5px] font-bold text-sky-700">
                      Track <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { icon: CalendarClock, title: 'Free reschedule', text: 'Up to 24 hours before your slot.' },
          { icon: CreditCard, title: 'Instant refunds', text: 'Approved refunds in 5–7 days.' },
          { icon: MessageSquare, title: 'Talk to your pro', text: 'Every booking has a chat thread.' },
        ].map((c) => (
          <div key={c.title} className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3.5">
            <c.icon className="h-4.5 w-4.5 shrink-0 text-brand-600" />
            <div>
              <p className="text-[11.5px] font-bold text-ink-800">{c.title}</p>
              <p className="text-[10.5px] text-ink-500">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        title="Cancel this booking?"
        description={cancelTarget ? `${getService(cancelTarget.serviceId)?.name} on ${fmtDate(cancelTarget.date)} at ${to12h(cancelTarget.time)}.` : undefined}
        confirmLabel="Cancel booking"
      />
      <div className="mt-2 text-center">
        {cancelTarget && (
          <p className="text-[10.5px] text-ink-400">
            {['confirmed', 'pending_approval', 'pending_payment'].includes(cancelTarget.status)
              ? `You will receive a full refund of ${inr(cancelTarget.amount)}.`
              : 'This booking is not eligible for a refund.'}
          </p>
        )}
      </div>

      <Modal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule booking"
        description={rescheduleTarget ? `${getService(rescheduleTarget.serviceId)?.name} · ${rescheduleTarget.ref}` : undefined}
        size="lg"
        icon={<CalendarClock className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setRescheduleTarget(null)}>Keep current slot</Button>
            <Button size="sm" onClick={confirmReschedule} disabled={!newDate || !newTime}>Confirm new slot</Button>
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[12px] font-bold text-ink-800">Choose a new date</p>
            <BookingCalendar value={newDate} onChange={setNewDate} dense />
          </div>
          <div>
            <p className="mb-2 text-[12px] font-bold text-ink-800">Available times</p>
            {newDate && rescheduleTarget ? (
              <TimeSlotPicker slots={slotAvailability(rescheduleTarget.serviceId, newDate)} value={newTime} onChange={setNewTime} />
            ) : (
              <div className="rounded-xl border border-dashed border-ink-200 px-4 py-10 text-center text-[11.5px] text-ink-400">
                Pick a date to see available slots.
              </div>
            )}
            <div className="mt-3 rounded-lg bg-amber-50 p-2.5 text-[10.5px] leading-4 text-amber-800">
              Rescheduling is free. Your vendor will be notified and the slot is re-confirmed automatically.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
