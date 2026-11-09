import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, endOfWeek, format, startOfWeek } from 'date-fns';
import {
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Settings2,
  Users,
  X,
} from 'lucide-react';
import { getService, getStaff, getVendorStaff } from '@/lib/data';
import { cn, fmtDate, iso, to12h } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, buttonStyles, Card, Segmented, Select, Skeleton, Switch } from '@/components/ui/primitives';
import { PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { WeekSchedule } from '@/components/booking';
import { Modal } from '@/components/ui/overlays';

const toneFor = (status: string) =>
  status === 'completed' ? 'success' : status === 'in_progress' ? 'warning' : status === 'pending_approval' ? 'amber' : status === 'cancelled' || status === 'rejected' ? 'neutral' : 'brand';

export default function VendorCalendar() {
  const { user } = useAuth();
  const loading = useMockLoad(360);
  const bookings = useApp((s) => s.bookings);
  const vendorId = user?.vendorId ?? 'v1';
  const staff = getVendorStaff(vendorId);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [view, setView] = useState('week');
  const [staffFilter, setStaffFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [online, setOnline] = useState(true);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const mine = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.vendorId === vendorId &&
          b.date >= iso(weekStart) &&
          b.date <= iso(weekEnd) &&
          (staffFilter === 'all' || b.staffId === staffFilter),
      ),
    [bookings, vendorId, weekStart, weekEnd, staffFilter],
  );

  const events = mine.map((b) => {
    const idx = Math.round((new Date(b.date).getTime() - weekStart.getTime()) / 86400000);
    return {
      id: b.id,
      day: Math.max(0, Math.min(6, idx)),
      start: Number(b.time.split(':')[0]),
      duration: b.duration,
      title: getService(b.serviceId)?.name ?? 'Service',
      customer: b.customerName,
      tone: toneFor(b.status),
      status: b.status,
    };
  });

  const activeBooking = bookings.find((b) => b.id === selected);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <Skeleton className="h-[560px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Calendar"
        eyebrow={<span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {online ? 'Accepting new bookings' : 'Paused — not accepting bookings'}</span>}
        description="Plan your week, assign staff and block time off. Changes sync to customer availability instantly."
        actions={
          <>
            <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2">
              <span className="text-[11px] font-semibold text-ink-600">Online</span>
              <Switch checked={online} onChange={(v) => { setOnline(v); toast.info(v ? 'Store online' : 'Store paused', v ? 'Customers can book your available slots.' : 'New bookings are paused until you go online.'); }} />
            </div>
            <Button variant="outline" size="md" iconLeft={<Settings2 className="h-4 w-4" />} onClick={() => toast.info('Availability settings', 'Manage recurring slots in Services → Availability.')}>Availability</Button>
            <Button size="md" iconLeft={<Plus className="h-4 w-4" />} onClick={() => setBlockOpen(true)}>Block time</Button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Jobs this week', value: mine.length, icon: CalendarDays, tone: 'bg-brand-50 text-brand-600' },
          { label: 'Booked hours', value: `${(mine.reduce((a, b) => a + b.duration, 0) / 60).toFixed(1)}h`, icon: Clock, tone: 'bg-sky-50 text-sky-600' },
          { label: 'Staff on duty', value: staff.filter((s) => s.status === 'active').length, icon: Users, tone: 'bg-violet-50 text-violet-600' },
          { label: 'Unassigned jobs', value: mine.filter((b) => !b.staffId).length, icon: CalendarPlus, tone: 'bg-amber-50 text-amber-600' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-3.5">
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', s.tone)}><s.icon className="h-4 w-4" /></span>
            <div><p className="text-[15px] font-extrabold leading-none text-ink-900">{s.value}</p><p className="mt-1 text-[10px] text-ink-500">{s.label}</p></div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Segmented value={view} onChange={setView} options={[{ value: 'week', label: 'Week' }, { value: 'agenda', label: 'Agenda' }]} />
            <div className="flex items-center gap-2">
              <Select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="h-9 w-[170px] text-[11.5px]">
                <option value="all">All staff</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <button onClick={() => setWeekStart((w) => addDays(w, -7))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-500 hover:bg-ink-50"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="h-9 rounded-lg border border-ink-200 bg-white px-3 text-[11.5px] font-semibold text-ink-600 hover:bg-ink-50">Today</button>
              <button onClick={() => setWeekStart((w) => addDays(w, 7))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-500 hover:bg-ink-50"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>

          {view === 'week' ? (
            <WeekSchedule
              events={events}
              weekStart={weekStart}
              onPrev={() => setWeekStart((w) => addDays(w, -7))}
              onNext={() => setWeekStart((w) => addDays(w, 7))}
              onSelect={setSelected}
            />
          ) : (
            <Card className="divide-y divide-ink-100 overflow-hidden">
              {days.map((day) => {
                const key = iso(day);
                const dayJobs = mine.filter((b) => b.date === key).sort((a, b) => a.time.localeCompare(b.time));
                return (
                  <div key={key} className="flex gap-4 p-4">
                    <div className="w-16 shrink-0 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">{format(day, 'EEE')}</p>
                      <p className={cn('font-display text-[20px] font-extrabold', key === iso(new Date()) ? 'text-brand-600' : 'text-ink-900')}>{format(day, 'd')}</p>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      {dayJobs.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-ink-200 px-3 py-3 text-[10.5px] text-ink-400">No jobs scheduled</p>
                      ) : dayJobs.map((b) => (
                        <button key={b.id} onClick={() => setSelected(b.id)} className="flex w-full items-center gap-3 rounded-xl border border-ink-200 p-2.5 text-left transition hover:border-brand-200 hover:bg-brand-50/30">
                          <span className="w-14 text-[10.5px] font-bold text-ink-700">{to12h(b.time)}</span>
                          <span className="h-7 w-0.5 rounded-full bg-brand-300" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11.5px] font-bold text-ink-800">{getService(b.serviceId)?.name}</span>
                            <span className="block text-[10px] text-ink-400">{b.customerName} · {b.duration} min</span>
                          </span>
                          <StatusBadge status={b.status} size="sm" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-ink-200 bg-white px-4 py-3 text-[10.5px] text-ink-500">
            <span className="font-bold text-ink-700">Legend</span>
            {[['Confirmed', 'bg-brand-400'], ['In progress', 'bg-amber-400'], ['Completed', 'bg-emerald-400'], ['Request', 'bg-violet-400']].map(([label, tone]) => (
              <span key={label} className="inline-flex items-center gap-1.5"><span className={cn('h-2 w-2 rounded-full', tone)} /> {label}</span>
            ))}
            <span className="ml-auto hidden items-center gap-1 sm:inline-flex"><CalendarDays className="h-3.5 w-3.5" /> Week of {format(weekStart, 'd MMM yyyy')}</span>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-ink-100 px-4 py-3">
              <p className="text-[12.5px] font-bold text-ink-900">Team availability</p>
              <p className="text-[10px] text-ink-400">Week of {format(weekStart, 'd MMM')}</p>
            </div>
            <div className="divide-y divide-ink-100">
              {staff.map((s) => {
                const jobs = mine.filter((b) => b.staffId === s.id).length;
                return (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={s.name} size="sm" tone={s.tone} online={s.status === 'active'} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-semibold text-ink-800">{s.name}</p>
                      <p className="text-[10px] text-ink-400">{jobs} jobs · {s.status === 'on_leave' ? 'On leave' : 'Available'}</p>
                    </div>
                    <Badge tone={s.status === 'active' ? 'success' : 'warning'} size="sm">{jobs}h</Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          <SectionCard title="Quick actions" bodyClassName="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start" iconLeft={<CalendarPlus className="h-4 w-4" />} onClick={() => setBlockOpen(true)}>Block time off</Button>
            <Link to="/vendor/staff" className={buttonStyles({ variant: 'outline', size: 'sm', className: 'w-full justify-start' })}><Users className="h-4 w-4" /> Manage staff</Link>
            <Link to="/vendor/services" className={buttonStyles({ variant: 'outline', size: 'sm', className: 'w-full justify-start' })}><Settings2 className="h-4 w-4" /> Edit service hours</Link>
          </SectionCard>

          <Card className="bg-gradient-to-br from-ink-900 to-ink-950 p-4 text-white">
            <CalendarDays className="h-5 w-5 text-brand-300" />
            <p className="mt-2 text-[12px] font-bold">Calendar sync</p>
            <p className="mt-0.5 text-[10.5px] leading-4 text-ink-400">Export your schedule to Google Calendar or Apple Calendar.</p>
            <button onClick={() => toast.success('Calendar feed copied', 'Paste the iCal URL into your calendar app.')} className="mt-2.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10.5px] font-bold hover:bg-white/20">Copy iCal link</button>
          </Card>
        </div>
      </div>

      <Modal
        open={!!activeBooking}
        onClose={() => setSelected(null)}
        title={activeBooking ? getService(activeBooking.serviceId)?.name : ''}
        description={activeBooking ? `${to12h(activeBooking.time)} · ${activeBooking.duration} min · ${activeBooking.customerName}` : undefined}
        size="sm"
        footer={<Button size="sm" onClick={() => setSelected(null)}>Done</Button>}
      >
        {activeBooking && (
          <div className="space-y-3">
            <StatusBadge status={activeBooking.status} />
            <div className="space-y-2 text-[11.5px]">
              <p className="flex items-center gap-2 text-ink-600"><Clock className="h-3.5 w-3.5 text-ink-400" /> {fmtDate(activeBooking.date, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <p className="flex items-center gap-2 text-ink-600"><MapPin className="h-3.5 w-3.5 text-ink-400" /> {activeBooking.address}</p>
              <p className="flex items-center gap-2 text-ink-600"><Users className="h-3.5 w-3.5 text-ink-400" /> {getStaff(activeBooking.staffId)?.name ?? 'Unassigned'}</p>
            </div>
            <div className="flex gap-2 border-t border-ink-100 pt-3">
              <Link to="/vendor/bookings" className={buttonStyles({ size: 'sm', className: 'flex-1' })}>Open booking</Link>
              <Button variant="outline" size="sm" onClick={() => { setSelected(null); toast.success('Staff assigned', 'The booking has been assigned and the customer notified.'); }}>Assign staff</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        title="Block time off"
        description="Blocked periods are removed from customer availability."
        size="sm"
        icon={<CalendarPlus className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setBlockOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { setBlockOpen(false); toast.success('Time blocked', 'The period is now hidden from customer booking.'); }}>Block period</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="field-label">From</p><input type="date" defaultValue={iso(new Date())} className="h-11 w-full rounded-xl border border-ink-200 px-3 text-sm" /></div>
            <div><p className="field-label">To</p><input type="date" defaultValue={iso(new Date())} className="h-11 w-full rounded-xl border border-ink-200 px-3 text-sm" /></div>
          </div>
          <div><p className="field-label">Reason</p><select className="h-11 w-full rounded-xl border border-ink-200 px-3 text-sm"><option>Public holiday</option><option>Team training</option><option>Equipment maintenance</option><option>Personal leave</option></select></div>
          <div><p className="field-label">Applies to</p><select className="h-11 w-full rounded-xl border border-ink-200 px-3 text-sm"><option>All staff</option>{staff.map((s) => <option key={s.id}>{s.name}</option>)}</select></div>
          <p className="rounded-lg bg-amber-50 p-2.5 text-[10.5px] leading-4 text-amber-800"><X className="mr-1 inline h-3 w-3" /> Existing confirmed bookings are not cancelled. Contact those customers manually.</p>
        </div>
      </Modal>
    </div>
  );
}
