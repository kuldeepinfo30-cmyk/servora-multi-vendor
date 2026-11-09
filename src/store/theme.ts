import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'green' | 'white' | 'black';

export const THEMES: { name: ThemeName; label: string; hint: string }[] = [
  { name: 'green', label: 'Light green', hint: 'VS Code style (default)' },
  { name: 'white', label: 'White', hint: 'Clean & bright' },
  { name: 'black', label: 'Black', hint: 'True dark mode' },
];

/** Mirrors the active theme onto <html data-theme> + the browser chrome colour. */
export function applyTheme(theme: ThemeName) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  const chrome: Record<ThemeName, string> = {
    green: '#16a34a',
    white: '#4f46e5',
    black: '#0a0f1a',
  };
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', chrome[theme]);
}

const STORAGE_KEY = 'servora-theme';

/**
 * Reads the persisted theme synchronously so the very first paint already uses
 * the right tokens (prevents a flash of the default theme on reload).
 */
export function bootstrapTheme() {
  let theme: ThemeName = 'green';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { theme?: ThemeName } };
      const stored = parsed?.state?.theme;
      if (stored && THEMES.some((t) => t.name === stored)) theme = stored;
    }
  } catch {
    /* ignore malformed storage */
  }
  applyTheme(theme);
  return theme;
}

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'green',
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme ?? 'green');
      },
    },
  ),
);
