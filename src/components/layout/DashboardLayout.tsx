import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  X,
} from 'lucide-react';
import type { Role } from '@/lib/types';
import { cn, timeAgo } from '@/lib/utils';
import { useAuth, homePathForRole } from '@/store/auth';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { Avatar, Badge, Kbd } from '@/components/ui/primitives';
import { Dropdown, DropdownItem } from '@/components/ui/overlays';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { Logo } from '@/components/marketplace';
import { CommandPalette } from './CommandPalette';
import { navForRole } from './nav';

const portalMeta: Record<Role, { label: string; tone: string; icon: typeof User }> = {
  customer: { label: 'Customer portal', tone: 'brand', icon: User },
  vendor: { label: 'Vendor portal', tone: 'emerald', icon: Store },
  admin: { label: 'Admin console', tone: 'violet', icon: ShieldCheck },
};

const subPageLabels: Record<string, string> = {
  new: 'Create new',
  edit: 'Edit',
  dashboard: 'Dashboard',
};

export function DashboardLayout({ role }: { role: Role }) {
  const { user, loginAs, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const groups = navForRole(role);
  const meta = portalMeta[role];
  const isDark = role === 'admin';

  const notifications = useApp((s) => s.notifications);
  const markAllRead = useApp((s) => s.markAllRead);
  const markRead = useApp((s) => s.markRead);
  const myNotifications = useMemo(
    () => notifications.filter((n) => n.audience === role),
    [notifications, role],
  );
  const unread = myNotifications.filter((n) => !n.read);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const breadcrumb = useMemo(() => {
    const flat = groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));
    const match = flat
      .filter((i) => location.pathname === i.to || location.pathname.startsWith(`${i.to}/`))
      .sort((a, b) => b.to.length - a.to.length)[0];
    const parts = [meta.label];
    if (match) parts.push(match.label);
    const extra = location.pathname.split('/').filter(Boolean);
    const last = extra[extra.length - 1];
    if (last && last !== 'dashboard' && !match?.to.endsWith(last)) {
      if (subPageLabels[last]) parts.push(subPageLabels[last]);
      else if (/^b\d|^[A-Z0-9-]{4,}$/.test(last)) parts.push('Details');
      else if (last !== 'services') parts.push(subPageLabels[last] ?? 'Details');
    }
    return parts;
  }, [location.pathname, groups, meta.label]);

  const notificationHref =
    role === 'admin' ? '/admin/audit-logs' : role === 'vendor' ? '/vendor/dashboard' : '/customer/notifications';

  const switchPortal = (target: Role) => {
    const next = loginAs(target);
    navigate(homePathForRole(target));
    toast.info(`Viewing as ${next.name}`, `Switched to the ${target} demo account.`);
  };

  const sidebarInner = (
    <>
      <div className={cn('flex h-16 shrink-0 items-center justify-between border-b px-5', isDark ? 'border-white/10' : 'border-ink-100')}>
        <Logo dark={isDark} to={homePathForRole(role)} />
        <button
          onClick={() => setMobileOpen(false)}
          className={cn('rounded-lg p-1.5 lg:hidden', isDark ? 'text-ink-400 hover:bg-white/10' : 'text-ink-400 hover:bg-ink-100')}
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="px-4 pb-2 pt-4">
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-2.5 py-2 text-[10.5px] font-bold uppercase tracking-[0.1em]',
            isDark ? 'bg-white/5 text-ink-300' : role === 'vendor' ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-50 text-brand-700',
          )}
        >
          <meta.icon className="h-3.5 w-3.5" />
          {meta.label}
          {role === 'vendor' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {groups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className={cn('px-3 pb-1.5 pt-2 text-[9.5px] font-bold uppercase tracking-[0.16em]', isDark ? 'text-ink-500' : 'text-ink-400')}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition',
                      isActive
                        ? isDark
                          ? 'bg-white/10 text-white'
                          : 'bg-brand-50 text-brand-700'
                        : isDark
                          ? 'text-ink-400 hover:bg-white/5 hover:text-white'
                          : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500" />
                      )}
                      <item.icon className={cn('h-4 w-4 shrink-0', isActive ? (isDark ? 'text-brand-300' : 'text-brand-600') : isDark ? 'text-ink-500' : 'text-ink-400')} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-bold',
                            isDark
                              ? 'bg-brand-500/20 text-brand-300'
                              : isActive
                                ? 'bg-brand-600 text-white'
                                : 'bg-rose-50 text-rose-600',
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-3">
        {role === 'customer' && (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
            <Sparkles className="absolute -right-2 -top-2 h-16 w-16 text-white/10" />
            <p className="text-[12px] font-bold">Refer a friend, earn ₹200</p>
            <p className="mt-1 text-[10.5px] leading-4 text-white/70">They get ₹100 off their first booking. You get credit too.</p>
            <Link to="/customer/favorites" className="mt-2.5 inline-flex rounded-lg bg-white/15 px-2.5 py-1.5 text-[10.5px] font-bold backdrop-blur transition hover:bg-white/25">
              Get your link →
            </Link>
          </div>
        )}
        {role === 'vendor' && (
          <div className="relative overflow-hidden rounded-xl bg-emerald-600 p-4 text-white">
            <Store className="absolute -right-2 -top-2 h-16 w-16 text-white/10" />
            <p className="text-[12px] font-bold">Grow with featured listings</p>
            <p className="mt-1 text-[10.5px] leading-4 text-white/70">Get 3× more views by featuring your top service.</p>
            <Link to="/vendor/promotions" className="mt-2.5 inline-flex rounded-lg bg-white/15 px-2.5 py-1.5 text-[10.5px] font-bold backdrop-blur transition hover:bg-white/25">
              Boost a listing →
            </Link>
          </div>
        )}
        {role === 'admin' && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-white">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              All systems operational
            </p>
            <p className="mt-1.5 text-[10px] text-ink-500">Gateway sync 2 min ago · 99.98% uptime</p>
            <Link to="/admin/audit-logs" className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-brand-300 hover:text-brand-200">
              View system logs <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      <div className={cn('flex items-center gap-2.5 border-t px-3 py-3', isDark ? 'border-white/10' : 'border-ink-100')}>
        <Avatar name={user?.name ?? 'User'} size="sm" tone={user?.tone ?? 'brand'} />
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-[11.5px] font-bold', isDark ? 'text-white' : 'text-ink-900')}>{user?.name}</p>
          <p className={cn('truncate text-[9.5px]', isDark ? 'text-ink-500' : 'text-ink-400')}>{user?.email}</p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/');
            toast.success('Signed out', 'You have been securely signed out.');
          }}
          className={cn('rounded-lg p-1.5 transition', isDark ? 'text-ink-400 hover:bg-white/10 hover:text-white' : 'text-ink-400 hover:bg-ink-100 hover:text-ink-700')}
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-ink-50/60">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-ink-950/45 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col transition-transform duration-300 lg:translate-x-0',
          isDark ? 'bg-ink-950' : 'bg-white border-r border-ink-200/80',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarInner}
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-ink-200/70 bg-white/90 px-3 backdrop-blur-xl sm:px-5">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden min-w-0 items-center gap-1.5 text-[11.5px] md:flex">
            <Link to={homePathForRole(role)} className="text-ink-400 transition hover:text-brand-600">
              <Home className="h-3.5 w-3.5" />
            </Link>
            {breadcrumb.map((part, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3 text-ink-300" />
                <span className={i === breadcrumb.length - 1 ? 'font-semibold text-ink-700' : 'text-ink-400'}>{part}</span>
              </span>
            ))}
          </div>

          <button
            onClick={() => setPaletteOpen(true)}
            className="ml-auto flex h-9 items-center gap-2 rounded-xl border border-ink-200 px-2.5 text-[11.5px] text-ink-400 transition hover:border-ink-300 hover:bg-ink-50 sm:w-56"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search anything…</span>
            <Kbd className="ml-auto hidden sm:inline-flex">⌘K</Kbd>
          </button>

          <ThemeSwitcher compact />

          <Dropdown
            panelClassName="w-56"
            trigger={
              <button className="hidden h-9 items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 text-[11px] font-semibold text-ink-500 transition hover:bg-ink-50 sm:flex">
                <LayoutGrid className="h-3.5 w-3.5" />
                Switch portal
                <ChevronDown className="h-3 w-3 text-ink-400" />
              </button>
            }
          >
            {(close) => (
              <div>
                <p className="px-3 pb-1 pt-1.5 text-[9.5px] font-bold uppercase tracking-wider text-ink-400">Demo portals</p>
                {(['customer', 'vendor', 'admin'] as Role[]).map((r) => (
                  <DropdownItem
                    key={r}
                    icon={r === 'customer' ? <User className="h-4 w-4" /> : r === 'vendor' ? <Store className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    onClick={() => {
                      close();
                      switchPortal(r);
                    }}
                  >
                    <span className="flex-1 capitalize">{r}</span>
                    {role === r && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                  </DropdownItem>
                ))}
                <p className="border-t border-ink-100 px-3 pb-1 pt-2 text-[9.5px] leading-4 text-ink-400">
                  Signs you into the matching demo account.
                </p>
              </div>
            )}
          </Dropdown>

          <Dropdown
            panelClassName="w-[360px] p-0"
            trigger={
              <button className="relative rounded-lg p-2 text-ink-500 transition hover:bg-ink-100" aria-label="Notifications">
                <Bell className="h-[18px] w-[18px]" />
                {unread.length > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {unread.length}
                  </span>
                )}
              </button>
            }
          >
            {(close) => (
              <div>
                <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                  <div>
                    <p className="text-[13px] font-bold text-ink-900">Notifications</p>
                    <p className="text-[10px] text-ink-400">{unread.length} unread updates</p>
                  </div>
                  <button
                    onClick={() => {
                      markAllRead(role);
                      toast.success('All caught up', 'Every notification has been marked as read.');
                    }}
                    className="inline-flex items-center gap-1 text-[10.5px] font-bold text-brand-600 hover:text-brand-700"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </button>
                </div>
                <div className="max-h-[340px] overflow-y-auto">
                  {myNotifications.slice(0, 6).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markRead(n.id);
                        close();
                        if (n.href) navigate(n.href);
                      }}
                      className={cn('flex w-full items-start gap-3 border-b border-ink-50 px-4 py-3 text-left transition last:border-0 hover:bg-ink-50/70', !n.read && 'bg-brand-50/30')}
                    >
                      <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-ink-200' : 'bg-brand-500')} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-semibold text-ink-800">{n.title}</span>
                        <span className="mt-0.5 line-clamp-2 block text-[10.5px] leading-4 text-ink-500">{n.body}</span>
                        <span className="mt-1 block text-[9.5px] text-ink-400">{n.time}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <Link
                  to={notificationHref}
                  onClick={close}
                  className="block border-t border-ink-100 py-2.5 text-center text-[11px] font-bold text-brand-600 hover:bg-ink-50"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </Dropdown>

          <Link
            to={role === 'admin' ? '/admin/disputes' : role === 'vendor' ? '/vendor/messages' : '/customer/messages'}
            className="relative hidden rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 sm:block"
            aria-label="Messages"
          >
            <MessageSquare className="h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </Link>

          <Dropdown
            panelClassName="w-60"
            trigger={
              <button className="flex items-center gap-1.5 rounded-full p-0.5 ring-1 ring-ink-200 transition hover:ring-ink-300">
                <Avatar name={user?.name ?? 'User'} size="sm" tone={user?.tone ?? 'brand'} />
                <ChevronDown className="mr-1 h-3 w-3 text-ink-400" />
              </button>
            }
          >
            {(close) => (
              <div>
                <div className="px-3 py-2">
                  <p className="text-[13px] font-bold text-ink-900">{user?.name}</p>
                  <p className="truncate text-[10.5px] text-ink-400">{user?.email}</p>
                  <Badge tone={role === 'admin' ? 'violet' : role === 'vendor' ? 'success' : 'brand'} size="sm" className="mt-1.5">
                    {role === 'admin' ? 'Super admin' : role === 'vendor' ? 'Vendor owner' : 'Customer'}
                  </Badge>
                </div>
                <div className="my-1 h-px bg-ink-100" />
                <DropdownItem icon={<LayoutGrid className="h-4 w-4" />} onClick={() => { close(); navigate(homePathForRole(role)); }}>
                  Dashboard
                </DropdownItem>
                <DropdownItem icon={<Settings className="h-4 w-4" />} onClick={() => { close(); navigate(`/${role}/settings`); }}>
                  Account settings
                </DropdownItem>
                <DropdownItem icon={<User className="h-4 w-4" />} onClick={() => { close(); navigate('/'); }}>
                  Back to website
                </DropdownItem>
                <div className="my-1 h-px bg-ink-100" />
                <DropdownItem
                  danger
                  icon={<LogOut className="h-4 w-4" />}
                  onClick={() => {
                    close();
                    logout();
                    navigate('/');
                    toast.success('Signed out', 'You have been securely signed out.');
                  }}
                >
                  Sign out
                </DropdownItem>
              </div>
            )}
          </Dropdown>
        </header>

        <main className="min-h-[calc(100vh-4rem)]">
          <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="animate-fade-up">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} groups={groups} />
    </div>
  );
}
