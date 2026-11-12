import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Briefcase,
  Camera,
  ChevronDown,
  Clock,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  X,
} from 'lucide-react';
import { CITIES } from '@/lib/data';
import { OWNER } from '@/lib/owner';
import { cn } from '@/lib/utils';
import { useAuth, homePathForRole } from '@/store/auth';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { Avatar, Badge, Button, buttonStyles, Kbd } from '@/components/ui/primitives';
import { GithubIcon, LinkedinIcon } from '@/components/ui/brand-icons';
import { Dropdown, DropdownItem } from '@/components/ui/overlays';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { Logo } from '@/components/marketplace';
import { CommandPalette } from './CommandPalette';
import type { NavGroup } from './nav';

const publicNav = [
  { label: 'Services', to: '/services' },
  { label: 'Vendors', to: '/vendors' },
  { label: 'Categories', to: '/categories' },
  { label: 'Offers', to: '/offers' },
  { label: 'About us', to: '/about' },
  { label: 'How it works', to: '/how-it-works' },
];

const commandGroups: NavGroup[] = [
  {
    label: 'Explore',
    items: [
      { label: 'All services', to: '/services', icon: Sparkles },
      { label: 'Vendors directory', to: '/vendors', icon: BadgeCheck },
      { label: 'Categories', to: '/categories', icon: LayoutDashboard },
      { label: 'Offers & coupons', to: '/offers', icon: Star },
    ],
  },
  {
    label: 'Company',
    items: [
      { label: 'How it works', to: '/how-it-works', icon: Clock },
      { label: 'About us', to: '/about', icon: User },
      { label: 'Contact support', to: '/contact', icon: Bell },
      { label: 'Help center', to: '/help', icon: ShieldCheck },
      { label: 'FAQ', to: '/faq', icon: Heart },
    ],
  },
  {
    label: 'Portals',
    items: [
      { label: 'Customer dashboard', to: '/customer/dashboard', icon: User },
      { label: 'Vendor dashboard', to: '/vendor/dashboard', icon: LayoutDashboard },
      { label: 'Admin dashboard', to: '/admin/dashboard', icon: ShieldCheck },
    ],
  },
];

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export function PublicLayout() {
  const [city, setCity] = useState('Mumbai');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [announce, setAnnounce] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const unread = useApp((s) => s.notifications.filter((n) => n.audience === 'customer' && !n.read).length);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <ScrollToTop />
      {announce && (
        <div className="relative bg-ink-950 text-white">
          <div className="container-page flex h-9 items-center justify-center gap-2 overflow-hidden pr-11 text-[11.5px] sm:pr-6 lg:pr-8">
            <Sparkles className="hidden h-3.5 w-3.5 shrink-0 text-amber-400 sm:block" />
            <span className="hidden shrink-0 text-white/80 sm:inline">New here?</span>
            <span className="truncate font-semibold">Get 10% off your first booking</span>
            <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10.5px] font-bold tracking-wider text-amber-300">
              WELCOME10
            </span>
            <Link to="/offers" className="ml-1 hidden shrink-0 items-center gap-1 font-semibold text-white underline-offset-2 hover:underline sm:inline-flex">
              View offers <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <button
            onClick={() => setAnnounce(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/50 hover:text-white"
            aria-label="Dismiss announcement"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/90 backdrop-blur-xl">
        <div className="container-page flex h-[68px] items-center gap-3">
          <Logo />

          <Dropdown
            align="left"
            panelClassName="w-72"
            trigger={
              <button className="ml-1 hidden items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-2 text-[11.5px] font-semibold text-ink-600 transition hover:border-ink-300 hover:bg-ink-50 md:inline-flex">
                <MapPin className="h-3.5 w-3.5 text-brand-600" />
                {city}
                <ChevronDown className="h-3 w-3 text-ink-400" />
              </button>
            }
          >
            {(close) => (
              <div>
                <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                  Choose your city
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {CITIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCity(c);
                        close();
                        toast.success('Location updated', `Showing services near ${c}.`);
                      }}
                      className={cn(
                        'flex items-center justify-between rounded-lg px-3 py-2 text-left text-[12px] font-medium transition',
                        c === city ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50',
                      )}
                    >
                      {c}
                      {c === city && <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />}
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 border-t border-ink-100 px-3 py-2 text-[10.5px] text-ink-400">
                  Currently serving 8 cities · more coming soon
                </div>
              </div>
            )}
          </Dropdown>

          <nav className="ml-4 hidden items-center gap-0.5 lg:flex">
            {publicNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-[12.5px] font-semibold transition',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeSwitcher compact />
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-xl border border-ink-200 px-2.5 text-[11.5px] text-ink-400 transition hover:border-ink-300 hover:bg-ink-50 xl:flex"
            >
              <Search className="h-3.5 w-3.5" />
              Search services
              <Kbd className="ml-2">⌘K</Kbd>
            </button>

            <Link
              to="/register?role=vendor"
              className="hidden text-[12px] font-semibold text-ink-600 transition hover:text-brand-700 2xl:block"
            >
              Become a professional
            </Link>

            {user ? (
              <div className="flex items-center gap-1.5">
                <Link to="/customer/notifications" className="relative hidden rounded-lg p-2 text-ink-500 hover:bg-ink-100 sm:block">
                  <Bell className="h-[18px] w-[18px]" />
                  {unread > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </Link>
                <Link to={homePathForRole(user.role)} className={buttonStyles({ size: 'sm', className: 'hidden sm:inline-flex' })}>
                  <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                </Link>
                <Dropdown
                  trigger={
                    <button className="flex items-center gap-1.5 rounded-full p-0.5 ring-1 ring-ink-200 transition hover:ring-ink-300">
                      <Avatar name={user.name} size="sm" tone={user.tone} />
                      <ChevronDown className="mr-1 h-3 w-3 text-ink-400" />
                    </button>
                  }
                >
                  {(close) => (
                    <div className="w-56">
                      <div className="px-3 py-2">
                        <p className="text-[13px] font-bold text-ink-900">{user.name}</p>
                        <p className="truncate text-[11px] text-ink-400">{user.email}</p>
                      </div>
                      <div className="my-1 h-px bg-ink-100" />
                      <DropdownItem icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => { close(); navigate(homePathForRole(user.role)); }}>
                        Dashboard
                      </DropdownItem>
                      <DropdownItem icon={<Settings className="h-4 w-4" />} onClick={() => { close(); navigate(`/${user.role === 'admin' ? 'admin' : user.role}/settings`); }}>
                        Settings
                      </DropdownItem>
                      <div className="my-1 h-px bg-ink-100" />
                      <DropdownItem
                        danger
                        icon={<LogOut className="h-4 w-4" />}
                        onClick={() => {
                          close();
                          logout();
                          toast.success('Signed out', 'You have been securely signed out.');
                          navigate('/');
                        }}
                      >
                        Sign out
                      </DropdownItem>
                    </div>
                  )}
                </Dropdown>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link to="/login" className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'hidden sm:inline-flex' })}>
                  Log in
                </Link>
                <Link to="/register" className={buttonStyles({ size: 'sm', className: 'hidden sm:inline-flex' })}>
                  Get started
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-ink-100 bg-white px-4 pb-5 pt-3 lg:hidden">
            <button
              onClick={() => setPaletteOpen(true)}
              className="mb-3 flex h-11 w-full items-center gap-2 rounded-xl border border-ink-200 bg-ink-50/70 px-3 text-[13px] text-ink-400"
            >
              <Search className="h-4 w-4" /> Search services, vendors, categories
            </button>
            <div className="grid gap-0.5">
              {publicNav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg px-3 py-2.5 text-[13.5px] font-semibold text-ink-700 hover:bg-ink-50"
                >
                  {item.label}
                </Link>
              ))}
              <Link to="/help" className="rounded-lg px-3 py-2.5 text-[13.5px] font-semibold text-ink-700 hover:bg-ink-50">
                Help center
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-ink-100 pt-3">
              {user ? (
                <>
                  <Link to="/register?role=vendor" className={buttonStyles({ variant: 'outline', size: 'md' })}>
                    Become a pro
                  </Link>
                  <Link to="/services" className={buttonStyles({ size: 'md' })}>
                    Book a service
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className={buttonStyles({ variant: 'outline', size: 'md' })}>
                    Log in
                  </Link>
                  <Link to="/register" className={buttonStyles({ size: 'md' })}>
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} groups={commandGroups} />
    </div>
  );
}

