import { useState } from 'react';
import { Banknote, Check, CheckCircle2, Clock, Download, MoreHorizontal, Search, ShieldCheck, X } from 'lucide-react';
import { PAYOUTS } from '@/lib/data';
import { cn, fmtDate, inr } from '@/lib/utils';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, Card, EmptyState, Skeleton, Tabs } from '@/components/ui/primitives';
import { DataTable, ExportButton, PageHeader, SectionCard, StatusBadge, Timeline } from '@/components/ui/data-display';
import { Drawer, Dropdown, DropdownItem, Modal } from '@/components/ui/overlays';
import type { Payout } from '@/lib/types';

export default function AdminPayouts() {
  const loading = useMockLoad(340);
  const [tab, setTab] = useState('requested');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [active, setActive] = useState<Payout | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, Payout['status']>>({});

  const payouts = PAYOUTS.map((p) => ({ ...p, status: statuses[p.id] ?? p.status }));
  const rows = payouts.filter((p) => {
    if (tab !== 'all' && p.status !== tab) return false;
    if (query && !`${p.ref} ${p.vendor}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const pending = payouts.filter((p) => p.status === 'requested');
  const pendingValue = pending.reduce((a, p) => a + p.amount, 0);

  const approve = (ids: string[]) => {
    setStatuses((s) => ({ ...s, ...Object.fromEntries(ids.map((id) => [id, 'processing' as const])) }));
    setSelected([]);
    setBatchOpen(false);
    toast.success('Payout batch approved', `${ids.length} transfer${ids.length > 1 ? 's' : ''} queued for processing.`);
  };

  if (loading) {
    return <div className="space-y-5"><Skeleton className="h-16 w-full max-w-lg" /><div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-[440px]" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Payouts"
        description="Review vendor withdrawal requests, approve batches and monitor settlement failures."
        actions={<><ExportButton filename="payouts.csv" rows={payouts} columns={[{ key: 'ref', label: 'Reference' }, { key: 'vendor', label: 'Vendor' }, { key: 'amount', label: 'Amount' }, { key: 'fee', label: 'Fee' }, { key: 'status', label: 'Status' }, { key: 'bank', label: 'Bank' }]} /><Button size="md" disabled={!pending.length} iconLeft={<Check className="h-4 w-4" />} onClick={() => { setSelected(pending.map((p) => p.id)); setBatchOpen(true); }}>Approve all ({pending.length})</Button></>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Requests pending', value: pending.length, hint: inr(pendingValue), icon: Clock, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Processing', value: payouts.filter((p) => p.status === 'processing').length, hint: '1–2 working days', icon: Banknote, tone: 'bg-brand-50 text-brand-600' },
          { label: 'Paid this month', value: inr(42340), hint: '9 transfers', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Failed / rejected', value: payouts.filter((p) => p.status === 'failed' || p.status === 'rejected').length, hint: 'needs follow-up', icon: X, tone: 'bg-rose-50 text-rose-600' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4"><span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', s.tone)}><s.icon className="h-5 w-5" /></span><div><p className="font-display text-[20px] font-extrabold leading-none text-ink-900">{s.value}</p><p className="mt-1 text-[10.5px] text-ink-500">{s.label}</p><p className="text-[9.5px] text-ink-400">{s.hint}</p></div></Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onChange={setTab} items={[{ key: 'requested', label: 'Requested', count: payouts.filter((p) => p.status === 'requested').length }, { key: 'processing', label: 'Processing' }, { key: 'paid', label: 'Paid' }, { key: 'failed', label: 'Failed' }, { key: 'all', label: 'All', count: payouts.length }]} />
          <div className="relative sm:w-60"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search payouts…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" /></div>
        </div>

        {tab === 'requested' && rows.length > 0 && (
          <div className="flex items-center justify-between border-b border-ink-100 bg-brand-50/40 px-4 py-2.5">
            <label className="flex items-center gap-2 text-[11px] font-semibold text-ink-600"><input type="checkbox" checked={selected.length === rows.length} onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])} className="h-3.5 w-3.5 rounded border-ink-300" /> Select all {rows.length} requests</label>
            <Badge tone="brand" size="sm">{inr(rows.filter((r) => selected.includes(r.id)).reduce((a, r) => a + r.amount, 0))} selected</Badge>
          </div>
        )}

        <DataTable
          rows={rows}
          rowKey={(p) => p.id}
          onRowClick={setActive}
          empty={<EmptyState compact icon={<Banknote className="h-5 w-5" />} title="No payouts in this view" description="Approved and processed payouts will appear here." />}
          columns={[
            ...(tab === 'requested' ? [{ key: 'select', header: '', width: '40px', render: (p: Payout) => <div onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.includes(p.id)} onChange={(e) => setSelected((s) => e.target.checked ? [...s, p.id] : s.filter((x) => x !== p.id))} className="h-3.5 w-3.5 rounded border-ink-300" /></div> }] : []),
            { key: 'ref', header: 'Reference', render: (p) => <div><p className="font-mono text-[10.5px] font-semibold text-ink-800">{p.ref}</p><p className="text-[9.5px] text-ink-400">{p.period}</p></div> },
            { key: 'vendor', header: 'Vendor', render: (p) => <div className="flex items-center gap-2"><Avatar name={p.vendor} size="xs" tone="teal" /><span className="text-[11.5px] text-ink-700">{p.vendor}</span></div> },
            { key: 'amount', header: 'Amount', align: 'right', render: (p) => <div><p className="text-[12.5px] font-bold text-ink-900">{inr(p.amount)}</p><p className="text-[9px] text-ink-400">fee {inr(p.fee)}</p></div> },
            { key: 'bank', header: 'Bank', render: (p) => <div><p className="text-[11px] text-ink-600">{p.method}</p><p className="font-mono text-[9.5px] text-ink-400">{p.bank}</p></div> },
            { key: 'date', header: 'Requested', render: (p) => <span className="text-[10.5px] text-ink-500">{fmtDate(p.requestedAt)}</span> },
            { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} size="sm" /> },
            { key: 'actions', header: '', align: 'right', render: (p) => <div onClick={(e) => e.stopPropagation()}><Dropdown trigger={<button className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"><MoreHorizontal className="h-4 w-4" /></button>}>{close => (<div><DropdownItem icon={<Check className="h-4 w-4" />} onClick={() => { close(); approve([p.id]); }}>Approve payout</DropdownItem><DropdownItem icon={<ShieldCheck className="h-4 w-4" />} onClick={() => { close(); setActive(p); }}>Review details</DropdownItem><div className="my-1 h-px bg-ink-100" /><DropdownItem danger icon={<X className="h-4 w-4" />} onClick={() => { close(); setStatuses((s) => ({ ...s, [p.id]: 'rejected' })); toast.error('Payout rejected', 'The vendor has been notified.'); }}>Reject</DropdownItem></div>)}</Dropdown></div> },
          ]}
        />
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Payout batch summary" description="Next scheduled run" bodyClassName="space-y-2.5">
          {[['Batch date', 'Tue, 11 Nov 2026'], ['Transfers', String(pending.length)], ['Total value', inr(pendingValue)], ['Estimated fees', inr(pending.length * 120)], ['Funding account', 'HDFC •••• 9902']].map(([l, v]) => (
            <div key={String(l)} className="flex justify-between text-[11px]"><span className="text-ink-500">{l}</span><span className="font-semibold text-ink-800">{v}</span></div>
          ))}
          <Button size="sm" className="mt-1 w-full" disabled={!pending.length} onClick={() => approve(pending.map((p) => p.id))}>Approve batch</Button>
        </SectionCard>
        <SectionCard title="Settlement health" description="Past 30 days" bodyClassName="space-y-3">
          {[['Success rate', 99.4, 'success'], ['Avg. settlement time', 1.4, 'brand'], ['Manual reviews', 3, 'warning'], ['Failures', 1, 'danger']].map(([l, v, tone]) => (
            <div key={String(l)} className="flex justify-between text-[11px]"><span className="text-ink-500">{l}</span><Badge tone={String(tone)} size="sm">{l === 'Avg. settlement time' ? `${v} days` : l === 'Success rate' ? `${v}%` : v}</Badge></div>
          ))}
        </SectionCard>
        <SectionCard title="Failed payouts" description="Requires manual retry" noPadding bodyClassName="divide-y divide-ink-100">
          {payouts.filter((p) => ['failed', 'rejected'].includes(p.status)).map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-4 py-2.5"><div className="min-w-0 flex-1"><p className="truncate text-[10.5px] font-semibold text-ink-800">{p.vendor}</p><p className="text-[9px] text-ink-400">{p.ref} · {inr(p.amount)}</p></div><Button size="xs" variant="outline" onClick={() => toast.success('Retry queued', `Payout ${p.ref} will be retried.`)}>Retry</Button></div>
          ))}
        </SectionCard>
      </div>

      <Drawer open={!!active} onClose={() => setActive(null)} title="Payout review" description={active?.ref} footer={<><Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button><Button variant="danger" size="sm" onClick={() => { if (active) { setStatuses((s) => ({ ...s, [active.id]: 'rejected' })); toast.error('Payout rejected', 'Vendor notified.'); } setActive(null); }}>Reject</Button><Button size="sm" onClick={() => { if (active) approve([active.id]); setActive(null); }}>Approve payout</Button></>}>
        {active && (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 text-center"><p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Payout amount</p><p className="mt-1 font-display text-[28px] font-extrabold text-ink-900">{inr(active.amount)}</p><p className="text-[10px] text-ink-500">Fee {inr(active.fee)} · net {inr(active.amount - active.fee)}</p></div>
            <div className="divide-y divide-ink-100">
              {[['Vendor', active.vendor], ['Period', active.period], ['Bank account', active.bank], ['Method', active.method], ['Requested', fmtDate(active.requestedAt)], ['Status', active.status]].map(([l, v]) => (
                <div key={String(l)} className="flex justify-between py-2 text-[11px]"><span className="text-ink-500">{l}</span><span className="font-semibold capitalize text-ink-800">{v}</span></div>
              ))}
            </div>
            <Timeline items={[{ title: 'Payout requested', description: 'Vendor initiated withdrawal.', done: true }, { title: 'Fraud & balance check', description: 'Automated clearance passed.', done: true }, { title: 'Finance approval', description: 'Awaiting admin action.', current: active.status === 'requested' }, { title: 'Bank transfer', description: 'IMPS/NEFT to verified account.' }]} />
            <div className="rounded-lg bg-ink-50 p-3 text-[10.5px] text-ink-500">Beneficiary name matches the verified business PAN. No manual intervention required unless flagged.</div>
          </div>
        )}
      </Drawer>

      <Modal open={batchOpen} onClose={() => setBatchOpen(false)} title={`Approve ${selected.length} payout${selected.length > 1 ? 's' : ''}?`} description={`Total ${inr(payouts.filter((p) => selected.includes(p.id)).reduce((a, p) => a + p.amount, 0))} will be transferred to verified bank accounts.`} size="sm" footer={<><Button variant="outline" size="sm" onClick={() => setBatchOpen(false)}>Cancel</Button><Button variant="success" size="sm" onClick={() => approve(selected)}>Approve batch</Button></>}>
        <div className="space-y-2">
          {payouts.filter((p) => selected.includes(p.id)).map((p) => <div key={p.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2 text-[11px]"><span className="text-ink-700">{p.vendor}</span><span className="font-bold text-ink-900">{inr(p.amount)}</span></div>)}
          <p className="rounded-lg bg-emerald-50 p-2.5 text-[10.5px] text-emerald-800">All selected beneficiaries passed verification. Transfers are irreversible once submitted.</p>
        </div>
      </Modal>
    </div>
  );
}
