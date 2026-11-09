import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_RADIUS_KM, detectLocation, type UserLocation } from '@/lib/geo';

interface LocationState {
  /** Live location detected from the browser (null until the user enables it). */
  location: UserLocation | null;
  /** Nearby search radius in kilometres. */
  radiusKm: number;
  /** When true, results are limited to vendors inside the radius. */
  nearbyOnly: boolean;
  isDetecting: boolean;
  setLocation: (location: UserLocation | null) => void;
  setRadiusKm: (radiusKm: number) => void;
  setNearbyOnly: (nearbyOnly: boolean) => void;
  /** Requests the browser location and stores it. Returns null on failure. */
  detect: () => Promise<UserLocation | null>;
  clear: () => void;
}

export const useLocation = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      radiusKm: DEFAULT_RADIUS_KM,
      nearbyOnly: false,
      isDetecting: false,

      setLocation: (location) => set({ location }),
      setRadiusKm: (radiusKm) => set({ radiusKm }),
      setNearbyOnly: (nearbyOnly) => set({ nearbyOnly }),

      detect: async () => {
        set({ isDetecting: true });
        const location = await detectLocation();
        set({ isDetecting: false, ...(location ? { location, nearbyOnly: true } : {}) });
        return location;
      },

      clear: () => set({ location: null, nearbyOnly: false }),
    }),
    {
      name: 'servora-location',
      partialize: (s) => ({ location: s.location, radiusKm: s.radiusKm, nearbyOnly: s.nearbyOnly }),
    },
  ),
);
