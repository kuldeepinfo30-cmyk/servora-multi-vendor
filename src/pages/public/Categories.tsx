import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Clock, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { CATEGORIES } from '@/lib/data';
import { buttonStyles } from '@/components/ui/primitives';
import { CategoryCard, SectionHeading } from '@/components/marketplace';

export default function CategoriesPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-100 bg-mesh">
        <div className="absolute inset-0 bg-grid-slate bg-grid opacity-35 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="container-page relative py-12 sm:py-16">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-ink-400">
            <Link to="/" className="hover:text-brand-600">Home</Link>
            <span>/</span>
            <span className="text-ink-600">Categories</span>
          </div>
          <p className="eyebrow mb-2.5">Browse the marketplace</p>
          <h1 className="max-w-2xl font-display text-[32px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-[40px]">
            Every local service, <span className="gradient-text">one trusted place.</span>
          </h1>
          <p className="mt-3 max-w-xl text-[13.5px] leading-6 text-ink-500">
            Explore 12 categories and 1,600+ services delivered by verified professionals across 8 cities.
            Compare prices, ratings and real availability before you book.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            {[
              { icon: BadgeCheck, text: '500+ verified vendors' },
              { icon: ShieldCheck, text: 'Happiness guarantee' },
              { icon: Clock, text: 'Same-day availability' },
            ].map((i) => (
              <span key={i.text} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-600">
                <i.icon className="h-4 w-4 text-brand-600" /> {i.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-[20px] font-extrabold text-ink-900">All categories</h2>
          <Link to="/services" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
            <Search className="h-3.5 w-3.5" /> Search all 1,600+ services
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      <section className="border-y border-ink-100 bg-ink-50/50 py-12">
        <div className="container-page">
          <SectionHeading
            eyebrow="Popular subcategories"
            title="Looking for something specific?"
            description="Jump straight to the service you need."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {CATEGORIES.slice(0, 6).map((cat) => (
              <div key={cat.id} className="rounded-2xl border border-ink-200/80 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13.5px] font-bold text-ink-900">{cat.name}</h3>
                  <Link to={`/categories/${cat.slug}`} className="text-[10.5px] font-bold text-brand-600 hover:text-brand-700">
                    View all →
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {cat.subcategories.map((sub) => (
                    <Link
                      key={sub}
                      to={`/services?q=${encodeURIComponent(sub)}`}
                      className="rounded-full border border-ink-200 px-2.5 py-1 text-[10.5px] font-medium text-ink-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-ink-900 p-7 text-white sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </span>
            <div>
              <h3 className="font-display text-lg font-extrabold">Not sure what you need?</h3>
              <p className="mt-1 max-w-md text-[12px] leading-5 text-white/60">
                Tell us the problem and our service assistant will match you with the right professional and price range.
              </p>
            </div>
          </div>
          <Link to="/help" className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-[12px] font-bold text-ink-900 transition hover:bg-brand-50">
            Get help choosing <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
