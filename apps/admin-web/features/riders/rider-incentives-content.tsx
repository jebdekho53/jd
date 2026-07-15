'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Gift, PauseCircle, PlayCircle, RefreshCw, Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import {
  createAdminRiderIncentive,
  listAdminRiderIncentives,
  updateAdminRiderIncentive,
  type AdminRiderIncentiveStatus,
} from './rider-admin-api';

const filters: Array<{ label: string; value: '' | AdminRiderIncentiveStatus }> = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Expired', value: 'EXPIRED' },
];

const emptyForm = {
  code: '',
  title: '',
  description: '',
  targetDeliveries: 10,
  rewardAmount: 250,
  startsAt: '',
  endsAt: '',
};

function toLocalInput(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function fromLocalInput(value: string) {
  return new Date(value).toISOString();
}

function inr(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function RiderIncentivesContent() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'' | AdminRiderIncentiveStatus>('ACTIVE');
  const [form, setForm] = useState(emptyForm);
  const query = useQuery({
    queryKey: ['admin', 'rider-incentives', filter],
    queryFn: () => listAdminRiderIncentives(filter || undefined),
  });

  const canSubmit = useMemo(
    () => form.code.trim() && form.title.trim() && form.startsAt && form.endsAt && form.targetDeliveries > 0,
    [form],
  );

  const create = useMutation({
    mutationFn: () =>
      createAdminRiderIncentive({
        code: form.code,
        title: form.title,
        description: form.description,
        targetDeliveries: Number(form.targetDeliveries),
        rewardAmount: Number(form.rewardAmount),
        startsAt: fromLocalInput(form.startsAt),
        endsAt: fromLocalInput(form.endsAt),
        status: 'ACTIVE',
      }),
    onSuccess: () => {
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ['admin', 'rider-incentives'] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminRiderIncentiveStatus }) =>
      updateAdminRiderIncentive(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'rider-incentives'] }),
  });

  const incentives = query.data ?? [];

  return (
    <DashboardShell title="Rider Incentives">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                filter === item.value ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Link href="/riders/kyc" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            KYC review
          </Link>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <section className="mb-5 rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold">Create incentive campaign</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Code" className="rounded-lg border px-3 py-2 text-sm" />
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="rounded-lg border px-3 py-2 text-sm" />
          <input type="number" value={form.targetDeliveries} onChange={(e) => setForm({ ...form, targetDeliveries: Number(e.target.value) })} placeholder="Target deliveries" className="rounded-lg border px-3 py-2 text-sm" />
          <input type="number" value={form.rewardAmount} onChange={(e) => setForm({ ...form, rewardAmount: Number(e.target.value) })} placeholder="Reward amount" className="rounded-lg border px-3 py-2 text-sm" />
          <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
          <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded-lg border px-3 py-2 text-sm md:col-span-2" />
          <button
            type="button"
            disabled={!canSubmit || create.isPending}
            onClick={() => create.mutate()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {create.isPending ? 'Saving...' : 'Create'}
          </button>
        </div>
        {create.isError && <p className="mt-2 text-sm text-destructive">{(create.error as Error).message}</p>}
      </section>

      {query.isLoading && <p className="text-sm text-muted-foreground">Loading incentives...</p>}
      {query.isError && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(query.error as Error).message}</p>}
      {!query.isLoading && incentives.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          No incentive campaigns match this filter.
        </div>
      )}
      {incentives.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Campaign</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Reward</th>
                <th className="px-3 py-2">Window</th>
                <th className="px-3 py-2">Progress</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {incentives.map((item) => (
                <tr key={item.id} className="border-b border-border/70">
                  <td className="px-3 py-3">
                    <div className="font-semibold">{item.title}</div>
                    <div className="font-mono text-xs text-muted-foreground">{item.code}</div>
                    {item.description && <div className="mt-1 max-w-sm text-xs text-muted-foreground">{item.description}</div>}
                  </td>
                  <td className="px-3 py-3">{item.targetDeliveries} deliveries</td>
                  <td className="px-3 py-3">{inr(item.rewardAmount)}</td>
                  <td className="px-3 py-3 text-xs">
                    {toLocalInput(item.startsAt).replace('T', ' ')}<br />
                    {toLocalInput(item.endsAt).replace('T', ' ')}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {item.participants} riders<br />{item.completed} completed
                  </td>
                  <td className="px-3 py-3">{item.status}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      {item.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => updateStatus.mutate({ id: item.id, status: 'EXPIRED' })}
                          disabled={updateStatus.isPending}
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                        >
                          <PauseCircle className="h-3.5 w-3.5" /> Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateStatus.mutate({ id: item.id, status: 'ACTIVE' })}
                          disabled={updateStatus.isPending}
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                        >
                          <PlayCircle className="h-3.5 w-3.5" /> Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
