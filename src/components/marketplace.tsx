import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AirVent,
  ArrowRight,
  BadgeCheck,
  Bug,
  Camera,
  Clock,
  Dumbbell,
  GraduationCap,
  Heart,
  ImageIcon,
  Leaf,
  MapPin,
  PawPrint,
  Scissors,
  Sparkles,
  Star,
  Truck,
  Wrench,
  Zap,
} from 'lucide-react';
import { cn, inr, minsToLabel, toneSoft } from '@/lib/utils';
import { distanceToVendor, formatKm } from '@/lib/geo';
import type { Category, Review, Service, Vendor } from '@/lib/types';
import { useApp } from '@/store/app';
import { useLocation } from '@/store/location';
import { Badge, Card, RatingStars, Avatar } from './ui/primitives';

/* -------------------------------- Brand mark ------------------------------- */

export function Logo({ dark, className, to = '/' }: { dark?: boolean; className?: string; to?: string }) {
  return (
    <Link to={to} className={cn('group inline-flex items-center gap-2.5', className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-[11px] bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 shadow-[0_8px_20px_-6px_rgba(79,70,229,.55)] transition-transform group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
          <path d="M11.3 2.2a.75.75 0 0 1 1.4 0l1.9 5.2 5.2 1.9a.75.75 0 0 1 0 1.4l-5.2 1.9-1.9 5.2a.75.75 0 0 1-1.4 0l-1.9-5.2-5.2-1.9a.75.75 0 0 1 0-1.4l5.2-1.9 1.9-5.2Z" />
        </svg>
      </span>
      <span className={cn('font-display text-[21px] font-extrabold tracking-[-0.03em]', dark ? 'text-white' : 'text-ink-900')}>
        servora<span className="text-brand-500">.</span>
      </span>
    </Link>
  );
}

/* -------------------------------- Category icon ---------------------------- */

const categoryIcons: Record<string, typeof Sparkles> = {
  Sparkles,
  Wrench,
  Zap,
  AirVent,
  Scissors,
  Camera,
  Leaf,
  Truck,
  GraduationCap,
  PawPrint,
  Dumbbell,
  Bug,
};

export const toneGradient: Record<string, string> = {
  emerald: 'from-emerald-100 via-emerald-50 to-teal-50 text-emerald-600',
  sky: 'from-sky-100 via-sky-50 to-blue-50 text-sky-600',
  amber: 'from-amber-100 via-amber-50 to-orange-50 text-amber-600',
  teal: 'from-teal-100 via-teal-50 to-cyan-50 text-teal-600',
  violet: 'from-violet-100 via-violet-50 to-purple-50 text-violet-600',
  warning: 'from-amber-100 via-orange-50 to-yellow-50 text-amber-600',
  brand: 'from-brand-100 via-brand-50 to-indigo-50 text-brand-600',
  neutral: 'from-slate-100 via-ink-50 to-ink-100 text-ink-500',
  info: 'from-sky-100 via-sky-50 to-blue-50 text-sky-600',
  success: 'from-emerald-100 via-emerald-50 to-teal-50 text-emerald-600',
  danger: 'from-rose-100 via-rose-50 to-pink-50 text-rose-600',
};

export function CategoryIcon({
  name,
  className,
  tone = 'brand',
}: {
  name: string;
  className?: string;
  tone?: string;
}) {
  const Icon = categoryIcons[name] ?? Sparkles;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-xl bg-gradient-to-br',
        toneGradient[tone] ?? toneGradient.brand,
        className,
      )}
    >
      <Icon className="h-1/2 w-1/2" />
    </span>
  );
}

/* --------------------------------- SmartImage ------------------------------ */

export function SmartImage({
  src,
  alt,
  className,
  imgClassName,
  icon,
  tone = 'brand',
  children,
}: {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  icon?: ReactNode;
  tone?: string;
  children?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn('relative overflow-hidden bg-ink-100', className)}>
      {!failed && src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover transition duration-700', imgClassName)}
        />
      ) : (
        <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', toneGradient[tone])}>
          <span className="opacity-70">{icon ?? <ImageIcon className="h-10 w-10" />}</span>
        </div>
      )}
      {children}
    </div>
  );
}

