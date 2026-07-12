'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react';
import { Badge, Button, Input } from '@/design-system';
import {
  listWhatsAppConversations,
  listWhatsAppMessages,
  markWhatsAppConversationRead,
  sendWhatsAppReply,
  type WhatsAppConversation,
  type WhatsAppMessage,
} from '@/services/whatsapp-api';
import { useWhatsAppInboxSocket } from './use-whatsapp-inbox-socket';

/** Fallback cadence while the socket is down; backed right off while it is up. */
const POLL_MS = 15_000;
const LIVE_POLL_MS = 60_000;

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function conversationTitle(conversation: WhatsAppConversation): string {
  return conversation.displayName || conversation.phoneNumber || `+${conversation.waId}`;
}

/** Meta only accepts free-form replies within 24 hours of the customer's last message. */
function isReplyWindowOpen(lastMessageAt: string | null): boolean {
  if (!lastMessageAt) return false;
  return Date.now() - new Date(lastMessageAt).getTime() < 24 * 60 * 60 * 1000;
}

function StatusTicks({ status }: { status: string | null }) {
  if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-sky-500" aria-label="Read" />;
  if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 opacity-60" aria-label="Delivered" />;
  if (status === 'failed') return <AlertCircle className="h-3.5 w-3.5 text-red-500" aria-label="Failed" />;
  return <Check className="h-3.5 w-3.5 opacity-60" aria-label="Sent" />;
}

