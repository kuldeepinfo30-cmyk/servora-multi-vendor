import { type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Download, Search, TrendingUp } from 'lucide-react';
import { cn, downloadFile, getStatus, num } from '@/lib/utils';
import { Badge, Button, Card, Input, Skeleton } from './primitives';

/* -------------------------------- PageHeader ------------------------------- */

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  breadcrumb,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-[11.5px] font-medium text-ink-400">
          {breadcrumb.map((b, i) => (
            <span key={`${b.label}-${i}`} className="inline-flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 text-ink-300" />}
              {b.href ? (
                <a href={b.href} className="transition hover:text-brand-600">
                  {b.label}
                </a>
              ) : (
                <span className="text-ink-600">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <div className="mb-2">{eyebrow}</div>}
          <h1 className="font-display text-[22px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-[26px]">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-[13.5px] leading-6 text-ink-500">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/* --------------------------------- StatCard -------------------------------- */

const statTones: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-rose-50 text-rose-600',
  info: 'bg-sky-50 text-sky-600',
  violet: 'bg-violet-50 text-violet-600',
  teal: 'bg-teal-50 text-teal-600',
  neutral: 'bg-ink-100 text-ink-600',
};

function Sparkline({ data, tone = '#4f46e5' }: { data: number[]; tone?: string }) {
  if (!data?.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${32 - ((v - min) / span) * 28}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 32" className="h-8 w-20 overflow-visible" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon,
  tone = 'brand',
  footnote,
  spark,
  sparkColor,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: number;
  icon?: ReactNode;
  tone?: string;
  footnote?: ReactNode;
  spark?: number[];
  sparkColor?: string;
  className?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-ink-500">{label}</p>
          <p className="mt-1.5 font-display text-[26px] font-extrabold leading-none tracking-tight text-ink-900">
            {value}
          </p>
        </div>
        {icon && (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', statTones[tone] ?? statTones.brand)}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3.5 flex items-end justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {delta !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold',
                up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600',
              )}
            >
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {footnote && <span className="text-ink-400">{footnote}</span>}
        </div>
        {spark && <Sparkline data={spark} tone={sparkColor} />}
      </div>
    </Card>
  );
}

/* ------------------------------- SectionCard ------------------------------- */

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  noPadding,
  icon,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            {icon && (
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                {icon}
              </span>
            )}
            <div>
              {title && <h3 className="text-[14px] font-bold text-ink-900">{title}</h3>}
              {description && <p className="mt-0.5 text-xs leading-5 text-ink-500">{description}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn(noPadding ? '' : 'p-5', bodyClassName)}>{children}</div>
    </Card>
  );
}

/* ------------------------------- StatusBadge ------------------------------- */

export function StatusBadge({
  status,
  size = 'md',
  dot,
  label,
}: {
  status: string;
  size?: 'sm' | 'md';
  dot?: boolean;
  label?: string;
}) {
  const s = getStatus(status);
  return (
    <Badge tone={s.tone} size={size} dot={dot ?? true}>
      {label ?? s.label}
    </Badge>
  );
}

/* -------------------------------- DataTable -------------------------------- */

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  loading,
  className,
  dense,
  footer,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  loading?: boolean;
  className?: string;
  dense?: boolean;
  footer?: ReactNode;
}) {
  return (
    <div className={cn('w-full overflow-hidden', className)}>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink-200/80 bg-ink-50/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-400',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-ink-100">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-4">
                        <Skeleton className="h-4 w-full max-w-[140px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, index) => (
                  <tr
                    key={rowKey(row, index)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'border-b border-ink-100 last:border-0',
                      onRowClick && 'cursor-pointer table-row-hover',
                      !onRowClick && 'transition-colors hover:bg-ink-50/50',
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 align-middle text-[13px] text-ink-600',
                          dense ? 'py-2.5' : 'py-3.5',
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                          col.className,
                        )}
                      >
                        {col.render ? col.render(row, index) : ((row as Record<string, unknown>)[col.key] as ReactNode)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 && (
        <div className="px-4 py-10">{empty ?? <p className="text-center text-sm text-ink-400">No records found.</p>}</div>
      )}
      {footer}
    </div>
  );
}

/* -------------------------------- Pagination ------------------------------- */