function Footer() {
  const [email, setEmail] = useState('');
  const columns = [
    {
      title: 'Company',
      links: [
        { label: 'About us', to: '/about' },
        { label: 'How it works', to: '/how-it-works' },
        { label: 'Careers', to: '/about' },
        { label: 'Press & media', to: '/about' },
        { label: 'Contact us', to: '/contact' },
      ],
    },
    {
      title: 'For customers',
      links: [
        { label: 'Browse services', to: '/services' },
        { label: 'Vendors directory', to: '/vendors' },
        { label: 'Offers & coupons', to: '/offers' },
        { label: 'Help center', to: '/help' },
        { label: 'FAQs', to: '/faq' },
      ],
    },
    {
      title: 'For professionals',
      links: [
        { label: 'Become a vendor', to: '/register?role=vendor' },
        { label: 'Vendor dashboard', to: '/vendor/dashboard' },
        { label: 'How payouts work', to: '/how-it-works' },
        { label: 'Seller guidelines', to: '/policies/terms' },
        { label: 'Community', to: '/help' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms of service', to: '/policies/terms' },
        { label: 'Privacy policy', to: '/policies/privacy' },
        { label: 'Cancellation & refunds', to: '/policies/refunds' },
        { label: 'Accessibility', to: '/policies/accessibility' },
        { label: 'Trust & safety', to: '/policies/privacy' },
      ],
    },
  ];
  return (
    <footer className="bg-ink-950 text-ink-300">
      <div className="border-b border-white/10">
        <div className="container-page flex flex-col items-start justify-between gap-5 py-8 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg font-extrabold text-white">Local expertise, delivered.</p>
            <p className="mt-1 text-[12.5px] text-ink-400">Join 40,000+ households getting service tips, offers and updates.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.includes('@')) {
                toast.error('Invalid email', 'Please enter a valid email address.');
                return;
              }
              toast.success('You are subscribed!', 'Look out for your first Servora digest.');
              setEmail('');
            }}
            className="flex w-full max-w-md gap-2"
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Your email address"
              className="h-11 flex-1 rounded-xl border border-white/15 bg-white/5 px-3.5 text-[13px] text-white placeholder:text-ink-500 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
            />
            <button className="h-11 shrink-0 rounded-xl bg-white px-4 text-[12.5px] font-bold text-ink-900 transition hover:bg-brand-50">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-xs text-[12.5px] leading-6 text-ink-400">
            Servora is India’s trusted marketplace for local home services. Verified professionals, upfront pricing and
            happiness guaranteed.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {[Camera, Share2, Briefcase].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label={['Instagram', 'Share', 'LinkedIn'][i]}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-ink-400 transition hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          {(OWNER.email || OWNER.github || OWNER.linkedin) && (
            <div className="mt-4 space-y-1.5 text-[11.5px] text-ink-400">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">Built by {OWNER.name}</p>
              {OWNER.email && (
                <a href={`mailto:${OWNER.email}`} className="flex items-center gap-1.5 transition hover:text-white">
                  <Mail className="h-3.5 w-3.5" /> {OWNER.email}
                </a>
              )}
              {OWNER.github && (
                <a href={OWNER.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition hover:text-white">
                  <GithubIcon className="h-3.5 w-3.5" /> GitHub
                </a>
              )}
              {OWNER.linkedin && (
                <a href={OWNER.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition hover:text-white">
                  <LinkedinIcon className="h-3.5 w-3.5" /> LinkedIn
                </a>
              )}
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-1.5">
            {['UPI', 'Visa', 'Mastercard', 'RuPay', 'Net banking'].map((p) => (
              <span key={p} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-ink-400">
                {p}
              </span>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">{col.title}</p>
            <ul className="mt-3.5 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-[12.5px] text-ink-400 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-[11px] text-ink-500 sm:flex-row">
          <p>© 2026 Servora Marketplace Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> PCI-DSS compliant payments
            </span>
            <span className="hidden sm:inline">Made with ♥ in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
