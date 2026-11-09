import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, CalendarCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from '@/components/marketplace';
import { Avatar } from '@/components/ui/primitives';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  badge,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile: normal flow so the page always scrolls.
          Desktop: fixed-height columns that each scroll internally, so no
          content is ever clipped — this is what fixes the admin/vendor
          login "can't scroll" bug. */}
      <div className="flex min-h-screen flex-col lg:grid lg:h-screen lg:min-h-0 lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel */}
        <aside className="relative hidden bg-ink-950 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:overflow-y-auto">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_10%_0%,rgba(99,102,241,.45),transparent_50%),radial-gradient(at_95%_25%,rgba(14,165,233,.28),transparent_45%),radial-gradient(at_50%_100%,rgba(244,114,182,.18),transparent_45%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:44px_44px]" />

          <div className="relative px-10 pt-9 xl:px-14">
            <Logo dark />
          </div>

          <div className="relative px-10 pb-6 xl:px-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-200 ring-1 ring-white/10">
              <Sparkles className="h-3.5 w-3.5" /> India’s trusted services marketplace
            </span>
            <h1 className="mt-5 max-w-lg font-display text-[34px] font-extrabold leading-[1.1] tracking-tight text-white xl:text-[40px]">
              The whole home,
              <br />
              <span className="bg-gradient-to-r from-brand-300 via-sky-300 to-white bg-clip-text text-transparent">
                handled by people you trust.
              </span>
            </h1>
            <p className="mt-4 max-w-md text-[13.5px] leading-7 text-ink-300">
              Book verified professionals, manage schedules and pay securely — with a real
              happiness guarantee behind every booking.
            </p>

            <div className="mt-7 grid max-w-md gap-2.5">
              {[
                { icon: BadgeCheck, text: 'Background-checked professionals in 8 cities' },
                { icon: CalendarCheck, text: 'Real-time availability and instant confirmation' },
                { icon: ShieldCheck, text: 'Secure payments with transparent pricing' },
              ].map((b) => (
                <div key={b.text} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 backdrop-blur">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/20 text-brand-300">
                    <b.icon className="h-4 w-4" />
                  </span>
                  <span className="text-[12px] font-medium text-ink-200">{b.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[
                    { name: 'Aarav Mehta', tone: 'brand' },
                    { name: 'Priya Sharma', tone: 'violet' },
                    { name: 'Neha Kulkarni', tone: 'teal' },
                  ].map((p) => (
                    <Avatar key={p.name} name={p.name} size="sm" tone={p.tone} ring />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
                  ★★★★★ <span className="text-white/80">4.9</span>
                </div>
              </div>
              <p className="mt-2.5 text-[12px] leading-5 text-ink-300">
                “Booked a deep clean in under two minutes. The team arrived on time and the flat
                looked brand new. This is how local services should work.”
              </p>
              <p className="mt-2 text-[10.5px] font-semibold text-ink-400">Priya S. · Bengaluru</p>
            </div>
          </div>

          <div className="relative border-t border-white/10 px-10 py-4 xl:px-14">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-ink-400">
              <span><strong className="text-white">40,000+</strong> households served</span>
              <span><strong className="text-white">500+</strong> verified businesses</span>
              <span><strong className="text-white">8</strong> cities</span>
              <Link to="/" className="ml-auto inline-flex items-center gap-1 font-semibold text-brand-300 hover:text-brand-200">
                Back to website <ArrowLeft className="h-3 w-3 rotate-180" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <main className="flex flex-1 flex-col lg:h-screen lg:min-h-0 lg:flex-none lg:overflow-y-auto">
          <div className="flex items-center justify-between gap-3 px-5 py-5 sm:px-8 lg:px-10">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeSwitcher compact />
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-500 transition hover:text-brand-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Back to website</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-2 sm:px-8">
            <div className="w-full max-w-[420px]">
              {badge && <div className="mb-4">{badge}</div>}
              <h2 className="font-display text-[26px] font-extrabold leading-tight tracking-tight text-ink-900">
                {title}
              </h2>
              {subtitle && <p className="mt-2 text-[13px] leading-6 text-ink-500">{subtitle}</p>}
              <div className="mt-7">{children}</div>
              {footer && <div className="mt-6 border-t border-ink-100 pt-5">{footer}</div>}
            </div>
          </div>

          <div className="px-5 pb-6 text-center text-[10.5px] text-ink-400 sm:px-8">
            Protected by reCAPTCHA ·{' '}
            <Link to="/policies/terms" className="font-semibold text-ink-500 hover:text-brand-700">Terms</Link>{' '}
            ·{' '}
            <Link to="/policies/privacy" className="font-semibold text-ink-500 hover:text-brand-700">Privacy</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
