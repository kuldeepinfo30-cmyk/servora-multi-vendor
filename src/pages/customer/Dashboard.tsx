import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Heart,
  MapPin,
  MessageSquare,
  Plus,
  Sparkles,
  Star,
  Wallet,
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
import { BOOKINGS, getService, getVendor, NOTIFICATIONS, SERVICES, VENDORS } from '@/lib/data';
import { addDays, fmtDate, inr, iso, to12h } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, buttonStyles, Card, Progress, Skeleton } from '@/components/ui/primitives';
import { PageHeader, SectionCard, StatCard, StatusBadge } from '@/components/ui/data-display';
import { ServiceCard } from '@/components/marketplace';

const spendSeries = [
  { month: 'Jun', amount: 2890 },
  { month: 'Jul', amount: 4590 },
  { month: 'Aug', amount: 1980 },
  { month: 'Sep', amount: 6120 },
  { month: 'Oct', amount: 3480 },
  { month: 'Nov', amount: 2499 },
];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const loading = useMockLoad(400);
  const bookings = useApp((s) => s.bookings);
  const notifications = useApp((s) => s.notifications);
  const serviceFavorites = useApp((s) => s.serviceFavorites);

  const mine = useMemo(
    () => bookings.filter((b) => b.customerId === (user?.id ?? 'u1')),
    [bookings, user?.id],
  );

  const upcoming = useMemo(
    () =>
      mine
        .filter((b) => ['confirmed', 'pending_approval', 'in_progress', 'pending_payment'].includes(b.status))
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [mine],
  );
  const next = upcoming[0];
  const nextService = next ? getService(next.serviceId) : null;
  const nextVendor = next ? getVendor(next.vendorId) : null;
  const completed = mine.filter((b) => b.status === 'completed');
  const totalSpent = completed.reduce((s, b) => s + b.amount, 0);
  const myNotifications = notifications.filter((n) => n.audience === 'customer').slice(0, 4);

  const recommended = useMemo(
    () =>
      SERVICES.filter((s) => s.status === 'published' && s.featured)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3),
    [],
  );

  const nextCountdown = (() => {
    if (!next) return '';
    const days = Math.max(0, Math.round((new Date(next.date).getTime() - new Date(iso(new Date())).getTime()) / 86400000));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  })();

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[118px]" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[300px] lg:col-span-2" />
          <Skeleton className="h-[300px]" />
        </div>
        <Skeleton className="h-[260px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-600">
            <Sparkles className="h-3.5 w-3.5" /> {fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        }
        title={`Good morning, ${user?.name.split(' ')[0] ?? 'there'} 👋`}
        description={next ? `Your next booking is ${nextCountdown.toLowerCase()} at ${to12h(next.time)}. Everything is on track.` : 'Ready to cross something off your list? Book a verified pro in minutes.'}
        actions={
          <>
            <Link to="/services" className={buttonStyles({ variant: 'outline', size: 'md' })}>
              Browse services
            </Link>
            <Link to="/customer/book?serviceId=s1" className={buttonStyles({ size: 'md' })}>
              <Plus className="h-4 w-4" /> New booking
            </Link>
          </>
        }
      />

      {next?.status === 'in_progress' && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 sm:flex-row sm:items-center">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white">
            <span className="absolute inset-0 animate-ping rounded-xl bg-sky-400 opacity-30" />
            <Clock className="relative h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-sky-950">Your professional is on the job right now</p>
            <p className="text-[11.5px] text-sky-700">
              {nextService?.name} with {nextVendor?.name} · {to12h(next.time)} · {next.address}
            </p>
          </div>
          <Link to={`/customer/bookings/${next.id}`} className={buttonStyles({ size: 'sm', className: 'shrink-0 bg-sky-600 hover:bg-sky-700' })}>
            Track live <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Upcoming bookings" value={upcoming.length} icon={<CalendarCheck className="h-5 w-5" />} tone="brand" footnote={`${upcoming.filter((b) => b.date === iso(new Date())).length} today`} />
        <StatCard label="Completed services" value={completed.length} delta={12.5} icon={<CheckCircle2 className="h-5 w-5" />} tone="success" footnote="lifetime" />
        <StatCard label="Total spent" value={inr(totalSpent)} icon={<CreditCard className="h-5 w-5" />} tone="violet" footnote="across all bookings" />
        <StatCard label="Servora credit" value={inr(1250)} icon={<Wallet className="h-5 w-5" />} tone="warning" footnote="expires 31 Dec 2026" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="min-w-0 space-y-5">
          <SectionCard
            title="Next up"
            description={next ? 'Everything you need for a smooth visit' : 'No upcoming bookings yet'}
            action={
              next ? (
                <Link to={`/customer/bookings/${next.id}`} className="text-[11.5px] font-bold text-brand-700 hover:text-brand-800">
                  Manage booking →
                </Link>
              ) : (
                <Link to="/services" className="text-[11.5px] font-bold text-brand-700 hover:text-brand-800">
                  Find a service →
                </Link>
              )
            }
            noPadding
          >
            {next && nextService && nextVendor ? (
              <div>
                <div className="flex flex-col gap-4 p-5 sm:flex-row">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 font-display text-xl font-extrabold text-brand-700">
                    {nextCountdown === 'Today' ? (
                      <Clock className="h-6 w-6" />
                    ) : (
                      <span>{new Date(next.date).getDate()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-bold text-ink-900">{nextService.name}</h3>
                      <StatusBadge status={next.status} size="sm" />
                    </div>
                    <p className="mt-1 text-[12px] text-ink-500">
                      {fmtDate(next.date, { weekday: 'long', day: 'numeric', month: 'short' })} · {to12h(next.time)} · {next.duration} min
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-600">
                        <Avatar name={nextVendor.name} size="xs" tone={nextVendor.tone ?? 'teal'} /> {nextVendor.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-500">
                        <MapPin className="h-3.5 w-3.5" /> {next.address}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <p className="font-display text-lg font-extrabold text-ink-900">{inr(next.amount)}</p>
                    <Badge tone={next.paymentStatus === 'paid' ? 'success' : 'warning'} size="sm">
                      {next.paymentStatus === 'paid' ? 'Paid' : 'Payment due'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t border-ink-100 bg-ink-50/50 px-5 py-3">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/customer/bookings/${next.id}`)}>
                    View details
                  </Button>
                  <Button variant="ghost" size="sm" iconLeft={<MessageSquare className="h-3.5 w-3.5" />} onClick={() => navigate('/customer/messages')}>
                    Message vendor
                  </Button>
                  <Button variant="ghost" size="sm" className="ml-auto" iconLeft={<CalendarCheck className="h-3.5 w-3.5" />} onClick={() => navigate(`/customer/bookings/${next.id}`)}>
                    Reschedule
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <CalendarCheck className="h-6 w-6" />
                </span>
                <p className="mt-3 text-[13.5px] font-bold text-ink-900">Your calendar is clear</p>
                <p className="mt-1 max-w-xs text-[12px] text-ink-500">Browse trusted professionals and book a slot that fits your week.</p>
                <Link to="/services" className={buttonStyles({ size: 'sm', className: 'mt-4' })}>
                  Explore services <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Recent bookings"
            description="Track, rebook or leave a review"
            action={<Link to="/customer/bookings" className="text-[11.5px] font-bold text-brand-700 hover:text-brand-800">View all →</Link>}
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-ink-200/70 bg-ink-50/60">
                    {['Service', 'Date', 'Status', 'Amount', ''].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mine.slice(0, 5).map((b) => {
                    const service = getService(b.serviceId);
                    const vendor = getVendor(b.vendorId);
                    return (
                      <tr key={b.id} className="border-b border-ink-100 transition last:border-0 hover:bg-ink-50/50">
                        <td className="px-4 py-3">
                          <p className="max-w-[210px] truncate text-[12.5px] font-semibold text-ink-800">{service?.name}</p>
                          <p className="text-[10.5px] text-ink-400">{vendor?.name}</p>
                        </td>
                        <td className="px-4 py-3 text-[11.5px] text-ink-500">{fmtDate(b.date, { day: 'numeric', month: 'short' })}</td>
                        <td className="px-4 py-3"><StatusBadge status={b.status} size="sm" /></td>
                        <td className="px-4 py-3 text-[12px] font-bold text-ink-800">{inr(b.amount)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/customer/bookings/${b.id}`} className="text-[11px] font-bold text-brand-700 hover:text-brand-800">View</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Spending overview" description="Last 6 months of completed bookings" action={<Badge tone="success" size="sm">+18.2% vs last period</Badge>}>
            <div className="h-[190px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendSeries} margin={{ top: 4, left: -18, right: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => [inr(v), 'Spent']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={2.4} fill="url(#spendGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title="Quick actions" bodyClassName="grid grid-cols-2 gap-2" noPadding={false}>
            {[
              { label: 'Book a service', icon: Plus, to: '/services', tone: 'bg-brand-50 text-brand-600' },
              { label: 'My bookings', icon: CalendarCheck, to: '/customer/bookings', tone: 'bg-sky-50 text-sky-600' },
              { label: 'Saved items', icon: Heart, to: '/customer/favorites', tone: 'bg-rose-50 text-rose-600' },
              { label: 'Payments', icon: CreditCard, to: '/customer/payments', tone: 'bg-emerald-50 text-emerald-600' },
            ].map((a) => (
              <Link key={a.label} to={a.to} className="rounded-xl border border-ink-200 p-3 transition hover:border-brand-200 hover:bg-brand-50/30">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.tone}`}>
                  <a.icon className="h-4 w-4" />
                </span>
                <p className="mt-2 text-[11.5px] font-bold text-ink-800">{a.label}</p>
              </Link>
            ))}
          </SectionCard>

          <SectionCard
            title="Updates"
            description={`${notifications.filter((n) => n.audience === 'customer' && !n.read).length} unread`}
            action={<Link to="/customer/notifications" className="text-[11px] font-bold text-brand-700">View all →</Link>}
            bodyClassName="divide-y divide-ink-100"
            noPadding={false}
          >
            {myNotifications.map((n) => (
              <Link key={n.id} to={n.href ?? '/customer/notifications'} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? 'bg-ink-200' : 'bg-brand-500'}`} />
                <span className="min-w-0">
                  <span className="block text-[11.5px] font-semibold text-ink-800">{n.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-[10.5px] leading-4 text-ink-500">{n.body}</span>
                  <span className="mt-0.5 block text-[9.5px] text-ink-400">{n.time}</span>
                </span>
              </Link>
            ))}
          </SectionCard>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-5 text-white">
            <Star className="absolute -right-3 -top-3 h-20 w-20 text-white/10" />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-200">Loyalty</p>
            <p className="mt-1.5 font-display text-[17px] font-extrabold">Gold member · 2 bookings to Platinum</p>
            <p className="mt-1 text-[11px] leading-5 text-white/70">Priority slots, free reschedules and 5% back on every booking.</p>
            <div className="mt-3">
              <Progress value={72} tone="success" className="bg-white/20" />
              <div className="mt-1.5 flex justify-between text-[9.5px] text-white/60">
                <span>2,180 pts</span><span>3,000 pts</span>
              </div>
            </div>
            <Link to="/offers" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-white hover:text-brand-100">
              See member offers <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <MessageSquare className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[12px] font-bold text-ink-900">Need a hand?</p>
                <p className="text-[10px] text-ink-400">Avg. reply 4 minutes</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-ink-500">Our support team is online 7 AM – 11 PM, every day.</p>
            <Link to="/customer/support" className={buttonStyles({ variant: 'outline', size: 'sm', className: 'mt-3 w-full' })}>
              Open support
            </Link>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="font-display text-lg font-extrabold text-ink-900">Picked for you</h2>
            <p className="text-[11.5px] text-ink-500">Based on your saved items and past bookings</p>
          </div>
          <Link to="/services" className="hidden text-[11.5px] font-bold text-brand-700 hover:text-brand-800 sm:block">Browse all services →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recommended.map((s) => (
            <ServiceCard key={s.id} service={s} vendor={VENDORS.find((v) => v.id === s.vendorId)} />
          ))}
        </div>
      </div>

      <p className="mt-6 text-[10px] text-ink-400">
        Demo data · {BOOKINGS.length} seeded bookings across customers · {serviceFavorites.length} saved services
      </p>
    </div>
  );
}
