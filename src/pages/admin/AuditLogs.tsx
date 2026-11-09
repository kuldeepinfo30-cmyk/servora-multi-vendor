import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  Copy,
  Download,
  Filter,
  KeyRound,
  RefreshCcw,
  ScrollText,
  Search,
  Server,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { AUDIT_LOGS } from '@/lib/data';
import { cn, downloadFile } from '@/lib/utils';
import { useMockLoad } from '@/lib/hooks';
import { toast } from '@/store/toast';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Skeleton,
  Tabs,
} from '@/components/ui/primitives';
import { DataTable, ExportButton, InfoRow, PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { Drawer } from '@/components/ui/overlays';

interface AuditRow {
  id: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  ip: string;
  time: string;
  tone: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  requestId: string;
  source: string;
  agent: string;
  detail: string;
  before?: string;
  after?: string;
}

const extra: AuditRow[] = [
  { id: 'al11', actor: 'System', role: 'Automation', action: 'Auto-approved payout batch #1842', entity: 'Payout batch', entityId: 'PO-2026-1842', ip: '10.0.4.12', time: '12 min ago', tone: 'success', requestId: 'req_9f2a71', source: 'Payout worker', agent: 'servora-worker/2.4', detail: 'Batch under ₹5L passed automated risk checks.' },
  { id: 'al12', actor: 'Meera Joshi', role: 'Support Admin', action: 'Viewed customer profile', entity: 'Customer', entityId: 'u7', ip: '27.61.18.55', time: '22 min ago', tone: 'neutral', requestId: 'req_4b7c22', source: 'Admin console', agent: 'Chrome 141 / macOS', detail: 'Read-only profile view. No fields changed.' },
  { id: 'al13', actor: 'Rahul Nair', role: 'Finance Admin', action: 'Failed sign-in attempt', entity: 'Session', entityId: 'auth-55120', ip: '103.21.44.91', time: '35 min ago', tone: 'danger', requestId: 'req_1e9d04', source: 'Admin console', agent: 'Chrome 141 / Windows', detail: 'Incorrect password. Account locked for 15 minutes after third attempt.' },
  { id: 'al14', actor: 'Aisha Khan', role: 'Super Admin', action: 'Changed commission for Glow Studio to 15%', entity: 'Vendor', entityId: 'v5', ip: '103.21.44.18', time: '1h ago', tone: 'warning', requestId: 'req_7a3f88', source: 'Admin console', agent: 'Chrome 141 / macOS', detail: 'Vendor-specific override set for premium beauty category.', before: '12%', after: '15%' },
  { id: 'al15', actor: 'Arjun Desai', role: 'Content Manager', action: 'Created CMS page: Festive cleaning guide', entity: 'CMS page', entityId: 'pg7', ip: '49.36.12.64', time: '2h ago', tone: 'info', requestId: 'req_2c18bd', source: 'CMS', agent: 'Chrome 140 / Windows', detail: 'Saved as scheduled — auto-publishes on 12 Nov 2026.' },
  { id: 'al16', actor: 'System', role: 'Automation', action: 'Blocked 4 spam reviews', entity: 'Review', entityId: 'mod-8841', ip: '127.0.0.1', time: '3h ago', tone: 'neutral', requestId: 'req_5d0ae1', source: 'Moderation worker', agent: 'servora-worker/2.4', detail: 'Detected repeated promotional text across four accounts.' },
  { id: 'al17', actor: 'Ishita Bose', role: 'Analyst', action: 'Exported customer cohort report', entity: 'Report', entityId: 'report-cohort-nov', ip: '27.61.18.90', time: '5h ago', tone: 'neutral', requestId: 'req_8b6f10', source: 'Reports', agent: 'Safari 18 / macOS', detail: 'CSV export containing aggregated, non-personal data only.' },
  { id: 'al18', actor: 'Aisha Khan', role: 'Super Admin', action: 'Enabled IP allow-list enforcement', entity: 'Security', entityId: 'rule-ip-allow', ip: '103.21.44.18', time: '6h ago', tone: 'brand', requestId: 'req_0f4a77', source: 'Settings', agent: 'Chrome 141 / macOS', detail: 'Console sign-ins restricted to India and Singapore.' },
  { id: 'al19', actor: 'Rahul Nair', role: 'Finance Admin', action: 'Rejected payout for QuickFix Handyman', entity: 'Payout', entityId: 'PO-2026-1839', ip: '49.36.12.90', time: '8h ago', tone: 'danger', requestId: 'req_3e7b51', source: 'Admin console', agent: 'Chrome 141 / Windows', detail: 'Bank account name mismatch. Vendor asked to re-verify.' },
  { id: 'al20', actor: 'Meera Joshi', role: 'Support Admin', action: 'Issued full refund for SRV-24138', entity: 'Booking', entityId: 'b3', ip: '27.61.18.55', time: '10h ago', tone: 'warning', requestId: 'req_6a9c30', source: 'Disputes', agent: 'Chrome 141 / macOS', detail: 'Vendor unresponsive for 48h. Refund charged to vendor next payout.' },
];

const base: AuditRow[] = AUDIT_LOGS.map((l, i) => ({
  ...l,
  requestId: `req_${(100000 + i * 7331).toString(16)}`,
  source: l.role === 'Automation' ? 'Automation' : 'Admin console',
  agent: l.role === 'Automation' ? 'servora-worker/2.4' : i % 2 === 0 ? 'Chrome 141 / macOS' : 'Chrome 141 / Windows',
  detail:
    l.tone === 'danger'
      ? 'Privileged action performed after a risk review. Session was verified with 2FA.'
      : l.tone === 'warning'
        ? 'This change affects pricing or money movement and has been flagged for the daily finance review.'
        : 'Standard administrative action recorded automatically for compliance.',
}));

const allLogs = [...base, ...extra];

const toneLabel: Record<string, string> = {
  success: 'Success',
  warning: 'Review',
  danger: 'Critical',
  info: 'Info',
  brand: 'Config',
  neutral: 'Routine',
};

const toneForBadge: Record<string, string> = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  brand: 'brand',
  neutral: 'neutral',
};

