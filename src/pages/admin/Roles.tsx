import { useMemo, useState } from 'react';
import {
  Check,
  KeyRound,
  Lock,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  ShieldQuestion,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMockLoad } from '@/lib/hooks';
import { toast } from '@/store/toast';
import { Avatar, Badge, Button, Card, Checkbox, EmptyState, Input, Select, Skeleton, Switch, Tabs, Textarea } from '@/components/ui/primitives';
import { DataTable, PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { ConfirmDialog, Modal } from '@/components/ui/overlays';

type TeamStatus = 'active' | 'invited' | 'suspended';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  tone: string;
  twoFa: boolean;
  lastActive: string;
  status: TeamStatus;
}

const teamSeed: Member[] = [
  { id: 'tm1', name: 'Aisha Khan', email: 'aisha@servora.in', role: 'Super admin', tone: 'violet', twoFa: true, lastActive: 'Just now', status: 'active' },
  { id: 'tm2', name: 'Rahul Nair', email: 'rahul@servora.in', role: 'Finance admin', tone: 'success', twoFa: true, lastActive: '18 min ago', status: 'active' },
  { id: 'tm3', name: 'Meera Joshi', email: 'meera@servora.in', role: 'Support admin', tone: 'warning', twoFa: true, lastActive: '2h ago', status: 'active' },
  { id: 'tm4', name: 'Arjun Desai', email: 'arjun@servora.in', role: 'Content manager', tone: 'brand', twoFa: false, lastActive: 'Yesterday', status: 'active' },
  { id: 'tm5', name: 'Ishita Bose', email: 'ishita@servora.in', role: 'Analyst', tone: 'info', twoFa: true, lastActive: '3d ago', status: 'active' },
  { id: 'tm6', name: 'Karan Shah', email: 'karan@servora.in', role: 'Support admin', tone: 'teal', twoFa: false, lastActive: '—', status: 'invited' },
];

const roleDefs = [
  { name: 'Super admin', tone: 'violet', members: 1, description: 'Full access including roles, settings and billing.', locked: true },
  { name: 'Finance admin', tone: 'success', members: 1, description: 'Payouts, refunds, commissions and financial reports.', locked: true },
  { name: 'Support admin', tone: 'warning', members: 2, description: 'Bookings, disputes, refunds and customer accounts.', locked: false },
  { name: 'Content manager', tone: 'brand', members: 1, description: 'CMS pages, reviews, SEO and categories.', locked: false },
  { name: 'Analyst', tone: 'info', members: 1, description: 'Read-only access to reports and dashboards.', locked: false },
];

const modules = [
  { key: 'dashboard', label: 'Dashboard & reports' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'customers', label: 'Customers' },
  { key: 'vendors', label: 'Vendors & applications' },
  { key: 'services', label: 'Services & categories' },
  { key: 'finance', label: 'Payments & payouts' },
  { key: 'disputes', label: 'Disputes & refunds' },
  { key: 'content', label: 'Content & reviews' },
  { key: 'settings', label: 'Platform settings' },
  { key: 'roles', label: 'Roles & access' },
];

const defaultPerms: Record<string, Record<string, { view: boolean; manage: boolean }>> = {
  'Super admin': Object.fromEntries(modules.map((m) => [m.key, { view: true, manage: true }])),
  'Finance admin': Object.fromEntries(modules.map((m) => [m.key, { view: ['dashboard', 'bookings', 'finance', 'disputes'].includes(m.key), manage: ['finance', 'disputes'].includes(m.key) }])),
  'Support admin': Object.fromEntries(modules.map((m) => [m.key, { view: ['dashboard', 'bookings', 'customers', 'vendors', 'disputes', 'content'].includes(m.key), manage: ['bookings', 'customers', 'disputes'].includes(m.key) }])),
  'Content manager': Object.fromEntries(modules.map((m) => [m.key, { view: ['dashboard', 'services', 'content'].includes(m.key), manage: ['content', 'services'].includes(m.key) }])),
  Analyst: Object.fromEntries(modules.map((m) => [m.key, { view: ['dashboard', 'bookings', 'customers', 'vendors', 'finance'].includes(m.key), manage: [] }])),
};

