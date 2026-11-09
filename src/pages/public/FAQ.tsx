import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  LifeBuoy,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
} from 'lucide-react';
import { Accordion } from '@/components/ui/overlays';
import { Button, buttonStyles, EmptyState, Input } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

const groups = [
  {
    key: 'booking',
    label: 'Booking & scheduling',
    icon: CalendarCheck,
    items: [
      {
        q: 'How do I reschedule or cancel a booking?',
        a: 'Open the booking from My bookings, then choose Reschedule or Cancel. Rescheduling is free up to 24 hours before the slot. Cancellations follow the vendor’s policy, shown on the service page and in your confirmation email — flexible services are fully refundable up to 12 hours before.',
      },
      {
        q: 'Can I choose a specific professional?',
        a: 'Yes. On any service page, select your preferred professional from the team list before picking a slot. Availability updates in real time. If you have no preference we assign the best-rated professional available.',
      },
      {
        q: 'What happens if a professional is late?',
        a: 'You can track arrival in the booking timeline. If the professional is more than 20 minutes late without notice, you can cancel for a full refund or ask support to reassign your booking at no extra cost.',
      },
      {
        q: 'Are same-day bookings available?',
        a: 'Many services offer same-day slots. Look for the “Available today” badge, then choose a time at least two hours from now. Instant confirmation services book immediately; request-based services confirm within 30 minutes.',
      },
    ],
  },
  {
    key: 'payments',
    label: 'Payments & refunds',
    icon: CreditCard,
    items: [
      {
        q: 'Which payment methods can I use?',
        a: 'UPI, credit and debit cards, net banking and popular wallets. Payments are processed by our PCI-DSS compliant gateway — Servora never stores your card details. Cash on service is available for eligible vendors.',
      },
      {
        q: 'When am I charged?',
        a: 'You authorise payment at checkout, and funds are captured when the vendor accepts your booking. For instant-confirmation services, capture happens immediately. If a request is declined, the authorisation is released within 3–5 business days.',
      },
      {
        q: 'How long do refunds take?',
        a: 'Approved refunds reach the original payment method in 5–7 business days. UPI refunds are usually instant. You can track every refund in Payments → Refunds, and download a credit note from Invoices.',
      },
      {
        q: 'Is a tip included?',
        a: 'No. Tips are optional and 100% go to the professional. You can add a tip after the service from the booking page or your review screen.',
      },
    ],
  },
  {
    key: 'vendors',
    label: 'For vendors',
    icon: Store,
    items: [
      {
        q: 'How do I become a verified vendor?',
        a: 'Create a vendor account, complete the five-step onboarding wizard and upload your business documents. Our trust team reviews applications within 2 business days. You can save progress and come back at any time.',
      },
      {
        q: 'How are commissions calculated?',
        a: 'Commission is a percentage of each completed booking, set by category (typically 10–18%). It is deducted automatically at settlement, and every line item is visible in Earnings → Payout breakdown.',
      },
      {
        q: 'When do payouts arrive?',
        a: 'Payouts run weekly on Tuesdays for the previous Monday–Sunday period. Requests received before Monday 6 PM IST are included in that week’s run. Bank transfers settle within 1–2 business days.',
      },
      {
        q: 'Can I manage multiple staff and their calendars?',
        a: 'Yes. Add staff, assign services and commission, and manage individual availability from Staff and Calendar. Bookings automatically route to the right professional without double-booking.',
      },
    ],
  },
  {
    key: 'account',
    label: 'Account, trust & safety',
    icon: ShieldCheck,
    items: [
      {
        q: 'How do you verify professionals?',
        a: 'Every professional completes government ID verification, a police background check and a skills assessment. Businesses also submit GST and registration documents. Verification badges show exactly what has been checked.',
      },
      {
        q: 'What if I am not satisfied with the service?',
        a: 'Report the issue from the booking within 48 hours. Our resolution team can arrange a free re-do, a partial refund or a full refund depending on evidence. Disputes are reviewed by a human within one business day.',
      },
      {
        q: 'How is my data protected?',
        a: 'We encrypt data in transit and at rest, minimise what we collect, and never sell personal data. Address details are shared with a vendor only after a booking is confirmed. Read the full privacy policy for details.',
      },
    ],
  },
];

