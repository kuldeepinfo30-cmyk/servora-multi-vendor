import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Filter,
  MessageSquare,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { DISPUTES } from '@/lib/data';
import type { Dispute } from '@/lib/types';
import { cn, fmtDate, inr } from '@/lib/utils';
import { useMockLoad } from '@/lib/hooks';
import { toast } from '@/store/toast';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Select,
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
  Timeline,
} from '@/components/ui/data-display';
import { Drawer, Modal } from '@/components/ui/overlays';

type DisputeStatus = Dispute['status'];

const priorityTone: Record<string, string> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
};

const slaHours: Record<string, number> = { high: 4, medium: 12, low: 24 };

function partyRows(d: Dispute) {
  return [
    { role: 'Customer', name: d.customer, icon: UserRound, tone: 'brand' as const },
    { role: 'Vendor', name: d.vendor, icon: ShieldCheck, tone: 'success' as const },
  ];
}

export default function AdminDisputes() {
  const loading = useMockLoad(360);
  const [tab, setTab] = useState('open');
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('all');
  const [active, setActive] = useState<Dispute | null>(null);
  const [statuses, setStatuses] = useState<Record<string, DisputeStatus>>({});
  const [resolution, setResolution] = useState<'customer' | 'vendor' | 'split' | null>(null);
  const [outcome, setOutcome] = useState('refund_full');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Record<string, { text: string; time: string; author: string }[]>>({});

  const cases = useMemo(
    () => DISPUTES.map((d) => ({ ...d, status: statuses[d.id] ?? d.status })),
    [statuses],
  );

  const rows = cases.filter((d) => {
    if (tab === 'open' && !['open', 'under_review'].includes(d.status)) return false;
    if (tab === 'resolved' && !['resolved', 'rejected'].includes(d.status)) return false;
    if (priority !== 'all' && d.priority !== priority) return false;
    if (query && !`${d.id} ${d.bookingRef} ${d.customer} ${d.vendor} ${d.reason}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const openCount = cases.filter((d) => d.status === 'open').length;
  const reviewCount = cases.filter((d) => d.status === 'under_review').length;
  const highCount = cases.filter((d) => d.priority === 'high' && d.status !== 'resolved').length;
  const atRisk = cases.filter((d) => ['open', 'under_review'].includes(d.status)).reduce((a, d) => a + d.amount, 0);

  const resolve = () => {
    if (!active || !resolution) return;
    setStatuses((s) => ({ ...s, [active.id]: 'resolved' }));
    setNotes((n) => ({
      ...n,
      [active.id]: [
        ...(n[active.id] ?? []),
        {
          text: note || (resolution === 'customer' ? 'Resolved in favour of the customer. Refund authorised.' : resolution === 'vendor' ? 'Resolved in favour of the vendor. No refund issued.' : 'Split resolution — partial refund authorised.'),
          time: 'Just now',
          author: 'Aisha Khan',
        },
      ],
    }));
    toast.success(
      'Dispute resolved',
      resolution === 'customer'
        ? `${inr(active.amount)} refund authorised and both parties notified.`
        : resolution === 'vendor'
          ? 'The vendor has been cleared and the customer notified.'
          : 'A partial refund was recorded and the case closed.',
    );
    setResolution(null);
    setNote('');
    setActive(null);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)}
        </div>
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-rose-600">
            <Scale className="h-3.5 w-3.5" /> Trust & safety
          </span>
        }
        title="Disputes"
        description="Review evidence, protect buyers and sellers, and resolve conflicts within the published SLA."
        actions={
          <>
            <ExportButton
              filename="disputes.csv"
              rows={cases}
              columns={[
                { key: 'id', label: 'Case' },
                { key: 'bookingRef', label: 'Booking' },
                { key: 'customer', label: 'Customer' },
                { key: 'vendor', label: 'Vendor' },
                { key: 'amount', label: 'Amount' },
                { key: 'priority', label: 'Priority' },
                { key: 'status', label: 'Status' },
              ]}
            />
            <Button size="sm" iconLeft={<Sparkles className="h-4 w-4" />} onClick={() => toast.info('Smart triage', 'Cases are auto-ranked by amount, age and prior flags.')}>
              Smart triage
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Awaiting first response', value: openCount, hint: 'respond within 4h', icon: Clock, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Under review', value: reviewCount, hint: 'evidence being assessed', icon: FileText, tone: 'bg-sky-50 text-sky-600' },
          { label: 'High priority', value: highCount, hint: 'escalated cases', icon: AlertTriangle, tone: 'bg-rose-50 text-rose-600' },
          { label: 'Value at risk', value: inr(atRisk), hint: 'across open cases', icon: Scale, tone: 'bg-violet-50 text-violet-600' },
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

      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { key: 'open', label: 'Needs action', count: openCount + reviewCount },
              { key: 'resolved', label: 'Closed', count: cases.filter((d) => ['resolved', 'rejected'].includes(d.status)).length },
              { key: 'all', label: 'All cases', count: cases.length },
            ]}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search case, booking, party…"
                className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-ink-400" />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-[11.5px] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none"
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          rows={rows}
          rowKey={(d) => d.id}
          onRowClick={setActive}
          empty={<EmptyState compact icon={<Scale className="h-5 w-5" />} title="No disputes in this view" description="Every case here has been handled. New disputes appear automatically." />}
          columns={[
            {
              key: 'case',
              header: 'Case',
              render: (d) => (
                <div className="flex items-center gap-2.5">
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', d.priority === 'high' ? 'bg-rose-50 text-rose-600' : d.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-ink-100 text-ink-500')}>
                    <Scale className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-mono text-[10.5px] font-bold text-ink-800">{d.id.toUpperCase()}</p>
                    <p className="text-[9.5px] text-ink-400">{d.bookingRef} · {fmtDate(d.opened)}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'parties',
              header: 'Parties',
              render: (d) => (
                <div className="space-y-1">
                  {partyRows(d).map((p) => (
                    <div key={p.role} className="flex items-center gap-1.5">
                      <Avatar name={p.name} size="xs" tone={p.tone} />
                      <span className="text-[11px] text-ink-700">{p.name}</span>
                      <span className="text-[9px] uppercase tracking-wide text-ink-400">{p.role}</span>
                    </div>
                  ))}
                </div>
              ),
            },
            { key: 'reason', header: 'Reason', render: (d) => <span className="line-clamp-2 max-w-[240px] text-[10.5px] leading-4 text-ink-500">{d.reason}</span> },
            { key: 'evidence', header: 'Evidence', align: 'center', render: (d) => <Badge tone={d.evidence > 2 ? 'success' : 'warning'} size="sm">{d.evidence} files</Badge> },
            { key: 'amount', header: 'Amount', align: 'right', render: (d) => <span className="text-[12px] font-bold text-ink-900">{inr(d.amount)}</span> },
            { key: 'priority', header: 'Priority', render: (d) => <Badge tone={priorityTone[d.priority]} size="sm" dot>{d.priority}</Badge> },
            { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} size="sm" /> },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (d) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  {['open', 'under_review'].includes(d.status) ? (
                    <Button size="xs" onClick={() => setActive(d)}>Review</Button>
                  ) : (
                    <Button size="xs" variant="outline" onClick={() => setActive(d)}>View</Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Resolution playbook" description="Consistent decisions, every time" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: '1 · Gather', body: 'Collect photos, chat logs, GPS arrival and payment records before contacting either party.', tone: 'brand' },
              { title: '2 · Hear both sides', body: 'Give each party 24h to respond. Never decide on a single unverified claim.', tone: 'warning' },
              { title: '3 · Decide & record', body: 'Apply policy, issue the outcome and write a rationale for the audit log.', tone: 'success' },
            ].map((step) => (
              <div key={step.title} className="rounded-xl border border-ink-100 bg-ink-50/40 p-3.5">
                <Badge tone={step.tone} size="sm">{step.title}</Badge>
                <p className="mt-2 text-[10.5px] leading-5 text-ink-500">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-3.5 text-[10.5px] leading-5 text-amber-900">
            <span className="font-bold">SLA reminder:</span> high-priority cases must receive a first response within 4 hours. Breaches are escalated to the trust & safety lead and appear on the daily ops report.
          </div>
        </SectionCard>

        <SectionCard title="Dispute reasons" description="Last 90 days">
          <div className="space-y-3">
            {[
              ['Service quality', 38, 'brand'],
              ['Vendor no-show', 24, 'danger'],
              ['Billing / duplicate', 18, 'warning'],
              ['Damage claim', 12, 'violet'],
              ['Other', 8, 'neutral'],
            ].map(([label, value, tone]) => (
              <div key={String(label)}>
                <div className="flex justify-between text-[11px]">
                  <span className="text-ink-500">{label}</span>
                  <span className="font-bold text-ink-800">{value}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={cn('h-full rounded-full', tone === 'brand' ? 'bg-brand-500' : tone === 'danger' ? 'bg-rose-500' : tone === 'warning' ? 'bg-amber-500' : tone === 'violet' ? 'bg-violet-500' : 'bg-ink-400')}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-[10.5px] text-emerald-800">
            <span>Resolved within SLA</span>
            <span className="font-bold">91.4%</span>
          </div>
        </SectionCard>
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? `Dispute ${active.id.toUpperCase()}` : 'Dispute'}
        description={active ? `${active.bookingRef} · ${inr(active.amount)} · opened ${fmtDate(active.opened)}` : undefined}
        footer={
          active && ['open', 'under_review'].includes(active.status) ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button>
              <Button variant="danger" size="sm" onClick={() => setResolution('vendor')}><X className="h-3.5 w-3.5" /> Favour vendor</Button>
              <Button variant="success" size="sm" onClick={() => setResolution('customer')}><Check className="h-3.5 w-3.5" /> Favour customer</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button>
          )
        }
      >
        {active && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge status={active.status} />
                <Badge tone={priorityTone[active.priority]} size="sm" dot>{active.priority} priority</Badge>
              </div>
              <span className="font-display text-[22px] font-extrabold text-ink-900">{inr(active.amount)}</span>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-600">
                <AlertTriangle className="h-3.5 w-3.5" /> Customer claim
              </p>
              <p className="mt-1.5 text-[12px] leading-5 text-ink-700">{active.reason}</p>
            </div>

            <div className="space-y-1">
              {partyRows(active).map((p) => (
                <div key={p.role} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                  <Avatar name={p.name} size="md" tone={p.tone} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-ink-900">{p.name}</p>
                    <p className="text-[10px] text-ink-400">{p.role} · {p.role === 'Customer' ? '3 previous bookings' : 'verified partner since 2023'}</p>
                  </div>
                  <Button variant="ghost" size="xs" iconLeft={<MessageSquare className="h-3.5 w-3.5" />}>Message</Button>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Evidence ({active.evidence})</p>
                <button className="text-[10.5px] font-bold text-brand-600">Download all</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: Math.max(3, Math.min(active.evidence, 6)) }).map((_, i) => (
                  <div key={i} className="group relative flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-ink-100 bg-ink-50 text-ink-400">
                    <FileText className="h-5 w-5" />
                    <span className="text-[8.5px] font-semibold">{i % 2 === 0 ? `photo-${i + 1}.jpg` : `chat-${i + 1}.txt`}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">Case activity</p>
              <Timeline
                items={[
                  { title: 'Dispute opened by customer', description: 'Evidence attached automatically from the booking.', time: fmtDate(active.opened), done: true },
                  { title: 'Vendor response received', description: 'Vendor submitted a written statement and 2 photos.', time: '1d later', done: true },
                  { title: 'Assigned to trust & safety', description: 'Aisha Khan picked up the case.', time: '2h later', done: true },
                  ...(active.status === 'under_review'
                    ? [{ title: 'Evidence assessment in progress', description: 'Comparing arrival logs and service checklist.', time: 'now', current: true }]
                    : []),
                  ...(notes[active.id] ?? []).map((n) => ({ title: `Note by ${n.author}`, description: n.text, time: n.time, current: true })),
                ]}
              />
            </div>

            <div className="rounded-xl border border-ink-200 p-3.5">
              <p className="text-[11px] font-bold text-ink-800">Add an internal note</p>
              <Textarea className="mt-2 min-h-[72px] text-[12px]" placeholder="Visible to admins only. Recorded in the audit log." value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="mt-2 flex justify-end">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    if (!note.trim()) return toast.error('Note is empty', 'Write a note before saving.');
                    setNotes((n) => ({ ...n, [active.id]: [...(n[active.id] ?? []), { text: note, time: 'Just now', author: 'Aisha Khan' }] }));
                    setNote('');
                    toast.success('Note saved', 'The case timeline has been updated.');
                  }}
                >
                  Save note
                </Button>
              </div>
            </div>

            {['open', 'under_review'].includes(active.status) && (
              <div className="rounded-xl bg-ink-50 p-3.5">
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-ink-500">Resolution options</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button onClick={() => setResolution('customer')} className="rounded-lg border border-emerald-200 bg-white p-2.5 text-left transition hover:border-emerald-400">
                    <p className="text-[11px] font-bold text-emerald-700">Favour customer</p>
                    <p className="text-[9.5px] text-ink-400">Refund from vendor payout</p>
                  </button>
                  <button onClick={() => setResolution('vendor')} className="rounded-lg border border-rose-200 bg-white p-2.5 text-left transition hover:border-rose-400">
                    <p className="text-[11px] font-bold text-rose-700">Favour vendor</p>
                    <p className="text-[9.5px] text-ink-400">Release funds, close case</p>
                  </button>
                  <button onClick={() => setResolution('split')} className="rounded-lg border border-ink-200 bg-white p-2.5 text-left transition hover:border-ink-400 sm:col-span-2">
                    <p className="text-[11px] font-bold text-ink-700">Split resolution</p>
                    <p className="text-[9.5px] text-ink-400">Partial refund with platform absorbing the difference</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        open={!!resolution}
        onClose={() => setResolution(null)}
        title={resolution === 'customer' ? 'Resolve in favour of the customer' : resolution === 'vendor' ? 'Resolve in favour of the vendor' : 'Split resolution'}
        description="The outcome, rationale and amounts are recorded in the audit log and shared with both parties."
        size="md"
        icon={<Scale className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setResolution(null)}>Cancel</Button>
            <Button variant={resolution === 'vendor' ? 'danger' : 'success'} size="sm" onClick={resolve}>Confirm resolution</Button>
          </>
        }
      >
        {active && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-ink-400">Disputed amount</p>
                <p className="text-[18px] font-extrabold text-ink-900">{inr(active.amount)}</p>
              </div>
              <StatusBadge status={active.status} />
            </div>
            <Select label="Outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              <option value="refund_full">Full refund to customer</option>
              <option value="refund_partial">Partial refund</option>
              <option value="release">Release payment to vendor</option>
              <option value="redo">Free re-service booked</option>
              <option value="warning">Vendor warning, no refund</option>
            </Select>
            <Textarea
              label="Decision rationale (required)"
              placeholder="Explain what evidence was reviewed and why this outcome is fair…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="rounded-lg bg-amber-50 p-3 text-[10.5px] leading-5 text-amber-800">
              Both parties will be emailed. If the decision is contested, the case can be reopened within 7 days.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
