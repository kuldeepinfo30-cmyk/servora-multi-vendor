import { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  Cloud,
  Code2,
  CreditCard,
  Database,
  Globe,
  KeyRound,
  Mail,
  MapPin,
  MessageSquare,
  Percent,
  Plug,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OWNER } from '@/lib/owner';
import { GithubIcon, LinkedinIcon } from '@/components/ui/brand-icons';
import { useMockLoad } from '@/lib/hooks';
import { toast } from '@/store/toast';
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Skeleton,
  Switch,
  Tabs,
  Textarea,
} from '@/components/ui/primitives';
import { PageHeader, SectionCard } from '@/components/ui/data-display';
import { ConfirmDialog } from '@/components/ui/overlays';

const integrations = [
  { name: 'Razorpay', desc: 'Payments, refunds and settlement reconciliation.', icon: CreditCard, connected: true, tone: 'bg-sky-50 text-sky-600', meta: 'Live mode · settled daily' },
  { name: 'Twilio', desc: 'Transactional SMS and OTP delivery.', icon: MessageSquare, connected: true, tone: 'bg-rose-50 text-rose-600', meta: 'DLT approved · 99.9% delivery' },
  { name: 'SendGrid', desc: 'Transactional email and digests.', icon: Mail, connected: true, tone: 'bg-brand-50 text-brand-600', meta: 'Domain authenticated' },
  { name: 'Google Maps', desc: 'Address autocomplete and service radius.', icon: MapPin, connected: true, tone: 'bg-emerald-50 text-emerald-600', meta: 'Places + Geocoding enabled' },
  { name: 'AWS S3', desc: 'Media storage for services and reviews.', icon: Cloud, connected: true, tone: 'bg-amber-50 text-amber-600', meta: 'ap-south-1 · versioned' },
  { name: 'Slack', desc: 'Ops alerts into #servora-ops.', icon: Plug, connected: false, tone: 'bg-violet-50 text-violet-600', meta: 'Not connected' },
];

