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
  Quote,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Users,
  Zap,
} from 'lucide-react';
import { buttonStyles } from '@/components/ui/primitives';
import { GithubIcon, LinkedinIcon } from '@/components/ui/brand-icons';
import { SmartImage } from '@/components/marketplace';
import { IMAGES } from '@/lib/data';
import { usePageMeta } from '@/lib/hooks';
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

const factSheet = [
  { label: 'Founded', value: 'Mumbai, 2019' },
  { label: 'Today', value: '8 cities · 12 categories' },
  { label: 'Verified vendors', value: '500+ businesses' },
  { label: 'Households served', value: '40,000+ homes' },
  { label: 'Average rating', value: '4.9 / 5' },
];

/** Numbered, left-aligned chapter header — the editorial thread that runs
 *  through this page and keeps it visually distinct from How-it-works. */
function Chapter({ index, eyebrow, title, description }: { index: string; eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-7 flex items-start gap-4">
      <span className="mt-0.5 font-display text-[13px] font-extrabold tabular-nums text-amber-600">{index}</span>
      <div className="min-w-0 flex-1 border-l-2 border-amber-300/70 pl-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">{eyebrow}</p>
        <h2 className="mt-1.5 font-display text-[24px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-[29px]">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-[12.5px] leading-6 text-ink-500">{description}</p>}
      </div>
    </div>
  );
}

