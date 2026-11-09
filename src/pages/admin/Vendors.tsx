import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Ban,
  Building2,
  ChevronRight,
  MapPin,
  MoreHorizontal,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { VENDORS, getCategory } from '@/lib/data';
import { cn, inr } from '@/lib/utils';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, buttonStyles, Card, EmptyState, Input, Select, Skeleton, Tabs, Textarea } from '@/components/ui/primitives';
import { DataTable, ExportButton, PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { Drawer, Dropdown, DropdownItem, Modal } from '@/components/ui/overlays';
import { SmartImage } from '@/components/marketplace';
import type { Vendor } from '@/lib/types';

export default function AdminVendors() {
  const loading = useMockLoad(360);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('all');
  const [category, setCategory] = useState('all');
  const [active, setActive] = useState<Vendor | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Vendor['status']>>({});
  const [commission, setCommission] = useState('');

  const vendors = VENDORS.map((v) => ({ ...v, status: overrides[v.id] ?? v.status }));
  const rows = vendors.filter((v) => {
    if (tab !== 'all' && v.status !== tab) return false;
    if (city !== 'all' && v.city !== city) return false;
    if (category !== 'all' && v.categoryId !== category) return false;
    if (query && !`${v.name} ${v.owner} ${v.email}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Vendors"
        description="Approve, monitor and manage every business on the marketplace."
        actions={<ExportButton filename="vendors.csv" rows={vendors} columns={[{ key: 'name', label: 'Business' }, { key: 'owner', label: 'Owner' }, { key: 'city', label: 'City' }, { key: 'rating', label: 'Rating' }, { key: 'jobsDone', label: 'Jobs' }, { key: 'commission', label: 'Commission' }, { key: 'status', label: 'Status' }]} />}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active vendors', value: vendors.filter((v) => v.status === 'approved').length, hint: `${vendors.filter((v) => v.featured).length} featured`, icon: Store, tone: 'bg-brand-50 text-brand-600' },
          { label: 'Average rating', value: (vendors.reduce((a, v) => a + v.rating, 0) / vendors.length).toFixed(2), hint: 'across marketplace', icon: Star, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Jobs delivered', value: vendors.reduce((a, v) => a + v.jobsDone, 0).toLocaleString('en-IN'), hint: 'lifetime', icon: TrendingUp, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Avg. commission', value: `${Math.round(vendors.reduce((a, v) => a + v.commission, 0) / vendors.length)}%`, hint: 'take rate', icon: Wallet, tone: 'bg-violet-50 text-violet-600' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', s.tone)}><s.icon className="h-5 w-5" /></span>
            <div><p className="font-display text-[20px] font-extrabold leading-none text-ink-900">{s.value}</p><p className="mt-1 text-[10.5px] text-ink-500">{s.label}</p><p className="text-[9.5px] text-ink-400">{s.hint}</p></div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          <Tabs value={tab} onChange={setTab} items={[{ key: 'all', label: 'All', count: vendors.length }, { key: 'approved', label: 'Approved', count: vendors.filter((v) => v.status === 'approved').length }, { key: 'pending', label: 'Pending', count: vendors.filter((v) => v.status === 'pending').length }, { key: 'suspended', label: 'Suspended' }]} />
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[190px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search business, owner…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" />
            </div>
            <Select value={city} onChange={(e) => setCity(e.target.value)} className="h-9 w-[140px] text-[11.5px]"><option value="all">All cities</option>{[...new Set(VENDORS.map((v) => v.city))].map((c) => <option key={c}>{c}</option>)}</Select>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-[160px] text-[11.5px]"><option value="all">All categories</option>{[...new Set(VENDORS.map((v) => v.categoryId))].map((id) => <option key={id} value={id}>{getCategory(id)?.name}</option>)}</Select>
          </div>
        </div>

        <DataTable
          rows={rows}
          rowKey={(v) => v.id}
          onRowClick={setActive}
          empty={<EmptyState compact icon={<Store className="h-5 w-5" />} title="No vendors match these filters" description="Try another city or category." />}
          columns={[
            { key: 'name', header: 'Business', render: (v) => <div className="flex items-center gap-2.5"><div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg"><SmartImage src={v.cover} alt={v.name} className="h-full w-full object-cover" /></div><div className="min-w-0"><p className="flex items-center gap-1 truncate text-[12.5px] font-bold text-ink-900">{v.name}{v.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand-500" />}</p><p className="text-[10px] text-ink-400">{v.owner} · {getCategory(v.categoryId)?.name}</p></div></div> },
            { key: 'location', header: 'Location', render: (v) => <div><p className="text-[11.5px] text-ink-700">{v.area}</p><p className="text-[10px] text-ink-400">{v.city}</p></div> },
            { key: 'rating', header: 'Rating', align: 'center', render: (v) => <div className="text-center"><p className="flex items-center justify-center gap-0.5 text-[11.5px] font-bold text-ink-800"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {v.rating.toFixed(1)}</p><p className="text-[9.5px] text-ink-400">{v.reviewCount} reviews</p></div> },
            { key: 'jobs', header: 'Jobs', align: 'center', render: (v) => <span className="text-[11.5px] font-semibold text-ink-700">{v.jobsDone.toLocaleString('en-IN')}</span> },
            { key: 'commission', header: 'Commission', align: 'center', render: (v) => <Badge tone="violet" size="sm">{v.commission}%</Badge> },
            { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v.status} size="sm" /> },
            { key: 'actions', header: '', align: 'right', render: (v) => (
              <div onClick={(e) => e.stopPropagation()}>
                <Dropdown trigger={<button className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"><MoreHorizontal className="h-4 w-4" /></button>}>
                  {(close) => (
                    <div>
                      <DropdownItem icon={<ChevronRight className="h-4 w-4" />} onClick={() => { close(); setActive(v); }}>Open vendor</DropdownItem>
                      <DropdownItem icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => { close(); setActive(v); setCommission(String(v.commission)); }}>Edit commission</DropdownItem>
                      <DropdownItem icon={<ShieldCheck className="h-4 w-4" />} onClick={() => { close(); setOverrides((o) => ({ ...o, [v.id]: 'approved' })); toast.success('Vendor approved', `${v.name} is now live.`); }}>Approve vendor</DropdownItem>
                      <div className="my-1 h-px bg-ink-100" />
                      <DropdownItem danger icon={<Ban className="h-4 w-4" />} onClick={() => { close(); setActive(v); setSuspendOpen(true); }}>Suspend vendor</DropdownItem>
                    </div>
                  )}
                </Dropdown>
              </div>
            ) },
          ]}
        />
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Newest vendors" description="Recently approved" noPadding bodyClassName="divide-y divide-ink-100">
          {vendors.slice(0, 4).map((v) => (
            <div key={v.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar name={v.name} size="sm" tone="teal" />
              <div className="min-w-0 flex-1"><p className="truncate text-[11.5px] font-bold text-ink-800">{v.name}</p><p className="text-[10px] text-ink-400">{v.area}, {v.city} · since {v.since}</p></div>
              <Badge tone="success" size="sm">Approved</Badge>
            </div>
          ))}
        </SectionCard>
        <SectionCard title="Commission bands" description="Distribution across vendors" bodyClassName="space-y-3">
          {[['8–10%', 4, 'brand'], ['10–12%', 6, 'success'], ['12–15%', 3, 'warning'], ['15%+', 1, 'violet']].map(([band, count, tone]) => (
            <div key={String(band)} className="flex items-center gap-3">
              <span className="w-16 text-[11px] font-semibold text-ink-600">{band}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100"><div className={cn('h-full rounded-full', tone === 'brand' ? 'bg-brand-500' : tone === 'success' ? 'bg-emerald-500' : tone === 'warning' ? 'bg-amber-500' : 'bg-violet-500')} style={{ width: `${(Number(count) / vendors.length) * 100}%` }} /></div>
              <span className="w-6 text-right text-[10px] font-bold text-ink-700">{count as number}</span>
            </div>
          ))}
        </SectionCard>
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.name}
        description={active ? `${active.owner} · ${active.email}` : undefined}
        footer={<><Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button><Link to={active ? `/vendors/${active.slug}` : '/'} className={buttonStyles({ variant: 'outline', size: 'sm' })}>Public page</Link><Button variant="danger" size="sm" onClick={() => setSuspendOpen(true)}>Suspend</Button><Button size="sm" onClick={() => { setOverrides((o) => ({ ...o, [active!.id]: 'approved' })); toast.success('Vendor saved', 'Changes applied to the vendor account.'); }}>Approve & save</Button></>}
      >
        {active && (
          <div className="space-y-5">
            <div className="relative h-28 overflow-hidden rounded-xl"><SmartImage src={active.cover} alt={active.name} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" /><div className="absolute bottom-3 left-3 text-white"><p className="text-[14px] font-bold">{active.name}</p><p className="text-[10px] text-white/80">{active.area}, {active.city}</p></div></div>
            <div className="grid grid-cols-4 gap-2">
              {[['Rating', active.rating.toFixed(1)], ['Jobs', active.jobsDone], ['Reviews', active.reviewCount], ['Since', active.since]].map(([l, v]) => (
                <div key={String(l)} className="rounded-xl border border-ink-200 p-2.5 text-center"><p className="text-[13px] font-extrabold text-ink-900">{v}</p><p className="text-[8.5px] text-ink-400">{l}</p></div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-xl border border-ink-200 p-3">
              <div><p className="text-[11.5px] font-bold text-ink-800">Verification</p><p className="text-[10px] text-ink-400">KYB complete · police verified</p></div>
              <Badge tone={active.verified ? 'success' : 'warning'} size="sm">{active.verified ? 'Verified' : 'Pending'}</Badge>
            </div>
            <div className="grid gap-3">
              <div><p className="field-label">Commission rate</p><div className="flex gap-2"><Input type="number" value={commission || active.commission} onChange={(e) => setCommission(e.target.value)} suffix={<span className="text-xs">%</span>} /><Button variant="outline" size="sm" onClick={() => { toast.success('Commission updated', `New rate: ${commission || active.commission}%`); }}>Apply</Button></div></div>
              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                <div className="rounded-lg bg-ink-50 p-2.5"><p className="text-ink-400">Wallet balance</p><p className="mt-0.5 font-bold text-ink-900">{inr(18420)}</p></div>
                <div className="rounded-lg bg-ink-50 p-2.5"><p className="text-ink-400">Lifetime GMV</p><p className="mt-0.5 font-bold text-ink-900">{inr(active.jobsDone * 420, true)}</p></div>
              </div>
              <div><p className="field-label">Internal notes</p><Textarea placeholder="Record any account-specific context…" className="min-h-[70px]" /></div>
            </div>
            <div className="rounded-xl border border-ink-200 p-3">
              <p className="text-[11px] font-bold text-ink-800">Compliance documents</p>
              {[['GST certificate', 'verified'], ['PAN card', 'verified'], ['Trade licence', 'expiring Dec 2026'], ['Insurance', 'verified']].map(([doc, state]) => (
                <div key={doc} className="mt-1.5 flex items-center justify-between text-[10.5px]"><span className="text-ink-500">{doc}</span><Badge tone={state === 'verified' ? 'success' : 'warning'} size="sm">{state}</Badge></div>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        title="Suspend vendor account"
        description="Their listings will be hidden and new bookings blocked immediately."
        size="sm"
        footer={<><Button variant="outline" size="sm" onClick={() => setSuspendOpen(false)}>Cancel</Button><Button variant="danger" size="sm" onClick={() => { if (active) { setOverrides((o) => ({ ...o, [active.id]: 'suspended' })); toast.success('Vendor suspended', `${active.name} has been hidden from the marketplace.`); } setSuspendOpen(false); setActive(null); }}>Suspend vendor</Button></>}
      >
        <div className="space-y-3">
          <Select label="Reason"><option>Quality complaints</option><option>Policy violation</option><option>Fraud / chargeback</option><option>Licence expired</option><option>Other</option></Select>
          <Textarea label="Note" placeholder="Explain the suspension for the audit log…" />
          <p className="rounded-lg bg-rose-50 p-2.5 text-[10.5px] text-rose-800">Existing bookings are not cancelled automatically. The vendor will be notified by email.</p>
        </div>
      </Modal>
    </div>
  );
}
