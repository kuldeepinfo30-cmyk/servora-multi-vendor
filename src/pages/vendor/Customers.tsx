import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  ChevronRight,
  ContactRound,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { CUSTOMERS, getService } from '@/lib/data';
import { cn, fmtDate, inr, to12h, today } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, buttonStyles, Card, EmptyState, Progress, Skeleton, Tabs } from '@/components/ui/primitives';
import { DataTable, ExportButton, PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { Drawer } from '@/components/ui/overlays';
import { toast } from '@/store/toast';

interface VendorCustomer {
  name: string;
  email: string;
  phone: string;
  city: string;
  tone: string;
  tier: string;
  bookings: number;
  spend: number;
  lastVisit: string;
  rating?: number;
}

export default function VendorCustomers() {
  const { user } = useAuth();
  const loading = useMockLoad(360);
  const allBookings = useApp((s) => s.bookings);
  const vendorId = user?.vendorId ?? 'v1';

  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<VendorCustomer | null>(null);

  const bookings = useMemo(() => allBookings.filter((b) => b.vendorId === vendorId), [allBookings, vendorId]);

  const customers = useMemo<VendorCustomer[]>(() => {
    const map = new Map<string, VendorCustomer>();
    for (const b of bookings) {
      const seed = CUSTOMERS.find((c) => c.name === b.customerName);
      const prev = map.get(b.customerName);
      if (!prev) {
        map.set(b.customerName, {
          name: b.customerName,
          email: seed?.email ?? `${b.customerName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
          phone: seed?.phone ?? '+91 98198 22' + String(100 + b.id.length),
          city: seed?.city ?? 'Mumbai',
          tone: seed?.tone ?? 'brand',
          tier: seed?.tier ?? 'Bronze',
          bookings: 1,
          spend: b.status === 'cancelled' || b.status === 'refunded' ? 0 : b.amount,
          lastVisit: b.date,
        });
      } else {
        prev.bookings += 1;
        if (b.status !== 'cancelled' && b.status !== 'refunded') prev.spend += b.amount;
        if (b.date > prev.lastVisit) prev.lastVisit = b.date;
      }
    }
    return [...map.values()].sort((a, b) => b.spend - a.spend);
  }, [bookings]);

  const rows = customers.filter((c) => {
    if (tab === 'vip' && c.spend < 2500) return false;
    if (tab === 'new' && c.bookings > 1) return false;
    if (tab === 'repeat' && c.bookings < 2) return false;
    if (tab === 'inactive' && c.lastVisit >= today()) return false;
    if (query && !`${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const totalSpend = customers.reduce((a, c) => a + c.spend, 0);
  const repeat = customers.filter((c) => c.bookings > 1).length;

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Everyone who has booked you, their history and lifetime value."
        actions={
          <>
            <ExportButton filename="vendor-customers.csv" rows={customers} columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'bookings', label: 'Bookings' }, { key: 'spend', label: 'Lifetime value' }, { key: 'lastVisit', label: 'Last visit' }]} />
            <Button size="md" iconLeft={<UserPlus className="h-4 w-4" />} onClick={() => toast.info('Add customer', 'Manual customer creation is available to admin users only.')}>Invite customer</Button>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total customers', value: customers.length, hint: `${repeat} returning`, tone: 'brand', icon: Users },
          { label: 'Lifetime value', value: inr(totalSpend), hint: 'net of cancellations', tone: 'success', icon: Wallet },
          { label: 'Avg. spend / visit', value: inr(customers.length ? Math.round(totalSpend / Math.max(1, bookings.length)) : 0), hint: `${bookings.length} visits`, tone: 'violet', icon: TrendingUp },
          { label: 'Repeat rate', value: `${customers.length ? Math.round((repeat / customers.length) * 100) : 0}%`, hint: 'industry avg 42%', tone: 'teal', icon: ContactRound },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-ink-500">{s.label}</p>
              <s.icon className="h-4 w-4 text-ink-300" />
            </div>
            <p className="mt-1 font-display text-[22px] font-extrabold text-ink-900">{s.value}</p>
            <p className="mt-0.5 text-[10px] text-ink-400">{s.hint}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { key: 'all', label: 'All', count: customers.length },
              { key: 'vip', label: 'High value' },
              { key: 'repeat', label: 'Returning', count: repeat },
              { key: 'new', label: 'First-time', count: customers.filter((c) => c.bookings === 1).length },
            ]}
          />
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" />
          </div>
        </div>

        <DataTable
          rows={rows}
          rowKey={(c) => c.name}
          onRowClick={setActive}
          empty={<EmptyState compact icon={<Users className="h-5 w-5" />} title="No customers in this view" description="Customers appear automatically after their first booking with you." />}
          columns={[
            {
              key: 'name',
              header: 'Customer',
              render: (c) => (
                <div className="flex items-center gap-2.5">
                  <Avatar name={c.name} size="sm" tone={c.tone} />
                  <div><p className="text-[12.5px] font-bold text-ink-900">{c.name}</p><p className="text-[10px] text-ink-400">{c.city}</p></div>
                </div>
              ),
            },
            { key: 'contact', header: 'Contact', render: (c) => <div><p className="text-[11.5px] text-ink-700">{c.email}</p><p className="text-[10px] text-ink-400">{c.phone}</p></div> },
            {
              key: 'tier',
              header: 'Segment',
              render: (c) => <Badge tone={c.tier === 'Platinum' ? 'violet' : c.tier === 'Gold' ? 'amber' : c.tier === 'Silver' ? 'neutral' : 'brand'} size="sm">{c.tier}</Badge>,
            },
            { key: 'bookings', header: 'Bookings', align: 'center', render: (c) => <span className="font-bold text-ink-800">{c.bookings}</span> },
            { key: 'spend', header: 'Lifetime value', align: 'right', render: (c) => <span className="font-bold text-ink-900">{inr(c.spend)}</span> },
            { key: 'lastVisit', header: 'Last visit', render: (c) => <span className="text-[11.5px] text-ink-500">{fmtDate(c.lastVisit, { day: 'numeric', month: 'short' })}</span> },
            { key: 'action', header: '', align: 'right', render: () => <ChevronRight className="ml-auto h-4 w-4 text-ink-300" /> },
          ]}
        />
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Top customers" description="By lifetime value" bodyClassName="space-y-3">
          {customers.slice(0, 4).map((c, i) => (
            <div key={c.name} className="flex items-center gap-2.5">
              <span className="w-4 text-[10px] font-bold text-ink-300">{i + 1}</span>
              <Avatar name={c.name} size="sm" tone={c.tone} />
              <div className="min-w-0 flex-1"><p className="truncate text-[11.5px] font-semibold text-ink-800">{c.name}</p><p className="text-[10px] text-ink-400">{c.bookings} bookings</p></div>
              <span className="text-[11.5px] font-bold text-ink-900">{inr(c.spend)}</span>
            </div>
          ))}
        </SectionCard>
        <SectionCard title="Retention" description="Repeat booking behaviour" bodyClassName="space-y-3">
          <div>
            <div className="flex justify-between text-[11px]"><span className="text-ink-500">Returning customers</span><span className="font-bold text-ink-800">{repeat} / {customers.length}</span></div>
            <Progress value={customers.length ? (repeat / customers.length) * 100 : 0} tone="success" className="mt-1.5" />
          </div>
          <div>
            <div className="flex justify-between text-[11px]"><span className="text-ink-500">Booked again within 30 days</span><span className="font-bold text-ink-800">38%</span></div>
            <Progress value={38} tone="brand" className="mt-1.5" />
          </div>
          <div>
            <div className="flex justify-between text-[11px]"><span className="text-ink-500">Left a review</span><span className="font-bold text-ink-800">64%</span></div>
            <Progress value={64} tone="violet" className="mt-1.5" />
          </div>
          <p className="rounded-lg bg-ink-50 p-2.5 text-[10px] leading-4 text-ink-500">Customers who book twice are 3× more likely to become regulars. Consider a loyalty offer in Promotions.</p>
        </SectionCard>
        <SectionCard title="This month" description="New vs returning" bodyClassName="space-y-2.5">
          {[
            ['New customers', customers.filter((c) => c.bookings === 1).length, 'brand'],
            ['Returning', repeat, 'success'],
            ['Awaiting first review', Math.max(0, customers.length - 2), 'warning'],
            ['High value (₹2.5k+)', customers.filter((c) => c.spend >= 2500).length, 'violet'],
          ].map(([label, count, tone]) => (
            <div key={String(label)} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2">
              <span className="text-[11.5px] text-ink-600">{label}</span>
              <Badge tone={String(tone)} size="sm">{String(count)}</Badge>
            </div>
          ))}
        </SectionCard>
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.name}
        description={active ? `${active.tier} customer · ${active.city}` : undefined}
        footer={<><Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button><Link to="/vendor/messages" className={buttonStyles({ size: 'sm' })}><MessageSquare className="h-4 w-4" /> Message</Link></>}
      >
        {active && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-4">
              <Avatar name={active.name} size="xl" tone={active.tone} />
              <div>
                <p className="text-[15px] font-bold text-ink-900">{active.name}</p>
                <p className="text-[11px] text-ink-500">{active.email}</p>
                <p className="text-[11px] text-ink-500">{active.phone}</p>
                <Badge tone="amber" size="sm" className="mt-1.5">{active.tier} tier</Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[['Bookings', active.bookings], ['Lifetime value', inr(active.spend)], ['Last visit', fmtDate(active.lastVisit, { day: 'numeric', month: 'short' })]].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-ink-200 p-3 text-center">
                  <p className="text-[14px] font-extrabold text-ink-900">{value}</p>
                  <p className="mt-0.5 text-[9px] text-ink-400">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" iconLeft={<Mail className="h-3.5 w-3.5" />} onClick={() => toast.success('Email drafted', 'Demo mode does not send real emails.')}>Email</Button>
              <Button variant="outline" size="sm" iconLeft={<Phone className="h-3.5 w-3.5" />} onClick={() => toast.info('Calling', `Dialling ${active.phone}`)}>Call</Button>
              <Button variant="outline" size="sm" iconLeft={<Star className="h-3.5 w-3.5" />} onClick={() => toast.info('Review history', 'Reviews are available on the Reviews page.')}>Reviews</Button>
            </div>
            <div>
              <p className="mb-2 text-[12px] font-bold text-ink-900">Booking history with you</p>
              <div className="divide-y divide-ink-100 rounded-xl border border-ink-200">
                {bookings.filter((b) => b.customerName === active.name).map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><CalendarCheck className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1"><p className="truncate text-[11.5px] font-semibold text-ink-800">{getService(b.serviceId)?.name}</p><p className="text-[10px] text-ink-400">{fmtDate(b.date)} · {to12h(b.time)}</p></div>
                    <div className="text-right"><p className="text-[11.5px] font-bold text-ink-900">{inr(b.amount)}</p><StatusBadge status={b.status} size="sm" /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
              <p className="text-[11px] font-bold text-brand-900">Loyalty insight</p>
              <p className="mt-0.5 text-[10.5px] leading-4 text-brand-800">{active.bookings > 1 ? `${active.name} books regularly — offer a loyalty discount to keep them coming back.` : `${active.name} is a first-time customer. A follow-up message after the service improves repeat rates by 24%.`}</p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