export default function AboutPage() {
  usePageMeta({
    title: 'About Servora — why we built a local services marketplace',
    description:
      'The story, principles and people behind Servora: a multi-vendor marketplace for verified local home services across India.',
  });

  const bankRows = [
    OWNER.bank.accountHolder ? { label: 'Account holder', value: OWNER.bank.accountHolder } : null,
    OWNER.bank.accountNumber ? { label: 'Account number', value: OWNER.bank.accountNumber } : null,
    OWNER.bank.ifsc ? { label: 'IFSC code', value: OWNER.bank.ifsc } : null,
    OWNER.bank.bankName ? { label: 'Bank & branch', value: [OWNER.bank.bankName, OWNER.bank.branch].filter(Boolean).join(' · ') } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div>
      {/* ── Masthead — light & warm, deliberately the opposite of the dark How-it-works hero ── */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-ink-50/70">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="container-page relative py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-white/70 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-700">
                <Quote className="h-3.5 w-3.5" /> Our story
              </p>
              <h1 className="mt-4 max-w-xl font-display text-[34px] font-extrabold leading-[1.08] tracking-tight text-ink-900 sm:text-[46px]">
                We built Servora because good help <span className="text-amber-600">shouldn’t be luck.</span>
              </h1>
              <p className="mt-4 max-w-lg text-[13.5px] leading-7 text-ink-600">
                Finding a reliable professional should not depend on WhatsApp forwards and blind luck. We built the
                marketplace we wanted as customers — and the business tools we wished existed as vendors.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link to="/services" className={buttonStyles({ size: 'lg' })}>Explore the marketplace <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/how-it-works" className={buttonStyles({ variant: 'outline', size: 'lg' })}>See how it works</Link>
                <Link to="/contact" className={buttonStyles({ variant: 'ghost', size: 'lg' })}>Talk to us</Link>
              </div>
            </div>

            <div className="rounded-2xl border border-ink-200/80 bg-white p-6 shadow-float">
              <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
                <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl">
                  <SmartImage src={IMAGES.interior} alt="A well-kept home" className="h-11 w-11" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Company fact sheet</p>
                  <p className="font-display text-[15px] font-extrabold text-ink-900">Servora, at a glance</p>
                </div>
              </div>
              <dl className="mt-1 divide-y divide-ink-100">
                {factSheet.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
                    <dt className="text-[11.5px] text-ink-500">{row.label}</dt>
                    <dd className="text-right text-[12px] font-bold text-ink-900">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ── Demo disclaimer ── */}
      <section className="border-b border-amber-200/70 bg-amber-50">
        <div className="container-page flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Info className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-amber-900">
              Heads up — this is a demo project, not a running business
            </p>
            <p className="mt-1 max-w-3xl text-[12px] leading-6 text-amber-800">
              Everything on this site is real, working software: a complete multi-vendor marketplace with a
              customer website, a vendor portal and an admin console. Bookings, payouts, notifications and
              payments run in sandbox mode, so no money actually moves and no real service is delivered.
            </p>
            <ul className="mt-3 grid gap-1.5 text-[11.5px] text-amber-800 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" strokeWidth={3} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 01 · What we believe ── */}
      <section className="container-page py-14">
        <Chapter
          index="01"
          eyebrow="What we believe"
          title="Four principles we refuse to compromise"
          description="They sound obvious. Most marketplaces still get them wrong."
        />
        <div className="grid gap-px overflow-hidden rounded-2xl border border-ink-200/80 bg-ink-200/70 sm:grid-cols-2">
          {values.map((v, i) => (
            <div key={v.title} className="relative bg-white p-6">
              <span className="pointer-events-none absolute right-5 top-3 font-display text-[44px] font-extrabold leading-none text-ink-100">
                0{i + 1}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <v.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3.5 text-[14px] font-bold text-ink-900">{v.title}</h3>
              <p className="mt-1.5 max-w-md text-[11.5px] leading-5 text-ink-500">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 02 · The journey ── */}
      <section className="border-y border-ink-100 bg-ink-50/50 py-14">
        <div className="container-page">
          <Chapter index="02" eyebrow="The journey" title="From a spreadsheet to 8 cities" />
          <div className="relative grid gap-5 lg:grid-cols-4">
            <div className="absolute left-0 right-0 top-[13px] hidden h-px bg-amber-300/70 lg:block" />
            {timeline.map((t) => (
              <div key={t.year} className="relative">
                <span className="relative z-10 block h-[26px] w-[26px] rounded-full border-2 border-amber-400 bg-white shadow-soft" />
                <p className="mt-3 font-display text-[15px] font-extrabold text-amber-700">{t.year}</p>
                <h3 className="mt-1 text-[13.5px] font-bold text-ink-900">{t.title}</h3>
                <p className="mt-1.5 text-[11.5px] leading-5 text-ink-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 03 · Leadership ── */}
      <section className="container-page py-14">
        <Chapter
          index="03"
          eyebrow="Leadership"
          title="The people behind the platform"
          description="Operators, engineers and marketplace specialists who have been on both sides of the booking."
        />
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

      {/* ── Featured in ── */}
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

      {/* ── 04 · Payments & payouts ── */}
      <section className="container-page py-14">
        <Chapter
          index="04"
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
      </section>

      {/* ── 05 · Who built this ── */}
      <section className="border-y border-ink-100 bg-ink-50/50 py-14">
        <div className="container-page">
          <Chapter
            index="05"
            eyebrow="Who built this"
            title="One developer, the whole stack"
            description="This marketplace is a solo build — design, frontend, backend, payments and infrastructure."
          />
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-ink-200/80 bg-white p-6">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 font-display text-[17px] font-extrabold text-white">
                  {OWNER.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                </span>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-ink-900">{OWNER.name}</h3>
                  <p className="text-[11.5px] font-semibold text-amber-700">{OWNER.role}</p>
                </div>
              </div>
              <p className="mt-4 text-[12px] leading-6 text-ink-600">{OWNER.bio}</p>
              {(OWNER.email || OWNER.github || OWNER.linkedin) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {OWNER.email && (
                    <a
                      href={`mailto:${OWNER.email}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-[11.5px] font-bold text-ink-700 transition hover:border-amber-300 hover:text-amber-700"
                    >
                      <Mail className="h-3.5 w-3.5" /> Email
                    </a>
                  )}
                  {OWNER.github && (
                    <a
                      href={OWNER.github}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-[11.5px] font-bold text-ink-700 transition hover:border-amber-300 hover:text-amber-700"
                    >
                      <GithubIcon className="h-3.5 w-3.5" /> GitHub
                    </a>
                  )}
                  {OWNER.linkedin && (
                    <a
                      href={OWNER.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-[11.5px] font-bold text-ink-700 transition hover:border-amber-300 hover:text-amber-700"
                    >
                      <LinkedinIcon className="h-3.5 w-3.5" /> LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-amber-600 to-rose-700 p-6 text-white">
              <Sparkles className="h-6 w-6 text-amber-200" />
              <h3 className="mt-3 font-display text-lg font-extrabold">Want a walkthrough?</h3>
              <p className="mt-1.5 text-[12px] leading-6 text-white/75">
                I can demo the customer site, the vendor portal, the admin console or the API behind them — just
                reach out.
              </p>
              <Link
                to="/contact"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[11.5px] font-bold text-amber-800 hover:bg-amber-50"
              >
                Get in touch <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing ── */}
      <section className="container-page py-14">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-ink-200/80 bg-white p-6">
            <Users className="h-6 w-6 text-amber-600" />
            <h3 className="mt-3 font-display text-lg font-extrabold text-ink-900">We are hiring builders</h3>
            <p className="mt-1.5 text-[12px] leading-6 text-ink-500">
              Designers, engineers and marketplace operators who care about the last 5% of polish. Remote-friendly across India.
            </p>
            <Link to="/contact" className={buttonStyles({ variant: 'outline', size: 'sm', className: 'mt-4' })}>See open roles <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-600 to-rose-700 p-6 text-white">
            <Sparkles className="h-6 w-6 text-amber-200" />
            <h3 className="mt-3 font-display text-lg font-extrabold">Work with us</h3>
            <p className="mt-1.5 text-[12px] leading-6 text-white/75">
              Run a local service business? Join a marketplace that invests in your growth, not just your listing.
            </p>
            <Link to="/register?role=vendor" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[11.5px] font-bold text-amber-800 hover:bg-amber-50">
              Become a vendor <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
