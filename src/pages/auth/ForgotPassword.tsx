import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, MailCheck, ShieldCheck } from 'lucide-react';
import { toast } from '@/store/toast';
import { Button, Input } from '@/components/ui/primitives';
import { AuthLayout } from './AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter the email address linked to your account.');
      return;
    }
    setError('');
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setSent(true);
      toast.success('Reset link sent', `Check ${email} for a secure reset link.`);
    }, 700);
  };

  return (
    <AuthLayout
      title={sent ? 'Check your inbox' : 'Reset your password'}
      subtitle={
        sent
          ? 'If an account exists for that email, a secure reset link is on its way. The link expires in 30 minutes.'
          : 'Enter the email linked to your Servora account and we’ll send a secure reset link.'
      }
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10.5px] font-bold text-brand-700 ring-1 ring-brand-600/15">
          <ShieldCheck className="h-3.5 w-3.5" /> Account recovery
        </span>
      }
      footer={
        <p className="text-center text-[12.5px] text-ink-500">
          Remembered it?{' '}
          <Link to="/login" className="font-bold text-brand-700 hover:text-brand-800">Back to sign in</Link>
        </p>
      }
    >
      {sent ? (
        <div>
          <div className="flex flex-col items-center rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-7 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-soft ring-1 ring-emerald-100">
              <MailCheck className="h-6 w-6" />
            </span>
            <p className="mt-3 text-[13.5px] font-bold text-ink-900">Email sent to</p>
            <p className="mt-0.5 break-all font-mono text-[12px] text-emerald-700">{email}</p>
            <p className="mt-2 max-w-xs text-[11.5px] leading-5 text-ink-500">
              Tip: check spam or promotions. Still nothing after 5 minutes? Try again or contact support.
            </p>
          </div>
          <div className="mt-5 space-y-2.5">
            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => {
                toast.success('Email resent', 'A fresh reset link is on its way.');
              }}
            >
              <Mail className="h-4 w-4" /> Resend email
            </Button>
            <Link to="/login" className={buttonStylesFull}>
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </div>
          <div className="mt-5 rounded-xl bg-ink-50 p-3.5">
            <p className="flex items-center gap-2 text-[11px] font-bold text-ink-700">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Demo tip
            </p>
            <p className="mt-1 text-[10.5px] leading-5 text-ink-500">
              Email delivery is simulated in this demo. Use the demo password <span className="font-mono font-bold">demo1234</span> on the sign-in page.
            </p>
          </div>
        </div>
      ) : (
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
              setError('');
            }}
            error={error}
            icon={<Mail className="h-4 w-4" />}
            disabled={loading}
            hint="We’ll send a one-time link that expires in 30 minutes."
          />
          <Button type="submit" size="lg" className="w-full" loading={loading} iconRight={!loading ? <ArrowRight className="h-4 w-4" /> : undefined}>
            {loading ? 'Sending link…' : 'Send reset link'}
          </Button>
          <div className="flex items-start gap-2.5 rounded-xl border border-ink-200 bg-ink-50/60 p-3.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <p className="text-[10.5px] leading-5 text-ink-500">
              For your security, we never confirm whether an email is registered. All reset links are single-use and bound to your device.
            </p>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

const buttonStylesFull =
  'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white text-sm font-semibold text-ink-700 transition hover:bg-ink-50';
