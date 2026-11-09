import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BellOff,
  CalendarCheck,
  CheckCheck,
  CreditCard,
  Info,
  MessageSquare,
  Settings,
  Star,
  Tag,
} from 'lucide-react';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types';
import { Badge, Button, buttonStyles, Card, EmptyState, Skeleton, Switch, Tabs } from '@/components/ui/primitives';
import { PageHeader, SectionCard } from '@/components/ui/data-display';

const kindMeta: Record<Notification['kind'], { icon: typeof Bell; tone: string; label: string }> = {
  booking: { icon: CalendarCheck, tone: 'bg-brand-50 text-brand-600', label: 'Booking' },
  payment: { icon: CreditCard, tone: 'bg-emerald-50 text-emerald-600', label: 'Payment' },
  review: { icon: Star, tone: 'bg-amber-50 text-amber-600', label: 'Review' },
  system: { icon: Info, tone: 'bg-sky-50 text-sky-600', label: 'System' },
  message: { icon: MessageSquare, tone: 'bg-violet-50 text-violet-600', label: 'Message' },
  promo: { icon: Tag, tone: 'bg-rose-50 text-rose-600', label: 'Promotion' },
};

export default function CustomerNotifications() {
  const loading = useMockLoad(360);
  const notifications = useApp((s) => s.notifications);
  const markRead = useApp((s) => s.markRead);
  const markAllRead = useApp((s) => s.markAllRead);
  const [tab, setTab] = useState<'all' | 'unread' | 'bookings' | 'payments'>('all');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [promoNotifs, setPromoNotifs] = useState(false);

  const mine = useMemo(() => notifications.filter((n) => n.audience === 'customer'), [notifications]);
  const unread = mine.filter((n) => !n.read);

  const filtered = mine.filter((n) => {
    if (tab === 'unread') return !n.read;
    if (tab === 'bookings') return n.kind === 'booking';
    if (tab === 'payments') return n.kind === 'payment';
    return true;
  });

  const today = filtered.filter((n) => n.time.includes('just now') || n.time.includes('m ago') || n.time.includes('h ago'));
  const earlier = filtered.filter((n) => !today.includes(n));

  const renderGroup = (title: string, items: Notification[]) =>
    items.length > 0 && (
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">{title}</p>
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
          {items.map((n) => {
            const meta = kindMeta[n.kind];
            return (
              <div key={n.id} className={cn('flex items-start gap-3 border-b border-ink-100 px-4 py-4 last:border-0 transition', !n.read && 'bg-brand-50/25')}>
                <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', meta.tone)}>
                  <meta.icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[12.5px] font-bold text-ink-900">{n.title}</p>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                    <Badge tone="neutral" size="sm" className="ml-auto hidden sm:inline-flex">{meta.label}</Badge>
                  </div>
                  <p className="mt-0.5 text-[11.5px] leading-5 text-ink-500">{n.body}</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-[10px] text-ink-400">{n.time}</span>
                    {n.href && <Link to={n.href} onClick={() => markRead(n.id)} className="text-[10.5px] font-bold text-brand-700 hover:text-brand-800">View →</Link>}
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="text-[10.5px] font-semibold text-ink-400 hover:text-ink-700">Mark read</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Booking updates, payment receipts, vendor replies and the occasional good offer."
        actions={
          <>
            <Button variant="outline" size="md" iconLeft={<Settings className="h-4 w-4" />} onClick={() => (window.location.href = '/customer/settings')}>Preferences</Button>
            <Button size="md" iconLeft={<CheckCheck className="h-4 w-4" />} onClick={() => { markAllRead('customer'); toast.success('All caught up', 'Every notification marked as read.'); }} disabled={unread.length === 0}>
              Mark all read
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <div className="mb-4">
            <Tabs
              value={tab}
              onChange={(k) => setTab(k as typeof tab)}
              items={[
                { key: 'all', label: 'All', count: mine.length },
                { key: 'unread', label: 'Unread', count: unread.length },
                { key: 'bookings', label: 'Bookings', count: mine.filter((n) => n.kind === 'booking').length },
                { key: 'payments', label: 'Payments', count: mine.filter((n) => n.kind === 'payment').length },
              ]}
            />
          </div>

          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={tab === 'unread' ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              title={tab === 'unread' ? 'No unread notifications' : 'Nothing here yet'}
              description={tab === 'unread' ? 'You’re completely caught up. New updates will appear here.' : 'Booking and payment updates will land here as they happen.'}
              action={<Button variant="outline" size="sm" onClick={() => setTab('all')}>View all notifications</Button>}
            />
          ) : (
            <div className="space-y-5">
              {renderGroup('Today', today)}
              {renderGroup('Earlier', earlier)}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <SectionCard title="Delivery preferences" icon={<Settings className="h-4 w-4" />} bodyClassName="space-y-4">
            <Switch checked={emailNotifs} onChange={(v) => { setEmailNotifs(v); toast.success('Preference saved', `Email notifications ${v ? 'enabled' : 'disabled'}.`); }} label="Email" description="Receipts and booking updates" />
            <Switch checked={pushNotifs} onChange={(v) => { setPushNotifs(v); toast.success('Preference saved', `Push notifications ${v ? 'enabled' : 'disabled'}.`); }} label="Push" description="Real-time arrival alerts" />
            <Switch checked={promoNotifs} onChange={(v) => { setPromoNotifs(v); toast.success('Preference saved', `Promotions ${v ? 'enabled' : 'disabled'}.`); }} label="Offers" description="Deals and seasonal coupons" />
            <Link to="/customer/settings" className={buttonStyles({ variant: 'outline', size: 'sm', className: 'w-full' })}>All preferences</Link>
          </SectionCard>

          <Card className="p-4">
            <p className="flex items-center gap-2 text-[11.5px] font-bold text-ink-800"><Bell className="h-4 w-4 text-brand-600" /> Notification digest</p>
            <p className="mt-1 text-[10.5px] leading-5 text-ink-500">Prefer fewer emails? Switch to a weekly digest in settings and we’ll bundle everything into one Monday summary.</p>
          </Card>

          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-4 text-white">
            <p className="text-[11.5px] font-bold">Never miss a visit</p>
            <p className="mt-1 text-[10.5px] leading-5 text-white/70">Turn on push alerts to know the moment your professional is on the way.</p>
            <div className="mt-2.5 rounded-lg bg-white/15 px-3 py-2 text-[10px] font-semibold">On-time arrival alerts · live tracking</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
