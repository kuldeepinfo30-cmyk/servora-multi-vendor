import { useState } from 'react';
import { GripVertical, Layers, Pencil, Plus, Search, Sparkles, Store, Wrench } from 'lucide-react';
import { CATEGORIES, getCategoryServices, VENDORS } from '@/lib/data';

const getCategoryVendors = (categoryId: string) => VENDORS.filter((v) => v.categoryId === categoryId);
import { inr } from '@/lib/utils';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Badge, Button, Card, Input, Skeleton, Switch } from '@/components/ui/primitives';
import { PageHeader, SectionCard } from '@/components/ui/data-display';
import { Modal } from '@/components/ui/overlays';
import { CategoryIcon, SmartImage } from '@/components/marketplace';
import type { Category } from '@/lib/types';

export default function AdminCategories() {
  const loading = useMockLoad(320);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Category | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [featured, setFeatured] = useState<string[]>(CATEGORIES.slice(0, 6).map((c) => c.id));

  const rows = CATEGORIES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Structure the marketplace. Categories drive search, SEO landing pages and homepage placement."
        actions={<Button size="md" iconLeft={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add category</Button>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Categories', value: CATEGORIES.length, hint: 'live', icon: Layers, tone: 'bg-brand-50 text-brand-600' },
          { label: 'Total vendors', value: CATEGORIES.reduce((a, c) => a + getCategoryVendors(c.id).length, 0), hint: 'mapped', icon: Store, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Total services', value: CATEGORIES.reduce((a, c) => a + getCategoryServices(c.id).length, 0), hint: 'listed', icon: Wrench, tone: 'bg-violet-50 text-violet-600' },
          { label: 'Featured on home', value: featured.length, hint: 'max 8 recommended', icon: Sparkles, tone: 'bg-amber-50 text-amber-600' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tone}`}><s.icon className="h-5 w-5" /></span><div><p className="font-display text-[20px] font-extrabold leading-none text-ink-900">{s.value}</p><p className="mt-1 text-[10.5px] text-ink-500">{s.label}</p><p className="text-[9.5px] text-ink-400">{s.hint}</p></div></Card>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search categories…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" />
        </div>
        <p className="hidden text-[10.5px] text-ink-400 sm:block">Drag to reorder homepage placement</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((c) => {
          const services = getCategoryServices(c.id).length;
          const vendors = getCategoryVendors(c.id).length;
          const on = featured.includes(c.id);
          return (
            <Card key={c.id} className="overflow-hidden">
              <div className="relative h-24">
                <SmartImage src={c.image} alt={c.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-ink-950/10" />
                <div className="absolute bottom-2.5 left-3 flex items-center gap-2 text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><CategoryIcon name={c.icon} className="h-4 w-4" /></span>
                  <p className="text-[12.5px] font-bold">{c.name}</p>
                </div>
                <Badge tone={on ? 'amber' : 'neutral'} size="sm" variant="solid" className="absolute right-2 top-2">{on ? 'Featured' : 'Hidden'}</Badge>
              </div>
              <div className="p-3.5">
                <p className="line-clamp-2 text-[10.5px] leading-4 text-ink-500">{c.short}</p>
                <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
                  {[['Vendors', vendors], ['Services', services], ['From', inr(c.from)]].map(([l, v]) => (
                    <div key={String(l)} className="rounded-lg bg-ink-50 py-1.5"><p className="text-[11.5px] font-bold text-ink-800">{v}</p><p className="text-[8.5px] text-ink-400">{l}</p></div>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-ink-100 pt-2.5">
                  <div className="flex items-center gap-2"><Switch checked={on} onChange={(v) => { setFeatured((f) => v ? [...f, c.id] : f.filter((x) => x !== c.id)); toast.success(v ? 'Featured on homepage' : 'Removed from homepage', `${c.name} placement updated.`); }} /><span className="text-[9.5px] text-ink-400">Homepage</span></div>
                  <button onClick={() => setActive(c)} className="inline-flex items-center gap-1 text-[10.5px] font-bold text-brand-700"><Pencil className="h-3 w-3" /> Edit</button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Category order" description="Displayed on the homepage and search filters" bodyClassName="space-y-1.5">
          {CATEGORIES.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2 rounded-lg border border-ink-100 px-2.5 py-2">
              <GripVertical className="h-3.5 w-3.5 text-ink-300" />
              <span className="w-4 text-[10px] font-bold text-ink-300">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-ink-700">{c.name}</span>
              <span className="text-[9.5px] text-ink-400">{getCategoryServices(c.id).length} services</span>
            </div>
          ))}
        </SectionCard>
        <SectionCard title="SEO landing pages" description="Auto-generated pages per category and city" action={<Badge tone="success" size="sm">Healthy</Badge>}>
          <div className="space-y-2">
            {CATEGORIES.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2">
                <div><p className="text-[11px] font-semibold text-ink-700">/services/{c.slug}</p><p className="text-[9.5px] text-ink-400">Indexed · {getCategoryServices(c.id).length + 12} city variants</p></div>
                <Badge tone="success" size="sm">Live</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? `Edit ${active.name}` : ''}
        description="Changes apply across search, category pages and the homepage."
        footer={<><Button variant="outline" size="sm" onClick={() => setActive(null)}>Cancel</Button><Button size="sm" onClick={() => { setActive(null); toast.success('Category updated', 'Changes are live.'); }}>Save changes</Button></>}
      >
        {active && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Category name" defaultValue={active.name} containerClassName="sm:col-span-2" />
            <Input label="Slug" defaultValue={active.slug} />
            <Input label="Starting price" defaultValue={active.from} suffix={<span className="text-xs">₹</span>} />
            <div className="sm:col-span-2"><Input label="Short description" defaultValue={active.short} /></div>
            <div className="sm:col-span-2"><p className="field-label">Subcategories</p><div className="flex flex-wrap gap-1.5">{active.subcategories.map((s) => <Badge key={s} tone="neutral" size="sm">{s}</Badge>)}<button className="rounded-full border border-dashed border-ink-300 px-2 py-0.5 text-[10.5px] font-semibold text-ink-500">+ Add</button></div></div>
          </div>
        )}
      </Modal>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add category"
        description="Create a new top-level category for the marketplace."
        icon={<Layers className="h-5 w-5" />}
        footer={<><Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button><Button size="sm" onClick={() => { setAddOpen(false); toast.success('Category created', 'Publish it when you are ready.'); }}>Create category</Button></>}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Name" placeholder="e.g. Home Security" containerClassName="sm:col-span-2" />
          <Input label="Slug" placeholder="home-security" />
          <Input label="Starting price" placeholder="499" suffix={<span className="text-xs">₹</span>} />
          <div className="sm:col-span-2"><Input label="Short description" placeholder="One line for the category card…" /></div>
        </div>
      </Modal>
    </div>
  );
}
