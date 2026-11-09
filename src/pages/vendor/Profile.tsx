import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Camera,
  Check,
  Clock,
  ExternalLink,
  Globe,
  ImagePlus,
  Info,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  Upload,
} from 'lucide-react';
import { CATEGORIES, getVendor } from '@/lib/data';
import { cn, inr } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Badge, Button, buttonStyles, Card, Input, Progress, Select, Skeleton, Switch, Tabs, Textarea } from '@/components/ui/primitives';
import { PageHeader, SectionCard } from '@/components/ui/data-display';
import { SmartImage } from '@/components/marketplace';
import { Modal } from '@/components/ui/overlays';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function VendorProfile() {
  const { user } = useAuth();
  const loading = useMockLoad(380);
  const vendor = getVendor(user?.vendorId ?? 'v1')!;

  const [tab, setTab] = useState('business');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: vendor.name,
    tagline: vendor.tagline,
    description: vendor.description,
    categoryId: vendor.categoryId,
    email: vendor.email,
    phone: vendor.phone,
    website: vendor.website ?? '',
    address: vendor.address,
    area: vendor.area,
    city: vendor.city,
    radius: vendor.radius,
    languages: vendor.languages,
    instagram: vendor.socials.instagram ?? '',
    facebook: vendor.socials.facebook ?? '',
  });
  const [hours, setHours] = useState(vendor.hours);
  const [policies, setPolicies] = useState(vendor.policies);
  const [gallery, setGallery] = useState(vendor.gallery);
  const [newLanguage, setNewLanguage] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form, value: string | number | string[]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Business name is required.';
    if (!form.email.includes('@')) next.email = 'Enter a valid email address.';
    if (!form.phone.trim()) next.phone = 'A contact number is required.';
    if (!form.description.trim()) next.description = 'Add a short description for customers.';
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error('Check the highlighted fields', 'A few details need your attention before saving.');
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      toast.success('Profile updated', 'Your public business profile has been saved.');
    }, 800);
  };

  const toggleLanguage = (lang: string) =>
    set('languages', form.languages.includes(lang) ? form.languages.filter((l) => l !== lang) : [...form.languages, lang]);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-xl" />
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[520px]" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-emerald-600"><BadgeCheck className="h-3.5 w-3.5" /> Verified business</span>}
        title="Business profile"
        description="This is what customers see across the marketplace. Keep your details, hours and policies accurate."
        actions={
          <>
            <Button variant="outline" size="md" iconLeft={<ExternalLink className="h-4 w-4" />} onClick={() => setPreviewOpen(true)}>
              Preview
            </Button>
            <Button size="md" loading={saving} iconLeft={!saving ? <Check className="h-4 w-4" /> : undefined} onClick={save}>
              Save changes
            </Button>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Profile completeness', value: '92%', hint: '2 steps left', tone: 'success' as const, pct: 92 },
          { label: 'Public rating', value: vendor.rating.toFixed(1), hint: `${vendor.reviewCount} reviews`, tone: 'violet' as const, pct: 98 },
          { label: 'Response rate', value: '98%', hint: 'avg 12 min', tone: 'brand' as const, pct: 98 },
          { label: 'Jobs completed', value: vendor.jobsDone.toLocaleString('en-IN'), hint: `since ${vendor.since}`, tone: 'teal' as const, pct: 88 },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-[11px] font-semibold text-ink-500">{s.label}</p>
            <div className="mt-1 flex items-end justify-between">
              <p className="font-display text-[22px] font-extrabold text-ink-900">{s.value}</p>
              <span className="text-[10px] text-ink-400">{s.hint}</span>
            </div>
            <Progress value={s.pct} tone={s.tone} size="sm" className="mt-2.5" />
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.65fr_1fr]">
        <div className="min-w-0 space-y-5">
          <Tabs
            variant="underline"
            value={tab}
            onChange={setTab}
            items={[
              { key: 'business', label: 'Business info' },
              { key: 'hours', label: 'Opening hours' },
              { key: 'gallery', label: 'Gallery', count: gallery.length },
              { key: 'policies', label: 'Policies' },
              { key: 'verification', label: 'Verification' },
            ]}
          />

          {tab === 'business' && (
            <SectionCard title="Business information" description="Shown on your vendor page and service listings.">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Business name" required value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
                  <Select label="Primary category" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>
                <Input label="Tagline" hint="One line that captures what makes you different." value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
                <Textarea label="About your business" required value={form.description} onChange={(e) => set('description', e.target.value)} error={errors.description} hint="Minimum 80 characters. Mention experience, guarantees and team." />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Contact email" required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} icon={<Globe className="h-4 w-4" />} />
                  <Input label="Phone number" required value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} icon={<Phone className="h-4 w-4" />} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Website" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="www.yourbusiness.com" />
                  <Input label="Instagram handle" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@yourbrand" />
                </div>
                <div className="h-px bg-ink-100" />
                <div>
                  <p className="field-label">Service address</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input value={form.address} onChange={(e) => set('address', e.target.value)} icon={<MapPin className="h-4 w-4" />} containerClassName="sm:col-span-2" />
                    <Input value={form.area} onChange={(e) => set('area', e.target.value)} placeholder="Area / locality" />
                    <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Service radius"
                    type="number"
                    value={form.radius}
                    onChange={(e) => set('radius', Number(e.target.value))}
                    hint="Customers within this radius can book you."
                    suffix={<span className="text-xs">km</span>}
                  />
                  <div>
                    <p className="field-label">Languages spoken</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['English', 'Hindi', 'Marathi', 'Kannada', 'Tamil', 'Telugu'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => toggleLanguage(lang)}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition',
                            form.languages.includes(lang)
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300',
                          )}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-3">
                  <Plus className="h-4 w-4 text-ink-400" />
                  <input
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLanguage.trim()) {
                        toggleLanguage(newLanguage.trim());
                        setNewLanguage('');
                      }
                    }}
                    placeholder="Add another language and press Enter"
                    className="w-full bg-transparent text-[12px] text-ink-700 placeholder:text-ink-400 focus:outline-none"
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {tab === 'hours' && (
            <SectionCard title="Opening hours" description="Customers can only book slots within these hours. Time zone: IST." action={<Badge tone="success" size="sm">Open now</Badge>}>
              <div className="divide-y divide-ink-100">
                {dayNames.map((day, idx) => {
                  const h = hours.find((x) => x.day === day) ?? { day, open: '09:00', close: '19:00' };
                  return (
                    <div key={day} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="w-24 text-[12.5px] font-semibold text-ink-800">{day}</span>
                      <div className={cn('flex flex-1 items-center gap-2', h.closed && 'opacity-40')}>
                        <input
                          type="time"
                          value={h.open}
                          disabled={h.closed}
                          onChange={(e) => setHours((prev) => prev.map((x) => (x.day === day ? { ...x, open: e.target.value } : x)))}
                          className="h-9 rounded-lg border border-ink-200 px-2.5 text-[12px] font-semibold text-ink-700 disabled:bg-ink-50"
                        />
                        <span className="text-ink-300">to</span>
                        <input
                          type="time"
                          value={h.close}
                          disabled={h.closed}
                          onChange={(e) => setHours((prev) => prev.map((x) => (x.day === day ? { ...x, close: e.target.value } : x)))}
                          className="h-9 rounded-lg border border-ink-200 px-2.5 text-[12px] font-semibold text-ink-700 disabled:bg-ink-50"
                        />
                      </div>
                      <div className="flex w-28 items-center justify-end gap-2">
                        <span className={cn('text-[10.5px] font-semibold', h.closed ? 'text-ink-400' : 'text-emerald-600')}>{h.closed ? 'Closed' : 'Open'}</span>
                        <Switch
                          checked={!h.closed}
                          onChange={(v) => setHours((prev) => prev.map((x) => (x.day === day ? { ...x, closed: !v } : x)))}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50/60 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <p className="text-[11px] leading-5 text-sky-800">Holiday closures can be added from the Calendar page. Bookings already confirmed on a closed day are not cancelled automatically.</p>
              </div>
            </SectionCard>
          )}

          {tab === 'gallery' && (
            <SectionCard title="Work gallery" description="Real photos build trust. Use bright, uncluttered images of completed jobs." action={<Badge tone="neutral" size="sm">{gallery.length} / 12</Badge>}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((src, i) => (
                  <div key={`${src}-${i}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-ink-200">
                    <SmartImage src={src} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-ink-950/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                      <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur">{i === 0 ? 'Cover' : `Photo ${i + 1}`}</span>
                      <button onClick={() => { setGallery((g) => g.filter((_, x) => x !== i)); toast.info('Photo removed', 'Save changes to publish the updated gallery.'); }} className="rounded-md bg-white/90 p-1.5 text-ink-700 hover:bg-white">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => { setGallery((g) => [...g, vendor.cover]); toast.success('Photo added', 'Demo upload complete — save to publish.'); }}
                  className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-300 bg-ink-50/50 text-ink-400 transition hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-[10.5px] font-semibold">Add photo</span>
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-ink-200 p-3">
                <Upload className="h-4 w-4 text-ink-400" />
                <p className="text-[11px] text-ink-500">JPG or PNG up to 8 MB. Recommended 1600 × 1200 px. Avoid stock photos.</p>
              </div>
            </SectionCard>
          )}

          {tab === 'policies' && (
            <SectionCard title="Cancellation & refund policies" description="Clear policies reduce disputes. Customers must accept these at checkout.">
              <div className="space-y-4">
                <Textarea label="Cancellation policy" value={policies.cancellation} onChange={(e) => setPolicies((p) => ({ ...p, cancellation: e.target.value }))} />
                <Textarea label="Reschedule policy" value={policies.reschedule} onChange={(e) => setPolicies((p) => ({ ...p, reschedule: e.target.value }))} />
                <Textarea label="Refund & guarantee policy" value={policies.refund} onChange={(e) => setPolicies((p) => ({ ...p, refund: e.target.value }))} />
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
                  <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-amber-900"><ShieldCheck className="h-4 w-4" /> Platform minimums</p>
                  <p className="mt-1 text-[11px] leading-5 text-amber-800">Servora requires at least 4 hours free cancellation for hourly services and 12 hours for full-day packages. Stricter policies may reduce conversion.</p>
                </div>
              </div>
            </SectionCard>
          )}

          {tab === 'verification' && (
            <SectionCard title="Verification & compliance" description="Verified badges are displayed on your profile and improve ranking.">
              <div className="space-y-3">
                {[
                  { label: 'Business identity (GSTIN)', detail: '27AABCS1429P1Z8 · verified 12 Mar 2026', done: true },
                  { label: 'Owner KYC', detail: 'PAN & Aadhaar matched · verified 12 Mar 2026', done: true },
                  { label: 'Police verification (staff)', detail: '2 of 2 staff verified', done: true },
                  { label: 'Insurance certificate', detail: 'Public liability ₹10L · expires 30 Jun 2027', done: true },
                  { label: 'Trade licence', detail: 'Upload renewed licence before 31 Dec 2026', done: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 rounded-xl border border-ink-200 p-3.5">
                    <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', item.done ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600')}>
                      {item.done ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-ink-800">{item.label}</p>
                      <p className="text-[10.5px] text-ink-500">{item.detail}</p>
                    </div>
                    <Badge tone={item.done ? 'success' : 'warning'} size="sm">{item.done ? 'Verified' : 'Action needed'}</Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-4" iconLeft={<Upload className="h-4 w-4" />} onClick={() => toast.info('Upload started', 'Document uploads are simulated in this demo.')}>
                Upload document
              </Button>
            </SectionCard>
          )}
        </div>

        <div className="space-y-5">
          <SectionCard title="Live preview" description="How you appear in search results" bodyClassName="p-4">
            <div className="overflow-hidden rounded-xl border border-ink-200">
              <div className="relative h-28">
                <SmartImage src={vendor.cover} alt={vendor.name} className="h-full w-full object-cover" />
                <div className="absolute right-2 top-2"><Badge tone="success" size="sm" variant="solid"><BadgeCheck className="h-3 w-3" /> Verified</Badge></div>
              </div>
              <div className="p-3">
                <p className="text-[12.5px] font-bold text-ink-900">{form.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-4 text-ink-500">{form.tagline}</p>
                <div className="mt-2 flex items-center gap-2 text-[10.5px]">
                  <span className="inline-flex items-center gap-0.5 font-bold text-amber-600"><Sparkles className="h-3 w-3 fill-amber-400" /> {vendor.rating.toFixed(1)}</span>
                  <span className="text-ink-400">({vendor.reviewCount})</span>
                  <span className="ml-auto font-bold text-ink-800">from {inr(vendor.priceFrom)}</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-ink-400"><MapPin className="h-3 w-3" /> {form.area}, {form.city} · {form.radius} km</div>
              </div>
            </div>
            <button onClick={() => setPreviewOpen(true)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-ink-200 py-2 text-[11px] font-bold text-ink-600 transition hover:bg-ink-50">
              <ExternalLink className="h-3.5 w-3.5" /> Open full profile preview
            </button>
          </SectionCard>

          <SectionCard title="Profile tips" icon={<Sparkles className="h-4 w-4" />} bodyClassName="space-y-3">
            {[
              { title: 'Add 2 more work photos', text: 'Listings with 5+ photos get 38% more enquiries.', done: false },
              { title: 'Write a longer bio', text: 'Aim for 150+ words mentioning your guarantees.', done: false },
              { title: 'Keep hours updated', text: 'Accurate hours reduce no-shows and disputes.', done: true },
              { title: 'Upload renewed trade licence', text: 'Required before 31 December 2026.', done: false },
            ].map((tip) => (
              <div key={tip.title} className="flex items-start gap-2.5">
                <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', tip.done ? 'bg-emerald-100 text-emerald-600' : 'bg-ink-100 text-ink-400')}>
                  {tip.done ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                </span>
                <div>
                  <p className={cn('text-[11.5px] font-semibold', tip.done ? 'text-ink-400 line-through' : 'text-ink-800')}>{tip.title}</p>
                  <p className="text-[10px] leading-4 text-ink-500">{tip.text}</p>
                </div>
              </div>
            ))}
          </SectionCard>

          <Card className="overflow-hidden">
            <div className="bg-ink-950 p-4 text-white">
              <Store className="h-5 w-5 text-brand-300" />
              <p className="mt-2 text-[12.5px] font-bold">Your storefront link</p>
              <p className="mt-0.5 text-[10.5px] text-ink-400">Share this on WhatsApp and social media.</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2">
                <Globe className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                <span className="truncate font-mono text-[10.5px] text-ink-600">servora.in/vendors/{vendor.slug}</span>
              </div>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { navigator.clipboard?.writeText(`https://servora.in/vendors/${vendor.slug}`); toast.success('Link copied', 'Storefront URL copied to clipboard.'); }}>Copy link</Button>
                <Link to={`/vendors/${vendor.slug}`} className={buttonStyles({ variant: 'soft', size: 'sm', className: 'flex-1' })}>View page</Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Customer-facing preview"
        description="This is how your storefront appears on the marketplace."
        size="lg"
        icon={<Camera className="h-5 w-5" />}
        footer={<Button variant="outline" onClick={() => setPreviewOpen(false)}>Close preview</Button>}
      >
        <div className="overflow-hidden rounded-xl border border-ink-200">
          <div className="relative h-44"><SmartImage src={vendor.cover} alt={vendor.name} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" /><div className="absolute bottom-3 left-4 text-white"><p className="font-display text-lg font-extrabold">{form.name}</p><p className="text-[11px] text-white/80">{form.tagline}</p></div></div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {vendor.certifications.map((c) => <Badge key={c} tone="neutral" size="sm">{c}</Badge>)}
            </div>
            <p className="mt-3 text-[12px] leading-6 text-ink-600">{form.description}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
