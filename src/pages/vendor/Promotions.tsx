import { useState } from 'react';
import {
  BadgePercent,
  Check,
  Copy,
  Crown,
  Megaphone,
  Pause,
  Play,
  Plus,
  Rocket,
  Sparkles,
  TicketPercent,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { COUPONS } from '@/lib/data';
import { cn, fmtDate, inr } from '@/lib/utils';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Badge, Button, Card, EmptyState, Input, Select, Skeleton, Switch, Tabs } from '@/components/ui/primitives';
import { PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { Modal } from '@/components/ui/overlays';
import type { Coupon } from '@/lib/types';

const boosts = [
  { id: 'b1', name: 'Featured listing', price: 1499, days: 30, desc: 'Top of category results and homepage carousel.', icon: Crown, tone: 'from-violet-600 to-indigo-700', perks: ['3.2× more views', 'Featured badge', 'Homepage placement'] },
  { id: 'b2', name: 'Spotlight boost', price: 699, days: 14, desc: 'Priority ranking in local search for 14 days.', icon: Rocket, tone: 'from-brand-600 to-indigo-800', perks: ['2.1× more views', 'Search priority', 'Category banner'] },
  { id: 'b3', name: 'New customer push', price: 399, days: 7, desc: 'Promoted to first-time customers in your city.', icon: Zap, tone: 'from-amber-500 to-orange-600', perks: ['Targeted reach', 'First-booking offer', '7-day run'] },
];

export default function VendorPromotions() {
  const loading = useMockLoad(340);
  const [tab, setTab] = useState('coupons');
  const [coupons, setCoupons] = useState<Coupon[]>([COUPONS[1], COUPONS[2]]);
  const [createOpen, setCreateOpen] = useState(false);
  const [boostOpen, setBoostOpen] = useState<string | null>(null);
  const [activeBoosts, setActiveBoosts] = useState<string[]>(['b2']);
  const [form, setForm] = useState({ code: '', description: '', type: 'percent', value: 10, minOrder: 999, limit: 100, expires: '' });

  const createCoupon = () => {
    if (!form.code.trim()) { toast.error('Code required', 'Enter a coupon code customers will type at checkout.'); return; }
    if (!form.expires) { toast.error('Expiry required', 'Choose an end date for this promotion.'); return; }
    const c: Coupon = {
      id: `cp_${Date.now()}`,
      code: form.code.toUpperCase(),
      description: form.description || `${form.value}${form.type === 'percent' ? '%' : '₹'} off`,
      type: form.type as Coupon['type'],
      value: Number(form.value),
      minOrder: Number(form.minOrder),
      uses: 0,
      limit: Number(form.limit),
      expires: form.expires,
      status: 'active',
      scope: 'Selected services',
    };
    setCoupons((prev) => [c, ...prev]);
    setCreateOpen(false);
    setForm({ code: '', description: '', type: 'percent', value: 10, minOrder: 999, limit: 100, expires: '' });
    toast.success('Promotion created', `${c.code} is now live for your customers.`);
  };

  const toggleCoupon = (c: Coupon) => {
    setCoupons((prev) => prev.map((x) => x.id === c.id ? { ...x, status: x.status === 'active' ? 'disabled' : 'active' } : x));
    toast.success(c.status === 'active' ? 'Promotion paused' : 'Promotion resumed', `${c.code} is now ${c.status === 'active' ? 'paused' : 'active'}.`);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-amber-600"><Sparkles className="h-3.5 w-3.5" /> Growth tools</span>}
        title="Promotions"
        description="Run offers, boost visibility and fill quiet slots with targeted campaigns."
        actions={<Button size="md" iconLeft={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>Create promotion</Button>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active promotions', value: coupons.filter((c) => c.status === 'active').length, hint: 'live right now', tone: 'success' },
          { label: 'Redemptions', value: coupons.reduce((a, c) => a + c.uses, 0).toLocaleString('en-IN'), hint: 'lifetime', tone: 'brand' },
          { label: 'Revenue influenced', value: inr(84200), hint: 'last 30 days', tone: 'violet' },
          { label: 'Boost spend', value: inr(699), hint: 'this month', tone: 'amber' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-[11px] font-semibold text-ink-500">{s.label}</p>
            <p className="mt-1 font-display text-[22px] font-extrabold text-ink-900">{s.value}</p>
            <p className="mt-0.5 text-[10px] text-ink-400">{s.hint}</p>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onChange={setTab} items={[{ key: 'coupons', label: 'Coupons', count: coupons.length }, { key: 'boosts', label: 'Visibility boosts' }, { key: 'campaigns', label: 'Campaigns' }]} />

      {tab === 'coupons' && (
        <div className="mt-4 space-y-4">
          {coupons.length === 0 ? (
            <EmptyState icon={<TicketPercent className="h-5 w-5" />} title="No promotions yet" description="Create a coupon to attract new customers and increase repeat bookings." action={<Button size="sm" onClick={() => setCreateOpen(true)} iconLeft={<Plus className="h-4 w-4" />}>Create promotion</Button>} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {coupons.map((c) => {
                const pct = Math.min(100, (c.uses / Math.max(1, c.limit)) * 100);
                return (
                  <Card key={c.id} className="overflow-hidden">
                    <div className="flex items-start gap-3 p-4">
                      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', c.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-ink-100 text-ink-400')}><BadgePercent className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-[13px] font-extrabold tracking-wide text-ink-900">{c.code}</p>
                          <StatusBadge status={c.status} size="sm" />
                        </div>
                        <p className="mt-0.5 text-[11px] text-ink-500">{c.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-400">
                          <span>Min. {inr(c.minOrder)}</span>
                          <span>·</span>
                          <span>Expires {fmtDate(c.expires, { day: 'numeric', month: 'short' })}</span>
                          <span>·</span>
                          <span>{c.scope}</span>
                        </div>
                      </div>
                      <Switch checked={c.status === 'active'} onChange={() => toggleCoupon(c)} />
                    </div>
                    <div className="border-t border-ink-100 bg-ink-50/40 px-4 py-2.5">
                      <div className="flex items-center justify-between text-[10px] text-ink-500"><span>{c.uses} of {c.limit} used</span><span className="font-semibold text-ink-700">{Math.round(pct)}%</span></div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-200"><div className={cn('h-full rounded-full', pct > 85 ? 'bg-rose-50' : 'bg-emerald-500')} style={{ width: `${pct}%` }} /></div>
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => { navigator.clipboard?.writeText(c.code); toast.success('Code copied', `${c.code} copied to clipboard.`); }} className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 hover:text-brand-800"><Copy className="h-3 w-3" /> Copy code</button>
                        <span className="text-ink-200">|</span>
                        <button onClick={() => toast.info('Edit promotion', 'Promotion editing is available in the full product.')} className="text-[10px] font-semibold text-ink-500 hover:text-ink-800">Edit</button>
                        <button onClick={() => { setCoupons((prev) => prev.filter((x) => x.id !== c.id)); toast.success('Promotion deleted', `${c.code} removed.`); }} className="ml-auto text-[10px] text-ink-400 hover:text-rose-500">Delete</button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <SectionCard title="Promotion ideas" description="What works for businesses like yours" bodyClassName="grid gap-3 sm:grid-cols-3">
            {[
              { title: 'First-time offer', text: '15% off the first booking. Converts 27% better.', icon: Users },
              { title: 'Quiet-hour deal', text: '₹200 off weekday 9–11 AM slots.', icon: TrendingUp },
              { title: 'Bundle add-on', text: 'Free sofa shampoo with a 3 BHK deep clean.', icon: Sparkles },
            ].map((idea) => (
              <button key={idea.title} onClick={() => { setForm((f) => ({ ...f, description: idea.title, code: idea.title.split(' ')[0].toUpperCase() + '20' })); setCreateOpen(true); }} className="rounded-xl border border-ink-200 p-3.5 text-left transition hover:border-brand-200 hover:bg-brand-50/30">
                <idea.icon className="h-4 w-4 text-brand-600" />
                <p className="mt-1.5 text-[11.5px] font-bold text-ink-800">{idea.title}</p>
                <p className="mt-0.5 text-[10px] leading-4 text-ink-500">{idea.text}</p>
              </button>
            ))}
          </SectionCard>
        </div>
      )}

      {tab === 'boosts' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {boosts.map((b) => {
            const active = activeBoosts.includes(b.id);
            return (
              <Card key={b.id} className="overflow-hidden">
                <div className={cn('bg-gradient-to-br p-5 text-white', b.tone)}>
                  <b.icon className="h-6 w-6" />
                  <p className="mt-2 font-display text-[17px] font-extrabold">{b.name}</p>
                  <p className="mt-0.5 text-[10.5px] text-white/80">{b.desc}</p>
                  <div className="mt-3 flex items-end gap-1.5"><span className="font-display text-[24px] font-extrabold">{inr(b.price)}</span><span className="pb-1 text-[10px] text-white/70">/ {b.days} days</span></div>
                </div>
                <div className="space-y-2 p-4">
                  {b.perks.map((p) => <p key={p} className="flex items-center gap-1.5 text-[11px] text-ink-600"><Check className="h-3.5 w-3.5 text-emerald-500" /> {p}</p>)}
                  <Button size="sm" variant={active ? 'outline' : 'primary'} className="mt-2 w-full" onClick={() => active ? toast.info('Boost active', `Your ${b.name.toLowerCase()} runs until 21 Nov.`) : setBoostOpen(b.id)}>
                    {active ? 'Active until 21 Nov' : 'Boost my listing'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {[
            { name: 'Diwali deep-clean push', status: 'completed', sent: 4210, opened: 62, booked: 148, revenue: 368400 },
            { name: 'Weekday morning slots', status: 'active', sent: 1840, opened: 48, booked: 62, revenue: 74400 },
            { name: 'Win-back — 90 day inactive', status: 'scheduled', sent: 0, opened: 0, booked: 0, revenue: 0 },
          ].map((c) => (
            <SectionCard key={c.name} title={c.name} action={<StatusBadge status={c.status === 'completed' ? 'completed' : c.status} size="sm" />}>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[['Sent', c.sent], ['Opened', `${c.opened}%`], ['Booked', c.booked], ['Revenue', inr(c.revenue)]].map(([l, v]) => (
                  <div key={String(l)}><p className="text-[14px] font-extrabold text-ink-900">{v}</p><p className="text-[9px] text-ink-400">{l}</p></div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.info('Campaign report', 'Detailed attribution is available in Reports.')}>View report</Button>
                <Button variant="soft" size="sm" className="flex-1" onClick={() => toast.success('Campaign duplicated', 'A draft copy has been created.')}>Duplicate</Button>
              </div>
            </SectionCard>
          ))}
          <div className="lg:col-span-2">
            <Card className="flex flex-col items-start gap-3 border-dashed p-5 sm:flex-row sm:items-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Megaphone className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="text-[12.5px] font-bold text-ink-900">Send a campaign to your customers</p><p className="text-[10.5px] text-ink-500">Email or WhatsApp your past customers with a targeted offer.</p></div>
              <Button size="sm" onClick={() => toast.info('Campaign builder', 'Create a coupon first, then attach it to a campaign.')} iconLeft={<Rocket className="h-4 w-4" />}>New campaign</Button>
            </Card>
          </div>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a promotion"
        description="Offer a discount on selected services. Customers apply the code at checkout."
        icon={<BadgePercent className="h-5 w-5" />}
        footer={<><Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button><Button size="sm" onClick={createCoupon}>Create promotion</Button></>}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Coupon code" required placeholder="e.g. CLEAN20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} containerClassName="sm:col-span-2" />
          <Input label="Description" placeholder="20% off deep cleaning" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} containerClassName="sm:col-span-2" />
          <Select label="Discount type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="percent">Percentage</option><option value="flat">Flat amount</option></Select>
          <Input label={form.type === 'percent' ? 'Percentage off' : 'Amount off'} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} suffix={<span className="text-xs">{form.type === 'percent' ? '%' : '₹'}</span>} />
          <Input label="Minimum order" type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })} suffix={<span className="text-xs">₹</span>} />
          <Input label="Usage limit" type="number" value={form.limit} onChange={(e) => setForm({ ...form, limit: Number(e.target.value) })} />
          <Input label="Expires on" type="date" required value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} containerClassName="sm:col-span-2" />
          <div className="sm:col-span-2"><p className="field-label">Applies to</p><div className="flex flex-wrap gap-1.5">{['Deep Home Cleaning', 'Kitchen Deep Cleaning', 'Sofa & Carpet Shampooing'].map((s) => <Badge key={s} tone="brand" size="sm">{s}</Badge>)}<button className="rounded-full border border-dashed border-ink-300 px-2 py-0.5 text-[10.5px] font-semibold text-ink-500">+ Select</button></div></div>
        </div>
      </Modal>

      <Modal
        open={!!boostOpen}
        onClose={() => setBoostOpen(null)}
        title="Confirm visibility boost"
        description="Boost starts immediately and runs for the selected period."
        size="sm"
        icon={<Rocket className="h-5 w-5" />}
        footer={<><Button variant="outline" size="sm" onClick={() => setBoostOpen(null)}>Cancel</Button><Button size="sm" onClick={() => { if (boostOpen) setActiveBoosts((b) => [...b, boostOpen]); setBoostOpen(null); toast.success('Boost activated', 'Your listing is now promoted. Track results under Campaigns.'); }}>Pay & activate</Button></>}
      >
        {(() => {
          const b = boosts.find((x) => x.id === boostOpen);
          if (!b) return null;
          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-ink-200 p-3">
                <div><p className="text-[12px] font-bold text-ink-900">{b.name}</p><p className="text-[10px] text-ink-400">{b.days} days</p></div>
                <p className="text-[16px] font-extrabold text-ink-900">{inr(b.price)}</p>
              </div>
              <div className="rounded-lg bg-ink-50 p-3 text-[10.5px] text-ink-500">Charged to your next payout statement. GST invoice available under Payments.</div>
              <div className="flex items-center gap-2"><Pause className="h-4 w-4 text-ink-400" /><p className="text-[10.5px] text-ink-500">You can pause the boost anytime — unused days are credited.</p></div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
