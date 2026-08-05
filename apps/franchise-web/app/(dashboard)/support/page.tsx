'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LifeBuoy, Search } from 'lucide-react';
import { EmptyState, PageHeader, Panel, Pill } from '@/components/ui';

interface TicketSummary {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface TicketMessage {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

interface TicketDetail extends TicketSummary {
  description: string;
  messages: TicketMessage[];
  category: { name: string };
}

interface HelpArticle {
  id: string;
  title: string;
  body: string;
}

const CATEGORIES = [
  ['FRANCHISE_PAYOUT', 'Payout / settlement'],
  ['TERRITORY_DISPUTE', 'Territory dispute'],
  ['STORE_LINK_ISSUE', 'Store attribution'],
  ['FRANCHISE_KYC', 'KYC / documents'],
  ['MERCHANT_RECRUITMENT', 'Merchant recruitment'],
  ['FRANCHISE_GENERAL', 'General query'],
] as const;

const INPUT =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/franchise/support/${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Request failed');
  return json.data;
}

function SupportInner() {
  const qc = useQueryClient();
  const [view, setView] = useState<'list' | 'new' | string>('list');
  const [articleQuery, setArticleQuery] = useState('');
  const [form, setForm] = useState({ categoryCode: CATEGORIES[0][0] as string, subject: '', description: '' });
  const [reply, setReply] = useState('');

  const tickets = useQuery({
    queryKey: ['franchise', 'support', 'tickets'],
    queryFn: () => api<{ items: TicketSummary[] }>('tickets'),
  });

  const articles = useQuery({
    queryKey: ['franchise', 'support', 'articles', articleQuery],
    queryFn: () => api<HelpArticle[]>(`articles${articleQuery ? `?q=${encodeURIComponent(articleQuery)}` : ''}`),
  });

  const ticketId = view !== 'list' && view !== 'new' ? view : null;
  const detail = useQuery({
    queryKey: ['franchise', 'support', 'ticket', ticketId],
    queryFn: () => api<TicketDetail>(`tickets/${ticketId}`),
    enabled: !!ticketId,
  });

  const create = useMutation({
    mutationFn: () => api<TicketDetail>('tickets', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: async (ticket) => {
      setForm({ categoryCode: CATEGORIES[0][0], subject: '', description: '' });
      await qc.invalidateQueries({ queryKey: ['franchise', 'support', 'tickets'] });
      setView(ticket.id);
    },
  });

  const sendReply = useMutation({
    mutationFn: () => api(`tickets/${ticketId}/reply`, { method: 'POST', body: JSON.stringify({ body: reply.trim() }) }),
    onSuccess: async () => {
      setReply('');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['franchise', 'support', 'ticket', ticketId] }),
        qc.invalidateQueries({ queryKey: ['franchise', 'support', 'tickets'] }),
      ]);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Support" subtitle="Raise and track issues with your account, payouts, or territory." />
        {view !== 'new' && (
          <button
            onClick={() => setView('new')}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            New ticket
          </button>
        )}
      </div>

      {view === 'new' && (
        <Panel title="Create ticket">
          <div className="space-y-3">
            <select
              value={form.categoryCode}
              onChange={(e) => setForm((f) => ({ ...f, categoryCode: e.target.value }))}
              className={INPUT}
            >
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Subject"
              className={INPUT}
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the issue in detail"
              rows={4}
              className={INPUT}
            />
            <div className="flex gap-2">
              <button
                onClick={() => create.mutate()}
                disabled={create.isPending || form.subject.length < 3 || form.description.length < 10}
                className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {create.isPending ? 'Creating…' : 'Create ticket'}
              </button>
              <button
                onClick={() => setView('list')}
                className="rounded-md border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500"
              >
                Cancel
              </button>
            </div>
            {create.isError && <p className="text-sm text-red-300">{(create.error as Error).message}</p>}
          </div>
        </Panel>
      )}

      {ticketId && (
        <Panel
          title={detail.data?.ticketNumber ?? 'Ticket'}
          action={
            <button onClick={() => setView('list')} className="text-xs text-slate-400 hover:text-white">
              ← Back to tickets
            </button>
          }
        >
          {detail.isLoading ? (
            <p className="text-sm text-slate-500">Loading ticket...</p>
          ) : !detail.data ? (
            <EmptyState message="This ticket could not be loaded." />
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={detail.data.status} />
                <span className="text-xs text-slate-500">{detail.data.category?.name}</span>
              </div>
              <p className="font-medium text-white">{detail.data.subject}</p>
              <p className="text-sm text-slate-400">{detail.data.description}</p>
              <div className="space-y-2 border-t border-slate-800 pt-3">
                {(detail.data.messages ?? []).map((m) => (
                  <p key={m.id} className="rounded-md bg-slate-950 p-3 text-sm text-slate-200">
                    {m.body}
                  </p>
                ))}
                {(detail.data.messages ?? []).length === 0 && (
                  <p className="text-xs text-slate-600">No replies yet.</p>
                )}
              </div>
              {detail.data.status !== 'CLOSED' && (
                <div className="space-y-2 pt-1">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply..."
                    rows={3}
                    className={INPUT}
                  />
                  <button
                    onClick={() => sendReply.mutate()}
                    disabled={sendReply.isPending || reply.trim().length === 0}
                    className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {sendReply.isPending ? 'Sending…' : 'Send reply'}
                  </button>
                </div>
              )}
            </div>
          )}
        </Panel>
      )}

      {view === 'list' && (
        <Panel title="Your tickets">
          {tickets.isLoading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (tickets.data?.items ?? []).length === 0 ? (
            <EmptyState message="No tickets yet." />
          ) : (
            <div className="space-y-2">
              {tickets.data?.items.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setView(t.id)}
                  className="block w-full rounded-md border border-slate-800 bg-slate-950 p-3 text-left text-sm hover:border-slate-600"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-white">{t.subject}</span>
                    <StatusPill status={t.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.ticketNumber} · {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </Panel>
      )}

      <Panel title="Help articles">
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-500" />
          <input
            value={articleQuery}
            onChange={(e) => setArticleQuery(e.target.value)}
            placeholder="Search help articles..."
            className={`${INPUT} pl-8`}
          />
        </div>
        {(articles.data ?? []).length === 0 ? (
          <EmptyState message={articleQuery ? `No articles match "${articleQuery}".` : 'No articles available.'} />
        ) : (
          <div className="space-y-2">
            {(articles.data ?? []).map((a) => (
              <div key={a.id} className="rounded-md border border-slate-800 bg-slate-950 p-3">
                <p className="flex items-center gap-2 font-medium text-white">
                  <LifeBuoy className="h-3.5 w-3.5 text-slate-500" /> {a.title}
                </p>
                <p className="mt-1 text-sm text-slate-400">{a.body}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === 'RESOLVED' || status === 'CLOSED') return <Pill tone="emerald">{status}</Pill>;
  if (status === 'ESCALATED') return <Pill tone="red">{status}</Pill>;
  if (status === 'WAITING_CUSTOMER') return <Pill tone="amber">Awaiting your reply</Pill>;
  return <Pill tone="violet">{status.replaceAll('_', ' ')}</Pill>;
}

export default function SupportPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <SupportInner />
    </QueryClientProvider>
  );
}
