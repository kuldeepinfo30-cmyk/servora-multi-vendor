import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  CreditCard,
  FileQuestion,
  LifeBuoy,
  Mail,
  MessageSquare,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Wallet,
} from 'lucide-react';
import { Button, buttonStyles, EmptyState, Input } from '@/components/ui/primitives';

const topics = [
  {
    key: 'booking',
    title: 'Booking & scheduling',
    description: 'Slots, rescheduling, cancellations and arrival tracking.',
    icon: CalendarCheck,
    tone: 'bg-brand-50 text-brand-600',
    count: 18,
    articles: [
      'How to reschedule a confirmed booking',
      'Understanding slot holds and expiry',
      'Can I book for someone else?',
      'What to do if a pro is late',
    ],
  },
  {
    key: 'payments',
    title: 'Payments & billing',
    description: 'Cards, UPI, invoices, refunds and credit notes.',
    icon: CreditCard,
    tone: 'bg-sky-50 text-sky-600',
    count: 22,
    articles: [
      'Which payment methods are supported',
      'Where to download invoices',
      'Refund timelines explained',
      'Why a payment failed and how to retry',
    ],
  },
  {
    key: 'vendors',
    title: 'For vendors',
    description: 'Onboarding, services, staff, earnings and payouts.',
    icon: Store,
    tone: 'bg-emerald-50 text-emerald-600',
    count: 26,
    articles: [
      'Complete your vendor verification',
      'Publish your first service',
      'Add staff and set availability',
      'Understand your payout statement',
    ],
  },
  {
    key: 'trust',
    title: 'Trust & safety',
    description: 'Verification, guarantees, disputes and data privacy.',
    icon: ShieldCheck,
    tone: 'bg-violet-50 text-violet-600',
    count: 14,
    articles: [
      'How professionals are verified',
      'The Servora happiness guarantee',
      'Raise a dispute on a booking',
      'Report a safety concern',
    ],
  },
  {
    key: 'account',
    title: 'Account & access',
    description: 'Profile, addresses, notifications and security.',
    icon: Wallet,
    tone: 'bg-amber-50 text-amber-600',
    count: 12,
    articles: [
      'Update your phone or email',
      'Manage saved addresses',
      'Notification preferences',
      'Enable two-factor authentication',
    ],
  },
  {
    key: 'policy',
    title: 'Policies',
    description: 'Terms, privacy, refunds and accessibility.',
    icon: BookOpen,
    tone: 'bg-rose-50 text-rose-600',
    count: 8,
    articles: [
      'Terms of service',
      'Privacy policy',
      'Refund & cancellation policy',
      'Accessibility statement',
    ],
  },
];

const popular = [
  { title: 'Reschedule or cancel a booking', topic: 'Booking', to: '/faq#booking' },
  { title: 'How refunds are calculated', topic: 'Payments', to: '/policies/refunds' },
  { title: 'Vendor payout schedule', topic: 'Vendors', to: '/faq#vendors' },
  { title: 'Get verified as a professional', topic: 'Trust', to: '/faq#account' },
  { title: 'Update your saved addresses', topic: 'Account', to: '/customer/addresses' },
  { title: 'Tax invoices and GST details', topic: 'Billing', to: '/customer/invoices' },
];

