import { useEffect, useRef, useState } from 'react';
import { CheckCheck, ImagePlus, Info, MoreHorizontal, Paperclip, Send, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/lib/types';
import { Avatar, Badge, Button } from './ui/primitives';
import { toast } from '@/store/toast';

export function ChatWindow({
  conversation,
  me = 'me',
  className,
  compact,
}: {
  conversation: Conversation;
  me?: 'me' | 'them';
  className?: string;
  compact?: boolean;
}) {
  const [messages, setMessages] = useState(conversation.messages);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(conversation.messages);
  }, [conversation.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const send = (value?: string) => {
    const body = (value ?? text).trim();
    if (!body) return;
    setMessages((prev) => [
      ...prev,
      { id: `m${Date.now()}`, from: 'me', text: body, time: 'Just now' },
    ]);
    setText('');
  };

  return (
    <div className={cn('flex min-h-0 flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white', className)}>
      <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
        <Avatar name={conversation.name} tone={conversation.tone} online={conversation.online} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[13.5px] font-bold text-ink-900">{conversation.name}</p>
            <span className="text-[10.5px] font-medium text-ink-400">{conversation.role}</span>
          </div>
          <p className="text-[10.5px] text-ink-400">
            {conversation.online ? 'Online · usually replies in 10 min' : 'Last seen 2h ago'}
          </p>
        </div>
        <button className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {conversation.bookingRef && (
        <div className="flex items-center gap-2 border-b border-brand-100 bg-brand-50/60 px-4 py-2 text-[11px]">
          <Info className="h-3.5 w-3.5 text-brand-600" />
          <span className="font-semibold text-brand-800">Chat linked to booking</span>
          <span className="font-mono text-brand-600">{conversation.bookingRef}</span>
          <Button variant="ghost" size="xs" className="ml-auto h-6 text-brand-700">
            View booking
          </Button>
        </div>
      )}

      <div className={cn('flex-1 space-y-3 overflow-y-auto bg-ink-50/40 px-4 py-4', compact ? 'max-h-[360px]' : 'min-h-[320px]')}>
        <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-ink-400">Today</p>
        {messages.map((m) => {
          const mine = m.from === 'me' ? me === 'me' : me === 'them';
          return (
            <div key={m.id} className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
              {!mine && <Avatar name={conversation.name} size="xs" tone={conversation.tone} />}
              <div className={cn('max-w-[78%]', mine && 'text-right')}>
                <div
                  className={cn(
                    'inline-block rounded-2xl px-3.5 py-2.5 text-left text-[12.5px] leading-5 shadow-sm',
                    mine
                      ? 'rounded-br-md bg-brand-600 text-white'
                      : 'rounded-bl-md border border-ink-100 bg-white text-ink-700',
                  )}
                >
                  {m.text}
                </div>
                <div className={cn('mt-1 flex items-center gap-1 text-[9.5px] text-ink-400', mine && 'justify-end')}>
                  {m.time}
                  {mine && <CheckCheck className="h-3 w-3 text-brand-500" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t border-ink-100 p-3">
        <div className="mb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
          {['Thanks for the update!', 'What time will you arrive?', 'Please call before arriving.'].map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="shrink-0 rounded-full border border-ink-200 px-2.5 py-1 text-[10.5px] font-medium text-ink-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-1.5 rounded-xl border border-ink-200 bg-white px-2 py-1.5 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10">
          <button
            onClick={() => toast.info('Attachments', 'File uploads are stubbed in this frontend demo.')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-600"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            onClick={() => toast.info('Photos', 'Image sharing is stubbed in this frontend demo.')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-600"
          >
            <ImagePlus className="h-4 w-4" />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Write a message…"
            className="max-h-24 min-h-[34px] flex-1 resize-none bg-transparent px-1 py-1.5 text-[12.5px] text-ink-800 placeholder:text-ink-400 focus:outline-none"
          />
          <button className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 sm:flex">
            <Smile className="h-4 w-4" />
          </button>
          <Button size="icon-sm" onClick={() => send()} className="shrink-0">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[9.5px] text-ink-400">
          For your safety, keep payments and personal details inside Servora.
        </p>
      </div>
    </div>
  );
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  className,
}: {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const filtered = conversations.filter((c) =>
    `${c.name} ${c.lastMessage}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className={cn('flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white', className)}>
      <div className="border-b border-ink-100 p-3">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages…"
            className="h-9 w-full rounded-lg border border-ink-200 bg-ink-50/50 pl-3 pr-8 text-[12px] text-ink-700 placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:outline-none"
          />
        </div>
      </div>
      <div className="flex-1 divide-y divide-ink-100 overflow-y-auto">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              'flex w-full items-start gap-3 px-3.5 py-3 text-left transition',
              activeId === c.id ? 'bg-brand-50/70' : 'hover:bg-ink-50/60',
            )}
          >
            <Avatar name={c.name} tone={c.tone} online={c.online} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[12.5px] font-bold text-ink-900">{c.name}</p>
                <span className="shrink-0 text-[9.5px] text-ink-400">{c.time}</span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-[11.5px] text-ink-500">{c.lastMessage}</p>
              <div className="mt-1 flex items-center gap-2">
                {c.bookingRef && (
                  <span className="font-mono text-[9px] font-semibold text-brand-600">{c.bookingRef}</span>
                )}
                {c.unread > 0 && (
                  <Badge tone="brand" size="sm" className="ml-auto">
                    {c.unread}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