/* ------------------------------- SectionHeading ---------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
        <h2 className="font-display text-[24px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-[30px]">
          {title}
        </h2>
        {description && <p className="mt-2 text-[13.5px] leading-6 text-ink-500 sm:text-sm">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* -------------------------------- FavoriteBtn ------------------------------ */

function FavoriteButton({
  active,
  onClick,
  className,
}: {
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }}
      aria-label="Save"
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-ink-900/5 backdrop-blur transition hover:scale-105',
        className,
      )}
    >
      <Heart className={cn('h-4 w-4 transition', active ? 'fill-rose-500 text-rose-500' : 'text-ink-400')} />
    </button>
  );
}

/* -------------------------------- CategoryCard ----------------------------- */

export function CategoryCard({ category, className }: { category: Category; className?: string }) {
  return (
    <Link to={`/categories/${category.slug}`} className={cn('group block', className)}>
      <Card hover className="relative overflow-hidden">
        <SmartImage src={category.image} alt={category.name} className="aspect-[16/10] w-full" tone={category.tone}>
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/10 to-transparent" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-bold text-ink-700 backdrop-blur">
            {category.vendors} pros
          </span>
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-[15px] font-bold text-white">{category.name}</p>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-white/75">{category.short}</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition group-hover:bg-white group-hover:text-ink-900">
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </SmartImage>
        <div className="flex items-center justify-between px-3.5 py-3">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-500">
            <CategoryIcon name={category.icon} tone={category.tone} className="h-5 w-5 rounded-md" />
            {category.services} services
          </span>
          <span className="text-[11.5px] font-semibold text-ink-800">
            from <span className="font-bold">{inr(category.from)}</span>
          </span>
        </div>
      </Card>
    </Link>
  );
}

/* --------------------------------- ServiceCard ----------------------------- */

