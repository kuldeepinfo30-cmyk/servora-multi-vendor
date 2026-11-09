import { useState } from 'react';
import { BadgePercent, Percent, Save, SlidersHorizontal, Store, TrendingUp } from 'lucide-react';
import { CATEGORIES, MONTHLY_REVENUE, TOP_VENDORS, VENDORS } from '@/lib/data';
import { cn, inr } from '@/lib/utils';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Badge, Button, Card, Input, Select, Skeleton, Switch, Tabs } from '@/components/ui/primitives';
import { PageHeader, SectionCard, StatCard } from '@/components/ui/data-display';
import { Drawer } from '@/components/ui/overlays';

export default function AdminCommissions() {
  const loading = useMockLoad(340);
  const [tab, setTab] = useState('rules');
  const [globalRate, setGlobalRate] = useState(12);
  const [categoryRates, setCategoryRates] = useState<Record<string, number>>({ c1: 12, c2: 15, c3: 14, c4: 10, c5: 15, c6: 8, c7: 12, c8: 10 });
  const [active, setActive] = useState<string | null>(null);

  const gmv = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].revenue;
  const commission = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].commission;

  if (loading) {
    return <div className="space-y-5"><Skeleton className="h-16 w-full max-w-lg" /><div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-[400px]" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Commissions"
        description="Set platform take rates globally, per category or per vendor. Changes are audit-logged."
        actions={<Button size="md" iconLeft={<Save className="h-4 w-4" />} onClick={() => toast.success('Commission rules saved', 'New rates apply to bookings created from now.')}>Save rules</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Global take rate" value={`${globalRate}%`} icon={<Percent className="h-5 w-5" />} tone="violet" footnote="applies by default" />
        <StatCard label="Commission earned" value={inr(commission)} delta={9.4} icon={<TrendingUp className="h-5 w-5" />} tone="success" footnote="November to date" />
        <StatCard label="Effective rate" value="12.4%" icon={<BadgePercent className="h-5 w-5" />} tone="brand" footnote="blended across vendors" />
        <StatCard label="Overrides" value={VENDORS.filter((v) => v.commission !== globalRate).length} icon={<SlidersHorizontal className="h-5 w-5" />} tone="warning" footnote="vendor-specific rates" />
      </div>

      <Tabs className="mt-5" value={tab} onChange={setTab} items={[{ key: 'rules', label: 'Commission rules' }, { key: 'earnings', label: 'Commission earnings' }]} />

      {tab === 'rules' && (
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-4">
            <SectionCard title="Global default" description="Applied to every new vendor unless overridden.">
              <div className="flex items-end gap-3">
                <div className="flex-1"><Input label="Platform commission" type="number" value={globalRate} onChange={(e) => setGlobalRate(Number(e.target.value))} suffix={<span className="text-xs">%</span>} /></div>
                <Button variant="outline" size="md" onClick={() => toast.success('Default updated', `Global rate set to ${globalRate}%.`)}>Apply</Button>
              </div>
              <div className="mt-3 rounded-xl bg-ink-50 p-3">
                <div className="flex justify-between text-[11px]"><span className="text-ink-500">On a ₹1,000 booking</span><span className="font-semibold text-ink-800">Vendor earns {inr(1000 - globalRate * 10)}</span></div>
                <div className="mt-1 flex justify-between text-[11px]"><span className="text-ink-500">Platform fee</span><span className="font-semibold text-violet-600">{inr(globalRate * 10)}</span></div>
              </div>
            </SectionCard>
            <SectionCard title="Rule settings" bodyClassName="space-y-3">
              <Switch checked label="Charge on completed bookings only" description="Cancelled and refunded bookings incur no commission." onChange={() => toast.info('Rule locked', 'This is a platform-wide policy.')} />
              <div className="h-px bg-ink-100" />
              <Switch checked label="Absorb gateway fees" description="Platform pays the payment gateway fee from its commission." onChange={() => toast.info('Rule locked', 'Contact finance to change.')} />
              <div className="h-px bg-ink-100" />
              <Switch checked={false} label="Commission on add-ons" description="Apply the same rate to add-on revenue." onChange={() => toast.info('Rule updated', 'Add-on commission policy changed.')} />
            </SectionCard>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
              <p className="text-[11px] font-bold text-amber-900">Change control</p>
              <p className="mt-1 text-[10.5px] leading-4 text-amber-800">Rate changes take effect on the next booking. Existing bookings keep the rate they were created with. A 30-day notice is required for vendor-wide increases above 2 points.</p>
            </div>
          </div>

          <SectionCard title="Category rates" description="Override the global default by category." noPadding>
            <div className="divide-y divide-ink-100">
              {CATEGORIES.slice(0, 8).map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1"><p className="text-[11.5px] font-semibold text-ink-800">{c.name}</p><p className="text-[9.5px] text-ink-400">{c.vendors} vendors · {c.services} services</p></div>
                  <input
                    type="number"
                    value={categoryRates[c.id] ?? globalRate}
                    onChange={(e) => setCategoryRates((r) => ({ ...r, [c.id]: Number(e.target.value) }))}
                    className="h-8 w-16 rounded-lg border border-ink-200 px-2 text-center text-[11.5px] font-bold text-ink-800 focus:border-brand-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-ink-400">%</span>
                  <Badge tone={(categoryRates[c.id] ?? globalRate) > globalRate ? 'warning' : 'success'} size="sm">{(categoryRates[c.id] ?? globalRate) > globalRate ? 'Premium' : 'Standard'}</Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'earnings' && (
        <div className="mt-4 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <SectionCard title="Top commission contributors" description="By commission earned this quarter" noPadding>
            <div className="divide-y divide-ink-100">
              {TOP_VENDORS.map((v, i) => (
                <button key={v.vendorId} onClick={() => setActive(v.vendorId)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-ink-50">
                  <span className="w-4 text-[10px] font-bold text-ink-300">{i + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[11.5px] font-bold text-ink-800">{v.name}</p><p className="text-[9.5px] text-ink-400">{v.category} · {v.bookings} bookings</p></div>
                  <div className="text-right"><p className="text-[11.5px] font-bold text-ink-900">{inr(v.commission)}</p><p className="text-[9px] text-ink-400">GMV {inr(v.revenue, true)}</p></div>
                  <Badge tone="violet" size="sm">12%</Badge>
                </button>
              ))}
            </div>
          </SectionCard>
          <div className="space-y-4">
            <SectionCard title="Monthly commission" bodyClassName="space-y-2">
              {MONTHLY_REVENUE.slice(-6).map((m) => (
                <div key={m.month} className="flex items-center gap-2">
                  <span className="w-8 text-[10px] font-semibold text-ink-500">{m.month}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${(m.commission / 70000) * 100}%` }} /></div>
                  <span className="w-14 text-right text-[10px] font-bold text-ink-700">{inr(m.commission, true)}</span>
                </div>
              ))}
            </SectionCard>
            <SectionCard title="Vendor overrides" description="Non-default rates" noPadding>
              <div className="divide-y divide-ink-100">
                {VENDORS.slice(0, 6).map((v) => (
                  <div key={v.id} className="flex items-center gap-2 px-4 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink-600">{v.name}</span>
                    <span className="text-[10.5px] font-bold text-ink-800">{v.commission}%</span>
                    <button onClick={() => setActive(v.id)} className="text-[9.5px] font-bold text-brand-700">Edit</button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      <Drawer open={!!active} onClose={() => setActive(null)} title="Vendor commission override" description={VENDORS.find((v) => v.id === active)?.name} footer={<><Button variant="outline" size="sm" onClick={() => setActive(null)}>Cancel</Button><Button size="sm" onClick={() => { setActive(null); toast.success('Override saved', 'Vendor-specific commission updated.'); }}>Save override</Button></>}>
        {active && (
          <div className="space-y-4">
            <div className="rounded-xl bg-ink-50 p-4">
              <div className="flex items-center gap-2"><Store className="h-4 w-4 text-ink-500" /><p className="text-[11.5px] font-bold text-ink-800">{VENDORS.find((v) => v.id === active)?.name}</p></div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-white p-2"><p className="text-[16px] font-extrabold text-ink-900">{inr(VENDORS.find((v) => v.id === active)?.jobsDone ?? 0)}</p><p className="text-[9px] text-ink-400">lifetime jobs</p></div>
                <div className="rounded-lg bg-white p-2"><p className="text-[16px] font-extrabold text-ink-900">{VENDORS.find((v) => v.id === active)?.rating.toFixed(1)}</p><p className="text-[9px] text-ink-400">rating</p></div>
              </div>
            </div>
            <Input label="Commission rate" type="number" defaultValue={VENDORS.find((v) => v.id === active)?.commission} suffix={<span className="text-xs">%</span>} hint={`Global default is ${globalRate}%`} />
            <Select label="Reason for override"><option>Volume discount</option><option>Category premium</option><option>Strategic partner</option><option>Promotional period</option></Select>
            <Input label="Effective from" type="date" />
            <p className="rounded-lg bg-ink-50 p-2.5 text-[10.5px] text-ink-500">Overrides supersede category and global rates. The vendor is notified automatically.</p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