export default function HelpPage() {
  const [query, setQuery] = useState('');

  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.articles.some((a) => a.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-100 bg-ink-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_20%_0%,rgba(99,102,241,.35),transparent_55%),radial-gradient(at_90%_20%,rgba(14,165,233,.2),transparent_50%)]" />
        <div className="container-page relative py-12 sm:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-200 ring-1 ring-white/10">
              <LifeBuoy className="h-3.5 w-3.5" /> Help centre
            </span>
            <h1 className="mt-4 font-display text-[34px] font-extrabold leading-[1.08] tracking-tight sm:text-[42px]">
              Find answers. Get unstuck.
            </h1>
            <p className="mt-3 max-w-lg text-[13.5px] leading-7 text-ink-300">
              Guides, policies and troubleshooting for customers and vendors. Still need a hand?
              Support replies in under 15 minutes.
            </p>
            <div className="mt-6 max-w-xl">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the help centre…"
                  aria-label="Search help articles"
                  className="h-12 w-full rounded-xl border border-white/15 bg-white/10 pl-11 pr-4 text-sm text-white placeholder:text-ink-400 backdrop-blur transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-ink-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> 120+ articles
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> Updated weekly
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> 4.8/5 helpfulness
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-10 sm:py-14">
        {filteredTopics.length === 0 ? (
          <EmptyState
            icon={<FileQuestion className="h-5 w-5" />}
            title="Nothing matched your search"
            description="Try a different keyword or ask our support team directly."
            action={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                  Clear search
                </Button>
                <Link to="/contact" className={buttonStyles({ size: 'sm' })}>
                  Contact support
                </Link>
              </div>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTopics.map((t) => (
              <div
                key={t.key}
                className="group flex flex-col rounded-2xl border border-ink-200/80 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-ink-300/70 hover:shadow-float"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.tone}`}>
                  <t.icon className="h-5 w-5" />
                </span>
                <div className="mt-3 flex items-center gap-2">
                  <h2 className="text-[14.5px] font-bold text-ink-900">{t.title}</h2>
                  <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[9.5px] font-bold text-ink-500">
                    {t.count}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] leading-5 text-ink-500">{t.description}</p>
                <ul className="mt-3 space-y-0.5 border-t border-ink-100 pt-2">
                  {t.articles.map((a) => (
                    <li key={a}>
                      <Link
                        to="/faq"
                        className="flex items-center gap-1.5 rounded-md py-1.5 text-[11.5px] font-medium text-ink-600 transition hover:text-brand-700"
                      >
                        <ChevronRight className="h-3 w-3 shrink-0 text-ink-300" />
                        {a}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/faq"
                  className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-bold text-brand-700 hover:text-brand-800"
                >
                  Browse all articles <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-ink-100 bg-ink-50/60">
        <div className="container-page grid gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink-900">Popular articles</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-ink-200 bg-white">
              {popular.map((p, i) => (
                <Link
                  key={p.title}
                  to={p.to}
                  className="flex items-center gap-3 border-b border-ink-100 px-4 py-3.5 transition last:border-0 hover:bg-ink-50/70"
                >
                  <span className="w-5 text-[10.5px] font-bold text-ink-300">{String(i + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink-700">{p.title}</span>
                  <span className="hidden rounded-full bg-ink-100 px-2 py-0.5 text-[9.5px] font-semibold text-ink-500 sm:inline">
                    {p.topic}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-ink-300" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <MessageSquare className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="text-[14px] font-bold text-ink-900">Talk to a human</h2>
                <p className="text-[10.5px] text-ink-400">7 AM – 11 PM IST, all days</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Link
                to="/contact"
                className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <MessageSquare className="h-4 w-4 text-brand-600" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-bold text-ink-800">Live chat</span>
                  <span className="block text-[10.5px] text-ink-500">Fastest · avg. reply 4 min</span>
                </span>
                <BadgeDot />
              </Link>
              <a
                href="mailto:support@servora.demo"
                className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <Mail className="h-4 w-4 text-brand-600" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-bold text-ink-800">Email support</span>
                  <span className="block text-[10.5px] text-ink-500">support@servora.demo</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
              </a>
              <a
                href="tel:+918000001234"
                className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <Phone className="h-4 w-4 text-brand-600" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-bold text-ink-800">Priority phone</span>
                  <span className="block text-[10.5px] text-ink-500">For active bookings · Gold+</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
              </a>
            </div>
            <div className="mt-4 rounded-xl bg-ink-50 p-3">
              <p className="text-[10.5px] leading-5 text-ink-500">
                Have an active booking? Open it from{' '}
                <Link to="/customer/bookings" className="font-bold text-brand-700">
                  My bookings
                </Link>{' '}
                for a priority support thread with full context.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Sparkles, title: 'Happiness guarantee', text: 'Not happy with a service? Free re-do or your money back.', to: '/policies/refunds' },
            { icon: ShieldCheck, title: 'Verified professionals', text: 'ID, background and skill checks on every pro.', to: '/policies/terms' },
            { icon: CreditCard, title: 'Secure payments', text: 'PCI-DSS gateway, transparent invoices, fast refunds.', to: '/policies/privacy' },
          ].map((c) => (
            <Link
              key={c.title}
              to={c.to}
              className="rounded-2xl border border-ink-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/30"
            >
              <c.icon className="h-4.5 w-4.5 text-brand-600" />
              <p className="mt-2 text-[12.5px] font-bold text-ink-900">{c.title}</p>
              <p className="mt-0.5 text-[11px] leading-5 text-ink-500">{c.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function BadgeDot() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
    </span>
  );
}