export function WhatsAppInboxContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Inbound messages and delivery-status ticks arrive over the socket; the
  // queries below stay the source of truth and simply refetch on the signal.
  const connected = useWhatsAppInboxSocket({
    onMessageReceived: () => {
      void queryClient.invalidateQueries({ queryKey: ['whatsapp', 'conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['whatsapp', 'messages'] });
    },
    onStatusUpdated: () => {
      void queryClient.invalidateQueries({ queryKey: ['whatsapp', 'messages'] });
    },
  });

  const pollInterval = connected ? LIVE_POLL_MS : POLL_MS;

  const conversationsQuery = useQuery({
    queryKey: ['whatsapp', 'conversations', debouncedSearch, unreadOnly],
    queryFn: () => listWhatsAppConversations({ search: debouncedSearch, unreadOnly, limit: 50 }),
    refetchInterval: pollInterval,
  });

  const messagesQuery = useQuery({
    queryKey: ['whatsapp', 'messages', selectedId],
    queryFn: () => listWhatsAppMessages(selectedId as string, { limit: 200 }),
    enabled: Boolean(selectedId),
    refetchInterval: pollInterval,
  });

  const markRead = useMutation({
    mutationFn: markWhatsAppConversationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp', 'conversations'] }),
  });

  const sendReply = useMutation({
    mutationFn: (text: string) => sendWhatsAppReply(selectedId as string, text),
    onSuccess: () => {
      setReply('');
      setReplyError(null);
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'messages', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'conversations'] });
    },
    onError: (err: Error) => setReplyError(err.message || 'Could not send the reply'),
  });

  const messages = messagesQuery.data?.items ?? [];

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const openConversation = (conversation: WhatsAppConversation) => {
    setSelectedId(conversation.id);
    setReply('');
    setReplyError(null);
    if (conversation.unreadCount > 0) markRead.mutate(conversation.id);
  };

  const activeConversation = messagesQuery.data?.conversation ?? null;

  // Opening or replying zeroes a conversation's unread count, which would drop it
  // out of an "unread only" list while the user is still reading it. Pin the open
  // thread so it never vanishes from under them.
  const fetched = conversationsQuery.data?.items ?? [];
  const conversations =
    activeConversation && !fetched.some((c) => c.id === activeConversation.id)
      ? [activeConversation, ...fetched]
      : fetched;

  // The 24h window runs from the customer's last INBOUND message — not from
  // `lastMessageAt`, which our own replies also bump.
  const lastInboundAt = [...messages].reverse().find((m) => m.direction === 'INBOUND')?.timestamp;
  const replyWindowOpen = isReplyWindowOpen(lastInboundAt ?? null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" aria-hidden />
          {conversationsQuery.data
            ? `${conversationsQuery.data.total} conversations · ${conversationsQuery.data.unreadConversations} unread`
            : 'Loading conversations…'}
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            void conversationsQuery.refetch();
            if (selectedId) void messagesQuery.refetch();
          }}
          disabled={conversationsQuery.isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${conversationsQuery.isFetching ? 'animate-spin' : ''}`}
            aria-hidden
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* Conversation list — hidden on mobile once a thread is open. */}
        <section
          className={`rounded-xl border bg-card ${selectedId ? 'hidden md:block' : 'block'}`}
          aria-label="WhatsApp conversations"
        >
          <div className="space-y-3 border-b p-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or number"
                className="pl-9"
                aria-label="Search conversations"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Unread only
            </label>
          </div>

          <div className="max-h-[calc(100vh-20rem)] min-h-[16rem] overflow-y-auto">
            {conversationsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading conversations…
              </div>
            ) : conversationsQuery.isError ? (
              <div className="space-y-3 p-8 text-center">
                <p className="text-sm text-red-600">
                  {(conversationsQuery.error as Error).message || 'Could not load conversations'}
                </p>
                <Button variant="secondary" onClick={() => void conversationsQuery.refetch()}>
                  Try again
                </Button>
              </div>
            ) : conversations.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                {debouncedSearch || unreadOnly
                  ? 'No conversations match this filter.'
                  : 'No WhatsApp messages yet. Incoming customer messages will appear here.'}
              </p>
            ) : (
              <ul className="divide-y">
                {conversations.map((conversation) => (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => openConversation(conversation)}
                      aria-current={selectedId === conversation.id}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/50 ${
                        selectedId === conversation.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{conversationTitle(conversation)}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {conversation.lastMessageText || 'No message preview'}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <Badge tone="success">{conversation.unreadCount}</Badge>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Thread */}
        <section
          className={`flex min-h-[24rem] flex-col rounded-xl border bg-card ${
            selectedId ? 'flex' : 'hidden md:flex'
          }`}
          aria-label="Conversation thread"
        >
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
              Select a conversation to read the thread.
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b p-3">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="rounded-md p-1 hover:bg-muted md:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                </button>
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {activeConversation ? conversationTitle(activeConversation) : 'Conversation'}
                  </p>
                  {activeConversation && (
                    <p className="truncate text-xs text-muted-foreground">+{activeConversation.waId}</p>
                  )}
                </div>
              </header>

              <div className="flex-1 space-y-2 overflow-y-auto p-4 max-h-[calc(100vh-24rem)]">
                {messagesQuery.isLoading ? (
                  <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Loading messages…
                  </div>
                ) : messagesQuery.isError ? (
                  <div className="space-y-3 p-8 text-center">
                    <p className="text-sm text-red-600">
                      {(messagesQuery.error as Error).message || 'Could not load messages'}
                    </p>
                    <Button variant="secondary" onClick={() => void messagesQuery.refetch()}>
                      Try again
                    </Button>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    No messages in this conversation yet.
                  </p>
                ) : (
                  messages.map((message: WhatsAppMessage) => {
                    const outbound = message.direction === 'OUTBOUND';
                    return (
                      <div
                        key={message.id}
                        className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm sm:max-w-[70%] ${
                            outbound
                              ? 'rounded-br-sm bg-emerald-600 text-white'
                              : 'rounded-bl-sm bg-muted'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {message.text ?? `[${message.type}]`}
                          </p>
                          <div
                            className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
                              outbound ? 'text-emerald-50/80' : 'text-muted-foreground'
                            }`}
                          >
                            <span>{formatTime(message.timestamp)}</span>
                            {outbound && <StatusTicks status={message.status} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={threadEndRef} />
              </div>

              <footer className="border-t p-3">
                {messagesQuery.isSuccess && !replyWindowOpen && (
                  <p className="mb-2 flex items-start gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    WhatsApp only allows free-form replies within 24 hours of the customer&apos;s last
                    message. Sending now will be rejected by Meta.
                  </p>
                )}
                {replyError && (
                  <p className="mb-2 rounded-md bg-red-50 p-2 text-xs text-red-700">{replyError}</p>
                )}
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const text = reply.trim();
                    if (text && !sendReply.isPending) sendReply.mutate(text);
                  }}
                >
                  <Input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type a reply…"
                    aria-label="Reply message"
                    maxLength={4096}
                  />
                  <Button type="submit" disabled={!reply.trim() || sendReply.isPending}>
                    {sendReply.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Send className="h-4 w-4" aria-hidden />
                    )}
                    <span className="sr-only">Send reply</span>
                  </Button>
                </form>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
