import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  LayoutGrid,
  List,
  Map,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { CATEGORIES, CITIES, SERVICES, VENDORS } from '@/lib/data';
import type { Service, Vendor } from '@/lib/types';
import { cn, inr, minsToLabel, num } from '@/lib/utils';
import { distanceToVendor, formatKm } from '@/lib/geo';
import { useLocation } from '@/store/location';
import { LocationBar } from '@/components/LocationBar';
import { Button, Card, Checkbox, EmptyState, RatingStars, Switch } from '@/components/ui/primitives';
import { Pagination, SearchField } from '@/components/ui/data-display';
import { Drawer } from '@/components/ui/overlays';
import { MapPlaceholder, ServiceCard, SmartImage, VendorCard } from '@/components/marketplace';

/* ------------------------------- Filter sidebar ---------------------------- */

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-ink-100 pb-4 last:border-0 last:pb-0">
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-500">{title}</p>
      {children}
    </div>
  );
}

export function ServiceFilters({
  categories,
  onCategories,
  maxPrice,
  onMaxPrice,
  minRating,
  onMinRating,
  availableToday,
  onAvailableToday,
  verifiedOnly,
  onVerifiedOnly,
  maxDuration,
  onMaxDuration,
  onReset,
  activeCount,
}: {
  categories: string[];
  onCategories: (v: string[]) => void;
  maxPrice: number;
  onMaxPrice: (v: number) => void;
  minRating: number;
  onMinRating: (v: number) => void;
  availableToday: boolean;
  onAvailableToday: (v: boolean) => void;
  verifiedOnly: boolean;
  onVerifiedOnly: (v: boolean) => void;
  maxDuration: number;
  onMaxDuration: (v: number) => void;
  onReset: () => void;
  activeCount: number;
}) {
  const toggleCat = (id: string) =>
    onCategories(categories.includes(id) ? categories.filter((c) => c !== id) : [...categories, id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink-900">
          <SlidersHorizontal className="h-3.5 w-3.5 text-brand-600" /> Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-700">{activeCount}</span>
          )}
        </p>
        <button onClick={onReset} className="text-[10.5px] font-bold text-brand-600 hover:text-brand-700">
          Reset all
        </button>
      </div>

      <FilterGroup title="Category">
        <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
          {CATEGORIES.map((cat) => (
            <Checkbox
              key={cat.id}
              label={<span className="text-[12px]">{cat.name}</span>}
              checked={categories.includes(cat.id)}
              onChange={() => toggleCat(cat.id)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price range">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="text-ink-400">Any</span>
          <span className="text-ink-800">Up to {inr(maxPrice)}</span>
        </div>
        <input
          type="range"
          min={299}
          max={16000}
          step={100}
          value={maxPrice}
          onChange={(e) => onMaxPrice(Number(e.target.value))}
          className="mt-2.5 w-full accent-brand-600"
        />
      </FilterGroup>

      <FilterGroup title="Customer rating">
        <div className="space-y-1">
          {[0, 4.5, 4.0, 3.5].map((r) => (
            <button
              key={r}
              onClick={() => onMinRating(r)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11.5px] transition',
                minRating === r ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50',
              )}
            >
              <span className="flex items-center gap-1.5">
                {r === 0 ? (
                  'Any rating'
                ) : (
                  <>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {r} & above
                  </>
                )}
              </span>
              {minRating === r && <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Availability">
        <Switch checked={availableToday} onChange={onAvailableToday} label="Available today" description="Slots open in the next 24 hrs" />
        <div className="mt-3">
          <Switch checked={verifiedOnly} onChange={onVerifiedOnly} label="Verified vendors only" description="KYC & background checked" />
        </div>
      </FilterGroup>

      <FilterGroup title="Duration">
        <div className="flex flex-wrap gap-1.5">
          {[60, 120, 240, 600].map((d) => (
            <button
              key={d}
              onClick={() => onMaxDuration(maxDuration === d ? 600 : d)}
              className={cn(
                'rounded-lg border px-2.5 py-1.5 text-[10.5px] font-semibold transition',
                maxDuration === d ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500 hover:bg-ink-50',
              )}
            >
              {d === 60 ? 'Under 1 hr' : d === 120 ? 'Under 2 hrs' : d === 240 ? 'Under 4 hrs' : 'Any'}
            </button>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

/* -------------------------------- Explorer --------------------------------- */

export function ServiceExplorer({
  services,
  title,
  description,
  eyebrow,
  breadcrumb,
  initialCategoryIds = [],
  initialQuery = '',
  showMap = false,
  hideHeader = false,
  headerExtra,
}: {
  services: Service[];
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumb?: { label: string; href?: string }[];
  initialCategoryIds?: string[];
  initialQuery?: string;
  showMap?: boolean;
  hideHeader?: boolean;
  headerExtra?: React.ReactNode;
}) {
  const [cats, setCats] = useState<string[]>(initialCategoryIds);
  const [maxPrice, setMaxPrice] = useState(16000);
  const [minRating, setMinRating] = useState(0);
  const [availableToday, setAvailableToday] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [maxDuration, setMaxDuration] = useState(600);
  const [sort, setSort] = useState('recommended');
  const [view, setView] = useState<'grid' | 'list' | 'map'>('grid');
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);
  const perPage = 9;

  const location = useLocation((s) => s.location);
  const radiusKm = useLocation((s) => s.radiusKm);
  const nearbyOnly = useLocation((s) => s.nearbyOnly);

  useEffect(() => {
    setCats(initialCategoryIds);
    setQuery(initialQuery);
    setPage(1);
  }, [initialCategoryIds.join(','), initialQuery]);

  const activeCount =
    cats.length +
    (maxPrice < 16000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (availableToday ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (maxDuration < 600 ? 1 : 0) +
    (nearbyOnly && location ? 1 : 0) +
    (query ? 1 : 0);

  const reset = () => {
    setCats(initialCategoryIds);
    setMaxPrice(16000);
    setMinRating(0);
    setAvailableToday(false);
    setVerifiedOnly(false);
    setMaxDuration(600);
    setQuery(initialQuery);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const radiusActive = nearbyOnly && !!location;
    const vendorDistance = (vendorId: string): number => {
      const vendor = VENDORS.find((v) => v.id === vendorId);
      return vendor ? distanceToVendor(location, vendor) ?? Infinity : Infinity;
    };

    let list = services.filter((s) => {
      const vendor = VENDORS.find((v) => v.id === s.vendorId);
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        `${s.name} ${s.description} ${s.tags.join(' ')} ${vendor?.name ?? ''}`.toLowerCase().includes(q);
      const withinRadius = !radiusActive || vendorDistance(s.vendorId) <= radiusKm;
      return (
        matchesQuery &&
        withinRadius &&
        (cats.length === 0 || cats.includes(s.categoryId)) &&
        s.price <= maxPrice &&
        s.rating >= minRating &&
        (!availableToday || s.availableToday) &&
        (!verifiedOnly || vendor?.verified) &&
        s.duration <= maxDuration
      );
    });
    list = [...list];
    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'booked':
        list.sort((a, b) => b.bookings - a.bookings);
        break;
      case 'distance':
        list.sort((a, b) => vendorDistance(a.vendorId) - vendorDistance(b.vendorId));
        break;
      default:
        list.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false) || b.rating - a.rating);
    }
    return list;
  }, [services, query, cats, maxPrice, minRating, availableToday, verifiedOnly, maxDuration, sort, location, radiusKm, nearbyOnly]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const mapVendors = VENDORS.filter((v) => filtered.some((s) => s.vendorId === v.id));

  const filtersNode = (
    <ServiceFilters
      categories={cats}
      onCategories={(v) => {
        setCats(v);
        setPage(1);
      }}
      maxPrice={maxPrice}
      onMaxPrice={(v) => {
        setMaxPrice(v);
        setPage(1);
      }}
      minRating={minRating}
      onMinRating={(v) => {
        setMinRating(v);
        setPage(1);
      }}
      availableToday={availableToday}
      onAvailableToday={(v) => {
        setAvailableToday(v);
        setPage(1);
      }}
      verifiedOnly={verifiedOnly}
      onVerifiedOnly={(v) => {
        setVerifiedOnly(v);
        setPage(1);
      }}
      maxDuration={maxDuration}
      onMaxDuration={(v) => {
        setMaxDuration(v);
        setPage(1);
      }}
      onReset={reset}
      activeCount={activeCount}
    />
  );

  return (
    <div>
      {!hideHeader && (
        <section className="border-b border-ink-100 bg-mesh">
          <div className="container-page py-8 sm:py-10">
            {breadcrumb && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-400">
                {breadcrumb.map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5">
                    {i > 0 && <span className="text-ink-300">/</span>}
                    {b.href ? <Link to={b.href} className="hover:text-brand-600">{b.label}</Link> : <span className="text-ink-600">{b.label}</span>}
                  </span>
                ))}
              </div>
            )}
            {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink-900 sm:text-[32px]">{title}</h1>
                {description && <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-ink-500">{description}</p>}
              </div>
              {headerExtra}
            </div>
            <div className="mt-5 max-w-lg">
              <SearchField
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setPage(1);
                }}
                placeholder="Search within these services…"
              />
            </div>
          </div>
        </section>
      )}

      <div className="container-page py-7">
        <div className="grid gap-6 lg:grid-cols-[248px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-[88px] max-h-[calc(100vh-110px)] overflow-y-auto rounded-2xl border border-ink-200/80 bg-white p-4 shadow-soft">
              {filtersNode}
            </div>
          </aside>

          <div>
            <LocationBar className="mb-4" />
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setMobileFilters(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-[11.5px] font-bold text-ink-700 lg:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                {activeCount > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-[9px] text-white">{activeCount}</span>}
              </button>
              <p className="text-[12px] text-ink-500">
                <span className="font-bold text-ink-900">{num(filtered.length)}</span> services
                {query && <> for “<span className="font-semibold text-ink-700">{query}</span>”</>}
              </p>
              <div className="ml-auto flex items-center gap-2">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-[11.5px] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none"
                >
                  <option value="recommended">Recommended</option>
                  <option value="rating">Highest rated</option>
                  <option value="distance">Nearest first</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="booked">Most booked</option>
                </select>
                <div className="flex rounded-lg border border-ink-200 p-0.5">
                  <button
                    onClick={() => setView('grid')}
                    className={cn('rounded-md p-1.5', view === 'grid' ? 'bg-ink-900 text-white' : 'text-ink-400 hover:text-ink-700')}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={cn('rounded-md p-1.5', view === 'list' ? 'bg-ink-900 text-white' : 'text-ink-400 hover:text-ink-700')}
                    aria-label="List view"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  {showMap && (
                    <button
                      onClick={() => setView('map')}
                      className={cn('rounded-md p-1.5', view === 'map' ? 'bg-ink-900 text-white' : 'text-ink-400 hover:text-ink-700')}
                      aria-label="Map view"
                    >
                      <Map className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {activeCount > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                {cats.map((id) => {
                  const cat = CATEGORIES.find((c) => c.id === id);
                  return (
                    <button
                      key={id}
                      onClick={() => setCats(cats.filter((c) => c !== id))}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10.5px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-600/15"
                    >
                      {cat?.name} <X className="h-2.5 w-2.5" />
                    </button>
                  );
                })}
                {maxPrice < 16000 && (
                  <button onClick={() => setMaxPrice(16000)} className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-[10.5px] font-semibold text-ink-600">
                    Under {inr(maxPrice)} <X className="h-2.5 w-2.5" />
                  </button>
                )}
                {minRating > 0 && (
                  <button onClick={() => setMinRating(0)} className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-[10.5px] font-semibold text-ink-600">
                    {minRating}★ & above <X className="h-2.5 w-2.5" />
                  </button>
                )}
                {availableToday && (
                  <button onClick={() => setAvailableToday(false)} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-semibold text-emerald-700">
                    Available today <X className="h-2.5 w-2.5" />
                  </button>
                )}
                {verifiedOnly && (
                  <button onClick={() => setVerifiedOnly(false)} className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-[10.5px] font-semibold text-ink-600">
                    Verified only <X className="h-2.5 w-2.5" />
                  </button>
                )}
                {nearbyOnly && location && (
                  <button onClick={() => setNearbyOnly(false)} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-semibold text-emerald-700">
                    Within {radiusKm} km <X className="h-2.5 w-2.5" />
                  </button>
                )}
                <button onClick={reset} className="text-[10.5px] font-bold text-rose-600 hover:underline">
                  Clear all
                </button>
              </div>
            )}

            {view === 'map' && showMap ? (
              <MapPlaceholder vendors={mapVendors} className="h-[560px]" />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<Search className="h-5 w-5" />}
                title="No services match your filters"
                description="Try widening your price range, clearing a category or searching for something else."
                action={
                  <Button variant="outline" size="sm" onClick={reset}>
                    Clear all filters
                  </Button>
                }
              />
            ) : view === 'list' ? (
              <div className="space-y-3">
                {paged.map((service) => (
                  <ServiceListRow key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {paged.map((service) => (
                  <ServiceCard key={service.id} service={service} vendor={VENDORS.find((v) => v.id === service.vendorId)} compact />
                ))}
              </div>
            )}

            {filtered.length > 0 && view !== 'map' && (
              <Pagination
                page={page}
                pageCount={pageCount}
                total={filtered.length}
                perPage={perPage}
                onChange={setPage}
                className="mt-6 px-0"
              />
            )}
          </div>
        </div>
      </div>

      <Drawer open={mobileFilters} onClose={() => setMobileFilters(false)} title="Filters" description="Refine your service results" width="max-w-sm" footer={<Button className="w-full" onClick={() => setMobileFilters(false)}>Show {filtered.length} results</Button>}>
        {filtersNode}
      </Drawer>
    </div>
  );
}

function ServiceListRow({ service }: { service: Service }) {
  const vendor = VENDORS.find((v) => v.id === service.vendorId);
  const location = useLocation((s) => s.location);
  const distance = vendor ? distanceToVendor(location, vendor) : null;
  return (
    <Link to={`/services/${service.slug}`} className="group block">
      <Card hover className="flex flex-col overflow-hidden sm:flex-row">
        <SmartImage src={service.image} alt={service.name} className="aspect-[16/9] w-full shrink-0 sm:aspect-auto sm:w-56">
          {service.discount && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[9.5px] font-bold text-white">
              {service.discount}% OFF
            </span>
          )}
        </SmartImage>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-ink-500">
            <BadgeCheck className="h-3.5 w-3.5 text-brand-600" /> {vendor?.name}
          </div>
          <h3 className="mt-1 text-[15px] font-bold text-ink-900 group-hover:text-brand-700">{service.name}</h3>
          <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-ink-500">{service.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
            <RatingStars value={service.rating} count={service.reviewCount} size={12} />
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {minsToLabel(service.duration)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {vendor?.area}</span>
            {distance !== null && (
              <span className="font-semibold text-brand-700">{formatKm(distance)} away</span>
            )}
            {service.availableToday && <span className="font-semibold text-emerald-600">Available today</span>}
          </div>
          <div className="mt-auto flex items-end justify-between pt-3">
            <div className="flex flex-wrap gap-1">
              {service.tags.slice(0, 2).map((t) => (
                <span key={t} className="rounded-md bg-ink-100 px-2 py-0.5 text-[9.5px] font-semibold text-ink-500">{t}</span>
              ))}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-ink-400">From</p>
              <p className="text-[16px] font-extrabold text-ink-900">{inr(service.price)}</p>
            </div>
            <span className="ml-3 inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-[11px] font-bold text-white transition group-hover:bg-brand-700">
              Book <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* -------------------------------- Vendors ---------------------------------- */

export function VendorExplorer({
  vendors,
  title,
  description,
  initialCity = '',
}: {
  vendors: Vendor[];
  title: string;
  description?: string;
  initialCity?: string;
}) {
  const [city, setCity] = useState(initialCity);
  const [cat, setCat] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState('rating');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const location = useLocation((s) => s.location);
  const radiusKm = useLocation((s) => s.radiusKm);
  const nearbyOnly = useLocation((s) => s.nearbyOnly);

  const filtered = useMemo(() => {
    const radiusActive = nearbyOnly && !!location;
    let list = vendors.filter(
      (v) =>
        (city ? v.city === city : true) &&
        (cat === 'all' || v.categoryId === cat) &&
        v.rating >= minRating &&
        (!verifiedOnly || v.verified) &&
        (!radiusActive || (distanceToVendor(location, v) ?? Infinity) <= radiusKm),
    );
    list = [...list];
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (sort === 'jobs') list.sort((a, b) => b.jobsDone - a.jobsDone);
    if (sort === 'price') list.sort((a, b) => a.priceFrom - b.priceFrom);
    if (sort === 'distance')
      list.sort(
        (a, b) => (distanceToVendor(location, a) ?? Infinity) - (distanceToVendor(location, b) ?? Infinity),
      );
    return list;
  }, [vendors, city, cat, minRating, verifiedOnly, sort, location, radiusKm, nearbyOnly]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <section className="border-b border-ink-100 bg-mesh">
        <div className="container-page py-9">
          <div className="mb-3 flex items-center gap-1.5 text-[11px] text-ink-400">
            <Link to="/" className="hover:text-brand-600">Home</Link>
            <span>/</span>
            <span className="text-ink-600">Vendors</span>
          </div>
          <h1 className="font-display text-[28px] font-extrabold tracking-tight text-ink-900 sm:text-[34px]">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-ink-500">{description}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <select
              value={city}
              onChange={(e) => { setCity(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-[12px] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none"
            >
              <option value="">All cities</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select
              value={cat}
              onChange={(e) => { setCat(e.target.value); setPage(1); }}
              className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-[12px] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={minRating}
              onChange={(e) => { setMinRating(Number(e.target.value)); setPage(1); }}
              className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-[12px] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none"
            >
              <option value={0}>Any rating</option>
              <option value={4.5}>4.5★ & above</option>
              <option value={4.0}>4.0★ & above</option>
            </select>
            <button
              onClick={() => setVerifiedOnly((v) => !v)}
              className={cn(
                'inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-[12px] font-semibold transition',
                verifiedOnly ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-600',
              )}
            >
              <BadgeCheck className="h-3.5 w-3.5" /> Verified only
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="ml-auto h-10 rounded-xl border border-ink-200 bg-white px-3 text-[12px] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none"
            >
              <option value="rating">Top rated</option>
              <option value="jobs">Most booked</option>
              <option value="distance">Nearest first</option>
              <option value="price">Price: low to high</option>
            </select>
          </div>
        </div>
      </section>

      <div className="container-page py-7">
        <LocationBar className="mb-4" />
        <p className="mb-4 text-[12px] text-ink-500">
          <span className="font-bold text-ink-900">{filtered.length}</span> verified vendors
          {city && <> in <span className="font-semibold text-ink-700">{city}</span></>}
          {nearbyOnly && location && <> within <span className="font-semibold text-ink-700">{radiusKm} km</span></>}
        </p>
        {paged.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-5 w-5" />}
            title="No vendors match these filters"
            description="Try another city or remove the verified filter."
            action={<Button variant="outline" size="sm" onClick={() => { setCity(''); setCat('all'); setMinRating(0); setVerifiedOnly(false); }}>Clear filters</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {paged.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        )}
        {filtered.length > perPage && (
          <Pagination page={page} pageCount={Math.ceil(filtered.length / perPage)} total={filtered.length} perPage={perPage} onChange={setPage} className="mt-6 px-0" />
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Category hero ---------------------------- */

export function CategoryHero({ category }: { category: (typeof CATEGORIES)[number] }) {
  return (
    <section className="relative overflow-hidden border-b border-ink-100">
      <SmartImage src={category.image} alt={category.name} className="absolute inset-0 h-full w-full" tone={category.tone} />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/75 to-ink-950/30" />
      <div className="container-page relative py-10 sm:py-12">
        <div className="mb-3 flex items-center gap-1.5 text-[11px] text-white/50">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link to="/categories" className="hover:text-white">Categories</Link>
          <span>/</span>
          <span className="text-white/90">{category.name}</span>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                {category.vendors} verified pros
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                {category.services} services
              </span>
            </div>
            <h1 className="font-display text-[30px] font-extrabold leading-tight text-white sm:text-[38px]">{category.name}</h1>
            <p className="mt-2 max-w-lg text-[13px] leading-6 text-white/70">{category.description}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {category.subcategories.map((sub) => (
              <span key={sub} className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10.5px] font-medium text-white/80 backdrop-blur">
                {sub}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
