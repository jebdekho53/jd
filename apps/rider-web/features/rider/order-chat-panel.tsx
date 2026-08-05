'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listOrderChat, sendOrderChat } from '@/lib/api';
import { Button } from '@/design-system/primitives';

export function OrderChatPanel({ orderId, customerArea }: { orderId: string; customerArea: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const messages = useQuery({
    queryKey: ['rider', 'order-chat', orderId],
    queryFn: () => listOrderChat(orderId),
    enabled: open,
    refetchInterval: open ? 4_000 : false,
  });

  const send = useMutation({
    mutationFn: (body: string) => sendOrderChat(orderId, body),
    onSuccess: (message) => {
      qc.setQueryData<typeof message[]>(['rider', 'order-chat', orderId], (prev) =>
        prev ? [...prev, message] : [message],
      );
    },
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.data]);

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    send.mutate(body);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <MessageCircle className="h-4 w-4" aria-hidden /> Chat with customer
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="flex h-[70vh] w-full max-w-md flex-col rounded-t-2xl bg-rider-surface shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-rider-border px-4 py-3">
              <p className="text-sm font-bold text-rider-text">Chat with {customerArea}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
                <X className="h-5 w-5 text-rider-muted" />
              </button>
            </div>

            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {(messages.data ?? []).length === 0 && (
                <p className="mt-8 text-center text-sm text-rider-muted">
                  No messages yet — say hello.
                </p>
              )}
              {(messages.data ?? []).map((m) => (
                <div key={m.id} className={`flex ${m.senderType === 'RIDER' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      m.senderType === 'RIDER'
                        ? 'bg-rider-accent text-rider-bg'
                        : 'bg-rider-bg text-rider-text'
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-rider-border p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="Type a message"
                className="h-11 flex-1 rounded-full border border-rider-border bg-rider-bg px-4 text-sm text-rider-text"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || send.isPending}
                aria-label="Send message"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rider-accent text-rider-bg disabled:opacity-50"
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
