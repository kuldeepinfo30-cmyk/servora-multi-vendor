import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Home, LockKeyhole, ShieldAlert } from 'lucide-react';
import { homePathForRole, useAuth } from '@/store/auth';
import { buttonStyles, Card } from '@/components/ui/primitives';
import { Logo } from '@/components/marketplace';
import { toast } from '@/store/toast';

export default function ForbiddenPage() {
  const { user, logout, loginAs } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const attempted = (location.state as { attempted?: string; from?: string } | null)?.attempted;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-50/70 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
      <div className="relative w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="overflow-hidden">
          <div className="border-b border-ink-100 bg-white px-6 py-8 text-center sm:px-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100">
              <ShieldAlert className="h-7 w-7" />
            </span>
            <p className="mt-4 font-display text-[38px] font-extrabold leading-none tracking-tight text-ink-900">403</p>
            <h1 className="mt-1.5 text-[17px] font-bold text-ink-900">This area is restricted</h1>
            <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-6 text-ink-500">
              Your account doesn’t have permission to view
              {attempted ? <> the <span className="font-semibold capitalize">{attempted}</span> portal</> : ' this page'}.
              Portals are strictly isolated by role.
            </p>
          </div>

          <div className="px-6 py-5 sm:px-10">
            {user ? (
              <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50/60 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-ink-500 ring-1 ring-ink-100">
                  <LockKeyhole className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-ink-800">{user.name}</p>
                  <p className="text-[10.5px] capitalize text-ink-500">Signed in as {user.role}</p>
                </div>
                <Link to={homePathForRole(user.role)} className={buttonStyles({ size: 'sm' })}>
                  My dashboard
                </Link>
              </div>
            ) : (
              <Link to="/login" className={buttonStyles({ size: 'md', className: 'w-full' })}>
                Sign in to continue <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link to="/" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
                <Home className="h-3.5 w-3.5" /> Back to website
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  toast.info('Signed out', 'You can sign in with a different demo account.');
                  navigate('/login');
                }}
                className={buttonStyles({ variant: 'ghost', size: 'sm' })}
              >
                Switch account
              </button>
            </div>

            {user && (
              <div className="mt-5 border-t border-ink-100 pt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  Or explore a demo portal
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(['customer', 'vendor', 'admin'] as const)
                    .filter((r) => r !== user.role)
                    .map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          loginAs(r);
                          navigate(homePathForRole(r));
                          toast.info(`Switched to ${r}`, 'Using the seeded demo account.');
                        }}
                        className="rounded-lg border border-ink-200 px-3 py-1.5 text-[11px] font-semibold capitalize text-ink-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                      >
                        {r} portal
                      </button>
                    ))}
                  <Link to="/login" className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-ink-400 hover:text-ink-700">
                    <ArrowLeft className="h-3 w-3" /> Sign in
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Card>
        <p className="mt-4 text-center text-[10.5px] text-ink-400">
          Need access? Contact your workspace owner or{' '}
          <Link to="/contact" className="font-semibold text-ink-500 hover:text-brand-700">support@servora.demo</Link>.
        </p>
      </div>
    </div>
  );
}
