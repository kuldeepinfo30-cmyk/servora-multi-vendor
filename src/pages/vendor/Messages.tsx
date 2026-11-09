import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  Info,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  User,
} from 'lucide-react';
import type { Conversation } from '@/lib/types';
import { cn, fmtDate, inr, to12h } from '@/lib/utils';
import { getService } from '@/lib/data';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Avatar, Badge, Button, buttonStyles, Card, Skeleton } from '@/components/ui/primitives';
import { PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { ChatWindow, ConversationList } from '@/components/chat';

const vendorConversations: Conversation[] = [
  {
    id: 'vc1', name: 'Sneha Iyer', role: 'Customer', tone: 'violet', lastMessage: 'Please call before arriving — gated society.', time: '10:42 AM', unread: 2, online: true, bookingRef: 'SRV-24153',
    messages: [
      { id: 'm1', from: 'them', text: 'Hi! I booked the 3 BHK deep clean for tomorrow at 9 AM.', time: 'Yesterday, 4:10 PM' },
      { id: 'm2', from: 'me', text: 'Thanks Sneha! Your crew lead is Sunita — she will call 30 minutes before arrival.', time: 'Yesterday, 4:22 PM' },
      { id: 'm3', from: 'them', text: 'Please call before arriving — gated society.', time: '10:42 AM' },
    ],
  },
  {
    id: 'vc2', name: 'Priya Sharma', role: 'Customer', tone: 'violet', lastMessage: 'Focus on the chimney and cabinets, please.', time: '9:18 AM', unread: 0, online: true, bookingRef: 'SRV-24151',
    messages: [
      { id: 'm1', from: 'them', text: 'Focus on the chimney and cabinets, please.', time: '9:18 AM' },
      { id: 'm2', from: 'me', text: 'Noted! Our kitchen specialist will bring a degreaser safe for modular surfaces.', time: '9:24 AM' },
      { id: 'm3', from: 'them', text: 'Perfect, thank you!', time: '9:26 AM' },
    ],
  },
  {
    id: 'vc3', name: 'Kabir Malhotra', role: 'Customer', tone: 'warning', lastMessage: 'Can we shift to 10 AM instead?', time: 'Yesterday', unread: 1, online: false, bookingRef: 'SRV-24159',
    messages: [
      { id: 'm1', from: 'them', text: 'Can we shift to 10 AM instead?', time: 'Yesterday, 11:00 AM' },
      { id: 'm2', from: 'me', text: 'Let me check the crew schedule and confirm within the hour.', time: 'Yesterday, 11:12 AM' },
    ],
  },
  {
    id: 'vc4', name: 'Meera Nair', role: 'Customer', tone: 'amber', lastMessage: 'The sofa smells fresh again. Thank you!', time: '2d ago', unread: 0, online: false, bookingRef: 'SRV-24160',
    messages: [
      { id: 'm1', from: 'them', text: 'The sofa smells fresh again. Thank you!', time: '2d ago' },
      { id: 'm2', from: 'me', text: 'So glad to hear it, Meera! We’ve shared your feedback with the team.', time: '2d ago' },
    ],
  },
];

export default function VendorMessages() {
  const loading = useMockLoad(340);
  const [activeId, setActiveId] = useState(vendorConversations[0].id);
  const [mobileOpen, setMobileOpen] = useState(false);
  const bookings = useApp((s) => s.bookings);
  const active = vendorConversations.find((c) => c.id === activeId) ?? vendorConversations[0];
  const unread = vendorConversations.reduce((a, c) => a + c.unread, 0);

  const linked = bookings.find((b) => b.ref === active.bookingRef) ?? bookings.find((b) => b.customerName === active.name);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 lg:grid-cols-[300px_1fr_300px]"><Skeleton className="hidden h-[600px] lg:block" /><Skeleton className="h-[600px]" /><Skeleton className="hidden h-[600px] lg:block" /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Keep customers updated about arrival times, access and special requests."
        actions={
          <>
            <Badge tone={unread ? 'warning' : 'success'} size="md" dot>{unread} unread</Badge>
            <Badge tone="success" size="md">Avg. reply 6 min</Badge>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[320px_1fr_296px]">
        <div className={cn('min-h-0', mobileOpen && 'hidden xl:block')}>
          <ConversationList conversations={vendorConversations} activeId={activeId} onSelect={(id) => { setActiveId(id); setMobileOpen(true); }} className="h-[600px]" />
        </div>

        <div className={cn('min-w-0', !mobileOpen && 'hidden xl:block')}>
          <div className="mb-2 xl:hidden">
            <button onClick={() => setMobileOpen(false)} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-500"><ArrowLeft className="h-3.5 w-3.5" /> All conversations</button>
          </div>
          <ChatWindow conversation={active} me="them" className="h-[600px]" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['On my way, 10 min away', 'Crew has arrived', 'Job completed — please review', 'Can we reschedule?', 'Thank you for booking!'].map((t) => (
              <button key={t} onClick={() => toast.info('Quick reply selected', 'Paste and send from the composer above.')} className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-ink-500 transition hover:border-brand-300 hover:bg-brand-50">{t}</button>
            ))}
          </div>
        </div>

        <div className={cn('space-y-4', !mobileOpen && 'hidden xl:block')}>
          <Card className="p-4">
            <div className="flex items-center gap-2.5">
              <Avatar name={active.name} tone={active.tone} online={active.online} />
              <div className="min-w-0"><p className="truncate text-[12.5px] font-bold text-ink-900">{active.name}</p><p className="text-[10px] text-ink-400">{active.online ? 'Online now' : 'Last seen 2h ago'}</p></div>
            </div>
            <div className="mt-3 space-y-1.5 border-t border-ink-100 pt-3 text-[10.5px]">
              <p className="flex items-center gap-1.5 text-ink-500"><Phone className="h-3 w-3" /> +91 99301 22110</p>
              <p className="flex items-center gap-1.5 text-ink-500"><MapPin className="h-3 w-3" /> Powai, Mumbai</p>
              <p className="flex items-center gap-1.5 text-ink-500"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.9 · 5 bookings with you</p>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" iconLeft={<User className="h-3.5 w-3.5" />} onClick={() => toast.info('Customer profile', 'Open Customers to see full history.')}>Profile</Button>
              <Button variant="outline" size="sm" className="flex-1" iconLeft={<Phone className="h-3.5 w-3.5" />} onClick={() => toast.info('Calling', `Dialling ${active.name}`)}>Call</Button>
            </div>
          </Card>

          {linked && (
            <SectionCard title="Linked booking" action={<StatusBadge status={linked.status} size="sm" />} bodyClassName="space-y-2">
              <p className="text-[11.5px] font-bold text-ink-800">{getService(linked.serviceId)?.name}</p>
              <p className="flex items-center gap-1.5 text-[10.5px] text-ink-500"><Clock className="h-3 w-3" /> {fmtDate(linked.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {to12h(linked.time)}</p>
              <p className="flex items-center gap-1.5 text-[10.5px] text-ink-500"><MapPin className="h-3 w-3" /> {linked.address.split(',').slice(0, 2).join(',')}</p>
              <div className="flex items-center justify-between border-t border-ink-100 pt-2 text-[11px]"><span className="text-ink-500">Amount</span><span className="font-bold text-ink-900">{inr(linked.amount)}</span></div>
              <Link to="/vendor/bookings" className={buttonStyles({ variant: 'soft', size: 'sm', className: 'mt-1 w-full' })}><CalendarCheck className="h-3.5 w-3.5" /> Open booking</Link>
            </SectionCard>
          )}

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900"><ShieldCheck className="h-3.5 w-3.5" /> Safety reminder</p>
            <p className="mt-1 text-[10px] leading-4 text-emerald-800">Keep all payments and communication inside Servora. Off-platform payments are not protected.</p>
          </div>

          <div className="rounded-xl border border-ink-200 bg-white p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-ink-800"><Sparkles className="h-3.5 w-3.5 text-amber-500" /> Smart replies</p>
            <p className="mt-1 text-[10px] leading-4 text-ink-500">Vendor conversations with a reply time under 10 minutes convert 34% better.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