export default function AdminRoles() {
  const loading = useMockLoad(320);
  const [tab, setTab] = useState('team');
  const [team, setTeam] = useState<Member[]>(teamSeed);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [perms, setPerms] = useState(defaultPerms);
  const [selectedRole, setSelectedRole] = useState('Support admin');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ email: '', role: 'Support admin', message: '' });
  const [inviteError, setInviteError] = useState('');
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [twoFaRequired, setTwoFaRequired] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');

  const rows = useMemo(
    () =>
      team.filter((m) => {
        if (roleFilter !== 'all' && m.role !== roleFilter) return false;
        if (query && !`${m.name} ${m.email} ${m.role}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [team, query, roleFilter],
  );

  const sendInvite = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email)) return setInviteError('Enter a valid work email address.');
    if (team.some((m) => m.email.toLowerCase() === invite.email.toLowerCase())) return setInviteError('That person is already on the team.');
    const person: Member = {
      id: `tm${Date.now()}`,
      name: invite.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: invite.email,
      role: invite.role,
      tone: 'brand',
      twoFa: false,
      lastActive: '—',
      status: 'invited',
    };
    setTeam((t) => [...t, person]);
    setInviteOpen(false);
    setInvite({ email: '', role: 'Support admin', message: '' });
    setInviteError('');
    toast.success('Invitation sent', `${person.email} can join with the ${person.role} role.`);
  };

  const togglePerm = (role: string, moduleKey: string, kind: 'view' | 'manage') => {
    if (roleDefs.find((r) => r.name === role)?.locked) {
      toast.error('Role is locked', 'Super admin and finance admin permissions cannot be edited for compliance reasons.');
      return;
    }
    setPerms((p) => {
      const current = p[role][moduleKey];
      const next = { ...current, [kind]: !current[kind] };
      if (kind === 'manage' && next.manage) next.view = true;
      if (kind === 'view' && !next.view) next.manage = false;
      return { ...p, [role]: { ...p[role], [moduleKey]: next } };
    });
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
        title="Roles & access"
        description="Control who can see and do what. Every permission change is recorded in the audit log."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-violet-600">
            <ShieldCheck className="h-3.5 w-3.5" /> Security & governance
          </span>
        }
        actions={
          <>
            <Button variant="outline" size="sm" iconLeft={<KeyRound className="h-4 w-4" />} onClick={() => toast.info('Access review', 'The last privileged-access review was completed on 28 Oct 2026.')}>
              Access review
            </Button>
            <Button size="sm" iconLeft={<UserPlus className="h-4 w-4" />} onClick={() => setInviteOpen(true)}>Invite member</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Team members', value: team.length, hint: `${team.filter((m) => m.status === 'invited').length} pending invite`, icon: Users, tone: 'bg-brand-50 text-brand-600' },
          { label: 'Custom roles', value: roleDefs.length, hint: '2 locked for compliance', icon: ShieldCheck, tone: 'bg-violet-50 text-violet-600' },
          { label: '2FA coverage', value: `${Math.round((team.filter((m) => m.twoFa).length / team.length) * 100)}%`, hint: 'required for all admins', icon: Lock, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Failed login attempts', value: '7', hint: 'last 24 hours', icon: ShieldQuestion, tone: 'bg-amber-50 text-amber-600' },
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

      <div className="mb-5 mt-5 overflow-x-auto">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { key: 'team', label: 'Team', count: team.length },
            { key: 'roles', label: 'Roles & permissions', count: roleDefs.length },
            { key: 'security', label: 'Security policies' },
          ]}
        />
      </div>

      {tab === 'team' && (
        <Card className="animate-fade-up overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[13px] font-bold text-ink-900">Admin team</p>
              <p className="text-[10.5px] text-ink-400">People with access to the Servora console.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-[11.5px] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none">
                <option value="all">All roles</option>
                {roleDefs.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
              <div className="relative sm:w-60">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" />
              </div>
            </div>
          </div>

          <DataTable
            rows={rows}
            rowKey={(m) => m.id}
            empty={<EmptyState compact icon={<Users className="h-5 w-5" />} title="No team members match" description="Try a different search or invite someone new." action={<Button size="sm" onClick={() => setInviteOpen(true)}>Invite member</Button>} />}
            columns={[
              {
                key: 'person',
                header: 'Member',
                render: (m) => (
                  <div className="flex items-center gap-2.5">
                    <Avatar name={m.name} size="sm" tone={m.tone} online={m.status === 'active'} />
                    <div>
                      <p className="text-[11.5px] font-bold text-ink-900">{m.name}</p>
                      <p className="text-[9.5px] text-ink-400">{m.email}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'role', header: 'Role', render: (m) => <Badge tone={roleDefs.find((r) => r.name === m.role)?.tone ?? 'neutral'} size="sm">{m.role}</Badge> },
              {
                key: '2fa',
                header: '2FA',
                render: (m) => (
                  <Badge tone={m.twoFa ? 'success' : 'warning'} size="sm" dot>{m.twoFa ? 'Enabled' : 'Not set up'}</Badge>
                ),
              },
              { key: 'last', header: 'Last active', render: (m) => <span className="text-[10.5px] text-ink-500">{m.lastActive}</span> },
              { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status === 'invited' ? 'pending' : m.status} size="sm" label={m.status === 'invited' ? 'Invited' : undefined} /> },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (m) => (
                  <div className="flex justify-end gap-1">
                    {m.status === 'invited' ? (
                      <>
                        <Button size="xs" variant="outline" onClick={() => toast.success('Invite resent', `A fresh link was sent to ${m.email}.`)}>Resend</Button>
                        <Button size="xs" variant="ghost" onClick={() => setRemoveTarget(m)}>Revoke</Button>
                      </>
                    ) : (
                      <>
                        <Button size="xs" variant="outline" onClick={() => toast.info('Member profile', `${m.name} · ${m.role}. Role changes are available in the roles tab.`)}>Manage</Button>
                        <Button size="xs" variant="ghost" onClick={() => setRemoveTarget(m)} className="text-rose-600 hover:bg-rose-50">Remove</Button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
          />

          <div className="border-t border-ink-100 bg-ink-50/50 px-4 py-3">
            <p className="text-[10.5px] text-ink-400">Admin accounts are protected by mandatory 2FA and a 30-minute idle timeout. Access is reviewed quarterly.</p>
          </div>
        </Card>
      )}

      {tab === 'roles' && (
        <div className="animate-fade-up grid gap-4 xl:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <SectionCard title="Roles" description="Select a role to edit">
              <div className="space-y-1.5">
                {roleDefs.map((r) => (
                  <button
                    key={r.name}
                    onClick={() => setSelectedRole(r.name)}
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition',
                      selectedRole === r.name ? 'border-brand-300 bg-brand-50/60' : 'border-transparent hover:bg-ink-50',
                    )}
                  >
                    <Badge tone={r.tone} size="sm" className="mt-0.5">{r.members}</Badge>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 text-[11.5px] font-bold text-ink-900">
                        {r.name}
                        {r.locked && <Lock className="h-3 w-3 text-ink-400" />}
                      </p>
                      <p className="mt-0.5 text-[9.5px] leading-4 text-ink-400">{r.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </SectionCard>

            <Card className="p-4">
              <p className="text-[11px] font-bold text-ink-800">Need a custom role?</p>
              <p className="mt-1 text-[10px] leading-4 text-ink-500">Clone an existing role and tailor module-level permissions for a specific team.</p>
              <Button size="xs" variant="outline" className="mt-2.5" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={() => toast.info('Custom roles', 'Name the role, choose a base template and adjust its permissions.')}>Create role</Button>
            </Card>
          </div>

          <SectionCard
            title={`${selectedRole} permissions`}
            description={roleDefs.find((r) => r.name === selectedRole)?.locked ? 'This role is locked for compliance and cannot be edited.' : 'Toggle view and manage access per module.'}
            action={<Badge tone="neutral" size="sm">Changes are audited</Badge>}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-ink-200">
                    <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-wide text-ink-400">Module</th>
                    <th className="pb-2 px-3 text-center text-[10px] font-bold uppercase tracking-wide text-ink-400">View</th>
                    <th className="pb-2 pl-3 text-center text-[10px] font-bold uppercase tracking-wide text-ink-400">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((m) => {
                    const perm = perms[selectedRole]?.[m.key] ?? { view: false, manage: false };
                    return (
                      <tr key={m.key} className="border-b border-ink-100 last:border-0">
                        <td className="py-2.5 pr-3">
                          <p className="text-[11.5px] font-semibold text-ink-700">{m.label}</p>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-flex justify-center">
                            <Checkbox checked={perm.view} onChange={() => togglePerm(selectedRole, m.key, 'view')} />
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 text-center">
                          <span className="inline-flex justify-center">
                            <Checkbox checked={perm.manage} onChange={() => togglePerm(selectedRole, m.key, 'manage')} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ink-50 px-3 py-2.5">
              <p className="text-[10.5px] text-ink-500">
                {selectedRole}: {modules.filter((m) => perms[selectedRole]?.[m.key]?.view).length} modules visible ·{' '}
                {modules.filter((m) => perms[selectedRole]?.[m.key]?.manage).length} editable
              </p>
              <div className="flex gap-2">
                <Button size="xs" variant="outline" onClick={() => { setPerms(defaultPerms); toast.info('Permissions reset', 'All roles were restored to the default template.'); }}>Reset defaults</Button>
                <Button size="xs" onClick={() => toast.success('Permissions saved', `${selectedRole} access has been updated.`)}>Save changes</Button>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'security' && (
        <div className="animate-fade-up grid gap-4 lg:grid-cols-2">
          <SectionCard title="Authentication policy" description="Applies to every admin account">
            <div className="space-y-4">
              <Switch checked={twoFaRequired} onChange={(v) => { setTwoFaRequired(v); if (v) toast.success('2FA enforced', 'All admins must use an authenticator app.'); else toast.warning('2FA requirement removed', 'Admins can sign in without a second factor.'); }} label="Require two-factor authentication" description="TOTP authenticator required at every sign-in." />
              <div className="border-t border-ink-100 pt-3">
                <Select label="Idle session timeout" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)}>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="240">4 hours</option>
                </Select>
              </div>
              <Switch checked onChange={() => toast.info('Password policy', 'Minimum 12 characters with a number and symbol is already enforced.')} label="Strong password policy" description="Minimum 12 characters, one number and one symbol." />
              <Switch checked onChange={() => toast.info('IP allow-list', 'Console access is currently restricted to India and Singapore regions.')} label="Restrict by region" description="Only allow console sign-ins from approved regions." />
            </div>
          </SectionCard>

          <SectionCard title="Session activity" description="Recent privileged sign-ins">
            <div className="space-y-3">
              {[
                { who: 'Aisha Khan', where: 'Mumbai, IN · Chrome', when: 'Just now', ok: true },
                { who: 'Rahul Nair', where: 'Pune, IN · Safari', when: '18 min ago', ok: true },
                { who: 'Meera Joshi', where: 'Bengaluru, IN · Chrome', when: '2h ago', ok: true },
                { who: 'Unknown', where: 'Frankfurt, DE · API', when: '4h ago', ok: false },
              ].map((s) => (
                <div key={s.who + s.when} className="flex items-center gap-2.5">
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', s.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                    {s.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-ink-800">{s.who}</p>
                    <p className="text-[9.5px] text-ink-400">{s.where}</p>
                  </div>
                  <span className="text-[9.5px] text-ink-400">{s.when}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50 p-2.5 text-[10.5px] leading-5 text-rose-800">
              One blocked sign-in from an unrecognised region. The account was not compromised.
            </div>
          </SectionCard>

          <SectionCard title="API keys" description="Server-to-server integrations" className="lg:col-span-2">
            <div className="divide-y divide-ink-100">
              {[
                { name: 'Payment reconciliation', prefix: 'sk_live_4f2a…', created: '12 Aug 2026', lastUsed: '2 min ago', scope: 'Read payments' },
                { name: 'Logistics partner', prefix: 'sk_live_91bc…', created: '03 Jun 2026', lastUsed: '1h ago', scope: 'Read bookings' },
                { name: 'Analytics warehouse', prefix: 'sk_live_77de…', created: '19 Jan 2026', lastUsed: 'Yesterday', scope: 'Read-only reports' },
              ].map((k) => (
                <div key={k.name} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-bold text-ink-800">{k.name}</p>
                    <p className="font-mono text-[9.5px] text-ink-400">{k.prefix} · {k.scope} · created {k.created}</p>
                  </div>
                  <Badge tone="success" size="sm" dot>Active</Badge>
                  <span className="text-[9.5px] text-ink-400">Used {k.lastUsed}</span>
                  <Button size="xs" variant="outline" onClick={() => toast.warning('Key rotation scheduled', 'The integration has 24 hours to switch to the new key.')}>Rotate</Button>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Button size="xs" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={() => toast.info('New API key', 'Choose scopes and an expiry before generating the key.')}>Generate key</Button>
            </div>
          </SectionCard>
        </div>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a team member"
        description="They will receive a secure email link to set a password and enrol in 2FA."
        size="md"
        icon={<Mail className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={sendInvite}>Send invitation</Button>
          </>
        }
      >
        <div className="space-y-3">
          {inviteError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">{inviteError}</div>}
          <Input label="Work email" required type="email" placeholder="name@servora.in" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
          <Select label="Role" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
            {roleDefs.map((r) => <option key={r.name}>{r.name}</option>)}
          </Select>
          <Textarea label="Personal message (optional)" className="min-h-[72px] text-[12px]" placeholder="Welcome to the team…" value={invite.message} onChange={(e) => setInvite({ ...invite, message: e.target.value })} />
          <div className="rounded-lg bg-amber-50 p-2.5 text-[10.5px] leading-5 text-amber-800">
            Invitations expire after 72 hours. The new member must enable 2FA before accessing the console.
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (!removeTarget) return;
          setTeam((t) => t.filter((m) => m.id !== removeTarget.id));
          toast.success('Access removed', `${removeTarget.name} can no longer access the console.`);
          setRemoveTarget(null);
        }}
        title={`Remove ${removeTarget?.name}?`}
        description="Their sessions will end immediately. Any work they own will need to be reassigned."
        confirmLabel="Remove access"
      />
    </div>
  );
}
