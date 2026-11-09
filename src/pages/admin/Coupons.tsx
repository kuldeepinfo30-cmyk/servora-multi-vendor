import { useMemo, useState } from 'react';
import {
  BadgePercent,
  CalendarClock,
  Check,
  Copy,
  Percent,
  Plus,
  Search,
  TicketPercent,
  TrendingUp,
  Users,
} from 'lucide-react';
import { COUPONS } from '@/lib/data';
import type { Coupon } from '@/lib/types';
import { cn, fmtDate, inr, num } from '@/lib/utils';
import { useMockLoad } from '@/lib/hooks';
import { toast } from '@/store/toast';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Progress,
  Select,
  Skeleton,
  Switch,
  Tabs,
  Textarea,
} from '@/components/ui/primitives';
import { DataTable, ExportButton, PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { ConfirmDialog, Modal } from '@/components/ui/overlays';

type Draft = {
  code: string;
  description: string;
  type: Coupon['type'];
  value: string;
  minOrder: string;
  maxDiscount: string;
  limit: string;
  expires: string;
  scope: string;
};

const emptyDraft: Draft = {
  code: '',
  description: '',
  type: 'percent',
  value: '10',
  minOrder: '499',
  maxDiscount: '300',
  limit: '1000',
  expires: '2027-03-31',
  scope: 'All services',
};

export default function AdminCoupons() {
  const loading = useMockLoad(320);
  const [coupons, setCoupons] = useState<Coupon[]>(COUPONS);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const active = coupons.filter((c) => c.status === 'active');
  const totalUses = coupons.reduce((a, c) => a + c.uses, 0);
  const discountGiven = coupons.reduce((a, c) => a + c.uses * (c.type === 'flat' ? c.value : Math.min(c.maxDiscount ?? 999, c.value * 20)), 0);

  const rows = useMemo(
    () =>
      coupons.filter((c) => {
        if (tab !== 'all' && c.status !== tab) return false;
        if (query && !`${c.code} ${c.description} ${c.scope}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [coupons, tab, query],
  );

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setError('');
    setEditorOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setDraft({
      code: c.code,
      description: c.description,
      type: c.type,
      value: String(c.value),
      minOrder: String(c.minOrder),
      maxDiscount: String(c.maxDiscount ?? ''),
      limit: String(c.limit),
      expires: c.expires,
      scope: c.scope,
    });
    setError('');
    setEditorOpen(true);
  };

  const save = () => {
    if (!draft.code.trim()) return setError('A coupon code is required.');
    if (!/^[A-Z0-9]{4,16}$/.test(draft.code.trim())) return setError('Use 4–16 uppercase letters or numbers, e.g. WELCOME10.');
    if (!draft.description.trim()) return setError('Add a short description customers will understand.');
    if (!Number(draft.value) || Number(draft.value) <= 0) return setError('Enter a discount value greater than zero.');
    if (coupons.some((c) => c.code === draft.code.trim().toUpperCase() && c.id !== editing?.id)) return setError('That coupon code already exists.');

    const payload: Coupon = {
      id: editing?.id ?? `cp${Date.now()}`,
      code: draft.code.trim().toUpperCase(),
      description: draft.description.trim(),
      type: draft.type,
      value: Number(draft.value),
      minOrder: Number(draft.minOrder) || 0,
      maxDiscount: draft.type === 'percent' ? Number(draft.maxDiscount) || undefined : undefined,
      uses: editing?.uses ?? 0,
      limit: Number(draft.limit) || 100,
      expires: draft.expires,
      status: editing?.status ?? 'scheduled',
      scope: draft.scope,
    };

    setCoupons((list) => (editing ? list.map((c) => (c.id === editing.id ? payload : c)) : [payload, ...list]));
    setEditorOpen(false);
    toast.success(editing ? 'Coupon updated' : 'Coupon created', `${payload.code} is ${payload.status === 'active' ? 'live' : 'scheduled'} and ready to share.`);
  };

  const toggle = (c: Coupon) => {
    const next = c.status === 'active' ? 'disabled' : 'active';
    setCoupons((list) => list.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
    if (next === 'active') toast.success('Coupon enabled', `${c.code} can now be redeemed at checkout.`);
    else toast.warning('Coupon disabled', `${c.code} will be rejected at checkout.`);
  };

  const duplicate = (c: Coupon) => {
    const copy: Coupon = { ...c, id: `cp${Date.now()}`, code: `${c.code.slice(0, 9)}X`, uses: 0, status: 'scheduled' };
    setCoupons((list) => [copy, ...list]);
    toast.success('Coupon duplicated', `${copy.code} was created as a draft.`);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)}</div>
        <Skeleton className="h-[440px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Coupons & promotions"
        description="Create, schedule and measure discount codes without eroding margin."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-600">
            <TicketPercent className="h-3.5 w-3.5" /> Growth toolkit
          </span>
        }
        actions={
          <>
            <ExportButton
              filename="coupons.csv"
              rows={coupons}
              columns={[
                { key: 'code', label: 'Code' },
                { key: 'description', label: 'Description' },
                { key: 'uses', label: 'Uses' },
                { key: 'limit', label: 'Limit' },
                { key: 'expires', label: 'Expires' },
                { key: 'status', label: 'Status' },
              ]}
            />
            <Button size="sm" iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>Create coupon</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active coupons', value: active.length, hint: `${coupons.filter((c) => c.status === 'scheduled').length} scheduled`, icon: BadgePercent, tone: 'bg-brand-50 text-brand-600' },
          { label: 'Total redemptions', value: num(totalUses), hint: '+18.4% vs last month', icon: Users, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Estimated discount', value: inr(discountGiven, true), hint: 'lifetime value given', icon: Percent, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Conversion lift', value: '+6.2%', hint: 'coupon-assisted bookings', icon: TrendingUp, tone: 'bg-violet-50 text-violet-600' },
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
                { key: 'all', label: 'All', count: coupons.length },
                { key: 'active', label: 'Active', count: active.length },
                { key: 'scheduled', label: 'Scheduled' },
                { key: 'expired', label: 'Expired' },
                { key: 'disabled', label: 'Disabled' },
              ]}
            />
            <div className="relative lg:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search code or scope…"
                className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none"
              />
            </div>
          </div>

          <DataTable
            rows={rows}
            rowKey={(c) => c.id}
            empty={<EmptyState compact icon={<TicketPercent className="h-5 w-5" />} title="No coupons here" description="Create a coupon to fill empty slots and win back churned customers." action={<Button size="sm" onClick={openCreate}>Create coupon</Button>} />}
            columns={[
              {
                key: 'code',
                header: 'Coupon',
                render: (c) => (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('rounded-md border border-dashed px-2 py-0.5 font-mono text-[10.5px] font-bold tracking-wide', c.status === 'active' ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-ink-200 bg-ink-50 text-ink-500')}>
                        {c.code}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(c.code); toast.success('Code copied', `${c.code} is on your clipboard.`); }}
                        className="rounded p-0.5 text-ink-300 transition hover:text-brand-600"
                        aria-label="Copy code"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 line-clamp-1 max-w-[240px] text-[10px] text-ink-400">{c.description}</p>
                  </div>
                ),
              },
              {
                key: 'discount',
                header: 'Discount',
                render: (c) => (
                  <div>
                    <p className="text-[12px] font-bold text-ink-900">{c.type === 'percent' ? `${c.value}% off` : `${inr(c.value)} off`}</p>
                    <p className="text-[9.5px] text-ink-400">min {inr(c.minOrder)}{c.maxDiscount ? ` · cap ${inr(c.maxDiscount)}` : ''}</p>
                  </div>
                ),
              },
              { key: 'scope', header: 'Scope', render: (c) => <Badge tone="neutral" size="sm">{c.scope}</Badge> },
              {
                key: 'usage',
                header: 'Usage',
                render: (c) => (
                  <div className="w-28">
                    <div className="flex justify-between text-[9.5px] text-ink-400">
                      <span className="font-semibold text-ink-700">{num(c.uses)}</span>
                      <span>of {num(c.limit)}</span>
                    </div>
                    <Progress value={(c.uses / c.limit) * 100} tone={c.uses / c.limit > 0.85 ? 'warning' : 'brand'} size="sm" className="mt-1" />
                  </div>
                ),
              },
              { key: 'expires', header: 'Expires', render: (c) => <span className="inline-flex items-center gap-1 text-[10.5px] text-ink-500"><CalendarClock className="h-3 w-3 text-ink-400" /> {fmtDate(c.expires)}</span> },
              { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status === 'active' ? 'active' : c.status === 'scheduled' ? 'scheduled' : c.status === 'expired' ? 'expired_coupon' : 'disabled'} size="sm" /> },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (c) => (
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Switch checked={c.status === 'active'} onChange={() => toggle(c)} />
                    <Button size="xs" variant="outline" onClick={() => openEdit(c)}>Edit</Button>
                    <Button size="xs" variant="ghost" onClick={() => duplicate(c)} aria-label="Duplicate"><Copy className="h-3.5 w-3.5" /></Button>
                  </div>
                ),
              },
            ]}
          />
        </Card>

        <div className="space-y-4">
          <SectionCard title="Top performing codes" description="By redemptions">
            <div className="space-y-3">
              {[...coupons].sort((a, b) => b.uses - a.uses).slice(0, 4).map((c, i) => (
                <div key={c.id} className="flex items-center gap-2.5">
                  <span className="w-3 text-[10px] font-bold text-ink-300">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[10.5px] font-bold text-ink-800">{c.code}</p>
                    <p className="text-[9px] text-ink-400">{c.description}</p>
                  </div>
                  <span className="text-[11px] font-bold text-ink-900">{num(c.uses)}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Guardrails" description="Protect margin automatically" bodyClassName="space-y-2.5">
            {[
              'Maximum discount per order capped at ₹500 sitewide.',
              'Only one coupon can be applied per booking.',
              'Coupons never stack with vendor promotions.',
              'Codes pause automatically at the usage limit.',
              'All edits are recorded in the audit log.',
            ].map((t) => (
              <p key={t} className="flex gap-2 text-[10.5px] leading-5 text-ink-500"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {t}</p>
            ))}
          </SectionCard>

          <Card className="bg-gradient-to-br from-brand-600 to-indigo-800 p-4 text-white">
            <p className="flex items-center gap-1.5 text-[12px] font-bold"><BadgePercent className="h-4 w-4" /> Fill more slots</p>
            <p className="mt-1 text-[10.5px] leading-5 text-white/75">Weekday mornings convert 22% better with a time-boxed offer. Create a scheduled coupon for 10 AM–1 PM.</p>
            <button onClick={openCreate} className="mt-2.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[10.5px] font-bold backdrop-blur transition hover:bg-white/25">Build a slot-filler</button>
          </Card>
        </div>
      </div>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? `Edit ${editing.code}` : 'Create a coupon'}
        description="Customers apply the code at checkout. Limits and dates are enforced server-side."
        size="lg"
        icon={<TicketPercent className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditorOpen(false)}>Cancel</Button>
            {editing && (
              <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget(editing); setEditorOpen(false); }} className="mr-auto text-rose-600 hover:bg-rose-50">
                Delete
              </Button>
            )}
            <Button size="sm" onClick={save}>{editing ? 'Save changes' : 'Create coupon'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">{error}</div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Coupon code"
              required
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
              placeholder="WELCOME10"
              hint="Uppercase letters and numbers only."
            />
            <Select label="Discount type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Coupon['type'] })}>
              <option value="percent">Percentage off</option>
              <option value="flat">Flat amount off</option>
            </Select>
          </div>
          <Textarea
            label="Description"
            required
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="10% off your first booking"
            className="min-h-[72px]"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label={draft.type === 'percent' ? 'Percent off' : 'Amount off (₹)'} required type="number" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} />
            <Input label="Min order (₹)" type="number" value={draft.minOrder} onChange={(e) => setDraft({ ...draft, minOrder: e.target.value })} />
            {draft.type === 'percent' ? (
              <Input label="Max discount (₹)" type="number" value={draft.maxDiscount} onChange={(e) => setDraft({ ...draft, maxDiscount: e.target.value })} />
            ) : (
              <Input label="Expiry date" type="date" value={draft.expires} onChange={(e) => setDraft({ ...draft, expires: e.target.value })} />
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Usage limit" type="number" value={draft.limit} onChange={(e) => setDraft({ ...draft, limit: e.target.value })} />
            {draft.type === 'percent' ? (
              <Input label="Expiry date" type="date" value={draft.expires} onChange={(e) => setDraft({ ...draft, expires: e.target.value })} />
            ) : (
              <div />
            )}
            <Select label="Applies to" value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value })}>
              <option>All services</option>
              <option>Home Cleaning</option>
              <option>AC & Appliance</option>
              <option>Beauty & Spa</option>
              <option>Plumbing</option>
              <option>Moving & Storage</option>
            </Select>
          </div>
          <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Preview</p>
            <p className="mt-1 text-[13px] font-bold text-ink-900">{draft.code || 'YOURCODE'} — {draft.type === 'percent' ? `${draft.value || 0}% off` : `${inr(Number(draft.value) || 0)} off`}</p>
            <p className="text-[10.5px] text-ink-500">{draft.description || 'Add a description customers will see at checkout.'} · min order {inr(Number(draft.minOrder) || 0)}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-2.5 text-[10.5px] leading-5 text-amber-800">
            New coupons start as <b>scheduled</b>. Enable them from the table when you are ready to go live.
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          setCoupons((list) => list.filter((c) => c.id !== deleteTarget.id));
          toast.success('Coupon deleted', `${deleteTarget.code} can no longer be redeemed.`);
          setDeleteTarget(null);
          setEditing(null);
        }}
        title={`Delete ${deleteTarget?.code ?? 'coupon'}?`}
        description="Existing bookings that already used this code are unaffected. This cannot be undone."
        confirmLabel="Delete coupon"
      />
    </div>
  );
}
