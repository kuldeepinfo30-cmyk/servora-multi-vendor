import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  IndianRupee,
  MessageSquare,
  Plus,
  Star,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getService, getVendor, getVendorReviews, VENDOR_EARNINGS, VENDOR_REQUESTS } from '@/lib/data';
import { fmtDate, inr, iso, to12h } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, buttonStyles, Card, Progress, Skeleton } from '@/components/ui/primitives';
import { PageHeader, SectionCard, StatCard, StatusBadge } from '@/components/ui/data-display';
import { RatingStars } from '@/components/ui/primitives';

export default function VendorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const loading = useMockLoad(420);
  const bookings = useApp((s) => s.bookings);
  const onboarding = useApp((s) => s.onboardingStatus);

  const vendorId = user?.vendorId ?? 'v1';
  const vendor = getVendor(vendorId)!;
  const reviews = getVendorReviews(vendorId);

  const [requests, setRequests] = useState(VENDOR_REQUESTS);

  const today = iso(new Date());
  const mine = useMemo(() => bookings.filter((b) => b.vendorId === vendorId), [bookings, vendorId]);
  const todayBookings = mine.filter((b) => b.date === today);
  const upcoming = mine.filter((b) => ['confirmed', 'pending_approval'].includes(b.status) && b.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const monthNet = VENDOR_EARNINGS[VENDOR_EARNINGS.length - 1].net;
  const pendingCount = requests.length;

  const handleRequest = (id: string, action: 'accept' | 'decline') => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    toast.success(action === 'accept' ? 'Booking accepted' : 'Request declined', action === 'accept' ? 'The customer has been notified and the slot is locked.' : 'The customer has been notified and the slot released.');
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[118px]" />)}</div>
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-[300px] lg:col-span-2" /><Skeleton className="h-[300px]" /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Store open · accepting bookings</span>}
        title={`Good morning, ${user?.name.split(' ')[0] ?? 'there'}`}
        description={`${vendor.name} · ${vendor.area}, ${vendor.city} · Commission ${vendor.commission}%`}
        actions={
          <>
            <Link to="/vendor/calendar" className={buttonStyles({ variant: 'outline', size: 'md' })}>
              <CalendarDays className="h-4 w-4" /> Calendar
            </Link>
            <Link to="/vendor/services/new" className={buttonStyles({ size: 'md' })}>
              <Plus className="h-4 w-4" /> Add service
            </Link>
          </>
        }
      />

      {onboarding !== 'approved' && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white"><BadgeCheck className="h-4.5 w-4.5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold text-amber-950">Finish verification to unlock payouts</p>
            <p className="text-[11px] text-amber-700">Your business profile is {onboarding === 'draft' ? 'incomplete' : 'under review'}. Complete the remaining steps.</p>
          </div>
          <Link to="/vendor/onboarding" className={buttonStyles({ size: 'sm', className: 'shrink-0 bg-amber-500 hover:bg-amber-600' })}>Continue onboarding</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today’s bookings" value={todayBookings.length} icon={<CalendarCheck className="h-5 w-5" />} tone="brand" footnote={`${todayBookings.filter((b) => b.status === 'completed').length} completed`} />
        <StatCard label="This month net" value={inr(monthNet)} delta={9.8} icon={<Wallet className="h-5 w-5" />} tone="success" footnote="after commission" />
        <StatCard label="Pending requests" value={pendingCount} icon={<Clock className="h-5 w-5" />} tone="warning" footnote="respond within 30 min" />
        <StatCard label="Rating" value={vendor.rating.toFixed(1)} icon={<Star className="h-5 w-5" />} tone="violet" footnote={`${reviews.length} reviews`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="min-w-0 space-y-5">
          <SectionCard
            title="Today’s schedule"
            description={fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}
            action={<Link to="/vendor/calendar" className="text-[11.5px] font-bold text-brand-700">Open calendar →</Link>}
            noPadding
          >
            {todayBookings.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-100 text-ink-400"><CalendarCheck className="h-5 w-5" /></span>
                <p className="mt-3 text-[13px] font-bold text-ink-900">No bookings today</p>
                <p className="mt-1 text-[11.5px] text-ink-500">Your next booking is {upcoming[0] ? `${fmtDate(upcoming[0].date, { day: 'numeric', month: 'short' })} at ${to12h(upcoming[0].time)}` : 'not scheduled yet'}.</p>
              </div>
            ) : (
              <div className="divide-y divide-ink-100">
                {todayBookings.sort((a, b) => a.time.localeCompare(b.time)).map((b) => {
                  const service = getService(b.serviceId);
                  return (
                    <div key={b.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-14 shrink-0 text-center">
                        <p className="text-[12px] font-bold text-ink-900">{to12h(b.time).replace(' ', '')}</p>
                        <p className="text-[9px] text-ink-400">{b.duration} min</p>
                      </div>
                      <span className="h-8 w-0.5 rounded-full bg-brand-200" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-bold text-ink-800">{service?.name}</p>
                        <p className="text-[10.5px] text-ink-500">{b.customerName} · {b.address.split(',')[0]}</p>
                      </div>
                      <StatusBadge status={b.status} size="sm" />
                      <button onClick={() => toast.info('Opening booking', 'Booking workspace is available in the demo bookings screen.')} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="New booking requests"
            description="Accept or decline within 30 minutes to keep response score high."
            action={<Badge tone="warning" size="sm">{requests.length} waiting</Badge>}
            noPadding
          >
            {requests.length === 0 ? (
              <div className="px-5 py-8 text-center text-[11.5px] text-ink-400">All requests handled. Nice work!</div>
            ) : (
              <div className="divide-y divide-ink-100">
                {requests.map((r) => (
                  <div key={r.id} className="p-4 sm:px-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold text-ink-900">{r.service}</p>
                        <p className="mt-0.5 text-[10.5px] text-ink-500">{r.customer} · {fmtDate(r.date)} at {to12h(r.time)} · {inr(r.amount)}</p>
                        <p className="mt-1 rounded-md bg-ink-50 px-2 py-1 text-[10px] italic text-ink-500">“{r.note}”</p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => handleRequest(r.id, 'decline')} iconLeft={<X className="h-3.5 w-3.5" />}>Decline</Button>
                        <Button size="sm" variant="success" onClick={() => handleRequest(r.id, 'accept')} iconLeft={<Check className="h-3.5 w-3.5" />}>Accept</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Earnings trend" description="Gross, commission and net over the last 6 months" action={<Badge tone="success" size="sm" icon={<TrendingUp className="h-3 w-3" />}>+9.8%</Badge>}>
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={VENDOR_EARNINGS} margin={{ top: 4, left: -12, right: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity={0.22} /><stop offset="100%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient>
                    <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="gross" name="Gross" stroke="#4f46e5" strokeWidth={2.2} fill="url(#grossGradient)" />
                  <Area type="monotone" dataKey="net" name="Net" stroke="#10b981" strokeWidth={2.2} fill="url(#netGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 border-t border-ink-100 pt-3">
              <div><p className="text-[9.5px] uppercase tracking-wide text-ink-400">Gross (Nov)</p><p className="text-[13px] font-bold text-ink-900">{inr(VENDOR_EARNINGS[5].gross)}</p></div>
              <div><p className="text-[9.5px] uppercase tracking-wide text-ink-400">Commission</p><p className="text-[13px] font-bold text-rose-500">−{inr(VENDOR_EARNINGS[5].commission)}</p></div>
              <div><p className="text-[9.5px] uppercase tracking-wide text-ink-400">Net payout</p><p className="text-[13px] font-bold text-emerald-600">{inr(monthNet)}</p></div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title="Business health" icon={<BadgeCheck className="h-4 w-4" />}>
            <div className="flex items-center gap-3">
              <Avatar name={vendor.name} size="lg" tone="teal" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-bold text-ink-900">{vendor.name}</p>
                <p className="text-[10px] text-ink-500">{vendor.jobsDone}+ jobs · since {vendor.since}</p>
              </div>
              {vendor.verified && <Badge tone="success" size="sm"><BadgeCheck className="h-3 w-3" /> Verified</Badge>}
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-[10.5px]"><span className="text-ink-500">Profile completeness</span><span className="font-bold text-ink-800">{vendor.verified ? '92%' : '68%'}</span></div>
                <Progress value={vendor.verified ? 92 : 68} tone="success" className="mt-1" size="sm" />
              </div>
              <div>
                <div className="flex justify-between text-[10.5px]"><span className="text-ink-500">Response rate</span><span className="font-bold text-ink-800">98%</span></div>
                <Progress value={98} tone="brand" className="mt-1" size="sm" />
              </div>
              <div>
                <div className="flex justify-between text-[10.5px]"><span className="text-ink-500">On-time arrival</span><span className="font-bold text-ink-800">96%</span></div>
                <Progress value={96} tone="teal" className="mt-1" size="sm" />
              </div>
            </div>
            <Link to="/vendor/profile" className={buttonStyles({ variant: 'outline', size: 'sm', className: 'mt-4 w-full' })}>Edit business profile</Link>
          </SectionCard>

          <SectionCard title="Quick actions" bodyClassName="grid grid-cols-2 gap-2">
            {[
              { label: 'Add service', icon: Plus, to: '/vendor/services/new', tone: 'bg-brand-50 text-brand-600' },
              { label: 'Manage calendar', icon: CalendarDays, to: '/vendor/calendar', tone: 'bg-sky-50 text-sky-600' },
              { label: 'Add staff', icon: Users, to: '/vendor/staff', tone: 'bg-violet-50 text-violet-600' },
              { label: 'Request payout', icon: Wallet, to: '/vendor/payouts', tone: 'bg-emerald-50 text-emerald-600' },
            ].map((a) => (
              <Link key={a.label} to={a.to} className="rounded-xl border border-ink-200 p-3 transition hover:border-brand-200 hover:bg-brand-50/30">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.tone}`}><a.icon className="h-4 w-4" /></span>
                <p className="mt-2 text-[11px] font-bold text-ink-800">{a.label}</p>
              </Link>
            ))}
          </SectionCard>

          <SectionCard title="Recent reviews" action={<Link to="/vendor/reviews" className="text-[10.5px] font-bold text-brand-700">All →</Link>} bodyClassName="space-y-3">
            {reviews.slice(0, 3).map((r) => (
              <div key={r.id} className="border-b border-ink-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-ink-800">{r.customer}</span>
                  <RatingStars value={r.rating} showValue={false} size={11} />
                </div>
                <p className="mt-1 line-clamp-2 text-[10.5px] leading-4 text-ink-500">{r.text}</p>
                {!r.reply && <button onClick={() => navigate('/vendor/reviews')} className="mt-1 text-[10px] font-bold text-brand-700">Reply →</button>}
              </div>
            ))}
          </SectionCard>

          <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 p-4 text-white">
            <div className="flex items-center gap-2"><IndianRupee className="h-4 w-4" /><p className="text-[12px] font-bold">Next payout</p></div>
            <p className="mt-2 font-display text-[24px] font-extrabold">{inr(18420)}</p>
            <p className="text-[10px] text-emerald-100">Tuesday, 11 Nov · HDFC •••• 4421</p>
            <Link to="/vendor/payouts" className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-bold text-white hover:text-emerald-100">Payout history <ArrowUpRight className="h-3 w-3" /></Link>
          </div>

          <Card className="p-4">
            <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-brand-600" /><p className="text-[11.5px] font-bold text-ink-900">Customer messages</p></div>
            <p className="mt-1 text-[10.5px] text-ink-500">2 unread conversations waiting for a reply.</p>
            <Link to="/vendor/messages" className={buttonStyles({ variant: 'soft', size: 'sm', className: 'mt-2.5 w-full' })}>Open inbox <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Star, title: 'Top rated', text: `You’re in the top 5% of ${vendor.city} vendors.` },
          { icon: Clock, title: 'Fast responder', text: 'Average first reply: 6 minutes.' },
          { icon: Users, title: 'Growing team', text: `${vendor.staffIds.length} active staff members.` },
        ].map((c) => (
          <div key={c.title} className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3.5">
            <c.icon className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
            <div><p className="text-[11.5px] font-bold text-ink-800">{c.title}</p><p className="text-[10.5px] text-ink-500">{c.text}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