export default function AdminSettings() {
  const loading = useMockLoad(320);
  const [tab, setTab] = useState('general');
  const [dirty, setDirty] = useState(false);
  const [confirm, setConfirm] = useState<'maintenance' | 'delete' | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [general, setGeneral] = useState({
    name: 'Servora',
    tagline: 'Local expertise, delivered.',
    supportEmail: 'support@servora.in',
    supportPhone: '+91 90000 12345',
    timezone: 'Asia/Kolkata (IST)',
    currency: 'INR (₹)',
    language: 'English (India)',
    city: 'Mumbai',
    address: 'WeWork Enam Sambhav, BKC, Mumbai 400051',
  });

  const [market, setMarket] = useState({
    autoApprove: false,
    instantBooking: true,
    slotInterval: '60',
    buffer: '15',
    bookingWindow: '30',
    radius: '12',
    requireKyc: true,
    allowReschedule: true,
    cancellation: 'flexible',
    reviewModeration: 'auto',
  });

  const [finance, setFinance] = useState({
    commission: '12',
    payoutCycle: 'weekly',
    minPayout: '500',
    gst: '18',
    invoicePrefix: 'SRV',
    gatewayFee: '1.9',
    absorbRefunds: true,
    autoPayout: false,
  });

  const [notifications, setNotifications] = useState({
    newVendor: true,
    dispute: true,
    payout: true,
    refund: false,
    failedPayment: true,
    dailyDigest: true,
    weeklyReport: true,
    systemAlerts: true,
  });

  const markDirty = () => {
    setDirty(true);
    setSavedAt(null);
  };

  const save = () => {
    setDirty(false);
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setSavedAt(now);
    toast.success('Settings saved', `Configuration updated at ${now}. Changes are live immediately.`);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <Skeleton className="h-11 w-full max-w-2xl" />
        <Skeleton className="h-[380px]" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <PageHeader
        title="Platform settings"
        description="Configure the marketplace, payments, notifications and integrations that power Servora."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-violet-600">
            <SlidersHorizontal className="h-3.5 w-3.5" /> System configuration
          </span>
        }
        actions={
          <>
            <Badge tone={dirty ? 'warning' : 'success'} size="sm" dot>{dirty ? 'Unsaved changes' : savedAt ? `Saved at ${savedAt}` : 'All changes saved'}</Badge>
            <Button size="sm" disabled={!dirty} iconLeft={<Save className="h-4 w-4" />} onClick={save}>Save changes</Button>
          </>
        }
      />

      <div className="mb-5 overflow-x-auto">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { key: 'general', label: 'General' },
            { key: 'marketplace', label: 'Marketplace' },
            { key: 'finance', label: 'Payments & fees' },
            { key: 'notifications', label: 'Notifications' },
            { key: 'integrations', label: 'Integrations' },
            { key: 'danger', label: 'Danger zone' },
          ]}
        />
      </div>

      {tab === 'general' && (
        <div className="animate-fade-up grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <SectionCard title="Brand identity" description="Shown across the website, emails and invoices." icon={<Building2 className="h-4 w-4" />}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Platform name" value={general.name} onChange={(e) => { setGeneral({ ...general, name: e.target.value }); markDirty(); }} />
                <Input label="Tagline" value={general.tagline} onChange={(e) => { setGeneral({ ...general, tagline: e.target.value }); markDirty(); }} />
                <Input label="Support email" type="email" value={general.supportEmail} onChange={(e) => { setGeneral({ ...general, supportEmail: e.target.value }); markDirty(); }} />
                <Input label="Support phone" value={general.supportPhone} onChange={(e) => { setGeneral({ ...general, supportPhone: e.target.value }); markDirty(); }} />
              </div>
              <div className="mt-4">
                <p className="field-label">Platform logo</p>
                <div className="mt-1 flex items-center gap-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/50 p-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-950 font-display text-[15px] font-extrabold text-white">s.</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-ink-700">servora-mark.svg</p>
                    <p className="text-[9.5px] text-ink-400">SVG · 24 KB · light and dark variants included</p>
                  </div>
                  <Button size="xs" variant="outline" onClick={() => toast.info('Upload logo', 'Drop an SVG or PNG up to 1 MB. Dark-mode assets are auto-generated.')}>Replace</Button>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Regional defaults" description="Currency, locale and operating city." icon={<Globe className="h-4 w-4" />}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Currency" value={general.currency} onChange={(e) => { setGeneral({ ...general, currency: e.target.value }); markDirty(); }}>
                  <option>INR (₹)</option>
                  <option>USD ($)</option>
                  <option>AED (د.إ)</option>
                </Select>
                <Select label="Timezone" value={general.timezone} onChange={(e) => { setGeneral({ ...general, timezone: e.target.value }); markDirty(); }}>
                  <option>Asia/Kolkata (IST)</option>
                  <option>Asia/Dubai (GST)</option>
                  <option>Asia/Singapore (SGT)</option>
                </Select>
                <Select label="Default language" value={general.language} onChange={(e) => { setGeneral({ ...general, language: e.target.value }); markDirty(); }}>
                  <option>English (India)</option>
                  <option>हिन्दी</option>
                  <option>मराठी</option>
                  <option>தமிழ்</option>
                </Select>
                <Select label="Primary city" value={general.city} onChange={(e) => { setGeneral({ ...general, city: e.target.value }); markDirty(); }}>
                  {['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'].map((c) => <option key={c}>{c}</option>)}
                </Select>
              </div>
              <div className="mt-4">
                <Input label="Registered address" value={general.address} onChange={(e) => { setGeneral({ ...general, address: e.target.value }); markDirty(); }} />
              </div>
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard title="Preview" description="How the brand appears">
              <div className="rounded-xl border border-ink-100 bg-ink-950 p-4 text-white">
                <p className="font-display text-[24px] font-extrabold tracking-tight">{general.name?.toLowerCase() || 'servora'}<span className="text-brand-400">.</span></p>
                <p className="mt-1 text-[10.5px] text-ink-400">{general.tagline}</p>
                <div className="mt-3 flex items-center gap-2 text-[9.5px] text-ink-400">
                  <MapPin className="h-3 w-3" /> {general.city}, India
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-[10.5px] text-ink-500">
                <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {general.supportEmail}</p>
                <p className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> {general.timezone}</p>
                <p className="flex items-center gap-1.5"><Wallet className="h-3 w-3" /> Prices shown in {general.currency}</p>
              </div>
            </SectionCard>

            <SectionCard title="Environment" description="Current deployment">
              <div className="space-y-2">
                {[
                  ['Environment', 'Production', 'success'],
                  ['API version', 'v2.4.1', 'neutral'],
                  ['Database', 'PostgreSQL 16', 'neutral'],
                  ['Last deploy', '2h ago', 'neutral'],
                ].map(([l, v, tone]) => (
                  <div key={l} className="flex items-center justify-between text-[10.5px]">
                    <span className="text-ink-500">{l}</span>
                    <Badge tone={tone} size="sm">{v}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-800">
                <CheckCircle2 className="mr-1 inline h-3 w-3" /> All checks passing
              </div>
            </SectionCard>

            <SectionCard title="Workspace owner" description="The developer behind this demo build" icon={<Code2 className="h-4 w-4" />}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-[14px] font-extrabold text-white">
                  {OWNER.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-bold text-ink-900">{OWNER.name}</p>
                  <p className="text-[10.5px] font-semibold text-brand-600">{OWNER.role}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-[10.5px] text-ink-500">
                {OWNER.email && (
                  <a href={`mailto:${OWNER.email}`} className="flex items-center gap-1.5 transition hover:text-brand-700">
                    <Mail className="h-3 w-3" /> {OWNER.email}
                  </a>
                )}
                {OWNER.github && (
                  <a href={OWNER.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition hover:text-brand-700">
                    <GithubIcon className="h-3 w-3" /> GitHub
                  </a>
                )}
                {OWNER.linkedin && (
                  <a href={OWNER.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition hover:text-brand-700">
                    <LinkedinIcon className="h-3 w-3" /> LinkedIn
                  </a>
                )}
                <p className="flex items-center gap-1.5"><Wallet className="h-3 w-3" /> Payouts to {OWNER.upi}</p>
              </div>
              {!OWNER.email && !OWNER.github && !OWNER.linkedin && (
                <p className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-[10px] leading-4 text-ink-500">
                  Add your email, GitHub and LinkedIn links in <span className="font-mono">src/lib/owner.ts</span> to show them here.
                </p>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {tab === 'marketplace' && (
        <div className="animate-fade-up grid gap-4 xl:grid-cols-2">
          <SectionCard title="Booking rules" description="Defaults applied to every new booking." icon={<SlidersHorizontal className="h-4 w-4" />}>
            <div className="space-y-4">
              <Switch checked={market.instantBooking} onChange={(v) => { setMarket({ ...market, instantBooking: v }); markDirty(); }} label="Instant booking" description="Allow customers to book without vendor approval." />
              <Switch checked={market.requireKyc} onChange={(v) => { setMarket({ ...market, requireKyc: v }); markDirty(); }} label="Require vendor KYC" description="Vendors cannot publish services until KYC is approved." />
              <Switch checked={market.allowReschedule} onChange={(v) => { setMarket({ ...market, allowReschedule: v }); markDirty(); }} label="Allow customer reschedules" description="One free reschedule up to 12 hours before the slot." />
              <div className="grid gap-3 border-t border-ink-100 pt-3 sm:grid-cols-2">
                <Select label="Slot interval" value={market.slotInterval} onChange={(e) => { setMarket({ ...market, slotInterval: e.target.value }); markDirty(); }}>
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </Select>
                <Select label="Travel buffer" value={market.buffer} onChange={(e) => { setMarket({ ...market, buffer: e.target.value }); markDirty(); }}>
                  <option value="0">No buffer</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                </Select>
                <Input label="Booking window (days)" type="number" value={market.bookingWindow} onChange={(e) => { setMarket({ ...market, bookingWindow: e.target.value }); markDirty(); }} />
                <Input label="Default service radius (km)" type="number" value={market.radius} onChange={(e) => { setMarket({ ...market, radius: e.target.value }); markDirty(); }} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Vendor governance" description="Approval and content policy." icon={<ShieldCheck className="h-4 w-4" />}>
            <div className="space-y-4">
              <Switch checked={market.autoApprove} onChange={(v) => { setMarket({ ...market, autoApprove: v }); markDirty(); }} label="Auto-approve new vendors" description="Skip manual review for vendors with verified GST and KYC." />
              <div className="border-t border-ink-100 pt-3">
                <Select label="Default cancellation policy" value={market.cancellation} onChange={(e) => { setMarket({ ...market, cancellation: e.target.value }); markDirty(); }}>
                  <option value="flexible">Flexible — free up to 12h</option>
                  <option value="moderate">Moderate — free up to 24h</option>
                  <option value="strict">Strict — 50% fee inside 48h</option>
                </Select>
              </div>
              <div className="border-t border-ink-100 pt-3">
                <Select label="Review moderation" value={market.reviewModeration} onChange={(e) => { setMarket({ ...market, reviewModeration: e.target.value }); markDirty(); }}>
                  <option value="auto">Automatic filter, manual flags</option>
                  <option value="manual">All reviews need approval</option>
                  <option value="post">Publish instantly, audit later</option>
                </Select>
              </div>
              <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3 text-[10.5px] leading-5 text-ink-500">
                Vendors with a rating below 4.0 for two consecutive months are automatically flagged for a quality review.
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Availability defaults" description="Applies when a vendor has not set custom hours" className="xl:col-span-2">
            <div className="grid gap-3 sm:grid-cols-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                <div key={d} className={cn('rounded-xl border p-3', i === 6 ? 'border-ink-100 bg-ink-50/50' : 'border-ink-100 bg-white')}>
                  <p className="text-[11px] font-bold text-ink-800">{d}</p>
                  <p className="mt-0.5 text-[9.5px] text-ink-400">{i === 6 ? '08:00 – 18:00' : '08:00 – 20:00'}</p>
                  <Badge tone={i === 6 ? 'neutral' : 'success'} size="sm" className="mt-1.5">{i === 6 ? 'Short day' : 'Open'}</Badge>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => toast.info('Availability editor', 'Edit per-day opening hours, breaks and holiday closures.')}>Edit default hours</Button>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'finance' && (
        <div className="animate-fade-up grid gap-4 xl:grid-cols-2">
          <SectionCard title="Commission & fees" description="Applied to all new bookings." icon={<Percent className="h-4 w-4" />}>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Platform commission (%)" type="number" value={finance.commission} onChange={(e) => { setFinance({ ...finance, commission: e.target.value }); markDirty(); }} hint="Global default unless overridden per vendor." />
                <Input label="Payment gateway fee (%)" type="number" value={finance.gatewayFee} onChange={(e) => { setFinance({ ...finance, gatewayFee: e.target.value }); markDirty(); }} />
                <Input label="GST rate (%)" type="number" value={finance.gst} onChange={(e) => { setFinance({ ...finance, gst: e.target.value }); markDirty(); }} />
                <Input label="Invoice prefix" value={finance.invoicePrefix} onChange={(e) => { setFinance({ ...finance, invoicePrefix: e.target.value.toUpperCase() }); markDirty(); }} />
              </div>
              <div className="rounded-xl bg-brand-50 p-3 text-[10.5px] leading-5 text-brand-800">
                At {finance.commission}% commission, a ₹1,000 booking yields <b>₹{Math.round(1000 * (Number(finance.commission) / 100))}</b> platform revenue before gateway fees.
              </div>
              <Switch checked={finance.absorbRefunds} onChange={(v) => { setFinance({ ...finance, absorbRefunds: v }); markDirty(); }} label="Platform absorbs disputed refunds" description="When enabled, refunds are not deducted from the vendor’s next payout." />
            </div>
          </SectionCard>

          <SectionCard title="Payout schedule" description="How and when vendors get paid." icon={<Wallet className="h-4 w-4" />}>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Payout cycle" value={finance.payoutCycle} onChange={(e) => { setFinance({ ...finance, payoutCycle: e.target.value }); markDirty(); }}>
                  <option value="daily">Daily rolling</option>
                  <option value="weekly">Weekly (Tuesday)</option>
                  <option value="biweekly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                </Select>
                <Input label="Minimum payout (₹)" type="number" value={finance.minPayout} onChange={(e) => { setFinance({ ...finance, minPayout: e.target.value }); markDirty(); }} />
              </div>
              <Switch checked={finance.autoPayout} onChange={(v) => { setFinance({ ...finance, autoPayout: v }); markDirty(); }} label="Automate payout approval" description="Batches under ₹5L are approved automatically after risk checks." />
              <div className="rounded-xl border border-ink-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Next payout run</p>
                <p className="mt-1 text-[13px] font-bold text-ink-900">Tue, 12 Nov 2026 · 6:00 PM IST</p>
                <p className="text-[10px] text-ink-400">3 vendors · ₹59,680 awaiting approval</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-[10.5px] leading-5 text-amber-800">
                Changing the payout cycle affects all vendors from the next run. Existing scheduled payouts are not altered.
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Payment methods" description="What customers can use at checkout" className="xl:col-span-2">
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ['UPI', 'Enabled', true],
                ['Cards', 'Enabled', true],
                ['Net banking', 'Enabled', true],
                ['Wallets', 'Enabled', true],
                ['Pay later', 'Coming soon', false],
                ['Cash on service', 'Disabled', false],
              ].map(([label, hint, on]) => (
                <div key={String(label)} className={cn('flex items-center justify-between rounded-xl border p-3', on ? 'border-ink-100 bg-white' : 'border-ink-100 bg-ink-50/50')}>
                  <div>
                    <p className="text-[11.5px] font-bold text-ink-800">{label}</p>
                    <p className="text-[9.5px] text-ink-400">{hint}</p>
                  </div>
                  <Switch checked={Boolean(on)} onChange={() => { markDirty(); toast.info('Payment method', `${label} will be ${on ? 'disabled' : 'enabled'} after you save.`); }} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="animate-fade-up grid gap-4 xl:grid-cols-[1fr_320px]">
          <SectionCard title="Admin alerts" description="Who gets pinged, and when." icon={<Bell className="h-4 w-4" />}>
            <div className="space-y-4">
              {[
                ['newVendor', 'New vendor application', 'A new partner submits an application for review.'],
                ['dispute', 'New dispute opened', 'A customer escalates a booking to trust & safety.'],
                ['payout', 'Payout batch ready', 'A weekly payout batch is waiting for approval.'],
                ['refund', 'Refund requested', 'A refund above ₹2,000 needs a decision.'],
                ['failedPayment', 'Failed payment', 'A gateway payment fails after retry.'],
                ['systemAlerts', 'System health alerts', 'Latency, error-rate or integration outages.'],
              ].map(([key, label, desc]) => (
                <Switch
                  key={key}
                  checked={notifications[key as keyof typeof notifications]}
                  onChange={(v) => { setNotifications({ ...notifications, [key]: v }); markDirty(); }}
                  label={label}
                  description={desc}
                />
              ))}
            </div>
          </SectionCard>

          <div className="space-y-4">
            <SectionCard title="Digests" description="Scheduled summaries">
              <div className="space-y-4">
                <Switch checked={notifications.dailyDigest} onChange={(v) => { setNotifications({ ...notifications, dailyDigest: v }); markDirty(); }} label="Daily ops digest" description="Every day at 8:00 AM IST." />
                <Switch checked={notifications.weeklyReport} onChange={(v) => { setNotifications({ ...notifications, weeklyReport: v }); markDirty(); }} label="Weekly performance email" description="Monday mornings, includes GMV and queues." />
              </div>
              <div className="mt-3 border-t border-ink-100 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Delivery channels</p>
                <div className="mt-2 space-y-1.5 text-[10.5px] text-ink-500">
                  <p className="flex items-center justify-between"><span>Email</span><Badge tone="success" size="sm">On</Badge></p>
                  <p className="flex items-center justify-between"><span>SMS (critical only)</span><Badge tone="success" size="sm">On</Badge></p>
                  <p className="flex items-center justify-between"><span>Slack #servora-ops</span><Badge tone="neutral" size="sm">Off</Badge></p>
                </div>
              </div>
            </SectionCard>

            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white">
              <p className="flex items-center gap-1.5 text-[12px] font-bold"><Bell className="h-4 w-4" /> Quiet hours</p>
              <p className="mt-1 text-[10.5px] leading-5 text-white/80">Non-critical alerts are muted from 10 PM to 7 AM IST. Critical payment and security alerts always deliver.</p>
              <button onClick={() => toast.info('Quiet hours', 'Critical alerts always bypass quiet hours.')} className="mt-2.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[10.5px] font-bold backdrop-blur transition hover:bg-white/25">Adjust schedule</button>
            </Card>
          </div>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="animate-fade-up space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {integrations.map((i) => (
              <Card key={i.name} className="flex flex-col p-4" hover>
                <div className="flex items-start gap-3">
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', i.tone)}>
                    <i.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-ink-900">{i.name}</p>
                    <p className="mt-0.5 text-[10px] leading-4 text-ink-500">{i.desc}</p>
                  </div>
                  <Badge tone={i.connected ? 'success' : 'neutral'} size="sm" dot>{i.connected ? 'Live' : 'Off'}</Badge>
                </div>
                <p className="mt-3 text-[9.5px] text-ink-400">{i.meta}</p>
                <div className="mt-3 flex gap-2 border-t border-ink-100 pt-3">
                  <Button size="xs" variant="outline" onClick={() => toast.info(`${i.name} settings`, i.connected ? 'Rotate credentials, review scopes and test the connection.' : 'Add API credentials to connect this integration.')}>
                    {i.connected ? 'Configure' : 'Connect'}
                  </Button>
                  {i.connected && <Button size="xs" variant="ghost" onClick={() => toast.success('Connection healthy', `${i.name} responded in 142 ms.`)}>Test</Button>}
                </div>
              </Card>
            ))}
          </div>

          <SectionCard title="Webhooks" description="Outbound events delivered to your endpoints">
            <div className="divide-y divide-ink-100">
              {[
                { url: 'https://ops.servora.in/hooks/bookings', events: 'booking.created, booking.completed', status: 'healthy' },
                { url: 'https://finance.servora.in/hooks/payouts', events: 'payout.paid, payout.failed', status: 'healthy' },
                { url: 'https://crm.servora.in/hooks/vendors', events: 'vendor.approved, vendor.suspended', status: 'degraded' },
              ].map((w) => (
                <div key={w.url} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[10px] text-ink-700">{w.url}</p>
                    <p className="text-[9.5px] text-ink-400">{w.events}</p>
                  </div>
                  <Badge tone={w.status === 'healthy' ? 'success' : 'warning'} size="sm" dot>{w.status}</Badge>
                  <Button size="xs" variant="outline" onClick={() => toast.info('Webhook log', 'Replay the last 50 deliveries and inspect response codes.')}>View log</Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'danger' && (
        <div className="animate-fade-up space-y-4">
          <Card className="border-rose-200 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><AlertTriangle className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-ink-900">Maintenance mode</p>
                <p className="mt-1 max-w-2xl text-[11px] leading-5 text-ink-500">
                  Takes the customer website offline and shows a branded maintenance page. The admin console, vendor portal and payment webhooks stay online.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button variant="danger" size="sm" onClick={() => setConfirm('maintenance')}>Enable maintenance mode</Button>
                  <Badge tone="success" size="sm" dot>Site is currently live</Badge>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Data & compliance" description="Export or erase platform data." icon={<Database className="h-4 w-4" />}>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
                  <div>
                    <p className="text-[11.5px] font-bold text-ink-800">Full data export</p>
                    <p className="text-[9.5px] text-ink-400">JSON + CSV bundle, delivered via secure link</p>
                  </div>
                  <Button size="xs" variant="outline" onClick={() => toast.success('Export queued', 'You will receive a secure download link within 15 minutes.')}>Request</Button>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
                  <div>
                    <p className="text-[11.5px] font-bold text-ink-800">GDPR / DPDP data erasure</p>
                    <p className="text-[9.5px] text-ink-400">Anonymise a customer across all records</p>
                  </div>
                  <Button size="xs" variant="outline" onClick={() => toast.info('Erasure request', 'Requires a verified customer request and a second admin approval.')}>Start</Button>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
                  <div>
                    <p className="text-[11.5px] font-bold text-ink-800">Audit log retention</p>
                    <p className="text-[9.5px] text-ink-400">Immutable logs kept for 7 years</p>
                  </div>
                  <Badge tone="success" size="sm">Compliant</Badge>
                </div>
              </div>
            </SectionCard>

            <Card className="border-rose-200 p-5">
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-rose-700"><Trash2 className="h-4 w-4" /> Delete workspace</p>
              <p className="mt-1 text-[11px] leading-5 text-ink-500">
                Permanently deletes all bookings, vendors, customers, payouts and audit records. This action is irreversible and requires owner approval plus a 14-day cooling-off period.
              </p>
              <div className="mt-3 rounded-lg bg-rose-50 p-3 text-[10.5px] leading-5 text-rose-800">
                You are the workspace owner. Transferring ownership first is recommended.
              </div>
              <Button variant="danger" size="sm" className="mt-3" iconLeft={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setConfirm('delete')}>Delete workspace</Button>
            </Card>
          </div>
        </div>
      )}

      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-20px_rgba(15,23,42,.3)] backdrop-blur lg:pl-[288px]">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-[11.5px] font-medium text-ink-600">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> You have unsaved configuration changes.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setDirty(false); toast.info('Changes discarded', 'The form was reset to the last saved values.'); }}>Discard</Button>
              <Button size="sm" iconLeft={<Save className="h-4 w-4" />} onClick={save}>Save changes</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm === 'maintenance'}
        onClose={() => setConfirm(null)}
        onConfirm={() => { setConfirm(null); toast.warning('Maintenance mode enabled', 'The customer website is now offline. Admins and vendors can still sign in.'); }}
        title="Enable maintenance mode?"
        description="Customers will see a branded maintenance page. Active bookings remain valid and payments keep processing."
        confirmLabel="Enable maintenance mode"
      />

      <ConfirmDialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={() => { setConfirm(null); toast.error('Deletion scheduled', 'The workspace will be deleted after a 14-day cooling-off period. You can cancel anytime.'); }}
        title="Delete this workspace?"
        description="This permanently removes all marketplace data. A 14-day cooling-off period applies and the owner will receive a confirmation email."
        confirmLabel="Schedule deletion"
      />
    </div>
  );
}
