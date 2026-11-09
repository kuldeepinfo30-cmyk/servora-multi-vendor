import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CreditCard,
  Heart,
  Globe2,
  Info,
  Landmark,
  Mail,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Users,
  Zap,
} from 'lucide-react';
import { buttonStyles } from '@/components/ui/primitives';
import { GithubIcon, LinkedinIcon } from '@/components/ui/brand-icons';
import { SectionHeading, SmartImage } from '@/components/marketplace';
import { IMAGES } from '@/lib/data';
import { DEMO_FEATURES, OWNER } from '@/lib/owner';

const values = [
  { icon: ShieldCheck, title: 'Trust is earned', desc: 'Every professional is KYC-verified, background-checked and held to a measurable quality bar. No exceptions.' },
  { icon: Zap, title: 'Respect the clock', desc: 'Your time is the product. Real availability, arrival tracking and an on-time promise on every booking.' },
  { icon: Heart, title: 'Human by default', desc: 'Real people answer support, vendors are partners and disputes are reviewed with context — not bots.' },
  { icon: Globe2, title: 'Local first', desc: 'We build for neighbourhoods, not just cities. Local expertise, local jobs and local accountability.' },
];

const timeline = [
  { year: '2019', title: 'A messy problem', desc: 'Two founders spent three weeks finding a reliable plumber in Mumbai. Servora starts as a spreadsheet of verified pros.' },
  { year: '2021', title: 'First 100 vendors', desc: 'Onboarding, KYC and payouts are built from scratch. Deep cleaning becomes the first category to cross 1,000 bookings.' },
  { year: '2023', title: 'One marketplace, three portals', desc: 'Customer, vendor and admin experiences launch together, along with real-time scheduling and split settlements.' },
  { year: '2026', title: '40,000 homes, 8 cities', desc: '500+ verified businesses, 12 categories and a 4.9 average rating — still obsessing over the same details.' },
];

const team = [
  { name: 'Aisha Khan', role: 'Co-founder & CEO', tone: 'violet', bio: 'Ex-marketplace operator. Believes trust is a product feature.' },
  { name: 'Rohan Nair', role: 'Co-founder & CTO', tone: 'brand', bio: 'Built scheduling systems at scale. Obsessed with atomic bookings.' },
  { name: 'Neha Kulkarni', role: 'Head of Marketplace', tone: 'emerald', bio: 'Grew SparkleHome from 2 to 60 staff before joining Servora.' },
  { name: 'Rahul Menon', role: 'Head of Finance', tone: 'amber', bio: 'Runs commissions, payouts and reconciliation with zero tolerance for drift.' },
];

