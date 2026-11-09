import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  Download,
  MessageSquare,
  Phone,
  Search,
  User,
  X,
} from 'lucide-react';
import { getService, getStaff } from '@/lib/data';
import { cn, fmtDate, inr, to12h, today } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, buttonStyles, Card, EmptyState, Skeleton, Tabs } from '@/components/ui/primitives';
import { DataTable, ExportButton, PageHeader, SectionCard, StatusBadge, Timeline } from '@/components/ui/data-display';
import { Drawer, Modal } from '@/components/ui/overlays';
import type { Booking } from '@/lib/types';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'pending_approval', label: 'Requests' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function VendorBookings() {
  const { user } = useAuth();
  const loading = useMockLoad(380);
  const bookings = useApp((s) => s.bookings);
  const updateStatus = useApp((s) => s.updateBookingStatus);
  const vendorId = user?.vendorId ?? 'v1';

  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [range, setRange] = useState('all');
  const [active, setActive] = useState<Booking | null>(null);
  const [reschedule, setReschedule] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);

  const base = useMemo(
    () => bookings.filter((b) => b.vendorId === vendorId).sort((a, b) => b.date.localeCompare(a.date)),
    [bookings, vendorId],
  );

  const rows = base.filter((b) => {
    if (tab === 'cancelled' && !['cancelled', 'rejected', 'no_show', 'refunded'].includes(b.status)) return false;
    if (tab !== 'all' && tab !== 'cancelled' && b.status !== tab) return false;
    if (range === 'today' && b.date !== today()) return false;
    if (range === 'upcoming' && b.date < today()) return false;
    if (range === 'past' && b.date >= today()) return false;
    const svc = getService(b.serviceId);
    if (query && !`${b.ref} ${b.customerName} ${svc?.name ?? ''}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const counts = (key: string) =>
    key === 'all' ? base.length : key === 'cancelled' ? base.filter((b) => ['cancelled', 'rejected', 'no_show', 'refunded'].includes(b.status)).length : base.filter((b) => b.status === key).length;

  const act = (b: Booking, status: Booking['status'], message: string, description: string) => {
    updateStatus(b.id, status);
    setActive(null);
    toast.success(message, description);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-[480px]" />
      </div>
    );
  }

  const exportRows = base.map((b) => ({
    ref: b.ref,
    customer: b.customerName,
    service: getService(b.serviceId)?.name,
    date: b.date,
    time: b.time,
    status: b.status,
    amount: b.amount,
    payment: b.paymentStatus,
  }));

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Accept requests, track today’s jobs and close out completed work."
        actions={
          <>
            <ExportButton filename="vendor-bookings.csv" rows={exportRows} columns={[{ key: 'ref', label: 'Reference' }, { key: 'customer', label: 'Customer' }, { key: 'service', label: 'Service' }, { key: 'date', label: 'Date' }, { key: 'time', label: 'Time' }, { key: 'status', label: 'Status' }, { key: 'amount', label: 'Amount' }, { key: 'payment', label: 'Payment' }]} />
            <Link to="/vendor/calendar" className={buttonStyles({ size: 'md' })}><CalendarClock className="h-4 w-4" /> Calendar view</Link>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Today', value: base.filter((b) => b.date === today()).length, hint: `${base.filter((b) => b.date === today() && b.status === 'completed').length} completed`, tone: 'brand' },
          { label: 'Awaiting action', value: counts('pending_approval'), hint: 'respond within 30 min', tone: 'warning' },
          { label: 'Confirmed ahead', value: base.filter((b) => b.status === 'confirmed' && b.date >= today()).length, hint: 'next 30 days', tone: 'success' },
          { label: 'Revenue (paid)', value: inr(base.filter((b) => b.paymentStatus === 'paid').reduce((a, b) => a + b.amount, 0)), hint: 'lifetime demo', tone: 'violet' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-[11px] font-semibold text-ink-500">{s.label}</p>
            <p className="mt-1 font-display text-[22px] font-extrabold text-ink-900">{s.value}</p>
            <p className="mt-0.5 text-[10px] text-ink-400">{s.hint}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          <Tabs value={tab} onChange={setTab} items={tabs.map((t) => ({ ...t, count: counts(t.key) }))} />
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[190px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ref, customer, service…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" />
            </div>
            <select value={range} onChange={(e) => setRange(e.target.value)} className="h-9 rounded-lg border border-ink-200 px-2.5 text-[11.5px] font-semibold text-ink-600 focus:outline-none">
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>
        </div>

        <DataTable
          rows={rows}
          rowKey={(b) => b.id}
          onRowClick={(b) => setActive(b)}
          empty={<EmptyState compact icon={<CalendarCheck className="h-5 w-5" />} title="No bookings in this view" description="When customers book your services they will appear here. Try changing the filters." />}
          columns={[
            {
              key: 'ref',
              header: 'Booking',
              render: (b) => {
                const s = getService(b.serviceId);
                return (
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><CalendarCheck className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-bold text-ink-900">{s?.name}</p>
                      <p className="font-mono text-[10px] text-ink-400">{b.ref}</p>
                    </div>
                  </div>
                );
              },
            },
            {
              key: 'customer',
              header: 'Customer',
              render: (b) => (
                <div>
                  <p className="text-[12px] font-semibold text-ink-800">{b.customerName}</p>
                  <p className="text-[10px] text-ink-400">{b.address.split(',')[0]}</p>
                </div>
              ),
            },
            {
              key: 'date',
              header: 'Schedule',
              render: (b) => (
                <div>
                  <p className="text-[12px] font-semibold text-ink-800">{fmtDate(b.date, { day: 'numeric', month: 'short' })} · {to12h(b.time)}</p>
                  <p className="text-[10px] text-ink-400">{b.duration} min · {getStaff(b.staffId)?.name ?? 'Unassigned'}</p>
                </div>
              ),
            },
            { key: 'amount', header: 'Amount', align: 'right', render: (b) => <div><p className="text-[12.5px] font-bold text-ink-900">{inr(b.amount)}</p><p className="text-[10px] capitalize text-ink-400">{b.paymentStatus}</p></div> },
            { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} size="sm" /> },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (b) => (
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  {b.status === 'pending_approval' && (
                    <>
                      <Button size="xs" variant="success" onClick={() => act(b, 'confirmed', 'Booking accepted', 'The customer has been notified and the slot is locked.')} iconLeft={<Check className="h-3 w-3" />}>Accept</Button>
                      <Button size="xs" variant="outline" onClick={() => { setActive(b); setDeclineOpen(true); }}>Decline</Button>
                    </>
                  )}
                  {b.status === 'confirmed' && <Button size="xs" variant="soft" onClick={() => act(b, 'in_progress', 'Job started', 'The customer can now track live status.')}>Start</Button>}
                  {b.status === 'in_progress' && <Button size="xs" variant="success" onClick={() => act(b, 'completed', 'Booking completed', 'Payment will be settled in the next payout cycle.')}>Complete</Button>}
                  {!['pending_approval', 'confirmed', 'in_progress'].includes(b.status) && <ChevronRight className="h-4 w-4 text-ink-300" />}
                </div>
              ),
            },
          ]}
        />
        <div className="border-t border-ink-100 bg-ink-50/50 px-4 py-2.5 text-[10.5px] text-ink-400">
          Showing {rows.length} bookings · Click any row to open the workspace
        </div>
      </Card>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? getService(active.serviceId)?.name : ''}
        description={active ? `${active.ref} · ${fmtDate(active.date)} at ${to12h(active.time)}` : undefined}
        footer={active && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button>
            {active.status === 'pending_approval' && (
              <>
                <Button variant="outline" size="sm" onClick={() => setDeclineOpen(true)}>Decline</Button>
                <Button variant="success" size="sm" onClick={() => act(active, 'confirmed', 'Booking accepted', 'The customer has been notified and the slot is locked.')}>Accept booking</Button>
              </>
            )}
            {active.status === 'confirmed' && (
              <>
                <Button variant="outline" size="sm" onClick={() => setReschedule(true)} iconLeft={<CalendarClock className="h-4 w-4" />}>Reschedule</Button>
                <Button variant="soft" size="sm" onClick={() => act(active, 'in_progress', 'Job started', 'The customer can now track live status.')}>Start job</Button>
              </>
            )}
            {active.status === 'in_progress' && <Button variant="success" size="sm" onClick={() => act(active, 'completed', 'Booking completed', 'Payment will be settled in the next payout cycle.')}>Mark complete</Button>}
            <Link to="/vendor/messages" className={buttonStyles({ variant: 'outline', size: 'sm' })}><MessageSquare className="h-4 w-4" /> Message</Link>
          </div>
        )}
      >
        {active && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={active.status} />
              <Badge tone={active.paymentStatus === 'paid' ? 'success' : 'warning'}>{active.paymentStatus === 'paid' ? 'Payment received' : `Payment ${active.paymentStatus}`}</Badge>
              <span className="ml-auto text-[18px] font-extrabold text-ink-900">{inr(active.amount)}</span>
            </div>

            <div className="rounded-xl border border-ink-200 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={active.customerName} tone="brand" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-ink-900">{active.customerName}</p>
                  <p className="text-[10.5px] text-ink-400">Customer since 2025 · 14 bookings</p>
                </div>
                <Link to="/vendor/customers" className={buttonStyles({ variant: 'outline', size: 'sm' })}><User className="h-3.5 w-3.5" /> Profile</Link>
              </div>
              <div className="mt-3 space-y-1.5 border-t border-ink-100 pt-3 text-[11.5px]">
                <p className="flex items-start gap-2 text-ink-600"><Phone className="mt-0.5 h-3.5 w-3.5 text-ink-400" /> +91 98198 22014</p>
                <p className="flex items-start gap-2 text-ink-600"><User className="mt-0.5 h-3.5 w-3.5 text-ink-400" /> {active.address}</p>
              </div>
            </div>

            <SectionCard title="Job details" bodyClassName="space-y-0 divide-y divide-ink-100">
              {[
                ['Service', getService(active.serviceId)?.name],
                ['Duration', `${active.duration} minutes`],
                ['Assigned staff', getStaff(active.staffId)?.name ?? 'Unassigned'],
                ['Payment method', active.paymentMethod],
                ['Booking created', fmtDate(active.createdAt)],
                ['Add-ons', active.addOns?.join(', ') || 'None'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 py-2.5 text-[11.5px] first:pt-0 last:pb-0">
                  <span className="text-ink-500">{k}</span>
                  <span className="text-right font-semibold text-ink-800">{v}</span>
                </div>
              ))}
            </SectionCard>

            {active.notes && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-amber-700">Customer note</p>
                <p className="mt-1 text-[11.5px] leading-5 text-amber-900">“{active.notes}”</p>
              </div>
            )}

            <div>
              <p className="mb-3 text-[12px] font-bold text-ink-900">Booking timeline</p>
              <Timeline
                items={[
                  { title: 'Booking requested', description: `${active.customerName} requested this slot.`, time: fmtDate(active.createdAt), done: true },
                  { title: 'Payment authorised', description: `${inr(active.amount)} via ${active.paymentMethod}`, time: fmtDate(active.createdAt), done: active.paymentStatus !== 'pending' },
                  { title: 'Confirmed by vendor', description: 'Slot locked and customer notified.', done: !['pending_approval', 'pending_payment'].includes(active.status), current: active.status === 'pending_approval' },
                  { title: 'Service delivered', description: 'Staff arrival, work and completion.', current: ['confirmed', 'in_progress'].includes(active.status), done: active.status === 'completed' },
                  { title: 'Payout settled', description: 'Amount released after the 24-hour hold.', done: ['completed'].includes(active.status) },
                ]}
              />
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={reschedule}
        onClose={() => setReschedule(false)}
        title="Reschedule booking"
        description="The customer must approve the new slot."
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setReschedule(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { setReschedule(false); toast.success('Reschedule requested', 'The customer has been asked to approve the new time.'); }}>Send request</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div><p className="field-label">New date</p><input type="date" className="h-11 w-full rounded-xl border border-ink-200 px-3 text-sm" /></div>
          <div><p className="field-label">New time</p><select className="h-11 w-full rounded-xl border border-ink-200 px-3 text-sm"><option>09:00 AM</option><option>11:00 AM</option><option>02:00 PM</option><option>04:00 PM</option></select></div>
          <p className="rounded-lg bg-ink-50 p-2.5 text-[10.5px] leading-4 text-ink-500">Frequent reschedules affect your reliability score. Only request a change when genuinely necessary.</p>
        </div>
      </Modal>

      <Modal
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Decline this request?"
        description="The slot will be released and the customer notified immediately."
        size="sm"
        icon={<X className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeclineOpen(false)}>Keep request</Button>
            <Button variant="danger" size="sm" onClick={() => { if (active) act(active, 'rejected', 'Request declined', 'The customer has been notified and the slot released.'); setDeclineOpen(false); }}>Decline request</Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-ink-600">Declining reduces your response score. If you are unavailable, consider blocking the day in your calendar instead.</p>
      </Modal>
    </div>
  );
}
