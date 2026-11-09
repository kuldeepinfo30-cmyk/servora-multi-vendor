import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { CATEGORIES, CITIES, IMAGES, SERVICES, VENDORS } from '@/lib/data';
import { cn, inr } from '@/lib/utils';
import { Button, buttonStyles, Chip, RatingStars } from '@/components/ui/primitives';
import { Accordion } from '@/components/ui/overlays';
import {
  CategoryCard,
  CategoryIcon,
  SectionHeading,
  ServiceCard,
  SmartImage,
  TrustStrip,
  VendorCard,
} from '@/components/marketplace';

const testimonials = [
  {
    name: 'Ishita Bose',
    city: 'Kolkata',
    tone: 'violet',
    text: 'Booked a deep clean at 9 PM for the next morning — the crew arrived on the dot. The app kept me updated at every step and the invoice landed in my inbox instantly.',
    service: 'Deep Home Cleaning',
    rating: 5,
  },
  {
    name: 'Arjun Desai',
    city: 'Ahmedabad',
    tone: 'teal',
    text: 'I have used three different AC services before. CoolBreeze actually diagnosed the problem instead of upselling a gas refill. Transparent pricing is a game changer.',
    service: 'AC Service & Gas Check',
    rating: 5,
  },
  {
    name: 'Sneha Iyer',
    city: 'Mumbai',
    tone: 'brand',
    text: 'Riya did my bridal makeup and it was flawless from the trial to the final day. Having the trial, contract and payments in one place made everything stress-free.',
    service: 'Bridal Makeup at Home',
    rating: 5,
  },
];

