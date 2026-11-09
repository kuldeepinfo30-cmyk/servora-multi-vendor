import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BOOKINGS, NOTIFICATIONS, ADDRESSES, TICKETS } from '@/lib/data';
import type { Address, Booking, BookingStatus, Notification, Role, Ticket } from '@/lib/types';

interface AppState {
  bookings: Booking[];
  notifications: Notification[];
  serviceFavorites: string[];
  vendorFavorites: string[];
  addresses: Address[];
  tickets: Ticket[];
  savedSearches: string[];
  onboardingStatus: 'draft' | 'submitted' | 'under_review' | 'approved';
  onboardingStep: number;
  vendorServiceStatus: Record<string, 'published' | 'draft' | 'pending'>;
  lastBookingRef: string | null;
  addBooking: (booking: Booking) => void;
  updateBookingStatus: (id: string, status: BookingStatus, extra?: Partial<Booking>) => void;
  addNotification: (n: Omit<Notification, 'id'>) => void;
  markRead: (id: string) => void;
  markAllRead: (audience: Role) => void;
  toggleServiceFavorite: (id: string) => void;
  toggleVendorFavorite: (id: string) => void;
  addAddress: (address: Address) => void;
  updateAddress: (id: string, patch: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  addTicket: (ticket: Ticket) => void;
  addSavedSearch: (term: string) => void;
  setOnboarding: (status: AppState['onboardingStatus']) => void;
  setOnboardingStep: (step: number) => void;
  setVendorServiceStatus: (id: string, status: 'published' | 'draft' | 'pending') => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      bookings: BOOKINGS,
      notifications: NOTIFICATIONS,
      serviceFavorites: ['s1', 's13', 's28'],
      vendorFavorites: ['v1', 'v5'],
      addresses: ADDRESSES,
      tickets: TICKETS,
      savedSearches: ['deep cleaning 3 bhk', 'bridal makeup hyderabad', 'AC service'],
      onboardingStatus: 'approved',
      onboardingStep: 1,
      vendorServiceStatus: {},
      lastBookingRef: null,

      addBooking: (booking) =>
        set((s) => ({
          bookings: [booking, ...s.bookings],
          lastBookingRef: booking.ref,
          notifications: [
            {
              id: `n_${Date.now()}`,
              kind: 'booking',
              title: 'Booking created',
              body: `Your booking ${booking.ref} has been created successfully.`,
              time: 'just now',
              read: false,
              audience: 'customer',
              href: `/customer/bookings/${booking.id}`,
            },
            ...s.notifications,
          ],
        })),

      updateBookingStatus: (id, status, extra) =>
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id
              ? {
                  ...b,
                  status,
                  ...extra,
                  paymentStatus:
                    status === 'refunded' ? 'refunded' : extra?.paymentStatus ?? b.paymentStatus,
                }
              : b,
          ),
        })),

      addNotification: (n) =>
        set((s) => ({
          notifications: [{ ...n, id: `n_${Date.now()}`, read: false }, ...s.notifications],
        })),

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllRead: (audience) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.audience === audience ? { ...n, read: true } : n,
          ),
        })),

      toggleServiceFavorite: (id) =>
        set((s) => ({
          serviceFavorites: s.serviceFavorites.includes(id)
            ? s.serviceFavorites.filter((x) => x !== id)
            : [...s.serviceFavorites, id],
        })),

      toggleVendorFavorite: (id) =>
        set((s) => ({
          vendorFavorites: s.vendorFavorites.includes(id)
            ? s.vendorFavorites.filter((x) => x !== id)
            : [...s.vendorFavorites, id],
        })),

      addAddress: (address) =>
        set((s) => ({
          addresses: address.isDefault
            ? [...s.addresses.map((a) => ({ ...a, isDefault: false })), address]
            : [...s.addresses, address],
        })),

      updateAddress: (id, patch) =>
        set((s) => ({
          addresses: s.addresses.map((a) =>
            a.id === id
              ? { ...a, ...patch }
              : patch.isDefault
                ? { ...a, isDefault: false }
                : a,
          ),
        })),

      removeAddress: (id) =>
        set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) })),

      setDefaultAddress: (id) =>
        set((s) => ({
          addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
        })),

      addTicket: (ticket) => set((s) => ({ tickets: [ticket, ...s.tickets] })),

      addSavedSearch: (term) =>
        set((s) => ({
          savedSearches: [term, ...s.savedSearches.filter((t) => t !== term)].slice(0, 6),
        })),

      setOnboarding: (status) => set({ onboardingStatus: status }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      setVendorServiceStatus: (id, status) =>
        set((s) => ({ vendorServiceStatus: { ...s.vendorServiceStatus, [id]: status } })),
    }),
    { name: 'servora-app-v1', version: 1 },
  ),
);

export const useBookings = () => useApp((s) => s.bookings);

export const bookingWithOverride = (b: Booking) => b;

export const customerBookings = (customerId: string) =>
  useApp.getState().bookings.filter((b) => b.customerId === customerId);
