import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  Check,
  Download,
  Globe,
  KeyRound,
  Laptop,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  Trash2,
  User,
} from 'lucide-react';
import { CITIES } from '@/lib/data';
import { downloadFile, fmtDate } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/toast';
import { Avatar, Badge, Button, Card, Input, Select, Switch, Tabs } from '@/components/ui/primitives';
import { PageHeader, SectionCard } from '@/components/ui/data-display';
import { ConfirmDialog, Modal } from '@/components/ui/overlays';

type TabKey = 'profile' | 'security' | 'notifications' | 'privacy' | 'danger';

export default function CustomerSettings() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('profile');
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    city: user?.city ?? 'Mumbai',
    bio: 'Home owner, weekend DIYer, and a stickler for clean kitchens.',
  });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [prefs, setPrefs] = useState({ email: true, push: true, sms: false, offers: true, digest: false });
  const [twoFactor, setTwoFactor] = useState(false);

  const saveProfile = () => {
    const errs: Record<string, string> = {};
    if (profile.name.trim().length < 2) errs.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errs.email = 'Enter a valid email.';
    if (!/^[0-9+\s-]{10,15}$/.test(profile.phone)) errs.phone = 'Enter a valid phone number.';
    if (Object.keys(errs).length) {
      toast.error('Check the form', Object.values(errs)[0]);
      return;
    }
    updateProfile({ name: profile.name, email: profile.email, phone: profile.phone, city: profile.city });
    toast.success('Profile updated', 'Your details have been saved.');
  };

  const savePassword = () => {
    const errs: Record<string, string> = {};
    if (passwords.current.length < 4) errs.current = 'Enter your current password.';
    if (passwords.next.length < 8) errs.next = 'Use at least 8 characters.';
    if (passwords.next !== passwords.confirm) errs.confirm = 'Passwords do not match.';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setPasswordOpen(false);
    setPasswords({ current: '', next: '', confirm: '' });
    toast.success('Password changed', 'Use your new password next time you sign in.');
  };

  const exportData = () => {
    const data = { profile: user, addresses: 'see addresses page', bookings: 'see bookings page', exportedAt: new Date().toISOString() };
    downloadFile('servora-my-data.json', JSON.stringify(data, null, 2), 'application/json');
    toast.success('Data export ready', 'servora-my-data.json downloaded.');
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, security and communication preferences." />

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav className="space-y-0.5">
            {[
              { key: 'profile', label: 'Profile', icon: User },
              { key: 'security', label: 'Security', icon: Lock },
              { key: 'notifications', label: 'Notifications', icon: Bell },
              { key: 'privacy', label: 'Privacy & data', icon: ShieldCheck },
              { key: 'danger', label: 'Danger zone', icon: AlertTriangle },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as TabKey)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] font-semibold transition ${tab === t.key ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </nav>
          <div className="mt-4 rounded-xl border border-ink-200 bg-white p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Member since</p>
            <p className="mt-1 text-[12px] font-bold text-ink-900">January 2024</p>
            <p className="mt-0.5 text-[10px] text-ink-500">Gold tier · 2,180 points</p>
          </div>
        </aside>

        <div className="min-w-0">
          {tab === 'profile' && (
            <div className="space-y-4">
              <SectionCard title="Personal information" description="This is how vendors and support will see you.">
                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar name={profile.name || 'User'} size="2xl" tone={user?.tone ?? 'brand'} />
                    <button onClick={() => toast.info('Photo upload', 'Image uploads are simulated in this demo.')} className="text-[10.5px] font-bold text-brand-700 hover:text-brand-800">Change photo</button>
                    <p className="text-[9.5px] text-ink-400">JPG or PNG · max 2 MB</p>
                  </div>
                  <div className="grid flex-1 gap-3.5 sm:grid-cols-2">
                    <Input label="Full name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} icon={<User className="h-4 w-4" />} />
                    <Input label="Email address" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} icon={<Mail className="h-4 w-4" />} />
                    <Input label="Phone number" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} icon={<Phone className="h-4 w-4" />} />
                    <Select label="City" value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}>
                      {CITIES.map((c) => <option key={c}>{c}</option>)}
                    </Select>
                    <div className="sm:col-span-2">
                      <label className="field-label">About you</label>
                      <textarea value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} className="min-h-[80px] w-full resize-y rounded-xl border border-ink-200 px-3.5 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
                      <p className="field-hint">Optional, used to personalise recommendations.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2 border-t border-ink-100 pt-4">
                  <Button variant="outline" size="sm" onClick={() => toast.info('Changes discarded', 'Your saved profile was restored.')}>Discard</Button>
                  <Button size="sm" onClick={saveProfile} iconLeft={<Check className="h-3.5 w-3.5" />}>Save changes</Button>
                </div>
              </SectionCard>

              <SectionCard title="Language & region" description="Applies to prices, dates and support hours.">
                <div className="grid gap-3.5 sm:grid-cols-3">
                  <Select label="Language" defaultValue="English (India)"><option>English (India)</option><option>हिन्दी</option><option>मराठी</option></Select>
                  <Select label="Currency" defaultValue="INR (₹)"><option>INR (₹)</option><option>USD ($)</option></Select>
                  <Select label="Time zone" defaultValue="IST (GMT+5:30)"><option>IST (GMT+5:30)</option><option>GMT</option></Select>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-[10.5px] text-ink-500"><Globe className="h-3.5 w-3.5" /> Servora currently operates in India only. Prices include GST.</div>
              </SectionCard>
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-4">
              <SectionCard title="Sign-in & password" description="Keep your account secure.">
                <div className="flex flex-col gap-3 rounded-xl border border-ink-200 p-4 sm:flex-row sm:items-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><KeyRound className="h-4.5 w-4.5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-ink-900">Password</p>
                    <p className="text-[10.5px] text-ink-500">Last changed 3 months ago · demo1234</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>Change password</Button>
                </div>
                <div className="mt-3 flex flex-col gap-3 rounded-xl border border-ink-200 p-4 sm:flex-row sm:items-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck className="h-4.5 w-4.5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-ink-900">Two-factor authentication</p>
                    <p className="text-[10.5px] text-ink-500">Add an extra layer with an authenticator app.</p>
                  </div>
                  <Switch checked={twoFactor} onChange={(v) => { setTwoFactor(v); toast.success(v ? '2FA enabled' : '2FA disabled', v ? 'Use your authenticator app on next sign-in.' : 'You can re-enable this anytime.'); }} />
                </div>
              </SectionCard>

              <SectionCard title="Active sessions" description="Devices currently signed in to your account.">
                <div className="space-y-2">
                  {[
                    { icon: Laptop, device: 'Chrome · Windows 11', location: 'Mumbai, India', current: true, last: 'Active now' },
                    { icon: Smartphone, device: 'Servora app · iPhone 15', location: 'Mumbai, India', current: false, last: '2 hours ago' },
                    { icon: Laptop, device: 'Safari · MacBook Pro', location: 'Pune, India', current: false, last: '3 days ago' },
                  ].map((s) => (
                    <div key={s.device} className="flex items-center gap-3 rounded-xl border border-ink-200 p-3.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-500"><s.icon className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11.5px] font-bold text-ink-800">{s.device} {s.current && <Badge tone="success" size="sm">This device</Badge>}</p>
                        <p className="text-[10px] text-ink-500">{s.location} · {s.last}</p>
                      </div>
                      {!s.current && <button onClick={() => toast.success('Session revoked', `${s.device} was signed out.`)} className="text-[10.5px] font-bold text-rose-600 hover:text-rose-700">Revoke</button>}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => toast.success('All sessions revoked', 'Other devices have been signed out.')}>Sign out other devices</Button>
              </SectionCard>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-4">
              <SectionCard title="Channels" description="Choose how we reach you." bodyClassName="space-y-4">
                <Switch checked={prefs.email} onChange={(v) => setPrefs((p) => ({ ...p, email: v }))} label="Email" description="Booking confirmations, receipts and reminders" />
                <Switch checked={prefs.push} onChange={(v) => setPrefs((p) => ({ ...p, push: v }))} label="Push notifications" description="Arrival alerts and live status updates" />
                <Switch checked={prefs.sms} onChange={(v) => setPrefs((p) => ({ ...p, sms: v }))} label="SMS" description="Only for critical booking changes" />
                <Switch checked={prefs.offers} onChange={(v) => setPrefs((p) => ({ ...p, offers: v }))} label="Offers & promotions" description="Deals, coupons and seasonal campaigns" />
                <Switch checked={prefs.digest} onChange={(v) => setPrefs((p) => ({ ...p, digest: v }))} label="Weekly digest" description="One Monday email instead of individual updates" />
                <div className="flex justify-end border-t border-ink-100 pt-4">
                  <Button size="sm" onClick={() => toast.success('Preferences saved', 'Delivery settings updated.')}>Save preferences</Button>
                </div>
              </SectionCard>

              <SectionCard title="What we’ll notify you about" description="Essential messages cannot be turned off.">
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ['Booking confirmed', 'Essential'],
                    ['Professional on the way', 'Essential'],
                    ['Payment receipt', 'Essential'],
                    ['Review request', 'Optional'],
                    ['Price drops on saved services', 'Optional'],
                    ['New offers from followed vendors', 'Optional'],
                  ].map(([label, tag]) => (
                    <div key={label} className="flex items-center justify-between rounded-lg border border-ink-200 px-3 py-2.5">
                      <span className="text-[11px] text-ink-600">{label}</span>
                      <Badge tone={tag === 'Essential' ? 'neutral' : 'success'} size="sm">{tag}</Badge>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {tab === 'privacy' && (
            <div className="space-y-4">
              <SectionCard title="Your data" description="You’re in control of what we store.">
                <div className="space-y-2">
                  {[
                    { icon: Download, title: 'Download my data', desc: 'A JSON copy of your profile and activity.', action: 'Export', onClick: exportData },
                    { icon: MapPin, title: 'Saved addresses', desc: 'Manage where services are delivered.', action: 'Manage', onClick: () => navigate('/customer/addresses') },
                    { icon: ShieldCheck, title: 'Privacy policy', desc: 'How we collect, use and protect data.', action: 'Read', onClick: () => navigate('/policies/privacy') },
                  ].map((r) => (
                    <div key={r.title} className="flex flex-col gap-2 rounded-xl border border-ink-200 p-3.5 sm:flex-row sm:items-center">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-500"><r.icon className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold text-ink-900">{r.title}</p>
                        <p className="text-[10.5px] text-ink-500">{r.desc}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={r.onClick}>{r.action}</Button>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Consent history" description="A record of your marketing choices.">
                <div className="space-y-2">
                  {[
                    ['Marketing emails', 'Opted in', '12 Jan 2026'],
                    ['Analytics cookies', 'Opted out', '4 Mar 2026'],
                    ['Promotional SMS', 'Opted in', '18 Jun 2026'],
                  ].map(([label, state, date]) => (
                    <div key={label} className="flex items-center justify-between border-b border-ink-100 py-2 last:border-0">
                      <span className="text-[11.5px] text-ink-600">{label}</span>
                      <span className="text-[10.5px] text-ink-400">{state} · {fmtDate(date)}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {tab === 'danger' && (
            <div className="space-y-4">
              <Card className="border-rose-200 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><AlertTriangle className="h-4.5 w-4.5" /></span>
                  <div>
                    <h3 className="text-[14px] font-bold text-ink-900">Delete account</h3>
                    <p className="mt-1 text-[11.5px] leading-5 text-ink-500">
                      Permanently delete your Servora account, saved addresses and preferences. Active bookings must be completed or cancelled first. Some financial records are retained for legal compliance.
                    </p>
                    <Button variant="danger" size="sm" className="mt-3" iconLeft={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setDeleteOpen(true)}>Delete my account</Button>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-500"><Lock className="h-4.5 w-4.5" /></span>
                  <div>
                    <h3 className="text-[14px] font-bold text-ink-900">Deactivate temporarily</h3>
                    <p className="mt-1 text-[11.5px] leading-5 text-ink-500">Hide your profile and pause notifications without losing any data. Reactivate anytime by signing in.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => toast.success('Account deactivated', 'Sign in again to reactivate.')}>Deactivate account</Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Change password"
        description="Use at least 8 characters with a mix of letters, numbers and symbols."
        icon={<KeyRound className="h-5 w-5" />}
        footer={<><Button variant="outline" size="sm" onClick={() => setPasswordOpen(false)}>Cancel</Button><Button size="sm" onClick={savePassword}>Update password</Button></>}
      >
        <div className="space-y-3.5">
          <Input label="Current password" type="password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} error={pwErrors.current} />
          <Input label="New password" type="password" value={passwords.next} onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))} error={pwErrors.next} hint="Minimum 8 characters." />
          <Input label="Confirm new password" type="password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} error={pwErrors.confirm} />
          <div className="rounded-lg bg-amber-50 p-3 text-[10px] leading-5 text-amber-800">Changing your password signs out all other active sessions.</div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          logout();
          toast.success('Account deleted', 'Your demo account was removed. You can sign up again anytime.');
          navigate('/');
        }}
        title="Delete your account permanently?"
        description="This action cannot be undone. All bookings, reviews and saved items will be lost."
        confirmLabel="Yes, delete my account"
      />
    </div>
  );
}
