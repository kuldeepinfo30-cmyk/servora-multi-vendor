import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Navigation,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react';
import { DEMO_ACCOUNTS, homePathForRole, useAuth } from '@/store/auth';
import { toast } from '@/store/toast';
import { cn } from '@/lib/utils';
import { Button, Checkbox, Divider, Input } from '@/components/ui/primitives';
import { LocationBar } from '@/components/LocationBar';
import { AuthLayout } from './AuthLayout';

const roleIcon = { customer: User, vendor: Store, admin: ShieldCheck };

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');

  const [email, setEmail] = useState('customer@servora.demo');
  const [password, setPassword] = useState('demo1234');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const safeNext = useMemo(() => (next && next.startsWith('/') ? next : null), [next]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs: typeof fieldErrors = {};
    if (!email.trim()) errs.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'That email doesn’t look right.';
    if (!password) errs.password = 'Enter your password.';
    else if (password.length < 4) errs.password = 'Password must be at least 4 characters.';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    window.setTimeout(() => {
      const result = login(email, password);
      setLoading(false);
      if (!result.ok || !result.user) {
        setError(result.error ?? 'Unable to sign in. Please try again.');
        return;
      }
      toast.success(`Welcome back, ${result.user.name.split(' ')[0]}`, 'Your demo workspace is ready.');
      navigate(safeNext ?? homePathForRole(result.user.role), { replace: true });
    }, 650);
  };

  const quickLogin = (role: 'customer' | 'vendor' | 'admin') => {
    const account = DEMO_ACCOUNTS.find((a) => a.role === role)!;
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
    setFieldErrors({});
    toast.info(`${account.label} demo loaded`, account.blurb);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your dashboard to manage bookings, schedules and payments."
      footer={
        <p className="text-center text-[12.5px] text-ink-500">
          New to Servora?{' '}
          <Link to="/register" className="font-bold text-brand-700 hover:text-brand-800">
            Create an account
          </Link>
          {' · '}
          <Link to="/vendor/onboarding" className="font-semibold text-ink-500 hover:text-brand-700">
            List your business
          </Link>
        </p>
      }
    >
      {user && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <p className="min-w-0 flex-1 text-[11.5px] text-emerald-800">
            Signed in as <strong className="font-bold">{user.name}</strong>
          </p>
          <Link to={homePathForRole(user.role)} className="shrink-0 text-[11px] font-bold text-emerald-700 hover:text-emerald-800">
            Continue →
          </Link>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <p className="text-[12px] leading-5 text-rose-700">{error}</p>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldErrors((f) => ({ ...f, email: undefined }));
          }}
          error={fieldErrors.email}
          icon={<Mail className="h-4 w-4" />}
          disabled={loading}
        />
        <div>
          <Input
            label="Password"
            name="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((f) => ({ ...f, password: undefined }));
            }}
            error={fieldErrors.password}
            icon={<Lock className="h-4 w-4" />}
            disabled={loading}
            suffix={
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="rounded p-1 text-ink-400 transition hover:text-ink-700"
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <div className="mt-2.5 flex items-center justify-between">
            <Checkbox checked={remember} onChange={setRemember} label="Remember me" id="remember" />
            <Link to="/forgot-password" className="text-[11.5px] font-bold text-brand-700 hover:text-brand-800">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading} iconRight={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}>
          {loading ? 'Signing you in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-5">
        <Button
          variant="outline"
          size="md"
          className="w-full"
          onClick={() => {
            login('customer@servora.demo', 'demo1234');
            toast.success('Signed in with demo Google', 'Using the seeded customer account.');
            navigate('/customer/dashboard');
          }}
        >
          <GoogleIcon /> Continue with Google
        </Button>
      </div>

      <Divider label="Or use a demo account" className="my-5" />

      <div className="space-y-2">
        {DEMO_ACCOUNTS.map((account) => {
          const Icon = roleIcon[account.role];
          const active = email === account.email;
          return (
            <button
              key={account.role}
              type="button"
              onClick={() => quickLogin(account.role)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition',
                active
                  ? 'border-brand-300 bg-brand-50/70'
                  : 'border-ink-200 bg-white hover:border-brand-200 hover:bg-brand-50/30',
              )}
            >
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500')}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[12px] font-bold text-ink-800">
                  {account.label}
                  {active && <CheckCircle2 className="h-3 w-3 text-brand-600" />}
                </span>
                <span className="block truncate text-[10.5px] text-ink-500">{account.person}</span>
              </span>
              <span className="shrink-0 font-mono text-[9.5px] text-ink-400">demo1234</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 text-center text-[10px] leading-4 text-ink-400">
        Demo environment · all data is seeded and resets on a fresh browser profile.
      </p>

      <div className="mt-5 rounded-2xl border border-ink-200 bg-white p-3.5">
        <div className="mb-2.5 flex items-start gap-2">
          <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
          <div>
            <p className="text-[12px] font-bold text-ink-900">Live location</p>
            <p className="text-[10.5px] leading-4 text-ink-500">
              Detect where you are to see professionals within your chosen radius.
            </p>
          </div>
        </div>
        <LocationBar compact />
      </div>
    </AuthLayout>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
