import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Loader2, Star, Check } from 'lucide-react';
import { cn, initials, initialsTone, toneSoft, toneSolid } from '@/lib/utils';
import type { Tone } from '@/lib/types';

/* ---------------------------------- Button --------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'soft' | 'danger' | 'success' | 'dark';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 active:bg-brand-800',
  secondary: 'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950',
  outline: 'border border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20',
  dark: 'bg-ink-900 text-white hover:bg-ink-800',
};

const buttonSizes: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  sm: 'h-9 px-3.5 text-[13px] rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-[15px] rounded-xl gap-2',
  icon: 'h-10 w-10 rounded-xl',
  'icon-sm': 'h-8 w-8 rounded-lg',
};

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    'inline-flex select-none items-center justify-center font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, loading, iconLeft, iconRight, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : iconLeft}
      {children}
      {iconRight}
    </button>
  ),
);
Button.displayName = 'Button';

/* ---------------------------------- Badge ---------------------------------- */

export function Badge({
  children,
  tone = 'neutral',
  variant = 'soft',
  dot,
  size = 'md',
  className,
  icon,
}: {
  children: ReactNode;
  tone?: Tone | string;
  variant?: 'soft' | 'solid' | 'outline';
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  icon?: ReactNode;
}) {
  const toneClass =
    variant === 'solid'
      ? toneSolid[tone] ?? 'bg-ink-700 text-white'
      : variant === 'outline'
        ? 'border border-ink-200 bg-transparent text-ink-600'
        : toneSoft[tone] ?? 'bg-ink-100 text-ink-600';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ring-transparent',
        variant === 'soft' && 'ring-1',
        size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[11.5px]',
        toneClass,
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'solid' ? 'bg-white/90' : 'bg-current opacity-70',
          )}
        />
      )}
      {icon}
      {children}
    </span>
  );
}

/* ---------------------------------- Card ----------------------------------- */

export function Card({
  children,
  className,
  hover,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ink-200/80 bg-white shadow-card',
        hover && 'transition-all duration-300 hover:-translate-y-0.5 hover:border-ink-300/70 hover:shadow-[0_20px_45px_-24px_rgba(15,23,42,.28)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ---------------------------------- Input ---------------------------------- */

interface FieldWrapProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, error, required, htmlFor, children, className }: FieldWrapProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="field-label">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="field-error">
          <span className="inline-block h-1 w-1 rounded-full bg-rose-500" />
          {error}
        </p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  );
}

const controlBase =
  'w-full rounded-xl border bg-white text-sm text-ink-800 placeholder:text-ink-400 transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400';

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label?: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    icon?: ReactNode;
    suffix?: ReactNode;
    containerClassName?: string;
  }
>(({ label, hint, error, icon, suffix, className, containerClassName, required, id, ...props }, ref) => {
  const inputId = id || props.name;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={containerClassName}>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            controlBase,
            'h-11 px-3.5',
            icon && 'pl-10',
            suffix && 'pr-11',
            error
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
              : 'border-ink-200 hover:border-ink-300 focus:border-brand-400 focus:ring-brand-500/10',
            className,
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">{suffix}</span>
        )}
      </div>
    </Field>
  );
});
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    containerClassName?: string;
  }
>(({ label, hint, error, className, containerClassName, required, id, ...props }, ref) => {
  const inputId = id || props.name;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={containerClassName}>
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          controlBase,
          'min-h-[104px] resize-y px-3.5 py-3',
          error
            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
            : 'border-ink-200 hover:border-ink-300 focus:border-brand-400 focus:ring-brand-500/10',
          className,
        )}
        {...props}
      />
    </Field>
  );
});
Textarea.displayName = 'Textarea';

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & {
    label?: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    containerClassName?: string;
  }
