import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  Heart,
  Info,
  MapPin,
  MessageSquare,
  Repeat,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Users,
} from 'lucide-react';
import {
  getCategory,
  getServiceReviews,
  getVendor,
  getVendorReviews,
  getVendorServices,
  SERVICES,
  STAFF,
  VENDORS,
} from '@/lib/data';
import { cn, inr, iso, minsToLabel, slotAvailability, to12h, addDays } from '@/lib/utils';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { Accordion } from '@/components/ui/overlays';
import { Avatar, Badge, Button, buttonStyles, Card, Checkbox, RatingStars, Tabs } from '@/components/ui/primitives';
import { PriceLine, ReviewCard, ServiceCard, SmartImage } from '@/components/marketplace';
import NotFoundPage from '../NotFound';

const ratingBreakdown = [
  { stars: 5, pct: 79 },
  { stars: 4, pct: 13 },
  { stars: 3, pct: 5 },
  { stars: 2, pct: 2 },
  { stars: 1, pct: 1 },
];

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const service = SERVICES.find((s) => s.slug === slug);
  const resolved = service ?? undefined;

  if (!resolved) return <NotFoundPage />;

  const vendor = getVendor(resolved.vendorId)!;
  const category = getCategory(resolved.categoryId)!;
  const vendorReviews = getVendorReviews(vendor.id);
  const serviceReviews = getServiceReviews(resolved.id);
  const reviews = serviceReviews.length >= 2 ? serviceReviews : vendorReviews.slice(0, 4);
  const vendorStaff = STAFF.filter((s) => s.vendorId === vendor.id);
  const similar = getVendorServices(vendor.id).filter((s) => s.id !== resolved.id).slice(0, 3);
  const categoryPeers = VENDORS.filter((v) => v.categoryId === vendor.categoryId && v.id !== vendor.id)
    .slice(0, 3)
    .flatMap((v) => getVendorServices(v.id).slice(0, 1));

  const dateOptions = [0, 1, 2, 3].map((offset) => {
    const d = addDays(offset);
    return {
      iso: iso(d),
      label: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      day: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
  });

  const [date, setDate] = useState(dateOptions[0].iso);
  const slots = useMemo(() => slotAvailability(resolved.id, date), [resolved.id, date]);
  const firstAvailable = slots.find((s) => s.available)?.time ?? '';
  const [time, setTime] = useState(firstAvailable);
  const [tab, setTab] = useState('overview');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const { serviceFavorites, toggleServiceFavorite } = useApp();
  const isFav = serviceFavorites.includes(resolved.id);

  const addOnTotal = resolved.addOns
    .filter((a) => selectedAddOns.includes(a.name))
    .reduce((sum, a) => sum + a.price, 0);
  const discountedPrice = Math.round(resolved.price * (1 - (resolved.discount ?? 0) / 100));
  const total = discountedPrice + addOnTotal;

  const chooseDate = (nextDate: string) => {
    setDate(nextDate);
    const nextSlots = slotAvailability(resolved.id, nextDate);
    setTime(nextSlots.find((s) => s.available)?.time ?? '');
  };

  const goToBooking = () => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (time) params.set('time', time);
    if (selectedAddOns.length) params.set('addons', selectedAddOns.join('|'));
    navigate(`/customer/book/${resolved.id}?${params.toString()}`);
  };

  const tabItems = [
    { key: 'overview', label: 'Overview' },
    { key: 'includes', label: "What's included" },
    { key: 'addons', label: `Add-ons (${resolved.addOns.length})` },
    { key: 'reviews', label: `Reviews (${resolved.reviewCount})` },
    { key: 'policies', label: 'Policies' },
  ];

  const gallery = [resolved.image, vendor.gallery[1] ?? resolved.image, vendor.gallery[2] ?? resolved.image];

  return (
    <div className="bg-white">
      <div className="container-page py-5">
        <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-400">
          <Link to="/" className="hover:text-brand-600">Home</Link>
          <span>/</span>
          <Link to={`/categories/${category.slug}`} className="hover:text-brand-600">{category.name}</Link>
          <span>/</span>
          <span className="text-ink-600">{resolved.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {resolved.discount ? (
                <Badge tone="success" dot>{resolved.discount}% off today</Badge>
              ) : (
                <Badge tone="brand" dot>Available to book</Badge>
              )}
              {resolved.featured && <Badge tone="warning">Bestseller</Badge>}
              <span className="text-[11px] font-medium text-ink-400">Service ID · {resolved.id.toUpperCase()}</span>
            </div>
            <h1 className="mt-2.5 max-w-3xl font-display text-[26px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-[34px]">
              {resolved.name}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <RatingStars value={resolved.rating} size={13} count={resolved.reviewCount} />
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-ink-400" /> {vendor.area}, {vendor.city}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-ink-400" /> {minsToLabel(resolved.duration)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified vendor
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              iconLeft={<Share2 className="h-3.5 w-3.5" />}
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success('Link copied', 'Share this service with friends and family.');
              }}
            >
              Share
            </Button>
            <Button
              variant={isFav ? 'soft' : 'outline'}
              size="sm"
              iconLeft={<Heart className={cn('h-3.5 w-3.5', isFav && 'fill-rose-500 text-rose-500')} />}
              onClick={() => toggleServiceFavorite(resolved.id)}
            >
              {isFav ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Gallery */}
        <div className="mt-5 grid gap-2 sm:grid-cols-[1.8fr_1fr]">
          <SmartImage src={gallery[0]} alt={resolved.name} className="aspect-[16/9] w-full rounded-2xl" tone={category.tone}>
            <span className="absolute bottom-3 left-3 rounded-md bg-ink-950/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
              Real customer photos · verified
            </span>
          </SmartImage>
          <div className="hidden grid-rows-2 gap-2 sm:grid">
            <SmartImage src={gallery[1]} alt={`${resolved.name} detail`} className="w-full rounded-2xl" tone={category.tone} />
            <div className="relative">
              <SmartImage src={gallery[2]} alt={`${resolved.name} detail`} className="h-full w-full rounded-2xl" tone={category.tone} />
              <button
                onClick={() => toast.info('Photo gallery', 'Full gallery view is stubbed in this frontend demo.')}
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-ink-950/45 text-[12px] font-bold text-white backdrop-blur-[1px] transition hover:bg-ink-950/55"
              >
                View all {vendor.gallery.length + 5} photos
              </button>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_368px]">
          {/* Main */}
          <div className="min-w-0">
            <div className="flex items-center gap-3 rounded-2xl border border-ink-200/80 p-3.5">
              <Avatar name={vendor.name} size="lg" tone="brand" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-ink-900">
                  {vendor.name}
                  {vendor.verified && <BadgeCheck className="h-4 w-4 text-brand-600" />}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-500">
                  ★ {vendor.rating} · {vendor.jobsDone.toLocaleString('en-IN')} jobs completed · Responds in {vendor.responseTime}
                </p>
              </div>
              <Link to={`/vendors/${vendor.slug}`} className={buttonStyles({ variant: 'outline', size: 'sm' })}>
                View profile
              </Link>
            </div>

            <Tabs items={tabItems} value={tab} onChange={setTab} variant="underline" className="mt-5" />

            <div className="py-5">
              {tab === 'overview' && (
                <div className="space-y-7">
                  <div>
                    <h2 className="text-[15px] font-bold text-ink-900">About this service</h2>
                    <p className="mt-2 text-[13px] leading-7 text-ink-600">{resolved.description}</p>
                  </div>

                  <div>
                    <h2 className="text-[15px] font-bold text-ink-900">Service highlights</h2>
                    <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                      {resolved.includes.map((item) => (
                        <div key={item} className="flex items-start gap-2.5 rounded-xl bg-ink-50/70 px-3.5 py-3">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span className="text-[12px] leading-5 text-ink-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-[15px] font-bold text-ink-900">Service details</h2>
                    <div className="mt-3 grid gap-x-8 gap-y-0 rounded-xl border border-ink-200/80 px-4 py-1 sm:grid-cols-2">
                      {[
                        { label: 'Duration', value: minsToLabel(resolved.duration) },
                        { label: 'Pricing', value: resolved.priceType === 'hourly' ? 'Hourly' : resolved.priceType === 'session' ? 'Per session' : resolved.priceType === 'package' ? 'Package' : 'Fixed price' },
                        { label: 'Service location', value: resolved.serviceAt },
                        { label: 'Booking notice', value: `${resolved.notice} hours` },
                        { label: 'Advance booking', value: `Up to ${resolved.maxAdvance} days` },
                        { label: 'Cancellation', value: resolved.cancellation },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0 sm:[&:nth-last-child(2)]:border-0">
                          <span className="text-[12px] text-ink-500">{row.label}</span>
                          <span className="text-[12px] font-semibold text-ink-800">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-[15px] font-bold text-ink-900">Good to know</h2>
                    <div className="mt-3 space-y-2">
                      {[
                        { icon: ShieldCheck, text: 'Every professional is police-verified and background checked.' },
                        { icon: Repeat, text: 'Free re-service within 48 hours if you are not satisfied with the quality.' },
                        { icon: Info, text: `Please book at least ${resolved.notice} hours in advance. Prices include labour; parts are billed at MRP.` },
                      ].map((i) => (
                        <div key={i.text} className="flex items-start gap-2.5">
                          <i.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                          <p className="text-[12px] leading-5 text-ink-500">{i.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-[15px] font-bold text-ink-900">Frequently asked questions</h2>
                    <Accordion
                      className="mt-3"
                      items={[
                        { question: 'Do I need to provide any equipment or supplies?', answer: 'No. Our professionals bring all standard equipment and supplies. If you prefer specific products (e.g. eco-friendly or fragrance-free), add a note while booking.' },
                        { question: 'What happens if the job takes longer than expected?', answer: `The listed duration is an estimate. If additional work is needed, your pro will share a revised quote for approval before continuing. For hourly services, billing is in ${minsToLabel(resolved.duration)} blocks.` },
                        { question: 'Can I reschedule after booking?', answer: `Yes. You can reschedule once free of charge up to ${resolved.notice} hours before the slot from your bookings dashboard.` },
                      ]}
                    />
                  </div>
                </div>
              )}

              {tab === 'includes' && (
                <div>
                  <h2 className="text-[15px] font-bold text-ink-900">What’s included</h2>
                  <p className="mt-1 text-[12px] text-ink-500">Everything below is part of the base price.</p>
                  <div className="mt-4 space-y-2">
                    {resolved.includes.map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-xl border border-ink-100 px-4 py-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                        <span className="text-[12.5px] text-ink-700">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl border border-amber-200/70 bg-amber-50/60 p-4">
                    <p className="flex items-center gap-1.5 text-[12px] font-bold text-amber-900">
                      <AlertCircle className="h-4 w-4" /> Not included
                    </p>
                    <p className="mt-1 text-[12px] leading-5 text-amber-800">
                      Spare parts, replacement fittings and any additional work beyond the scope above. Your pro will
                      always share a quote before starting extra work.
                    </p>
                  </div>
                </div>
              )}

              {tab === 'addons' && (
                <div>
                  <h2 className="text-[15px] font-bold text-ink-900">Optional add-ons</h2>
                  <p className="mt-1 text-[12px] text-ink-500">Enhance your booking with these extras. You can also add them at checkout.</p>
                  <div className="mt-4 space-y-2.5">
                    {resolved.addOns.map((addon) => (
                      <label
                        key={addon.name}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition',
                          selectedAddOns.includes(addon.name) ? 'border-brand-300 bg-brand-50/50' : 'border-ink-200 hover:border-ink-300',
                        )}
                      >
                        <Checkbox
                          checked={selectedAddOns.includes(addon.name)}
                          onChange={(v) =>
                            setSelectedAddOns(v ? [...selectedAddOns, addon.name] : selectedAddOns.filter((a) => a !== addon.name))
                          }
                        />
                        <div className="flex-1">
                          <p className="text-[12.5px] font-semibold text-ink-800">{addon.name}</p>
                          <p className="text-[10.5px] text-ink-400">Added to your service visit</p>
                        </div>
                        <span className="text-[12.5px] font-bold text-ink-900">+ {inr(addon.price)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'reviews' && (
                <div>
                  <div className="grid gap-5 rounded-2xl border border-ink-200/80 p-5 sm:grid-cols-[160px_1fr]">
                    <div className="text-center sm:border-r sm:border-ink-100">
                      <p className="font-display text-[46px] font-extrabold leading-none text-ink-900">{resolved.rating.toFixed(1)}</p>
                      <div className="mt-1.5 flex justify-center">
                        <RatingStars value={resolved.rating} size={15} showValue={false} />
                      </div>
                      <p className="mt-1 text-[11px] text-ink-400">{resolved.reviewCount} verified reviews</p>
                      <Badge tone="success" size="sm" className="mt-2">98% recommend</Badge>
                    </div>
                    <div className="space-y-1.5">
                      {ratingBreakdown.map((r) => (
                        <div key={r.stars} className="flex items-center gap-2">
                          <span className="w-8 text-right text-[10.5px] font-semibold text-ink-500">{r.stars} ★</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${r.pct}%` }} />
                          </div>
                          <span className="w-8 text-[10px] text-ink-400">{r.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
                    <p className="text-[11.5px] text-ink-500">Only customers with a completed booking can review this service.</p>
                    <Button variant="outline" size="xs">See all reviews</Button>
                  </div>
                </div>
              )}

              {tab === 'policies' && (
                <div className="space-y-3">
                  {[
                    { icon: CalendarCheck, title: 'Cancellation policy', body: `${resolved.cancellation} · ${vendor.policies.cancellation}` },
                    { icon: Repeat, title: 'Reschedule policy', body: vendor.policies.reschedule },
                    { icon: ShieldCheck, title: 'Refund policy', body: vendor.policies.refund },
                  ].map((p) => (
                    <div key={p.title} className="rounded-xl border border-ink-200/80 p-4">
                      <p className="flex items-center gap-2 text-[13px] font-bold text-ink-900">
                        <p.icon className="h-4 w-4 text-brand-600" /> {p.title}
                      </p>
                      <p className="mt-1.5 text-[12px] leading-6 text-ink-500">{p.body}</p>
                    </div>
                  ))}
                  <p className="text-[11px] leading-5 text-ink-400">
                    Platform policies apply in addition to vendor policies. Disputes are reviewed by the Servora resolutions team.
                  </p>
                </div>
              )}
            </div>

            {/* Team */}
            {vendorStaff.length > 0 && (
              <div className="border-t border-ink-100 pt-6">
                <h2 className="text-[15px] font-bold text-ink-900">Meet the team</h2>
                <p className="mt-1 text-[12px] text-ink-500">You can request a specific staff member during checkout.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {vendorStaff.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 rounded-xl border border-ink-200/80 p-3">
                      <Avatar name={member.name} tone={member.tone} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-bold text-ink-900">{member.name}</p>
                        <p className="text-[10.5px] text-ink-400">{member.role} · {member.experience}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-ink-700">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {member.rating}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similar */}
            {(similar.length > 0 || categoryPeers.length > 0) && (
              <div className="mt-8 border-t border-ink-100 pt-7">
                <h2 className="text-[15px] font-bold text-ink-900">You might also like</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[...similar, ...categoryPeers].slice(0, 3).map((s) => (
                    <ServiceCard key={s.id} service={s} vendor={VENDORS.find((v) => v.id === s.vendorId)} compact />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking card */}
          <aside className="lg:sticky lg:top-[88px] lg:self-start">
            <Card className="overflow-hidden">
              <div className="border-b border-ink-100 bg-gradient-to-br from-brand-50/80 to-white px-5 py-4">
                <div className="flex items-end gap-2">
                  <span className="font-display text-[28px] font-extrabold leading-none text-ink-900">{inr(discountedPrice)}</span>
                  {resolved.discount ? (
                    <>
                      <span className="text-[13px] text-ink-400 line-through">{inr(resolved.price)}</span>
                      <Badge tone="success" size="sm" className="mb-0.5">{resolved.discount}% off</Badge>
                    </>
                  ) : null}
                </div>
                <p className="mt-1 text-[10.5px] text-ink-500">
                  {resolved.priceType === 'hourly' ? 'per hour · ' : resolved.priceType === 'session' ? 'per session · ' : ''}
                  {minsToLabel(resolved.duration)} · includes taxes
                </p>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">Select date</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {dateOptions.map((opt) => (
                      <button
                        key={opt.iso}
                        onClick={() => chooseDate(opt.iso)}
                        className={cn(
                          'rounded-lg border py-2 text-center transition',
                          date === opt.iso ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 text-ink-600 hover:border-brand-300',
                        )}
                      >
                        <span className="block text-[9.5px] font-medium opacity-70">{opt.label}</span>
                        <span className="block text-[11px] font-bold">{opt.day}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Select time</p>
                    <span className="text-[9.5px] text-emerald-600">{slots.filter((s) => s.available).length} slots free</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {slots.slice(0, 9).map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setTime(slot.time)}
                        className={cn(
                          'rounded-lg border py-1.5 text-[10.5px] font-semibold transition',
                          time === slot.time
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : slot.available
                              ? 'border-ink-200 text-ink-600 hover:border-brand-300 hover:bg-brand-50'
                              : 'cursor-not-allowed border-ink-100 bg-ink-50 text-ink-300 line-through',
                        )}
                      >
                        {to12h(slot.time)}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedAddOns.length > 0 && (
                  <div className="rounded-lg bg-ink-50 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Add-ons</p>
                    {resolved.addOns.filter((a) => selectedAddOns.includes(a.name)).map((a) => (
                      <PriceLine key={a.name} label={a.name} value={`+ ${inr(a.price)}`} />
                    ))}
                  </div>
                )}

                <div className="border-t border-ink-100 pt-3">
                  <PriceLine label="Service total" value={inr(total)} bold />
                  <p className="mt-0.5 text-[10px] text-ink-400">No hidden fees. Pay after confirmation.</p>
                </div>

                <Button size="lg" className="w-full" onClick={goToBooking}>
                  {vendor.responseTime ? 'Continue to booking' : 'Book now'} <ArrowRight className="h-4 w-4" />
                </Button>

                <button
                  onClick={() => toast.info('Message sent', `${vendor.name} typically replies in ${vendor.responseTime}.`)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-ink-200 py-2.5 text-[12px] font-semibold text-ink-600 transition hover:bg-ink-50"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Chat with vendor
                </button>

                <div className="space-y-1.5 border-t border-ink-100 pt-3.5 text-[10.5px] text-ink-500">
                  <p className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Free cancellation up to {resolved.notice} hrs before</p>
                  <p className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-brand-500" /> Verified & background-checked pro</p>
                  <p className="flex items-center gap-1.5"><ThumbsUp className="h-3.5 w-3.5 text-amber-500" /> Happiness guarantee included</p>
                </div>
              </div>
            </Card>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-ink-200/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-ink-400" />
                <p className="text-[10.5px] text-ink-500">
                  <span className="font-bold text-ink-800">{Math.round(resolved.bookings / 12)}</span> people booked this week
                </p>
              </div>
              <span className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />)}
              </span>
            </div>

            <button
              onClick={() => toast.info('Report submitted', 'Our trust & safety team will review this listing.')}
              className="mt-3 flex w-full items-center justify-center gap-1.5 text-[10.5px] text-ink-400 hover:text-ink-700"
            >
              <AlertCircle className="h-3 w-3" /> Report this listing
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
