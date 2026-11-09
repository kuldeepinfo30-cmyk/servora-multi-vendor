import { useState } from 'react';
import {
  BarChart3,
  CalendarRange,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  LineChart,
  PieChart as PieIcon,
  Printer,
  RefreshCcw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as ReLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CATEGORY_SPLIT, FUNNEL, MONTHLY_REVENUE, TOP_VENDORS, WEEKLY_BOOKINGS } from '@/lib/data';
import { cn, downloadFile, inr, num } from '@/lib/utils';
import { useMockLoad } from '@/lib/hooks';
import { toast } from '@/store/toast';
import { Badge, Button, Card, Progress, Segmented, Skeleton, Tabs } from '@/components/ui/primitives';
import { DataTable, DateRangeSelect, PageHeader, SectionCard, StatCard, TrendPill } from '@/components/ui/data-display';

const reportLibrary = [
  { name: 'GMV & commission reconciliation', format: 'CSV', period: 'Nov 2026', size: '182 KB', icon: FileSpreadsheet, tone: 'text-emerald-600 bg-emerald-50' },
  { name: 'Vendor payout statement', format: 'PDF', period: 'Nov 2026', size: '1.4 MB', icon: FileText, tone: 'text-rose-600 bg-rose-50' },
  { name: 'Booking & cancellation summary', format: 'XLSX', period: 'Q3 2026', size: '640 KB', icon: FileSpreadsheet, tone: 'text-brand-600 bg-brand-50' },
  { name: 'Customer cohort retention', format: 'CSV', period: 'Last 6 months', size: '96 KB', icon: Users, tone: 'text-violet-600 bg-violet-50' },
  { name: 'GST tax report', format: 'PDF', period: 'Oct 2026', size: '2.1 MB', icon: FileText, tone: 'text-amber-600 bg-amber-50' },
];

const cohorts = [
  { month: 'Jun 2026', size: 412, values: [100, 42, 28, 22, 18, 15] },
  { month: 'Jul 2026', size: 468, values: [100, 46, 31, 24, 20, 0] },
  { month: 'Aug 2026', size: 512, values: [100, 44, 30, 23, 0, 0] },
  { month: 'Sep 2026', size: 498, values: [100, 48, 33, 0, 0, 0] },
  { month: 'Oct 2026', size: 576, values: [100, 51, 0, 0, 0, 0] },
  { month: 'Nov 2026', size: 394, values: [100, 0, 0, 0, 0, 0] },
];

const cityRows = [
  { city: 'Mumbai', bookings: 1284, gmv: 1846000, vendors: 26, growth: 14.2 },
  { city: 'Delhi NCR', bookings: 962, gmv: 1328000, vendors: 21, growth: 11.8 },
  { city: 'Bengaluru', bookings: 848, gmv: 1214000, vendors: 19, growth: 18.6 },
  { city: 'Hyderabad', bookings: 512, gmv: 684000, vendors: 12, growth: 9.4 },
  { city: 'Pune', bookings: 386, gmv: 492000, vendors: 9, growth: 22.1 },
  { city: 'Chennai', bookings: 274, gmv: 348000, vendors: 7, growth: 6.2 },
];

const heat = (v: number) => {
  if (!v) return 'bg-ink-50 text-ink-300';
  if (v >= 80) return 'bg-emerald-600 text-white';
  if (v >= 50) return 'bg-emerald-500 text-white';
  if (v >= 35) return 'bg-emerald-300 text-emerald-900';
  if (v >= 25) return 'bg-emerald-200 text-emerald-900';
  if (v >= 18) return 'bg-emerald-100 text-emerald-800';
  return 'bg-emerald-50 text-emerald-700';
};