>(({ label, hint, error, className, containerClassName, required, id, children, ...props }, ref) => {
  const inputId = id || props.name;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={containerClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          className={cn(
            controlBase,
            'h-11 appearance-none px-3.5 pr-10',
            error
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
              : 'border-ink-200 hover:border-ink-300 focus:border-brand-400 focus:ring-brand-500/10',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Field>
  );
});
Select.displayName = 'Select';

/* ------------------------------- Checkbox ---------------------------------- */

export function Checkbox({
  label,
  description,
  checked,
  onChange,
  className,
  id,
}: {
  label?: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  id?: string;
}) {
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-2.5', className)}>
      <span className="relative mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-[5px] border border-ink-300 bg-white transition checked:border-brand-600 checked:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500/40"
        />
        <Check className="pointer-events-none absolute h-3 w-3 scale-0 text-white opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100" strokeWidth={3} />
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-[13.5px] font-medium leading-5 text-ink-700">{label}</span>}
          {description && <span className="mt-0.5 block text-xs leading-5 text-ink-500">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-semibold text-ink-800">{label}</p>}
          {description && <p className="mt-0.5 text-xs leading-5 text-ink-500">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
          checked ? 'bg-brand-600' : 'bg-ink-200',
        )}
      >
        <span
          className={cn(
            'inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-[3px]',
          )}
        />
      </button>
    </div>
  );
}

/* --------------------------------- Avatar ---------------------------------- */

export function Avatar({
  name,
  size = 'md',
  tone = 'brand',
  src,
  online,
  className,
  ring,
}: {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  tone?: Tone | string;
  src?: string;
  online?: boolean;
  className?: string;
  ring?: boolean;
}) {
  const sizes = {
    xs: 'h-6 w-6 text-[9px]',
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-12 w-12 text-sm',
    xl: 'h-16 w-16 text-lg',
    '2xl': 'h-20 w-20 text-xl',
  };
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn('rounded-full object-cover', sizes[size], ring && 'ring-2 ring-white')}
        />
      ) : (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full font-bold tracking-wide',
            sizes[size],
            initialsTone[tone] ?? initialsTone.brand,
            ring && 'ring-2 ring-white',
          )}
        >
          {initials(name)}
        </span>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white',
            online ? 'bg-emerald-500' : 'bg-ink-300',
          )}
        />
      )}
    </span>
  );
}

/* --------------------------------- Rating ---------------------------------- */

export function RatingStars({
  value,
  count,
  size = 14,
  showValue = true,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={cn(
              i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-ink-200 text-ink-200',
            )}
          />
        ))}
      </span>
      {showValue && <span className="text-[13px] font-bold text-ink-800">{value.toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-ink-400">({count})</span>}
    </span>
  );
}

export function RatingInput({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          className="rounded-md p-0.5 transition hover:scale-110"
        >
          <Star
            width={size}
            height={size}
            className={i <= value ? 'fill-amber-400 text-amber-400' : 'fill-ink-100 text-ink-200'}
          />
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- Progress -------------------------------- */

export function Progress({
  value,
  tone = 'brand',
  className,
  size = 'md',
}: {
  value: number;
  tone?: Tone | string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const bars: Record<string, string> = {
    brand: 'bg-brand-600',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    violet: 'bg-violet-500',
    teal: 'bg-teal-500',
    neutral: 'bg-ink-400',
    amber: 'bg-amber-500',
  };
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-ink-100', size === 'sm' ? 'h-1.5' : 'h-2', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', bars[tone] ?? bars.brand)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ------------------------------- Skeleton ---------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />;
}

/* ------------------------------- EmptyState -------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 text-center',
        compact ? 'px-6 py-10' : 'px-8 py-16',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink-400 shadow-soft ring-1 ring-ink-100">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-bold text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-6 text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------------------------- Tabs ----------------------------------- */

export function Tabs({
  items,
  value,
  onChange,
  variant = 'pill',
  className,
}: {
  items: { key: string; label: string; count?: number }[];
  value: string;
  onChange: (key: string) => void;
  variant?: 'pill' | 'underline';
  className?: string;
}) {
  if (variant === 'underline') {
    return (
      <div className={cn('flex gap-1 overflow-x-auto border-b border-ink-200 no-scrollbar', className)}>
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 px-4 py-3 text-[13px] font-semibold transition',
              value === item.key ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10.5px] font-bold',
                  value === item.key ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500',
                )}
              >
                {item.count}
              </span>
            )}
            {value === item.key && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600" />
            )}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className={cn('flex gap-1 overflow-x-auto rounded-xl bg-ink-100/80 p-1 no-scrollbar', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition',
            value === item.key
              ? 'bg-white text-ink-900 shadow-soft'
              : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span className="rounded-full bg-ink-100 px-1.5 text-[10px] font-bold text-ink-500">
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Segmented({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: { value: string; label: ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="inline-flex rounded-lg border border-ink-200 bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-[7px] font-semibold transition',
            size === 'sm' ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-1.5 text-xs',
            value === o.value ? 'bg-ink-900 text-white' : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({
  children,
  active,
  onClick,
  icon,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
        active
          ? 'border-brand-200 bg-brand-50 text-brand-700'
          : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:bg-ink-50',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function Divider({ className, label }: { className?: string; label?: string }) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <span className="h-px flex-1 bg-ink-200" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</span>
        <span className="h-px flex-1 bg-ink-200" />
      </div>
    );
  }
  return <div className={cn('h-px w-full bg-ink-200', className)} />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-ink-200 bg-ink-50 px-1.5 font-sans text-[10px] font-semibold text-ink-500">
      {children}
    </kbd>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-600', className)} />;
}
