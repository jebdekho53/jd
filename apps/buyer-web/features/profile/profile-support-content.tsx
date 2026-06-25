'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProfileShell } from '@/features/profile/components/profile-shell';
import { MenuSection } from '@/features/profile/components/menu-section';
import { MenuRow } from '@/features/profile/components/menu-row';
import { HelpCircle, MessageCircle, Plus, ChevronRight } from 'lucide-react';
import {
  createSupportTicket,
  fetchHelpArticles,
  fetchSupportCategories,
  fetchSupportTicket,
  fetchSupportTickets,
  replySupportTicket,
  submitTicketFeedback,
} from '@/services/support/support-api';

const BUYER_CATEGORIES = [
  { code: 'ORDER_ISSUE', label: 'Order Issues' },
  { code: 'REFUND_ISSUE', label: 'Refund Issues' },
  { code: 'PAYMENT_PROBLEM', label: 'Payment Problems' },
  { code: 'WALLET_ISSUE', label: 'Wallet Issues' },
  { code: 'DELIVERY_PROBLEM', label: 'Delivery Problems' },
  { code: 'PRODUCT_QUALITY', label: 'Product Quality' },
  { code: 'MERCHANT_COMPLAINT', label: 'Merchant Complaint' },
  { code: 'ACCOUNT_ISSUE', label: 'Account Issues' },
];

export function ProfileSupportContent() {
  const [view, setView] = useState<'home' | 'list' | 'create' | 'detail'>('home');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: articles } = useQuery({
    queryKey: ['support', 'articles'],
    queryFn: () => fetchHelpArticles(),
  });

  const { data: tickets } = useQuery({
    queryKey: ['support', 'tickets'],
    queryFn: fetchSupportTickets,
    enabled: view === 'list' || view === 'home',
  });

  const { data: ticket } = useQuery({
    queryKey: ['support', 'ticket', selectedId],
    queryFn: () => fetchSupportTicket(selectedId!),
    enabled: view === 'detail' && !!selectedId,
  });

  if (view === 'create') {
    return (
      <CreateTicketForm
        onBack={() => setView('home')}
        onCreated={(id) => {
          qc.invalidateQueries({ queryKey: ['support', 'tickets'] });
          setSelectedId(id);
          setView('detail');
        }}
      />
    );
  }

  if (view === 'detail' && ticket) {
    return (
      <TicketDetail
        ticket={ticket}
        onBack={() => setView('list')}
        onReply={async (body) => {
          await replySupportTicket(ticket.id, body);
          qc.invalidateQueries({ queryKey: ['support', 'ticket', ticket.id] });
        }}
        onFeedback={async (rating, comment) => {
          await submitTicketFeedback(ticket.id, rating, comment);
          qc.invalidateQueries({ queryKey: ['support', 'ticket', ticket.id] });
        }}
      />
    );
  }

  if (view === 'list') {
    return (
      <ProfileShell title="My tickets" subtitle="Track and reply to support requests">
        <button
          type="button"
          onClick={() => setView('home')}
          className="mb-4 text-sm text-primary hover:underline"
        >
          ← Back
        </button>
        <div className="space-y-2">
          {(tickets ?? []).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setSelectedId(t.id);
                setView('detail');
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-border/50 bg-card px-4 py-3 text-left"
            >
              <div>
                <p className="text-sm font-semibold">{t.subject}</p>
                <p className="text-xs text-jd-text-muted">{t.ticketNumber} · {t.status}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
          {(tickets ?? []).length === 0 && (
            <p className="text-center text-sm text-jd-text-muted py-8">No tickets yet</p>
          )}
        </div>
      </ProfileShell>
    );
  }

  return (
    <ProfileShell title="Help & support" subtitle="We're here to help">
      <MenuSection title="Support">
        <MenuRow
          icon={Plus}
          title="Create ticket"
          subtitle="Report order, payment or delivery issues"
          onClick={() => setView('create')}
        />
        <MenuRow
          icon={MessageCircle}
          title="My tickets"
          subtitle={`${tickets?.length ?? 0} active conversations`}
          onClick={() => setView('list')}
        />
        <MenuRow icon={HelpCircle} title="Help articles" subtitle="Searchable guides" href="#articles" />
      </MenuSection>

      <section id="articles" className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-jd-text-muted">
          Help articles
        </h2>
        <div className="space-y-3">
          {(articles ?? []).map((a) => (
            <details key={a.title} className="rounded-2xl border border-border/50 bg-card px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold">{a.title}</summary>
              <p className="mt-2 text-sm text-jd-text-muted whitespace-pre-wrap">{a.body}</p>
            </details>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-jd-text-muted">
          More at{' '}
          <Link href="/help" className="font-medium text-primary hover:underline">
            Help center
          </Link>
        </p>
      </section>
    </ProfileShell>
  );
}

function CreateTicketForm({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: (id: string) => void;
}) {
  const [categoryCode, setCategoryCode] = useState(BUYER_CATEGORIES[0].code);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState('');
  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createSupportTicket({
        categoryCode,
        subject,
        description,
        orderId: orderId || undefined,
      }),
    onSuccess: (data) => onCreated(data.id),
  });

  return (
    <ProfileShell title="New ticket" subtitle="Describe your issue">
      <button type="button" onClick={onBack} className="mb-4 text-sm text-primary hover:underline">
        ← Back
      </button>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutate();
        }}
      >
        <label className="block text-sm">
          Category
          <select
            value={categoryCode}
            onChange={(e) => setCategoryCode(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          >
            {BUYER_CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Subject
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            minLength={3}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            rows={4}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Order ID (optional)
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {isPending ? 'Submitting…' : 'Submit ticket'}
        </button>
      </form>
    </ProfileShell>
  );
}

function TicketDetail({
  ticket,
  onBack,
  onReply,
  onFeedback,
}: {
  ticket: Awaited<ReturnType<typeof fetchSupportTicket>>;
  onBack: () => void;
  onReply: (body: string) => Promise<void>;
  onFeedback: (rating: number, comment?: string) => Promise<void>;
}) {
  const [reply, setReply] = useState('');
  const [rating, setRating] = useState(5);

  return (
    <ProfileShell title={ticket.subject} subtitle={ticket.ticketNumber}>
      <button type="button" onClick={onBack} className="mb-4 text-sm text-primary hover:underline">
        ← Back
      </button>
      <p className="mb-4 text-xs text-jd-text-muted">Status: {ticket.status}</p>
      <div className="space-y-3 mb-6">
        {(ticket.messages ?? []).map((m) => (
          <div key={m.id} className="rounded-xl bg-muted/50 px-3 py-2 text-sm">
            {m.body}
            <p className="mt-1 text-[10px] text-muted-foreground">
              {new Date(m.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      {!['CLOSED'].includes(ticket.status) && (
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await onReply(reply);
            setReply('');
          }}
        >
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Reply…"
            className="flex-1 rounded-xl border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm text-white">
            Send
          </button>
        </form>
      )}
      {['RESOLVED', 'CLOSED'].includes(ticket.status) && !ticket.feedback && (
        <div className="mt-6 rounded-xl border p-4">
          <p className="text-sm font-medium mb-2">Rate resolution</p>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`h-8 w-8 rounded ${rating >= n ? 'bg-amber-400' : 'bg-muted'}`}
              >
                ★
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onFeedback(rating)}
            className="text-sm text-primary"
          >
            Submit feedback
          </button>
        </div>
      )}
    </ProfileShell>
  );
}
