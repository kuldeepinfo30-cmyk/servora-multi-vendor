import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  Clock,
  Globe,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import { getVendorReviews, getVendorServices, getVendorStaff, VENDORS } from '@/lib/data';
import { cn, inr, minsToLabel } from '@/lib/utils';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { Avatar, Badge, Button, buttonStyles, Card, RatingStars, Tabs } from '@/components/ui/primitives';
import { MapPlaceholder, ReviewCard, ServiceCard, SmartImage } from '@/components/marketplace';
import NotFoundPage from '../NotFound';

const allHours = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function VendorProfilePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const vendor = VENDORS.find((v) => v.slug === slug);
  const [tab, setTab] = useState('services');
  const { vendorFavorites, toggleVendorFavorite } = useApp();

  if (!vendor) return <NotFoundPage />;

  const services = getVendorServices(vendor.id);
  const reviews = getVendorReviews(vendor.id);
  const staff = getVendorStaff(vendor.id);
  const isFav = vendorFavorites.includes(vendor.id);
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const gallery = [...vendor.gallery, ...services.slice(0, 3).map((s) => s.image)];

  const book = () => {
    if (services[0]) navigate(`/services/${services[0].slug}`);
    else toast.info('No services yet', 'This vendor has not published any services.');
  };

  const tabs = [
    { key: 'services', label: `Services (${services.length})` },
    { key: 'about', label: 'About' },
    { key: 'gallery', label: `Gallery (${gallery.length})` },
    { key: 'reviews', label: `Reviews (${vendor.reviewCount})` },
    { key: 'policies', label: 'Policies' },
  ];

  return (
    <div className="bg-white">
      {/* Cover */}
      <div className="relative">
        <SmartImage src={vendor.cover} alt={vendor.name} className="h-[220px] w-full sm:h-[300px]">
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" />
        </SmartImage>
        <div className="container-page absolute inset-x-0 bottom-0 left-1/2 -translate-x-1/2 pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <span className="flex h-[74px] w-[74px] items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-brand-500 to-brand-700 text-[26px] font-extrabold text-white shadow-float">
                {vendor.name.charAt(0)}
              </span>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-[24px] font-extrabold leading-tight text-white sm:text-[30px]">{vendor.name}</h1>
                  {vendor.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[9.5px] font-bold text-white">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                  {vendor.featured && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9.5px] font-bold text-amber-950">Featured</span>}
                </div>
                <p className="mt-1 max-w-xl text-[12px] text-white/75">{vendor.tagline}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-white/65">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {vendor.area}, {vendor.city}</span>
                  <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {vendor.rating} ({vendor.reviewCount} reviews)</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Responds in {vendor.responseTime}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <button
                onClick={() => toggleVendorFavorite(vendor.id)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                aria-label="Save vendor"
              >
                <Heart className={cn('h-4 w-4', isFav && 'fill-rose-400 text-rose-400')} />
              </button>
              <Button
                variant="outline"
                size="md"
                className="border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                iconLeft={<MessageSquare className="h-3.5 w-3.5" />}
                onClick={() => toast.info('Message sent', `${vendor.owner} typically replies in ${vendor.responseTime}.`)}
              >
                Message
              </Button>
              <Button size="md" onClick={book} iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
                Book a service
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="border-b border-ink-100 bg-white">
        <div className="container-page flex flex-wrap items-center gap-x-8 gap-y-3 py-4">
          {[
            { label: 'Jobs completed', value: vendor.jobsDone.toLocaleString('en-IN') + '+' },
            { label: 'Years on Servora', value: `${new Date().getFullYear() - vendor.since}+` },
            { label: 'Services listed', value: String(services.length) },
            { label: 'Team size', value: String(staff.length || 3) },
            { label: 'Service radius', value: `${vendor.radius} km` },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[15px] font-extrabold text-ink-900">{s.value}</p>
              <p className="text-[9.5px] text-ink-400">{s.label}</p>
            </div>
          ))}
          <div className="ml-auto hidden items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-[10.5px] font-semibold text-emerald-700 sm:flex">
            <ShieldCheck className="h-3.5 w-3.5" /> Identity & business verified
          </div>
        </div>
      </div>

      <div className="container-page py-6">
        <Tabs items={tabs} value={tab} onChange={setTab} variant="underline" />

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            {tab === 'services' && (
              <div>
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <h2 className="text-[16px] font-bold text-ink-900">Services by {vendor.name}</h2>
                    <p className="mt-0.5 text-[11.5px] text-ink-500">Upfront prices, real availability and instant confirmation.</p>
                  </div>
                  <span className="text-[11px] font-semibold text-ink-400">{services.length} services</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {services.map((s) => (
                    <ServiceCard key={s.id} service={s} vendor={vendor} />
                  ))}
                </div>
              </div>
            )}

            {tab === 'about' && (
              <div className="space-y-7">
                <div>
                  <h2 className="text-[16px] font-bold text-ink-900">About the business</h2>
                  <p className="mt-2 text-[13px] leading-7 text-ink-600">{vendor.description}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Business owner', value: vendor.owner },
                    { label: 'Operating since', value: String(vendor.since) },
                    { label: 'Team size', value: `${staff.length || 3} professionals` },
                    { label: 'Languages', value: vendor.languages.join(', ') },
                    { label: 'Registered address', value: vendor.address },
                    { label: 'Service radius', value: `${vendor.radius} km around ${vendor.area}` },
                  ].map((row) => (
                    <div key={row.label} className="rounded-xl border border-ink-200/80 px-4 py-3">
                      <p className="text-[9.5px] font-bold uppercase tracking-wide text-ink-400">{row.label}</p>
                      <p className="mt-1 text-[12px] font-semibold leading-5 text-ink-800">{row.value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-[14px] font-bold text-ink-900">Certifications & trust</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {vendor.certifications.map((c) => (
                      <span key={c} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3 py-1.5 text-[11px] font-semibold text-emerald-800">
                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" /> {c}
                      </span>
                    ))}
                  </div>
                </div>

                {staff.length > 0 && (
                  <div>
                    <h3 className="text-[14px] font-bold text-ink-900">Meet the team</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {staff.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 rounded-xl border border-ink-200/80 p-3">
                          <Avatar name={m.name} tone={m.tone} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12.5px] font-bold text-ink-900">{m.name}</p>
                            <p className="text-[10.5px] text-ink-400">{m.role} · {m.experience} exp</p>
                          </div>
                          <Badge tone={m.status === 'active' ? 'success' : 'warning'} size="sm">
                            {m.status === 'active' ? 'Available' : 'On leave'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-[14px] font-bold text-ink-900">Business hours</h3>
                  <div className="mt-3 overflow-hidden rounded-xl border border-ink-200/80">
                    {vendor.hours.map((h) => (
                      <div
                        key={h.day}
                        className={cn(
                          'flex items-center justify-between border-b border-ink-100 px-4 py-2.5 text-[12px] last:border-0',
                          h.day === todayName && 'bg-brand-50/50',
                        )}
                      >
                        <span className={cn('font-medium', h.day === todayName ? 'text-brand-800' : 'text-ink-600')}>
                          {h.day} {h.day === todayName && <span className="text-[9px] font-bold text-brand-500">· Today</span>}
                        </span>
                        <span className={cn('font-semibold', h.closed ? 'text-rose-500' : 'text-ink-800')}>
                          {h.closed ? 'Closed' : `${h.open} – ${h.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'gallery' && (
              <div>
                <h2 className="text-[16px] font-bold text-ink-900">Work gallery</h2>
                <p className="mt-0.5 text-[11.5px] text-ink-500">A selection of recent work and team photos.</p>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {gallery.map((src, i) => (
                    <SmartImage key={i} src={src} alt={`${vendor.name} gallery ${i + 1}`} className={cn('w-full rounded-xl', i % 5 === 0 ? 'aspect-[4/3] sm:col-span-2' : 'aspect-square')} tone="brand" />
                  ))}
                </div>
              </div>
            )}

            {tab === 'reviews' && (
              <div>
                <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-ink-200/80 p-5">
                  <div className="text-center">
                    <p className="font-display text-[46px] font-extrabold leading-none text-ink-900">{vendor.rating.toFixed(1)}</p>
                    <div className="mt-1.5 flex justify-center"><RatingStars value={vendor.rating} size={14} showValue={false} /></div>
                    <p className="mt-1 text-[10.5px] text-ink-400">{vendor.reviewCount} reviews</p>
                  </div>
                  <div className="min-w-[180px] flex-1 space-y-1.5">
                    {[
                      { s: 5, p: 82 },
                      { s: 4, p: 12 },
                      { s: 3, p: 4 },
                      { s: 2, p: 1 },
                      { s: 1, p: 1 },
                    ].map((r) => (
                      <div key={r.s} className="flex items-center gap-2">
                        <span className="w-6 text-[10px] font-semibold text-ink-500">{r.s} ★</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${r.p}%` }} />
                        </div>
                        <span className="w-7 text-[9.5px] text-ink-400">{r.p}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {['Quality of service', 'Punctuality', 'Value for money', 'Professionalism'].map((label, i) => (
                      <div key={label} className="flex items-center justify-between gap-6 text-[10.5px]">
                        <span className="text-ink-500">{label}</span>
                        <span className="font-bold text-ink-800">{[4.9, 4.8, 4.7, 4.9][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                  {reviews.length === 0 && <p className="py-8 text-center text-sm text-ink-400">No written reviews yet.</p>}
                </div>
              </div>
            )}

            {tab === 'policies' && (
              <div className="space-y-3">
                {[
                  { title: 'Cancellation policy', body: vendor.policies.cancellation, icon: CalendarCheck },
                  { title: 'Reschedule policy', body: vendor.policies.reschedule, icon: Clock },
                  { title: 'Refund policy', body: vendor.policies.refund, icon: ShieldCheck },
                ].map((p) => (
                  <div key={p.title} className="rounded-xl border border-ink-200/80 p-4">
                    <p className="flex items-center gap-2 text-[13px] font-bold text-ink-900"><p.icon className="h-4 w-4 text-brand-600" /> {p.title}</p>
                    <p className="mt-1.5 text-[12px] leading-6 text-ink-500">{p.body}</p>
                  </div>
                ))}
                <div className="rounded-xl bg-ink-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Servora marketplace policy</p>
                  <p className="mt-1.5 text-[12px] leading-6 text-ink-500">
                    All bookings are protected by Servora’s happiness guarantee. If a service is not delivered as described,
                    raise a dispute within 48 hours for mediation and a resolution within 3 working days.
                  </p>
                  <Link to="/policies/refunds" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand-600">
                    Read the full refund policy <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-[88px] lg:self-start">
            <Card className="p-4">
              <h3 className="text-[13px] font-bold text-ink-900">Contact & location</h3>
              <div className="mt-3 space-y-2">
                <a href={`tel:${vendor.phone}`} className="flex items-center gap-2.5 rounded-lg border border-ink-200/80 px-3 py-2.5 text-[11.5px] font-semibold text-ink-700 transition hover:bg-ink-50">
                  <Phone className="h-3.5 w-3.5 text-brand-600" /> {vendor.phone}
                </a>
                <a href={`mailto:${vendor.email}`} className="flex items-center gap-2.5 rounded-lg border border-ink-200/80 px-3 py-2.5 text-[11.5px] font-semibold text-ink-700 transition hover:bg-ink-50">
                  <Mail className="h-3.5 w-3.5 text-brand-600" /> {vendor.email}
                </a>
                {vendor.website && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-ink-200/80 px-3 py-2.5 text-[11.5px] font-semibold text-ink-700">
                    <Globe className="h-3.5 w-3.5 text-brand-600" /> {vendor.website}
                  </div>
                )}
              </div>
              <div className="mt-3">
                <MapPlaceholder vendors={[vendor]} className="h-[150px]" />
              </div>
              <p className="mt-2.5 flex items-start gap-1.5 text-[10.5px] leading-5 text-ink-500">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                {vendor.address}
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-[10.5px] text-ink-500">
                <Users className="h-3.5 w-3.5 text-ink-400" />
                Serves a {vendor.radius} km radius · {vendor.languages.join(' / ')}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-ink-900">This week</h3>
                <Badge tone="success" size="sm" dot>Open now</Badge>
              </div>
              <div className="mt-3 space-y-1">
                {vendor.hours.slice(0, 7).map((h) => (
                  <div key={h.day} className={cn('flex items-center justify-between rounded-md px-2 py-1.5 text-[10.5px]', h.day === todayName && 'bg-brand-50 font-semibold text-brand-800')}>
                    <span className={h.day === todayName ? '' : 'text-ink-500'}>{h.day.slice(0, 3)}</span>
                    <span className={h.closed ? 'text-rose-500' : 'text-ink-700'}>{h.closed ? 'Closed' : `${h.open} – ${h.close}`}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-ink-100 pt-3">
                <p className="flex items-center gap-1.5 text-[10.5px] text-ink-500">
                  <Clock className="h-3.5 w-3.5 text-ink-400" /> Usually responds in {vendor.responseTime}
                </p>
              </div>
            </Card>

            <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
              <p className="text-[12.5px] font-bold">Book with confidence</p>
              <ul className="mt-2.5 space-y-1.5 text-[10.5px] text-white/75">
                {['Verified business & staff', 'Secure payments & invoices', 'Happiness guarantee', 'Free cancellation per policy'].map((i) => (
                  <li key={i} className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-300" /> {i}</li>
                ))}
              </ul>
              <Button size="sm" className="mt-3 w-full bg-white text-brand-800 hover:bg-brand-50" onClick={book}>
                Book a service
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <div className="border-t border-ink-100 bg-ink-50/50 py-10">
        <div className="container-page flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-lg font-extrabold text-ink-900">Also explore nearby vendors</h3>
            <p className="mt-1 text-[12px] text-ink-500">Compare more verified professionals in {vendor.city}.</p>
          </div>
          <Link to="/vendors" className={buttonStyles({ variant: 'outline' })}>Browse all vendors <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
}
