import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Eye, Grid2x2, MoreHorizontal, Search, Star, TrendingUp, Wrench, X } from 'lucide-react';
import { getCategory, getVendor, SERVICES } from '@/lib/data';
import { inr, minsToLabel } from '@/lib/utils';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Badge, Button, Card, EmptyState, Select, Skeleton, Tabs } from '@/components/ui/primitives';
import { DataTable, ExportButton, PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { Dropdown, DropdownItem, Modal } from '@/components/ui/overlays';

export default function AdminServices() {
  const loading = useMockLoad(340);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [reject, setReject] = useState<string | null>(null);

  const services = SERVICES.map((s) => ({ ...s, status: (statuses[s.id] ?? s.status) as typeof s.status }));
  const rows = services.filter((s) => {
    if (tab !== 'all' && s.status !== tab) return false;
    if (category !== 'all' && s.categoryId !== category) return false;
    if (query && !`${s.name} ${getVendor(s.vendorId)?.name}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

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
        title="Services catalogue"
        description="Moderate every listing on the marketplace, feature high-performers and remove policy violations."
        actions={<ExportButton filename="services.csv" rows={services} columns={[{ key: 'name', label: 'Service' }, { key: 'vendorId', label: 'Vendor' }, { key: 'price', label: 'Price' }, { key: 'bookings', label: 'Bookings' }, { key: 'status', label: 'Status' }]} />}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Live services', value: services.filter((s) => s.status === 'published').length, hint: `${SERVICES.length} total`, icon: Grid2x2, tone: 'bg-brand-50 text-brand-600' },
          { label: 'Pending review', value: services.filter((s) => s.status === 'pending').length, hint: 'needs moderation', icon: Eye, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Featured', value: services.filter((s) => s.featured).length, hint: 'boosted listings', icon: Star, tone: 'bg-violet-50 text-violet-600' },
          { label: 'Avg. price', value: inr(Math.round(services.reduce((a, s) => a + s.price, 0) / services.length)), hint: 'across catalogue', icon: TrendingUp, tone: 'bg-emerald-50 text-emerald-600' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tone}`}><s.icon className="h-5 w-5" /></span>
            <div><p className="font-display text-[20px] font-extrabold leading-none text-ink-900">{s.value}</p><p className="mt-1 text-[10.5px] text-ink-500">{s.label}</p><p className="text-[9.5px] text-ink-400">{s.hint}</p></div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          <Tabs value={tab} onChange={setTab} items={[{ key: 'all', label: 'All', count: services.length }, { key: 'published', label: 'Published', count: services.filter((s) => s.status === 'published').length }, { key: 'pending', label: 'Pending', count: services.filter((s) => s.status === 'pending').length }, { key: 'draft', label: 'Draft' }]} />
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search service or vendor…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" />
            </div>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-[170px] text-[11.5px]"><option value="all">All categories</option>{[...new Set(SERVICES.map((s) => s.categoryId))].map((id) => <option key={id} value={id}>{getCategory(id)?.name}</option>)}</Select>
          </div>
        </div>

        <DataTable
          rows={rows}
          rowKey={(s) => s.id}
          empty={<EmptyState compact icon={<Wrench className="h-5 w-5" />} title="No services match" description="Try a different filter or search term." />}
          columns={[
            { key: 'name', header: 'Service', render: (s) => <div><p className="text-[12.5px] font-bold text-ink-900">{s.name}</p><p className="text-[10px] text-ink-400">{getCategory(s.categoryId)?.name} · {minsToLabel(s.duration)}</p></div> },
            { key: 'vendor', header: 'Vendor', render: (s) => <Link to="/admin/vendors" className="text-[11.5px] font-semibold text-brand-700 hover:underline">{getVendor(s.vendorId)?.name}</Link> },
            { key: 'price', header: 'Price', align: 'right', render: (s) => <span className="font-bold text-ink-900">{inr(s.price)}</span> },
            { key: 'bookings', header: 'Bookings', align: 'center', render: (s) => <span className="text-[11.5px] text-ink-600">{s.bookings}</span> },
            { key: 'rating', header: 'Rating', align: 'center', render: (s) => <span className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-ink-700"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{s.rating.toFixed(1)}</span> },
            { key: 'status', header: 'Status', render: (s) => <div className="flex items-center gap-1.5"><StatusBadge status={s.status} size="sm" />{s.featured && <Badge tone="amber" size="sm">Featured</Badge>}</div> },
            { key: 'actions', header: '', align: 'right', render: (s) => (
              <Dropdown trigger={<button className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"><MoreHorizontal className="h-4 w-4" /></button>}>
                {(close) => (
                  <div>
                    <DropdownItem icon={<Eye className="h-4 w-4" />} onClick={() => { close(); toast.info('Listing preview', 'Public service pages are part of the storefront demo.'); }}>View listing</DropdownItem>
                    <DropdownItem icon={<Check className="h-4 w-4" />} onClick={() => { close(); setStatuses((m) => ({ ...m, [s.id]: 'published' })); toast.success('Service approved', `${s.name} is now live.`); }}>Approve & publish</DropdownItem>
                    <DropdownItem icon={<Star className="h-4 w-4" />} onClick={() => { close(); toast.success('Featured toggled', `${s.name} featured status updated.`); }}>Toggle featured</DropdownItem>
                    <div className="my-1 h-px bg-ink-100" />
                    <DropdownItem danger icon={<X className="h-4 w-4" />} onClick={() => { close(); setReject(s.id); }}>Unpublish / reject</DropdownItem>
                  </div>
                )}
              </Dropdown>
            ) },
          ]}
        />
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Category performance" description="Top categories by bookings" bodyClassName="space-y-3">
          {['c1', 'c4', 'c5', 'c2'].map((id) => {
            const list = SERVICES.filter((s) => s.categoryId === id);
            const bookings = list.reduce((a, s) => a + s.bookings, 0);
            return (
              <div key={id}>
                <div className="flex justify-between text-[11px]"><span className="text-ink-500">{getCategory(id)?.name}</span><span className="font-bold text-ink-800">{bookings}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, (bookings / 200) * 100)}%` }} /></div>
              </div>
            );
          })}
        </SectionCard>
        <SectionCard title="Moderation queue" description="Listings needing attention" bodyClassName="space-y-2">
          {SERVICES.slice(0, 4).map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-lg border border-ink-100 p-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Eye className="h-3.5 w-3.5" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-ink-800">{s.name}</p><p className="text-[9.5px] text-ink-400">{getVendor(s.vendorId)?.name}</p></div>
              <Button size="xs" variant="outline" onClick={() => setReject(s.id)}>Review</Button>
            </div>
          ))}
        </SectionCard>
        <SectionCard title="Catalogue health" description="Quality signals" bodyClassName="space-y-3">
          {[['Listings with 5+ photos', 72, 'success'], ['Descriptions over 150 words', 58, 'brand'], ['Add-ons configured', 46, 'violet'], ['Instant-book enabled', 81, 'warning']].map(([label, value, tone]) => (
            <div key={String(label)}>
              <div className="flex justify-between text-[11px]"><span className="text-ink-500">{label}</span><span className="font-bold text-ink-800">{value}%</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100"><div className={`h-full rounded-full ${tone === 'success' ? 'bg-emerald-500' : tone === 'brand' ? 'bg-brand-500' : tone === 'violet' ? 'bg-violet-500' : 'bg-amber-500'}`} style={{ width: `${value}%` }} /></div>
            </div>
          ))}
        </SectionCard>
      </div>

      <Modal
        open={!!reject}
        onClose={() => setReject(null)}
        title="Unpublish this service?"
        description="The listing will be hidden and the vendor notified with your reason."
        size="sm"
        footer={<><Button variant="outline" size="sm" onClick={() => setReject(null)}>Cancel</Button><Button variant="danger" size="sm" onClick={() => { setStatuses((m) => ({ ...m, [reject!]: 'draft' })); toast.success('Service unpublished', 'The vendor has been notified.'); setReject(null); }}>Unpublish service</Button></>}
      >
        <select className="h-11 w-full rounded-xl border border-ink-200 px-3 text-sm"><option>Misleading description</option><option>Prohibited service</option><option>Pricing violation</option><option>Poor quality photos</option></select>
      </Modal>
    </div>
  );
}
