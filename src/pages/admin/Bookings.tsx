import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ChevronRight, Clock, MoreHorizontal, RefreshCcw, Search, UserRound, XCircle } from 'lucide-react';
import { getService, getVendor } from '@/lib/data';
import { cn, fmtDate, inr, to12h, today } from '@/lib/utils';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, buttonStyles, Card, EmptyState, Select, Skeleton, Tabs } from '@/components/ui/primitives';
import { DataTable, ExportButton, PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { Drawer, Dropdown, DropdownItem, Modal } from '@/components/ui/overlays';
import type { Booking } from '@/lib/types';

export default function AdminBookings() {
  const loading = useMockLoad(360);
  const bookings = useApp((s) => s.bookings);
  const updateStatus = useApp((s) => s.updateBookingStatus);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [range, setRange] = useState('all');
  const [active, setActive] = useState<Booking | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const rows = bookings.filter((b) => {
    if (tab === 'disputed' && b.status !== 'disputed') return false;
    if (tab === 'pending' && !['pending_payment', 'pending_approval'].includes(b.status)) return false;
    if (tab === 'completed' && b.status !== 'completed') return false;
    if (tab === 'cancelled' && !['cancelled', 'rejected', 'no_show', 'refunded'].includes(b.status)) return false;
    if (range === 'today' && b.date !== today()) return false;
    if (range === 'upcoming' && b.date < today()) return false;
    if (query && !`${b.ref} ${b.customerName} ${getVendor(b.vendorId)?.name}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const counts = (key: string) => key === 'all' ? bookings.length : key === 'pending' ? bookings.filter((b) => ['pending_payment', 'pending_approval'].includes(b.status)).length : key === 'cancelled' ? bookings.filter((b) => ['cancelled', 'rejected', 'no_show', 'refunded'].includes(b.status)).length : bookings.filter((b) => b.status === key).length;

  if (loading) {
    return <div className="space-y-5"><Skeleton className="h-16 w-full max-w-lg" /><Skeleton className="h-[520px]" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="All bookings"
        description="Marketplace-wide booking operations, exceptions and dispute triage."
        actions={<ExportButton filename="bookings.csv" rows={bookings} columns={[{ key: 'ref', label: 'Reference' }, { key: 'customerName', label: 'Customer' }, { key: 'vendorId', label: 'Vendor' }, { key: 'serviceId', label: 'Service' }, { key: 'date', label: 'Date' }, { key: 'status', label: 'Status' }, { key: 'amount', label: 'Amount' }]} />}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Today', value: bookings.filter((b) => b.date === today()).length, hint: 'across all vendors', tone: 'text-brand-600' },
          { label: 'Pending action', value: counts('pending'), hint: 'payment or approval', tone: 'text-amber-600' },
          { label: 'Disputed', value: counts('disputed'), hint: 'needs triage', tone: 'text-violet-600' },
          { label: 'Cancellations (7d)', value: counts('cancelled'), hint: '3.8% of volume', tone: 'text-rose-600' },
        ].map((s) => (
          <Card key={s.label} className="p-4"><p className={cn('font-display text-[22px] font-extrabold', s.tone)}>{s.value}</p><p className="mt-0.5 text-[11px] font-semibold text-ink-700">{s.label}</p><p className="text-[10px] text-ink-400">{s.hint}</p></Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          <Tabs value={tab} onChange={setTab} items={[{ key: 'all', label: 'All', count: counts('all') }, { key: 'pending', label: 'Pending', count: counts('pending') }, { key: 'completed', label: 'Completed', count: counts('completed') }, { key: 'disputed', label: 'Disputed', count: counts('disputed') }, { key: 'cancelled', label: 'Cancelled', count: counts('cancelled') }]} />
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ref, customer, vendor…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" /></div>
            <Select value={range} onChange={(e) => setRange(e.target.value)} className="h-9 w-[140px] text-[11.5px]"><option value="all">All dates</option><option value="today">Today</option><option value="upcoming">Upcoming</option></Select>
          </div>
        </div>
        <DataTable
          rows={rows}
          rowKey={(b) => b.id}
          onRowClick={setActive}
          empty={<EmptyState compact icon={<CalendarCheck className="h-5 w-5" />} title="No bookings match" description="Try a different filter." />}
          columns={[
            { key: 'ref', header: 'Booking', render: (b) => <div><p className="font-mono text-[11px] font-bold text-ink-900">{b.ref}</p><p className="text-[10px] text-ink-400">{getService(b.serviceId)?.name}</p></div> },
            { key: 'customer', header: 'Customer', render: (b) => <div className="flex items-center gap-2"><Avatar name={b.customerName} size="xs" tone="brand" /><span className="text-[11.5px] text-ink-700">{b.customerName}</span></div> },
            { key: 'vendor', header: 'Vendor', render: (b) => <span className="text-[11.5px] text-ink-600">{getVendor(b.vendorId)?.name}</span> },
            { key: 'schedule', header: 'Schedule', render: (b) => <div><p className="text-[11.5px] text-ink-700">{fmtDate(b.date, { day: 'numeric', month: 'short' })} · {to12h(b.time)}</p><p className="text-[9.5px] text-ink-400">{b.duration} min</p></div> },
            { key: 'amount', header: 'Amount', align: 'right', render: (b) => <div><p className="text-[12px] font-bold text-ink-900">{inr(b.amount)}</p><p className="text-[9.5px] capitalize text-ink-400">{b.paymentStatus}</p></div> },
            { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} size="sm" /> },
            { key: 'actions', header: '', align: 'right', render: (b) => <div onClick={(e) => e.stopPropagation()}><Dropdown trigger={<button className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"><MoreHorizontal className="h-4 w-4" /></button>}>{(close) => (<div><DropdownItem icon={<ChevronRight className="h-4 w-4" />} onClick={() => { close(); setActive(b); }}>Open booking</DropdownItem><DropdownItem icon={<UserRound className="h-4 w-4" />} onClick={() => { close(); toast.info('Reassign', 'Staff reassignment is simulated.'); }}>Reassign vendor</DropdownItem><DropdownItem icon={<RefreshCcw className="h-4 w-4" />} onClick={() => { close(); updateStatus(b.id, 'refunded', { refundAmount: b.amount }); toast.success('Refund issued', `${inr(b.amount)} returned to the customer.`); }}>Issue full refund</DropdownItem><div className="my-1 h-px bg-ink-100" /><DropdownItem danger icon={<XCircle className="h-4 w-4" />} onClick={() => { close(); setActive(b); setCancelOpen(true); }}>Cancel booking</DropdownItem></div>)}</Dropdown></div> },
          ]}
        />
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Exception queue" description="Bookings needing human intervention" bodyClassName="space-y-2">
          {bookings.filter((b) => ['disputed', 'cancellation_requested', 'no_show', 'pending_payment'].includes(b.status)).slice(0, 5).map((b) => (
            <button key={b.id} onClick={() => setActive(b)} className="flex w-full items-center gap-2.5 rounded-lg border border-ink-100 p-2.5 text-left transition hover:border-ink-200 hover:bg-ink-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Clock className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-ink-800">{b.ref} · {b.customerName}</p><p className="text-[9.5px] text-ink-400">{getService(b.serviceId)?.name} · {fmtDate(b.date)}</p></div>
              <StatusBadge status={b.status} size="sm" />
            </button>
          ))}
        </SectionCard>
        <SectionCard title="Operational metrics" description="Last 30 days" bodyClassName="space-y-3">
          {[['Completion rate', 98.2, 'success'], ['Cancellation rate', 3.8, 'danger'], ['On-time arrival', 94.6, 'brand'], ['Dispute rate', 1.2, 'warning'], ['Avg. booking value', 1240, 'violet']].map(([label, value, tone]) => (
            <div key={String(label)} className="flex items-center justify-between">
              <span className="text-[11px] text-ink-500">{label}</span>
              <div className="flex items-center gap-2"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-100"><div className={cn('h-full rounded-full', tone === 'success' ? 'bg-emerald-500' : tone === 'danger' ? 'bg-rose-500' : tone === 'brand' ? 'bg-brand-500' : tone === 'warning' ? 'bg-amber-500' : 'bg-violet-500')} style={{ width: `${typeof value === 'number' && value < 10 ? value * 10 : 65}%` }} /></div><span className="w-12 text-right text-[11px] font-bold text-ink-800">{label === 'Avg. booking value' ? inr(value as number) : `${value}%`}</span></div>
            </div>
          ))}
        </SectionCard>
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.ref}
        description={active ? `${getService(active.serviceId)?.name} · ${getVendor(active.vendorId)?.name}` : undefined}
        footer={<><Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button><Button variant="outline" size="sm" onClick={() => toast.success('Customer contacted', 'Support message sent.')}>Contact customer</Button><Button variant="danger" size="sm" onClick={() => setCancelOpen(true)}>Cancel booking</Button></>}
      >
        {active && (
          <div className="space-y-5">
            <div className="flex items-center justify-between"><StatusBadge status={active.status} /><span className="text-[18px] font-extrabold text-ink-900">{inr(active.amount)}</span></div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[['Customer', active.customerName], ['Vendor', getVendor(active.vendorId)?.name], ['Date', fmtDate(active.date)], ['Time', to12h(active.time)], ['Payment', active.paymentMethod], ['Payment status', active.paymentStatus]].map(([l, v]) => (
                <div key={String(l)} className="rounded-lg border border-ink-200 p-2.5"><p className="text-[9px] text-ink-400">{l}</p><p className="mt-0.5 font-semibold text-ink-800">{v}</p></div>
              ))}
            </div>
            <div className="rounded-xl bg-ink-50 p-3"><p className="text-[10px] font-bold text-ink-500">Service address</p><p className="mt-1 text-[11px] text-ink-700">{active.address}</p></div>
            {active.notes && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">“{active.notes}”</div>}
            <div>
              <p className="mb-2 text-[12px] font-bold text-ink-900">Admin actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.success('Refund initiated', `${inr(active.amount)} refund started.`)}>Refund customer</Button>
                <Button variant="outline" size="sm" onClick={() => toast.success('Vendor notified', 'Ops note sent to vendor.')}>Notify vendor</Button>
                <Button variant="outline" size="sm" onClick={() => toast.info('Reassign', 'Vendor reassignment requires customer approval.')}>Reassign</Button>
                <Button variant="outline" size="sm" onClick={() => toast.info('Invoice', 'Invoice downloaded in demo.')}>Download invoice</Button>
              </div>
            </div>
            <Link to="/admin/disputes" className={buttonStyles({ variant: 'soft', size: 'sm', className: 'w-full' })}>Escalate to dispute resolution</Link>
          </div>
        )}
      </Drawer>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this booking?"
        description="A full refund is issued and both parties are notified."
        size="sm"
        footer={<><Button variant="outline" size="sm" onClick={() => setCancelOpen(false)}>Keep booking</Button><Button variant="danger" size="sm" onClick={() => { if (active) { updateStatus(active.id, 'refunded', { refundAmount: active.amount }); toast.success('Booking cancelled', 'Refund processed to the original payment method.'); } setCancelOpen(false); setActive(null); }}>Cancel & refund</Button></>}
      >
        <div className="space-y-3"><Select label="Cancellation reason"><option>Customer request</option><option>Vendor unavailable</option><option>Quality issue</option><option>Payment failure</option><option>Safety concern</option></Select><p className="rounded-lg bg-rose-50 p-2.5 text-[10.5px] text-rose-800">Cancelling inside the free window may still incur vendor compensation. Review the policy first.</p></div>
      </Modal>
    </div>
  );
}
