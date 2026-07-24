'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';

interface CampaignRow {
  id: string;
  name: string;
  scope: string;
  status: string;
  stackMode: string;
  gmvGenerated: number;
  orderCount: number;
  impressionCount: number;
  store?: { name: string; slug: string };
}

interface CampaignAnalytics {
  summary: {
    totalCampaigns: number;
    totalGmv: number;
    redemptions: number;
    discountGiven: number;
  };
  leaderboard: Array<{ rank: number; name: string; gmvGenerated: number; conversion: number }>;
  fraud: { couponAbuseCandidates: number; offerAbuseCandidates: number };
}

async function fetchCampaigns(): Promise<CampaignRow[]> {
  const res = await adminFetch<{ success: boolean; data: CampaignRow[] }>('/api/admin/campaigns');
  return res.data;
}

async function fetchAnalytics(): Promise<CampaignAnalytics> {
  const res = await adminFetch<{ success: boolean; data: CampaignAnalytics }>(
    '/api/admin/campaigns/analytics',
  );
  return res.data;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  startsAt: '',
  endsAt: '',
  budgetCap: '',
  discountValue: '',
  minOrderAmount: '',
  maxDiscount: '',
  usageLimit: '',
  perUserLimit: '',
};

export function CampaignsAdminContent() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [offerKind, setOfferKind] = useState<'PERCENTAGE_DISCOUNT' | 'FLAT_DISCOUNT'>('PERCENTAGE_DISCOUNT');
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['admin', 'campaigns'],
    queryFn: fetchCampaigns,
  });
  const { data: analytics } = useQuery({
    queryKey: ['admin', 'campaigns', 'analytics'],
    queryFn: fetchAnalytics,
  });

  const createCampaign = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          budgetCap: form.budgetCap ? Number(form.budgetCap) : undefined,
          offers: [
            {
              name: form.name,
              kind: offerKind,
              target: 'STORE_WIDE',
              discountValue: Number(form.discountValue),
              minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
              maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
              usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
              perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : undefined,
              startsAt: new Date(form.startsAt).toISOString(),
              expiresAt: new Date(form.endsAt).toISOString(),
            },
          ],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed to create campaign');
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      setShowForm(false);
      setForm(EMPTY_FORM);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const pauseResume = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'pause' | 'resume' }) => {
      const res = await fetch(`/api/admin/campaigns/${id}/${action}`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed');
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] }),
  });

  return (
    <div className="space-y-8">
      {analytics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Campaigns" value={analytics.summary.totalCampaigns} />
          <Stat label="GMV generated" value={`₹${analytics.summary.totalGmv.toLocaleString()}`} />
          <Stat label="Redemptions" value={analytics.summary.redemptions} />
          <Stat label="Fraud signals" value={analytics.fraud.offerAbuseCandidates} />
        </div>
      )}

      {analytics?.leaderboard && analytics.leaderboard.length > 0 && (
        <section className="rounded-xl border p-4">
          <h3 className="mb-3 font-semibold">Performance leaderboard</h3>
          <ol className="space-y-2 text-sm">
            {analytics.leaderboard.map((row) => (
              <li key={row.rank} className="flex justify-between">
                <span>
                  #{row.rank} {row.name}
                </span>
                <span className="text-muted-foreground">
                  ₹{row.gmvGenerated.toLocaleString()} · {row.conversion}% conv.
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">All campaigns</h3>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950"
          >
            {showForm ? 'Cancel' : 'Create campaign'}
          </button>
        </div>

        {showForm && (
          <div className="mb-4 space-y-3 rounded-xl border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Campaign name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-lg border px-3 py-2 text-sm"
              />
              <select
                value={offerKind}
                onChange={(e) => setOfferKind(e.target.value as typeof offerKind)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <option value="PERCENTAGE_DISCOUNT">Percentage discount</option>
                <option value="FLAT_DISCOUNT">Flat discount</option>
              </select>
            </div>

            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-muted-foreground">
                Starts
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Ends
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="number"
                min={0}
                placeholder={offerKind === 'PERCENTAGE_DISCOUNT' ? 'Discount %' : 'Discount ₹'}
                value={form.discountValue}
                onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                className="rounded-lg border px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                placeholder="Min order ₹ (optional)"
                value={form.minOrderAmount}
                onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                className="rounded-lg border px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                placeholder="Max discount ₹ (optional)"
                value={form.maxDiscount}
                onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                className="rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="number"
                min={0}
                placeholder="Total usage limit (optional)"
                value={form.usageLimit}
                onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                className="rounded-lg border px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                placeholder="Per-user limit (optional)"
                value={form.perUserLimit}
                onChange={(e) => setForm((f) => ({ ...f, perUserLimit: e.target.value }))}
                className="rounded-lg border px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                placeholder="Budget cap ₹ (optional)"
                value={form.budgetCap}
                onChange={(e) => setForm((f) => ({ ...f, budgetCap: e.target.value }))}
                className="rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="button"
              onClick={() => {
                setError(null);
                if (!form.name || !form.startsAt || !form.endsAt || !form.discountValue) {
                  setError('Name, dates, and discount value are required');
                  return;
                }
                createCampaign.mutate();
              }}
              disabled={createCampaign.isPending}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {createCampaign.isPending ? 'Creating…' : 'Create platform campaign'}
            </button>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Stack</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">GMV</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="font-medium">{c.name}</div>
                      {c.store && <div className="text-xs text-muted-foreground">{c.store.name}</div>}
                    </td>
                    <td className="p-3">{c.scope}</td>
                    <td className="p-3">{c.status}</td>
                    <td className="p-3">{c.stackMode}</td>
                    <td className="p-3">{c.orderCount}</td>
                    <td className="p-3">₹{c.gmvGenerated.toLocaleString()}</td>
                    <td className="p-3">
                      {c.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => pauseResume.mutate({ id: c.id, action: 'pause' })}
                          className="rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-slate-950"
                        >
                          Pause
                        </button>
                      )}
                      {c.status === 'PAUSED' && (
                        <button
                          type="button"
                          onClick={() => pauseResume.mutate({ id: c.id, action: 'resume' })}
                          className="rounded bg-emerald-500 px-2 py-1 text-xs font-semibold text-slate-950"
                        >
                          Resume
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
