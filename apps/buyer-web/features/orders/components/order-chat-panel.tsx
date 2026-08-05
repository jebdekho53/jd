'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useOrderChatQuery, useSendOrderChatMutation } from '@/hooks/use-orders';

interface OrderChatPanelProps {
  orderId: string;
  riderName: string;
}

export function OrderChatPanel({ orderId, riderName }: OrderChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const { data: messages } = useOrderChatQuery(orderId, open);
  const send = useSendOrderChatMutation(orderId);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    send.mutate(body);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700"
        aria-label={`Chat with ${riderName}`}
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="flex h-[70vh] w-full max-w-md flex-col rounded-t-2xl bg-card shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <p className="text-sm font-semibold">Chat with {riderName}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {(messages ?? []).length === 0 && (
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  Say hello — messages here go directly to your rider.
                </p>
              )}
              {(messages ?? []).map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.senderType === 'BUYER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      m.senderType === 'BUYER'
                        ? 'bg-brand-600 text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-border/60 p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="Type a message"
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || send.isPending}
                aria-label="Send message"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
