import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Landmark,
  MapPin,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserRound,
  Wrench,
} from 'lucide-react';
import { CATEGORIES, CITIES } from '@/lib/data';
import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { cn } from '@/lib/utils';
import { Badge, Button, buttonStyles, Card, Checkbox, Input, Progress, Select, Switch, Textarea } from '@/components/ui/primitives';
import { PageHeader, SectionCard, Timeline } from '@/components/ui/data-display';

const steps = [
  { key: 'business', label: 'Business', icon: Building2, hint: 'Name, category and location' },
  { key: 'documents', label: 'Verification', icon: FileCheck2, hint: 'GST, PAN and identity' },
  { key: 'services', label: 'Services', icon: Wrench, hint: 'What you offer and pricing' },
  { key: 'operations', label: 'Operations', icon: Landmark, hint: 'Hours and bank account' },
  { key: 'review', label: 'Review', icon: ShieldCheck, hint: 'Submit for approval' },
];

export default function VendorOnboarding() {
  const { user } = useAuth();
  const onboardingStatus = useApp((s) => s.onboardingStatus);
  const setOnboarding = useApp((s) => s.setOnboarding);
  const storeStep = useApp((s) => s.onboardingStep);
  const setStoreStep = useApp((s) => s.setOnboardingStep);

  const [step, setStep] = useState(Math.min(storeStep - 1, 4));
  const [submitted, setSubmitted] = useState(onboardingStatus === 'submitted' || onboardingStatus === 'under_review');
  const [approved, setApproved] = useState(onboardingStatus === 'approved');

  const [business, setBusiness] = useState({
    name: 'SparkleHome Cleaning Co.',
    legalName: 'SparkleHome Services LLP',
    category: CATEGORIES[0].id,
    city: user?.city ?? 'Mumbai',
    area: 'Andheri West',
    address: '402, Sunrise Business Park, New Link Road',
    phone: user?.phone ?? '+91 98200 41120',
    email: user?.email ?? 'vendor@servora.demo',
    website: 'https://sparklehome.demo',
    about: 'A trained, background-verified cleaning crew serving Mumbai since 2019. We specialise in deep cleans, sofa care and move-in/move-out services.',
  });
  const [docs, setDocs] = useState({
    gstin: '27AAKCS1234F1Z5',
    pan: 'AAKCS1234F',
    idType: 'Aadhaar',
    registration: true,
    insurance: true,
    uploads: { gst: true, pan: true, id: false, registration: false } as Record<string, boolean>,
  });
  const [selectedCats, setSelectedCats] = useState<string[]>([CATEGORIES[0].id]);
  const [serviceTiers, setServiceTiers] = useState({ standard: true, deep: true, premium: false });
  const [basePrice, setBasePrice] = useState('1499');
  const [hours, setHours] = useState({ mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false });
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('20:00');
  const [radius, setRadius] = useState('15');
  const [bank, setBank] = useState({ holder: 'Neha Kulkarni', account: '50200041120874', ifsc: 'HDFC0000240', type: 'Current', name: 'HDFC Bank' });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeStep = steps[step];

  const progress = useMemo(() => {
    let p = 20;
    if (business.name && business.address) p += 20;
    if (docs.gstin && docs.pan) p += 20;
    if (selectedCats.length) p += 20;
    if (bank.account) p += 20;
    return Math.min(100, p);
  }, [business, docs, selectedCats, bank]);

  const next = () => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (business.name.trim().length < 3) errs.name = 'Enter your business name.';
      if (!business.address.trim()) errs.address = 'Enter your registered address.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(business.email)) errs.email = 'Enter a valid business email.';
    }
    if (step === 1) {
      if (docs.gstin.length !== 15) errs.gstin = 'GSTIN must be 15 characters.';
      if (docs.pan.length !== 10) errs.pan = 'PAN must be 10 characters.';
    }
    if (step === 2) {
      if (!selectedCats.length) errs.categories = 'Select at least one category.';
      if (!basePrice || Number(basePrice) < 99) errs.basePrice = 'Set a starting price of at least ₹99.';
    }
    if (step === 3) {
      if (bank.account.replace(/\D/g, '').length < 9) errs.account = 'Enter a valid account number.';
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc)) errs.ifsc = 'Enter a valid IFSC code.';
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Check this step', Object.values(errs)[0]);
      return;
    }
    if (step < 4) {
      setStep((s) => s + 1);
      setStoreStep(step + 2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const submit = () => {
    if (!agree) {
      toast.error('Accept the marketplace agreement', 'You must agree before submitting.');
      return;
    }
    setOnboarding('submitted');
    setSubmitted(true);
    toast.success('Application submitted', 'Our trust team will review it within 2 business days.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (submitted || onboardingStatus === 'under_review') {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-card">
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-900 px-6 py-10 text-center text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_20%_20%,rgba(255,255,255,.18),transparent_40%)]" />
            <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-8 ring-white/10">
              <Clock className="h-8 w-8" />
            </span>
            <h1 className="relative mt-4 font-display text-[26px] font-extrabold">Application under review</h1>
            <p className="relative mt-1.5 text-[12.5px] text-brand-100">Submitted for verification · Reference APP-2026-0412</p>
          </div>
          <div className="p-6">
            <Timeline
              items={[
                { title: 'Application submitted', description: 'Business details, documents and bank account received.', time: 'Just now', done: true },
                { title: 'Document verification', description: 'GST, PAN and identity checks in progress.', time: 'Within 4 hours', current: true },
                { title: 'Quality review', description: 'Our trust team reviews your services and coverage areas.', time: '1–2 business days' },
                { title: 'Go live', description: 'Your store becomes visible and you can accept bookings.', time: 'After approval' },
              ]}
            />
            <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
              <p className="flex items-center gap-2 text-[11.5px] font-bold text-brand-900"><ShieldCheck className="h-4 w-4" /> While you wait</p>
              <p className="mt-1 text-[10.5px] leading-5 text-brand-800">You can prepare your services, add staff and set your calendar. Changes are saved as drafts and go live automatically on approval.</p>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link to="/vendor/dashboard" className={buttonStyles({ size: 'lg', className: 'flex-1' })}>Go to dashboard</Link>
              <Link to="/vendor/services" className={buttonStyles({ variant: 'outline', size: 'lg', className: 'flex-1' })}>Prepare services</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (approved && !submitted) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><BadgeCheck className="h-6 w-6" /></span>
            <div>
              <h1 className="font-display text-xl font-extrabold text-ink-900">You’re approved and live</h1>
              <p className="mt-1 text-[12.5px] leading-6 text-ink-500">SparkleHome Cleaning Co. is verified and visible to customers in Mumbai. You can update your business details anytime — changes to legal documents need re-verification.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="success" size="md"><CheckCircle2 className="h-3.5 w-3.5" /> KYC verified</Badge>
                <Badge tone="success" size="md"><CheckCircle2 className="h-3.5 w-3.5" /> Bank verified</Badge>
                <Badge tone="success" size="md"><CheckCircle2 className="h-3.5 w-3.5" /> GST verified</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/vendor/dashboard" className={buttonStyles({ size: 'md' })}>Go to dashboard</Link>
                <Link to="/vendor/profile" className={buttonStyles({ variant: 'outline', size: 'md' })}>Edit business profile</Link>
                <Button variant="ghost" size="md" onClick={() => setApproved(false)}>Re-run verification</Button>
              </div>
            </div>
          </div>
        </Card>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Sparkles, title: 'Store is live', text: 'Customers can find and book you.' },
            { icon: Banknote, title: 'Payouts enabled', text: 'Weekly settlements to HDFC •••• 4421.' },
            { icon: ShieldCheck, title: 'Trust badge on', text: 'Displayed on your profile and services.' },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-ink-200 bg-white p-4">
              <c.icon className="h-4.5 w-4.5 text-emerald-600" />
              <p className="mt-2 text-[11.5px] font-bold text-ink-800">{c.title}</p>
              <p className="text-[10.5px] text-ink-500">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Vendor onboarding"
        description="Five short steps to verify your business and go live on Servora."
        actions={<Badge tone={progress === 100 ? 'success' : 'warning'} size="md">{progress}% complete</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <div className="mb-4 overflow-hidden rounded-2xl border border-ink-200 bg-white">
            <div className="flex overflow-x-auto">
              {steps.map((s, i) => (
                <button
                  key={s.key}
                  onClick={() => i <= step && setStep(i)}
                  className={cn('relative flex min-w-[120px] flex-1 items-center gap-2 px-3 py-3 text-left transition', i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-brand-50 text-brand-700' : 'text-ink-400')}
                >
                  <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', i === step ? 'bg-white/20' : i < step ? 'bg-brand-600 text-white' : 'bg-ink-100')}>
                    {i < step ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-bold">{s.label}</span>
                    <span className={cn('hidden truncate text-[8.5px] sm:block', i === step ? 'text-white/60' : 'text-ink-400')}>{s.hint}</span>
                  </span>
                </button>
              ))}
            </div>
            <Progress value={progress} tone="success" size="sm" className="rounded-none" />
          </div>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2.5 border-b border-ink-100 pb-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><activeStep.icon className="h-4.5 w-4.5" /></span>
              <div>
                <h2 className="text-[15px] font-bold text-ink-900">{activeStep.label}</h2>
                <p className="text-[10.5px] text-ink-500">Step {step + 1} of {steps.length} · {activeStep.hint}</p>
              </div>
            </div>

            {step === 0 && (
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Input label="Business name" value={business.name} onChange={(e) => { setBusiness((b) => ({ ...b, name: e.target.value })); setErrors((x) => ({ ...x, name: '' })); }} error={errors.name} required />
                <Input label="Legal entity name" value={business.legalName} onChange={(e) => setBusiness((b) => ({ ...b, legalName: e.target.value }))} />
                <Select label="Primary category" value={business.category} onChange={(e) => setBusiness((b) => ({ ...b, category: e.target.value }))}>
                  {CATEGORIES.slice(0, 8).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Select label="City" value={business.city} onChange={(e) => setBusiness((b) => ({ ...b, city: e.target.value }))}>
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </Select>
                <Input label="Area / locality" value={business.area} onChange={(e) => setBusiness((b) => ({ ...b, area: e.target.value }))} />
                <Input label="Contact phone" value={business.phone} onChange={(e) => setBusiness((b) => ({ ...b, phone: e.target.value }))} />
                <Input label="Business email" type="email" value={business.email} onChange={(e) => { setBusiness((b) => ({ ...b, email: e.target.value })); setErrors((x) => ({ ...x, email: '' })); }} error={errors.email} />
                <Input label="Website (optional)" value={business.website} onChange={(e) => setBusiness((b) => ({ ...b, website: e.target.value }))} />
                <Input containerClassName="sm:col-span-2" label="Registered address" value={business.address} onChange={(e) => { setBusiness((b) => ({ ...b, address: e.target.value })); setErrors((x) => ({ ...x, address: '' })); }} error={errors.address} required />
                <Textarea containerClassName="sm:col-span-2" label="About your business" value={business.about} onChange={(e) => setBusiness((b) => ({ ...b, about: e.target.value }))} hint="Shown on your public profile. 40–400 characters." />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Input label="GSTIN" value={docs.gstin} onChange={(e) => { setDocs((d) => ({ ...d, gstin: e.target.value.toUpperCase() })); setErrors((x) => ({ ...x, gstin: '' })); }} error={errors.gstin} hint="15-character GST identification number." />
                  <Input label="PAN" value={docs.pan} onChange={(e) => { setDocs((d) => ({ ...d, pan: e.target.value.toUpperCase() })); setErrors((x) => ({ ...x, pan: '' })); }} error={errors.pan} hint="10-character business PAN." />
                  <Select label="Identity document" value={docs.idType} onChange={(e) => setDocs((d) => ({ ...d, idType: e.target.value }))}>
                    <option>Aadhaar</option><option>Passport</option><option>Driving licence</option><option>Voter ID</option>
                  </Select>
                  <div className="flex items-end">
                    <Badge tone="success" size="md"><ShieldCheck className="h-3.5 w-3.5" /> Instant GST & PAN validation</Badge>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[12px] font-bold text-ink-800">Upload documents</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { key: 'gst', label: 'GST certificate', hint: 'PDF or JPG · max 5 MB' },
                      { key: 'pan', label: 'PAN card', hint: 'PDF or JPG · max 5 MB' },
                      { key: 'id', label: 'Government ID', hint: 'Aadhaar / passport' },
                      { key: 'registration', label: 'Business registration', hint: 'Incorporation certificate' },
                    ].map((d) => (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => { setDocs((prev) => ({ ...prev, uploads: { ...prev.uploads, [d.key]: !prev.uploads[d.key] } })); toast.success(docs.uploads[d.key] ? 'File removed' : 'File uploaded', d.label); }}
                        className={cn('flex items-center gap-3 rounded-xl border p-3.5 text-left transition', docs.uploads[d.key] ? 'border-emerald-200 bg-emerald-50/60' : 'border-dashed border-ink-300 hover:border-brand-300 hover:bg-brand-50/30')}
                      >
                        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', docs.uploads[d.key] ? 'bg-emerald-100 text-emerald-600' : 'bg-ink-100 text-ink-500')}>
                          {docs.uploads[d.key] ? <FileCheck2 className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11.5px] font-bold text-ink-800">{d.label}</span>
                          <span className="block text-[9.5px] text-ink-400">{docs.uploads[d.key] ? 'Uploaded · verified format' : d.hint}</span>
                        </span>
                        {docs.uploads[d.key] && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 rounded-xl bg-ink-50 p-3.5">
                  <Checkbox checked={docs.registration} onChange={(v) => setDocs((d) => ({ ...d, registration: v }))} label="I have a valid business registration / incorporation certificate" />
                  <Checkbox checked={docs.insurance} onChange={(v) => setDocs((d) => ({ ...d, insurance: v }))} label="I hold public liability insurance for on-site work" />
                </div>
                <p className="flex items-center gap-1.5 text-[10px] text-ink-400"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Documents are encrypted and used only for verification. Never shared with customers.</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[12px] font-bold text-ink-800">Categories you serve</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {CATEGORIES.slice(0, 8).map((c) => {
                      const active = selectedCats.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCats((prev) => active ? prev.filter((x) => x !== c.id) : [...prev, c.id])}
                          className={cn('flex items-center gap-2.5 rounded-xl border p-3 text-left transition', active ? 'border-brand-300 bg-brand-50/60' : 'border-ink-200 hover:border-ink-300')}
                        >
                          <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500')}><Wrench className="h-4 w-4" /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11.5px] font-bold text-ink-800">{c.name}</span>
                            <span className="block text-[9.5px] text-ink-400">{c.vendors} vendors · from ₹{c.from}</span>
                          </span>
                          {active && <Check className="h-4 w-4 text-brand-600" />}
                        </button>
                      );
                    })}
                  </div>
                  {errors.categories && <p className="mt-1 text-xs font-medium text-rose-600">{errors.categories}</p>}
                </div>

                <div className="border-t border-ink-100 pt-4">
                  <p className="mb-2 text-[12px] font-bold text-ink-800">Service tiers</p>
                  <div className="space-y-2">
                    {[
                      { key: 'standard', label: 'Standard', desc: 'Regular maintenance and basic service' },
                      { key: 'deep', label: 'Deep clean / premium', desc: 'Intensive, multi-hour service' },
                      { key: 'premium', label: 'Specialist', desc: 'Repairs, treatments and specialist work' },
                    ].map((t) => (
                      <div key={t.key} className="flex items-center justify-between rounded-xl border border-ink-200 px-3.5 py-3">
                        <div><p className="text-[11.5px] font-bold text-ink-800">{t.label}</p><p className="text-[10px] text-ink-500">{t.desc}</p></div>
                        <Switch checked={serviceTiers[t.key as keyof typeof serviceTiers]} onChange={(v) => setServiceTiers((s) => ({ ...s, [t.key]: v }))} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Input label="Starting price (₹)" type="number" value={basePrice} onChange={(e) => { setBasePrice(e.target.value); setErrors((x) => ({ ...x, basePrice: '' })); }} error={errors.basePrice} hint="Customers see “from ₹X” on your profile." />
                  <Input label="Service radius (km)" type="number" value={radius} onChange={(e) => setRadius(e.target.value)} hint="Maximum distance you travel." />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[12px] font-bold text-ink-800">Operating hours</p>
                  <div className="overflow-hidden rounded-xl border border-ink-200">
                    {[
                      ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday'],
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center gap-3 border-b border-ink-100 px-3.5 py-2.5 last:border-0">
                        <Switch checked={hours[key as keyof typeof hours]} onChange={(v) => setHours((h) => ({ ...h, [key]: v }))} />
                        <span className="w-20 text-[11.5px] font-semibold text-ink-700">{label}</span>
                        <span className={cn('text-[10.5px]', hours[key as keyof typeof hours] ? 'text-ink-500' : 'text-ink-300')}>{hours[key as keyof typeof hours] ? `${openTime} – ${closeTime}` : 'Closed'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <Input label="Opens" type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
                    <Input label="Closes" type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
                  </div>
                </div>

                <div className="border-t border-ink-100 pt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-ink-800"><Banknote className="h-4 w-4 text-emerald-600" /> Settlement account</p>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Input label="Account holder" value={bank.holder} onChange={(e) => setBank((b) => ({ ...b, holder: e.target.value }))} />
                    <Input label="Bank name" value={bank.name} onChange={(e) => setBank((b) => ({ ...b, name: e.target.value }))} />
                    <Input label="Account number" value={bank.account} onChange={(e) => { setBank((b) => ({ ...b, account: e.target.value.replace(/\D/g, '') })); setErrors((x) => ({ ...x, account: '' })); }} error={errors.account} />
                    <Input label="IFSC" value={bank.ifsc} onChange={(e) => { setBank((b) => ({ ...b, ifsc: e.target.value.toUpperCase() })); setErrors((x) => ({ ...x, ifsc: '' })); }} error={errors.ifsc} />
                    <Select label="Account type" value={bank.type} onChange={(e) => setBank((b) => ({ ...b, type: e.target.value }))}><option>Current</option><option>Savings</option></Select>
                    <div className="flex items-end"><Badge tone="success" size="md"><ShieldCheck className="h-3.5 w-3.5" /> Penny-drop verified</Badge></div>
                  </div>
                  <p className="mt-2 text-[10px] text-ink-400">Weekly payouts every Tuesday. Commission is deducted automatically.</p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-ink-200">
                  <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/60 px-4 py-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Application summary</p>
                    <Badge tone="warning" size="sm">Ready to submit</Badge>
                  </div>
                  <div className="divide-y divide-ink-100">
                    {[
                      ['Business', `${business.name} · ${business.legalName}`],
                      ['Category', CATEGORIES.find((c) => c.id === business.category)?.name ?? '—'],
                      ['Location', `${business.area}, ${business.city}`],
                      ['Documents', `${Object.values(docs.uploads).filter(Boolean).length} of 4 uploaded · GST ${docs.gstin}`],
                      ['Services', `${selectedCats.length} categories · from ₹${basePrice}`],
                      ['Availability', `${Object.values(hours).filter(Boolean).length} days · ${openTime}–${closeTime}`],
                      ['Payouts', `${bank.name} •••• ${bank.account.slice(-4)} · ${bank.ifsc}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-start justify-between gap-4 px-4 py-2.5">
                        <span className="text-[11px] text-ink-500">{k}</span>
                        <span className="max-w-[60%] text-right text-[11px] font-semibold text-ink-800">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Checkbox
                  checked={agree}
                  onChange={setAgree}
                  label={<span>I confirm the information is accurate and agree to the <Link to="/policies/terms" className="font-bold text-brand-700">Marketplace Agreement</Link>, <Link to="/policies/refunds" className="font-bold text-brand-700">vendor policies</Link> and commission structure.</span>}
                />
                {!agree && <p className="text-[10px] text-ink-400">You must accept the agreement to submit.</p>}
                <div className="rounded-xl bg-brand-50/60 p-3.5">
                  <p className="flex items-center gap-2 text-[11px] font-bold text-brand-900"><Sparkles className="h-4 w-4" /> What happens after submission</p>
                  <p className="mt-1 text-[10.5px] leading-5 text-brand-800">Our trust team verifies documents within 2 business days. You can prepare services and staff in the meantime. Approval unlocks payouts and your public storefront.</p>
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-2 border-t border-ink-100 pt-4">
              <Button variant="outline" size="md" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} iconLeft={<ArrowLeft className="h-4 w-4" />}>Back</Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="md" onClick={() => { toast.success('Draft saved', 'You can resume onboarding anytime.'); }}>Save draft</Button>
                {step < 4 ? (
                  <Button size="md" onClick={next} iconRight={<ArrowRight className="h-4 w-4" />}>Continue</Button>
                ) : (
                  <Button size="md" onClick={submit} iconLeft={<ShieldCheck className="h-4 w-4" />}>Submit for approval</Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Why verify?</p>
            <div className="mt-3 space-y-3">
              {[
                { icon: BadgeCheck, title: 'Verified badge', text: 'Stand out with a trust badge on every listing.' },
                { icon: Banknote, title: 'Faster payouts', text: 'Weekly settlements with no holding period.' },
                { icon: ShieldCheck, title: 'Higher conversion', text: 'Verified vendors see 2.4× more bookings.' },
              ].map((b) => (
                <div key={b.title} className="flex items-start gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><b.icon className="h-3.5 w-3.5" /></span>
                  <div><p className="text-[11px] font-bold text-ink-800">{b.title}</p><p className="text-[10px] leading-4 text-ink-500">{b.text}</p></div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-brand-600" /><p className="text-[11.5px] font-bold text-ink-900">Need help?</p></div>
            <p className="mt-1 text-[10.5px] leading-5 text-ink-500">Your onboarding specialist can walk you through document requirements on a 15-minute call.</p>
            <Button variant="outline" size="sm" className="mt-2.5 w-full" onClick={() => toast.success('Callback requested', 'An onboarding specialist will call you within 2 hours.')}>Request a callback</Button>
          </Card>

          <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-3.5">
            <p className="flex items-center gap-1.5 text-[10.5px] font-bold text-ink-700"><FileText className="h-3.5 w-3.5" /> Documents accepted</p>
            <p className="mt-1 text-[10px] leading-4 text-ink-500">PDF, JPG or PNG up to 5 MB each. Aadhaar redaction supported — mask the first 8 digits.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
