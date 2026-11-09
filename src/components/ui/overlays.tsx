import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertTriangle, Info, XCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/store/toast';
import { Button } from './primitives';

/* --------------------------------- Modal ---------------------------------- */

const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  icon,
  bodyClassName,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof modalSizes;
  icon?: ReactNode;
  bodyClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-ink-950/45 backdrop-blur-[3px] animate-fade-in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-float animate-scale-in',
          modalSizes[size],
        )}
      >
        {(title || description) && (
          <div className="flex items-start gap-3 border-b border-ink-100 px-6 py-5">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && <h2 className="text-base font-bold text-ink-900">{title}</h2>}
              {description && <p className="mt-1 text-[13px] leading-5 text-ink-500">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="-mr-1 rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
              aria-label="Close dialog"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
        <div className={cn('flex-1 overflow-y-auto px-6 py-5', bodyClassName)}>{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-ink-100 bg-ink-50/60 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* --------------------------------- Drawer --------------------------------- */

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-xl',
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-float animate-slide-in',
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
          <div>
            {title && <h2 className="text-base font-bold text-ink-900">{title}</h2>}
            {description && <p className="mt-1 text-[13px] text-ink-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-ink-100 bg-ink-50/60 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------- Dropdown -------------------------------- */

export function Dropdown({
  trigger,
  children,
  align = 'right',
  className,
  panelClassName,
}: {
  trigger: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: 'left' | 'right';
  className?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[200px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-ink-100 bg-white p-1.5 shadow-float animate-scale-in',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  icon,
  danger,
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition',
        danger
          ? 'text-rose-600 hover:bg-rose-50'
          : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/* ----------------------------- Confirm dialog ----------------------------- */

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary' | 'success';
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      icon={<AlertTriangle className="h-5 w-5" />}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={tone} size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-ink-600">
        This action will be recorded in the audit log. You can contact support if you need to undo it.
      </p>
    </Modal>
  );
}

/* --------------------------------- Toaster -------------------------------- */

const toastMeta = {
  success: { icon: CheckCircle2, class: 'text-emerald-500', ring: 'ring-emerald-100' },
  error: { icon: XCircle, class: 'text-rose-500', ring: 'ring-rose-100' },
  warning: { icon: AlertTriangle, class: 'text-amber-500', ring: 'ring-amber-100' },
  info: { icon: Info, class: 'text-sky-500', ring: 'ring-sky-100' },
};

export function Toaster() {
  const { toasts, dismiss } = useToast();
  if (!toasts.length) return null;
  return createPortal(
    <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2.5">
      {toasts.map((t) => {
        const meta = toastMeta[t.tone ?? 'info'];
        const Icon = meta.icon;
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-float ring-1 ring-ink-950/[0.03] animate-slide-in"
          >
            <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-4', meta.ring)}>
              <Icon className={cn('h-[18px] w-[18px]', meta.class)} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-ink-900">{t.title}</p>
              {t.message && <p className="mt-0.5 text-xs leading-5 text-ink-500">{t.message}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="rounded p-1 text-ink-300 hover:text-ink-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

/* ------------------------------- Collapsible ------------------------------ */

export function Accordion({
  items,
  className,
}: {
  items: { question: string; answer: ReactNode }[];
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className={cn('divide-y divide-ink-200/80 rounded-2xl border border-ink-200/80 bg-white', className)}>
      {items.map((item, i) => (
        <div key={item.question}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="text-[13.5px] font-semibold text-ink-800">{item.question}</span>
            <ChevronDown
              className={cn('h-4 w-4 shrink-0 text-ink-400 transition-transform', open === i && 'rotate-180')}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-[13px] leading-6 text-ink-500 animate-fade-in">{item.answer}</div>
          )}
        </div>
      ))}
    </div>
  );
}
