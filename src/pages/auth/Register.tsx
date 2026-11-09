import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  User,
  UserRound,
} from 'lucide-react';
import { CITIES } from '@/lib/data';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/toast';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { Button, Checkbox, Input, Progress, Select } from '@/components/ui/primitives';

type AccountType = 'customer' | 'vendor';

export default function RegisterPage() {
  const { loginAs } = useAuth();
  const navigate = useNavigate();

  const [type, setType] = useState<AccountType>('customer');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Mumbai',
    password: '',
    confirm: '',
  });
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = useMemo(() => {
    let score = 0;
    if (form.password.length >= 8) score += 1;
    if (/[A-Z]/.test(form.password)) score += 1;
    if (/[0-9]/.test(form.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(form.password)) score += 1;
    return score;
  }, [form.password]);

  const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthTone = ['danger', 'danger', 'warning', 'brand', 'success'][strength];

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!/^[0-9+\s-]{10,15}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number.';
    if (form.password.length < 8) next.password = 'Use at least 8 characters.';
    else if (strength < 2) next.password = 'Add a number or symbol to strengthen your password.';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.';
    if (!terms) next.terms = 'Please accept the terms to continue.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    window.setTimeout(() => {
      const user = loginAs(type);
      setLoading(false);
      toast.success('Account created', `Welcome to Servora, ${form.name.split(' ')[0]}.`);
      if (type === 'vendor') {
        toast.info('Next: verify your business', 'Complete the 5-step onboarding to go live.');
        navigate('/vendor/onboarding');
      } else {
        navigate('/customer/dashboard');
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen flex-col lg:grid lg:h-screen lg:min-h-0 lg:grid-cols-[1fr_1.08fr]">
        <aside className="relative hidden bg-ink-950 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:overflow-y-auto">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_0%_10%,rgba(99,102,241,.4),transparent_50%),radial-gradient(at_90%_90%,rgba(14,165,233,.22),transparent_45%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:44px_44px]" />
          <div className="relative px-10 pt-9">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-brand-400 to-brand-700">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                  <path d="M11.3 2.2a.75.75 0 0 1 1.4 0l1.9 5.2 5.2 1.9a.75.75 0 0 1 0 1.4l-5.2 1.9-1.9 5.2a.75.75 0 0 1-1.4 0l-1.9-5.2-5.2-1.9a.75.75 0 0 1 0-1.4l5.2-1.9 1.9-5.2Z" />
                </svg>
              </span>
              <span className="font-display text-[22px] font-extrabold tracking-tight text-white">
                servora<span className="text-brand-400">.</span>
              </span>
            </Link>
          </div>

          <div className="relative px-10 pb-10">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-300">Join the marketplace</p>
            <h1 className="mt-3 max-w-md font-display text-[34px] font-extrabold leading-[1.1] tracking-tight text-white">
              {type === 'customer' ? (
                <>Book trusted pros.<br />Own your weekends.</>
              ) : (
                <>Grow your business.<br />Fill your calendar.</>
              )}
            </h1>
            <p className="mt-3 max-w-sm text-[13px] leading-7 text-ink-300">
              {type === 'customer'
                ? 'One account for every home service — cleaning, repairs, beauty, tutoring and more. Save addresses, track bookings and rebook your favourites in one tap.'
                : 'Get discovered by thousands of local customers, manage staff and availability, and receive weekly payouts with transparent commissions.'}
            </p>

            <div className="mt-6 space-y-2.5">
              {(type === 'customer'
                ? [
                    { icon: BadgeCheck, text: 'Verified professionals, background checked' },
                    { icon: CalendarCheck, text: 'Real-time slots and instant confirmation' },
                    { icon: ShieldCheck, text: 'Happiness guarantee on every booking' },
                  ]
                : [
                    { icon: Store, text: 'Free to list — pay only when you earn' },
                    { icon: CalendarCheck, text: 'Calendar, staff and service management' },
                    { icon: ShieldCheck, text: 'Weekly payouts with clear settlements' },
                  ]
              ).map((b) => (
                <div key={b.text} className="flex items-center gap-2.5 text-[12px] text-ink-200">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-brand-300">
                    <b.icon className="h-3.5 w-3.5" />
                  </span>
                  {b.text}
                </div>
              ))}
            </div>

            <div className="mt-7 max-w-sm rounded-xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-[11px] leading-5 text-ink-300">
                “We went from 4 bookings a week to a fully booked calendar in two months. The vendor
                dashboard is genuinely better than our old CRM.”
              </p>
              <p className="mt-2 text-[10px] font-semibold text-ink-400">Neha K. · SparkleHome Cleaning</p>
            </div>
          </div>
        </aside>

        <main className="flex flex-1 flex-col lg:h-screen lg:min-h-0 lg:flex-none lg:overflow-y-auto">
          <div className="flex items-center justify-between gap-3 px-5 py-5 sm:px-8">
            <Link to="/" className="text-[11.5px] font-semibold text-ink-500 hover:text-brand-700 lg:hidden">
              servora<span className="text-brand-500">.</span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <ThemeSwitcher compact />
              <p className="text-[11.5px] text-ink-500">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-brand-700 hover:text-brand-800">Sign in</Link>
              </p>
            </div>
          </div>

          <div className="flex flex-1 items-start justify-center px-5 pb-12 pt-1 sm:px-8 lg:items-center">
            <div className="w-full max-w-[480px]">
              <h2 className="font-display text-[26px] font-extrabold tracking-tight text-ink-900">Create your account</h2>
              <p className="mt-1.5 text-[13px] text-ink-500">Start with a free account. No card required.</p>

              <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-ink-100/80 p-1">
                {([
                  { key: 'customer', label: 'I need services', icon: UserRound },
                  { key: 'vendor', label: 'I provide services', icon: Store },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setType(opt.key)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-bold transition',
                      type === opt.key ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-800',
                    )}
                  >
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="mt-5 space-y-3.5" noValidate>
                <Input
                  label="Full name"
                  name="name"
                  placeholder={type === 'vendor' ? 'Owner or primary contact' : 'Your name'}
                  value={form.name}
                  onChange={set('name')}
                  error={errors.name}
                  icon={<User className="h-4 w-4" />}
                  autoComplete="name"
                />
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  error={errors.email}
                  icon={<Mail className="h-4 w-4" />}
                  autoComplete="email"
                />
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Input
                    label="Phone number"
                    name="phone"
                    placeholder="+91 98xxx xxxxx"
                    value={form.phone}
                    onChange={set('phone')}
                    error={errors.phone}
                    icon={<Phone className="h-4 w-4" />}
                    autoComplete="tel"
                  />
                  <Select label="City" name="city" value={form.city} onChange={set('city')}>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>
                <Input
                  label="Password"
                  name="password"
                  type={show ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  error={errors.password}
                  icon={<Lock className="h-4 w-4" />}
                  autoComplete="new-password"
                  suffix={
                    <button type="button" onClick={() => setShow((s) => !s)} className="rounded p-1 text-ink-400 hover:text-ink-700" aria-label="Toggle password visibility">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                {form.password && (
                  <div className="-mt-1 flex items-center gap-2">
                    <Progress value={(strength / 4) * 100} tone={strengthTone} size="sm" className="flex-1" />
                    <span className={cn('text-[10px] font-bold', strength >= 3 ? 'text-emerald-600' : strength === 2 ? 'text-amber-600' : 'text-rose-500')}>
                      {strengthLabel}
                    </span>
                  </div>
                )}
                <Input
                  label="Confirm password"
                  name="confirm"
                  type={show ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  error={errors.confirm}
                  icon={<Lock className="h-4 w-4" />}
                  autoComplete="new-password"
                />

                <div>
                  <Checkbox
                    id="terms"
                    checked={terms}
                    onChange={(v) => {
                      setTerms(v);
                      setErrors((e) => ({ ...e, terms: '' }));
                    }}
                    label={
                      <span>
                        I agree to the{' '}
                        <Link to="/policies/terms" className="font-bold text-brand-700 hover:text-brand-800">Terms of Service</Link>{' '}
                        and{' '}
                        <Link to="/policies/privacy" className="font-bold text-brand-700 hover:text-brand-800">Privacy Policy</Link>.
                      </span>
                    }
                  />
                  {errors.terms && <p className="mt-1 text-xs font-medium text-rose-600">{errors.terms}</p>}
                </div>

                <Button type="submit" size="lg" className="w-full" loading={loading} iconRight={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}>
                  {loading ? 'Creating account…' : type === 'vendor' ? 'Create vendor account' : 'Create customer account'}
                </Button>
              </form>

              {type === 'vendor' && (
                <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-3.5">
                  <p className="flex items-center gap-2 text-[11.5px] font-bold text-brand-900">
                    <MapPin className="h-3.5 w-3.5" /> What happens next
                  </p>
                  <ol className="mt-2 space-y-1.5">
                    {['Verify your business details', 'Add services and availability', 'Get approved and start earning'].map((s, i) => (
                      <li key={s} className="flex items-center gap-2 text-[11px] text-brand-800">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[8.5px] font-bold text-white">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] text-ink-400">
                <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-emerald-500" /> Free to join</span>
                <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-emerald-500" /> No card required</span>
                <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-emerald-500" /> Cancel anytime</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
