/**
 * Shown while a lazily-loaded route is still being fetched, so navigating to a
 * page the browser has never visited yet doesn't leave a blank screen.
 */
export function RouteFallback({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      <span className="text-[11px] font-medium text-ink-400">{label}…</span>
    </div>
  );
}