export function ServiceCard({
  service,
  vendor,
  className,
  compact,
}: {
  service: Service;
  vendor?: Vendor;
  className?: string;
  compact?: boolean;
}) {
  const { serviceFavorites, toggleServiceFavorite } = useApp();
  const isFav = serviceFavorites.includes(service.id);
  const v = vendor;
  return (
    <Link to={`/services/${service.slug}`} className={cn('group block h-full', className)}>
      <Card hover className="flex h-full flex-col overflow-hidden">
        <SmartImage src={service.image} alt={service.name} className="aspect-[16/10] w-full" tone="brand">
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/25 to-transparent opacity-0 transition group-hover:opacity-100" />
          {service.discount ? (
            <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[10.5px] font-bold text-white shadow-sm">
              {service.discount}% OFF
            </span>
          ) : service.featured ? (
            <span className="absolute left-3 top-3 rounded-full bg-ink-900/80 px-2.5 py-1 text-[10.5px] font-bold text-white backdrop-blur">
              Bestseller
            </span>
          ) : null}
          <FavoriteButton
            active={isFav}
            onClick={() => toggleServiceFavorite(service.id)}
            className="absolute right-3 top-3"
          />
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-md bg-ink-950/55 px-2 py-1 text-[10.5px] font-semibold text-white backdrop-blur">
            <Clock className="h-3 w-3" /> {minsToLabel(service.duration)}
          </span>
          {service.availableToday && (
            <span className="absolute bottom-3 right-3 rounded-md bg-white/95 px-2 py-1 text-[10.5px] font-bold text-emerald-700 backdrop-blur">
              Available today
            </span>
          )}
        </SmartImage>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center gap-1.5">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand-600" />
            <span className="truncate text-[11px] font-semibold text-ink-500">
              {v?.name ?? 'Verified vendor'}
            </span>
            {v?.verified && (
              <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                Verified
              </span>
            )}
          </div>
          <h3 className="mt-2 line-clamp-2 text-[14.5px] font-bold leading-snug text-ink-900 transition group-hover:text-brand-700">
            {service.name}
          </h3>
          {!compact && (
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-ink-500">{service.description}</p>
          )}
          <div className="mt-2.5 flex items-center gap-2">
            <RatingStars value={service.rating} size={12} showValue />
            <span className="text-[11px] text-ink-400">({service.reviewCount})</span>
            {v && (
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-ink-400">
                <MapPin className="h-3 w-3" /> {v.area}
              </span>
            )}
          </div>
          <div className="mt-3.5 flex items-end justify-between border-t border-ink-100 pt-3">
            <div>
              <span className="text-[10.5px] text-ink-400">Starting at</span>
              <p className="text-[16px] font-extrabold text-ink-900">
                {inr(service.price)}
                <span className="ml-0.5 text-[10.5px] font-semibold text-ink-400">
                  {service.priceType === 'hourly' ? '/hr' : service.priceType === 'session' ? '/session' : ''}
                </span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-brand-600 transition group-hover:gap-2">
              Book now <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* --------------------------------- VendorCard ------------------------------ */

export function VendorCard({ vendor, className }: { vendor: Vendor; className?: string }) {
  const { vendorFavorites, toggleVendorFavorite } = useApp();
  const liveLocation = useLocation((s) => s.location);
  const isFav = vendorFavorites.includes(vendor.id);
  const distance = distanceToVendor(liveLocation, vendor);
  return (
    <Link to={`/vendors/${vendor.slug}`} className={cn('group block h-full', className)}>
      <Card hover className="flex h-full flex-col overflow-hidden">
        <SmartImage src={vendor.cover} alt={vendor.name} className="aspect-[16/9] w-full" tone="brand">
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/30 to-transparent" />
          <FavoriteButton
            active={isFav}
            onClick={() => toggleVendorFavorite(vendor.id)}
            className="absolute right-3 top-3"
          />
          {vendor.featured && (
            <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[10.5px] font-bold text-amber-950 shadow-sm">
              ★ Featured
            </span>
          )}
        </SmartImage>
        <div className="relative flex flex-1 flex-col px-4 pb-4">
          <div className="-mt-6 mb-2.5 flex items-end justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border-[3px] border-white bg-gradient-to-br from-brand-500 to-brand-700 text-[15px] font-extrabold text-white shadow-sm">
              {vendor.name.charAt(0)}
            </span>
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10.5px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          </div>
          <h3 className="text-[15px] font-bold leading-snug text-ink-900 transition group-hover:text-brand-700">
            {vendor.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-ink-500">{vendor.tagline}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <RatingStars value={vendor.rating} size={12} showValue />
            <span className="text-[11px] text-ink-400">({vendor.reviewCount} reviews)</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-ink-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-ink-400" /> {vendor.area}, {vendor.city}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-ink-400" /> Responds in {vendor.responseTime}
            </span>
            {distance != null && (
              <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
                <MapPin className="h-3.5 w-3.5" /> {formatKm(distance)} away
              </span>
            )}
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3">
            <div>
              <span className="text-[10.5px] text-ink-400">Services from</span>
              <p className="text-[15px] font-extrabold text-ink-900">{inr(vendor.priceFrom)}</p>
            </div>
            <span className="text-[11.5px] font-bold text-brand-600">{vendor.jobsDone.toLocaleString('en-IN')}+ jobs done</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* --------------------------------- ReviewCard ------------------------------ */

export function ReviewCard({ review, compact }: { review: Review; compact?: boolean }) {
  return (
    <div className={cn('rounded-2xl border border-ink-200/80 bg-white', compact ? 'p-4' : 'p-5')}>
      <div className="flex items-start gap-3">
        <Avatar name={review.customer} size="sm" tone="neutral" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-bold text-ink-900">{review.customer}</p>
            {review.verified && (
              <Badge tone="success" size="sm">
                Verified booking
              </Badge>
            )}
            <span className="ml-auto text-[11px] text-ink-400">{review.date}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <RatingStars value={review.rating} size={13} showValue={false} />
            <p className="text-[13px] font-semibold text-ink-800">{review.title}</p>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-6 text-ink-600">{review.text}</p>
          {review.reply && (
            <div className="mt-3 rounded-xl border-l-2 border-brand-300 bg-brand-50/50 px-3.5 py-2.5">
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-brand-700">Vendor reply</p>
              <p className="mt-1 text-[12px] leading-5 text-ink-600">{review.reply}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- TrustStrip -------------------------------- */

export function TrustStrip({ className }: { className?: string }) {
  const items = [
    { icon: BadgeCheck, title: 'Verified professionals', desc: 'ID & background checked' },
    { icon: Star, title: '4.9 average rating', desc: 'Across 12,400+ reviews' },
    { icon: Clock, title: 'On-time promise', desc: 'Or your slot is free' },
    { icon: Heart, title: 'Happiness guaranteed', desc: 'Free re-clean within 48 hrs' },
  ];
  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>
      {items.map((item) => (
        <div key={item.title} className="flex items-center gap-3 rounded-xl border border-ink-200/70 bg-white/80 px-3.5 py-3 backdrop-blur">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <item.icon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-bold text-ink-900">{item.title}</p>
            <p className="truncate text-[10.5px] text-ink-400">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- MapView --------------------------------- */

export function MapPlaceholder({
  vendors,
  className,
  onSelect,
}: {
  vendors: Vendor[];
  className?: string;
  onSelect?: (v: Vendor) => void;
}) {
  const positions = [
    { top: '22%', left: '30%' },
    { top: '38%', left: '62%' },
    { top: '58%', left: '24%' },
    { top: '68%', left: '58%' },
    { top: '30%', left: '80%' },
    { top: '72%', left: '84%' },
  ];
  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-ink-200 bg-[#eef2f7]', className)}>
      <div className="absolute inset-0 bg-grid-slate bg-grid opacity-70" />
      <div className="absolute inset-0">
        <div className="absolute left-[-10%] top-[45%] h-3 w-[130%] -rotate-6 rounded-full bg-white/90 shadow-[0_1px_0_rgba(148,163,184,.35)]" />
        <div className="absolute left-[35%] top-[-10%] h-[130%] w-4 rotate-12 rounded-full bg-white/80" />
        <div className="absolute left-[72%] top-[-10%] h-[130%] w-2.5 -rotate-3 rounded-full bg-white/70" />
        <div className="absolute left-[-5%] top-[72%] h-2 w-[120%] rotate-3 rounded-full bg-white/60" />
        <div className="absolute left-[12%] top-[20%] h-16 w-24 rounded-lg bg-emerald-100/70" />
        <div className="absolute left-[58%] top-[12%] h-20 w-28 rounded-lg bg-sky-100/60" />
        <div className="absolute left-[20%] top-[58%] h-20 w-24 rounded-lg bg-amber-50/80" />
      </div>
      {vendors.slice(0, 6).map((v, i) => (
        <button
          key={v.id}
          onClick={() => onSelect?.(v)}
          style={positions[i % positions.length]}
          className="group absolute -translate-x-1/2 -translate-y-1/2"
        >
          <span className="flex flex-col items-center">
            <span className="flex items-center gap-1.5 rounded-full bg-ink-900 px-2.5 py-1 text-[10.5px] font-bold text-white shadow-lg transition group-hover:scale-105 group-hover:bg-brand-600">
              ★ {v.rating} · {v.name.split(' ')[0]}
            </span>
            <span className="mt-1 h-2 w-2 rounded-full bg-ink-900 ring-4 ring-ink-900/15" />
          </span>
        </button>
      ))}
      <div className="absolute bottom-3 left-3 flex overflow-hidden rounded-lg border border-ink-200 bg-white shadow-sm">
        <button className="px-2.5 py-1.5 text-sm font-bold text-ink-600 hover:bg-ink-50">+</button>
        <span className="w-px bg-ink-200" />
        <button className="px-2.5 py-1.5 text-sm font-bold text-ink-600 hover:bg-ink-50">−</button>
      </div>
      <button className="absolute bottom-3 right-3 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-ink-700 shadow-sm ring-1 ring-ink-200 hover:bg-ink-50">
        Search this area
      </button>
      <div className="absolute left-3 top-3 rounded-lg bg-white/90 px-2.5 py-1.5 text-[10.5px] font-semibold text-ink-500 backdrop-blur">
        {vendors.length} vendors in this area
      </div>
    </div>
  );
}

/* ------------------------------ Price breakdown ---------------------------- */

export function PriceLine({
  label,
  value,
  tone,
  bold,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: 'success' | 'muted';
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-1.5 text-[12.5px]', className)}>
      <span className={cn('text-ink-500', bold && 'font-semibold text-ink-800')}>{label}</span>
      <span
        className={cn(
          'font-semibold text-ink-800',
          tone === 'success' && 'text-emerald-600',
          tone === 'muted' && 'text-ink-400',
          bold && 'text-[15px] font-extrabold text-ink-900',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* --------------------------------- Pills ----------------------------------- */

export function TonePill({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold ring-1 ring-inset ring-transparent', toneSoft[tone])}>
      {children}
    </span>
  );
}
