import { useState } from 'react';
import {
  Ban,
  CheckCircle2,
  ChevronRight,
  Download,
  Mail,
  MoreHorizontal,
  Phone,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { CUSTOMERS } from '@/lib/data';
import { cn, fmtDate, inr } from '@/lib/utils';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, buttonStyles, Card, EmptyState, Input, Select, Skeleton, Tabs, Textarea } from '@/components/ui/primitives';
import { DataTable, ExportButton, PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { Drawer, Dropdown, DropdownItem, Modal } from '@/components/ui/overlays';
import type { Customer } from '@/lib/types';

const tierTone: Record<string, string> = { Platinum: 'violet', Gold: 'amber', Silver: 'neutral', Bronze: 'brand' };

export default function AdminCustomers() {
  const loading = useMockLoad(360);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('all');
  const [tier, setTier] = useState('all');
  const [active, setActive] = useState<Customer | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Customer['status']>>({});

  const customers = CUSTOMERS.map((c) => ({ ...c, status: overrides[c.id] ?? c.status }));
  const rows = customers.filter((c) => {
    if (tab !== 'all' && c.status !== tab) return false;
    if (city !== 'all' && c.city !== city) return false;
    if (tier !== 'all' && c.tier !== tier) return false;
    if (query && !`${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const totalSpend = customers.reduce((a, c) => a + c.spend, 0);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-[460px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Every registered customer, their activity, spend and account status."
        actions={<ExportButton filename="customers.csv" rows={customers} columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'city', label: 'City' }, { key: 'bookings', label: 'Bookings' }, { key: 'spend', label: 'Spend' }, { key: 'tier', label: 'Tier' }, { key: 'status', label: 'Status' }]} />}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total customers', value: customers.length, hint: `+3 this week`, icon: Users, tone: 'bg-brand-50 text-brand-600' },
          { label: 'Active', value: customers.filter((c) => c.status === 'active').length, hint: '92% of base', icon: UserCheck, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Lifetime spend', value: inr(totalSpend), hint: 'all customers', icon: Wallet, tone: 'bg-violet-50 text-violet-600' },
          { label: 'Restricted', value: customers.filter((c) => c.status !== 'active').length, hint: 'blocked or suspended', icon: Ban, tone: 'bg-rose-50 text-rose-600' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', s.tone)}><s.icon className="h-5 w-5" /></span>
            <div><p className="font-display text-[20px] font-extrabold leading-none text-ink-900">{s.value}</p><p className="mt-1 text-[10.5px] text-ink-500">{s.label}</p><p className="text-[9.5px] text-ink-400">{s.hint}</p></div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          <Tabs value={tab} onChange={setTab} items={[{ key: 'all', label: 'All', count: customers.length }, { key: 'active', label: 'Active', count: customers.filter((c) => c.status === 'active').length }, { key: 'suspended', label: 'Suspended' }, { key: 'blocked', label: 'Blocked' }]} />
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[190px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" />
            </div>
            <Select value={city} onChange={(e) => setCity(e.target.value)} className="h-9 w-[140px] text-[11.5px]"><option value="all">All cities</option>{[...new Set(CUSTOMERS.map((c) => c.city))].map((c) => <option key={c}>{c}</option>)}</Select>
            <Select value={tier} onChange={(e) => setTier(e.target.value)} className="h-9 w-[130px] text-[11.5px]"><option value="all">All tiers</option>{['Platinum', 'Gold', 'Silver', 'Bronze'].map((t) => <option key={t}>{t}</option>)}</Select>
          </div>
        </div>

        <DataTable
          rows={rows}
          rowKey={(c) => c.id}
          onRowClick={setActive}
          empty={<EmptyState compact icon={<Users className="h-5 w-5" />} title="No customers found" description="Try a different search term or filter." action={<Button variant="outline" size="sm" onClick={() => { setQuery(''); setCity('all'); setTier('all'); setTab('all'); }}>Clear filters</Button>} />}
          columns={[
            { key: 'name', header: 'Customer', render: (c) => <div className="flex items-center gap-2.5"><Avatar name={c.name} size="sm" tone={c.tone} /><div><p className="text-[12.5px] font-bold text-ink-900">{c.name}</p><p className="text-[10px] text-ink-400">{c.email}</p></div></div> },
            { key: 'city', header: 'City', render: (c) => <span className="text-[11.5px] text-ink-600">{c.city}</span> },
            { key: 'bookings', header: 'Bookings', align: 'center', render: (c) => <span className="font-bold text-ink-800">{c.bookings}</span> },
            { key: 'spend', header: 'Lifetime spend', align: 'right', render: (c) => <span className="text-[12.5px] font-bold text-ink-900">{inr(c.spend)}</span> },
            { key: 'tier', header: 'Tier', render: (c) => <Badge tone={tierTone[c.tier]} size="sm">{c.tier}</Badge> },
            { key: 'joined', header: 'Joined', render: (c) => <span className="text-[11px] text-ink-500">{c.joined}</span> },
            { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} size="sm" /> },
            { key: 'actions', header: '', align: 'right', render: (c) => (
              <div onClick={(e) => e.stopPropagation()}>
                <Dropdown trigger={<button className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"><MoreHorizontal className="h-4 w-4" /></button>}>
                  {(close) => (
                    <div>
                      <DropdownItem icon={<ChevronRight className="h-4 w-4" />} onClick={() => { close(); setActive(c); }}>View profile</DropdownItem>
                      <DropdownItem icon={<Mail className="h-4 w-4" />} onClick={() => { close(); toast.success('Email drafted', `Demo message prepared for ${c.name}.`); }}>Send email</DropdownItem>
                      <DropdownItem icon={<ShieldCheck className="h-4 w-4" />} onClick={() => { close(); toast.info('Account verified', 'Identity verification is simulated in this demo.'); }}>Verify identity</DropdownItem>
                      <div className="my-1 h-px bg-ink-100" />
                      <DropdownItem danger icon={<Ban className="h-4 w-4" />} onClick={() => { close(); setActive(c); setBlockOpen(true); }}>{c.status === 'active' ? 'Restrict account' : 'Reactivate'}</DropdownItem>
                    </div>
                  )}
                </Dropdown>
              </div>
            ) },
          ]}
        />
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Top customers" description="By lifetime spend" bodyClassName="space-y-2.5">
          {[...customers].sort((a, b) => b.spend - a.spend).slice(0, 5).map((c, i) => (
            <div key={c.id} className="flex items-center gap-2.5">
              <span className="w-4 text-[10px] font-bold text-ink-300">{i + 1}</span>
              <Avatar name={c.name} size="sm" tone={c.tone} />
              <div className="min-w-0 flex-1"><p className="truncate text-[11.5px] font-semibold text-ink-800">{c.name}</p><p className="text-[9.5px] text-ink-400">{c.bookings} bookings · {c.city}</p></div>
              <span className="text-[11.5px] font-bold text-ink-900">{inr(c.spend)}</span>
            </div>
          ))}
        </SectionCard>
        <SectionCard title="Customer health" description="Account and trust signals" bodyClassName="space-y-2.5">
          {[['Verified email', 94, 'success'], ['Verified phone', 88, 'brand'], ['Payment method on file', 76, 'violet'], ['Reviewed at least once', 64, 'warning']].map(([label, value, tone]) => (
            <div key={String(label)}>
              <div className="flex justify-between text-[11px]"><span className="text-ink-500">{label}</span><span className="font-bold text-ink-800">{value}%</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100"><div className={cn('h-full rounded-full', tone === 'success' ? 'bg-emerald-500' : tone === 'brand' ? 'bg-brand-500' : tone === 'violet' ? 'bg-violet-500' : 'bg-amber-500')} style={{ width: `${value}%` }} /></div>
            </div>
          ))}
        </SectionCard>
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.name}
        description={active ? `${active.email} · joined ${active.joined}` : undefined}
        footer={<><Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button><Button variant="outline" size="sm" iconLeft={<Mail className="h-3.5 w-3.5" />} onClick={() => toast.success('Email sent', 'Demo message delivered.')}>Email</Button><Button variant={active?.status === 'active' ? 'danger' : 'success'} size="sm" onClick={() => active?.status === 'active' ? setBlockOpen(true) : (setOverrides((o) => ({ ...o, [active!.id]: 'active' })), toast.success('Account reactivated', `${active?.name} can book again.`))}>{active?.status === 'active' ? 'Restrict' : 'Reactivate'}</Button></>}
      >
        {active && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-4">
              <Avatar name={active.name} size="xl" tone={active.tone} />
              <div><p className="text-[15px] font-bold text-ink-900">{active.name}</p><p className="text-[11px] text-ink-500">{active.email}</p><p className="text-[11px] text-ink-500">{active.phone}</p><div className="mt-1.5 flex gap-1.5"><Badge tone={tierTone[active.tier]} size="sm">{active.tier}</Badge><StatusBadge status={active.status} size="sm" /></div></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[['Bookings', active.bookings], ['Lifetime spend', inr(active.spend)], ['Avg. order', inr(Math.round(active.spend / Math.max(1, active.bookings)))]].map(([l, v]) => (
                <div key={String(l)} className="rounded-xl border border-ink-200 p-3 text-center"><p className="text-[14px] font-extrabold text-ink-900">{v}</p><p className="mt-0.5 text-[9px] text-ink-400">{l}</p></div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-[12px] font-bold text-ink-900">Recent activity</p>
              <div className="space-y-2">
                {[['Booking completed', 'Deep Home Cleaning · SRV-24081', '12 days ago'], ['Review submitted', '5 stars for SparkleHome', '11 days ago'], ['Payment method added', 'Visa •••• 4242', '3 weeks ago'], ['Account created', `Joined ${active.joined}`, '']].map(([title, sub, time]) => (
                  <div key={String(title)} className="flex items-start gap-2.5 rounded-lg border border-ink-100 p-2.5">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-ink-800">{title}</p><p className="text-[10px] text-ink-400">{sub}</p></div>
                    {time && <span className="text-[9px] text-ink-400">{time}</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-ink-200 p-3">
              <p className="text-[11px] font-bold text-ink-800">Internal note</p>
              <Textarea placeholder="Add a note visible only to admins…" className="mt-2 min-h-[70px]" />
              <Button size="sm" variant="outline" className="mt-2" onClick={() => toast.success('Note saved', 'Internal note added to this customer.')}>Save note</Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        title={active?.status === 'active' ? 'Restrict this account?' : 'Moderate account'}
        description="Restricted customers cannot make new bookings or leave reviews."
        size="sm"
        footer={<><Button variant="outline" size="sm" onClick={() => setBlockOpen(false)}>Cancel</Button><Button variant="danger" size="sm" onClick={() => { if (active) { setOverrides((o) => ({ ...o, [active.id]: o[active.id] === 'active' ? 'suspended' : 'active' })); toast.success('Account updated', `${active.name} has been restricted.`); } setBlockOpen(false); setActive(null); }}>Confirm restriction</Button></>}
      >
        <div className="space-y-3">
          <Select label="Reason"><option>Chargeback / payment fraud</option><option>Abusive behaviour</option><option>Fake reviews</option><option>Repeated policy violations</option><option>Other</option></Select>
          <Textarea label="Note to record" placeholder="Describe the evidence and context…" />
          <p className="rounded-lg bg-amber-50 p-2.5 text-[10.5px] text-amber-800">The customer will be notified by email and can appeal within 14 days.</p>
        </div>
      </Modal>
    </div>
  );
}
