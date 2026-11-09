import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info, LifeBuoy, ShieldCheck, Sparkles } from 'lucide-react';
import { CONVERSATIONS } from '@/lib/data';
import { useMockLoad } from '@/lib/hooks';
import { Badge, Button, buttonStyles, Skeleton } from '@/components/ui/primitives';
import { PageHeader } from '@/components/ui/data-display';
import { ChatWindow, ConversationList } from '@/components/chat';
import { cn } from '@/lib/utils';

export default function CustomerMessages() {
  const loading = useMockLoad(380);
  const [activeId, setActiveId] = useState(CONVERSATIONS[0]?.id ?? '');
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = CONVERSATIONS.find((c) => c.id === activeId) ?? CONVERSATIONS[0];
  const unread = CONVERSATIONS.reduce((s, c) => s + c.unread, 0);

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Chat with vendors and support about bookings, arrival times and special requests."
        actions={
          <>
            <Badge tone="success" size="md" dot>{unread} unread</Badge>
            <Link to="/customer/support" className={buttonStyles({ variant: 'outline', size: 'md' })}>
              <LifeBuoy className="h-4 w-4" /> Support
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]"><Skeleton className="h-[560px]" /><Skeleton className="hidden h-[560px] lg:block" /></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <div className={cn('min-h-0', mobileOpen && 'hidden lg:block')}>
            <ConversationList
              conversations={CONVERSATIONS}
              activeId={activeId}
              onSelect={(id) => { setActiveId(id); setMobileOpen(true); }}
              className="h-[560px]"
            />
          </div>
          <div className={cn('min-w-0', !mobileOpen && 'hidden lg:block')}>
            <div className="mb-2 lg:hidden">
              <button onClick={() => setMobileOpen(false)} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-500">
                <ArrowLeft className="h-3.5 w-3.5" /> All conversations
              </button>
            </div>
            {active ? (
              <ChatWindow conversation={active} className="h-[560px]" />
            ) : (
              <div className="flex h-[560px] items-center justify-center rounded-2xl border border-dashed border-ink-200 text-[12px] text-ink-400">
                Select a conversation to start chatting.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-200 bg-white p-4">
          <p className="flex items-center gap-2 text-[11.5px] font-bold text-ink-800"><Info className="h-4 w-4 text-brand-600" /> Response times</p>
          <p className="mt-1 text-[10.5px] leading-5 text-ink-500">Vendors typically reply within 10 minutes during business hours. Support replies 24/7.</p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-4">
          <p className="flex items-center gap-2 text-[11.5px] font-bold text-ink-800"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Stay safe</p>
          <p className="mt-1 text-[10.5px] leading-5 text-ink-500">Never share OTPs or pay outside Servora. All chats are monitored for safety.</p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-4">
          <p className="flex items-center gap-2 text-[11.5px] font-bold text-ink-800"><Sparkles className="h-4 w-4 text-amber-500" /> Smart replies</p>
          <p className="mt-1 text-[10.5px] leading-5 text-ink-500">Ask about arrival time, gate access or rescheduling — the assistant can draft it for you.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-2 rounded-xl bg-ink-950 px-4 py-3.5 text-white sm:flex-row">
        <p className="text-[11.5px]"><span className="font-bold">Need urgent help with an active booking?</span> Call our priority line for immediate assistance.</p>
        <Button size="sm" className="bg-white text-ink-900 hover:bg-ink-100" onClick={() => (window.location.href = 'tel:+918000001234')}>
          Call 1800-123-4567
        </Button>
      </div>
    </div>
  );
}
