import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { getCategory, getService, getVendorServices } from '@/lib/data';
import { cn, inr, minsToLabel } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Badge, Button, buttonStyles, Card, EmptyState, Progress, Select, Skeleton, Switch, Tabs } from '@/components/ui/primitives';
import { DataTable, PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { ConfirmDialog, Dropdown, DropdownItem } from '@/components/ui/overlays';
import { SmartImage } from '@/components/marketplace';
import type { Service } from '@/lib/types';

export default function VendorServices() {
  const { user } = useAuth();
  const loading = useMockLoad(360);
  const vendorId = user?.vendorId ?? 'v1';
  const base = getVendorServices(vendorId);
  const statusMap = useApp((s) => s.vendorServiceStatus);
  const setStatus = useApp((s) => s.setVendorServiceStatus);

  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const services = useMemo(
    () => base.map((s) => ({ ...s, status: statusMap[s.id] ?? s.status })),
    [base, statusMap],
  );

  const rows = services.filter((s) => {
    if (tab !== 'all' && s.status !== tab) return false;
    if (category !== 'all' && s.categoryId !== category) return false;
    if (query && !`${s.name} ${s.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: services.length,
    published: services.filter((s) => s.status === 'published').length,
    draft: services.filter((s) => s.status === 'draft').length,
    pending: services.filter((s) => s.status === 'pending').length,
  };

  const togglePublish = (s: Service) => {
    const next = s.status === 'published' ? 'draft' : 'published';
    setStatus(s.id, next);
    toast.success(next === 'published' ? 'Service published' : 'Service unpublished', `“${s.name}” is now ${next === 'published' ? 'live on the marketplace' : 'hidden from customers'}.`);
  };

  const duplicate = (s: Service) => {
    toast.success('Service duplicated', `A draft copy of “${s.name}” was created. Edit it to publish.`);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Services"
        description="Manage your catalogue, pricing and availability. Published services appear in marketplace search."
        actions={
          <Link to="/vendor/services/new" className={buttonStyles({ size: 'md' })}>
            <Plus className="h-4 w-4" /> Add service
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Published', value: counts.published, tone: 'success', icon: Eye, hint: 'Live on marketplace' },
          { label: 'Drafts', value: counts.draft, tone: 'neutral', icon: Pencil, hint: 'Not visible to customers' },
          { label: 'Avg. rating', value: base.length ? (base.reduce((a, s) => a + s.rating, 0) / base.length).toFixed(1) : '—', tone: 'violet', icon: Star, hint: `${base.reduce((a, s) => a + s.reviewCount, 0)} reviews` },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', s.tone === 'success' ? 'bg-emerald-50 text-emerald-600' : s.tone === 'violet' ? 'bg-violet-50 text-violet-600' : 'bg-ink-100 text-ink-500')}>
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-[20px] font-extrabold leading-none text-ink-900">{s.value}</p>
              <p className="mt-1 text-[10.5px] text-ink-500">{s.label} · <span className="text-ink-400">{s.hint}</span></p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-center">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'published', label: 'Published', count: counts.published },
              { key: 'draft', label: 'Drafts', count: counts.draft },
              { key: 'pending', label: 'In review', count: counts.pending },
            ]}
          />
          <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
            <div className="relative min-w-[180px] flex-1 lg:max-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" />
            </div>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-[170px] text-[12px]">
              <option value="all">All categories</option>
              {[...new Set(base.map((s) => s.categoryId))].map((id) => <option key={id} value={id}>{getCategory(id)?.name}</option>)}
            </Select>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Wrench className="h-5 w-5" />}
              title={services.length === 0 ? 'No services yet' : 'No services match these filters'}
              description={services.length === 0 ? 'Create your first service to start accepting bookings.' : 'Try a different search term or clear the filters to see all services.'}
              action={services.length === 0 ? <Link to="/vendor/services/new" className={buttonStyles({ size: 'sm' })}><Plus className="h-4 w-4" /> Create service</Link> : <Button variant="outline" size="sm" onClick={() => { setQuery(''); setCategory('all'); setTab('all'); }}>Clear filters</Button>}
            />
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {rows.map((s) => (
              <div key={s.id} className="group flex flex-col gap-3 p-4 transition sm:flex-row sm:items-center sm:px-5">
                <div className="relative h-16 w-full shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-24">
                  <SmartImage src={s.image} alt={s.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-bold text-ink-900">{s.name}</p>
                    <StatusBadge status={s.status} size="sm" />
                    {s.featured && <Badge tone="amber" size="sm">Featured</Badge>}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[10.5px] text-ink-500">{getCategory(s.categoryId)?.name} · {minsToLabel(s.duration)} · {s.serviceAt}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-400">
                    <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600"><Star className="h-3 w-3 fill-amber-400" /> {s.rating.toFixed(1)} ({s.reviewCount})</span>
                    <span className="inline-flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> {s.bookings} bookings</span>
                    <span>{s.addOns.length} add-ons</span>
                    <span>Cancel: {s.cancellation}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                  <p className="text-[15px] font-extrabold text-ink-900">{inr(s.price)}</p>
                  <div className="flex items-center gap-2">
                    <span className="hidden text-[9.5px] text-ink-400 sm:inline">{s.status === 'published' ? 'Live' : 'Offline'}</span>
                    <Switch checked={s.status === 'published'} onChange={() => togglePublish(s)} />
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:ml-2">
                  <Link to={`/vendor/services/${s.id}/edit`} className={buttonStyles({ variant: 'ghost', size: 'icon-sm' })} aria-label="Edit service"><Pencil className="h-3.5 w-3.5" /></Link>
                  <Dropdown
                    trigger={<button className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100"><MoreHorizontal className="h-4 w-4" /></button>}
                  >
                    {(close) => (
                      <div>
                        <DropdownItem icon={<Eye className="h-4 w-4" />} onClick={() => { close(); toast.info('Opening listing', 'Public service page is available in the marketplace demo.'); }}>View public page</DropdownItem>
                        <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={close}>Edit details</DropdownItem>
                        <DropdownItem icon={<Copy className="h-4 w-4" />} onClick={() => { close(); duplicate(s); }}>Duplicate</DropdownItem>
                        <div className="my-1 h-px bg-ink-100" />
                        <DropdownItem danger icon={<Trash2 className="h-4 w-4" />} onClick={() => { close(); setDeleteTarget(s); }}>Delete service</DropdownItem>
                      </div>
                    )}
                  </Dropdown>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50/50 px-5 py-3">
          <p className="text-[11px] text-ink-400">Showing {rows.length} of {services.length} services</p>
          <p className="text-[11px] text-ink-400">Changes are visible to customers instantly.</p>
        </div>
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Service performance" description="Bookings in the last 30 days" bodyClassName="space-y-3.5">
          {base.slice(0, 4).map((s) => (
            <div key={s.id}>
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="truncate font-semibold text-ink-700">{s.name}</span>
                <span className="ml-2 shrink-0 text-ink-500">{s.bookings} bookings</span>
              </div>
              <Progress value={Math.min(100, (s.bookings / 40) * 100)} tone="brand" size="sm" className="mt-1.5" />
            </div>
          ))}
        </SectionCard>
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between border-b border-ink-100 p-5">
            <div>
              <p className="text-[14px] font-bold text-ink-900">Catalogue checklist</p>
              <p className="mt-0.5 text-xs text-ink-500">Complete these to rank higher in search</p>
            </div>
            <Badge tone="warning" size="sm">3 of 5</Badge>
          </div>
          <div className="space-y-2.5 p-5">
            {[
              { label: 'Add photos to every service', done: true },
              { label: 'Set at least 2 add-ons', done: true },
              { label: 'Write a 100+ word description', done: true },
              { label: 'Offer availability today', done: false },
              { label: 'Respond to all reviews', done: false },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-2 text-[11.5px]">
                <span className={cn('flex h-4.5 w-4.5 items-center justify-center rounded-full text-[9px] font-bold', c.done ? 'bg-emerald-100 text-emerald-600' : 'bg-ink-100 text-ink-400')}>{c.done ? '✓' : '•'}</span>
                <span className={c.done ? 'text-ink-500 line-through' : 'text-ink-700'}>{c.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Delete “${deleteTarget?.name}”?`}
        description="This removes the service from your catalogue. Existing bookings are not affected."
        confirmLabel="Delete service"
        loading={deleting}
        onConfirm={() => {
          setDeleting(true);
          window.setTimeout(() => {
            setDeleting(false);
            if (deleteTarget) setStatus(deleteTarget.id, 'draft');
            setDeleteTarget(null);
            toast.success('Service deleted', 'The service has been removed from your catalogue.');
          }, 700);
        }}
      />
    </div>
  );
}
