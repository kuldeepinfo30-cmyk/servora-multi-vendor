import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Search, Sparkles, Star, Store, Trash2 } from 'lucide-react';
import { getVendor, SERVICES, VENDORS } from '@/lib/data';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Button, buttonStyles, EmptyState, Skeleton, Tabs } from '@/components/ui/primitives';
import { PageHeader, SectionCard } from '@/components/ui/data-display';
import { ServiceCard, VendorCard } from '@/components/marketplace';

export default function CustomerFavorites() {
  const loading = useMockLoad(360);
  const serviceFavorites = useApp((s) => s.serviceFavorites);
  const vendorFavorites = useApp((s) => s.vendorFavorites);
  const toggleServiceFavorite = useApp((s) => s.toggleServiceFavorite);
  const toggleVendorFavorite = useApp((s) => s.toggleVendorFavorite);

  const [tab, setTab] = useState<'services' | 'vendors'>('services');
  const [query, setQuery] = useState('');

  const services = useMemo(
    () => SERVICES.filter((s) => serviceFavorites.includes(s.id)).filter((s) => s.name.toLowerCase().includes(query.toLowerCase())),
    [serviceFavorites, query],
  );
  const vendors = useMemo(
    () => VENDORS.filter((v) => vendorFavorites.includes(v.id)).filter((v) => v.name.toLowerCase().includes(query.toLowerCase())),
    [vendorFavorites, query],
  );

  const active = tab === 'services' ? services : vendors;

  return (
    <div>
      <PageHeader
        title="Saved items"
        description="Your shortlist of services and businesses. Saved items sync across devices."
        actions={
          <Link to="/services" className={buttonStyles({ size: 'md' })}>
            <Sparkles className="h-4 w-4" /> Discover more
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={tab}
          onChange={(k) => setTab(k as typeof tab)}
          items={[
            { key: 'services', label: 'Services', count: serviceFavorites.length },
            { key: 'vendors', label: 'Vendors', count: vendorFavorites.length },
          ]}
        />
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search saved ${tab}`} className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-10 pr-3 text-[12.5px] focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[330px]" />)}
        </div>
      ) : active.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-5 w-5" />}
          title={query ? 'No saved items match that search' : tab === 'services' ? 'No saved services yet' : 'No saved vendors yet'}
          description={query ? 'Try a different keyword.' : 'Tap the heart on any service or vendor to keep it handy here.'}
          action={
            query ? (
              <Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear search</Button>
            ) : (
              <Link to={tab === 'services' ? '/services' : '/vendors'} className={buttonStyles({ size: 'sm' })}>
                Browse {tab} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tab === 'services'
            ? services.map((s) => (
                <div key={s.id} className="relative">
                  <ServiceCard service={s} vendor={getVendor(s.vendorId)} />
                  <button
                    onClick={() => { toggleServiceFavorite(s.id); toast.info('Removed from saved', `${s.name} was removed from your list.`); }}
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-rose-500 shadow-soft ring-1 ring-ink-100 transition hover:bg-rose-50"
                    aria-label={`Remove ${s.name} from saved`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            : vendors.map((v) => (
                <div key={v.id} className="relative">
                  <VendorCard vendor={v} />
                  <button
                    onClick={() => { toggleVendorFavorite(v.id); toast.info('Removed from saved', `${v.name} was removed from your list.`); }}
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-rose-500 shadow-soft ring-1 ring-ink-100 transition hover:bg-rose-50"
                    aria-label={`Remove ${v.name} from saved`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <SectionCard className="p-4">
          <div className="flex items-center gap-2 text-brand-600"><Heart className="h-4 w-4" /><p className="text-[12px] font-bold text-ink-900">Save time</p></div>
          <p className="mt-1 text-[10.5px] leading-5 text-ink-500">Rebook your favourites in two taps — no searching again.</p>
        </SectionCard>
        <SectionCard className="p-4">
          <div className="flex items-center gap-2 text-amber-500"><Star className="h-4 w-4" /><p className="text-[12px] font-bold text-ink-900">Price alerts</p></div>
          <p className="mt-1 text-[10.5px] leading-5 text-ink-500">We’ll notify you when a saved service drops in price.</p>
        </SectionCard>
        <SectionCard className="p-4">
          <div className="flex items-center gap-2 text-emerald-600"><Store className="h-4 w-4" /><p className="text-[12px] font-bold text-ink-900">Follow vendors</p></div>
          <p className="mt-1 text-[10.5px] leading-5 text-ink-500">Get new-service and seasonal offer updates from saved businesses.</p>
        </SectionCard>
      </div>
    </div>
  );
}
