import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  Flag,
  MessageSquare,
  Search,
  Star,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react';
import { REVIEWS, getService, getVendor } from '@/lib/data';
import type { Review } from '@/lib/types';
import { cn, fmtDate } from '@/lib/utils';
import { useMockLoad } from '@/lib/hooks';
import { toast } from '@/store/toast';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Progress,
  RatingStars,
  Skeleton,
  Tabs,
  Textarea,
} from '@/components/ui/primitives';
import {
  DataTable,
  ExportButton,
  InfoRow,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/ui/data-display';
import { Drawer } from '@/components/ui/overlays';

interface Moderation {
  hidden: boolean;
  flagged: boolean;
}

export default function AdminReviews() {
  const loading = useMockLoad(340);
  const [tab, setTab] = useState('queue');
  const [query, setQuery] = useState('');
  const [moderation, setModeration] = useState<Record<string, Moderation>>(
    Object.fromEntries(REVIEWS.map((r) => [r.id, { hidden: !!r.hidden, flagged: !!r.flagged }])),
  );
  const [replies, setReplies] = useState<Record<string, string>>(
    Object.fromEntries(REVIEWS.filter((r) => r.reply).map((r) => [r.id, r.reply ?? ''])),
  );
  const [active, setActive] = useState<Review | null>(null);
  const [replyDraft, setReplyDraft] = useState('');

  const rows = useMemo(() => {
    return REVIEWS.map((r) => ({ ...r, ...moderation[r.id] })).filter((r) => {
      if (tab === 'queue' && !r.flagged && !r.hidden && !(r.rating <= 3)) return false;
      if (tab === 'flagged' && !r.flagged) return false;
      if (tab === 'hidden' && !r.hidden) return false;
      if (tab === 'replied' && !replies[r.id]) return false;
      if (query && !`${r.customer} ${r.title} ${r.text} ${getVendor(r.vendorId)?.name ?? ''}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [tab, query, moderation, replies]);

  const avg = REVIEWS.reduce((a, r) => a + r.rating, 0) / REVIEWS.length;
  const flaggedCount = REVIEWS.filter((r) => moderation[r.id]?.flagged).length;
  const hiddenCount = REVIEWS.filter((r) => moderation[r.id]?.hidden).length;
  const repliedCount = Object.values(replies).filter(Boolean).length;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: REVIEWS.filter((r) => Math.round(r.rating) === star).length,
  }));

  const setMod = (id: string, patch: Partial<Moderation>) => {
    setModeration((m) => ({ ...m, [id]: { ...m[id], ...patch } }));
  };

  const openReview = (r: Review) => {
    setActive(r);
    setReplyDraft(replies[r.id] ?? '');
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)}</div>
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reviews & moderation"
        description="Keep the marketplace trustworthy — verify genuine feedback, respond to customers and remove policy violations."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> Content & trust
          </span>
        }
        actions={
          <>
            <ExportButton
              filename="reviews.csv"
              rows={rows}
              columns={[
                { key: 'id', label: 'Review' },
                { key: 'customer', label: 'Customer' },
                { key: 'rating', label: 'Rating' },
                { key: 'title', label: 'Title' },
                { key: 'date', label: 'Date' },
              ]}
            />
            <Button size="sm" variant="outline" iconLeft={<Flag className="h-4 w-4" />} onClick={() => setTab('flagged')}>
              Review flagged ({flaggedCount})
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Average rating', value: avg.toFixed(2), hint: 'across all vendors', icon: Star, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Needs moderation', value: rows.filter((r) => r.flagged || r.hidden || r.rating <= 3).length, hint: 'low-rated or flagged', icon: AlertTriangle, tone: 'bg-rose-50 text-rose-600' },
          { label: 'Awaiting reply', value: REVIEWS.filter((r) => !replies[r.id]).length, hint: 'vendor response rate 78%', icon: MessageSquare, tone: 'bg-sky-50 text-sky-600' },
          { label: 'Verified purchases', value: `${Math.round((REVIEWS.filter((r) => r.verified).length / REVIEWS.length) * 100)}%`, hint: 'booking-linked reviews', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', s.tone)}>
              <s.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[19px] font-extrabold leading-none text-ink-900">{s.value}</p>
              <p className="mt-1 truncate text-[10.5px] font-semibold text-ink-600">{s.label}</p>
              <p className="text-[9.5px] text-ink-400">{s.hint}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { key: 'queue', label: 'Moderation queue', count: REVIEWS.filter((r) => r.flagged || r.hidden || r.rating <= 3).length },
                { key: 'flagged', label: 'Flagged', count: flaggedCount },
                { key: 'hidden', label: 'Hidden', count: hiddenCount },
                { key: 'all', label: 'All reviews', count: REVIEWS.length },
              ]}
            />
            <div className="relative lg:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reviews…"
                className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none"
              />
            </div>
          </div>

          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={openReview}
            empty={<EmptyState compact icon={<Star className="h-5 w-5" />} title="Nothing to moderate" description="Genuine, high-rated reviews need no action. New flags will appear here." />}
            columns={[
              {
                key: 'review',
                header: 'Review',
                render: (r) => (
                  <div className="flex items-start gap-2.5">
                    <Avatar name={r.customer} size="sm" tone={r.rating >= 4 ? 'success' : r.rating === 3 ? 'warning' : 'danger'} />
                    <div className="min-w-0 max-w-[290px]">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11.5px] font-bold text-ink-900">{r.customer}</p>
                        {r.verified && <Badge tone="success" size="sm">Verified</Badge>}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[10.5px] font-semibold text-ink-600">{r.title}</p>
                      <p className="line-clamp-1 text-[10px] leading-4 text-ink-400">{r.text}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'vendor', header: 'Vendor & service', render: (r) => <div><p className="text-[11px] font-semibold text-ink-700">{getVendor(r.vendorId)?.name}</p><p className="text-[9.5px] text-ink-400">{getService(r.serviceId)?.name}</p></div> },
              { key: 'rating', header: 'Rating', render: (r) => <RatingStars value={r.rating} showValue={false} size={12} /> },
              { key: 'date', header: 'Date', render: (r) => <span className="text-[10.5px] text-ink-500">{fmtDate(r.date)}</span> },
              {
                key: 'state',
                header: 'State',
                render: (r) => (
                  <div className="flex flex-wrap gap-1">
                    {r.hidden && <Badge tone="neutral" size="sm" icon={<EyeOff className="h-3 w-3" />}>Hidden</Badge>}
                    {r.flagged && <Badge tone="danger" size="sm" icon={<Flag className="h-3 w-3" />}>Flagged</Badge>}
                    {!r.hidden && !r.flagged && r.rating <= 3 && <Badge tone="warning" size="sm">Low rating</Badge>}
                    {!r.hidden && !r.flagged && r.rating > 3 && <StatusBadge status="published" size="sm" label="Published" />}
                    {replies[r.id] && <Badge tone="brand" size="sm" icon={<MessageSquare className="h-3 w-3" />}>Replied</Badge>}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (r) => (
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    {r.hidden ? (
                      <Button size="xs" variant="success" onClick={() => { setMod(r.id, { hidden: false }); toast.success('Review restored', 'The review is visible on the vendor profile again.'); }}>Restore</Button>
                    ) : (
                      <Button size="xs" variant="outline" onClick={() => { setMod(r.id, { hidden: true }); toast.warning('Review hidden', 'The review has been removed from public view.'); }}>Hide</Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>

        <div className="space-y-4">
          <SectionCard title="Rating distribution" description={`${REVIEWS.length} total reviews`}>
            <div className="mb-4 flex items-end gap-3">
              <p className="font-display text-[38px] font-extrabold leading-none text-ink-900">{avg.toFixed(2)}</p>
              <div className="pb-1">
                <RatingStars value={avg} showValue={false} size={14} />
                <p className="mt-0.5 text-[10px] text-ink-400">+0.2 vs last quarter</p>
              </div>
            </div>
            <div className="space-y-2">
              {distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-2">
                  <span className="flex w-8 items-center gap-0.5 text-[10.5px] font-semibold text-ink-500">{d.star}<Star className="h-3 w-3 fill-amber-400 text-amber-400" /></span>
                  <Progress value={(d.count / REVIEWS.length) * 100} tone="warning" size="sm" className="flex-1" />
                  <span className="w-5 text-right text-[10px] text-ink-400">{d.count}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Moderation policy" bodyClassName="space-y-2.5">
            {[
              'Only customers with a completed booking may review.',
              'Hide reviews containing personal data, abuse or competitor spam.',
              'Never delete a genuine negative review — respond instead.',
              'Vendors get one public reply per review.',
              'Escalate safety allegations to the trust & safety team.',
            ].map((p) => (
              <p key={p} className="flex gap-2 text-[10.5px] leading-5 text-ink-500">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {p}
              </p>
            ))}
          </SectionCard>

          <Card className="bg-gradient-to-br from-violet-600 to-brand-700 p-4 text-white">
            <p className="flex items-center gap-1.5 text-[12px] font-bold"><TrendingUp className="h-4 w-4" /> Sentiment insight</p>
            <p className="mt-1 text-[10.5px] leading-5 text-white/75">Reviews mentioning “punctuality” improved 14% after the arrival-window reminder rollout.</p>
            <button onClick={() => toast.info('Sentiment report', 'A detailed sentiment report is available under Reports.')} className="mt-2.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[10.5px] font-bold backdrop-blur transition hover:bg-white/25">
              Open sentiment report
            </button>
          </Card>
        </div>
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title="Review detail"
        description={active ? `${active.id.toUpperCase()} · ${fmtDate(active.date)}` : undefined}
        footer={
          active ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button>
              {moderation[active.id]?.flagged && (
                <Button variant="outline" size="sm" onClick={() => { setMod(active.id, { flagged: false }); toast.success('Flag cleared', 'This review no longer needs moderation.'); }}>
                  Clear flag
                </Button>
              )}
              <Button
                variant={moderation[active.id]?.hidden ? 'success' : 'danger'}
                size="sm"
                onClick={() => {
                  const next = !moderation[active.id]?.hidden;
                  setMod(active.id, { hidden: next, flagged: false });
                  if (next) toast.warning('Review hidden', 'Removed from public view pending appeal.');
                  else toast.success('Review restored', 'The review is public again.');
                }}
              >
                {moderation[active.id]?.hidden ? 'Restore review' : 'Hide review'}
              </Button>
            </>
          ) : null
        }
      >
        {active && (
          <div className="space-y-5">
            <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={active.customer} size="md" tone={active.rating >= 4 ? 'success' : active.rating === 3 ? 'warning' : 'danger'} />
                  <div>
                    <p className="text-[12.5px] font-bold text-ink-900">{active.customer}</p>
                    <p className="text-[10px] text-ink-400">{active.verified ? 'Verified booking' : 'Unverified review'}</p>
                  </div>
                </div>
                <RatingStars value={active.rating} showValue={false} size={16} />
              </div>
              <p className="mt-3 text-[13px] font-bold text-ink-900">{active.title}</p>
              <p className="mt-1 text-[12px] leading-6 text-ink-600">{active.text}</p>
              {active.images && active.images.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {active.images.map((src, i) => (
                    <img key={i} src={src} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  ))}
                </div>
              )}
            </div>

            <div className="divide-y divide-ink-100">
              <InfoRow label="Vendor" value={getVendor(active.vendorId)?.name ?? '—'} />
              <InfoRow label="Service" value={getService(active.serviceId)?.name ?? '—'} />
              <InfoRow label="Submitted" value={fmtDate(active.date)} />
              <InfoRow label="Verified purchase" value={active.verified ? 'Yes — linked to a completed booking' : 'No'} />
              <InfoRow label="Moderation state" value={moderation[active.id]?.hidden ? 'Hidden' : moderation[active.id]?.flagged ? 'Flagged for review' : 'Published'} />
            </div>

            {moderation[active.id]?.flagged && (
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-3.5">
                <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-rose-600"><Flag className="h-3.5 w-3.5" /> Flag reason</p>
                <p className="mt-1 text-[11.5px] leading-5 text-ink-600">
                  {active.rating <= 2 ? 'Low rating with a service-quality allegation. Evidence is required before hiding.' : 'Automatically flagged by the profanity & personal-data filter.'}
                </p>
              </div>
            )}

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">Public vendor reply</p>
              {replies[active.id] ? (
                <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3.5">
                  <p className="text-[10px] font-semibold text-brand-700">{getVendor(active.vendorId)?.name} · vendor response</p>
                  <p className="mt-1 text-[11.5px] leading-5 text-ink-600">{replies[active.id]}</p>
                </div>
              ) : (
                <p className="rounded-lg bg-ink-50 p-3 text-[10.5px] text-ink-500">No response yet. Vendors are prompted to reply within 48 hours.</p>
              )}
              <Textarea
                className="mt-2 min-h-[88px] text-[12px]"
                placeholder="Write a reply on behalf of the vendor…"
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" size="xs" onClick={() => setReplyDraft('')}>Clear</Button>
                <Button
                  size="xs"
                  onClick={() => {
                    if (!replyDraft.trim()) return toast.error('Reply is empty', 'Write a response before publishing.');
                    setReplies((r) => ({ ...r, [active.id]: replyDraft }));
                    setMod(active.id, { flagged: false });
                    toast.success('Reply published', 'The vendor response is now visible publicly.');
                  }}
                >
                  <ThumbsUp className="h-3.5 w-3.5" /> Publish reply
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
