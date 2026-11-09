import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  LifeBuoy,
  MessageSquare,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  Ticket as TicketIcon,
} from 'lucide-react';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import type { Ticket } from '@/lib/types';
import { fmtDate, today } from '@/lib/utils';
import { Badge, Button, buttonStyles, Card, EmptyState, Input, Select, Skeleton, Tabs, Textarea } from '@/components/ui/primitives';
import { PageHeader, SectionCard, StatCard, StatusBadge } from '@/components/ui/data-display';
import { Drawer } from '@/components/ui/overlays';
import { Accordion } from '@/components/ui/overlays';

const categories = ['Booking issue', 'Refund', 'Payment', 'Vendor behaviour', 'Account', 'Other'];

export default function CustomerSupport() {
  const loading = useMockLoad(380);
  const tickets = useApp((s) => s.tickets);
  const addTicket = useApp((s) => s.addTicket);

  const [tab, setTab] = useState<'open' | 'resolved' | 'all'>('open');
  const [newOpen, setNewOpen] = useState(false);
  const [active, setActive] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const [form, setForm] = useState({ subject: '', category: categories[0], priority: 'medium' as Ticket['priority'], message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    if (tab === 'open') return tickets.filter((t) => ['open', 'in_progress'].includes(t.status));
    if (tab === 'resolved') return tickets.filter((t) => ['resolved', 'closed'].includes(t.status));
    return tickets;
  }, [tickets, tab]);

  const create = () => {
    const errs: Record<string, string> = {};
    if (form.subject.trim().length < 6) errs.subject = 'Add a clear subject (at least 6 characters).';
    if (form.message.trim().length < 20) errs.message = 'Describe the issue in at least 20 characters.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const ticket: Ticket = {
      id: `TK-${Math.floor(1100 + Math.random() * 800)}`,
      subject: form.subject,
      category: form.category,
      status: 'open',
      priority: form.priority,
      created: today(),
      updated: today(),
      messages: [{ from: 'me', text: form.message, time: 'Just now' }],
    };
    addTicket(ticket);
    toast.success('Ticket created', `${ticket.id} · we’ll respond within 4 hours.`);
    setForm({ subject: '', category: categories[0], priority: 'medium', message: '' });
    setNewOpen(false);
    setActive(ticket);
  };

  const sendReply = () => {
    if (!active || !reply.trim()) return;
    const updated: Ticket = {
      ...active,
      updated: today(),
      status: 'open',
      messages: [...active.messages, { from: 'me', text: reply.trim(), time: 'Just now' }],
    };
    setActive(updated);
    setReply('');
    toast.success('Reply sent', 'Support will get back to you shortly.');
  };

  return (
    <div>
      <PageHeader
        title="Support"
        description="Real humans, 7 AM – 11 PM IST. Most issues are resolved within one business day."
        actions={<Button size="md" iconLeft={<Plus className="h-4 w-4" />} onClick={() => setNewOpen(true)}>New ticket</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open tickets" value={tickets.filter((t) => ['open', 'in_progress'].includes(t.status)).length} icon={<TicketIcon className="h-5 w-5" />} tone="brand" footnote="being looked into" />
        <StatCard label="Resolved" value={tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length} icon={<CheckCircle2 className="h-5 w-5" />} tone="success" footnote="lifetime" />
        <StatCard label="Avg. first reply" value="14 min" icon={<Clock className="h-5 w-5" />} tone="info" footnote="last 30 days" />
        <StatCard label="Satisfaction" value="4.8/5" icon={<ShieldCheck className="h-5 w-5" />} tone="violet" footnote="post-ticket survey" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="mb-4">
            <Tabs
              value={tab}
              onChange={(k) => setTab(k as typeof tab)}
              items={[
                { key: 'open', label: 'Open', count: tickets.filter((t) => ['open', 'in_progress'].includes(t.status)).length },
                { key: 'resolved', label: 'Resolved', count: tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length },
                { key: 'all', label: 'All', count: tickets.length },
              ]}
            />
          </div>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<LifeBuoy className="h-5 w-5" />}
              title={tab === 'open' ? 'No open tickets' : 'No tickets here'}
              description={tab === 'open' ? 'Everything is resolved. If something comes up, we’re one click away.' : 'Tickets you raise will appear here with their full history.'}
              action={<Button size="sm" onClick={() => setNewOpen(true)} iconLeft={<Plus className="h-3.5 w-3.5" />}>Raise a ticket</Button>}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => (
                <Card key={t.id} hover className="p-4 sm:p-5">
                  <button onClick={() => { setActive(t); setReply(''); }} className="w-full text-left">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><TicketIcon className="h-4.5 w-4.5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13px] font-bold text-ink-900">{t.subject}</p>
                          <StatusBadge status={t.status} size="sm" />
                          <Badge tone={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'neutral'} size="sm">{t.priority}</Badge>
                        </div>
                        <p className="mt-0.5 text-[10.5px] text-ink-500">{t.id} · {t.category} · opened {fmtDate(t.created)} · updated {fmtDate(t.updated)}</p>
                        <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-5 text-ink-500">{t.messages[t.messages.length - 1]?.text}</p>
                        <div className="mt-2 flex items-center gap-3 text-[10.5px]">
                          <span className="inline-flex items-center gap-1 text-ink-400"><MessageSquare className="h-3 w-3" /> {t.messages.length} messages</span>
                          <span className="inline-flex items-center gap-1 font-bold text-brand-700">Open thread <ArrowRight className="h-3 w-3" /></span>
                        </div>
                      </div>
                    </div>
                  </button>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-5">
            <SectionCard title="Quick answers" description="Most questions are answered instantly.">
              <Accordion
                items={[
                  { question: 'How do I get a refund for a cancelled booking?', answer: <span>Open the booking and choose Cancel. Eligible bookings are refunded automatically. See the <Link to="/policies/refunds" className="font-bold text-brand-700">refund policy</Link> for timelines.</span> },
                  { question: 'Can I change the professional assigned to my booking?', answer: 'Yes — message the vendor or contact support at least 12 hours before the slot. We’ll reassign subject to availability at no extra cost.' },
                  { question: 'My professional hasn’t arrived. What now?', answer: 'Check the live tracking in your booking. If they are more than 20 minutes late without notice, you can cancel for a full refund from the booking page.' },
                ]}
              />
            </SectionCard>
          </div>
        </div>

        <aside className="space-y-4">
          <SectionCard title="Talk to us" icon={<MessageSquare className="h-4 w-4" />} bodyClassName="space-y-2">
            <a href="mailto:support@servora.demo" className="flex items-center gap-2.5 rounded-xl border border-ink-200 p-3 transition hover:border-brand-200 hover:bg-brand-50/30">
              <MessageSquare className="h-4 w-4 text-brand-600" />
              <span className="min-w-0 flex-1"><span className="block text-[11.5px] font-bold text-ink-800">Live chat</span><span className="block text-[10px] text-ink-500">Avg. reply 4 min</span></span>
              <Badge tone="success" size="sm" dot>Online</Badge>
            </a>
            <a href="tel:+918000001234" className="flex items-center gap-2.5 rounded-xl border border-ink-200 p-3 transition hover:border-brand-200 hover:bg-brand-50/30">
              <Phone className="h-4 w-4 text-brand-600" />
              <span className="min-w-0 flex-1"><span className="block text-[11.5px] font-bold text-ink-800">Priority phone</span><span className="block text-[10px] text-ink-500">For active bookings</span></span>
            </a>
            <Link to="/help" className="flex items-center gap-2.5 rounded-xl border border-ink-200 p-3 transition hover:border-brand-200 hover:bg-brand-50/30">
              <BookOpen className="h-4 w-4 text-brand-600" />
              <span className="min-w-0 flex-1"><span className="block text-[11.5px] font-bold text-ink-800">Help centre</span><span className="block text-[10px] text-ink-500">120+ guides</span></span>
            </Link>
          </SectionCard>

          <div className="rounded-2xl border border-ink-200 bg-white p-4">
            <p className="flex items-center gap-2 text-[11.5px] font-bold text-ink-800"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Resolution promise</p>
            <p className="mt-1.5 text-[10.5px] leading-5 text-ink-500">We acknowledge every ticket within 4 business hours and aim to resolve it within one business day. Escalations go to a human team lead, not a bot.</p>
            <Link to="/policies/terms" className="mt-1.5 inline-flex text-[10.5px] font-bold text-brand-700">Read our service promise →</Link>
          </div>

          <div className="rounded-2xl bg-ink-950 p-4 text-white">
            <p className="text-[11.5px] font-bold">Emergency safety line</p>
            <p className="mt-1 text-[10.5px] leading-5 text-ink-300">If you feel unsafe during a visit, call our 24/7 safety line immediately.</p>
            <p className="mt-2 font-display text-[15px] font-extrabold tracking-wide text-emerald-400">1800-999-0000</p>
          </div>
        </aside>
      </div>

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.subject} description={active ? `${active.id} · ${active.category} · ${active.priority} priority` : undefined} width="max-w-lg">
        {active && (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2">
              <StatusBadge status={active.status} size="sm" />
              <span className="text-[10.5px] text-ink-400">Opened {fmtDate(active.created)} · Updated {fmtDate(active.updated)}</span>
            </div>

            <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
              {active.messages.map((m, i) => (
                <div key={i} className={m.from === 'me' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[11.5px] leading-5 ${m.from === 'me' ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md border border-ink-100 bg-ink-50 text-ink-700'}`}>
                    {m.text}
                    <span className={`mt-1 block text-[9px] ${m.from === 'me' ? 'text-white/60' : 'text-ink-400'}`}>{m.time}</span>
                  </div>
                </div>
              ))}
              {active.status === 'in_progress' && (
                <p className="text-center text-[10px] text-ink-400">A support specialist is reviewing your ticket.</p>
              )}
            </div>

            <div className="mt-4 border-t border-ink-100 pt-3">
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add a reply…" className="min-h-[80px]" />
              <div className="mt-2 flex items-center justify-between">
                <button onClick={() => toast.info('Attachment added', 'Files are simulated in this demo.')} className="text-[10.5px] font-semibold text-ink-500 hover:text-ink-800">+ Attach a file</button>
                <Button size="sm" onClick={sendReply} disabled={!reply.trim()} iconRight={<Send className="h-3.5 w-3.5" />}>Send reply</Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer open={newOpen} onClose={() => setNewOpen(false)} title="Raise a support ticket" description="Tell us what happened and we’ll take it from there." width="max-w-lg">
        <div className="space-y-3.5">
          <Input label="Subject" placeholder="Brief summary of the issue" value={form.subject} onChange={(e) => { setForm((f) => ({ ...f, subject: e.target.value })); setErrors((e) => ({ ...e, subject: '' })); }} error={errors.subject} required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Select label="Priority" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Ticket['priority'] }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          <Textarea label="Describe the issue" placeholder="Include booking reference, dates and what you’d like us to do." value={form.message} onChange={(e) => { setForm((f) => ({ ...f, message: e.target.value })); setErrors((e) => ({ ...e, message: '' })); }} error={errors.message} required />
          <div className="rounded-lg bg-ink-50 p-3 text-[10px] leading-5 text-ink-500">
            Tip: attach screenshots after creating the ticket. High-priority tickets for active bookings are answered first.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={create}>Create ticket</Button>
          </div>
          <Link to="/help" className={buttonStyles({ variant: 'ghost', size: 'sm', className: 'w-full' })}>Browse the help centre instead</Link>
        </div>
      </Drawer>
    </div>
  );
}
