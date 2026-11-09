import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Flag,
  MessageSquare,
  Search,
  Star,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react';
import { getService, getVendor, getVendorReviews } from '@/lib/data';
import { cn, fmtDate } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, buttonStyles, Card, EmptyState, Progress, RatingStars, Skeleton, Tabs, Textarea } from '@/components/ui/primitives';
import { PageHeader, SectionCard } from '@/components/ui/data-display';
import { Modal } from '@/components/ui/overlays';
import type { Review } from '@/lib/types';

export default function VendorReviews() {
  const { user } = useAuth();
  const loading = useMockLoad(360);
  const vendorId = user?.vendorId ?? 'v1';
  const vendor = getVendor(vendorId)!;
  const base = getVendorReviews(vendorId);

  const [replies, setReplies] = useState<Record<string, string>>({});
  const [hidden, setHidden] = useState<string[]>([]);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [replyFor, setReplyFor] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');

  const reviews = useMemo(
    () => base.map((r) => ({ ...r, reply: replies[r.id] || r.reply })).filter((r) => !hidden.includes(r.id)),
    [base, replies, hidden],
  );

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
  const unreplied = reviews.filter((r) => !r.reply).length;

  const rows = reviews.filter((r) => {
    if (tab === 'unreplied' && r.reply) return false;
    if (tab === 'positive' && r.rating < 4) return false;
    if (tab === 'critical' && r.rating >= 4) return false;
    if (query && !`${r.customer} ${r.title} ${r.text}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const sendReply = () => {
    if (!replyFor) return;
    if (replyText.trim().length < 10) { toast.error('Reply too short', 'Write at least 10 characters.'); return; }
    setReplies((r) => ({ ...r, [replyFor.id]: replyText.trim() }));
    toast.success('Reply published', 'Your response is now visible on the public listing.');
    setReplyFor(null);
    setReplyText('');
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
        <Skeleton className="h-[360px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Public feedback shapes your ranking. Reply to every review — it improves trust and conversion."
        actions={
          <>
            <Badge tone={unreplied ? 'warning' : 'success'} size="md" dot>{unreplied} awaiting reply</Badge>
            <Link to={`/vendors/${vendor.slug}`} className={buttonStyles({ size: 'md' })}><Star className="h-4 w-4" /> View public page</Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.7fr]">
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="text-center">
              <p className="font-display text-[44px] font-extrabold leading-none text-ink-900">{avg.toFixed(1)}</p>
              <RatingStars value={avg} showValue={false} size={13} className="mt-1.5 justify-center" />
              <p className="mt-1 text-[10px] text-ink-400">{reviews.length} reviews</p>
            </div>
            <div className="flex-1 space-y-1">
              {distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-2">
                  <span className="flex w-7 items-center gap-0.5 text-[10px] text-ink-400">{d.star}<Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /></span>
                  <Progress value={reviews.length ? (d.count / reviews.length) * 100 : 0} tone="warning" size="sm" className="flex-1" />
                  <span className="w-6 text-right text-[9.5px] font-semibold text-ink-500">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-ink-100 pt-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-center"><p className="text-[15px] font-extrabold text-emerald-700">96%</p><p className="text-[9px] text-emerald-600">would recommend</p></div>
            <div className="rounded-lg bg-brand-50 p-2.5 text-center"><p className="text-[15px] font-extrabold text-brand-700">4.6h</p><p className="text-[9px] text-brand-600">avg reply time</p></div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Rating this month', value: '4.9', delta: '+0.2', icon: TrendingUp, tone: 'bg-emerald-50 text-emerald-600' },
            { label: 'Reviews received', value: reviews.length, delta: '+3', icon: MessageSquare, tone: 'bg-brand-50 text-brand-600' },
            { label: 'Reply rate', value: `${reviews.length ? Math.round(((reviews.length - unreplied) / reviews.length) * 100) : 0}%`, delta: 'Target 100%', icon: ThumbsUp, tone: 'bg-violet-50 text-violet-600' },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', s.tone)}><s.icon className="h-4 w-4" /></span>
              <p className="mt-2.5 font-display text-[22px] font-extrabold text-ink-900">{s.value}</p>
              <p className="text-[10.5px] text-ink-500">{s.label}</p>
              <p className="mt-1 text-[9.5px] font-semibold text-emerald-600">{s.delta}</p>
            </Card>
          ))}
          <div className="sm:col-span-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-amber-900"><CheckCircle2 className="h-4 w-4" /> Reviews boost your ranking</p>
            <p className="mt-1 text-[10.5px] leading-4 text-amber-800">Vendors who reply to 100% of reviews appear 2.4× more often in “top rated” search results. You have {unreplied} unanswered.</p>
          </div>
        </div>
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onChange={setTab} items={[{ key: 'all', label: 'All reviews', count: reviews.length }, { key: 'unreplied', label: 'Needs reply', count: unreplied }, { key: 'positive', label: 'Positive' }, { key: 'critical', label: 'Critical' }]} />
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reviews…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-5"><EmptyState compact icon={<Star className="h-5 w-5" />} title="No reviews in this view" description="Try another filter. New reviews appear here automatically after a completed booking." /></div>
        ) : (
          <div className="divide-y divide-ink-100">
            {rows.map((r) => (
              <div key={r.id} className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={r.customer} size="md" tone="brand" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[12.5px] font-bold text-ink-900">{r.customer}</p>
                      {r.verified && <Badge tone="success" size="sm"><CheckCircle2 className="h-2.5 w-2.5" /> Verified</Badge>}
                      <span className="text-[10px] text-ink-400">{fmtDate(r.date)}</span>
                      <span className="ml-auto"><RatingStars value={r.rating} showValue={false} size={12} /></span>
                    </div>
                    <p className="mt-1 text-[12px] font-semibold text-ink-800">{r.title}</p>
                    <p className="mt-0.5 text-[11.5px] leading-5 text-ink-500">{r.text}</p>
                    <p className="mt-1 text-[10px] text-ink-400">{getService(r.serviceId)?.name}</p>

                    {r.reply && (
                      <div className="mt-3 rounded-xl border-l-2 border-brand-400 bg-brand-50/50 p-3">
                        <p className="text-[10px] font-bold text-brand-800">Your reply · {vendor.name}</p>
                        <p className="mt-0.5 text-[11px] leading-5 text-brand-900/80">{r.reply}</p>
                      </div>
                    )}

                    <div className="mt-2.5 flex items-center gap-2">
                      {!r.reply ? (
                        <Button size="xs" variant="soft" iconLeft={<MessageSquare className="h-3 w-3" />} onClick={() => { setReplyFor(r); setReplyText(''); }}>Reply</Button>
                      ) : (
                        <Button size="xs" variant="outline" onClick={() => { setReplyFor(r); setReplyText(r.reply ?? ''); }}>Edit reply</Button>
                      )}
                      <button onClick={() => toast.success('Review reported', 'Our trust & safety team will review it within 24 hours.')} className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink-400 hover:text-rose-500"><Flag className="h-3 w-3" /> Report</button>
                      <button onClick={() => { setHidden((h) => [...h, r.id]); toast.info('Review hidden', 'Reported reviews are hidden from your dashboard while under review.'); }} className="ml-auto text-[10px] text-ink-300 hover:text-ink-500">Hide from view</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { title: 'Reply within 24 hours', text: 'Fast replies signal an active, caring business.' },
          { title: 'Never argue publicly', text: 'Acknowledge the issue and move the conversation offline.' },
          { title: 'Ask happy customers', text: 'A polite follow-up after service lifts review rate by 31%.' },
        ].map((tip) => (
          <div key={tip.title} className="rounded-xl border border-ink-200 bg-white p-3.5">
            <p className="text-[11.5px] font-bold text-ink-800">{tip.title}</p>
            <p className="mt-0.5 text-[10.5px] leading-4 text-ink-500">{tip.text}</p>
          </div>
        ))}
      </div>

      <Modal
        open={!!replyFor}
        onClose={() => setReplyFor(null)}
        title={replyFor?.reply ? 'Edit your reply' : 'Reply to review'}
        description={replyFor ? `${replyFor.customer} · ${replyFor.rating}-star review` : undefined}
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setReplyFor(null)}>Cancel</Button>
            <Button size="sm" onClick={sendReply}>Publish reply</Button>
          </>
        }
      >
        {replyFor && (
          <div className="space-y-3">
            <div className="rounded-xl bg-ink-50 p-3">
              <p className="text-[11px] font-bold text-ink-800">{replyFor.title}</p>
              <p className="mt-0.5 text-[10.5px] leading-4 text-ink-500">{replyFor.text}</p>
            </div>
            <Textarea label="Your public reply" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Thank the customer, address their concern and invite them back…" hint={`${replyText.length} characters · keep it professional and specific`} />
            <div className="flex flex-wrap gap-1.5">
              {['Thank you for the feedback!', 'We’re sorry about this experience.', 'We’d love to make it right — please message us.'].map((t) => (
                <button key={t} onClick={() => setReplyText(t)} className="rounded-full border border-ink-200 px-2.5 py-1 text-[10px] font-semibold text-ink-500 hover:border-brand-300 hover:bg-brand-50">{t}</button>
              ))}
            </div>
            <p className="text-[10px] leading-4 text-ink-400">Replies are public and cannot be deleted after 24 hours. Never share personal data.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
