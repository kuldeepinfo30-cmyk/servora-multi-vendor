import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Download,
  IndianRupee,
  Info,
  Percent,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { VENDOR_EARNINGS } from '@/lib/data';
import { cn, fmtDate, inr } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';
import { useMockLoad } from '@/lib/hooks';
import { Badge, Button, Card, Skeleton, Tabs } from '@/components/ui/primitives';
import { ExportButton, PageHeader, SectionCard, StatCard } from '@/components/ui/data-display';
import { getService } from '@/lib/data';

const serviceSplit = [
  { name: 'Deep cleaning', value: 46, color: '#4f46e5' },
  { name: 'Kitchen', value: 27, color: '#0ea5e9' },
  { name: 'Sofa & carpet', value: 18, color: '#8b5cf6' },
  { name: 'Add-ons', value: 9, color: '#10b981' },
];

export default function VendorEarnings() {
  const { user } = useAuth();
  const loading = useMockLoad(380);
  const bookings = useApp((s) => s.bookings);
  const vendorId = user?.vendorId ?? 'v1';
  const [range, setRange] = useState('6m');

  const data = range === '3m' ? VENDOR_EARNINGS.slice(-3) : VENDOR_EARNINGS;
  const current = VENDOR_EARNINGS[VENDOR_EARNINGS.length - 1];
  const prev = VENDOR_EARNINGS[VENDOR_EARNINGS.length - 2];
  const growth = ((current.net - prev.net) / prev.net) * 100;
  const commissionPct = Math.round((current.commission / current.gross) * 100);
  const paid = bookings.filter((b) => b.vendorId === vendorId && b.paymentStatus === 'paid');

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-[340px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-emerald-600"><TrendingUp className="h-3.5 w-3.5" /> {growth >= 0 ? 'Up' : 'Down'} {Math.abs(growth).toFixed(1)}% month on month</span>}
        title="Earnings"
        description="Track gross revenue, platform commission and what lands in your bank."
        actions={
          <>
            <div className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-2.5 py-2 text-[11.5px] font-semibold text-ink-600">
              <CalendarDays className="h-3.5 w-3.5 text-ink-400" /> 1 Jun – 7 Nov 2026
            </div>
            <ExportButton filename="vendor-earnings.csv" rows={VENDOR_EARNINGS} columns={[{ key: 'month', label: 'Month' }, { key: 'gross', label: 'Gross' }, { key: 'commission', label: 'Commission' }, { key: 'net', label: 'Net' }]} />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Net earned (Nov)" value={inr(current.net)} delta={growth} icon={<Wallet className="h-5 w-5" />} tone="success" footnote="after 12% commission" />
        <StatCard label="Gross bookings" value={inr(current.gross)} delta={12.4} icon={<IndianRupee className="h-5 w-5" />} tone="brand" footnote={`${paid.length} paid bookings`} />
        <StatCard label="Commission paid" value={inr(current.commission)} icon={<Percent className="h-5 w-5" />} tone="warning" footnote={`${commissionPct}% effective rate`} />
        <StatCard label="Pending settlement" value={inr(18420)} icon={<Banknote className="h-5 w-5" />} tone="violet" footnote="next payout 11 Nov" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="min-w-0 space-y-5">
          <SectionCard
            title="Earnings trend"
            description="Gross revenue vs net payout after commission"
            action={
              <Tabs value={range} onChange={setRange} items={[{ key: '3m', label: '3 months' }, { key: '6m', label: '6 months' }]} />
            }
          >
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, left: -8, right: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earnGross" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity={0.24} /><stop offset="100%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient>
                    <linearGradient id="earnNet" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.22} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="gross" name="Gross" stroke="#4f46e5" strokeWidth={2.2} fill="url(#earnGross)" />
                  <Area type="monotone" dataKey="net" name="Net payout" stroke="#10b981" strokeWidth={2.2} fill="url(#earnNet)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-3 divide-x divide-ink-100 rounded-xl border border-ink-100 bg-ink-50/40 py-2.5">
              {[['Avg. monthly net', inr(Math.round(VENDOR_EARNINGS.reduce((a, m) => a + m.net, 0) / VENDOR_EARNINGS.length))], ['Best month', 'Oct · ' + inr(49456)], ['Commission rate', '12%']].map(([l, v]) => (
                <div key={l} className="px-3 text-center"><p className="text-[9.5px] uppercase tracking-wide text-ink-400">{l}</p><p className="mt-0.5 text-[12.5px] font-bold text-ink-900">{v}</p></div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Recent transactions" description="Payments, commission deductions and adjustments" noPadding action={<ExportButton filename="transactions.csv" rows={paid} columns={[{ key: 'ref', label: 'Reference' }, { key: 'customerName', label: 'Customer' }, { key: 'serviceId', label: 'Service' }, { key: 'amount', label: 'Amount' }, { key: 'paymentStatus', label: 'Status' }]} label="Export" />}>
            <div className="divide-y divide-ink-100">
              {paid.slice(0, 7).map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', b.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-600')}>
                    {b.status === 'completed' ? <CheckMark /> : <CalendarDays className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-semibold text-ink-800">{getService(b.serviceId)?.name}</p>
                    <p className="text-[10px] text-ink-400">{b.customerName} · {b.ref} · {fmtDate(b.date, { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-bold text-ink-900">{inr(b.amount)}</p>
                    <p className="text-[9.5px] text-emerald-600">+{inr(Math.round(b.amount * 0.88))} net</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title="Earnings breakdown" description="November by service line">
            <div className="h-[190px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={serviceSplit} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={2}>
                    {serviceSplit.map((s) => <Cell key={s.name} fill={s.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {serviceSplit.map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-[11px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  <span className="flex-1 text-ink-500">{s.name}</span>
                  <span className="font-bold text-ink-800">{s.value}%</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Monthly comparison" bodyClassName="pt-2">
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={VENDOR_EARNINGS.slice(-4)} margin={{ top: 8, left: -18, right: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis hide />
                  <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                  <Bar dataKey="net" name="Net" fill="#10b981" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="commission" name="Commission" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <Card className="bg-gradient-to-br from-emerald-600 to-teal-800 p-4 text-white">
            <div className="flex items-center gap-2"><Banknote className="h-4 w-4" /><p className="text-[12px] font-bold">Next payout</p></div>
            <p className="mt-2 font-display text-[26px] font-extrabold">{inr(18420)}</p>
            <p className="text-[10px] text-emerald-100">Tuesday, 11 Nov · HDFC •••• 4421</p>
            <div className="mt-3 border-t border-white/20 pt-2.5 text-[10px] text-emerald-100">
              <div className="flex justify-between"><span>Period</span><span className="font-semibold text-white">1–7 Nov 2026</span></div>
              <div className="mt-1 flex justify-between"><span>Fees</span><span className="font-semibold text-white">₹120</span></div>
            </div>
          </Card>

          <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-sky-900"><Info className="h-3.5 w-3.5" /> How commission works</p>
            <p className="mt-1 text-[10.5px] leading-4 text-sky-800">Servora deducts {commissionPct}% per completed booking. Payment gateway fees are absorbed by the platform. Payouts arrive every Tuesday for the previous week.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckMark() {
  return <ArrowUpRight className="h-4 w-4" />;
}
