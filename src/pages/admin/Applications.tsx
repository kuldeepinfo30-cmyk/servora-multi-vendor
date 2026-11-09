import { useState } from 'react';
import {
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { APPLICATIONS } from '@/lib/data';
import { cn, fmtDate } from '@/lib/utils';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, Card, EmptyState, Progress, Skeleton, Tabs, Textarea } from '@/components/ui/primitives';
import { PageHeader, SectionCard, StatusBadge, Timeline } from '@/components/ui/data-display';
import { Drawer, Modal } from '@/components/ui/overlays';
import type { Application } from '@/lib/types';

export default function AdminApplications() {
  const loading = useMockLoad(360);
  const [tab, setTab] = useState('pending');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Application | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [statuses, setStatuses] = useState<Record<string, Application['status']>>({});

  const applications = APPLICATIONS.map((a) => ({ ...a, status: statuses[a.id] ?? a.status }));
  const rows = applications.filter((a) => {
    if (tab === 'pending' && !['pending', 'under_review'].includes(a.status)) return false;
    if (tab !== 'pending' && a.status !== tab) return false;
    if (query && !`${a.business} ${a.owner} ${a.city}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const decide = () => {
    if (!active || !decision) return;
    setStatuses((s) => ({ ...s, [active.id]: decision === 'approve' ? 'approved' : 'rejected' }));
    toast.success(decision === 'approve' ? 'Application approved' : 'Application rejected', decision === 'approve' ? `${active.business} has been invited to complete onboarding.` : `${active.business} has been notified with the reason.`);
    setDecision(null);
    setActive(null);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52" />)}</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-600"><Clock className="h-3.5 w-3.5" /> {applications.filter((a) => a.status === 'pending').length} awaiting review</span>}
        title="Vendor applications"
        description="Verify businesses before they go live. Review documents, compliance and category fit."
        actions={<Badge tone="warning" size="md" dot>Oldest waiting 3 days</Badge>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Pending review', value: applications.filter((a) => a.status === 'pending').length, hint: 'action needed', tone: 'text-amber-600' },
          { label: 'Under review', value: applications.filter((a) => a.status === 'under_review').length, hint: 'docs requested', tone: 'text-brand-600' },
          { label: 'Approved this month', value: applications.filter((a) => a.status === 'approved').length + 8, hint: 'avg 2.4 days', tone: 'text-emerald-600' },
          { label: 'Rejected', value: applications.filter((a) => a.status === 'rejected').length, hint: 'incomplete docs', tone: 'text-rose-600' },
        ].map((s) => (
          <Card key={s.label} className="p-4"><p className={cn('font-display text-[22px] font-extrabold', s.tone)}>{s.value}</p><p className="mt-0.5 text-[11px] font-semibold text-ink-700">{s.label}</p><p className="text-[10px] text-ink-400">{s.hint}</p></Card>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onChange={setTab} items={[{ key: 'pending', label: 'Needs review', count: applications.filter((a) => ['pending', 'under_review'].includes(a.status)).length }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }]} />
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search applications…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="Queue is clear" description="There are no applications in this view. New submissions appear here automatically." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {rows.map((a) => (
            <Card key={a.id} hover className="flex flex-col">
              <div className="flex items-start gap-3 p-4">
                <Avatar name={a.business} size="lg" tone={a.tone} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-ink-900">{a.business}</p>
                  <p className="text-[10.5px] text-ink-500">{a.owner} · {a.category}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <StatusBadge status={a.status} size="sm" />
                    <Badge tone="neutral" size="sm">{a.docs} docs</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 border-y border-ink-100 bg-ink-50/40 px-4 py-2.5 text-[10.5px] text-ink-500">
                <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {a.city}</p>
                <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {a.email}</p>
                <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Submitted {fmtDate(a.submitted)}</p>
              </div>
              <p className="line-clamp-2 px-4 py-2.5 text-[10.5px] leading-4 text-ink-500">{a.notes}</p>
              <div className="mt-auto flex gap-2 p-4 pt-0">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setActive(a)}>Review</Button>
                <Button size="sm" variant="success" className="flex-1" onClick={() => { setActive(a); setDecision('approve'); }}>Approve</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Review SLA" description="Time from submission to decision" bodyClassName="space-y-3">
          {[['Under 24 hours', 62, 'success'], ['1–2 days', 24, 'brand'], ['2–4 days', 10, 'warning'], ['Over 4 days', 4, 'danger']].map(([label, value, tone]) => (
            <div key={String(label)}>
              <div className="flex justify-between text-[11px]"><span className="text-ink-500">{label}</span><span className="font-bold text-ink-800">{value}%</span></div>
              <Progress value={Number(value)} tone={String(tone)} size="sm" className="mt-1" />
            </div>
          ))}
        </SectionCard>
        <SectionCard title="Verification checklist" description="Applied to every application">
          <div className="space-y-2.5">
            {[['GSTIN validation', true], ['Owner PAN & Aadhaar match', true], ['Police verification', true], ['Bank account verification', true], ['Category licence', false], ['Reference calls', false]].map(([label, auto]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2">
                <span className="flex items-center gap-2 text-[11.5px] text-ink-700">{auto ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <UserRoundCheck className="h-3.5 w-3.5 text-amber-500" />}{label}</span>
                <Badge tone={auto ? 'success' : 'warning'} size="sm">{auto ? 'Automated' : 'Manual'}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.business}
        description={active ? `${active.category} · ${active.city}` : undefined}
        footer={<><Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button><Button variant="danger" size="sm" onClick={() => setDecision('reject')} iconLeft={<X className="h-4 w-4" />}>Reject</Button><Button variant="success" size="sm" onClick={() => setDecision('approve')} iconLeft={<Check className="h-4 w-4" />}>Approve</Button></>}
      >
        {active && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-4">
              <Avatar name={active.business} size="xl" tone={active.tone} />
              <div><p className="text-[14px] font-bold text-ink-900">{active.business}</p><p className="text-[11px] text-ink-500">Owner: {active.owner}</p><div className="mt-1.5 flex gap-1.5"><StatusBadge status={active.status} size="sm" /><Badge tone="neutral" size="sm">{active.docs} documents</Badge></div></div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg border border-ink-200 p-2.5"><p className="text-[9px] text-ink-400">Email</p><p className="mt-0.5 font-semibold text-ink-800">{active.email}</p></div>
              <div className="rounded-lg border border-ink-200 p-2.5"><p className="text-[9px] text-ink-400">Phone</p><p className="mt-0.5 font-semibold text-ink-800">{active.phone}</p></div>
            </div>
            <div><p className="text-[12px] font-bold text-ink-900">Applicant notes</p><p className="mt-1 rounded-xl bg-ink-50 p-3 text-[11px] leading-5 text-ink-600">{active.notes}</p></div>
            <div>
              <p className="mb-2 text-[12px] font-bold text-ink-900">Documents</p>
              <div className="space-y-2">
                {[['GST certificate', 'verified'], ['PAN card', 'verified'], ['Owner Aadhaar', 'verified'], ['Cancelled cheque', 'pending'], ['Trade licence', 'pending']].map(([doc, state]) => (
                  <div key={doc} className="flex items-center gap-2 rounded-lg border border-ink-100 p-2.5">
                    <FileText className="h-4 w-4 text-ink-400" />
                    <span className="flex-1 text-[11px] text-ink-700">{doc}</span>
                    <Badge tone={state === 'verified' ? 'success' : 'warning'} size="sm">{state}</Badge>
                    <button className="text-[10px] font-bold text-brand-700">View</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[12px] font-bold text-ink-900">Review timeline</p>
              <Timeline items={[
                { title: 'Application submitted', description: `${active.docs} documents uploaded.`, time: fmtDate(active.submitted), done: true },
                { title: 'Automated checks passed', description: 'GSTIN, PAN and bank account verified.', time: 'Same day', done: true },
                { title: 'Manual review', description: 'Category fit and reference checks.', time: 'Today', current: true },
                { title: 'Decision', description: 'Approve or request more information.' },
              ]} />
            </div>
            <Textarea label="Reviewer note" placeholder="Record decision rationale (visible in audit log)…" />
          </div>
        )}
      </Drawer>

      <Modal
        open={!!decision}
        onClose={() => setDecision(null)}
        title={decision === 'approve' ? 'Approve this application?' : 'Reject this application?'}
        description={decision === 'approve' ? 'The vendor will be invited to complete onboarding and go live.' : 'The applicant will be emailed the reason and can resubmit.'}
        size="sm"
        icon={decision === 'approve' ? <BadgeCheck className="h-5 w-5" /> : <X className="h-5 w-5" />}
        footer={<><Button variant="outline" size="sm" onClick={() => setDecision(null)}>Cancel</Button><Button variant={decision === 'approve' ? 'success' : 'danger'} size="sm" onClick={decide}>{decision === 'approve' ? 'Approve application' : 'Reject application'}</Button></>}
      >
        <div className="space-y-3">
          {decision === 'reject' && <><p className="field-label">Reason</p><select className="h-11 w-full rounded-xl border border-ink-200 px-3 text-sm"><option>Incomplete documents</option><option>Licence expired</option><option>Outside service area</option><option>Category not supported</option><option>Failed reference check</option></select></>}
          <Textarea label={decision === 'approve' ? 'Welcome note' : 'Message to applicant'} placeholder="This will be included in the email…" />
          <p className="rounded-lg bg-ink-50 p-2.5 text-[10.5px] text-ink-500"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" /> The decision is recorded in the audit log with your name and IP.</p>
        </div>
      </Modal>
    </div>
  );
}
