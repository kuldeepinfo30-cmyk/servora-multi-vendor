import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Lock,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import { buttonStyles } from '@/components/ui/primitives';
import { Accordion } from '@/components/ui/overlays';
import { SectionHeading, SmartImage, TrustStrip } from '@/components/marketplace';
import { IMAGES } from '@/lib/data';

const customerSteps = [
  { icon: Search, title: 'Find a service', desc: 'Search by category or service, compare verified vendors, prices and real reviews.' },
  { icon: CalendarDays, title: 'Choose a real slot', desc: 'See live availability that respects working hours, buffers, leave and existing bookings.' },
  { icon: FileText, title: 'Share the details', desc: 'Add your address, participants and any custom questions the vendor needs answered.' },
  { icon: CreditCard, title: 'Pay securely', desc: 'Choose UPI, card, net banking or cash after service where the vendor allows it.' },
  { icon: CheckCircle2, title: 'Get confirmed', desc: 'Instant bookings confirm immediately. Request-to-book services wait for vendor approval.' },
  { icon: MessageSquare, title: 'Track & review', desc: 'Chat with your pro, follow the status timeline and review the work when it is done.' },
];

const vendorSteps = [
  { icon: BadgeCheck, title: 'Apply & verify', desc: 'Submit business details, documents and payout information for KYC review.' },
  { icon: Sparkles, title: 'Build your catalogue', desc: 'Add services, pricing, add-ons, availability rules and booking questions.' },
  { icon: CalendarCheck, title: 'Manage bookings', desc: 'Accept requests, assign staff, block time and track every appointment.' },
  { icon: Wallet, title: 'Get paid', desc: 'Track gross and net earnings, request payouts and download settlement statements.' },
];

const journey = [
  { step: '01', customer: 'Choose service, vendor and optionally staff', system: 'Shows live price, duration and the earliest available slot.' },
  { step: '02', customer: 'Select date and an available time slot', system: 'Slots respect working hours, leave, buffers and existing bookings.' },
  { step: '03', customer: 'Continue to checkout', system: 'The slot is temporarily held and a countdown starts.' },
  { step: '04', customer: 'Enter address, participants and answers', system: 'Validates serviceability, access notes and custom questions.' },
  { step: '05', customer: 'Complete payment or choose cash', system: 'Server-calculated totals; card/UPI handled by the gateway.' },
  { step: '06', customer: 'Vendor approval (if request-to-book)', system: 'Vendor accepts or rejects within the response window.' },
  { step: '07', customer: 'Booking confirmed', system: 'Confirmation, reminders and status updates are scheduled.' },
  { step: '08', customer: 'Service completed & reviewed', system: 'Invoice issued, review unlocked and payout ledger updated.' },
];