const faqs = [
  {
    question: 'How does Servora verify professionals?',
    answer:
      'Every vendor completes KYC with government ID, business registration and bank verification. We also run background checks on staff, monitor ratings and audit service quality. Vendors who fall below our quality bar are suspended.',
  },
  {
    question: 'Can I reschedule or cancel a booking?',
    answer:
      'Yes. Each service shows its cancellation window on the booking page. Most services allow free cancellation up to 12 hours before the slot, and you can reschedule instantly from your bookings dashboard.',
  },
  {
    question: 'How are payments and refunds handled?',
    answer:
      'Payments are processed securely through our gateway. We hold funds until the service is completed, and approved refunds are returned to your original payment method within 5–7 working days.',
  },
  {
    question: 'What if I am not happy with the service?',
    answer:
      'Report the issue from your booking within 48 hours. We will arrange a free re-service where applicable, or issue a partial or full refund after reviewing the evidence with the vendor.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [when, setWhen] = useState('Today');
  const [activeCategory, setActiveCategory] = useState('all');

  const todayServices = useMemo(() => {
    const list = SERVICES.filter((s) => s.availableToday);
    return activeCategory === 'all' ? list : list.filter((s) => s.categoryId === activeCategory);
  }, [activeCategory]);

  const topVendors = useMemo(() => [...VENDORS].sort((a, b) => b.rating - a.rating).slice(0, 4), []);

  const submitSearch = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (city) params.set('city', city);
    navigate(`/services?${params.toString()}`);
  };

  const todayTabs = [
    { id: 'all', label: 'All services' },
    ...CATEGORIES.filter((c) => c.id === 'c1' || c.id === 'c4' || c.id === 'c5' || c.id === 'c10').map((c) => ({
      id: c.id,
      label: c.name,
    })),
  ];

  return (
    <div>
      {/* ---------------------------------- Hero ---------------------------------- */}
      <section className="relative overflow-hidden bg-mesh">
        <div className="absolute inset-0 bg-grid-slate bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
        <div className="container-page relative pb-16 pt-12 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/70 bg-white/80 py-1 pl-1 pr-3 text-[11px] font-semibold text-brand-800 shadow-sm backdrop-blur">
                <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                  New
                </span>
                Serving 8 cities with 500+ verified pros
                <ChevronRight className="h-3 w-3" />
              </div>

              <h1 className="mt-5 font-display text-[38px] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink-900 sm:text-[52px] lg:text-[58px]">
                Home services,
                <br />
                <span className="gradient-text">minus the hassle.</span>
              </h1>

              <p className="mt-5 max-w-lg text-[14.5px] leading-7 text-ink-600">
                Book trusted local professionals for cleaning, repairs, beauty, photography and more.
                Upfront prices, real availability and a happiness guarantee — every single time.
              </p>

              {/* Search */}
              <div className="mt-7 rounded-2xl border border-white/70 bg-white p-2 shadow-[0_24px_60px_-30px_rgba(30,27,75,.45)] ring-1 ring-ink-900/5">
                <div className="grid gap-1 sm:grid-cols-[1.3fr_1fr_0.9fr_auto] sm:gap-0">
                  <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-ink-50/70">
                    <Search className="h-4 w-4 shrink-0 text-brand-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-400">What do you need?</p>
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                        placeholder="Deep cleaning, AC repair…"
                        className="w-full bg-transparent text-[12.5px] font-semibold text-ink-800 placeholder:font-normal placeholder:text-ink-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="hidden w-px self-stretch bg-ink-100 sm:block" />
                  <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-ink-50/70">
                    <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-400">Where?</p>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full cursor-pointer appearance-none bg-transparent text-[12.5px] font-semibold text-ink-800 focus:outline-none"
                      >
                        {CITIES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="hidden w-px self-stretch bg-ink-100 sm:block" />
                  <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-ink-50/70">
                    <CalendarDays className="h-4 w-4 shrink-0 text-brand-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-400">When?</p>
                      <select
                        value={when}
                        onChange={(e) => setWhen(e.target.value)}
                        className="w-full cursor-pointer appearance-none bg-transparent text-[12.5px] font-semibold text-ink-800 focus:outline-none"
                      >
                        <option>Today</option>
                        <option>Tomorrow</option>
                        <option>This weekend</option>
                        <option>I’m flexible</option>
                      </select>
                    </div>
                  </div>
                  <Button size="lg" className="h-12 sm:ml-2" onClick={submitSearch}>
                    <Search className="h-4 w-4" /> Search
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-ink-400">Popular:</span>
                {['Deep cleaning', 'AC service', 'Bridal makeup', 'Maths tutor', 'Dog grooming'].map((term) => (
                  <button
                    key={term}
                    onClick={() => navigate(`/services?q=${encodeURIComponent(term)}`)}
                    className="rounded-full border border-ink-200/80 bg-white/70 px-2.5 py-1 text-[10.5px] font-medium text-ink-600 backdrop-blur transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {term}
                  </button>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
                {[
                  { value: '12,400+', label: 'bookings completed' },
                  { value: '4.9/5', label: 'average rating' },
                  { value: '500+', label: 'verified pros' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="font-display text-lg font-extrabold text-ink-900">{stat.value}</p>
                    <p className="text-[10.5px] text-ink-500">{stat.label}</p>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {['Aarav', 'Priya', 'Rohan', 'Sneha'].map((n, i) => (
                      <span
                        key={n}
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold',
                          ['bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700'][i],
                        )}
                      >
                        {n.charAt(0)}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-ink-500">40k+ happy homes</span>
                </div>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative hidden lg:block">
              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-brand-200/40 blur-3xl" />
              <div className="absolute -bottom-6 -left-6 h-52 w-52 rounded-full bg-amber-200/40 blur-3xl" />
              <div className="relative">
                <SmartImage
                  src={IMAGES.cleaning}
                  alt="Professional home cleaning"
                  className="aspect-[4/3.4] rounded-[28px] shadow-[0_40px_80px_-40px_rgba(15,23,42,.55)] ring-1 ring-black/5"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/40 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-white/95 p-3 backdrop-blur">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-[13px] font-extrabold text-emerald-700">
                        S
                      </span>
                      <div>
                        <p className="flex items-center gap-1 text-[11.5px] font-bold text-ink-900">
                          SparkleHome Cleaning
                          <BadgeCheck className="h-3.5 w-3.5 text-brand-600" />
                        </p>
                        <p className="text-[9.5px] text-ink-500">Deep cleaning · Andheri West</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="flex items-center gap-1 text-[11px] font-bold text-ink-900">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.9
                      </p>
                      <p className="text-[9px] text-ink-400">842 reviews</p>
                    </div>
                  </div>
                </SmartImage>

                <div className="absolute -left-8 top-8 w-[190px] rounded-2xl border border-white/60 bg-white/95 p-3.5 shadow-float backdrop-blur">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10.5px] font-bold text-ink-900">Booking confirmed</p>
                      <p className="text-[9px] text-ink-400">SRV-24122 · Wed 10:00 AM</p>
                    </div>
                  </div>
                  <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full w-2/3 rounded-full bg-emerald-500" />
                  </div>
                  <p className="mt-1.5 text-[8.5px] font-medium text-emerald-700">Pro assigned · arriving in 2 days</p>
                </div>

                <div className="absolute -right-7 top-1/3 w-[170px] rounded-2xl border border-white/60 bg-white/95 p-3.5 shadow-float backdrop-blur">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <p className="text-[10px] font-bold text-ink-900">Available today</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {['09:00', '11:00', '14:00', '16:00'].map((t) => (
                      <span key={t} className="rounded-md bg-brand-50 px-1.5 py-1 text-[8.5px] font-bold text-brand-700">
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[8.5px] text-ink-400">Instant confirmation</p>
                </div>

                <div className="absolute -bottom-6 right-6 flex items-center gap-2 rounded-xl bg-ink-900 px-3.5 py-2.5 text-white shadow-float">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-[9.5px] font-bold">Happiness guaranteed</p>
                    <p className="text-[8px] text-white/60">Free re-service in 48 hrs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <TrustStrip className="mt-12 lg:mt-16" />
        </div>
      </section>

      {/* -------------------------------- Categories ------------------------------- */}
      <section className="container-page py-14 sm:py-16">
        <SectionHeading
          eyebrow="Browse by category"
          title="What can we help you with?"
          description="From a quick tap repair to a full home makeover — find the right expert for every job."
          action={
            <Link to="/categories" className="link-underline">
              All 12 categories <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.slice(0, 8).map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          {CATEGORIES.slice(8).map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-ink-200/80 bg-white px-4 py-3 transition hover:border-ink-300 hover:shadow-card"
            >
              <CategoryIcon name={cat.icon} tone={cat.tone} className="h-9 w-9 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-bold text-ink-900 group-hover:text-brand-700">{cat.name}</p>
                <p className="text-[10px] text-ink-400">{cat.vendors} pros near you</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-300 transition group-hover:text-brand-500" />
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------ Available today ---------------------------- */}
      <section className="border-y border-ink-100 bg-ink-50/50 py-14 sm:py-16">
        <div className="container-page">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
                </span>
                Live availability · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
              </div>
              <h2 className="font-display text-[24px] font-extrabold tracking-tight text-ink-900 sm:text-[30px]">
                Book a pro for today
              </h2>
              <p className="mt-1.5 text-[13px] text-ink-500">Real-time slots from verified professionals near you.</p>
            </div>
            <Link to="/services" className="link-underline">
              See all services <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {todayTabs.map((tab) => (
              <Chip key={tab.id} active={activeCategory === tab.id} onClick={() => setActiveCategory(tab.id)}>
                {tab.label}
              </Chip>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {todayServices.slice(0, 4).map((service) => (
              <ServiceCard key={service.id} service={service} vendor={VENDORS.find((v) => v.id === service.vendorId)} compact />
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------- Promos --------------------------------- */}
      <section className="container-page py-14 sm:py-16">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="group relative overflow-hidden rounded-2xl bg-ink-900 text-white">
            <SmartImage src={IMAGES.interior} alt="Home deep cleaning offer" className="absolute inset-0 h-full w-full opacity-45" imgClassName="group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-transparent" />
            <div className="relative max-w-sm p-7 sm:p-9">
              <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-950">
                Festive offer
              </span>
              <h3 className="mt-4 font-display text-[26px] font-extrabold leading-tight sm:text-[30px]">
                Deep home cleaning
                <br />
                from ₹1,999
              </h3>
              <p className="mt-2 text-[12.5px] leading-5 text-white/70">
                Book a 2 BHK deep clean before 30 Nov and save 20% with code <span className="font-mono font-bold text-amber-300">CLEAN250</span>.
              </p>
              <Link to="/services/deep-home-cleaning-3bhk" className={cn(buttonStyles({ size: 'md' }), 'mt-5 bg-white text-ink-900 hover:bg-amber-50')}>
                Book deep cleaning <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-7 text-white sm:p-9">
            <Sparkles className="absolute -right-6 -top-6 h-40 w-40 text-white/[0.07]" />
            <div className="relative">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide backdrop-blur">
                For professionals
              </span>
              <h3 className="mt-4 max-w-sm font-display text-[26px] font-extrabold leading-tight sm:text-[30px]">
                Grow your business with Servora
              </h3>
              <p className="mt-2 max-w-sm text-[12.5px] leading-5 text-white/70">
                Join 500+ local businesses reaching thousands of customers. Zero setup fees, weekly payouts and a dashboard that runs your calendar.
              </p>
              <div className="mt-5 flex flex-wrap gap-5">
                {[
                  { value: '3.2×', label: 'more bookings' },
                  { value: '₹0', label: 'listing fee' },
                  { value: '7 days', label: 'payout cycle' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-lg font-extrabold">{s.value}</p>
                    <p className="text-[9.5px] text-white/60">{s.label}</p>
                  </div>
                ))}
              </div>
              <Link to="/register?role=vendor" className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-[12px] font-bold text-brand-800 transition hover:bg-brand-50">
                Become a vendor <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- Top vendors ------------------------------ */}
      <section className="border-y border-ink-100 bg-ink-50/50 py-14 sm:py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Top rated near you"
            title="Vendors customers love"
            description="Verified businesses with consistent 5-star service and fast response times."
            action={
              <Link to="/vendors" className="link-underline">
                Browse all vendors <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- How it works ----------------------------- */}
      <section className="container-page py-14 sm:py-20">
        <SectionHeading
          align="center"
          eyebrow="Simple by design"
          title="Booking a pro takes 60 seconds"
          description="No phone calls, no haggling. Just real availability, clear pricing and a professional at your door."
        />
        <div className="relative grid gap-6 md:grid-cols-3">
          <div className="absolute left-[16.6%] right-[16.6%] top-[46px] hidden h-px bg-gradient-to-r from-brand-200 via-brand-300 to-brand-200 md:block" />
          {[
            {
              icon: Search,
              step: '01',
              title: 'Find your service',
              desc: 'Search by service or category, compare verified vendors, ratings and upfront prices.',
            },
            {
              icon: CalendarDays,
              step: '02',
              title: 'Pick a real slot',
              desc: 'See live availability for your pro, staff member and location. Your slot is held while you check out.',
            },
            {
              icon: ShieldCheck,
              step: '03',
              title: 'Relax, it’s handled',
              desc: 'Track status, chat with your pro and pay securely. Review the work when it’s done.',
            },
          ].map((step) => (
            <div key={step.step} className="relative text-center">
              <div className="relative mx-auto flex h-[92px] w-[92px] items-center justify-center rounded-3xl border border-ink-200/70 bg-white shadow-card">
                <div className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <step.icon className="h-7 w-7" />
                </div>
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-[10px] font-extrabold text-white">
                  {step.step}
                </span>
              </div>
              <h3 className="mt-5 text-[15px] font-bold text-ink-900">{step.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-[12.5px] leading-6 text-ink-500">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link to="/how-it-works" className={buttonStyles({ variant: 'outline', size: 'md' })}>
            See the full booking journey <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* -------------------------------- Testimonials ----------------------------- */}
      <section className="bg-ink-950 py-16">
        <div className="container-page">
          <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-brand-300">Customer stories</p>
              <h2 className="font-display text-[26px] font-extrabold leading-tight text-white sm:text-[32px]">
                Loved by 40,000+ households
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <RatingStars value={5} size={14} showValue={false} />
                <span className="text-[12px] font-semibold text-white">4.9 out of 5</span>
                <span className="text-[11px] text-ink-400">· 12,421 verified reviews</span>
              </div>
            </div>
            <Link to="/services" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70 transition hover:text-white">
              Start booking <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                <Quote className="absolute right-4 top-4 h-8 w-8 text-white/[0.07]" />
                <RatingStars value={t.rating} size={12} showValue={false} />
                <p className="mt-3 text-[12.5px] leading-6 text-ink-300">“{t.text}”</p>
                <div className="mt-4 flex items-center gap-2.5 border-t border-white/10 pt-3.5">
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold',
                      t.tone === 'violet' ? 'bg-violet-500/20 text-violet-300' : t.tone === 'teal' ? 'bg-teal-500/20 text-teal-300' : 'bg-brand-500/20 text-brand-300',
                    )}
                  >
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                  <div className="flex-1">
                    <p className="text-[11.5px] font-bold text-white">{t.name}</p>
                    <p className="text-[9.5px] text-ink-500">{t.city} · {t.service}</p>
                  </div>
                  <BadgeCheck className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------- Stats ---------------------------------- */}
      <section className="container-page py-12">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-ink-200/70 bg-white p-6 shadow-card sm:grid-cols-4">
          {[
            { icon: TrendingUp, value: '40k+', label: 'happy customers' },
            { icon: BadgeCheck, value: '12,400+', label: 'bookings completed' },
            { icon: Clock, value: '98%', label: 'on-time arrival' },
            { icon: Heart, value: '4.9/5', label: 'average rating' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <s.icon className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="font-display text-lg font-extrabold leading-none text-ink-900">{s.value}</p>
                <p className="mt-1 text-[10.5px] text-ink-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------- FAQ ---------------------------------- */}
      <section className="container-page pb-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow mb-2.5">Good to know</p>
            <h2 className="font-display text-[26px] font-extrabold leading-tight text-ink-900 sm:text-[30px]">
              Questions, answered.
            </h2>
            <p className="mt-2.5 text-[13px] leading-6 text-ink-500">
              Everything you need to know before booking your first service. Can’t find an answer? Our support team replies in under 5 minutes.
            </p>
            <Link to="/faq" className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-700 hover:text-brand-800">
              Visit the help center <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Zap className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11.5px] font-bold text-emerald-900">Average reply time: 3 min</p>
                <p className="text-[10px] text-emerald-700">Live chat, 8 AM – 10 PM, all days</p>
              </div>
            </div>
          </div>
          <Accordion items={faqs} />
        </div>
      </section>

      {/* ----------------------------------- CTA ---------------------------------- */}
      <section className="container-page pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-12 text-center text-white sm:px-12">
          <div className="absolute inset-0 bg-grid-slate bg-grid opacity-20" />
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-[28px] font-extrabold leading-tight sm:text-[34px]">
              Your home deserves a little extra care today.
            </h2>
            <p className="mx-auto mt-2.5 max-w-lg text-[13px] leading-6 text-white/75">
              Book a verified professional in under a minute. Free cancellation up to 12 hours before your slot.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <Link to="/services" className={cn(buttonStyles({ size: 'lg' }), 'bg-white text-brand-800 hover:bg-brand-50')}>
                <Search className="h-4 w-4" /> Find a service
              </Link>
              <Link to="/categories" className={buttonStyles({ size: 'lg', variant: 'ghost', className: 'text-white ring-1 ring-inset ring-white/25 hover:bg-white/10 hover:text-white' })}>
                Browse categories
              </Link>
            </div>
            <p className="mt-4 text-[10.5px] text-white/60">No hidden charges · Verified professionals · Happiness guaranteed</p>
          </div>
        </div>
      </section>
    </div>
  );
}
