import { useState } from 'react';
import {
  ArrowUpRight,
  Banknote,
  CalendarClock,
  Check,
  CircleDollarSign,
  Clock,
  CreditCard,
  Download,
  Info,
  Landmark,
  Plus,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { PAYOUTS } from '@/lib/data';
import { cn, fmtDate, inr } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Badge, Button, Card, Input, Skeleton, Tabs } from '@/components/ui/primitives';
import { DataTable, ExportButton, PageHeader, SectionCard, StatusBadge, Timeline } from '@/components/ui/data-display';
import { Modal } from '@/components/ui/overlays';
import type { Payout } from '@/lib/types';

export default function VendorPayouts() {
  const { user } = useAuth();
  const loading = useMockLoad(360);
  const vendorId = user?.vendorId ?? 'v1';
  const [tab, setTab] = useState('all');
  const [requestOpen, setRequestOpen] = useState(false);
  const [amount, setAmount] = useState('10000');
  const [submitting, setSubmitting] = useState(false);
  const [extra, setExtra] = useState<Payout[]>([]);

  const payouts = [...extra, ...PAYOUTS.filter((p) => p.vendorId === vendorId)];
  const rows = payouts.filter((p) => tab === 'all' || p.status === tab);
  const available = 18420;

  const request = () => {
    const value = Number(amount);
    if (!value || value < 500) { toast.error('Minimum ₹500', 'Payout requests must be at least ₹500.'); return; }
    if (value > available) { toast.error('Amount too high', `You can withdraw up to ${inr(available)} right now.`); return; }
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setRequestOpen(false);
      setExtra((prev) => [{ id: `p_${Date.now()}`, ref: `PO-2026-${Math.floor(1900 + Math.random() * 99)}`, vendorId, vendor: 'SparkleHome Cleaning Co.', amount: value, fee: 120, method: 'IMPS', status: 'requested', requestedAt: new Date().toISOString().slice(0, 10), period: '1–7 Nov 2026', bank: 'HDFC •••• 4421' }, ...prev]);
      toast.success('Payout requested', `${inr(value)} will be reviewed and paid within 2 working days.`);
    }, 900);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Payouts"
        description="Withdraw your available balance and track settlement history."
        actions={
          <>
            <ExportButton filename="payouts.csv" rows={rows} columns={[{ key: 'ref', label: 'Reference' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status' }, { key: 'requestedAt', label: 'Requested' }, { key: 'bank', label: 'Bank' }]} />
            <Button size="md" iconLeft={<Banknote className="h-4 w-4" />} onClick={() => setRequestOpen(true)}>Request payout</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Available to withdraw', value: inr(available), hint: 'cleared balance', tone: 'emerald' },
              { label: 'In transit', value: inr(18420), hint: 'arriving 11 Nov', tone: 'amber' },
              { label: 'Lifetime paid out', value: inr(128640), hint: 'since 2018', tone: 'brand' },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <p className="text-[10.5px] font-semibold text-ink-500">{s.label}</p>
                <p className={cn('mt-1 font-display text-[21px] font-extrabold', s.tone === 'emerald' ? 'text-emerald-600' : s.tone === 'amber' ? 'text-amber-600' : 'text-ink-900')}>{s.value}</p>
                <p className="mt-0.5 text-[10px] text-ink-400">{s.hint}</p>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
              <div><p className="text-[13px] font-bold text-ink-900">Payout history</p><p className="text-[10.5px] text-ink-400">All settlements to your bank account</p></div>
              <Tabs value={tab} onChange={setTab} items={[{ key: 'all', label: 'All' }, { key: 'paid', label: 'Paid' }, { key: 'processing', label: 'Processing' }, { key: 'requested', label: 'Requested' }]} />
            </div>
            <DataTable
              rows={rows}
              rowKey={(p) => p.id}
              empty={<div className="py-10 text-center text-[12px] text-ink-400">No payouts in this view.</div>}
              columns={[
                { key: 'ref', header: 'Reference', render: (p) => <div><p className="font-mono text-[11.5px] font-semibold text-ink-800">{p.ref}</p><p className="text-[10px] text-ink-400">{p.period}</p></div> },
                { key: 'amount', header: 'Amount', align: 'right', render: (p) => <span className="text-[13px] font-bold text-ink-900">{inr(p.amount)}</span> },
                { key: 'method', header: 'Method', render: (p) => <div><p className="text-[11.5px] text-ink-700">{p.method}</p><p className="text-[10px] text-ink-400">{p.bank}</p></div> },
                { key: 'requestedAt', header: 'Requested', render: (p) => <span className="text-[11px] text-ink-500">{fmtDate(p.requestedAt)}</span> },
                { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} size="sm" /> },
              ]}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Wallet className="h-4 w-4" /><p className="text-[12px] font-bold">Available balance</p></div>
                <ShieldCheck className="h-4 w-4 text-emerald-200" />
              </div>
              <p className="mt-2 font-display text-[30px] font-extrabold">{inr(available)}</p>
              <p className="text-[10px] text-emerald-100">Includes ₹2,499 pending clearance (24h hold)</p>
              <Button size="sm" className="mt-3 w-full bg-white text-emerald-700 hover:bg-emerald-50" onClick={() => setRequestOpen(true)}>Withdraw funds</Button>
            </div>
            <div className="space-y-2 p-4 text-[11px]">
              <div className="flex justify-between"><span className="text-ink-500">Payout schedule</span><span className="font-semibold text-ink-800">Every Tuesday</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Minimum payout</span><span className="font-semibold text-ink-800">₹500</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Settlement time</span><span className="font-semibold text-ink-800">1–2 working days</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Transaction fee</span><span className="font-semibold text-ink-800">₹120 flat</span></div>
            </div>
          </Card>

          <SectionCard title="Bank account" action={<button onClick={() => toast.info('Bank details', 'Contact support to change your settlement account.')} className="text-[10.5px] font-bold text-brand-700">Change</button>}>
            <div className="flex items-center gap-3 rounded-xl border border-ink-200 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-100 text-ink-600"><Landmark className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="text-[12px] font-bold text-ink-900">HDFC Bank</p><p className="text-[10.5px] text-ink-500">•••• 4421 · Neha Kulkarni</p></div>
              <Badge tone="success" size="sm"><Check className="h-3 w-3" /> Verified</Badge>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-[10.5px] text-emerald-800"><CircleDollarSign className="h-3.5 w-3.5 shrink-0" /> Bank verification complete. Payouts are protected by 2FA.</div>
          </SectionCard>

          <SectionCard title="This week" bodyClassName="space-y-0">
            <Timeline
              items={[
                { title: 'Payout approved', description: '₹18,420 approved by finance.', time: 'Yesterday', done: true },
                { title: 'Batch processing', description: 'IMPS transfer initiated to HDFC •••• 4421.', time: 'Today, 9:10 AM', current: true },
                { title: 'Funds credited', description: 'Expected by 11 Nov, 6:00 PM.', time: 'Est. 11 Nov' },
              ]}
            />
          </SectionCard>

          <div className="rounded-xl border border-ink-200 bg-white p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-ink-800"><Info className="h-3.5 w-3.5 text-brand-600" /> Payout hold</p>
            <p className="mt-1 text-[10.5px] leading-4 text-ink-500">Completed bookings are held for 24 hours to cover cancellation windows. Disputed bookings are held until resolution.</p>
          </div>
        </div>
      </div>

      <Modal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Request a payout"
        description={`Available balance ${inr(available)} · arrives in 1–2 working days`}
        icon={<Banknote className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setRequestOpen(false)}>Cancel</Button>
            <Button size="sm" loading={submitting} onClick={request} iconLeft={!submitting ? <ArrowUpRight className="h-4 w-4" /> : undefined}>Request {inr(Number(amount) || 0)}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Input label="Amount to withdraw" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} icon={<span className="text-xs font-bold">₹</span>} hint={`Maximum ${inr(available)}`} />
            <div className="mt-2 flex gap-1.5">
              {[5000, 10000, 15000, available].map((v) => (
                <button key={v} onClick={() => setAmount(String(v))} className="rounded-lg border border-ink-200 px-2.5 py-1 text-[10.5px] font-semibold text-ink-600 hover:border-brand-300 hover:bg-brand-50">{v === available ? 'Max' : inr(v)}</button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-ink-200 p-3">
            <p className="text-[11px] font-bold text-ink-800">Destination account</p>
            <div className="mt-1.5 flex items-center gap-2 text-[10.5px] text-ink-500"><Landmark className="h-3.5 w-3.5" /> HDFC •••• 4421 · IMPS</div>
          </div>
          <div className="rounded-xl bg-ink-50 p-3 text-[10.5px]">
            <div className="flex justify-between"><span className="text-ink-500">Withdrawal amount</span><span className="font-semibold text-ink-800">{inr(Number(amount) || 0)}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-ink-500">Processing fee</span><span className="font-semibold text-ink-800">−₹120</span></div>
            <div className="mt-1 flex justify-between border-t border-ink-200 pt-1"><span className="font-semibold text-ink-700">You receive</span><span className="font-extrabold text-emerald-600">{inr(Math.max(0, (Number(amount) || 0) - 120))}</span></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
