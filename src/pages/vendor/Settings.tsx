import { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Building2,
  Clock,
  CreditCard,
  Download,
  KeyRound,
  Lock,
  Mail,
  MessageSquare,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Badge, Button, Card, Input, Select, Skeleton, Switch, Tabs } from '@/components/ui/primitives';
import { PageHeader, SectionCard } from '@/components/ui/data-display';
import { ConfirmDialog } from '@/components/ui/overlays';

export default function VendorSettings() {
  const { user, logout } = useAuth();
  const loading = useMockLoad(320);
  const onboarding = useApp((s) => s.onboardingStatus);
  const [tab, setTab] = useState('business');
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [prefs, setPrefs] = useState({
    newBookings: true, cancellations: true, payments: true, reviews: true, promotions: false, weeklySummary: true, sms: true, whatsapp: true, email: true,
  });

  const save = () => {
    setSaving(true);
    window.setTimeout(() => { setSaving(false); toast.success('Settings saved', 'Your preferences have been updated.'); }, 700);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-5 lg:grid-cols-[220px_1fr]"><Skeleton className="h-64" /><Skeleton className="h-[500px]" /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your business account, booking rules, notifications and security."
        actions={<Button size="md" loading={saving} iconLeft={!saving ? <Save className="h-4 w-4" /> : undefined} onClick={save}>Save changes</Button>}
      />

      <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
        <Card className="h-fit p-2">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { key: 'business', label: 'Business account' },
              { key: 'booking', label: 'Booking rules' },
              { key: 'notifications', label: 'Notifications' },
              { key: 'payments', label: 'Payments & tax' },
              { key: 'security', label: 'Security' },
              { key: 'danger', label: 'Danger zone' },
            ]}
            className="flex-col bg-transparent p-0"
          />
        </Card>

        <div className="min-w-0 space-y-5">
          {tab === 'business' && (
            <>
              <SectionCard title="Owner details" icon={<UserRound className="h-4 w-4" />}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Full name" defaultValue={user?.name} />
                  <Input label="Role" defaultValue="Vendor owner" disabled />
                  <Input label="Email" defaultValue={user?.email} disabled hint="Contact support to change your login email." />
                  <Input label="Phone" defaultValue={user?.phone} />
                  <Input label="Business name" defaultValue="SparkleHome Cleaning Co." containerClassName="sm:col-span-2" />
                  <Select label="Preferred language" defaultValue="English"><option>English</option><option>हिन्दी</option><option>मराठी</option></Select>
                  <Select label="Time zone" defaultValue="IST"><option value="IST">IST (GMT+5:30)</option><option value="GST">GST (GMT+4)</option></Select>
                </div>
              </SectionCard>
              <SectionCard title="Business account" icon={<Building2 className="h-4 w-4" />}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="GSTIN" defaultValue="27AABCS1429P1Z8" />
                  <Input label="PAN" defaultValue="AABCS1429P" />
                  <Input label="Registered address" defaultValue="402, Sunrise Business Park, Link Road, Andheri West, Mumbai 400053" containerClassName="sm:col-span-2" />
                  <Input label="Support email" defaultValue="hello@sparklehome.co" />
                  <Input label="Support phone" defaultValue="+91 98200 41120" />
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-[11px] text-emerald-800"><ShieldCheck className="h-4 w-4 shrink-0" /> KYB verification complete. Your business is authorised to receive payouts.</div>
              </SectionCard>
            </>
          )}

          {tab === 'booking' && (
            <>
              <SectionCard title="Booking preferences" description="Control how customers can book your services." bodyClassName="space-y-4">
                <Switch checked label="Instant booking" description="Confirm bookings automatically when a slot is available." onChange={() => toast.info('Booking mode', 'Instant booking is enabled for all services.')} />
                <div className="h-px bg-ink-100" />
                <Switch checked={false} label="Require manual approval" description="Review every request before confirming." onChange={() => toast.info('Approval required', 'Pending requests will appear on your dashboard.')} />
                <div className="h-px bg-ink-100" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Minimum notice" type="number" defaultValue={4} suffix={<span className="text-xs">hours</span>} hint="Block last-minute bookings" />
                  <Input label="Max booking window" type="number" defaultValue={30} suffix={<span className="text-xs">days</span>} />
                  <Input label="Buffer between jobs" type="number" defaultValue={30} suffix={<span className="text-xs">min</span>} />
                  <Input label="Daily job cap" type="number" defaultValue={8} />
                </div>
              </SectionCard>
              <SectionCard title="Cancellation policy" description="Applied to all services unless overridden.">
                <div className="grid gap-2 sm:grid-cols-3">
                  {[{ name: 'Flexible', detail: 'Free until 12h before' }, { name: 'Moderate', detail: 'Free until 24h before' }, { name: 'Strict', detail: '50% until 48h before' }].map((p, i) => (
                    <button key={p.name} className={`rounded-xl border p-3 text-left ${i === 0 ? 'border-brand-300 bg-brand-50/60' : 'border-ink-200'}`}>
                      <p className="text-[12px] font-bold text-ink-900">{p.name}</p>
                      <p className="mt-0.5 text-[10px] text-ink-500">{p.detail}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-ink-200 p-3 text-[10.5px] text-ink-500"><Clock className="mr-1 inline h-3.5 w-3.5" /> Cancellations inside the policy window are automatically refunded and removed from your payout.</div>
              </SectionCard>
            </>
          )}

          {tab === 'notifications' && (
            <SectionCard title="Notification preferences" description="Choose what you get notified about and where.">
              <div className="space-y-3">
                {[
                  ['newBookings', 'New booking requests', 'Alert me as soon as a customer requests a slot.', Bell],
                  ['cancellations', 'Cancellations & reschedules', 'Customer changes and cancellation requests.', CalendarIcon],
                  ['payments', 'Payments & payouts', 'Successful payments and payout status updates.', CreditCard],
                  ['reviews', 'New reviews', 'When a customer leaves a review.', StarIcon],
                  ['promotions', 'Promotions & tips', 'Growth ideas, offers and product updates.', Mail],
                  ['weeklySummary', 'Weekly performance summary', 'Bookings, earnings and rating every Monday.', BarIcon],
                ].map(([key, label, desc, Icon]) => (
                  <div key={String(key)} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 text-ink-500"><Icon className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1"><p className="text-[11.5px] font-semibold text-ink-800">{String(label)}</p><p className="text-[10px] text-ink-500">{String(desc)}</p></div>
                    <Switch checked={prefs[key as keyof typeof prefs]} onChange={(v) => setPrefs((p) => ({ ...p, [key as string]: v }))} />
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-ink-100 pt-4">
                <p className="mb-2 text-[11.5px] font-bold text-ink-800">Channels</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[['sms', 'SMS', Smartphone], ['whatsapp', 'WhatsApp', MessageSquare], ['email', 'Email', Mail]].map(([key, label, Icon]) => (
                    <button key={String(key)} onClick={() => setPrefs((p) => ({ ...p, [key as string]: !p[key as keyof typeof prefs] }))} className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${prefs[key as keyof typeof prefs] ? 'border-brand-300 bg-brand-50/50' : 'border-ink-200'}`}>
                      <Icon className="h-4 w-4 text-ink-500" />
                      <span className="flex-1 text-[11.5px] font-semibold text-ink-800">{String(label)}</span>
                      {prefs[key as keyof typeof prefs] && <Badge tone="success" size="sm">On</Badge>}
                    </button>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {tab === 'payments' && (
            <>
              <SectionCard title="Settlement account" icon={<CreditCard className="h-4 w-4" />}>
                <div className="flex items-center gap-3 rounded-xl border border-ink-200 p-3.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-100 font-bold text-ink-600">HDFC</span>
                  <div className="min-w-0 flex-1"><p className="text-[12px] font-bold text-ink-900">HDFC Bank · •••• 4421</p><p className="text-[10.5px] text-ink-500">Neha Kulkarni · Andheri West branch</p></div>
                  <Badge tone="success" size="sm">Verified</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast.info('Bank change', 'For security, bank changes require support verification.')}>Change account</Button>
                  <Button variant="outline" size="sm" onClick={() => toast.success('Statement requested', 'Last 6 months of statements will be emailed.')} iconLeft={<Download className="h-3.5 w-3.5" />}>Download statements</Button>
                </div>
              </SectionCard>
              <SectionCard title="Tax & invoicing" description="Used on every invoice issued to customers.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Legal business name" defaultValue="SparkleHome Cleaning Co. Pvt Ltd" containerClassName="sm:col-span-2" />
                  <Input label="GSTIN" defaultValue="27AABCS1429P1Z8" />
                  <Input label="PAN" defaultValue="AABCS1429P" />
                  <Select label="GST rate" defaultValue="18"><option value="18">18% — services</option><option value="12">12%</option><option value="5">5%</option></Select>
                  <Select label="Invoice prefix" defaultValue="SPK"><option>SPK</option><option>INV</option></Select>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-ink-50 p-3">
                  <div><p className="text-[11px] font-bold text-ink-800">Auto-generate GST invoices</p><p className="text-[10px] text-ink-500">Sent to customers after every completed booking.</p></div>
                  <Badge tone="success" size="sm">Enabled</Badge>
                </div>
              </SectionCard>
            </>
          )}

          {tab === 'security' && (
            <>
              <SectionCard title="Sign-in & security" icon={<Lock className="h-4 w-4" />} bodyClassName="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-ink-200 p-3.5">
                  <div><p className="text-[12px] font-bold text-ink-900">Password</p><p className="text-[10.5px] text-ink-500">Last changed 3 months ago</p></div>
                  <Button variant="outline" size="sm" onClick={() => toast.info('Password reset', 'A reset link has been sent to your email.')}>Change</Button>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-ink-200 p-3.5">
                  <div><p className="flex items-center gap-1.5 text-[12px] font-bold text-ink-900">Two-factor authentication <Badge tone="success" size="sm">On</Badge></p><p className="text-[10.5px] text-ink-500">Authenticator app · backup codes generated</p></div>
                  <Button variant="outline" size="sm" onClick={() => toast.info('2FA settings', 'Manage authenticator devices in the admin console.')}>Manage</Button>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-ink-200 p-3.5">
                  <div><p className="text-[12px] font-bold text-ink-900">Active sessions</p><p className="text-[10.5px] text-ink-500">Chrome on Windows · Mumbai · current session</p></div>
                  <Button variant="outline" size="sm" onClick={() => toast.success('Sessions revoked', 'All other devices have been signed out.')}>Sign out others</Button>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-[10.5px] text-ink-500"><KeyRound className="h-3.5 w-3.5 shrink-0" /> Login alert emails are sent for any new device or location.</div>
              </SectionCard>
              <SectionCard title="API access" description="Connect your own tools to the Servora vendor API.">
                <div className="flex items-center justify-between rounded-xl border border-ink-200 p-3">
                  <div><p className="font-mono text-[10.5px] text-ink-700">sk_live_••••••••••••7f2a</p><p className="text-[10px] text-ink-400">Created 12 Mar 2026 · read & write</p></div>
                  <Button variant="outline" size="sm" onClick={() => toast.success('Key regenerated', 'Update your integrations with the new key.')}>Regenerate</Button>
                </div>
              </SectionCard>
            </>
          )}

          {tab === 'danger' && (
            <>
              <Card className="border-rose-200 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><AlertTriangle className="h-4.5 w-4.5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-ink-900">Pause your storefront</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-ink-500">Hide all services and stop accepting new bookings. Existing bookings remain active. You can resume anytime.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => toast.info('Store paused', 'You are now hidden from search. Resume from the same control.')}>Pause store</Button>
                  </div>
                </div>
              </Card>
              <Card className="border-rose-200 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><Trash2 className="h-4.5 w-4.5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-ink-900">Delete business account</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-ink-500">Permanently remove your listing, services and customer data. Pending payouts are held for 90 days. This cannot be undone.</p>
                    <Button variant="danger" size="sm" className="mt-3" onClick={() => setDeleteOpen(true)}>Delete account</Button>
                  </div>
                </div>
              </Card>
              <div className="rounded-xl border border-ink-200 bg-white p-3.5 text-[10.5px] text-ink-500">
                Verification status: <span className="font-semibold capitalize text-ink-700">{onboarding.replace('_', ' ')}</span> · Account ID: <span className="font-mono">VND-{user?.vendorId?.toUpperCase() ?? 'V1'}-2026</span>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this business account?"
        description="This permanently removes your storefront, services and customer history."
        confirmLabel="Delete permanently"
        onConfirm={() => { setDeleteOpen(false); toast.error('Deletion blocked', 'Demo accounts cannot be deleted. Contact support to proceed.'); }}
      />
    </div>
  );
}

function CalendarIcon(props: { className?: string }) {
  return <Clock {...props} />;
}
function StarIcon(props: { className?: string }) {
  return <ShieldCheck {...props} />;
}
function BarIcon(props: { className?: string }) {
  return <Clock {...props} />;
}
