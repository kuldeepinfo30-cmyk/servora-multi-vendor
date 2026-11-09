import { Link, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES, getCategoryServices, VENDORS } from '@/lib/data';
import { CategoryHero, ServiceExplorer } from '@/components/discovery';
import { VendorCard } from '@/components/marketplace';
import { buttonStyles, EmptyState } from '@/components/ui/primitives';
import NotFoundPage from '../NotFound';

export default function CategoryDetailPage() {
  const { slug } = useParams();
  const category = CATEGORIES.find((c) => c.slug === slug);

  if (!category) return <NotFoundPage />;

  const services = getCategoryServices(category.id);
  const vendorIds = [...new Set(services.map((s) => s.vendorId))];
  const vendors = VENDORS.filter((v) => vendorIds.includes(v.id)).slice(0, 4);

  return (
    <div>
      <CategoryHero category={category} />

      <div className="border-b border-ink-100 bg-white">
        <div className="container-page flex gap-2 overflow-x-auto py-3 no-scrollbar">
          {category.subcategories.map((sub) => (
            <Link
              key={sub}
              to={`/services?q=${encodeURIComponent(sub)}`}
              className="shrink-0 rounded-full border border-ink-200 px-3.5 py-1.5 text-[11px] font-semibold text-ink-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              {sub}
            </Link>
          ))}
          <Link
            to="/categories"
            className="ml-auto hidden shrink-0 items-center gap-1 text-[11px] font-bold text-brand-600 sm:inline-flex"
          >
            All categories <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <ServiceExplorer
        services={services.length ? services : []}
        title={`${category.name} services`}
        description={`Compare ${services.length} services from verified ${category.name.toLowerCase()} professionals near you.`}
        initialCategoryIds={[category.id]}
        hideHeader
      />

      {services.length === 0 && (
        <div className="container-page pb-10">
          <EmptyState
            title="No services in this category yet"
            description="We are onboarding verified professionals for this category. Explore other services in the meantime."
            action={<Link to="/services" className={buttonStyles({ size: 'sm' })}>Browse all services</Link>}
          />
        </div>
      )}

      {vendors.length > 0 && (
        <section className="border-t border-ink-100 bg-ink-50/50 py-12">
          <div className="container-page">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="eyebrow mb-2">Trusted specialists</p>
                <h2 className="font-display text-[22px] font-extrabold text-ink-900">Top {category.name.toLowerCase()} vendors</h2>
              </div>
              <Link to="/vendors" className="link-underline text-[12px]">
                All vendors <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {vendors.map((v) => (
                <VendorCard key={v.id} vendor={v} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
