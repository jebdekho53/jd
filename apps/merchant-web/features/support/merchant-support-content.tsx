'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  const qc = useQueryClient();

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
            const fd = new FormData(e.currentTarget);
            mutate({
              categoryCode: String(fd.get('categoryCode')),
              subject: String(fd.get('subject')),
              description: String(fd.get('description')),
            });
          }}
        >
          <select name="categoryCode" className="w-full rounded-lg border px-3 py-2 text-sm">
            {MERCHANT_CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <input name="subject" required minLength={3} placeholder="Subject" className="w-full rounded-lg border px-3 py-2 text-sm" />
          <textarea name="description" required minLength={10} rows={4} placeholder="Describe the issue" className="w-full rounded-lg border px-3 py-2 text-sm" />
          <button type="submit" disabled={isPending} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50">
            Submit
          </button>
        </form>
      )}

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
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