export default function AboutPage() {
  const bankRows = [
    OWNER.bank.accountHolder ? { label: 'Account holder', value: OWNER.bank.accountHolder } : null,
    OWNER.bank.accountNumber ? { label: 'Account number', value: OWNER.bank.accountNumber } : null,
    OWNER.bank.ifsc ? { label: 'IFSC code', value: OWNER.bank.ifsc } : null,
    OWNER.bank.bankName ? { label: 'Bank & branch', value: [OWNER.bank.bankName, OWNER.bank.branch].filter(Boolean).join(' · ') } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-100 bg-mesh">
        <div className="container-page py-12 sm:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="eyebrow mb-3">Our story</p>
              <h1 className="max-w-xl font-display text-[34px] font-extrabold leading-[1.08] tracking-tight text-ink-900 sm:text-[44px]">
                Local services deserve <span className="gradient-text">a better marketplace.</span>
              </h1>
              <p className="mt-4 max-w-lg text-[13.5px] leading-7 text-ink-600">
                Servora started with a simple frustration: finding a reliable professional should not depend on
                WhatsApp forwards and blind luck. We built the marketplace we wanted as customers — and the
                business tools we wished existed as vendors.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link to="/services" className={buttonStyles({ size: 'lg' })}>Explore the marketplace <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/contact" className={buttonStyles({ variant: 'outline', size: 'lg' })}>Talk to us</Link>
              </div>
            </div>
            <div className="relative">
              <SmartImage src={IMAGES.interior} alt="A well-kept home" className="aspect-[4/3] rounded-2xl shadow-float" />
              <div className="absolute -bottom-4 -left-4 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-float">
                <p className="text-[9.5px] uppercase tracking-wide text-ink-400">Founded in</p>
                <p className="font-display text-xl font-extrabold text-ink-900">Mumbai, 2019</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-brand-200 bg-brand-50">
        <div className="container-page flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Info className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-brand-900">
              Heads up — this is a demo project, not a running business
            </p>
            <p className="mt-1 max-w-3xl text-[12px] leading-6 text-brand-800">
              Everything on this site is real, working software: a complete multi-vendor marketplace with a
              customer website, a vendor portal and an admin console. Bookings, payouts, notifications and
              payments run in sandbox mode, so no money actually moves and no real service is delivered.
            </p>
            <ul className="mt-3 grid gap-1.5 text-[11.5px] text-brand-800 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" strokeWidth={3} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-ink-100">
        <div className="container-page grid grid-cols-2 gap-6 py-8 sm:grid-cols-4">
          {[
            { value: '40,000+', label: 'households served' },
            { value: '500+', label: 'verified businesses' },
            { value: '12,400+', label: 'completed bookings' },
            { value: '4.9/5', label: 'average rating' },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-[28px] font-extrabold leading-none tracking-tight text-ink-900">{s.value}</p>
              <p className="mt-1.5 text-[11px] text-ink-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-14">
        <SectionHeading eyebrow="What we believe" title="Four principles we refuse to compromise" description="They sound obvious. Most marketplaces still get them wrong." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-ink-200/80 bg-white p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><v.icon className="h-5 w-5" /></span>
              <h3 className="mt-3 text-[13.5px] font-bold text-ink-900">{v.title}</h3>
              <p className="mt-1.5 text-[11.5px] leading-5 text-ink-500">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-ink-100 bg-ink-50/50 py-14">
        <div className="container-page">
          <SectionHeading eyebrow="The journey" title="From spreadsheet to 8 cities" />
          <div className="relative grid gap-5 lg:grid-cols-4">
            <div className="absolute left-0 right-0 top-[26px] hidden h-px bg-ink-200 lg:block" />
            {timeline.map((t) => (
              <div key={t.year} className="relative">
                <span className="relative z-10 inline-flex h-[54px] items-center rounded-full border border-ink-200 bg-white px-4 font-display text-[15px] font-extrabold text-brand-700 shadow-soft">
                  {t.year}
                </span>
                <h3 className="mt-4 text-[13.5px] font-bold text-ink-900">{t.title}</h3>
                <p className="mt-1.5 text-[11.5px] leading-5 text-ink-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <SectionHeading eyebrow="Leadership" title="The people behind the platform" description="Operators, engineers and marketplace specialists who have been on both sides of the booking." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m) => (
            <div key={m.name} className="rounded-2xl border border-ink-200/80 bg-white p-5 text-center">
              <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-extrabold ${m.tone === 'violet' ? 'bg-violet-100 text-violet-700' : m.tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' : m.tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-brand-100 text-brand-700'}`}>
                {m.name.split(' ').map((n) => n[0]).join('')}
              </span>
              <h3 className="mt-3 text-[13.5px] font-bold text-ink-900">{m.name}</h3>
              <p className="text-[10.5px] font-semibold text-brand-600">{m.role}</p>
              <p className="mt-2 text-[11px] leading-5 text-ink-500">{m.bio}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-ink-100 bg-ink-50/50 py-12">
        <div className="container-page">
          <p className="mb-6 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">As featured in</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {['YourStory', 'Economic Times', 'Inc42', 'Mint', 'TechCrunch'].map((brand) => (
              <span key={brand} className="font-display text-lg font-extrabold text-ink-300">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-ink-100 bg-ink-50/50 py-14">
        <div className="container-page">
          <SectionHeading
            eyebrow="Payments & payouts"
            title="A real payment flow, running in sandbox"
            description="Razorpay orders are created on the server, signatures are verified with HMAC, and every booking is split between the platform and the vendor automatically."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-ink-200/80 bg-white p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <CreditCard className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-[13.5px] font-bold text-ink-900">Razorpay gateway</h3>
              <p className="mt-1.5 text-[11.5px] leading-5 text-ink-500">
                Connected in test mode. Customers can pay by UPI, card, net banking or wallet, and the platform
                keeps its 12.5% commission while the rest is settled to the vendor.
              </p>
              <p className="mt-3 text-[10.5px] font-bold uppercase tracking-wide text-amber-700">Sandbox · no real charge</p>
            </div>

            <div className="rounded-2xl border border-ink-200/80 bg-white p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Smartphone className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-[13.5px] font-bold text-ink-900">UPI</h3>
              <p className="mt-1.5 text-[11.5px] leading-5 text-ink-500">
                Payments and settlements in this demo are pointed at this UPI ID.
              </p>
              <p className="mt-3 inline-flex rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1.5 font-mono text-[11.5px] font-semibold text-ink-800">
                {OWNER.upi}
              </p>
            </div>

            {bankRows.length > 0 && (
              <div className="rounded-2xl border border-ink-200/80 bg-white p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Landmark className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-[13.5px] font-bold text-ink-900">Payout bank account</h3>
                <p className="mt-1.5 text-[11.5px] leading-5 text-ink-500">
                  Vendor settlements are transferred to this account.
                </p>
                <dl className="mt-3 space-y-1.5">
                  {bankRows.map((row) => (
                    <div key={row.label} className="flex items-start justify-between gap-3 text-[11px]">
                      <dt className="text-ink-400">{row.label}</dt>
                      <dd className="text-right font-semibold text-ink-800">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <SectionHeading
          eyebrow="Who built this"
          title="One developer, the whole stack"
          description="This marketplace is a solo build — design, frontend, backend, payments and infrastructure."
        />
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-ink-200/80 bg-white p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-[17px] font-extrabold text-white">
                {OWNER.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
              </span>
              <div>
                <h3 className="font-display text-lg font-extrabold text-ink-900">{OWNER.name}</h3>
                <p className="text-[11.5px] font-semibold text-brand-600">{OWNER.role}</p>
              </div>
            </div>
            <p className="mt-4 text-[12px] leading-6 text-ink-600">{OWNER.bio}</p>
            {(OWNER.email || OWNER.github || OWNER.linkedin) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {OWNER.email && (
                  <a
                    href={`mailto:${OWNER.email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-[11.5px] font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    <Mail className="h-3.5 w-3.5" /> Email
                  </a>
                )}
                {OWNER.github && (
                  <a
                    href={OWNER.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-[11.5px] font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    <GithubIcon className="h-3.5 w-3.5" /> GitHub
                  </a>
                )}
                {OWNER.linkedin && (
                  <a
                    href={OWNER.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-[11.5px] font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    <LinkedinIcon className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
            <Sparkles className="h-6 w-6 text-amber-300" />
            <h3 className="mt-3 font-display text-lg font-extrabold">Want a walkthrough?</h3>
            <p className="mt-1.5 text-[12px] leading-6 text-white/70">
              I can demo the customer site, the vendor portal, the admin console or the API behind them — just
              reach out.
            </p>
            <Link
              to="/contact"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[11.5px] font-bold text-brand-800 hover:bg-brand-50"
            >
              Get in touch <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-ink-200/80 bg-white p-6">
            <Users className="h-6 w-6 text-brand-600" />
            <h3 className="mt-3 font-display text-lg font-extrabold text-ink-900">We are hiring builders</h3>
            <p className="mt-1.5 text-[12px] leading-6 text-ink-500">
              Designers, engineers and marketplace operators who care about the last 5% of polish. Remote-friendly across India.
            </p>
            <Link to="/contact" className={buttonStyles({ variant: 'outline', size: 'sm', className: 'mt-4' })}>See open roles <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
            <Sparkles className="h-6 w-6 text-amber-300" />
            <h3 className="mt-3 font-display text-lg font-extrabold">Work with us</h3>
            <p className="mt-1.5 text-[12px] leading-6 text-white/70">
              Run a local service business? Join a marketplace that invests in your growth, not just your listing.
            </p>
            <Link to="/register?role=vendor" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[11.5px] font-bold text-brand-800 hover:bg-brand-50">
              Become a vendor <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