export function Pagination({
  page,
  pageCount,
  total,
  perPage,
  onChange,
  className,
}: {
  page: number;
  pageCount: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(total, page * perPage);
  const pages = Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
    if (pageCount <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= pageCount - 2) return pageCount - 4 + i;
    return page - 2 + i;
  });
  return (
    <div className={cn('flex flex-col items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 sm:flex-row', className)}>
      <p className="text-[11.5px] text-ink-400">
        Showing <span className="font-semibold text-ink-600">{start}–{end}</span> of{' '}
        <span className="font-semibold text-ink-600">{num(total)}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 transition hover:bg-ink-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              'h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition',
              p === page ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-100',
            )}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 transition hover:bg-ink-50 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- Timeline -------------------------------- */

export interface TimelineItem {
  title: string;
  description?: string;
  time?: string;
  done?: boolean;
  current?: boolean;
  tone?: string;
  icon?: ReactNode;
}

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn('relative', className)}>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <li key={item.title + i} className="relative flex gap-3.5 pb-6 last:pb-0">
            {!last && (
              <span
                className={cn(
                  'absolute left-[13px] top-7 h-[calc(100%-16px)] w-px',
                  item.done ? 'bg-brand-200' : 'bg-ink-200',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 mt-0.5 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border-2 text-[10px]',
                item.current
                  ? 'border-brand-500 bg-brand-600 text-white shadow-[0_0_0_4px_rgba(99,102,241,.13)]'
                  : item.done
                    ? 'border-brand-200 bg-brand-50 text-brand-600'
                    : 'border-ink-200 bg-white text-ink-300',
              )}
            >
              {item.icon ?? (item.done ? '✓' : i + 1)}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p
                  className={cn(
                    'text-[13px] font-semibold',
                    item.current ? 'text-ink-900' : item.done ? 'text-ink-700' : 'text-ink-400',
                  )}
                >
                  {item.title}
                </p>
                {item.time && <span className="text-[11px] text-ink-400">{item.time}</span>}
              </div>
              {item.description && <p className="mt-1 text-xs leading-5 text-ink-500">{item.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* -------------------------------- InfoRows --------------------------------- */

export function InfoRow({
  label,
  value,
  className,
  mono,
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-2.5', className)}>
      <span className="text-[12.5px] text-ink-500">{label}</span>
      <span className={cn('text-right text-[12.5px] font-semibold text-ink-800', mono && 'font-mono text-[11.5px]')}>
        {value}
      </span>
    </div>
  );
}

/* ------------------------------- SearchField ------------------------------- */

export function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-10 pr-3 text-[13px] text-ink-800 placeholder:text-ink-400 transition hover:border-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
      />
    </div>
  );
}

/* ------------------------------- ExportButton ------------------------------ */

export function ExportButton({
  filename,
  rows,
  columns,
  label = 'Export CSV',
  size = 'sm',
}: {
  filename: string;
  rows: Record<string, unknown>[];
  columns: { key: string; label: string }[];
  label?: string;
  size?: 'sm' | 'md';
}) {
  const onClick = () => {
    const header = columns.map((c) => `"${c.label}"`).join(',');
    const body = rows
      .map((r) => columns.map((c) => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    downloadFile(filename, `${header}\n${body}`, 'text/csv;charset=utf-8;');
  };
  return (
    <Button variant="outline" size={size} iconLeft={<Download className="h-4 w-4" />} onClick={onClick}>
      {label}
    </Button>
  );
}

/* --------------------------------- DateRange ------------------------------- */

export function DateRangeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-xs font-semibold text-ink-600 focus:border-brand-400 focus:outline-none"
    >
      <option value="7">Last 7 days</option>
      <option value="30">Last 30 days</option>
      <option value="90">Last 90 days</option>
      <option value="365">This year</option>
      <option value="custom">Custom range</option>
    </select>
  );
}

/* --------------------------------- Metrics -------------------------------- */

export function MetricRow({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="flex items-center gap-2 text-[12.5px] text-ink-500">
        <span className={cn('h-2 w-2 rounded-full', tone === 'brand' ? 'bg-brand-500' : tone === 'success' ? 'bg-emerald-500' : tone === 'warning' ? 'bg-amber-500' : tone === 'danger' ? 'bg-rose-500' : 'bg-ink-300')} />
        {label}
      </span>
      <span className="text-[12.5px] font-bold text-ink-800">{value}</span>
    </div>
  );
}

export function TrendPill({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold',
        up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600',
      )}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function GrowthIcon() {
  return <TrendingUp className="h-4 w-4" />;
}
