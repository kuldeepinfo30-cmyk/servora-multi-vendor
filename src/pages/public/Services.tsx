import { SERVICES } from '@/lib/data';
import { ServiceExplorer } from '@/components/discovery';

export default function ServicesPage() {
  return (
    <ServiceExplorer
      services={SERVICES}
      eyebrow="Marketplace"
      title="Browse all services"
      description="1,600+ services from 500+ verified professionals. Compare prices, ratings and live availability before you book."
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Services' }]}
      headerExtra={
        <div className="flex flex-wrap gap-2">
          {['Deep cleaning', 'AC service', 'Bridal makeup'].map((term) => (
            <a
              key={term}
              href={`/services?q=${encodeURIComponent(term)}`}
              className="rounded-full border border-ink-200 bg-white/80 px-3 py-1.5 text-[10.5px] font-semibold text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
            >
              {term}
            </a>
          ))}
        </div>
      }
    />
  );
}
