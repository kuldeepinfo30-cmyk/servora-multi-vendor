import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/primitives';
import { AuthLayout } from './AuthLayout';

const DEMO_CODE = '123456';

export default function VerifyOtpPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginAs } = useAuth();
  const email = params.get('email') || 'aarav.mehta@gmail.com';

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [seconds]);

  const code = digits.join('');

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      setDigits((d) => d.map((v, i) => (i === index ? '' : v)));
      return;
    }
    const chars = clean.slice(0, 6 - index).split('');
    setDigits((d) => {
      const next = [...d];
      chars.forEach((c, offset) => {
        if (index + offset < 6) next[index + offset] = c;
      });
      return next;
    });
    const nextIndex = Math.min(5, index + chars.length);
    refs.current[nextIndex]?.focus();
    setError('');
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) refs.current[index + 1]?.focus();
  };

  const verify = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length < 6) {
      setError('Enter all six digits from the email.');
      return;
    }
    setLoading(true);
    setError('');
    window.setTimeout(() => {
      if (code !== DEMO_CODE) {
        setLoading(false);
        setError('That code is incorrect or has expired. Try 123456 in this demo.');
        return;
      }
      setVerified(true);
      setLoading(false);
      const user = loginAs('customer');
      window.setTimeout(() => {
        toast.success('Email verified', `Welcome, ${user.name.split(' ')[0]}. Your account is secured.`);
        navigate('/customer/dashboard', { replace: true });
      }, 900);
    }, 700);
  };

  return (
    <AuthLayout
      title={verified ? 'You’re verified' : 'Verify your email'}
      subtitle={
        verified
          ? 'Your email is confirmed and your account is ready. Taking you to your dashboard…'
          : 'We sent a six-digit code to your inbox. Enter it below to secure your account.'
      }
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10.5px] font-bold text-brand-700 ring-1 ring-brand-600/15">
          <ShieldCheck className="h-3.5 w-3.5" /> One-time verification
        </span>
      }
      footer={
        <p className="text-center text-[12.5px] text-ink-500">
          Wrong email?{' '}
          <Link to="/register" className="font-bold text-brand-700 hover:text-brand-800">Start over</Link>
          {' · '}
          <Link to="/login" className="font-semibold text-ink-500 hover:text-brand-700">Sign in</Link>
        </p>
      }
    >
      {verified ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-600 shadow-soft ring-1 ring-emerald-100">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="mt-3 text-[14px] font-bold text-ink-900">Email verified successfully</p>
          <p className="mt-1 text-[11.5px] text-ink-500">Redirecting to your customer dashboard.</p>
          <div className="mx-auto mt-4 h-1 w-40 overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full animate-[shimmer_1.2s_infinite] rounded-full bg-emerald-500" style={{ width: '70%' }} />
          </div>
        </div>
      ) : (
        <form onSubmit={verify} className="space-y-4" noValidate>
          <div className="rounded-xl border border-ink-200 bg-ink-50/60 px-3.5 py-2.5 text-[11.5px] text-ink-600">
            Code sent to <span className="font-bold text-ink-900">{email}</span>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              <p className="text-[11.5px] leading-5 text-rose-700">{error}</p>
            </div>
          )}

          <div>
            <label className="field-label">6-digit code</label>
            <div className="grid grid-cols-6 gap-2">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={6}
                  aria-label={`Digit ${i + 1}`}
                  disabled={loading}
                  className={cn(
                    'h-12 w-full rounded-xl border bg-white text-center font-display text-lg font-extrabold text-ink-900 transition focus:outline-none focus:ring-4 disabled:bg-ink-50',
                    error
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
                      : 'border-ink-200 focus:border-brand-400 focus:ring-brand-500/10',
                  )}
                />
              ))}
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" loading={loading} iconLeft={!loading ? <LockKeyhole className="h-4 w-4" /> : undefined}>
            {loading ? 'Verifying…' : 'Verify & continue'}
          </Button>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-ink-400">
              {seconds > 0 ? `Resend available in 0:${String(seconds).padStart(2, '0')}` : 'Didn’t get the code?'}
            </span>
            <button
              type="button"
              disabled={seconds > 0}
              onClick={() => {
                setSeconds(45);
                toast.success('Code resent', `A new code was sent to ${email}.`);
              }}
              className="font-bold text-brand-700 transition hover:text-brand-800 disabled:cursor-not-allowed disabled:text-ink-300"
            >
              Resend code
            </button>
          </div>

          <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3.5">
            <p className="text-[10.5px] leading-5 text-brand-900">
              <strong className="font-bold">Demo code:</strong>{' '}
              <span className="font-mono text-[12px] font-bold tracking-[0.2em]">123456</span> — use it to continue. In production this code expires after 10 minutes and allows 3 attempts.
            </p>
          </div>

          <Link to="/login" className="inline-flex w-full items-center justify-center gap-1.5 text-[11.5px] font-semibold text-ink-500 hover:text-brand-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
