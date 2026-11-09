import { useSearchParams } from 'react-router-dom';
import { SERVICES, VENDORS } from '@/lib/data';
import { ServiceExplorer } from '@/components/discovery';

export default function SearchResultsPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const city = params.get('city') ?? '';
  const category = params.get('category') ?? '';

  let pool = SERVICES;
  if (city) {
    const ids = VENDORS.filter((v) => v.city === city).map((v) => v.id);
    pool = pool.filter((s) => ids.includes(s.vendorId));
  }
  if (category) pool = pool.filter((s) => s.categoryId === category);

  return (
    <ServiceExplorer
      services={pool}
      eyebrow={city ? `Searching in ${city}` : 'Search results'}
      title={q ? `Results for “${q}”` : 'Find your next service'}
      description={`${pool.length} services available${city ? ` in ${city}` : ''}. Use filters to compare price, rating and availability.`}
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Search' }]}
      initialQuery={q}
      showMap
      headerExtra={
        <div className="rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-[11px] text-ink-500">
          <span className="font-semibold text-ink-700">Tip:</span> try “deep clean”, “AC repair” or “bridal makeup”
        </div>
      }
    />
  );
}
