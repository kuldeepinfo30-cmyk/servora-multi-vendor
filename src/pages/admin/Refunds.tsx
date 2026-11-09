import { useState } from 'react';
import { Check, Clock, RefreshCcw, RotateCcw, Search, TrendingDown, X } from 'lucide-react';
import { getService, getVendor } from '@/lib/data';
import { cn, fmtDate, inr } from '@/lib/utils';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, Card, EmptyState, Input, Select, Skeleton, Tabs, Textarea } from '@/components/ui/primitives';
import { DataTable, ExportButton, InfoRow, PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { Drawer, Modal } from '@/components/ui/overlays';

interface RefundCase {
  id: string;
  bookingId: string;
  ref: string;
  customer: string;
  vendor: string;
  service: string;
  amount: number;
  requested: string;
  reason: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'processing';
  method: string;
  tone: string;
}

export default function AdminRefunds() {
  const loading = useMockLoad(340);
  const bookings = useApp((s) => s.bookings);
  const [tab, setTab] = useState('pending');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<RefundCase | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [statuses, setStatuses] = useState<Record<string, RefundCase['status']>>({});

  const base: RefundCase[] = [
    { id: 'rf1', bookingId: 'b14', ref: 'SRV-23980', customer: 'Kabir Malhotra', vendor: 'CoolBreeze AC Care', service: 'AC Deep Cleaning', amount: 599, requested: '2026-11-05', reason: 'Issue returned after warranty visit', status: 'pending', method: 'UPI', tone: 'warning' },
    { id: 'rf2', bookingId: 'b3', ref: 'SRV-24138', customer: 'Aarav Mehta', vendor: 'Glow Studio by Riya', service: 'Party Makeup', amount: 2499, requested: '2026-11-06', reason: 'Vendor unresponsive to reschedule', status: 'pending', method: 'UPI', tone: 'brand' },
    { id: 'rf3', bookingId: 'b6', ref: 'SRV-24005', customer: 'Aarav Mehta', vendor: 'Pawfect Care', service: 'Dog Grooming', amount: 899, requested: '2026-11-02', reason: 'Cancelled within free window', status: 'approved', method: 'UPI', tone: 'amber' },
    { id: 'rf4', bookingId: 'b21', ref: 'SRV-23520', customer: 'Aarav Mehta', vendor: 'CoolBreeze AC Care', service: 'AC Installation', amount: 1499, requested: '2026-10-24', reason: 'Duplicate charge', status: 'approved', method: 'Card', tone: 'teal' },
    { id: 'rf5', bookingId: 'b17', ref: 'SRV-23991', customer: 'Rohan Kapoor', vendor: 'GreenThumb Gardeners', service: 'Garden Maintenance', amount: 599, requested: '2026-11-04', reason: 'Claimed no-show — evidence reviewed', status: 'under_review', method: 'UPI', tone: 'violet' },
    { id: 'rf6', bookingId: 'b18', ref: 'SRV-24157', customer: 'Sneha Iyer', vendor: 'SwiftMove Packers', service: 'Local Shifting', amount: 4999, requested: '2026-11-06', reason: 'Service not delivered as described', status: 'rejected', method: 'Net banking', tone: 'danger' },
  ];

  const cases = base.map((c) => ({ ...c, status: statuses[c.id] ?? c.status }));
  const rows = cases.filter((c) => {
    if (tab === 'pending' && !['pending', 'under_review'].includes(c.status)) return false;
    if (tab !== 'pending' && tab !== 'all' && c.status !== tab) return false;
    if (query && !`${c.ref} ${c.customer} ${c.vendor}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const decide = () => {
    if (!active || !decision) return;
    setStatuses((s) => ({ ...s, [active.id]: decision === 'approve' ? 'processing' : 'rejected' }));
    toast.success(decision === 'approve' ? 'Refund approved' : 'Refund rejected', decision === 'approve' ? `${inr(active.amount)} will be returned to the original payment method.` : 'The customer has been notified with the reason.');
    setDecision(null);
    setActive(null);
  };

  if (loading) {
    return <div className="space-y-5"><Skeleton className="h-16 w-full max-w-lg" /><Skeleton className="h-[460px]" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Refunds"
        description="Approve, reject and track refunds while protecting both customers and vendors."
        actions={<ExportButton filename="refunds.csv" rows={cases} columns={[{ key: 'ref', label: 'Booking' }, { key: 'customer', label: 'Customer' }, { key: 'vendor', label: 'Vendor' }, { key: 'amount', label: 'Amount' }, { key: 'reason', label: 'Reason' }, { key: 'status', label: 'Status' }]} />}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Awaiting decision', value: cases.filter((c) => c.status === 'pending').length, hint: 'respond within 24h', icon: Clock, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Amount at risk', value: inr(cases.filter((c) => ['pending', 'under_review'].includes(c.status)).reduce((a, c) => a + c.amount, 0)), hint: 'open requests', icon: RotateCcw, tone: 'bg-rose-50 text-rose-600' },
          { label: 'Refunded this month', value: inr(2398), hint: '2 approved', icon: Check, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Refund rate', value: '1.4%', hint: 'vs 1.1% last month', icon: TrendingDown, tone: 'bg-violet-50 text-violet-600' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4"><span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', s.tone)}><s.icon className="h-5 w-5" /></span><div><p className="font-display text-[19px] font-extrabold leading-none text-ink-900">{s.value}</p><p className="mt-1 text-[10.5px] text-ink-500">{s.label}</p><p className="text-[9.5px] text-ink-400">{s.hint}</p></div></Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onChange={setTab} items={[{ key: 'pending', label: 'Needs decision', count: cases.filter((c) => ['pending', 'under_review'].includes(c.status)).length }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }, { key: 'all', label: 'All', count: cases.length }]} />
          <div className="relative sm:w-60"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search refunds…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" /></div>
        </div>
        <DataTable
          rows={rows}
          rowKey={(c) => c.id}
          onRowClick={setActive}
          empty={<EmptyState compact icon={<RotateCcw className="h-5 w-5" />} title="No refunds here" description="There are no requests in this state." />}
          columns={[
            { key: 'ref', header: 'Booking', render: (c) => <div><p className="font-mono text-[10.5px] font-semibold text-ink-800">{c.ref}</p><p className="text-[9.5px] text-ink-400">{c.service}</p></div> },
            { key: 'customer', header: 'Customer', render: (c) => <div className="flex items-center gap-2"><Avatar name={c.customer} size="xs" tone={c.tone} /><span className="text-[11px] text-ink-700">{c.customer}</span></div> },
            { key: 'vendor', header: 'Vendor', render: (c) => <span className="text-[11px] text-ink-600">{c.vendor}</span> },
            { key: 'amount', header: 'Amount', align: 'right', render: (c) => <span className="text-[12px] font-bold text-ink-900">{inr(c.amount)}</span> },
            { key: 'reason', header: 'Reason', render: (c) => <span className="line-clamp-1 max-w-[220px] text-[10.5px] text-ink-500">{c.reason}</span> },
            { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} size="sm" /> },
            { key: 'actions', header: '', align: 'right', render: (c) => <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>{['pending', 'under_review'].includes(c.status) ? <><Button size="xs" variant="outline" onClick={() => { setActive(c); setDecision('reject'); }}><X className="h-3 w-3" /></Button><Button size="xs" variant="success" onClick={() => { setActive(c); setDecision('approve'); }}><Check className="h-3 w-3" /></Button></> : <Button size="xs" variant="outline" onClick={() => setActive(c)}>View</Button>}</div> },
          ]}
        />
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Refund reasons" description="Most common causes this quarter" bodyClassName="space-y-3">
          {[['Service quality', 42, 'brand'], ['Vendor cancellation', 26, 'warning'], ['Wrong / incomplete service', 16, 'violet'], ['Billing error', 10, 'success'], ['Other', 6, 'neutral']].map(([label, value, tone]) => (
            <div key={String(label)}><div className="flex justify-between text-[11px]"><span className="text-ink-500">{label}</span><span className="font-bold text-ink-800">{value}%</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100"><div className={cn('h-full rounded-full', String(tone) === 'brand' ? 'bg-brand-500' : String(tone) === 'warning' ? 'bg-amber-500' : String(tone) === 'violet' ? 'bg-violet-500' : String(tone) === 'success' ? 'bg-emerald-500' : 'bg-ink-400')} style={{ width: `${value}%` }} /></div></div>
          ))}
        </SectionCard>
        <SectionCard title="Policy guardrails" description="Applied to every decision">
          <div className="space-y-2 text-[10.5px] leading-5 text-ink-500">
            {['Refund within 7 days of the service date.', 'Full refund if the vendor cancels or is a no-show.', 'Partial refund for quality issues after evidence review.', 'No refund after 48 hours for completed services unless safety-related.', 'All decisions must include a written rationale for the audit log.'].map((p) => <p key={p} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {p}</p>)}
          </div>
        </SectionCard>
      </div>

      <Drawer open={!!active} onClose={() => setActive(null)} title="Refund request" description={active ? `${active.ref} · ${inr(active.amount)}` : undefined} footer={<><Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button><Button variant="danger" size="sm" onClick={() => setDecision('reject')}>Reject</Button><Button variant="success" size="sm" onClick={() => setDecision('approve')}>Approve refund</Button></>}>
        {active && (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><StatusBadge status={active.status} /><span className="text-[20px] font-extrabold text-ink-900">{inr(active.amount)}</span></div>
            <div className="rounded-xl bg-ink-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Reason</p><p className="mt-1 text-[11.5px] leading-5 text-ink-700">{active.reason}</p></div>
            <div className="divide-y divide-ink-100">
              <InfoRow label="Booking" value={active.ref} mono />
              <InfoRow label="Customer" value={active.customer} />
              <InfoRow label="Vendor" value={active.vendor} />
              <InfoRow label="Service" value={active.service} />
              <InfoRow label="Payment method" value={active.method} />
              <InfoRow label="Requested" value={fmtDate(active.requested)} />
            </div>
            <div className="rounded-xl border border-ink-200 p-3">
              <p className="text-[11px] font-bold text-ink-800">Evidence</p>
              <div className="mt-2 grid grid-cols-3 gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="flex aspect-square items-center justify-center rounded-lg bg-ink-100 text-[9px] text-ink-400">Photo {i + 1}</div>)}</div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Select label="Refund type" defaultValue="full"><option value="full">Full refund</option><option value="partial">Partial refund</option></Select>
              <Input label="Amount" defaultValue={active.amount} suffix={<span className="text-xs">₹</span>} />
            </div>
            <Textarea label="Decision note" placeholder="Required — recorded in the audit log." />
            <div className="rounded-lg bg-amber-50 p-2.5 text-[10.5px] text-amber-800">Refunds are debited from the vendor’s next payout unless the platform absorbs the cost.</div>
          </div>
        )}
      </Drawer>

      <Modal open={!!decision} onClose={() => setDecision(null)} title={decision === 'approve' ? 'Approve this refund?' : 'Reject this refund?'} description={decision === 'approve' ? 'The amount will be returned to the original payment method within 5–7 working days.' : 'The customer will be notified with your reason.'} size="sm" footer={<><Button variant="outline" size="sm" onClick={() => setDecision(null)}>Cancel</Button><Button variant={decision === 'approve' ? 'success' : 'danger'} size="sm" onClick={decide}>{decision === 'approve' ? 'Approve refund' : 'Reject request'}</Button></>}>
        <div className="space-y-3"><Textarea label="Reason / decision note" placeholder="Explain the decision for the audit log…" /><p className="rounded-lg bg-ink-50 p-2.5 text-[10.5px] text-ink-500">This action cannot be undone. Both customer and vendor receive an email.</p></div>
      </Modal>
    </div>
  );
}
