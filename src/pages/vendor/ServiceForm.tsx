import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Clock,
  Eye,
  ImagePlus,
  Info,
  ListChecks,
  MapPin,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wrench,
} from 'lucide-react';
import { CATEGORIES, getService } from '@/lib/data';
import { cn, inr, minsToLabel } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { Badge, Button, buttonStyles, Card, Checkbox, Input, Select, Switch, Tabs, Textarea } from '@/components/ui/primitives';
import { PageHeader } from '@/components/ui/data-display';
import { RatingStars } from '@/components/ui/primitives';
import { SmartImage } from '@/components/marketplace';

const DURATIONS = [30, 45, 60, 90, 120, 180, 240, 300, 480];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

export default function VendorServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const existing = getService(id);
  const isEdit = Boolean(id && existing && existing.vendorId === (user?.vendorId ?? 'v1'));
  const setStatus = useApp((s) => s.setVendorServiceStatus);

  const [tab, setTab] = useState('basics');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: existing?.name ?? '',
    categoryId: existing?.categoryId ?? 'c1',
    description: existing?.description ?? '',
    price: existing?.price ?? 999,
    priceType: existing?.priceType ?? 'fixed',
    duration: existing?.duration ?? 120,
    serviceAt: existing?.serviceAt ?? 'Customer location',
    cancellation: existing?.cancellation ?? 'Flexible',
    maxAdvance: existing?.maxAdvance ?? 30,
    notice: existing?.notice ?? 4,
    includes: existing?.includes ?? ['All equipment and supplies', 'Trained & verified professionals', 'Post-service inspection'],
    tags: existing?.tags ?? ['Deep cleaning', 'Eco-friendly'],
    addOns: existing?.addOns ?? [{ name: '', price: 0, duration: 30 }],
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    slots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
    instantBook: true,
    requiresApproval: false,
    newTag: '',
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Give your service a clear name.';
    if (form.description.trim().length < 60) next.description = 'Description should be at least 60 characters.';
    if (!form.price || form.price <= 0) next.price = 'Enter a valid price greater than zero.';
    if (!form.slots.length) next.slots = 'Choose at least one time slot.';
    if (!form.days.length) next.days = 'Select at least one working day.';
    setErrors(next);
    return next;
  };

  const submit = (status: 'draft' | 'pending') => {
    const next = validate();
    if (Object.keys(next).length) {
      setTab(next.slots || next.days ? 'availability' : next.description ? 'basics' : 'pricing');
      toast.error('A few fields need attention', 'Fix the highlighted fields before saving.');
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      if (existing) setStatus(existing.id, status === 'draft' ? 'draft' : 'published');
      toast.success(status === 'draft' ? 'Draft saved' : 'Service published', status === 'draft' ? 'You can finish and publish anytime.' : 'Your service is now live on the marketplace.');
      navigate('/vendor/services');
    }, 900);
  };

  const pricePreview = useMemo(() => {
    const addonTotal = form.addOns.reduce((a, x) => a + (Number(x.price) || 0), 0);
    return form.price + addonTotal;
  }, [form.price, form.addOns]);

  const fieldError = (key: string) =>
    errors[key] ? <p className="mt-1 text-[10.5px] font-medium text-rose-600">{errors[key]}</p> : null;

  return (
    <div>
      <Link to="/vendor/services" className="mb-4 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-500 transition hover:text-brand-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to services
      </Link>

      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-600"><Wrench className="h-3.5 w-3.5" /> {isEdit ? 'Editing service' : 'New service'}</span>}
        title={isEdit ? form.name || 'Edit service' : 'Create a new service'}
        description="Customers see this information before booking. Be specific about what is included and how long it takes."
        actions={
          <>
            <Button variant="outline" size="md" iconLeft={<Eye className="h-4 w-4" />} onClick={() => setPreview(true)}>Preview</Button>
            <Button variant="outline" size="md" iconLeft={<Save className="h-4 w-4" />} onClick={() => submit('draft')}>Save draft</Button>
            <Button size="md" loading={saving} iconLeft={!saving ? <Check className="h-4 w-4" /> : undefined} onClick={() => submit('pending')}>{isEdit ? 'Save & publish' : 'Publish service'}</Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <Tabs
            variant="underline"
            value={tab}
            onChange={setTab}
            items={[
              { key: 'basics', label: 'Basics' },
              { key: 'pricing', label: 'Pricing & add-ons' },
              { key: 'availability', label: 'Availability' },
              { key: 'requirements', label: 'Requirements' },
            ]}
          />

          <div className="mt-5 space-y-5">
            {tab === 'basics' && (
              <Card className="p-5">
                <h3 className="text-[14px] font-bold text-ink-900">Service details</h3>
                <p className="mt-0.5 text-xs text-ink-500">Start with the essentials customers search for.</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <Input label="Service name" required placeholder="e.g. Deep Home Cleaning (3 BHK)" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select label="Category" required value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                      {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <Select label="Service location" value={form.serviceAt} onChange={(e) => set('serviceAt', e.target.value as typeof form.serviceAt)}>
                      <option>Customer location</option>
                      <option>Vendor location</option>
                      <option>Both</option>
                    </Select>
                  </div>
                  <div>
                    <Textarea label="Description" required placeholder="Explain exactly what the customer gets, which products you use, and any guarantees." value={form.description} onChange={(e) => set('description', e.target.value)} error={errors.description} hint={`${form.description.length} characters · aim for 150+`} />
                  </div>
                  <div>
                    <p className="field-label">What’s included</p>
                    <div className="space-y-2">
                      {form.includes.map((inc, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <input
                            value={inc}
                            onChange={(e) => set('includes', form.includes.map((x, xi) => (xi === i ? e.target.value : x)))}
                            className="h-9 flex-1 rounded-lg border border-ink-200 px-3 text-[12px] focus:border-brand-400 focus:outline-none"
                          />
                          <button onClick={() => set('includes', form.includes.filter((_, xi) => xi !== i))} className="rounded-md p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                      <button onClick={() => set('includes', [...form.includes, ''])} className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700"><Plus className="h-3.5 w-3.5" /> Add inclusion</button>
                    </div>
                  </div>
                  <div>
                    <p className="field-label">Search tags</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {form.tags.map((t) => (
                        <Badge key={t} tone="brand" size="sm">{t}<button onClick={() => set('tags', form.tags.filter((x) => x !== t))} className="ml-0.5 opacity-60 hover:opacity-100">×</button></Badge>
                      ))}
                      <input
                        value={form.newTag}
                        onChange={(e) => set('newTag', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && form.newTag.trim()) { set('tags', [...new Set([...form.tags, form.newTag.trim()])]); set('newTag', ''); }
                        }}
                        placeholder="Add tag + Enter"
                        className="h-7 w-32 rounded-full border border-dashed border-ink-300 px-2.5 text-[10.5px] focus:border-brand-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {tab === 'pricing' && (
              <>
                <Card className="p-5">
                  <h3 className="text-[14px] font-bold text-ink-900">Pricing</h3>
                  <p className="mt-0.5 text-xs text-ink-500">Set a base price. Servora commission is deducted automatically.</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Input label="Base price" required type="number" value={form.price} onChange={(e) => set('price', Number(e.target.value))} icon={<span className="text-xs font-bold">₹</span>} error={errors.price} />
                    </div>
                    <Select label="Price type" value={form.priceType} onChange={(e) => set('priceType', e.target.value as typeof form.priceType)}>
                      <option value="fixed">Fixed price</option>
                      <option value="hourly">Per hour</option>
                      <option value="session">Per session</option>
                      <option value="package">Package</option>
                    </Select>
                    <Select label="Duration" value={form.duration} onChange={(e) => set('duration', Number(e.target.value))}>
                      {DURATIONS.map((d) => <option key={d} value={d}>{minsToLabel(d)}</option>)}
                    </Select>
                    <Input label="Advance booking window" type="number" value={form.maxAdvance} onChange={(e) => set('maxAdvance', Number(e.target.value))} hint="How far ahead customers can book" suffix={<span className="text-xs">days</span>} />
                  </div>
                  <div className="mt-4 rounded-xl bg-ink-50 p-3.5">
                    <div className="flex items-center justify-between text-[11.5px]"><span className="text-ink-500">Customer pays</span><span className="font-bold text-ink-900">{inr(form.price)}</span></div>
                    <div className="mt-1.5 flex items-center justify-between text-[11.5px]"><span className="text-ink-500">Platform commission (12%)</span><span className="font-semibold text-rose-500">−{inr(Math.round(form.price * 0.12))}</span></div>
                    <div className="mt-1.5 flex items-center justify-between border-t border-ink-200 pt-1.5 text-[11.5px]"><span className="font-semibold text-ink-700">You earn</span><span className="font-extrabold text-emerald-600">{inr(Math.round(form.price * 0.88))}</span></div>
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[14px] font-bold text-ink-900">Add-ons</h3>
                      <p className="mt-0.5 text-xs text-ink-500">Optional extras customers can attach at checkout.</p>
                    </div>
                    <Button variant="outline" size="sm" iconLeft={<Plus className="h-4 w-4" />} onClick={() => set('addOns', [...form.addOns, { name: '', price: 0, duration: 30 }])}>Add</Button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {form.addOns.map((a, i) => (
                      <div key={i} className="grid grid-cols-[1fr_100px_auto] items-center gap-2">
                        <input value={a.name} onChange={(e) => set('addOns', form.addOns.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)))} placeholder="Add-on name" className="h-10 rounded-xl border border-ink-200 px-3 text-[12px] focus:border-brand-400 focus:outline-none" />
                        <input type="number" value={a.price} onChange={(e) => set('addOns', form.addOns.map((x, xi) => (xi === i ? { ...x, price: Number(e.target.value) } : x)))} placeholder="₹" className="h-10 rounded-xl border border-ink-200 px-3 text-[12px] focus:border-brand-400 focus:outline-none" />
                        <button onClick={() => set('addOns', form.addOns.filter((_, xi) => xi !== i))} className="rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                    {form.addOns.length === 0 && <p className="rounded-xl border border-dashed border-ink-200 py-6 text-center text-[11px] text-ink-400">No add-ons yet. Add one to increase average order value.</p>}
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-[14px] font-bold text-ink-900">Cancellation policy</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {(['Flexible', 'Moderate', 'Strict'] as const).map((p) => (
                      <button key={p} onClick={() => set('cancellation', p)} className={cn('rounded-xl border p-3 text-left transition', form.cancellation === p ? 'border-brand-300 bg-brand-50/60 ring-1 ring-brand-300' : 'border-ink-200 hover:border-ink-300')}>
                        <p className="text-[12px] font-bold text-ink-900">{p}</p>
                        <p className="mt-0.5 text-[10px] leading-4 text-ink-500">{p === 'Flexible' ? 'Free cancellation up to 12h before' : p === 'Moderate' ? 'Free cancellation up to 24h before' : '50% refund up to 48h before'}</p>
                      </button>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {tab === 'availability' && (
              <Card className="p-5">
                <h3 className="text-[14px] font-bold text-ink-900">Weekly availability</h3>
                <p className="mt-0.5 text-xs text-ink-500">Choose the days and slots customers can book.</p>
                <div className="mt-4">
                  <p className="field-label">Working days</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map((day) => (
                      <button key={day} onClick={() => set('days', form.days.includes(day) ? form.days.filter((d) => d !== day) : [...form.days, day])} className={cn('h-9 w-11 rounded-lg border text-[11.5px] font-bold transition', form.days.includes(day) ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 text-ink-500 hover:border-ink-300')}>{day}</button>
                    ))}
                  </div>
                  {fieldError('days')}
                </div>
                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <p className="field-label mb-0">Available start times</p>
                    <button onClick={() => set('slots', form.slots.length === SLOTS.length ? [] : [...SLOTS])} className="text-[10.5px] font-bold text-brand-700">{form.slots.length === SLOTS.length ? 'Clear all' : 'Select all'}</button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {SLOTS.map((slot) => (
                      <button key={slot} onClick={() => set('slots', form.slots.includes(slot) ? form.slots.filter((s) => s !== slot) : [...form.slots, slot])} className={cn('h-9 rounded-lg border text-[11px] font-semibold transition', form.slots.includes(slot) ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-ink-200 text-ink-400 hover:border-ink-300')}>{slot}</button>
                    ))}
                  </div>
                  {fieldError('slots')}
                </div>
                <div className="mt-5 space-y-3 border-t border-ink-100 pt-4">
                  <Switch checked={form.instantBook} onChange={(v) => set('instantBook', v)} label="Instant booking" description="Confirm bookings automatically if the slot is available." />
                  <Switch checked={form.requiresApproval} onChange={(v) => set('requiresApproval', v)} label="Require manual approval" description="Review each request before confirming. Slower but gives you control." />
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-[11px] leading-5 text-amber-800">Short-notice bookings (under {form.notice} hours) are blocked automatically. You can change this under Settings → Booking rules.</p>
                </div>
              </Card>
            )}

            {tab === 'requirements' && (
              <Card className="p-5">
                <h3 className="flex items-center gap-2 text-[14px] font-bold text-ink-900"><ListChecks className="h-4 w-4 text-brand-600" /> Customer questions</h3>
                <p className="mt-0.5 text-xs text-ink-500">Ask only what you need to deliver the service well.</p>
                <div className="mt-4 space-y-3">
                  {[
                    { q: 'How many rooms need cleaning?', type: 'Select: 1 BHK, 2 BHK, 3 BHK, 4+ BHK', required: true },
                    { q: 'Any pets at home?', type: 'Yes / No', required: true },
                    { q: 'Gate access instructions', type: 'Long text', required: false },
                  ].map((item) => (
                    <div key={item.q} className="rounded-xl border border-ink-200 p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[12px] font-bold text-ink-800">{item.q} {item.required && <span className="text-rose-500">*</span>}</p>
                          <p className="mt-0.5 text-[10.5px] text-ink-500">{item.type}</p>
                        </div>
                        <Badge tone={item.required ? 'brand' : 'neutral'} size="sm">{item.required ? 'Required' : 'Optional'}</Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" iconLeft={<Plus className="h-4 w-4" />} onClick={() => toast.info('Question builder', 'Custom questions can be added in the full product.')}>Add question</Button>
                </div>
                <div className="mt-5 border-t border-ink-100 pt-4">
                  <Textarea label="Internal notes" hint="Only visible to you and your staff." placeholder="e.g. Bring the steamer for sofa jobs; parking is in basement 2." defaultValue="" />
                </div>
              </Card>
            )}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Link to="/vendor/services" className={buttonStyles({ variant: 'ghost', size: 'md' })}>Cancel</Link>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => submit('draft')} iconLeft={<Save className="h-4 w-4" />}>Save draft</Button>
              <Button loading={saving} onClick={() => submit('pending')} iconLeft={!saving ? <Check className="h-4 w-4" /> : undefined}>{isEdit ? 'Save & publish' : 'Publish service'}</Button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="border-b border-ink-100 px-4 py-3">
              <p className="text-[12px] font-bold text-ink-900">Live listing preview</p>
            </div>
            <div className="p-4">
              <div className="overflow-hidden rounded-xl border border-ink-200">
                <div className="relative h-32">
                  <SmartImage src={existing?.image ?? ''} alt={form.name || 'Service'} className="h-full w-full object-cover" />
                  <div className="absolute left-2 top-2"><Badge tone="neutral" size="sm" variant="solid">{form.cancellation}</Badge></div>
                  <button onClick={() => toast.info('Photo picker', 'Demo mode uses a curated image.')} className="absolute bottom-2 right-2 rounded-lg bg-white/90 p-1.5 text-ink-600 backdrop-blur"><ImagePlus className="h-3.5 w-3.5" /></button>
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-[12.5px] font-bold text-ink-900">{form.name || 'Your service name'}</p>
                  <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-4 text-ink-500">{form.description || 'Your description will appear here. Explain what is included and why customers should book you.'}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <RatingStars value={4.9} count={0} size={11} showValue={false} />
                    <div className="text-right"><p className="text-[13px] font-extrabold text-ink-900">{inr(form.price)}</p><p className="text-[9px] text-ink-400">{minsToLabel(form.duration)} · {form.priceType}</p></div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[9.5px] text-ink-400"><MapPin className="h-3 w-3" /> {form.serviceAt}</div>
                </div>
              </div>
              <p className="mt-2 text-center text-[9.5px] text-ink-400">Preview updates as you type</p>
            </div>
          </Card>

          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-ink-900"><Sparkles className="h-4 w-4 text-amber-500" /> Quality score</p>
            <div className="mt-3 space-y-2">
              {[
                { label: 'Clear title', done: form.name.length > 8 },
                { label: 'Detailed description', done: form.description.length >= 60 },
                { label: 'Inclusions listed', done: form.includes.filter(Boolean).length >= 2 },
                { label: 'Availability set', done: form.slots.length > 0 && form.days.length > 0 },
                { label: 'Add-ons offered', done: form.addOns.some((a) => a.name && a.price > 0) },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-[11px]">
                  <span className={cn('flex h-4 w-4 items-center justify-center rounded-full', c.done ? 'bg-emerald-100 text-emerald-600' : 'bg-ink-100 text-ink-300')}>{c.done ? <Check className="h-3 w-3" /> : '·'}</span>
                  <span className={c.done ? 'text-ink-600' : 'text-ink-400'}>{c.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
              <span className="text-[10.5px] text-ink-500">Est. customer total</span>
              <span className="text-[13px] font-extrabold text-ink-900">{inr(pricePreview)}</span>
            </div>
          </Card>

          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-ink-900"><Clock className="h-4 w-4 text-brand-600" /> Booking rules</p>
            <div className="mt-2 space-y-2 text-[10.5px] text-ink-500">
              <div className="flex justify-between"><span>Minimum notice</span><span className="font-semibold text-ink-700">{form.notice} hours</span></div>
              <div className="flex justify-between"><span>Booking window</span><span className="font-semibold text-ink-700">{form.maxAdvance} days</span></div>
              <div className="flex justify-between"><span>Instant book</span><span className="font-semibold text-ink-700">{form.instantBook ? 'On' : 'Off'}</span></div>
              <div className="flex justify-between"><span>Approval</span><span className="font-semibold text-ink-700">{form.requiresApproval ? 'Manual' : 'Automatic'}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