export default function HowItWorksPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-100 bg-mesh">
        <div className="container-page py-12 sm:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-3">How Servora works</p>
              <h1 className="max-w-xl font-display text-[34px] font-extrabold leading-[1.08] tracking-tight text-ink-900 sm:text-[44px]">
                From “I need this fixed” to <span className="gradient-text">done.</span>
              </h1>
              <p className="mt-4 max-w-lg text-[13.5px] leading-7 text-ink-600">
                A marketplace built around real availability, transparent pricing and accountability.
                Here is exactly what happens from search to review — for customers and vendors.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link to="/services" className={buttonStyles({ size: 'lg' })}>Book a service <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/register?role=vendor" className={buttonStyles({ variant: 'outline', size: 'lg' })}>Join as a vendor</Link>
              </div>
            </div>
            <div className="relative">
              <SmartImage src={IMAGES.cleaning} alt="Service booking in progress" className="aspect-[4/3] rounded-2xl shadow-float" />
              <div className="absolute -bottom-4 -left-4 w-52 rounded-xl border border-ink-100 bg-white p-3.5 shadow-float">
                <p className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Booking confirmed</p>
                <p className="mt-1 text-[11px] font-semibold text-ink-800">SRV-24122 · Wed, 10:00 AM</p>
                <p className="mt-0.5 text-[9.5px] text-ink-400">Ravi Kumar · AC Service</p>
              </div>
              <div className="absolute -right-3 top-4 rounded-lg bg-ink-900 px-3 py-2 text-white shadow-float">
                <p className="text-[9px] text-white/50">Slot held</p>
                <p className="font-mono text-[12px] font-bold">09:58</p>
              </div>
            </div>
          </div>
          <TrustStrip className="mt-10" />
        </div>
      </section>

      <section className="container-page py-14">
        <SectionHeading eyebrow="For customers" title="Six steps to a job well done" description="No phone tag, no surprise quotes. Everything happens in one place." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customerSteps.map((step, i) => (
            <div key={step.title} className="relative rounded-2xl border border-ink-200/80 bg-white p-5 transition hover:shadow-card">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><step.icon className="h-5 w-5" /></span>
                <span className="font-display text-2xl font-extrabold text-ink-100">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-3 text-[14px] font-bold text-ink-900">{step.title}</h3>
              <p className="mt-1.5 text-[12px] leading-6 text-ink-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-ink-100 bg-ink-50/50 py-14">
        <div className="container-page">
          <SectionHeading eyebrow="For vendors" title="A business toolkit, not just a listing" description="Onboarding to payouts, everything you need to run your service business." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {vendorSteps.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl bg-white p-5 shadow-soft ring-1 ring-ink-200/70">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><step.icon className="h-4.5 w-4.5" /></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-300">Step {i + 1}</span>
                </div>
                <h3 className="mt-3 text-[13.5px] font-bold text-ink-900">{step.title}</h3>
                <p className="mt-1.5 text-[11.5px] leading-5 text-ink-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <SectionHeading eyebrow="Behind the scenes" title="The booking journey, step by step" description="Transparent about what our scheduling engine does to protect your slot." />
        <div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white">
          <div className="hidden grid-cols-[80px_1fr_1.2fr] border-b border-ink-200 bg-ink-50/60 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-400 sm:grid">
            <span>Step</span>
            <span>What you do</span>
            <span>What our engine does</span>
          </div>
          {journey.map((row) => (
            <div key={row.step} className="grid gap-1.5 border-b border-ink-100 px-5 py-4 last:border-0 sm:grid-cols-[80px_1fr_1.2fr] sm:items-center">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-[10px] font-bold text-brand-700">{row.step}</span>
              <span className="text-[12.5px] font-semibold text-ink-800">{row.customer}</span>
              <span className="text-[11.5px] leading-5 text-ink-500">{row.system}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200/70 bg-amber-50/60 p-3.5">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[11px] leading-5 text-amber-800">
            Slots are held atomically and expire automatically. Two customers can never be confirmed for the same vendor, staff member and time.
          </p>
        </div>
      </section>

      <section className="border-y border-ink-100 bg-ink-50/50 py-14">
        <div className="container-page">
          <SectionHeading eyebrow="Trust & safety" title="Guarantees built into every booking" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BadgeCheck, title: 'Verified professionals', desc: 'Government ID, business documents, bank verification and background checks.' },
              { icon: ShieldCheck, title: 'Secure payments', desc: 'PCI-DSS compliant gateway, tokenised cards and verified webhook callbacks.' },
              { icon: Clock, title: 'On-time promise', desc: 'Track arrival in real time. If your pro is late beyond the window, the slot is on us.' },
              { icon: Star, title: 'Happiness guarantee', desc: 'Free re-service within 48 hours, or a fair refund after a resolution review.' },
            ].map((b) => (
              <div key={b.title} className="rounded-2xl border border-ink-200/80 bg-white p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><b.icon className="h-5 w-5" /></span>
                <h3 className="mt-3 text-[13.5px] font-bold text-ink-900">{b.title}</h3>
                <p className="mt-1.5 text-[11.5px] leading-5 text-ink-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow mb-2.5">Payments & refunds</p>
            <h2 className="font-display text-[26px] font-extrabold leading-tight text-ink-900 sm:text-[30px]">Clear money, every time.</h2>
            <p className="mt-2.5 text-[13px] leading-6 text-ink-500">
              We calculate totals on the server, hold funds until the service is completed and only settle the vendor after
              the cancellation window closes. Refunds follow the policy shown on the service page.
            </p>
            <div className="mt-5 space-y-2.5">
              {[
                'Server-calculated taxes, discounts and platform fees',
                'Funds released to vendors after service completion',
                'Full or partial refunds for eligible cancellations',
                'Payout statements and downloadable invoices',
              ].map((t) => (
                <p key={t} className="flex items-center gap-2 text-[12px] text-ink-600"><Check className="h-3.5 w-3.5 text-emerald-500" /> {t}</p>
              ))}
            </div>
            <Link to="/policies/refunds" className={buttonStyles({ variant: 'outline', size: 'sm', className: 'mt-5' })}>
              Read refund policy
            </Link>
          </div>
          <Accordion
            items={[
              { question: 'When am I charged?', answer: 'For instant bookings, payment is authorised at checkout and captured when the booking is confirmed. For request-to-book services, you are only charged after the vendor accepts. Cash-after-service bookings are settled directly with the vendor.' },
              { question: 'How long do refunds take?', answer: 'Approved refunds are initiated within 24 hours. UPI and wallet refunds usually reflect in 3–5 working days; cards can take 5–7 working days depending on your bank.' },
              { question: 'What if I cancel late?', answer: 'The cancellation policy on the service page applies. Late cancellations may incur a fee, which is shown before you confirm the cancellation. Any unused amount is refunded automatically.' },
              { question: 'How do vendors get paid?', answer: 'Vendors can request payouts weekly. Earnings become available after the service completes and the refund window closes. Payouts are transferred to the verified bank account on file.' },
            ]}
          />
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-7 text-white sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 h-6 w-6 text-white/70" />
            <div>
              <h3 className="font-display text-xl font-extrabold">Ready to experience it yourself?</h3>
              <p className="mt-1 text-[12px] text-white/65">Book a verified professional in under a minute.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/services" className="rounded-xl bg-white px-4 py-2.5 text-[12px] font-bold text-brand-800 hover:bg-brand-50">Find a service</Link>
            <Link to="/register?role=vendor" className="rounded-xl border border-white/30 px-4 py-2.5 text-[12px] font-bold text-white hover:bg-white/10">Become a vendor</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
