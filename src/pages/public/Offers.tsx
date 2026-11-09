import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgePercent, CalendarClock, Check, Copy, Gift, Sparkles, Tag, TicketPercent } from 'lucide-react';
import { CATEGORIES, COUPONS } from '@/lib/data';
import { cn, fmtDate, inr } from '@/lib/utils';
import { toast } from '@/store/toast';
import { Badge, Button, buttonStyles, Card } from '@/components/ui/primitives';
import { CategoryIcon, SectionHeading, SmartImage } from '@/components/marketplace';

export default function OffersPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    toast.success('Coupon copied', `Use ${code} at checkout to unlock your discount.`);
    setTimeout(() => setCopied(null), 2200);
  };

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-100 bg-ink-950 text-white">
        <div className="absolute inset-0 bg-mesh opacity-40" />
        <div className="container-page relative py-12 sm:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-3 flex items-center gap-1.5 text-[11px] text-white/40">
                <Link to="/" className="hover:text-white">Home</Link>
                <span>/</span>
                <span className="text-white/80">Offers</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide text-amber-300 ring-1 ring-inset ring-amber-400/25">
                <Gift className="h-3.5 w-3.5" /> Festive savings
              </span>
              <h1 className="mt-4 max-w-xl font-display text-[34px] font-extrabold leading-[1.1] tracking-tight sm:text-[44px]">
                Save more on the services you already love.
              </h1>
              <p className="mt-3 max-w-lg text-[13.5px] leading-6 text-white/60">
                Hand-picked coupons, seasonal bundles and first-booking credits. Apply any code at checkout — no fine print surprises.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-[9.5px] uppercase tracking-wide text-white/50">Total saved this month</p>
                  <p className="mt-0.5 font-display text-xl font-extrabold">{inr(1284000)}</p>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-[9.5px] uppercase tracking-wide text-white/50">Live coupons</p>
                  <p className="mt-0.5 font-display text-xl font-extrabold">{COUPONS.filter((c) => c.status === 'active').length}</p>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <TicketPercent className="h-8 w-8 text-amber-300" />
                  <Badge tone="warning" variant="solid">Limited time</Badge>
                </div>
                <p className="mt-4 text-[11px] uppercase tracking-wide text-white/50">Use code</p>
                <p className="font-mono text-2xl font-extrabold tracking-[0.12em] text-white">WELCOME10</p>
                <p className="mt-2 text-[12px] text-white/60">Get 10% off your first booking, up to ₹300.</p>
                <button onClick={() => copy('WELCOME10')} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white py-2.5 text-[12px] font-bold text-ink-900 transition hover:bg-amber-50">
                  {copied === 'WELCOME10' ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy coupon</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <SectionHeading
          eyebrow="Coupon codes"
          title="Active offers for you"
          description="Apply at checkout. One coupon per booking; minimum order values apply."
          action={<span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-[10.5px] font-bold text-emerald-700"><Check className="h-3.5 w-3.5" /> Auto-applied best offer</span>}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {COUPONS.map((coupon) => {
            const disabled = coupon.status !== 'active';
            return (
              <Card key={coupon.id} className={cn('relative overflow-hidden', disabled && 'opacity-70')}>
                <div className="flex">
                  <div className="relative flex w-32 shrink-0 flex-col items-center justify-center gap-2 border-r border-dashed border-ink-200 bg-gradient-to-br from-brand-50 to-white p-4 text-center">
                    <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-ink-200 bg-white" />
                    <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-ink-200 bg-white" />
                    <TicketPercent className="h-6 w-6 text-brand-600" />
                    <p className="font-display text-xl font-extrabold leading-none text-ink-900">
                      {coupon.type === 'percent' ? `${coupon.value}%` : inr(coupon.value)}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-ink-400">off</p>
                  </div>
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-bold text-ink-900">{coupon.description}</p>
                        <p className="mt-0.5 text-[10.5px] text-ink-400">{coupon.scope} · min. order {inr(coupon.minOrder)}</p>
                      </div>
                      <Badge tone={coupon.status === 'active' ? 'success' : coupon.status === 'scheduled' ? 'info' : 'neutral'} size="sm">
                        {coupon.status === 'active' ? 'Live' : coupon.status === 'scheduled' ? 'Scheduled' : coupon.status === 'expired' ? 'Expired' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 rounded-lg border border-dashed border-brand-300 bg-brand-50/60 px-3 py-1.5">
                        <span className="font-mono text-[12px] font-extrabold tracking-[0.1em] text-brand-800">{coupon.code}</span>
                        <button onClick={() => copy(coupon.code)} className="text-brand-600 hover:text-brand-800" aria-label="Copy code">
                          {copied === coupon.code ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-ink-400">
                        <CalendarClock className="h-3 w-3" /> Valid till {fmtDate(coupon.expires, { year: undefined })}
                      </span>
                      {coupon.maxDiscount && <span className="text-[9.5px] text-ink-400">Max {inr(coupon.maxDiscount)}</span>}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-20 overflow-hidden rounded-full bg-ink-100">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, (coupon.uses / coupon.limit) * 100)}%` }} />
                        </div>
                        <span className="text-[9.5px] text-ink-400">{coupon.uses.toLocaleString('en-IN')} used</span>
                      </div>
                      <Link to="/services" className={cn(buttonStyles({ size: 'xs', variant: disabled ? 'outline' : 'soft' }), disabled && 'pointer-events-none opacity-50')}>
                        {disabled ? 'Unavailable' : 'Use offer'} <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y border-ink-100 bg-ink-50/50 py-12">
        <div className="container-page">
          <SectionHeading eyebrow="Category deals" title="Extra savings on popular categories" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.slice(0, 6).map((cat, i) => (
              <Link key={cat.id} to={`/categories/${cat.slug}`} className="group relative overflow-hidden rounded-2xl border border-ink-200/80 bg-white">
                <SmartImage src={cat.image} alt={cat.name} className="aspect-[16/8] w-full" tone={cat.tone}>
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/75 to-transparent" />
                  <div className="absolute inset-x-4 bottom-3">
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-300">Up to {15 + i * 5}% off</p>
                        <p className="text-[15px] font-bold text-white">{cat.name}</p>
                      </div>
                      <CategoryIcon name={cat.icon} tone={cat.tone} className="h-8 w-8 shrink-0 rounded-lg bg-white/15 text-white backdrop-blur" />
                    </div>
                  </div>
                </SmartImage>
                <div className="flex items-center justify-between px-4 py-3 text-[11px]">
                  <span className="text-ink-500">from {inr(cat.from)}</span>
                  <span className="inline-flex items-center gap-1 font-bold text-brand-600 transition group-hover:gap-2">Explore <ArrowRight className="h-3 w-3" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { icon: Tag, step: '01', title: 'Pick an offer', desc: 'Choose a live coupon that matches your booking value and category.' },
            { icon: BadgePercent, step: '02', title: 'Apply at checkout', desc: 'Paste the code in the booking summary. The best applicable offer is applied automatically.' },
            { icon: Sparkles, step: '03', title: 'Save instantly', desc: 'Discount is reflected in your total before payment. No cashback chase, no minimum spend games.' },
          ].map((s) => (
            <Card key={s.step} className="p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><s.icon className="h-5 w-5" /></span>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-ink-400">Step {s.step}</p>
              <h3 className="mt-1 text-[14px] font-bold text-ink-900">{s.title}</h3>
              <p className="mt-1.5 text-[12px] leading-6 text-ink-500">{s.desc}</p>
            </Card>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-ink-200/80 bg-ink-50/60 p-5 text-[11px] leading-6 text-ink-500">
          <p className="mb-1 font-bold text-ink-700">Offer terms</p>
          <ul className="list-disc space-y-0.5 pl-4">
            <li>One coupon per booking. Coupons cannot be combined with other offers or referral credits.</li>
            <li>Discounts apply to the service subtotal, excluding taxes, platform fees and add-ons.</li>
            <li>Servora may withdraw or modify offers at any time. Expired offers cannot be applied retroactively.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
