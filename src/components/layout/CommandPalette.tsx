import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Search, Sparkles } from 'lucide-react';
import { CATEGORIES, SERVICES, VENDORS } from '@/lib/data';
import type { NavGroup } from './nav';
import { Modal } from '@/components/ui/overlays';
import { Kbd } from '@/components/ui/primitives';
import { cn, inr } from '@/lib/utils';

export function CommandPalette({
  open,
  onOpenChange,
  groups,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: NavGroup[];
}) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const links = useMemo(
    () => groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))),
    [groups],
  );

  const q = query.toLowerCase().trim();
  const filteredLinks = links.filter((l) => l.label.toLowerCase().includes(q));
  const filteredServices = q
    ? SERVICES.filter((s) => `${s.name} ${s.tags.join(' ')}`.toLowerCase().includes(q)).slice(0, 4)
    : SERVICES.filter((s) => s.featured).slice(0, 3);
  const filteredVendors = q
    ? VENDORS.filter((v) => `${v.name} ${v.city}`.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const filteredCategories = q
    ? CATEGORIES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3)
    : [];

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      size="lg"
      bodyClassName="p-0"
    >
      <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3.5">
        <Search className="h-4.5 w-4.5 text-ink-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pages, services, vendors…"
          className="h-7 flex-1 bg-transparent text-[14px] text-ink-800 placeholder:text-ink-400 focus:outline-none"
        />
        <Kbd>ESC</Kbd>
      </div>
      <div className="max-h-[420px] overflow-y-auto p-2">
        {q === '' && (
          <p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
            Quick actions
          </p>
        )}
        {filteredLinks.length > 0 && (
          <div className="mb-1">
            {filteredLinks.slice(0, 6).map((link) => (
              <button
                key={link.to}
                onClick={() => go(link.to)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-ink-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                  <link.icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-[13px] font-semibold text-ink-700">{link.label}</span>
                <span className="text-[10px] text-ink-400">{link.group}</span>
              </button>
            ))}
          </div>
        )}

        {filteredServices.length > 0 && (
          <>
            <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
              Services
            </p>
            {filteredServices.map((s) => (
              <button
                key={s.id}
                onClick={() => go(`/services/${s.slug}`)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-ink-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold text-ink-700">{s.name}</span>
                  <span className="block text-[10px] text-ink-400">
                    {VENDORS.find((v) => v.id === s.vendorId)?.name}
                  </span>
                </span>
                <span className="text-[11px] font-bold text-ink-500">{inr(s.price)}</span>
              </button>
            ))}
          </>
        )}

        {filteredVendors.length > 0 && (
          <>
            <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
              Vendors
            </p>
            {filteredVendors.map((v) => (
              <button
                key={v.id}
                onClick={() => go(`/vendors/${v.slug}`)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-ink-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[11px] font-extrabold text-emerald-600">
                  {v.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold text-ink-700">{v.name}</span>
                  <span className="block text-[10px] text-ink-400">
                    {v.area}, {v.city} · ★ {v.rating}
                  </span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-ink-300" />
              </button>
            ))}
          </>
        )}

        {filteredCategories.length > 0 && (
          <>
            <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
              Categories
            </p>
            {filteredCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => go(`/categories/${c.slug}`)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-ink-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  {c.name.charAt(0)}
                </span>
                <span className="flex-1 text-[12.5px] font-semibold text-ink-700">{c.name}</span>
                <span className="text-[10px] text-ink-400">{c.services} services</span>
              </button>
            ))}
          </>
        )}

        {q &&
          filteredLinks.length === 0 &&
          filteredServices.length === 0 &&
          filteredVendors.length === 0 &&
          filteredCategories.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-[13px] font-semibold text-ink-700">No results for “{query}”</p>
              <p className="mt-1 text-xs text-ink-400">Try a service name, category, vendor or page.</p>
            </div>
          )}

        {q === '' && (
          <div className="mt-2 flex items-center justify-between border-t border-ink-100 px-3 py-3 text-[10px] text-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <Kbd>↵</Kbd> to open
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd>⌘</Kbd> <Kbd>K</Kbd> anywhere
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function SearchTrigger({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-9 items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 text-left text-[12px] text-ink-400 transition hover:border-ink-300 hover:bg-ink-50',
        className,
      )}
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search Servora…</span>
      <Kbd className="ml-auto hidden sm:inline-flex">⌘K</Kbd>
    </button>
  );
}
