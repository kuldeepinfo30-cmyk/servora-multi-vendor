import { useState } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  Check,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { getVendorStaff } from '@/lib/data';
import { cn, inr } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, Card, EmptyState, Input, Select, Skeleton, Switch, Tabs } from '@/components/ui/primitives';
import { PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { Drawer, Dropdown, DropdownItem, Modal } from '@/components/ui/overlays';
import type { Staff } from '@/lib/types';

export default function VendorStaff() {
  const { user } = useAuth();
  const loading = useMockLoad(360);
  const base = getVendorStaff(user?.vendorId ?? 'v1');

  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Staff | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, Staff['status']>>({});
  const [newStaff, setNewStaff] = useState({ name: '', role: '', email: '', phone: '', commission: 8 });

  const staff = base.map((s) => ({ ...s, status: statusMap[s.id] ?? s.status }));

  const rows = staff.filter((s) => {
    if (tab !== 'all' && s.status !== tab) return false;
    if (query && !`${s.name} ${s.role}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44" />)}</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Add team members, assign services and track performance. Staff log in with their own mobile number."
        actions={
          <>
            <Button variant="outline" size="md" iconLeft={<CalendarDays className="h-4 w-4" />} onClick={() => toast.info('Team calendar', 'Open the Calendar page to see staff schedules.')}>Team schedule</Button>
            <Button size="md" iconLeft={<UserPlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add staff</Button>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Team size', value: staff.length, hint: `${staff.filter((s) => s.status === 'active').length} active`, tone: 'brand' },
          { label: 'Avg. rating', value: staff.length ? (staff.reduce((a, s) => a + s.rating, 0) / staff.length).toFixed(1) : '—', hint: 'across all staff', tone: 'violet' },
          { label: 'Jobs delivered', value: staff.reduce((a, s) => a + s.jobs, 0).toLocaleString('en-IN'), hint: 'lifetime', tone: 'success' },
          { label: 'Staff payouts', value: inr(staff.reduce((a, s) => a + Math.round(s.jobs * 120 * (s.commission / 100)), 0)), hint: 'est. this quarter', tone: 'teal' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-[11px] font-semibold text-ink-500">{s.label}</p>
            <p className="mt-1 font-display text-[22px] font-extrabold text-ink-900">{s.value}</p>
            <p className="mt-0.5 text-[10px] text-ink-400">{s.hint}</p>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { key: 'all', label: 'All staff', count: staff.length },
            { key: 'active', label: 'Active', count: staff.filter((s) => s.status === 'active').length },
            { key: 'on_leave', label: 'On leave', count: staff.filter((s) => s.status === 'on_leave').length },
            { key: 'inactive', label: 'Inactive', count: staff.filter((s) => s.status === 'inactive').length },
          ]}
        />
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search staff…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Users className="h-5 w-5" />} title="No staff match this view" description="Invite team members so you can accept more bookings and assign jobs." action={<Button size="sm" onClick={() => setAddOpen(true)} iconLeft={<Plus className="h-4 w-4" />}>Add staff</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => (
            <Card key={s.id} hover className="overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <Avatar name={s.name} size="lg" tone={s.tone} online={s.status === 'active'} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-ink-900">{s.name}</p>
                      <p className="truncate text-[10.5px] text-ink-500">{s.role}</p>
                    </div>
                    <Dropdown trigger={<button className="rounded-lg p-1 text-ink-400 hover:bg-ink-100"><MoreHorizontal className="h-4 w-4" /></button>}>
                      {(close) => (
                        <div>
                          <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => { close(); setActive(s); }}>Edit staff</DropdownItem>
                          <DropdownItem icon={<CalendarDays className="h-4 w-4" />} onClick={() => { close(); toast.info('Schedule', 'Team schedules are available in Calendar.'); }}>View schedule</DropdownItem>
                          <DropdownItem icon={<Mail className="h-4 w-4" />} onClick={() => { close(); toast.success('Invite resent', `Login link sent to ${s.email}.`); }}>Resend invite</DropdownItem>
                          <div className="my-1 h-px bg-ink-100" />
                          <DropdownItem danger icon={<Trash2 className="h-4 w-4" />} onClick={() => { close(); setStatusMap((m) => ({ ...m, [s.id]: 'inactive' })); toast.success('Staff deactivated', 'They can no longer accept new jobs.'); }}>Deactivate</DropdownItem>
                        </div>
                      )}
                    </Dropdown>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={s.status} size="sm" />
                    <Badge tone="neutral" size="sm">{s.experience} exp</Badge>
                    {s.rating >= 4.9 && <Badge tone="amber" size="sm"><BadgeCheck className="h-3 w-3" /> Top rated</Badge>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-y border-ink-100 bg-ink-50/50 px-4 py-2.5">
                <div><p className="text-[9px] uppercase tracking-wide text-ink-400">Rating</p><p className="flex items-center gap-0.5 text-[12px] font-bold text-ink-800"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {s.rating.toFixed(1)}</p></div>
                <div><p className="text-[9px] uppercase tracking-wide text-ink-400">Jobs</p><p className="text-[12px] font-bold text-ink-800">{s.jobs.toLocaleString('en-IN')}</p></div>
                <div><p className="text-[9px] uppercase tracking-wide text-ink-400">Commission</p><p className="text-[12px] font-bold text-ink-800">{s.commission}%</p></div>
              </div>
              <div className="space-y-1.5 px-4 py-3 text-[10.5px]">
                <p className="flex items-center gap-1.5 text-ink-500"><Mail className="h-3 w-3" /> {s.email}</p>
                <p className="flex items-center gap-1.5 text-ink-500"><Phone className="h-3 w-3" /> {s.phone}</p>
              </div>
              <div className="flex items-center justify-between border-t border-ink-100 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-ink-500">Active</span>
                  <Switch
                    checked={s.status === 'active'}
                    onChange={(v) => {
                      setStatusMap((m) => ({ ...m, [s.id]: v ? 'active' : 'inactive' }));
                      toast.success(v ? 'Staff activated' : 'Staff paused', `${s.name} is now ${v ? 'available for jobs' : 'hidden from assignment'}.`);
                    }}
                  />
                </div>
                <button onClick={() => setActive(s)} className="text-[10.5px] font-bold text-brand-700 hover:text-brand-800">Manage →</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Service assignments" description="Which team members can deliver each service." noPadding>
          <div className="divide-y divide-ink-100">
            {[...new Set(staff.flatMap((s) => s.services))].map((svcId) => {
              const assigned = staff.filter((s) => s.services.includes(svcId));
              return (
                <div key={svcId} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Check className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="text-[11.5px] font-semibold text-ink-800">Service {svcId.toUpperCase()}</p><p className="text-[10px] text-ink-400">{assigned.length} staff assigned</p></div>
                  <div className="flex -space-x-1.5">{assigned.map((s) => <Avatar key={s.id} name={s.name} size="xs" tone={s.tone} ring />)}</div>
                </div>
              );
            })}
          </div>
        </SectionCard>
        <SectionCard title="Permissions & access" description="What staff can see when they log in." bodyClassName="space-y-3">
          {[
            { label: 'View assigned bookings', on: true },
            { label: 'Update job status', on: true },
            { label: 'Chat with customers', on: true },
            { label: 'View earnings & payouts', on: false },
            { label: 'Manage services & pricing', on: false },
            { label: 'Invite other staff', on: false },
          ].map((p) => (
            <div key={p.label} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2">
              <span className="text-[11.5px] text-ink-700">{p.label}</span>
              <Badge tone={p.on ? 'success' : 'neutral'} size="sm">{p.on ? 'Allowed' : 'Restricted'}</Badge>
            </div>
          ))}
          <p className="text-[10px] leading-4 text-ink-400">Staff permissions are managed per role. Contact support to create custom roles.</p>
        </SectionCard>
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.name}
        description={active?.role}
        footer={<><Button variant="outline" size="sm" onClick={() => setActive(null)}>Cancel</Button><Button size="sm" onClick={() => { setActive(null); toast.success('Staff updated', 'Changes have been saved.'); }}>Save changes</Button></>}
      >
        {active && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
              <Avatar name={active.name} size="lg" tone={active.tone} />
              <div><p className="text-[13px] font-bold text-ink-900">{active.name}</p><p className="text-[10.5px] text-ink-500">{active.experience} experience · joined 2024</p></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Full name" defaultValue={active.name} />
              <Input label="Role" defaultValue={active.role} />
              <Input label="Email" defaultValue={active.email} />
              <Input label="Phone" defaultValue={active.phone} />
              <Input label="Commission" defaultValue={active.commission} suffix={<span className="text-xs">%</span>} />
              <Select label="Status" defaultValue={active.status}><option value="active">Active</option><option value="on_leave">On leave</option><option value="inactive">Inactive</option></Select>
            </div>
            <div>
              <p className="field-label">Assigned services</p>
              <div className="flex flex-wrap gap-1.5">{active.services.map((svc) => <Badge key={svc} tone="brand" size="sm">{svc.toUpperCase()}</Badge>)}<button className="rounded-full border border-dashed border-ink-300 px-2 py-0.5 text-[10.5px] font-semibold text-ink-500">+ Assign</button></div>
            </div>
            <div className="rounded-xl border border-ink-200 p-3">
              <p className="text-[11px] font-bold text-ink-800">Performance this month</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div><p className="text-[15px] font-extrabold text-ink-900">{Math.round(active.jobs * 0.12)}</p><p className="text-[9px] text-ink-400">jobs</p></div>
                <div><p className="text-[15px] font-extrabold text-ink-900">{active.rating.toFixed(1)}</p><p className="text-[9px] text-ink-400">rating</p></div>
                <div><p className="text-[15px] font-extrabold text-emerald-600">98%</p><p className="text-[9px] text-ink-400">on time</p></div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a team member"
        description="They will receive a login link on WhatsApp and email."
        icon={<UserPlus className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { if (!newStaff.name.trim()) { toast.error('Name required', 'Enter the staff member’s full name.'); return; } setAddOpen(false); toast.success('Invite sent', `${newStaff.name} has been invited to join your team.`); setNewStaff({ name: '', role: '', email: '', phone: '', commission: 8 }); }}>Send invite</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Full name" required value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} containerClassName="sm:col-span-2" />
          <Input label="Role" placeholder="e.g. Cleaning Specialist" value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })} />
          <Input label="Commission" type="number" value={newStaff.commission} onChange={(e) => setNewStaff({ ...newStaff, commission: Number(e.target.value) })} suffix={<span className="text-xs">%</span>} />
          <Input label="Email" type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} />
          <Input label="Phone" value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} />
          <div className="sm:col-span-2"><p className="field-label">Services they can deliver</p><div className="flex flex-wrap gap-1.5">{['Deep cleaning', 'Kitchen cleaning', 'Sofa shampooing', 'Bathroom detail'].map((x) => <Badge key={x} tone="neutral" size="sm">{x}</Badge>)}<button className="rounded-full border border-dashed border-ink-300 px-2 py-0.5 text-[10.5px] font-semibold text-ink-500">+ Add</button></div></div>
        </div>
      </Modal>
    </div>
  );
}
