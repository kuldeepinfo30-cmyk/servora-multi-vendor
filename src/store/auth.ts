import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { USERS } from '@/lib/data';
import { OWNER } from '@/lib/owner';
import type { Role, User } from '@/lib/types';

export const DEMO_ACCOUNTS: {
  role: Role;
  email: string;
  password: string;
  label: string;
  person: string;
  blurb: string;
}[] = [
  {
    role: 'customer',
    email: 'customer@servora.demo',
    password: 'demo1234',
    label: 'Customer',
    person: 'Aarav Mehta',
    blurb: 'Book, track, pay and review services',
  },
  {
    role: 'vendor',
    email: 'vendor@servora.demo',
    password: 'demo1234',
    label: 'Vendor owner',
    person: 'Neha Kulkarni · SparkleHome',
    blurb: 'Manage services, calendar & earnings',
  },
  {
    role: 'admin',
    email: 'admin@servora.demo',
    password: 'demo1234',
    label: 'Super admin',
    person: OWNER.name,
    blurb: 'Oversee the entire marketplace',
  },
];

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => { ok: boolean; user?: User; error?: string };
  loginAs: (role: Role) => User;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: (email, password) => {
        const account = DEMO_ACCOUNTS.find(
          (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (!account) {
          return { ok: false, error: 'No demo account found with this email. Try one of the demo logins below.' };
        }
        if (password.length < 4) {
          return { ok: false, error: 'Password must be at least 4 characters.' };
        }
        const user = USERS.find((u) => u.role === account.role) ?? USERS[0];
        set({ user });
        return { ok: true, user };
      },
      loginAs: (role) => {
        const user = USERS.find((u) => u.role === role) ?? USERS[0];
        set({ user });
        return user;
      },
      logout: () => set({ user: null }),
      updateProfile: (patch) => {
        const user = get().user;
        if (user) set({ user: { ...user, ...patch } });
      },
    }),
    { name: 'servora-auth' },
  ),
);

export const homePathForRole = (role: Role) =>
  role === 'admin' ? '/admin/dashboard' : role === 'vendor' ? '/vendor/dashboard' : '/customer/dashboard';
