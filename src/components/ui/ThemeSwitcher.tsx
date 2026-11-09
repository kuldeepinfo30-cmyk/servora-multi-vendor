import { Check, ChevronDown, Leaf, Moon, Palette, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dropdown, DropdownItem } from '@/components/ui/overlays';
import { THEMES, useTheme, type ThemeName } from '@/store/theme';

const themeIcon: Record<ThemeName, typeof Sun> = {
  green: Leaf,
  white: Sun,
  black: Moon,
};

export function ThemeSwitcher({ className, compact }: { className?: string; compact?: boolean }) {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const current = THEMES.find((t) => t.name === theme) ?? THEMES[0];

  return (
    <Dropdown
      panelClassName="w-60"
      trigger={
        <button
          type="button"
          aria-label="Change theme"
          className={cn(
            'flex h-9 items-center gap-2 rounded-xl border border-ink-200 px-2.5 text-[11.5px] font-semibold text-ink-500 transition hover:border-ink-300 hover:bg-ink-50',
            className,
          )}
        >
          <Palette className="h-3.5 w-3.5" />
          {!compact && <span className="hidden sm:inline">{current.label}</span>}
          <ChevronDown className="h-3 w-3 text-ink-400" />
        </button>
      }
    >
      {(close) => (
        <div>
          <p className="px-3 pb-1 pt-1.5 text-[9.5px] font-bold uppercase tracking-wider text-ink-400">
            Theme
          </p>
          {THEMES.map((t) => {
            const Icon = themeIcon[t.name];
            const active = theme === t.name;
            return (
              <DropdownItem
                key={t.name}
                icon={
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg',
                      active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                }
                onClick={() => {
                  setTheme(t.name);
                  close();
                }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-semibold text-ink-800">{t.label}</span>
                  <span className="block text-[10px] text-ink-400">{t.hint}</span>
                </span>
                {active && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
              </DropdownItem>
            );
          })}
        </div>
      )}
    </Dropdown>
  );
}
