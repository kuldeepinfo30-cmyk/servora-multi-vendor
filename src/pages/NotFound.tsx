import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { buttonStyles } from '@/components/ui/primitives';
import { Logo } from '@/components/marketplace';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-mesh px-4 py-16">
      <div className="w-full max-w-md text-center">
        <Logo className="justify-center" />
        <p className="mt-8 font-display text-[86px] font-extrabold leading-none tracking-tighter text-ink-900">
          4<span className="text-brand-600">0</span>4
        </p>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-ink-900">This page took a day off</h1>
        <p className="mt-2 text-[13px] leading-6 text-ink-500">
          We could not find the page you were looking for. It may have moved, or the link might be incorrect.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link to="/" className={buttonStyles({ size: 'md' })}>
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <Link to="/services" className={buttonStyles({ variant: 'outline', size: 'md' })}>
            <Compass className="h-4 w-4" /> Browse services
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-ink-400">
          <Link to="/help" className="hover:text-brand-600">Help center</Link>
          <Link to="/contact" className="hover:text-brand-600">Contact support</Link>
          <Link to="/faq" className="hover:text-brand-600">FAQs</Link>
        </div>
      </div>
    </div>
  );
}
