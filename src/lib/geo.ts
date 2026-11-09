import type { Vendor } from '@/lib/types';

export interface Coords {
  lat: number;
  lng: number;
}

export interface UserLocation extends Coords {
  /** Human readable place, resolved from the nearest known city. */
  label: string;
  accuracy?: number;
}

/** Service radius options (km) shown in the radius dropdown. */
export const RADIUS_OPTIONS = [1, 2, 5, 10, 25] as const;
export const DEFAULT_RADIUS_KM = 5;

/** Approximate coordinates for every city we serve (fallback for a vendor). */
export const CITY_COORDS: Record<string, Coords> = {
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  'Delhi NCR': { lat: 28.6139, lng: 77.209 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
};

/** Real coordinates of each vendor's service area (city|area). */
const AREA_COORDS: Record<string, Coords> = {
  'Mumbai|Andheri West': { lat: 19.1364, lng: 72.8296 },
  'Mumbai|Bandra East': { lat: 19.0607, lng: 72.8493 },
  'Mumbai|Powai': { lat: 19.1176, lng: 72.906 },
  'Bengaluru|Koramangala': { lat: 12.9352, lng: 77.6245 },
  'Bengaluru|HSR Layout': { lat: 12.9121, lng: 77.6446 },
  'Bengaluru|Whitefield': { lat: 12.9698, lng: 77.75 },
  'Hyderabad|Jubilee Hills': { lat: 17.4325, lng: 78.4073 },
  'Delhi NCR|Hauz Khas': { lat: 28.5494, lng: 77.2001 },
  'Delhi NCR|Vasant Kunj': { lat: 28.521, lng: 77.1592 },
  'Pune|Kothrud': { lat: 18.5074, lng: 73.8077 },
  'Pune|Baner': { lat: 18.559, lng: 73.7868 },
  'Kolkata|Salt Lake': { lat: 22.5867, lng: 88.4171 },
};

export function vendorCoords(vendor: Vendor): Coords | null {
  return AREA_COORDS[`${vendor.city}|${vendor.area}`] ?? CITY_COORDS[vendor.city] ?? null;
}

/** Great-circle distance between two points, in kilometres. */
export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Distance from the user to a vendor, or null when either has no coordinates. */
export function distanceToVendor(location: Coords | null, vendor: Vendor): number | null {
  if (!location) return null;
  const target = vendorCoords(vendor);
  if (!target) return null;
  return haversineKm(location, target);
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Resolves a coordinate to the nearest city we serve (used as a label). */
export function nearestCity(coords: Coords): string {
  let best = 'your area';
  let bestKm = Infinity;
  for (const [city, cityCoords] of Object.entries(CITY_COORDS)) {
    const km = haversineKm(coords, cityCoords);
    if (km < bestKm) {
      bestKm = km;
      best = city;
    }
  }
  return best;
}

/**
 * Wraps the browser Geolocation API in a promise. Resolves with the detected
 * place, or null when the user denies access / the browser can't provide it.
 */
export function detectLocation(): Promise<UserLocation | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        resolve({
          ...coords,
          label: nearestCity(coords),
          accuracy: pos.coords.accuracy,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}
