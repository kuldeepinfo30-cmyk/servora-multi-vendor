import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Headphones,
  MapPin,
  MessageSquare,
  Phone,
  RotateCcw,
  ShieldCheck,
  Star,
  User,
  XCircle,
} from 'lucide-react';
import { getService, getStaff, getVendor } from '@/lib/data';
import { downloadFile, fmtDate, inr, iso, slotAvailability, to12h } from '@/lib/utils';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { Avatar, Badge, Button, buttonStyles, Card, EmptyState } from '@/components/ui/primitives';
import { InfoRow, PageHeader, SectionCard, StatusBadge, Timeline } from '@/components/ui/data-display';
import { ConfirmDialog, Modal } from '@/components/ui/overlays';
import { BookingCalendar, TimeSlotPicker } from '@/components/booking';
import { InvoicePreview } from '@/components/invoice';
import type { Booking } from '@/lib/types';

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bookings = useApp((s) => s.bookings);
  const updateBookingStatus = useApp((s) => s.updateBookingStatus);
  const addNotification = useApp((s) => s.addNotification);

  const booking = bookings.find((b) => b.id === id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [newDate, setNewDate] = useState(booking?.date ?? '');
  const [newTime, setNewTime] = useState(booking?.time ?? '');

  const service = booking ? getService(booking.serviceId) : null;
  const vendor = booking ? getVendor(booking.vendorId) : null;
  const staff = booking ? getStaff(booking.staffId) : null;

  const timeline = useMemo(() => {
    if (!booking) return [];
    const terminal = ['cancelled', 'refunded', 'rejected', 'expired'].includes(booking.status);
    const order = ['confirmed', 'in_progress', 'completed'];
    const idx = order.indexOf(booking.status);
    return [
      { title: 'Booking placed', description: `Ref ${booking.ref} created`, time: fmtDate(booking.createdAt), done: true },
      {
        title: booking.status === 'pending_approval' ? 'Awaiting vendor approval' : 'Booking confirmed',
        description: booking.status === 'pending_approval' ? 'The vendor usually responds within 30 minutes.' : `${vendor?.name} accepted your booking.`,
        time: booking.status === 'pending_approval' ? 'In progress' : fmtDate(booking.date),
        done: booking.status !== 'pending_approval',
        current: booking.status === 'pending_approval',
      },
      {
        title: terminal ? 'Booking cancelled' : 'Professional assigned',
        description: terminal ? 'This booking is no longer active.' : staff ? `${staff.name} · ${staff.role}` : 'Your professional will be assigned before the visit.',
        time: terminal ? fmtDate(booking.date) : 'Confirmed',
        done: idx >= 0 && !terminal,
        current: booking.status === 'confirmed' && !terminal,
        tone: terminal ? 'danger' : undefined,
      },
      {
        title: 'Service in progress',
        description: 'Live updates and support are available in the booking chat.',
        time: booking.status === 'in_progress' ? 'Live now' : booking.status === 'completed' ? 'Completed' : 'Scheduled',
        done: idx >= 1,
        current: booking.status === 'in_progress',
      },
      {
        title: 'Completed',
        description: 'Payment settled, invoice available and review unlocked.',
        time: booking.status === 'completed' ? fmtDate(booking.date) : 'Pending',
        done: booking.status === 'completed',
        current: booking.status === 'completed',
      },
    ];
  }, [booking, staff, vendor]);

  if (!booking) {
    return (
      <div>
        <PageHeader title="Booking not found" description="This booking may have been removed or belongs to another account." breadcrumb={[{ label: 'My bookings', href: '/customer/bookings' }, { label: 'Details' }]} />
        <EmptyState
          icon={<XCircle className="h-5 w-5" />}
          title="We couldn’t find that booking"
          description="Check the reference or return to your bookings list."
          action={<Link to="/customer/bookings" className={buttonStyles({ size: 'sm' })}>Back to bookings</Link>}
        />
      </div>
    );
  }

  const canCancel = ['confirmed', 'pending_approval', 'pending_payment'].includes(booking.status);
  const canReschedule = ['confirmed', 'pending_approval'].includes(booking.status);
  const canReview = booking.status === 'completed';

  const cancelBooking = () => {
    updateBookingStatus(booking.id, 'refunded', { refundAmount: booking.amount });
    addNotification({
      kind: 'booking',
      title: 'Booking cancelled',
      body: `${booking.ref} was cancelled and ${inr(booking.amount)} refunded to ${booking.paymentMethod}.`,
      time: 'just now',
      read: false,
      audience: 'customer',
      href: `/customer/bookings/${booking.id}`,
    });
    toast.success('Booking cancelled', `Refund of ${inr(booking.amount)} initiated.`);
    setCancelOpen(false);
  };

  const reschedule = () => {
    if (!newDate || !newTime) {
      toast.error('Pick a date and time', 'Both are required.');
      return;
    }
    updateBookingStatus(booking.id, 'confirmed', { date: newDate, time: newTime });
    toast.success('Booking rescheduled', `New slot: ${fmtDate(newDate)} at ${to12h(newTime)}.`);
    setRescheduleOpen(false);
  };

  const invoiceText = [
    `SERVORA — TAX INVOICE`,
    `Invoice: INV-${booking.ref.replace('SRV-', '2026-')}`,
    `Booking: ${booking.ref}`,
    `Customer: ${booking.customerName}`,
    `Service: ${service?.name}`,
    `Vendor: ${vendor?.name}`,
    `Date: ${fmtDate(booking.date)} at ${to12h(booking.time)}`,
    `Address: ${booking.address}`,
    `Amount: ${inr(booking.amount)}`,
    `Payment: ${booking.paymentMethod} (${booking.paymentStatus})`,
  ].join('\n');

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: 'My bookings', href: '/customer/bookings' }, { label: booking.ref }]}
        title={service?.name ?? 'Booking details'}
        description={`${booking.ref} · booked on ${fmtDate(booking.createdAt)}`}
        actions={
          <>
            <Link to="/customer/bookings" className={buttonStyles({ variant: 'outline', size: 'md' })}>
              <ArrowLeft className="h-4 w-4" /> All bookings
            </Link>
            <Button variant="outline" size="md" iconLeft={<Download className="h-4 w-4" />} onClick={() => { downloadFile(`${booking.ref}.txt`, invoiceText); toast.success('Invoice downloaded', `${booking.ref}.txt saved.`); }}>
              Invoice
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-5">
          <Card className="overflow-hidden">
            <div className={booking.status === 'in_progress' ? 'bg-gradient-to-br from-sky-600 to-sky-800 p-5 text-white' : booking.status === 'completed' ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white' : 'bg-gradient-to-br from-brand-600 to-brand-900 p-5 text-white'}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={booking.status} size="sm" />
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold">{booking.ref}</span>
                  </div>
                  <h2 className="mt-3 font-display text-[22px] font-extrabold leading-tight">{service?.name}</h2>
                  <p className="mt-1 text-[12px] text-white/75">{vendor?.name} · {vendor?.area}, {vendor?.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-white/60">Total paid</p>
                  <p className="font-display text-[26px] font-extrabold leading-none">{inr(booking.amount)}</p>
                  <p className="mt-1 text-[10px] text-white/60">{booking.paymentStatus === 'paid' ? 'Payment successful' : booking.paymentStatus}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Date', value: fmtDate(booking.date, { weekday: 'short', day: 'numeric', month: 'short' }) },
                  { label: 'Time', value: `${to12h(booking.time)} · ${booking.duration} min` },
                  { label: 'Address', value: booking.address.length > 28 ? `${booking.address.slice(0, 28)}…` : booking.address },
                ].map((d) => (
                  <div key={d.label} className="rounded-xl bg-white/10 px-3 py-2">
                    <p className="text-[9px] uppercase tracking-wide text-white/60">{d.label}</p>
                    <p className="mt-0.5 text-[11.5px] font-bold">{d.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 px-5 py-3">
              {booking.status === 'in_progress' && (
                <Badge tone="info" dot>Professional on the job</Badge>
              )}
              {booking.status === 'completed' && (
                <Badge tone="success" dot>Service completed</Badge>
              )}
              {booking.status === 'pending_approval' && <Badge tone="warning" dot>Awaiting vendor approval</Badge>}
              {booking.status === 'refunded' && <Badge tone="neutral" dot>Refunded {inr(booking.refundAmount ?? booking.amount)}</Badge>}
              <span className="ml-auto text-[10.5px] text-ink-400">Slot timezone: IST (GMT+5:30)</span>
            </div>

            <div className="flex flex-wrap gap-2 px-5 py-4">
              {canReschedule && <Button variant="outline" size="sm" iconLeft={<CalendarClock className="h-3.5 w-3.5" />} onClick={() => setRescheduleOpen(true)}>Reschedule</Button>}
              <Button variant="outline" size="sm" iconLeft={<MessageSquare className="h-3.5 w-3.5" />} onClick={() => navigate('/customer/messages')}>Message vendor</Button>
              <Button variant="outline" size="sm" iconLeft={<FileText className="h-3.5 w-3.5" />} onClick={() => setInvoiceOpen(true)}>View invoice</Button>
              {canReview && <Link to={`/customer/reviews?booking=${booking.id}`} className={buttonStyles({ variant: 'soft', size: 'sm' })}><Star className="h-3.5 w-3.5" /> Leave a review</Link>}
              {canCancel && <Button variant="ghost" size="sm" className="ml-auto text-rose-600 hover:bg-rose-50" onClick={() => setCancelOpen(true)}>Cancel booking</Button>}
              {['cancelled', 'refunded', 'completed'].includes(booking.status) && (
                <Link to={`/services/${service?.slug ?? ''}`} className={buttonStyles({ variant: 'soft', size: 'sm', className: 'ml-auto' })}><RotateCcw className="h-3.5 w-3.5" /> Book again</Link>
              )}
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <SectionCard title="Service details" icon={<ShieldCheck className="h-4 w-4" />}>
              <div className="space-y-1">
                <InfoRow label="Service" value={service?.name ?? '—'} />
                <InfoRow label="Package" value={service?.priceType === 'package' ? 'Fixed package' : service?.priceType === 'hourly' ? 'Hourly' : 'Fixed price'} />
                <InfoRow label="Duration" value={`${booking.duration} minutes`} />
                <InfoRow label="Booking ref" value={booking.ref} mono />
                <InfoRow label="Created" value={fmtDate(booking.createdAt)} />
              </div>
              {booking.addOns?.length ? (
                <div className="mt-3 rounded-lg bg-ink-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Add-ons</p>
                  {booking.addOns.map((a) => <p key={a} className="mt-1 text-[11.5px] text-ink-600">+ {a}</p>)}
                </div>
              ) : null}
            </SectionCard>

            <SectionCard title="Your professional" icon={<User className="h-4 w-4" />}>
              <div className="flex items-center gap-3">
                <Avatar name={staff?.name ?? vendor?.owner ?? 'Team'} size="lg" tone={staff?.tone ?? 'brand'} />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-ink-900">{staff?.name ?? 'Assigned before visit'}</p>
                  <p className="text-[11px] text-ink-500">{staff?.role ?? vendor?.name}</p>
                  {staff && (
                    <p className="mt-0.5 text-[10.5px] text-ink-400">★ {staff.rating.toFixed(1)} · {staff.jobs}+ jobs · {staff.experience}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <InfoRow label="Vendor" value={vendor?.name ?? '—'} />
                <InfoRow label="Response time" value={vendor?.responseTime ?? '—'} />
                <InfoRow label="Verified" value={vendor?.verified ? 'Yes · KYC + background' : 'Pending'} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" iconLeft={<Phone className="h-3.5 w-3.5" />} onClick={() => toast.info('Calling via masked number', 'Your number stays private. Connecting…')}>Call</Button>
                <Button variant="outline" size="sm" className="flex-1" iconLeft={<MessageSquare className="h-3.5 w-3.5" />} onClick={() => navigate('/customer/messages')}>Chat</Button>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Payment summary" icon={<CreditCard className="h-4 w-4" />} action={<Badge tone={booking.paymentStatus === 'paid' ? 'success' : 'warning'} size="sm">{booking.paymentStatus}</Badge>}>
            <div className="rounded-xl border border-ink-200">
              <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                <span className="text-[12px] text-ink-500">Service charge</span>
                <span className="text-[12px] font-semibold text-ink-800">{inr(Math.round(booking.amount / 1.18))}</span>
              </div>
              <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                <span className="text-[12px] text-ink-500">GST (18%)</span>
                <span className="text-[12px] font-semibold text-ink-800">{inr(booking.amount - Math.round(booking.amount / 1.18))}</span>
              </div>
              <div className="flex items-center justify-between bg-ink-50/70 px-4 py-3">
                <span className="text-[12.5px] font-bold text-ink-900">Total</span>
                <span className="font-display text-[15px] font-extrabold text-ink-900">{inr(booking.amount)}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[10.5px] text-ink-400">Paid via {booking.paymentMethod}</p>
              <button onClick={() => setInvoiceOpen(true)} className="text-[11px] font-bold text-brand-700 hover:text-brand-800">View tax invoice →</button>
            </div>
          </SectionCard>

          <SectionCard title="Booking timeline" icon={<Clock className="h-4 w-4" />}>
            <Timeline items={timeline} />
          </SectionCard>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <SectionCard title="Need help?" icon={<Headphones className="h-4 w-4" />}>
            <p className="text-[11.5px] leading-5 text-ink-500">
              Have an issue with this booking? Open a dispute and our resolution team will review both sides within one business day.
            </p>
            <div className="mt-3 space-y-2">
              <Link to="/customer/support" className={buttonStyles({ variant: 'outline', size: 'sm', className: 'w-full' })}>
                <Headphones className="h-3.5 w-3.5" /> Contact support
              </Link>
              {booking.status === 'completed' && (
                <Button variant="ghost" size="sm" className="w-full text-rose-600 hover:bg-rose-50" onClick={() => { toast.success('Dispute opened', 'Reference DP-2026-0921 created. We’ll be in touch within 24 hours.'); }}>
                  Report an issue
                </Button>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Vendor" icon={<ShieldCheck className="h-4 w-4" />}>
            <Link to={`/vendors/${vendor?.slug ?? ''}`} className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 transition hover:border-brand-200 hover:bg-brand-50/30">
              <Avatar name={vendor?.name ?? 'Vendor'} size="md" tone="teal" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-bold text-ink-900">{vendor?.name}</p>
                <p className="text-[10.5px] text-ink-500">★ {vendor?.rating} · {vendor?.jobsDone}+ jobs</p>
              </div>
              <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-ink-300" />
            </Link>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-ink-500"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> KYC & background verified</div>
              <div className="flex items-center gap-2 text-[11px] text-ink-500"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Insured up to ₹50,000</div>
              <div className="flex items-center gap-2 text-[11px] text-ink-500"><MapPin className="h-3.5 w-3.5 text-ink-400" /> {vendor?.area}, {vendor?.city}</div>
            </div>
          </SectionCard>

          <div className="rounded-2xl border border-ink-200 bg-white p-4">
            <p className="flex items-center gap-2 text-[11.5px] font-bold text-ink-800"><ShieldCheck className="h-4 w-4 text-brand-600" /> Servora guarantee</p>
            <p className="mt-1.5 text-[10.5px] leading-5 text-ink-500">
              Every booking is covered by our happiness guarantee. Not satisfied? We’ll make it right or refund you.
            </p>
            <Link to="/policies/refunds" className="mt-1.5 inline-flex text-[10.5px] font-bold text-brand-700">Read the policy →</Link>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancelBooking}
        title="Cancel this booking?"
        description={`${service?.name} on ${fmtDate(booking.date)} at ${to12h(booking.time)}. A full refund of ${inr(booking.amount)} will be initiated.`}
        confirmLabel="Cancel & refund"
      />

      <Modal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title="Reschedule booking"
        description={`${service?.name} · ${booking.ref}`}
        size="lg"
        icon={<CalendarClock className="h-5 w-5" />}
        footer={<><Button variant="outline" size="sm" onClick={() => setRescheduleOpen(false)}>Cancel</Button><Button size="sm" onClick={reschedule} disabled={!newDate || !newTime}>Confirm new slot</Button></>}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[12px] font-bold text-ink-800">New date</p>
            <BookingCalendar value={newDate} onChange={setNewDate} dense />
          </div>
          <div>
            <p className="mb-2 text-[12px] font-bold text-ink-800">Available times</p>
            {newDate ? (
              <TimeSlotPicker slots={slotAvailability(booking.serviceId, newDate)} value={newTime} onChange={setNewTime} />
            ) : (
              <div className="rounded-xl border border-dashed border-ink-200 px-4 py-10 text-center text-[11.5px] text-ink-400">Select a date first.</div>
            )}
            <p className="mt-2 text-[10px] text-ink-400">Current slot: {fmtDate(booking.date)} at {to12h(booking.time)}</p>
          </div>
        </div>
      </Modal>

      <Modal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        title="Tax invoice"
        description={`INV-${booking.ref.replace('SRV-', '2026-')}`}
        size="xl"
        footer={<><Button variant="outline" size="sm" onClick={() => setInvoiceOpen(false)}>Close</Button><Button size="sm" iconLeft={<Download className="h-3.5 w-3.5" />} onClick={() => { downloadFile(`${booking.ref}.txt`, invoiceText); toast.success('Invoice downloaded'); }}>Download</Button></>}
      >
        <InvoicePreview booking={booking as Booking} customerName={booking.customerName} customerEmail="aarav.mehta@gmail.com" />
      </Modal>

      <p className="mt-6 flex items-center gap-1.5 text-[10px] text-ink-400">
        <span className={`h-1.5 w-1.5 rounded-full ${iso(new Date()) === booking.date ? 'bg-emerald-500' : 'bg-ink-300'}`} />
        Last synced just now · booking data is stored locally for this demo
      </p>
    </div>
  );
}
