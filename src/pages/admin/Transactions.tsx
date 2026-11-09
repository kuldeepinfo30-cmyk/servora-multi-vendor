import { useState } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CreditCard, Search, ShieldCheck, Wallet } from 'lucide-react';
import { TRANSACTIONS } from '@/lib/data';
import { cn, fmtDate, inr } from '@/lib/utils';
import { useMockLoad } from '@/lib/hooks';
import { Badge, Button, Card, EmptyState, Select, Skeleton, Tabs } from '@/components/ui/primitives';
import { DataTable, ExportButton, InfoRow, PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { Drawer } from '@/components/ui/overlays';
import type { Transaction } from '@/lib/types';

export default function AdminTransactions() {
  const loading = useMockLoad(340);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [active, setActive] = useState<Transaction | null>(null);

  const rows = TRANSACTIONS.filter((t) => {
    if (tab !== 'all' && t.status !== tab) return false;
    if (type !== 'all' && t.type !== type) return false;
    if (query && !`${t.ref} ${t.bookingRef} ${t.customer} ${t.vendor}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const totals = {
    volume: TRANSACTIONS.filter((t) => t.type === 'Payment' && t.status === 'success').reduce((a, t) => a + t.amount, 0),
    fees: TRANSACTIONS.reduce((a, t) => a + t.fee, 0),
    refunds: TRANSACTIONS.filter((t) => t.type === 'Refund').reduce((a, t) => a + t.amount, 0),
    pending: TRANSACTIONS.filter((t) => t.status === 'pending').reduce((a, t) => a + t.amount, 0),
  };

  if (loading) {
    return <div className="space-y-5"><Skeleton className="h-16 w-full max-w-lg" /><Skeleton className="h-[500px]" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Every payment, refund, commission and payout movement across the platform."
        actions={<ExportButton filename="transactions.csv" rows={TRANSACTIONS} columns={[{ key: 'ref', label: 'Reference' }, { key: 'bookingRef', label: 'Booking' }, { key: 'type', label: 'Type' }, { key: 'customer', label: 'Customer' }, { key: 'vendor', label: 'Vendor' }, { key: 'amount', label: 'Amount' }, { key: 'fee', label: 'Fee' }, { key: 'status', label: 'Status' }, { key: 'date', label: 'Date' }]} />}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Settled volume', value: inr(totals.volume), hint: 'successful payments', icon: ArrowUpRight, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Gateway fees', value: inr(totals.fees), hint: '2% blended', icon: CreditCard, tone: 'bg-brand-50 text-brand-600' },
          { label: 'Refunded', value: inr(totals.refunds), hint: '2 transactions', icon: ArrowDownLeft, tone: 'bg-rose-50 text-rose-600' },
          { label: 'Pending settlement', value: inr(totals.pending), hint: '2 transactions', icon: Wallet, tone: 'bg-amber-50 text-amber-600' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4"><span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', s.tone)}><s.icon className="h-5 w-5" /></span><div><p className="font-display text-[19px] font-extrabold leading-none text-ink-900">{s.value}</p><p className="mt-1 text-[10.5px] text-ink-500">{s.label}</p><p className="text-[9.5px] text-ink-400">{s.hint}</p></div></Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          <Tabs value={tab} onChange={setTab} items={[{ key: 'all', label: 'All', count: TRANSACTIONS.length }, { key: 'success', label: 'Success', count: TRANSACTIONS.filter((t) => t.status === 'success').length }, { key: 'pending', label: 'Pending', count: TRANSACTIONS.filter((t) => t.status === 'pending').length }, { key: 'failed', label: 'Failed' }, { key: 'refunded', label: 'Refunded' }]} />
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[210px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ref, booking, party…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" /></div>
            <Select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-[140px] text-[11.5px]"><option value="all">All types</option>{['Payment', 'Refund', 'Payout', 'Commission'].map((t) => <option key={t}>{t}</option>)}</Select>
          </div>
        </div>
        <DataTable
          rows={rows}
          rowKey={(t) => t.id}
          onRowClick={setActive}
          empty={<EmptyState compact icon={<ArrowLeftRight className="h-5 w-5" />} title="No transactions found" description="Adjust the filters or search term." />}
          columns={[
            { key: 'ref', header: 'Reference', render: (t) => <div><p className="font-mono text-[10.5px] font-semibold text-ink-800">{t.ref}</p><p className="font-mono text-[9.5px] text-ink-400">{t.bookingRef}</p></div> },
            { key: 'type', header: 'Type', render: (t) => <Badge tone={t.type === 'Payment' ? 'success' : t.type === 'Refund' ? 'danger' : t.type === 'Commission' ? 'violet' : 'brand'} size="sm">{t.type}</Badge> },
            { key: 'parties', header: 'Customer / Vendor', render: (t) => <div><p className="text-[11px] text-ink-700">{t.customer}</p><p className="text-[9.5px] text-ink-400">{t.vendor}</p></div> },
            { key: 'method', header: 'Method', render: (t) => <span className="text-[11px] text-ink-600">{t.method}</span> },
            { key: 'amount', header: 'Amount', align: 'right', render: (t) => <div><p className="text-[12px] font-bold text-ink-900">{inr(t.amount)}</p><p className="text-[9px] text-ink-400">fee {inr(t.fee)}</p></div> },
            { key: 'date', header: 'Date', render: (t) => <span className="text-[10.5px] text-ink-500">{fmtDate(t.date, { day: 'numeric', month: 'short' })}</span> },
            { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} size="sm" /> },
          ]}
        />
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Settlement summary" description="By gateway" bodyClassName="space-y-2">
          {[['Razorpay', 8, 'success'], ['Ledger (internal)', 6, 'brand']].map(([g, count, tone]) => (
            <div key={String(g)} className="flex items-center justify-between rounded-lg border border-ink-100 p-3">
              <div className="flex items-center gap-2"><ShieldCheck className={cn('h-4 w-4', tone === 'success' ? 'text-emerald-500' : 'text-brand-500')} /><div><p className="text-[11.5px] font-semibold text-ink-800">{g}</p><p className="text-[9.5px] text-ink-400">{count} transactions</p></div></div>
              <Badge tone="success" size="sm">Reconciled</Badge>
            </div>
          ))}
          <div className="rounded-lg bg-ink-50 p-3 text-[10.5px] text-ink-500">Reconciliation runs automatically at 2 AM IST. Any mismatch is raised as a finance task.</div>
        </SectionCard>
        <SectionCard title="Gateway health" description="Last 24 hours" bodyClassName="space-y-3">
          {[['Success rate', '99.2%', 'success'], ['Avg. latency', '420 ms', 'brand'], ['Failed attempts', '18', 'warning'], ['Webhook lag', '2.1 s', 'success']].map(([l, v, tone]) => (
            <div key={String(l)} className="flex items-center justify-between text-[11.5px]"><span className="text-ink-500">{l}</span><Badge tone={String(tone)} size="sm">{v}</Badge></div>
          ))}
        </SectionCard>
      </div>

      <Drawer open={!!active} onClose={() => setActive(null)} title="Transaction detail" description={active?.ref} footer={<Button size="sm" onClick={() => setActive(null)}>Close</Button>}>
        {active && (
          <div className="space-y-4">
            <div className={cn('rounded-xl p-4 text-center', active.status === 'success' ? 'bg-emerald-50' : active.status === 'failed' ? 'bg-rose-50' : active.status === 'pending' ? 'bg-amber-50' : 'bg-ink-100')}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-500">{active.type}</p>
              <p className="mt-1 font-display text-[28px] font-extrabold text-ink-900">{inr(active.amount)}</p>
              <StatusBadge status={active.status} size="sm" />
            </div>
            <div className="divide-y divide-ink-100">
              <InfoRow label="Transaction reference" value={active.ref} mono />
              <InfoRow label="Booking reference" value={active.bookingRef} mono />
              <InfoRow label="Customer" value={active.customer} />
              <InfoRow label="Vendor" value={active.vendor} />
              <InfoRow label="Method" value={active.method} />
              <InfoRow label="Gateway" value={active.gateway} />
              <InfoRow label="Gateway fee" value={inr(active.fee)} />
              <InfoRow label="Date" value={fmtDate(active.date)} />
            </div>
            <div className="flex gap-2"><Button variant="outline" size="sm" className="flex-1" onClick={() => navigator.clipboard?.writeText(active.ref)}>Copy reference</Button><Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>Print receipt</Button></div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
