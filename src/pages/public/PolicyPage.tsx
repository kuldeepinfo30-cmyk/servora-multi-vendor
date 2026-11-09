import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  Mail,
  Printer,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { Button, buttonStyles, Divider } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

type PolicyKey = 'terms' | 'privacy' | 'refunds' | 'accessibility';

interface PolicySection {
  id: string;
  title: string;
  body: string[];
  list?: string[];
}

interface PolicyDoc {
  title: string;
  eyebrow: string;
  summary: string;
  updated: string;
  icon: typeof FileText;
  sections: PolicySection[];
}

const policies: Record<PolicyKey, PolicyDoc> = {
  terms: {
    title: 'Terms of Service',
    eyebrow: 'Legal · Marketplace agreement',
    summary:
      'These terms govern your use of Servora, a marketplace that connects customers with independent local service businesses. Servora is not the provider of the services listed.',
    updated: '1 November 2026',
    icon: FileText,
    sections: [
      {
        id: 'marketplace',
        title: '1. The marketplace model',
        body: [
          'Servora operates an online marketplace that enables customers to discover, book and pay for services supplied by independent vendors. Each vendor is a separate business and is solely responsible for the services it provides, including quality, timing, licensing and compliance.',
          'When you book through Servora, you enter into a service contract with the vendor. Servora is not a party to that contract and does not itself supply the services, except where expressly stated.',
        ],
      },
      {
        id: 'accounts',
        title: '2. Accounts and eligibility',
        body: [
          'You must be at least 18 years old and able to form a binding contract to create an account. You agree to provide accurate information, keep credentials secure and accept responsibility for activity under your account.',
          'Vendor accounts are subject to identity, business and background verification. We may decline, suspend or remove an account where verification fails, risk thresholds are breached or these terms are violated.',
        ],
        list: [
          'One person or business per account; shared logins are not permitted.',
          'You must keep contact, address and payout details current.',
          'We may require re-verification after material profile changes.',
        ],
      },
      {
        id: 'bookings',
        title: '3. Bookings, payments and fees',
        body: [
          'Availability shown on Servora is indicative until a booking is confirmed. Instant-confirmation services are confirmed at checkout; request-based services are confirmed when the vendor accepts. Prices are displayed in INR and include applicable taxes unless stated otherwise.',
          'Payments are collected by Servora as a limited payment agent for the vendor. We deduct the applicable commission and payment processing fees before settling the balance to the vendor. Tips are passed through in full.',
        ],
        list: [
          'A slot is held for a limited time during checkout and may be released if payment is not completed.',
          'You authorise capture of the agreed amount when a booking is confirmed.',
          'Commission rates are disclosed in the vendor portal and may vary by category.',
        ],
      },
      {
        id: 'conduct',
        title: '4. Acceptable use',
        body: [
          'You agree not to misuse the platform, circumvent fees, harass other users, post false reviews, scrape data, or attempt to interfere with the security or availability of the service.',
          'Reviews must reflect a genuine service experience. We may remove content that is unlawful, misleading, abusive or that discloses personal information.',
        ],
      },
      {
        id: 'liability',
        title: '5. Disclaimers and liability',
        body: [
          'To the maximum extent permitted by law, Servora provides the marketplace “as is” and disclaims implied warranties not expressly stated. We do not guarantee that any vendor will be available or that a service will meet your expectations.',
          'Our aggregate liability arising from the marketplace is limited to the greater of the fees you paid to Servora in the six months before the claim or ₹10,000, except for fraud, wilful misconduct or liabilities that cannot be limited by law.',
        ],
      },
      {
        id: 'changes',
        title: '6. Changes and governing law',
        body: [
          'We may update these terms from time to time. Material changes will be notified at least 15 days before they take effect. Continued use after the effective date constitutes acceptance.',
          'These terms are governed by the laws of India, with courts in Bengaluru having exclusive jurisdiction, subject to any mandatory consumer protections in your place of residence.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    eyebrow: 'Legal · Data protection',
    summary:
      'We collect the minimum data needed to run a trusted marketplace, protect it rigorously, and never sell it. This policy explains what we collect, why, and the control you have.',
    updated: '1 November 2026',
    icon: Lock,
    sections: [
      {
        id: 'collect',
        title: '1. Information we collect',
        body: [
          'We collect information you provide directly, information generated when you use the marketplace, and limited information from trusted partners such as payment gateways and identity verification providers.',
        ],
        list: [
          'Account details: name, email, phone, city and role.',
          'Booking data: services, addresses, schedules, notes and communications.',
          'Payment data: tokenised payment references. Full card numbers never reach our servers.',
          'Verification data for vendors: government ID, business registration and background-check results.',
          'Usage data: device, browser, pages viewed and interactions, used to improve the product.',
        ],
      },
      {
        id: 'use',
        title: '2. How we use information',
        body: [
          'We use your information to create and secure accounts, facilitate bookings and payments, provide support, prevent fraud, comply with legal obligations and improve the marketplace. We may send service messages that are necessary for your account or bookings.',
          'Marketing communications are opt-in and can be turned off at any time from Settings → Notifications without affecting essential service messages.',
        ],
      },
      {
        id: 'sharing',
        title: '3. Sharing and disclosure',
        body: [
          'We share the minimum necessary information with the vendor you book, payment and payout providers, identity verification partners, and support tooling. Address details are revealed to a vendor only after a booking is confirmed.',
          'We do not sell personal data. We may disclose information where required by law, to protect safety, or as part of a merger or acquisition with appropriate safeguards.',
        ],
      },
      {
        id: 'security',
        title: '4. Security and retention',
        body: [
          'Data is encrypted in transit using TLS and at rest using industry-standard encryption. Access is role-based, logged and reviewed. Payment processing is handled by a PCI-DSS Level 1 certified gateway.',
          'We retain account and transaction records for as long as required to provide the service and meet tax, accounting and dispute-resolution obligations. Verification documents are retained only as long as necessary for trust and safety.',
        ],
      },
      {
        id: 'rights',
        title: '5. Your rights and choices',
        body: [
          'You may access, correct, export or delete your personal data, and object to certain processing. Most controls are available in the customer portal under Settings → Privacy.',
        ],
        list: [
          'Download a copy of your data from Settings → Privacy.',
          'Request deletion; some records may be retained where law requires.',
          'Withdraw marketing consent at any time.',
          'Contact privacy@servora.demo for any privacy request.',
        ],
      },
      {
        id: 'cookies',
        title: '6. Cookies and contact',
        body: [
          'We use essential cookies for authentication and security, and optional analytics cookies to understand product usage. You can manage optional cookies from the footer preference centre.',
          'For privacy questions, contact our Data Protection Officer at privacy@servora.demo or write to Servora Technologies Pvt. Ltd., Indiranagar, Bengaluru 560038, India.',
        ],
      },
    ],
  },
  refunds: {
    title: 'Refund & Cancellation Policy',
    eyebrow: 'Legal · Fair outcomes',
    summary:
      'Clear rules for cancellations, rescheduling and refunds — for both customers and vendors. Where something goes wrong, our resolution team steps in fast.',
    updated: '1 November 2026',
    icon: RotateCcw,
    sections: [
      {
        id: 'window',
        title: '1. Cancellation windows',
        body: [
          'Cancellation terms depend on the policy attached to each service. The applicable policy is shown on the service page and repeated in your booking confirmation.',
        ],
        list: [
          'Flexible: free cancellation up to 12 hours before the slot; full refund to the original method.',
          'Moderate: free cancellation up to 24 hours before the slot; 50% refund within 24 hours.',
          'Strict: free cancellation up to 48 hours before the slot; no refund within 48 hours, except for genuine emergencies reviewed by support.',
          'No-shows by the vendor are always fully refunded, including any platform fee.',
        ],
      },
      {
        id: 'reschedule',
        title: '2. Rescheduling',
        body: [
          'One free reschedule is available on all bookings made at least 24 hours before the original slot, subject to availability. Additional reschedules may attract a fee equivalent to 10% of the booking value, capped at ₹500.',
          'Vendors may propose an alternative time. If you decline, the booking is treated as a vendor cancellation and refunded in full.',
        ],
      },
      {
        id: 'quality',
        title: '3. Service quality and the happiness guarantee',
        body: [
          'If a completed service does not meet the standard described, report it within 48 hours with photos or a short description. We will arrange a free re-do by the same or an equivalent professional, or issue a partial or full refund where a re-do is not possible.',
          'Refund amounts consider the proportion of the service affected, evidence provided and whether the vendor was given an opportunity to remedy the issue.',
        ],
      },
      {
        id: 'timelines',
        title: '4. Refund timelines and methods',
        body: [
          'Approved refunds are returned to the original payment method. We initiate refunds within one business day of approval.',
        ],
        list: [
          'UPI: typically instant to 2 business days.',
          'Cards and net banking: 5–7 business days, depending on your bank.',
          'Servora credit: immediate, and usable on any future booking for 12 months.',
          'Cash bookings: refunded by bank transfer within 3 business days.',
        ],
      },
      {
        id: 'disputes',
        title: '5. Disputes and chargebacks',
        body: [
          'If you cannot resolve an issue directly with the vendor, open a dispute from the booking. Our resolution team reviews evidence from both sides and aims to decide within two business days. Decisions can include a re-do, partial refund, full refund or no refund with a written explanation.',
          'Please contact us before raising a chargeback with your bank — most issues are resolved faster through the dispute process.',
        ],
      },
    ],
  },
  accessibility: {
    title: 'Accessibility Statement',
    eyebrow: 'Commitment · WCAG 2.2 AA',
    summary:
      'Servora is built so that anyone can find, book and manage local services. We design and test against WCAG 2.2 AA and welcome feedback on barriers you encounter.',
    updated: '1 November 2026',
    icon: Accessibility,
    sections: [
      {
        id: 'standard',
        title: '1. Our standard',
        body: [
          'We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA across the public website and all three portals. Accessibility is part of our definition of done for every feature, not a retrofit.',
        ],
      },
      {
        id: 'measures',
        title: '2. Measures we take',
        body: [
          'Our design system encodes accessible patterns by default, and we validate them with automated checks plus manual keyboard and screen-reader testing.',
        ],
        list: [
          'Semantic landmarks, headings and form labels throughout.',
          'Visible focus states and full keyboard operability for interactive controls.',
          'Colour contrast meeting AA for text and meaningful UI.',
          'Respect for reduced-motion preferences and scalable text up to 200%.',
          'Status messages announced to assistive technology, not conveyed by colour alone.',
        ],
      },
      {
        id: 'limitations',
        title: '3. Known limitations',
        body: [
          'Some third-party embedded content (for example, maps and payment gateway frames) may not fully meet our standard. We provide text alternatives and non-map fallbacks for core tasks, and we are working with providers to improve embedded experiences.',
        ],
      },
      {
        id: 'feedback',
        title: '4. Feedback and enforcement',
        body: [
          'If you encounter a barrier, email accessibility@servora.demo or use the contact form. Include the page, the task you were attempting and your assistive technology where possible. We aim to acknowledge within two business days and provide a substantive response within ten.',
          'If you are not satisfied with our response, you may escalate to our Grievance Officer at grievance@servora.demo.',
        ],
      },
    ],
  },
};

function PolicyView({ policyKey }: { policyKey: PolicyKey }) {
  const policy = policies[policyKey];
  const location = useLocation();
  const [active, setActive] = useState(policy.sections[0]?.id ?? '');

  useEffect(() => {
    setActive(policy.sections[0]?.id ?? '');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [policyKey, policy.sections]);

  const otherPolicies = useMemo(
    () =>
      (Object.entries(policies) as [PolicyKey, PolicyDoc][]).filter(([key]) => key !== policyKey),
    [policyKey],
  );

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      <section className="border-b border-ink-100 bg-mesh">
        <div className="container-page py-10 sm:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-500 transition hover:text-brand-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Servora
          </Link>
          <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="eyebrow">
                <policy.icon className="h-3.5 w-3.5" /> {policy.eyebrow}
              </span>
              <h1 className="mt-3 font-display text-[32px] font-extrabold leading-[1.1] tracking-tight text-ink-900 sm:text-[40px]">
                {policy.title}
              </h1>
              <p className="mt-3 text-[13.5px] leading-7 text-ink-600">{policy.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Last updated {policy.updated}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Effective immediately
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Version 4.2
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Printer className="h-3.5 w-3.5" />}
              onClick={() => window.print()}
            >
              Print / save PDF
            </Button>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-10 lg:grid-cols-[250px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-2 text-[9.5px] font-bold uppercase tracking-[0.16em] text-ink-400">
              On this page
            </p>
            <nav className="space-y-0.5 border-l border-ink-200 pl-3">
              {policy.sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    'block w-full rounded-r-md py-1.5 pl-2 text-left text-[11.5px] font-medium transition',
                    active === s.id
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-500 hover:text-ink-800',
                  )}
                >
                  {s.title}
                </button>
              ))}
            </nav>

            <Divider className="my-5" />
            <p className="mb-2 text-[9.5px] font-bold uppercase tracking-[0.16em] text-ink-400">
              Other policies
            </p>
            <div className="space-y-1">
              {otherPolicies.map(([key, p]) => (
                <Link
                  key={key}
                  to={`/policies/${key}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-[11.5px] font-semibold text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
                >
                  <p.icon className="h-3.5 w-3.5 text-ink-400" />
                  {p.title}
                  <ArrowRight className="ml-auto h-3 w-3 text-ink-300" />
                </Link>
              ))}
            </div>
          </aside>

          <article className="min-w-0 max-w-3xl">
            <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
              <p className="flex items-start gap-2.5 text-[12px] leading-5 text-brand-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>
                  <strong className="font-bold">Plain-language promise.</strong> If anything here is
                  unclear, ask us — we will explain it in writing before you book.
                </span>
              </p>
            </div>

            <div className="mt-8 space-y-8">
              {policy.sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="font-display text-[18px] font-extrabold tracking-tight text-ink-900">
                    {s.title}
                  </h2>
                  <div className="mt-2.5 space-y-3">
                    {s.body.map((p, i) => (
                      <p key={i} className="text-[13px] leading-7 text-ink-600">
                        {p}
                      </p>
                    ))}
                  </div>
                  {s.list && (
                    <ul className="mt-3 space-y-2">
                      {s.list.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-[13px] leading-6 text-ink-600">
                          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[14px] font-bold text-ink-900">Questions about this policy?</h2>
                  <p className="mt-1 text-[12px] leading-5 text-ink-500">
                    Email <span className="font-semibold text-ink-700">legal@servora.demo</span> or talk to support. We reply within two business days.
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a href="mailto:legal@servora.demo" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
                    <Mail className="h-3.5 w-3.5" /> Email legal
                  </a>
                  <Link to="/contact" className={buttonStyles({ size: 'sm' })}>
                    Contact support
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3 text-[10.5px] text-ink-500">
              <span>
                {policy.title} · Version 4.2 · Updated {policy.updated}
              </span>
              <Link to={location.pathname} className="font-bold text-brand-700 hover:text-brand-800">
                Permalink
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

export function TermsPage() {
  return <PolicyView policyKey="terms" />;
}
export function PrivacyPage() {
  return <PolicyView policyKey="privacy" />;
}
export function RefundsPage() {
  return <PolicyView policyKey="refunds" />;
}
export function AccessibilityPage() {
  return <PolicyView policyKey="accessibility" />;
}

export default TermsPage;
