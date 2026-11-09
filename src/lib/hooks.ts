import { useEffect, useState } from 'react';

/** Simulates a fast data fetch so every screen can exercise its loading state. */
export function useMockLoad(delay = 420) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);
  return loading;
}
