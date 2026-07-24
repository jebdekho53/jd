'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSupportTicket, listSupportArticles, listSupportTickets } from '@/lib/api';
import { pretty } from '@/lib/rider-format';
import { Button, Panel, QueryList } from '@/design-system/primitives';

const CATEGORIES = [
  ['APP_ISSUE', 'App issue'],
  ['DELIVERY_DISPUTE', 'Delivery dispute'],
  ['RIDER_EARNINGS', 'Earnings or payout'],
  ['RIDER_ACCOUNT', 'Account'],
  ['RIDER_KYC', 'KYC or documents'],
] as const;

const INPUT =
  'w-full rounded-xl border border-rider-border bg-rider-bg px-3 text-sm text-rider-text';

export function SupportTab() {
  const qc = useQueryClient();
  const router = useRouter();
  // Set when a rider taps "Report an issue" on an order — it pre-fills the
  // ticket and attaches the order server-side.
  const orderId = useSearchParams().get('orderId');

  const tickets = useQuery({ queryKey: ['rider', 'support', 'tickets'], queryFn: listSupportTickets });
  const [articleQuery, setArticleQuery] = useState('');
  const articles = useQuery({
    queryKey: ['rider', 'support', 'articles', articleQuery],
    queryFn: () => listSupportArticles(articleQuery || undefined),
  });

  const [form, setForm] = useState({
    categoryCode: orderId ? 'DELIVERY_DISPUTE' : 'APP_ISSUE',
    subject: orderId ? `Issue with order ${orderId}` : '',
    description: '',
  });

  const create = useMutation({
    mutationFn: () => createSupportTicket({ ...form, orderId: orderId ?? undefined }),
    onSuccess: async (ticket) => {
      setForm({ categoryCode: 'APP_ISSUE', subject: '', description: '' });
      await qc.invalidateQueries({ queryKey: ['rider', 'support', 'tickets'] });
      router.push(`/support/${ticket.id}`);
    },
  });

  return (
    <div className="space-y-4">
      <Panel title="Create ticket">
        <div className="space-y-3">
          {orderId && (
            <p className="rounded-xl bg-rider-accent/10 p-3 text-xs text-rider-accent">
              This ticket will be attached to order {orderId}.
            </p>
          )}
          <select
            value={form.categoryCode}
            onChange={(e) => setForm((f) => ({ ...f, categoryCode: e.target.value }))}
            className={`h-11 ${INPUT}`}
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
            className={`h-11 ${INPUT}`}
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Describe the issue"
            className="min-h-24 w-full rounded-xl border border-rider-border bg-rider-bg p-3 text-sm text-rider-text"
          />
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || form.subject.length < 3 || form.description.length < 10}
          >
            {create.isPending ? 'Creating…' : 'Create ticket'}
          </Button>
          {create.isError && (
            <p className="text-sm text-rider-danger">{(create.error as Error).message}</p>
          )}
        </div>
      </Panel>

      <Panel title="Your tickets">
        {tickets.isLoading ? (
          <p className="text-sm text-rider-muted">Loading…</p>
        ) : tickets.isError ? (
          <p className="rounded-xl bg-rider-danger/10 p-3 text-sm text-rider-danger">
            Could not load your tickets. Check your connection and try again.
          </p>
        ) : (tickets.data?.items ?? []).length === 0 ? (
          <p className="text-sm text-rider-muted">No tickets yet.</p>
        ) : (
          <ul className="space-y-2">
            {tickets.data?.items.map((t) => (
              <li key={t.id}>
                <Link href={`/support/${t.id}`} className="block rounded-xl bg-rider-bg p-3">
                  <p className="font-bold text-rider-text">{t.subject}</p>
                  <p className="text-xs text-rider-muted">
                    {t.ticketNumber} · {pretty(t.status)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Help articles">
        <input
          value={articleQuery}
          onChange={(e) => setArticleQuery(e.target.value)}
          placeholder="Search help articles…"
          className={`${INPUT} mb-3 h-11`}
        />
        <QueryList
          query={articles}
          empty={articleQuery ? `No articles match "${articleQuery}".` : 'No articles available.'}
          errorTitle="Could not load help articles"
        >
          {(items) => (
            <ul className="space-y-2">
              {(articleQuery ? items : items.slice(0, 5)).map((a) => (
                <li key={a.id} className="rounded-xl bg-rider-bg p-3">
                  <p className="font-bold text-rider-text">{a.title}</p>
                  {a.summary && <p className="text-sm text-rider-muted">{a.summary}</p>}
                </li>
              ))}
            </ul>
          )}
        </QueryList>
        <Link href="/help" className="mt-3 inline-block text-sm font-bold text-rider-accent">
          Open the full help centre
        </Link>
      </Panel>
    </div>
  );
}
