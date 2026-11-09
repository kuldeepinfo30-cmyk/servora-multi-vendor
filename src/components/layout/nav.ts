import {
  ArrowLeftRight,
  BadgePercent,
  Banknote,
  BarChart3,
  Bell,
  CalendarCheck,
  ClipboardCheck,
  ContactRound,
  CreditCard,
  FileText,
  Heart,
  LayoutDashboard,
  Layers,
  LifeBuoy,
  MapPin,
  MessageSquare,
  Percent,
  ReceiptText,
  RotateCcw,
  Scale,
  ScrollText,
  Settings,
  ShieldCheck,
  Star,
  Store,
  TicketPercent,
  Users,
  Wallet,
  Grid2x2,
  UserRoundCog,
  CalendarDays,
  Sparkles,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const customerNav: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/customer/dashboard', icon: LayoutDashboard, end: true },
      { label: 'My bookings', to: '/customer/bookings', icon: CalendarCheck },
      { label: 'Messages', to: '/customer/messages', icon: MessageSquare, badge: '3' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Saved items', to: '/customer/favorites', icon: Heart },
      { label: 'Addresses', to: '/customer/addresses', icon: MapPin },
      { label: 'Payments', to: '/customer/payments', icon: CreditCard },
      { label: 'Invoices', to: '/customer/invoices', icon: ReceiptText },
      { label: 'My reviews', to: '/customer/reviews', icon: Star },
      { label: 'Support', to: '/customer/support', icon: LifeBuoy },
    ],
  },
  {
    label: 'Preferences',
    items: [
      { label: 'Notifications', to: '/customer/notifications', icon: Bell },
      { label: 'Settings', to: '/customer/settings', icon: Settings },
    ],
  },
];

export const vendorNav: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/vendor/dashboard', icon: LayoutDashboard, end: true },
      { label: 'Bookings', to: '/vendor/bookings', icon: CalendarCheck, badge: '2' },
      { label: 'Calendar', to: '/vendor/calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Onboarding', to: '/vendor/onboarding', icon: ClipboardCheck },
      { label: 'Business profile', to: '/vendor/profile', icon: Store },
      { label: 'Services', to: '/vendor/services', icon: Wrench },
      { label: 'Staff', to: '/vendor/staff', icon: Users },
      { label: 'Customers', to: '/vendor/customers', icon: ContactRound },
    ],
  },
  {
    label: 'Growth',
    items: [
      { label: 'Earnings', to: '/vendor/earnings', icon: Wallet },
      { label: 'Payouts', to: '/vendor/payouts', icon: Banknote },
      { label: 'Reviews', to: '/vendor/reviews', icon: Star },
      { label: 'Promotions', to: '/vendor/promotions', icon: BadgePercent },
    ],
  },
  {
    label: 'Inbox',
    items: [
      { label: 'Messages', to: '/vendor/messages', icon: MessageSquare, badge: '2' },
      { label: 'Settings', to: '/vendor/settings', icon: Settings },
    ],
  },
];

export const adminNav: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Marketplace',
    items: [
      { label: 'Customers', to: '/admin/customers', icon: Users },
      { label: 'Vendors', to: '/admin/vendors', icon: Store },
      { label: 'Applications', to: '/admin/applications', icon: ClipboardCheck, badge: '6' },
      { label: 'Services', to: '/admin/services', icon: Grid2x2 },
      { label: 'Categories', to: '/admin/categories', icon: Layers },
    ],
  },
  {
    label: 'Operations',
    items: [{ label: 'Bookings', to: '/admin/bookings', icon: CalendarCheck }],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Transactions', to: '/admin/transactions', icon: ArrowLeftRight },
      { label: 'Commissions', to: '/admin/commissions', icon: Percent },
      { label: 'Payouts', to: '/admin/payouts', icon: Banknote, badge: '3' },
      { label: 'Refunds', to: '/admin/refunds', icon: RotateCcw },
      { label: 'Disputes', to: '/admin/disputes', icon: Scale, badge: '2' },
    ],
  },
  {
    label: 'Content & growth',
    items: [
      { label: 'Reviews', to: '/admin/reviews', icon: Star },
      { label: 'Coupons', to: '/admin/coupons', icon: TicketPercent },
      { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
      { label: 'CMS pages', to: '/admin/cms', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Roles & access', to: '/admin/roles', icon: ShieldCheck },
      { label: 'Settings', to: '/admin/settings', icon: Settings },
      { label: 'Audit logs', to: '/admin/audit-logs', icon: ScrollText },
    ],
  },
];

export const navForRole = (role: 'customer' | 'vendor' | 'admin') =>
  role === 'admin' ? adminNav : role === 'vendor' ? vendorNav : customerNav;

export const quickAdminActions = [
  { label: 'Review applications', to: '/admin/applications', icon: UserRoundCog },
  { label: 'Approve payouts', to: '/admin/payouts', icon: Banknote },
  { label: 'Open disputes', to: '/admin/disputes', icon: Scale },
  { label: 'Platform settings', to: '/admin/settings', icon: Sparkles },
];