export default function AdminAuditLogs() {
  const loading = useMockLoad(340);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [actor, setActor] = useState('all');
  const [active, setActive] = useState<AuditRow | null>(null);

  const rows = useMemo(
    () =>
      allLogs.filter((l) => {
        if (tab === 'privileged' && !['danger', 'warning', 'brand'].includes(l.tone)) return false;
        if (tab === 'security' && !['danger', 'brand'].includes(l.tone) && !/sign-in|security|ip allow/i.test(l.action)) return false;
        if (tab === 'finance' && !/payout|refund|commission|reconcil/i.test(l.action + l.entity)) return false;
        if (actor !== 'all' && l.actor !== actor) return false;
        if (query && !`${l.actor} ${l.action} ${l.entity} ${l.entityId} ${l.ip}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [tab, query, actor],
  );

  const actors = Array.from(new Set(allLogs.map((l) => l.actor)));
  const critical = allLogs.filter((l) => l.tone === 'danger').length;

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success('Copied', `${label} is on your clipboard.`);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)}</div>
        <Skeleton className="h-[480px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="An immutable record of every privileged action across the marketplace. Retained for seven years."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-violet-600">
            <ScrollText className="h-3.5 w-3.5" /> Compliance trail
          </span>
        }
        actions={
          <>
            <Badge tone="success" size="sm" icon={<ShieldCheck className="h-3 w-3" />}>Tamper-evident</Badge>
            <ExportButton
              filename="audit-logs.csv"
              rows={allLogs}
              columns={[
                { key: 'time', label: 'Time' },
                { key: 'actor', label: 'Actor' },
                { key: 'role', label: 'Role' },
                { key: 'action', label: 'Action' },
                { key: 'entity', label: 'Entity' },
                { key: 'entityId', label: 'Entity ID' },
                { key: 'ip', label: 'IP' },
              ]}
            />
            <Button size="sm" variant="outline" iconLeft={<RefreshCcw className="h-4 w-4" />} onClick={() => toast.success('Logs refreshed', 'The latest entries have been loaded.')}>Refresh</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Events today', value: allLogs.length + 128, hint: '+14% vs yesterday', icon: Activity, tone: 'bg-brand-50 text-brand-600' },
          { label: 'Privileged actions', value: allLogs.filter((l) => ['danger', 'warning', 'brand'].includes(l.tone)).length, hint: 'require finance or owner review', icon: KeyRound, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Critical events', value: critical, hint: 'last 24 hours', icon: AlertTriangle, tone: 'bg-rose-50 text-rose-600' },
          { label: 'Active admins', value: actors.filter((a) => a !== 'System').length, hint: 'all 2FA verified', icon: UserRound, tone: 'bg-emerald-50 text-emerald-600' },
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
              { key: 'all', label: 'All events', count: allLogs.length },
              { key: 'privileged', label: 'Privileged', count: allLogs.filter((l) => ['danger', 'warning', 'brand'].includes(l.tone)).length },
              { key: 'security', label: 'Security' },
              { key: 'finance', label: 'Finance' },
            ]}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-ink-400" />
              <select value={actor} onChange={(e) => setActor(e.target.value)} className="h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-[11.5px] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none">
                <option value="all">All actors</option>
                {actors.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search action, entity, IP…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" />
            </div>
          </div>
        </div>

        <DataTable
          rows={rows}
          rowKey={(l) => l.id}
          onRowClick={setActive}
          empty={<EmptyState compact icon={<ScrollText className="h-5 w-5" />} title="No matching events" description="Adjust the filters or search for a different actor." />}
          columns={[
            { key: 'time', header: 'Time', render: (l) => <div><p className="text-[10.5px] font-semibold text-ink-700">{l.time}</p><p className="text-[9px] text-ink-400">just now · IST</p></div> },
            {
              key: 'actor',
              header: 'Actor',
              render: (l) => (
                <div className="flex items-center gap-2">
                  <Avatar name={l.actor} size="xs" tone={l.actor === 'System' ? 'neutral' : l.tone} />
                  <div>
                    <p className="text-[11px] font-semibold text-ink-800">{l.actor}</p>
                    <p className="text-[9px] text-ink-400">{l.role}</p>
                  </div>
                </div>
              ),
            },
            { key: 'action', header: 'Action', render: (l) => <span className="line-clamp-1 max-w-[280px] text-[10.5px] text-ink-600">{l.action}</span> },
            { key: 'entity', header: 'Entity', render: (l) => <div><p className="text-[10.5px] text-ink-700">{l.entity}</p><p className="font-mono text-[9px] text-ink-400">{l.entityId}</p></div> },
            { key: 'ip', header: 'IP address', render: (l) => <span className="font-mono text-[9.5px] text-ink-500">{l.ip}</span> },
            { key: 'severity', header: 'Severity', render: (l) => <Badge tone={toneForBadge[l.tone]} size="sm" dot>{toneLabel[l.tone]}</Badge> },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (l) => (
                <Button size="xs" variant="outline" onClick={(e) => { e.stopPropagation(); setActive(l); }}>Details</Button>
              ),
            },
          ]}
          footer={
            <div className="flex flex-col items-center justify-between gap-2 border-t border-ink-100 px-4 py-3 sm:flex-row">
              <p className="text-[10.5px] text-ink-400">Showing {rows.length} of {allLogs.length} loaded events · retention 7 years</p>
              <Button size="xs" variant="ghost" iconLeft={<Download className="h-3.5 w-3.5" />} onClick={() => { downloadFile('audit-page.csv', allLogs.map((l) => `${l.time},${l.actor},${l.action}`).join('\n'), 'text/csv'); toast.success('Page exported', 'The filtered audit events were downloaded.'); }}>
                Export this view
              </Button>
            </div>
          }
        />
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Integrity" description="How the trail is protected" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: 'Append-only', body: 'Entries can never be edited or deleted, even by super admins.', icon: ShieldCheck, tone: 'bg-emerald-50 text-emerald-600' },
              { title: 'Hash chained', body: 'Each record includes the hash of the previous entry.', icon: Server, tone: 'bg-brand-50 text-brand-600' },
              { title: '7-year retention', body: 'Stored in encrypted, versioned cold storage.', icon: ScrollText, tone: 'bg-violet-50 text-violet-600' },
            ].map((t) => (
              <div key={t.title} className="rounded-xl border border-ink-100 p-3.5">
                <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', t.tone)}><t.icon className="h-4 w-4" /></span>
                <p className="mt-2 text-[11.5px] font-bold text-ink-900">{t.title}</p>
                <p className="mt-0.5 text-[10px] leading-4 text-ink-500">{t.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 font-mono text-[9.5px] text-ink-500">
            <Check className="h-3 w-3 text-emerald-500" /> Last integrity check: 7 Nov 2026, 04:00 IST — chain valid (1,284,902 entries)
          </div>
        </SectionCard>

        <SectionCard title="Top actors" description="Events in the last 24h">
          <div className="space-y-3">
            {[
              ['Aisha Khan', 42, 'violet'],
              ['Meera Joshi', 31, 'warning'],
              ['Rahul Nair', 24, 'success'],
              ['System', 18, 'neutral'],
              ['Arjun Desai', 9, 'brand'],
            ].map(([name, count, tone]) => (
              <div key={String(name)} className="flex items-center gap-2.5">
                <Avatar name={String(name)} size="xs" tone={String(tone)} />
                <span className="flex-1 text-[10.5px] font-semibold text-ink-700">{name}</span>
                <span className="text-[10px] font-bold text-ink-900">{count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title="Audit event"
        description={active ? `${active.id.toUpperCase()} · ${active.time}` : undefined}
        width="max-w-xl"
        footer={
          active ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button>
              <Button size="sm" variant="outline" iconLeft={<Download className="h-3.5 w-3.5" />} onClick={() => { downloadFile(`${active.id}.json`, JSON.stringify(active, null, 2), 'application/json'); toast.success('Event exported', 'A signed JSON copy of the event was downloaded.'); }}>Export JSON</Button>
            </>
          ) : null
        }
      >
        {active && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge tone={toneForBadge[active.tone]} size="sm" dot>{toneLabel[active.tone]}</Badge>
              <span className="font-mono text-[9.5px] text-ink-400">{active.requestId}</span>
            </div>

            <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4">
              <p className="text-[9.5px] font-bold uppercase tracking-wide text-ink-400">Action</p>
              <p className="mt-1 text-[13px] font-bold leading-6 text-ink-900">{active.action}</p>
              <p className="mt-1.5 text-[11px] leading-5 text-ink-500">{active.detail}</p>
            </div>

            <div className="divide-y divide-ink-100">
              <InfoRow label="Actor" value={active.actor} />
              <InfoRow label="Role" value={active.role} />
              <InfoRow label="Entity" value={active.entity} />
              <InfoRow label="Entity ID" value={active.entityId} mono />
              <InfoRow label="IP address" value={active.ip} mono />
              <InfoRow label="Source" value={active.source} />
              <InfoRow label="User agent" value={active.agent} />
              <InfoRow label="Request ID" value={active.requestId} mono />
              <InfoRow label="Timestamp" value={`${active.time} · 7 Nov 2026`} />
            </div>

            {(active.before || active.after) && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Value change</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white p-2.5">
                    <p className="text-[9px] uppercase text-ink-400">Before</p>
                    <p className="text-[12px] font-bold text-ink-700">{active.before ?? '—'}</p>
                  </div>
                  <div className="rounded-lg bg-white p-2.5">
                    <p className="text-[9px] uppercase text-ink-400">After</p>
                    <p className="text-[12px] font-bold text-emerald-700">{active.after ?? '—'}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Raw payload</p>
                <button onClick={() => copy(JSON.stringify(active, null, 2), 'Raw payload')} className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600">
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <pre className="overflow-x-auto rounded-xl bg-ink-950 p-3.5 text-[9.5px] leading-5 text-ink-300">
{JSON.stringify({ id: active.id, actor: active.actor, action: active.action, entity: active.entity, entityId: active.entityId, ip: active.ip, requestId: active.requestId, severity: active.tone }, null, 2)}
              </pre>
            </div>

            <div className="rounded-lg bg-ink-50 p-3 text-[10px] leading-5 text-ink-500">
              This event is hash-chained to the previous record and cannot be modified. Contact the compliance lead to request a signed extract.
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