export default function AdminReports() {
  const loading = useMockLoad(400);
  const [tab, setTab] = useState('overview');
  const [range, setRange] = useState('30');
  const [compare, setCompare] = useState('prev');

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <Skeleton className="h-11 w-full max-w-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[118px]" />)}</div>
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-[340px] lg:col-span-2" /><Skeleton className="h-[340px]" /></div>
        <Skeleton className="h-[260px]" />
      </div>
    );
  }

  const totalVisits = FUNNEL[0].value;

  return (
    <div>
      <PageHeader
        title="Reports & insights"
        description="Every number you need to run the marketplace — revenue, growth, retention and operations."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-600">
            <BarChart3 className="h-3.5 w-3.5" /> Analytics workspace
          </span>
        }
        actions={
          <>
            <DateRangeSelect value={range} onChange={setRange} />
            <select value={compare} onChange={(e) => setCompare(e.target.value)} className="h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-xs font-semibold text-ink-600 focus:border-brand-400 focus:outline-none">
              <option value="prev">vs previous period</option>
              <option value="year">vs last year</option>
              <option value="none">no comparison</option>
            </select>
            <Button variant="outline" size="sm" iconLeft={<Download className="h-4 w-4" />} onClick={() => {
              downloadFile('servora-report.csv', 'Metric,Value\nGMV,2278000\nCommission,273360\nBookings,394\nVendors,32', 'text/csv');
              toast.success('Report downloaded', 'The current view was exported as CSV.');
            }}>Export</Button>
            <Button size="sm" iconLeft={<Sparkles className="h-4 w-4" />} onClick={() => toast.info('Scheduled report', 'A weekly digest is emailed to admins every Monday at 8 AM.')}>Schedule</Button>
          </>
        }
      />

      <div className="mb-5 overflow-x-auto">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { key: 'overview', label: 'Overview' },
            { key: 'growth', label: 'Growth & retention' },
            { key: 'finance', label: 'Finance' },
            { key: 'operations', label: 'Operations' },
            { key: 'library', label: 'Report library' },
          ]}
        />
      </div>

      {tab === 'overview' && (
        <div className="animate-fade-up">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Gross merchandise value" value={inr(2278000)} delta={12.6} icon={<TrendingUp className="h-5 w-5" />} tone="brand" footnote="vs ₹20.2L previous 30 days" spark={[12, 15, 14, 19, 22, 21, 27]} />
            <StatCard label="Net revenue" value={inr(273360)} delta={9.4} icon={<Target className="h-5 w-5" />} tone="violet" footnote="12% blended take rate" spark={[8, 9, 11, 10, 13, 14, 16]} />
            <StatCard label="Bookings" value={num(394)} delta={6.2} icon={<CalendarRange className="h-5 w-5" />} tone="success" footnote="98.2% completion" spark={[22, 24, 23, 28, 31, 30, 34]} />
            <StatCard label="Average order value" value={inr(1240)} delta={-1.8} icon={<BarChart3 className="h-5 w-5" />} tone="warning" footnote="mix shifted to lower-ticket services" spark={[19, 18, 19, 17, 18, 16, 16]} />
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
            <SectionCard title="Revenue & commission" description="Monthly GMV against platform commission" action={<Badge tone="success" size="sm">+12.6% MoM</Badge>}>
              <div className="h-[290px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MONTHLY_REVENUE} margin={{ top: 4, left: -6, right: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity={0.26} /><stop offset="100%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient>
                      <linearGradient id="comGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.22} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e9f0" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8b93a7' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8b93a7' }} tickFormatter={(v) => `₹${v / 100000}L`} />
                    <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e7e9f0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="revenue" name="GMV" stroke="#4f46e5" strokeWidth={2.4} fill="url(#revGrad)" />
                    <Area type="monotone" dataKey="commission" name="Commission" stroke="#8b5cf6" strokeWidth={2} fill="url(#comGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Acquisition funnel" description="Last 30 days">
              <div className="space-y-3">
                {FUNNEL.map((f, i) => (
                  <div key={f.stage}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-ink-600">{i + 1}. {f.stage}</span>
                      <span className="text-ink-400">{num(f.value)} · {f.pct}%</span>
                    </div>
                    <div className="mt-1 h-6 overflow-hidden rounded-md bg-ink-100">
                      <div
                        className={cn('flex h-full items-center rounded-md px-2 text-[9px] font-bold text-white', ['bg-brand-600', 'bg-brand-500', 'bg-violet-500', 'bg-sky-500', 'bg-emerald-500'][i])}
                        style={{ width: `${Math.max(f.pct, 4)}%` }}
                      >
                        {f.pct >= 12 ? `${f.pct}%` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-brand-50 p-3 text-[10.5px] leading-5 text-brand-800">
                <b>Biggest drop-off:</b> service view → started booking (44 pts). Test richer slot previews on mobile.
              </div>
            </SectionCard>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <SectionCard title="Category mix" description="Share of GMV">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={CATEGORY_SPLIT} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={2}>
                      {CATEGORY_SPLIT.map((c) => <Cell key={c.name} fill={c.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 12, border: '1px solid #e7e9f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 space-y-1.5">
                {CATEGORY_SPLIT.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 text-[10.5px]">
                    <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                    <span className="flex-1 text-ink-500">{c.name}</span>
                    <span className="font-bold text-ink-800">{c.value}%</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Weekly demand" description="Bookings vs cancellations">
              <div className="h-[240px]">
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
            </SectionCard>

            <SectionCard title="Top vendors" description="By revenue">
              <div className="space-y-3">
                {TOP_VENDORS.slice(0, 4).map((v, i) => (
                  <div key={v.vendorId} className="flex items-center gap-2.5">
                    <span className="w-3 text-[10px] font-bold text-ink-300">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-ink-800">{v.name}</p>
                      <p className="text-[9px] text-ink-400">{v.bookings} bookings · {v.rating.toFixed(1)} ★</p>
                    </div>
                    <span className="text-[11px] font-bold text-ink-900">{inr(v.revenue, true)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-ink-100 pt-2.5 text-[10px] text-ink-400">Top 5 vendors contribute 31% of GMV.</div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === 'growth' && (
        <div className="animate-fade-up space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="New customers" value={num(1286)} delta={18.2} icon={<Users className="h-5 w-5" />} tone="brand" footnote="first booking in period" />
            <StatCard label="Repeat rate" value="46.8%" delta={2.4} icon={<RefreshCcw className="h-5 w-5" />} tone="success" footnote="2+ bookings" />
            <StatCard label="CAC" value={inr(184)} delta={-8.1} icon={<Target className="h-5 w-5" />} tone="violet" footnote="blended paid + organic" />
            <StatCard label="LTV (12m)" value={inr(4260)} delta={6.6} icon={<TrendingUp className="h-5 w-5" />} tone="warning" footnote="LTV:CAC 23:1" />
          </div>

          <SectionCard title="Cohort retention" description="% of customers booking again in subsequent months">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-wide text-ink-400">Cohort</th>
                    <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-wide text-ink-400">Size</th>
                    {['M0', 'M1', 'M2', 'M3', 'M4', 'M5'].map((m) => (
                      <th key={m} className="pb-2 text-center text-[10px] font-bold uppercase tracking-wide text-ink-400">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((c) => (
                    <tr key={c.month}>
                      <td className="py-1 pr-3 text-[11px] font-semibold text-ink-700">{c.month}</td>
                      <td className="py-1 pr-3 text-[10.5px] text-ink-400">{c.size}</td>
                      {c.values.map((v, i) => (
                        <td key={i} className="p-1">
                          <div className={cn('flex h-8 items-center justify-center rounded text-[10px] font-bold', heat(v))}>{v ? `${v}%` : '—'}</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-4 text-[10px] text-ink-400">
              <span className="flex items-center gap-1">Low <span className="h-2.5 w-2.5 rounded-sm bg-emerald-100" /><span className="h-2.5 w-2.5 rounded-sm bg-emerald-200" /><span className="h-2.5 w-2.5 rounded-sm bg-emerald-300" /><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /><span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" /> High</span>
              <span>Retention improves for every cohort since Jul — driven by the loyalty wallet launch.</span>
            </div>
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Signup → first booking" description="Conversion by acquisition channel">
              <div className="space-y-3">
                {[
                  ['Organic search', 62, 'brand'],
                  ['Paid social', 41, 'violet'],
                  ['Referral', 78, 'success'],
                  ['Email / CRM', 54, 'warning'],
                  ['Direct', 71, 'info'],
                ].map(([label, value, tone]) => (
                  <div key={String(label)}>
                    <div className="flex justify-between text-[11px]"><span className="text-ink-500">{label}</span><span className="font-bold text-ink-800">{value}%</span></div>
                    <Progress value={Number(value)} tone={String(tone)} size="sm" className="mt-1" />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="City performance" description="Top markets this period" noPadding>
              <DataTable
                dense
                rows={cityRows}
                rowKey={(c) => c.city}
                columns={[
                  { key: 'city', header: 'City', render: (c) => <span className="text-[11px] font-semibold text-ink-800">{c.city}</span> },
                  { key: 'bookings', header: 'Bookings', align: 'right', render: (c) => num(c.bookings) },
                  { key: 'gmv', header: 'GMV', align: 'right', render: (c) => <span className="font-bold text-ink-900">{inr(c.gmv, true)}</span> },
                  { key: 'vendors', header: 'Vendors', align: 'right' },
                  { key: 'growth', header: 'Growth', align: 'right', render: (c) => <TrendPill value={c.growth} /> },
                ]}
              />
            </SectionCard>
          </div>
        </div>
      )}

      {tab === 'finance' && (
        <div className="animate-fade-up space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Gross volume" value={inr(2278000)} delta={12.6} icon={<BarChart3 className="h-5 w-5" />} tone="brand" footnote="before refunds" />
            <StatCard label="Commission earned" value={inr(273360)} delta={9.4} icon={<Target className="h-5 w-5" />} tone="violet" footnote="12% blended" />
            <StatCard label="Refunds issued" value={inr(23980)} delta={-14.2} icon={<RefreshCcw className="h-5 w-5" />} tone="warning" footnote="1.1% of GMV" />
            <StatCard label="Payouts settled" value={inr(1842000)} delta={11.2} icon={<FileText className="h-5 w-5" />} tone="success" footnote="99.4% on time" />
          </div>

          <SectionCard title="Revenue trend" description="GMV, commission and refunds by month">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={MONTHLY_REVENUE} margin={{ top: 8, left: -6, right: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e9f0" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8b93a7' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8b93a7' }} tickFormatter={(v) => `₹${v / 100000}L`} />
                  <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e7e9f0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="revenue" name="GMV" stroke="#4f46e5" strokeWidth={2.4} dot={false} />
                  <Line type="monotone" dataKey="commission" name="Commission" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-3">
            <SectionCard title="Settlement summary" description="Current cycle" className="lg:col-span-2">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Payout batches', '4', 'this month'],
                  ['Awaiting approval', inr(59680), '3 vendors'],
                  ['Failed transfers', '1', 'retry scheduled'],
                ].map(([l, v, h]) => (
                  <div key={l} className="rounded-xl border border-ink-100 bg-ink-50/50 p-3.5">
                    <p className="text-[9.5px] uppercase tracking-wide text-ink-400">{l}</p>
                    <p className="mt-1 text-[17px] font-extrabold text-ink-900">{v}</p>
                    <p className="text-[9.5px] text-ink-400">{h}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-[10.5px] leading-5 text-emerald-800">
                Reconciliation for November matches the payment gateway to the paisa. Next automatic payout run: 12 Nov, 6 PM IST.
              </div>
            </SectionCard>
            <SectionCard title="Take rate by category" bodyClassName="space-y-3">
              {[
                ['Home Cleaning', 12, 'brand'],
                ['AC & Appliance', 14, 'info'],
                ['Beauty & Spa', 18, 'violet'],
                ['Photography', 10, 'warning'],
                ['Tutoring', 15, 'success'],
              ].map(([label, value, tone]) => (
                <div key={String(label)}>
                  <div className="flex justify-between text-[11px]"><span className="text-ink-500">{label}</span><span className="font-bold text-ink-800">{value}%</span></div>
                  <Progress value={Number(value) * 5} tone={String(tone)} size="sm" className="mt-1" />
                </div>
              ))}
            </SectionCard>
          </div>
        </div>
      )}

      {tab === 'operations' && (
        <div className="animate-fade-up space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="On-time arrival" value="96.4%" delta={1.8} icon={<CalendarRange className="h-5 w-5" />} tone="success" footnote="vendor SLA" />
            <StatCard label="Avg. acceptance" value="2m 12s" delta={-12.4} icon={<RefreshCcw className="h-5 w-5" />} tone="brand" footnote="booking → vendor accepts" />
            <StatCard label="First-time fix" value="91.2%" delta={0.6} icon={<Target className="h-5 w-5" />} tone="violet" footnote="no repeat visit" />
            <StatCard label="Support CSAT" value="4.7/5" delta={3.2} icon={<Users className="h-5 w-5" />} tone="warning" footnote="482 responses" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Cancellation reasons" description="Last 30 days">
              <div className="space-y-3">
                {[
                  ['Vendor cancelled', 34, 'danger'],
                  ['Customer changed plans', 28, 'warning'],
                  ['Schedule conflict', 19, 'brand'],
                  ['Found alternative', 12, 'violet'],
                  ['Payment failed', 7, 'neutral'],
                ].map(([label, value, tone]) => (
                  <div key={String(label)}>
                    <div className="flex justify-between text-[11px]"><span className="text-ink-500">{label}</span><span className="font-bold text-ink-800">{value}%</span></div>
                    <Progress value={Number(value) * 2.5} tone={String(tone)} size="sm" className="mt-1" />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Queue health" description="Every operational queue at a glance" noPadding>
              <DataTable
                dense
                rows={[
                  { queue: 'Vendor applications', open: 6, sla: '24h', health: 'amber' },
                  { queue: 'Payout approvals', open: 3, sla: '48h', health: 'emerald' },
                  { queue: 'Refund requests', open: 4, sla: '24h', health: 'rose' },
                  { queue: 'Disputes', open: 3, sla: '4h', health: 'rose' },
                  { queue: 'Content flags', open: 2, sla: '72h', health: 'emerald' },
                ]}
                rowKey={(r) => r.queue}
                columns={[
                  { key: 'queue', header: 'Queue', render: (r) => <span className="text-[11px] font-semibold text-ink-800">{r.queue}</span> },
                  { key: 'open', header: 'Open', align: 'right' },
                  { key: 'sla', header: 'SLA', align: 'right' },
                  { key: 'health', header: 'Health', align: 'right', render: (r) => <Badge tone={r.health} size="sm" dot>{r.health === 'emerald' ? 'On track' : r.health === 'amber' ? 'Watch' : 'Breach risk'}</Badge> },
                ]}
              />
            </SectionCard>
          </div>
        </div>
      )}

      {tab === 'library' && (
        <div className="animate-fade-up space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reportLibrary.map((r) => (
              <Card key={r.name} className="flex flex-col p-4" hover>
                <div className="flex items-start gap-3">
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', r.tone)}>
                    <r.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold leading-5 text-ink-900">{r.name}</p>
                    <p className="mt-0.5 text-[10px] text-ink-400">{r.period} · {r.format} · {r.size}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    iconLeft={<Download className="h-3.5 w-3.5" />}
                    onClick={() => {
                      downloadFile(`${r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, 'Report,Servora\nGenerated,2026-11-07', 'text/csv');
                      toast.success('Download started', `${r.name} is being generated.`);
                    }}
                  >
                    Download
                  </Button>
                  <Button size="xs" variant="ghost" iconLeft={<Printer className="h-3.5 w-3.5" />} onClick={() => toast.info('Print view', 'The report has been sent to the print preview.')}>Print</Button>
                  <span className="ml-auto rounded bg-ink-100 px-1.5 py-0.5 text-[9px] font-bold text-ink-500">{r.format}</span>
                </div>
              </Card>
            ))}

            <Card className="flex flex-col items-center justify-center border-dashed p-6 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Sparkles className="h-5 w-5" /></span>
              <p className="mt-2 text-[12.5px] font-bold text-ink-900">Build a custom report</p>
              <p className="mt-1 text-[10.5px] leading-5 text-ink-500">Choose metrics, dimensions and a schedule. Delivered to your inbox.</p>
              <Button size="xs" className="mt-3" iconLeft={<LineChart className="h-3.5 w-3.5" />} onClick={() => toast.info('Report builder', 'Pick any metric from Finance, Growth or Operations to compose a report.')}>Open builder</Button>
            </Card>
          </div>

          <SectionCard title="Scheduled deliveries" description="Automated reports sent to stakeholders">
            <div className="divide-y divide-ink-100">
              {[
                { name: 'Weekly ops digest', cadence: 'Every Monday · 8:00 AM', recipients: 'ops@servora.in, aisha@servora.in', active: true },
                { name: 'Monthly finance close', cadence: '1st of month · 9:00 AM', recipients: 'finance@servora.in', active: true },
                { name: 'Vendor performance pack', cadence: 'Fortnightly · Fri 5:00 PM', recipients: 'vendor-success@servora.in', active: false },
              ].map((s) => (
                <div key={s.name} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-bold text-ink-800">{s.name}</p>
                    <p className="text-[10px] text-ink-400">{s.cadence} · {s.recipients}</p>
                  </div>
                  <Badge tone={s.active ? 'success' : 'neutral'} size="sm" dot>{s.active ? 'Active' : 'Paused'}</Badge>
                  <Button size="xs" variant="outline" onClick={() => toast.info(s.active ? 'Delivery paused' : 'Delivery resumed', `${s.name} has been ${s.active ? 'paused' : 're-activated'}.`)}>
                    {s.active ? 'Pause' : 'Resume'}
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
