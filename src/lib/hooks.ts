import { useEffect, useState } from 'react';

/**
 * Sets a route-specific title and description. Keeps marketing pages distinct
 * in the browser tab, in search results and in link previews.
 */
export function usePageMeta({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  useEffect(() => {
    document.title = title;
    const tag = document.querySelector('meta[name="description"]');
    if (!tag || !description) return;
    const previous = tag.getAttribute('content');
    tag.setAttribute('content', description);
    return () => {
      if (previous !== null) tag.setAttribute('content', previous);
    };
  }, [title, description]);
}

/** Simulates a fast data fetch so every screen can exercise its loading state. */
export function useMockLoad(delay = 420) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);
  return loading;
}
