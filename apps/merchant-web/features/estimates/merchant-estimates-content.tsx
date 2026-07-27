'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

async function merchantFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Request failed');
  return json as T;
}

type Status = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

interface EstimateRow {
  id: string;
  estimateNumber: string;
  customerName: string;
  status: Status;
  grandTotal: number;
  validUntil: string | null;
  createdAt: string;
}

interface EstimateLine {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface EstimateDetail {
  id: string;
  estimateNumber: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  status: Status;
  notes: string | null;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  validUntil: string | null;
  createdAt: string;
  lines: EstimateLine[];
}

const STATUS_STYLES: Record<Status, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  EXPIRED: 'bg-amber-100 text-amber-700',
};

export function MerchantEstimatesContent() {
  const [statusFilter, setStatusFilter] = useState<Status | 'ALL'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['merchant', 'estimates', statusFilter],
    queryFn: async () => {
      const qs = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`;
      const res = await merchantFetch<{ success: boolean; data: { items: EstimateRow[] } }>(
        `/api/merchant/estimates${qs}`,
      );
      return res.data.items;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Share price quotes with customers before they place an order — for custom or bulk requests.
        </p>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? 'Cancel' : 'New estimate'}
        </button>
      </div>

      {showForm && (
        <CreateEstimateForm
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ['merchant', 'estimates'] });
            setShowForm(false);
          }}
        />
      )}

      <div className="flex gap-2 border-b">
        {(['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              statusFilter === s
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <section className="rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Estimate #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Valid until</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-4 py-3">{e.estimateNumber}</td>
                <td className="px-4 py-3">{e.customerName}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[e.status]}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3">{e.validUntil ? new Date(e.validUntil).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-right">₹{e.grandTotal.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedId(e.id)}
                    className="text-brand-700 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && (data ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No estimates yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {selectedId && (
        <EstimateDetailModal
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => qc.invalidateQueries({ queryKey: ['merchant', 'estimates'] })}
        />
      )}
    </div>
  );
}

function emptyLine(): EstimateLine {
  return { description: '', quantity: 1, unitPrice: 0, lineTotal: 0 };
}

function CreateEstimateForm({ onCreated }: { onCreated: () => void }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [taxAmount, setTaxAmount] = useState('0');
  const [lines, setLines] = useState<EstimateLine[]>([emptyLine()]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: async () => {
      await merchantFetch('/api/merchant/estimates', {
        method: 'POST',
        body: JSON.stringify({
          customerName,
          customerPhone: customerPhone || undefined,
          customerEmail: customerEmail || undefined,
          notes: notes || undefined,
          validUntil: validUntil || undefined,
          taxAmount: Number(taxAmount) || 0,
          lines: lines
            .filter((l) => l.description.trim())
            .map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice })),
        }),
      });
    },
    onSuccess: onCreated,
  });

  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const grandTotal = subtotal + (Number(taxAmount) || 0);

  function updateLine(i: number, patch: Partial<EstimateLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  return (
    <form
      className="space-y-4 rounded-xl border bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutate();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          required
          placeholder="Customer name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          placeholder="Phone (optional)"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          placeholder="Email (optional)"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Items</p>
        {lines.map((line, i) => (
          <div key={i} className="grid grid-cols-12 gap-2">
            <input
              placeholder="Description"
              value={line.description}
              onChange={(e) => updateLine(i, { description: e.target.value })}
              className="col-span-6 rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0.01}
              step="0.01"
              placeholder="Qty"
              value={line.quantity}
              onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
              className="col-span-2 rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="Rate"
              value={line.unitPrice}
              onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })}
              className="col-span-3 rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
              disabled={lines.length === 1}
              className="col-span-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, emptyLine()])}
          className="text-sm text-brand-700 hover:underline"
        >
          + Add item
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-500">Tax amount</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={taxAmount}
            onChange={(e) => setTaxAmount(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-500">Valid until</span>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </label>
        <div className="flex items-end justify-end text-sm">
          <div className="text-right">
            <p className="text-slate-500">Grand total</p>
            <p className="text-lg font-semibold">₹{grandTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        rows={2}
      />

      {error && <p className="text-sm text-rose-600">{(error as Error).message}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Save draft'}
      </button>
    </form>
  );
}

function EstimateDetailModal({
  id,
  onClose,
  onChanged,
}: {
  id: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['merchant', 'estimates', 'detail', id],
    queryFn: async () => {
      const res = await merchantFetch<{ success: boolean; data: EstimateDetail }>(`/api/merchant/estimates/${id}`);
      return res.data;
    },
  });

  const { mutate: setStatus, isPending } = useMutation({
    mutationFn: async (status: Status) => {
      await merchantFetch(`/api/merchant/estimates/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['merchant', 'estimates', 'detail', id] });
      onChanged();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading || !data ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{data.estimateNumber}</h3>
                <p className="text-sm text-slate-500">
                  {data.customerName} {data.customerPhone ? `· ${data.customerPhone}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[data.status]}`}>
                  {data.status}
                </span>
                <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>
            </div>

            <div className="mb-4 overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Rate</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lines.map((l, i) => (
                    <tr key={l.id ?? i} className="border-t">
                      <td className="px-3 py-2">{l.description}</td>
                      <td className="px-3 py-2 text-right">{l.quantity}</td>
                      <td className="px-3 py-2 text-right">₹{l.unitPrice.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">₹{l.lineTotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-4 rounded-lg bg-slate-50 p-3 text-sm">
              <div>
                <p className="text-slate-500">Subtotal</p>
                <p className="font-semibold">₹{data.subtotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500">Tax</p>
                <p className="font-semibold">₹{data.taxAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500">Grand total</p>
                <p className="font-semibold">₹{data.grandTotal.toLocaleString()}</p>
              </div>
            </div>

            {data.notes && <p className="mb-4 text-sm text-slate-600">Notes: {data.notes}</p>}

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/api/merchant/estimates/${id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Download PDF
              </a>
              {data.status === 'DRAFT' && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setStatus('SENT')}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Mark as sent
                </button>
              )}
              {data.status === 'SENT' && (
                <>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setStatus('ACCEPTED')}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Mark accepted
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setStatus('REJECTED')}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Mark rejected
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
