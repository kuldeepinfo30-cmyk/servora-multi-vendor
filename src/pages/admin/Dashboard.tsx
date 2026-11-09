import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeIndianRupee,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  LayoutDashboard,
  Percent,
  RefreshCcw,
  Scale,
  ShieldAlert,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  APPLICATIONS,
  AUDIT_LOGS,
  BOOKING_STATUS_SPLIT,
  CATEGORY_SPLIT,
  DISPUTES,
  MONTHLY_REVENUE,
  PAYOUTS,
  TOP_VENDORS,
  VENDORS,
  WEEKLY_BOOKINGS,
} from '@/lib/data';
import { cn, inr, num } from '@/lib/utils';
import { useApp } from '@/store/app';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, buttonStyles, Card, Progress, Skeleton } from '@/components/ui/primitives';
import { PageHeader, SectionCard, StatCard, StatusBadge } from '@/components/ui/data-display';

export default function AdminDashboard() {
  const loading = useMockLoad(420);
  const bookings = useApp((s) => s.bookings);
  const [period, setPeriod] = useState('30');

  const gmv = MONTHLY_REVENUE.slice(-1)[0].revenue + 1680000;
  const commission = Math.round(gmv * 0.12);
  const queue = [
    { label: 'Vendor applications', value: APPLICATIONS.filter((a) => a.status === 'pending').length, icon: Store, to: '/admin/applications', tone: 'bg-amber-50 text-amber-600', hint: 'oldest 3 days' },
    { label: 'Payout requests', value: PAYOUTS.filter((p) => p.status === 'requested').length, icon: Wallet, to: '/admin/payouts', tone: 'bg-emerald-50 text-emerald-600', hint: inr(59680) + ' total' },
    { label: 'Open disputes', value: DISPUTES.filter((d) => d.status !== 'resolved').length, icon: Scale, to: '/admin/disputes', tone: 'bg-violet-50 text-violet-600', hint: '2 high priority' },
    { label: 'Refund requests', value: 4, icon: RefreshCcw, to: '/admin/refunds', tone: 'bg-rose-50 text-rose-600', hint: inr(8990) + ' pending' },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[118px]" />)}</div>
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-[330px] lg:col-span-2" /><Skeleton className="h-[330px]" /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-violet-600"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" /></span> Live marketplace overview</span>}
        title="Command centre"
        description="Marketplace health, revenue and the queues that need your attention today."
        actions={
          <>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-[11.5px] font-semibold text-ink-600 focus:outline-none">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">This year</option>
            </select>
            <Link to="/admin/reports" className={buttonStyles({ size: 'md' })}><TrendingUp className="h-4 w-4" /> Full reports</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross merchandise value" value={inr(gmv, true)} delta={12.6} icon={<BadgeIndianRupee className="h-5 w-5" />} tone="brand" footnote="vs ₹41.2L last month" spark={[12, 15, 14, 19, 22, 21, 27]} sparkColor="#4f46e5" />
        <StatCard label="Net commission" value={inr(commission, true)} delta={9.4} icon={<Percent className="h-5 w-5" />} tone="violet" footnote="avg. 12% take rate" spark={[8, 9, 11, 10, 13, 14, 16]} sparkColor="#8b5cf6" />
        <StatCard label="Bookings" value={num(394 + bookings.length)} delta={6.2} icon={<CalendarCheck className="h-5 w-5" />} tone="success" footnote="98.2% completion rate" spark={[22, 24, 23, 28, 31, 30, 34]} sparkColor="#10b981" />
        <StatCard label="Active vendors" value={num(VENDORS.filter((v) => v.status === 'approved').length)} delta={4.1} icon={<Store className="h-5 w-5" />} tone="warning" footnote={`${VENDORS.length} total · ${VENDORS.filter((v) => v.featured).length} featured`} spark={[18, 18, 19, 20, 20, 21, 22]} sparkColor="#f59e0b" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <SectionCard
          title="Revenue performance"
          description="GMV, commission and booking volume across the year"
          action={<Badge tone="success" size="sm" icon={<ArrowUpRight className="h-3 w-3" />}>+12.6% MoM</Badge>}
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_REVENUE} margin={{ top: 4, left: -6, right: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity={0.24} /><stop offset="100%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient>
                  <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e9f0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8b93a7' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8b93a7' }} tickFormatter={(v) => `₹${v / 100000}L`} />
                <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e7e9f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" name="GMV" stroke="#4f46e5" strokeWidth={2.4} fill="url(#gmvGrad)" />
                <Area type="monotone" dataKey="commission" name="Commission" stroke="#8b5cf6" strokeWidth={2} fill="url(#commGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-3 divide-x divide-ink-100 rounded-xl border border-ink-100 bg-ink-50/40 py-2.5">
            {[['Nov GMV', inr(286000 + 1680000)], ['Commission', inr(commission)], ['Avg. order', inr(1240)]].map(([l, v]) => (
              <div key={l} className="px-3 text-center"><p className="text-[9.5px] uppercase tracking-wide text-ink-400">{l}</p><p className="mt-0.5 text-[12.5px] font-bold text-ink-900">{v}</p></div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Booking mix" description="Status distribution this month">
          <div className="relative h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={BOOKING_STATUS_SPLIT} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {BOOKING_STATUS_SPLIT.map((s) => <Cell key={s.name} fill={s.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => num(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e7e9f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-display text-[22px] font-extrabold text-ink-900">{num(2196)}</p>
              <p className="text-[9.5px] text-ink-400">total bookings</p>
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            {BOOKING_STATUS_SPLIT.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-[11px]">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 text-ink-500">{s.name}</span>
                <span className="font-bold text-ink-800">{num(s.value)}</span>
                <span className="w-9 text-right text-[9.5px] text-ink-400">{Math.round((s.value / 2196) * 100)}%</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {queue.map((q) => (
          <Link key={q.label} to={q.to} className="group">
            <Card className="flex items-center gap-3 p-4 transition group-hover:-translate-y-0.5 group-hover:border-ink-300/70 group-hover:shadow-[0_18px_40px_-24px_rgba(15,23,42,.3)]">
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', q.tone)}><q.icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[18px] font-extrabold leading-none text-ink-900">{q.value}</p>
                <p className="mt-1 truncate text-[10.5px] font-semibold text-ink-600">{q.label}</p>
                <p className="text-[9.5px] text-ink-400">{q.hint}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:text-brand-500" />
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard
          title="Top performing vendors"
          description="By revenue this month"
          action={<Link to="/admin/vendors" className="text-[11.5px] font-bold text-brand-700">View all →</Link>}
          noPadding
        >
          <div className="divide-y divide-ink-100">
            {TOP_VENDORS.map((v, i) => (
              <div key={v.vendorId} className="flex items-center gap-3 px-5 py-3">
                <span className="w-4 text-center text-[10px] font-bold text-ink-300">{i + 1}</span>
                <Avatar name={v.name} size="sm" tone={v.tone} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-ink-900">{v.name}</p>
                  <p className="text-[10px] text-ink-400">{v.category} · {v.bookings} bookings</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-bold text-ink-900">{inr(v.revenue, true)}</p>
                  <p className="text-[9.5px] text-emerald-600">{inr(v.commission)} commission</p>
                </div>
                <Badge tone="neutral" size="sm">{v.rating.toFixed(1)} ★</Badge>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Weekly booking trend" description="Confirmed vs cancelled">
          <div className="h-[190px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_BOOKINGS} margin={{ top: 4, left: -24, right: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e9f0" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8b93a7' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                <Bar dataKey="bookings" name="Bookings" fill="#4f46e5" radius={[5, 5, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#f43f5e" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50/60 px-3 py-2 text-[10.5px] text-emerald-800"><span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Completion rate</span><span className="font-bold">98.2% · +1.4 pts</span></div>
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Category split" description="Share of bookings">
          <div className="space-y-3">
            {CATEGORY_SPLIT.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-[11px]"><span className="text-ink-500">{c.name}</span><span className="font-bold text-ink-800">{c.value}%</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full" style={{ width: `${c.value}%`, background: c.color }} /></div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Platform health" icon={<ShieldAlert className="h-4 w-4" />}>
          <div className="space-y-3">
            {[['Payment gateway', 'Operational', 'success'], ['Booking engine', 'Operational', 'success'], ['Notification service', 'Degraded — delays', 'warning'], ['Search index', 'Operational', 'success']].map(([l, v, tone]) => (
              <div key={l} className="flex items-center justify-between text-[11px]">
                <span className="text-ink-600">{l}</span>
                <Badge tone={tone} size="sm" dot>{v}</Badge>
              </div>
            ))}
            <div className="border-t border-ink-100 pt-2.5">
              <div className="flex justify-between text-[10.5px]"><span className="text-ink-500">Payout success rate</span><span className="font-bold text-ink-800">99.4%</span></div>
              <Progress value={99.4} tone="success" size="sm" className="mt-1" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Recent admin activity" action={<Link to="/admin/audit-logs" className="text-[10.5px] font-bold text-brand-700">Audit log →</Link>} bodyClassName="space-y-3">
          {AUDIT_LOGS.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-start gap-2.5">
              <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', log.tone === 'danger' ? 'bg-rose-500' : log.tone === 'success' ? 'bg-emerald-500' : log.tone === 'warning' ? 'bg-amber-500' : 'bg-brand-500')} />
              <div className="min-w-0">
                <p className="text-[10.5px] leading-4 text-ink-700"><span className="font-semibold">{log.actor}</span> {log.action.toLowerCase()}</p>
                <p className="text-[9px] text-ink-400">{log.time}</p>
              </div>
            </div>
          ))}
        </SectionCard>
      </div>
    </div>
  );
}