const quickLinks = [
  { label: 'Track a booking', to: '/customer/bookings', icon: CalendarCheck },
  { label: 'Payments & refunds', to: '/customer/payments', icon: CreditCard },
  { label: 'Become a vendor', to: '/vendor/onboarding', icon: Store },
  { label: 'Contact support', to: '/contact', icon: MessageSquare },
];

export default function FAQPage() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-100 bg-mesh">
        <div className="container-page py-12 text-center sm:py-16">
          <span className="eyebrow justify-center">
            <Sparkles className="h-3.5 w-3.5" /> Help centre
          </span>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-[34px] font-extrabold leading-[1.08] tracking-tight text-ink-900 sm:text-[42px]">
            Questions, answered <span className="gradient-text">clearly.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[13.5px] leading-7 text-ink-600">
            Everything about booking, payments, trust and running your business on Servora. Can’t
            find it? Our team replies in under 15 minutes.
          </p>
          <div className="mx-auto mt-6 max-w-xl">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions, e.g. refund, reschedule, payout…"
              icon={<Search className="h-4 w-4" />}
              aria-label="Search frequently asked questions"
            />
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {groups.map((g) => (
              <button
                key={g.key}
                onClick={() => setActive(active === g.key ? null : g.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11.5px] font-semibold transition',
                  active === g.key
                    ? 'border-brand-300 bg-brand-50 text-brand-700'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                )}
              >
                <g.icon className="h-3.5 w-3.5" />
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-8">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<LifeBuoy className="h-5 w-5" />}
                title="No questions matched your search"
                description="Try a shorter phrase, or talk to a human — we’re happy to help."
                action={
                  <Link to="/contact" className={buttonStyles({ size: 'sm' })}>
                    Contact support
                  </Link>
                }
              />
            ) : (
              filtered
                .filter((g) => !active || g.key === active)
                .map((group) => (
                  <div key={group.key} id={group.key}>
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <group.icon className="h-4 w-4" />
                      </span>
                      <h2 className="font-display text-lg font-extrabold text-ink-900">{group.label}</h2>
                      <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10.5px] font-bold text-ink-500">
                        {group.items.length}
                      </span>
                    </div>
                    <Accordion items={group.items.map((i) => ({ question: i.q, answer: i.a }))} />
                  </div>
                ))
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
              <h3 className="text-[14px] font-bold text-ink-900">Popular right now</h3>
              <div className="mt-3 space-y-1">
                {quickLinks.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[12.5px] font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
                  >
                    <l.icon className="h-4 w-4 text-ink-400" />
                    {l.label}
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-ink-300" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-ink-950 p-5 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <HeadsetIcon />
              </span>
              <h3 className="mt-3 font-display text-[15px] font-extrabold">Still stuck?</h3>
              <p className="mt-1.5 text-[11.5px] leading-5 text-ink-300">
                Real humans, 7 AM – 11 PM IST, every day. Average first reply: 4 minutes.
              </p>
              <Link
                to="/contact"
                className={buttonStyles({ size: 'sm', className: 'mt-3 w-full bg-white text-ink-900 hover:bg-ink-100' })}
              >
                Chat with support
              </Link>
            </div>

            <div className="rounded-2xl border border-ink-200 bg-ink-50/60 p-4">
              <p className="flex items-center gap-2 text-[12px] font-bold text-ink-800">
                <UserRound className="h-4 w-4 text-brand-600" /> New to Servora?
              </p>
              <p className="mt-1 text-[11px] leading-5 text-ink-500">
                See how booking works end-to-end, from search to review.
              </p>
              <Link to="/how-it-works" className="mt-2 inline-flex text-[11.5px] font-bold text-brand-700 hover:text-brand-800">
                How it works →
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-ink-50/60">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink-900">Ready to book with confidence?</h2>
            <p className="mt-1 text-[13px] text-ink-500">Verified pros, transparent pricing and a happiness guarantee.</p>
          </div>
          <div className="flex gap-2.5">
            <Link to="/services" className={buttonStyles({ size: 'md' })}>
              Explore services <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/help" className={buttonStyles({ variant: 'outline', size: 'md' })}>
              Visit help centre
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeadsetIcon() {
  return <LifeBuoy className="h-4.5 w-4.5" />;
}
