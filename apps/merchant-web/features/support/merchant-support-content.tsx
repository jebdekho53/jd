'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';

interface HelpArticle {
  id: string;
  title: string;
  body: string;
}

const MERCHANT_CATEGORIES = [
  { code: 'SETTLEMENT_ISSUE', label: 'Settlement Issues' },
  { code: 'PAYOUT_DELAY', label: 'Payout Delays' },
  { code: 'INVENTORY_ISSUE', label: 'Inventory Issues' },
  { code: 'STORE_VERIFICATION', label: 'Store Verification' },
  { code: 'CAMPAIGN_PROBLEM', label: 'Campaign Problems' },
  { code: 'ORDER_DISPUTE', label: 'Order Disputes' },
  { code: 'GST_ISSUE', label: 'GST Issues' },
];

async function merchantFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Request failed');
  return json as T;
}

export function MerchantSupportContent() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoryCode: MERCHANT_CATEGORIES[0].code, subject: '', description: '' });
  const qc = useQueryClient();

  const deflectionQuery = useDebounce(`${form.subject} ${form.description}`.trim(), 350);
  const { data: suggestions } = useQuery({
    queryKey: ['merchant', 'support', 'deflect', deflectionQuery],
    queryFn: async () => {
      const res = await merchantFetch<{ success: boolean; data: HelpArticle[] }>(
        `/api/merchant/support/articles?q=${encodeURIComponent(deflectionQuery)}`,
      );
      return res.data;
    },
    enabled: showForm && deflectionQuery.length >= 6,
  });

  const { data } = useQuery({
    queryKey: ['merchant', 'support', 'tickets'],
    queryFn: async () => {
      const res = await merchantFetch<{ success: boolean; data: { items: TicketRow[] } }>(
        '/api/merchant/support/tickets',
      );
      return res.data.items;
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (input: { categoryCode: string; subject: string; description: string }) => {
      await merchantFetch('/api/merchant/support/tickets', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['merchant', 'support'] });
      setShowForm(false);
      setForm({ categoryCode: MERCHANT_CATEGORIES[0].code, subject: '', description: '' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Raise issues with settlements, inventory, GST and more.</p>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? 'Cancel' : 'New ticket'}
        </button>
      </div>

      {showForm && (
        <form
          className="rounded-xl border bg-white p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutate(form);
          }}
        >
          <select
            value={form.categoryCode}
            onChange={(e) => setForm((f) => ({ ...f, categoryCode: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            {MERCHANT_CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <input
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            required
            minLength={3}
            placeholder="Subject"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
            minLength={10}
            rows={4}
            placeholder="Describe the issue"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          {(suggestions ?? []).length > 0 && (
            <div className="space-y-2 rounded-lg border border-brand-200 bg-brand-50 p-3">
              <p className="text-xs font-semibold text-brand-700">This might already answer it</p>
              {(suggestions ?? []).slice(0, 3).map((a) => (
                <div key={a.id} className="rounded-lg bg-white p-2.5">
                  <p className="text-sm font-medium text-slate-900">{a.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{a.body}</p>
                </div>
              ))}
            </div>
          )}
          <button type="submit" disabled={isPending} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50">
            Submit
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-3 font-mono text-xs">{t.ticketNumber}</td>
                <td className="px-4 py-3">{t.subject}</td>
                <td className="px-4 py-3">{t.status}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">No tickets yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface TicketRow {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
}
