import { Loader2, LocateFixed, MapPin, Navigation, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RADIUS_OPTIONS, formatKm } from '@/lib/geo';
import { useLocation } from '@/store/location';
import { toast } from '@/store/toast';
import { Switch } from '@/components/ui/primitives';

/** Reusable real-time location + radius control used on search, vendors and booking. */
export function LocationBar({ className, compact }: { className?: string; compact?: boolean }) {
  const location = useLocation((s) => s.location);
  const radiusKm = useLocation((s) => s.radiusKm);
  const nearbyOnly = useLocation((s) => s.nearbyOnly);
  const isDetecting = useLocation((s) => s.isDetecting);
  const detect = useLocation((s) => s.detect);
  const setRadiusKm = useLocation((s) => s.setRadiusKm);
  const setNearbyOnly = useLocation((s) => s.setNearbyOnly);
  const clear = useLocation((s) => s.clear);

  const run = async () => {
    const next = await detect();
    if (next) {
      toast.success('Live location active', `Showing pros within ${radiusKm} km of ${next.label}.`);
    } else {
      toast.error('Location unavailable', 'Allow location access in your browser to find nearby pros.');
    }
  };

  const radiusSelect = (
    <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-600">
      Radius
      <select
        value={radiusKm}
        onChange={(e) => setRadiusKm(Number(e.target.value))}
        className="h-8 rounded-lg border border-ink-200 bg-white px-2 text-[11.5px] font-semibold text-ink-700 focus:border-brand-400 focus:outline-none"
        aria-label="Service radius in kilometres"
      >
        {RADIUS_OPTIONS.map((r) => (
          <option key={r} value={r}>
            {r} km
          </option>
        ))}
      </select>
    </label>
  );

  if (!location) {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-3 py-2.5',
          className,
        )}
      >
        <button
          type="button"
          onClick={run}
          disabled={isDetecting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-[11.5px] font-bold text-white transition hover:bg-brand-700 disabled:opacity-70"
        >
          {isDetecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
          {isDetecting ? 'Detecting…' : 'Use my current location'}
        </button>
        {radiusSelect}
        {!compact && (
          <span className="inline-flex items-center gap-1 text-[11px] text-ink-400">
            <LocateFixed className="h-3.5 w-3.5" /> Auto-detects your area and shows nearby vendors
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-brand-800">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
        </span>
        Live location
      </span>
      <span className="inline-flex min-w-0 items-center gap-1 text-[11.5px] font-semibold text-ink-700">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" />
        <span className="truncate">{location.label}</span>
        <span className="hidden text-ink-400 sm:inline">
          · {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
        </span>
      </span>
      {!compact && <span className="hidden h-4 w-px bg-brand-200 sm:block" />}
      {radiusSelect}
      <Switch checked={nearbyOnly} onChange={setNearbyOnly} label="Nearby only" />
      <button
        type="button"
        onClick={run}
        disabled={isDetecting}
        className="ml-auto inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-2.5 py-1 text-[11px] font-bold text-brand-800 transition hover:bg-brand-100 disabled:opacity-70"
        aria-label="Refresh location"
      >
        {isDetecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <LocateFixed className="h-3 w-3" />}
        {formatKm(radiusKm)}
      </button>
      <button
        type="button"
        onClick={clear}
        className="rounded-lg p-1 text-ink-400 transition hover:bg-white hover:text-ink-700"
        aria-label="Clear location"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
