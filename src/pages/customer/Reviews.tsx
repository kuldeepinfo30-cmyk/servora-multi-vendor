import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Camera, CheckCircle2, MessageSquare, Pencil, Star, ThumbsUp, Trash2 } from 'lucide-react';
import { getService, getVendor, REVIEWS } from '@/lib/data';
import { fmtDate, inr } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import type { Review } from '@/lib/types';
import { Avatar, Badge, Button, buttonStyles, Card, EmptyState, Input, RatingInput, RatingStars, Skeleton, Tabs, Textarea } from '@/components/ui/primitives';
import { PageHeader, SectionCard, StatCard } from '@/components/ui/data-display';
import { ConfirmDialog, Modal } from '@/components/ui/overlays';

interface Draft {
  rating: number;
  title: string;
  text: string;
  bookingId?: string;
  serviceId?: string;
  vendorId?: string;
}

const emptyDraft: Draft = { rating: 0, title: '', text: '' };

export default function CustomerReviews() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const loading = useMockLoad(380);
  const bookings = useApp((s) => s.bookings);

  const [myReviews, setMyReviews] = useState<Review[]>(
    REVIEWS.filter((r) => r.customer === (user?.name ?? 'Aarav Mehta')),
  );
  const [written, setWritten] = useState<string[]>(myReviews.map((r) => r.serviceId));
  const [tab, setTab] = useState<'pending' | 'published'>('pending');
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const completed = useMemo(
    () => bookings.filter((b) => b.customerId === (user?.id ?? 'u1') && b.status === 'completed'),
    [bookings, user?.id],
  );
  const pending = completed.filter((b) => !written.includes(b.serviceId));

  useEffect(() => {
    const bookingId = params.get('booking');
    if (!bookingId) return;
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    setDraft({ ...emptyDraft, bookingId: booking.id, serviceId: booking.serviceId, vendorId: booking.vendorId });
    setOpen(true);
  }, [params, bookings]);

  const openForBooking = (bookingId: string, serviceId: string, vendorId: string) => {
    setDraft({ ...emptyDraft, bookingId, serviceId, vendorId });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (r: Review) => {
    setDraft({ rating: r.rating, title: r.title, text: r.text, serviceId: r.serviceId, vendorId: r.vendorId });
    setErrors({});
    setOpen(true);
  };

  const submit = () => {
    const errs: Record<string, string> = {};
    if (!draft.rating) errs.rating = 'Choose a star rating.';
    if (draft.title.trim().length < 4) errs.title = 'Add a short headline.';
    if (draft.text.trim().length < 20) errs.text = 'Tell us at least 20 characters about the service.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    window.setTimeout(() => {
      const isEdit = myReviews.some((r) => r.serviceId === draft.serviceId && r.id.startsWith('mine_'));
      const review: Review = {
        id: isEdit ? myReviews.find((r) => r.serviceId === draft.serviceId)!.id : `mine_${Date.now()}`,
        vendorId: draft.vendorId ?? 'v1',
        serviceId: draft.serviceId ?? 's1',
        customer: user?.name ?? 'Aarav Mehta',
        rating: draft.rating,
        title: draft.title,
        text: draft.text,
        date: new Date().toISOString().slice(0, 10),
        verified: true,
      };
      setMyReviews((prev) => (isEdit ? prev.map((r) => (r.id === review.id ? review : r)) : [review, ...prev]));
      if (!written.includes(review.serviceId)) setWritten((w) => [...w, review.serviceId]);
      setSaving(false);
      setOpen(false);
      setTab('published');
      toast.success(isEdit ? 'Review updated' : 'Review published', 'Thank you — your feedback helps the community.');
    }, 650);
  };

  const avg = myReviews.length ? myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length : 0;

  return (
    <div>
      <PageHeader
        title="My reviews"
        description="Share honest feedback, help other customers choose and keep vendors accountable."
        actions={<Link to="/services" className={buttonStyles({ variant: 'outline', size: 'md' })}>Book another service</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Reviews written" value={myReviews.length} icon={<MessageSquare className="h-5 w-5" />} tone="brand" footnote="lifetime" />
        <StatCard label="Average rating given" value={avg ? avg.toFixed(1) : '—'} icon={<Star className="h-5 w-5" />} tone="warning" footnote="out of 5" />
        <StatCard label="Awaiting review" value={pending.length} icon={<Pencil className="h-5 w-5" />} tone="info" footnote="completed services" />
        <StatCard label="Helpful votes" value={34} icon={<ThumbsUp className="h-5 w-5" />} tone="success" footnote="from the community" />
      </div>

      <div className="mt-5">
        <Tabs
          value={tab}
          onChange={(k) => setTab(k as typeof tab)}
          items={[
            { key: 'pending', label: 'Awaiting review', count: pending.length },
            { key: 'published', label: 'Published', count: myReviews.length },
          ]}
        />
      </div>

      {loading ? (
        <div className="mt-4 space-y-3"><Skeleton className="h-[150px]" /><Skeleton className="h-[150px]" /></div>
      ) : tab === 'pending' ? (
        <div className="mt-4">
          {pending.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="You’re all caught up"
              description="Every completed service has a review. Book something new to share your experience."
              action={<Link to="/services" className={buttonStyles({ size: 'sm' })}>Explore services</Link>}
            />
          ) : (
            <div className="space-y-3">
              {pending.map((b) => {
                const service = getService(b.serviceId);
                const vendor = getVendor(b.vendorId);
                return (
                  <Card key={b.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Star className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold text-ink-900">{service?.name}</p>
                      <p className="text-[11px] text-ink-500">{vendor?.name} · completed {fmtDate(b.date)} · {inr(b.amount)}</p>
                      <p className="mt-1 text-[10.5px] text-ink-400">Reviews are public and help other customers make better choices.</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link to={`/customer/bookings/${b.id}`} className={buttonStyles({ variant: 'outline', size: 'sm' })}>Booking</Link>
                      <Button size="sm" iconLeft={<Star className="h-3.5 w-3.5" />} onClick={() => openForBooking(b.id, b.serviceId, b.vendorId)}>Write review</Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {myReviews.length === 0 ? (
            <EmptyState icon={<Star className="h-5 w-5" />} title="No reviews yet" description="Reviews you write will appear here." compact action={<Button size="sm" onClick={() => setTab('pending')}>Review a service</Button>} />
          ) : (
            myReviews.map((r) => {
              const service = getService(r.serviceId);
              const vendor = getVendor(r.vendorId);
              return (
                <Card key={r.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar name={r.customer} size="md" tone="brand" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[12.5px] font-bold text-ink-900">{r.customer}</p>
                        <Badge tone="success" size="sm">Verified booking</Badge>
                        <span className="text-[10px] text-ink-400">{fmtDate(r.date)}</span>
                      </div>
                      <p className="text-[10.5px] text-ink-500">{service?.name} · {vendor?.name}</p>
                      <div className="mt-2"><RatingStars value={r.rating} showValue={false} /></div>
                      <h3 className="mt-1.5 text-[13px] font-bold text-ink-900">{r.title}</h3>
                      <p className="mt-1 text-[12px] leading-6 text-ink-600">{r.text}</p>
                      {r.reply && (
                        <div className="mt-2.5 rounded-xl bg-ink-50 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Reply from {vendor?.name}</p>
                          <p className="mt-1 text-[11.5px] leading-5 text-ink-600">{r.reply}</p>
                        </div>
                      )}
                      <div className="mt-2.5 flex items-center gap-3">
                        <button onClick={() => openEdit(r)} className="inline-flex items-center gap-1 text-[10.5px] font-bold text-brand-700 hover:text-brand-800"><Pencil className="h-3 w-3" /> Edit</button>
                        <button onClick={() => setDeleteTarget(r)} className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink-400 hover:text-rose-600"><Trash2 className="h-3 w-3" /> Delete</button>
                        <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-ink-400"><ThumbsUp className="h-3 w-3" /> {r.rating === 5 ? 12 : 4} found helpful</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      <div className="mt-5">
        <SectionCard title="How reviews work" description="Transparent, verified and useful.">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { n: '01', title: 'Only after a booking', text: 'Reviews are linked to a completed, paid booking — no anonymous ratings.' },
              { n: '02', title: 'Vendors can reply', text: 'Businesses get one public reply, so context is never missing.' },
              { n: '03', title: 'Moderated fairly', text: 'Abusive or fake reviews are removed within 24 hours of being reported.' },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-ink-200 p-3.5">
                <p className="font-display text-[11px] font-extrabold text-brand-500">{s.n}</p>
                <p className="mt-1 text-[11.5px] font-bold text-ink-800">{s.title}</p>
                <p className="mt-0.5 text-[10.5px] leading-5 text-ink-500">{s.text}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={draft.serviceId && myReviews.some((r) => r.serviceId === draft.serviceId) ? 'Edit your review' : 'Write a review'}
        description={draft.serviceId ? `${getService(draft.serviceId)?.name} · ${getVendor(draft.vendorId)?.name}` : undefined}
        icon={<Star className="h-5 w-5" />}
        footer={<><Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button><Button size="sm" onClick={submit} loading={saving}>Publish review</Button></>}
      >
        <div className="space-y-4">
          <div>
            <p className="field-label">Your rating <span className="text-rose-500">*</span></p>
            <RatingInput value={draft.rating} onChange={(v) => { setDraft((d) => ({ ...d, rating: v })); setErrors((e) => ({ ...e, rating: '' })); }} />
            {errors.rating && <p className="mt-1 text-xs font-medium text-rose-600">{errors.rating}</p>}
            <p className="mt-1 text-[10.5px] text-ink-400">
              {draft.rating === 5 ? 'Outstanding — would recommend' : draft.rating === 4 ? 'Good — a few improvements possible' : draft.rating === 3 ? 'Average experience' : draft.rating === 2 ? 'Below expectations' : draft.rating === 1 ? 'Poor experience' : 'Tap a star to rate'}
            </p>
          </div>
          <Input label="Headline" placeholder="Sum it up in a few words" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} error={errors.title} maxLength={80} hint={`${draft.title.length}/80`} />
          <Textarea label="Your review" placeholder="What went well? What could be better? Mention punctuality, quality and value." value={draft.text} onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))} error={errors.text} maxLength={700} hint={`${draft.text.length}/700 · minimum 20 characters`} />
          <button type="button" onClick={() => toast.info('Photo upload', 'Photo attachments are disabled in this demo.')} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 py-3 text-[11.5px] font-semibold text-ink-500 transition hover:border-brand-300 hover:bg-brand-50/30 hover:text-brand-700">
            <Camera className="h-4 w-4" /> Add photos (optional)
          </button>
          <div className="rounded-lg bg-ink-50 p-3 text-[10px] leading-5 text-ink-500">
            Reviews are public. Please don’t include personal information like phone numbers or addresses. Vendors can reply once, publicly.
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            setMyReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            setWritten((w) => w.filter((id) => id !== deleteTarget.serviceId));
            toast.success('Review deleted', 'Your review has been removed.');
          }
          setDeleteTarget(null);
        }}
        title="Delete this review?"
        description="This can’t be undone. The vendor will no longer see your feedback."
        confirmLabel="Delete review"
      />
    </div>
  );
}
