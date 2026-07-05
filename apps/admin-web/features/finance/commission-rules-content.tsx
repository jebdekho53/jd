'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';

type Scope = 'GLOBAL' | 'STORE' | 'CATEGORY';

interface CommissionRule {
  id: string;
  scope: Scope;
  storeId: string | null;
  storeName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  commissionPercent: number;
  settlementDelayDays: number;
  isActive: boolean;
}

interface RulesResponse {
  defaultCommissionPercent: number;
  rules: CommissionRule[];
}

const QK = ['admin', 'finance', 'commission-rules'];

async function fetchRules() {
  const res = await adminFetch<{ success: boolean; data: RulesResponse }>(
    '/api/admin/finance/commission-rules',
  );
  return res.data;
}

export function CommissionRulesContent() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: QK, queryFn: fetchRules });

  const [scope, setScope] = useState<Scope>('GLOBAL');
  const [targetId, setTargetId] = useState('');
  const [percent, setPercent] = useState('15');
  const [delay, setDelay] = useState('2');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: QK });

  async function createRule() {
    setError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        scope,
        commissionPercent: Number(percent),
        settlementDelayDays: Number(delay),
      };
      if (scope === 'STORE') body.storeId = targetId.trim();
      if (scope === 'CATEGORY') body.categoryId = targetId.trim();
      const res = await adminFetch<{ success: boolean; message?: string }>(
        '/api/admin/finance/commission-rules',
        { method: 'POST', body: JSON.stringify(body) },
      );
      if (!res.success) throw new Error(res.message ?? 'Failed to create rule');
      setTargetId('');
      setPercent('15');
      setDelay('2');
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function updateRule(id: string, patch: Partial<Pick<CommissionRule, 'commissionPercent' | 'isActive'>>) {
    await adminFetch(`/api/admin/finance/commission-rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    await refresh();
  }

  async function deleteRule(id: string) {
    await adminFetch(`/api/admin/finance/commission-rules/${id}`, { method: 'DELETE' });
    await refresh();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Platform default</h3>
          <span className="text-sm text-muted-foreground">
            Applied when no rule matches
          </span>
        </div>
        <p className="mt-2 text-2xl font-bold">
          {data ? `${data.defaultCommissionPercent}%` : '—'}
        </p>
      </section>

      <section className="rounded-xl border p-4">
        <h3 className="mb-3 font-semibold">Add commission rule</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Priority: Store &gt; Category &gt; Global &gt; platform default.
        </p>
        <div className="grid gap-3 sm:grid-cols-5">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Scope</span>
            <select
              className="w-full rounded-lg border px-2 py-1.5"
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
            >
              <option value="GLOBAL">Global</option>
              <option value="STORE">Store</option>
              <option value="CATEGORY">Category</option>
            </select>
          </label>

          {scope !== 'GLOBAL' && (
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-muted-foreground">
                {scope === 'STORE' ? 'Store ID' : 'Category ID'}
              </span>
              <input
                className="w-full rounded-lg border px-2 py-1.5"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder={scope === 'STORE' ? 'store id' : 'category id'}
              />
            </label>
          )}

          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Commission %</span>
            <input
              type="number"
              min={0}
              max={100}
              step="0.5"
              className="w-full rounded-lg border px-2 py-1.5"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Settlement delay (days)</span>
            <input
              type="number"
              min={0}
              max={90}
              className="w-full rounded-lg border px-2 py-1.5"
              value={delay}
              onChange={(e) => setDelay(e.target.value)}
            />
          </label>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          onClick={createRule}
          disabled={saving}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Add rule'}
        </button>
      </section>

      <section className="rounded-xl border p-4">
        <h3 className="mb-3 font-semibold">Active rules</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data || data.rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No rules configured — all orders use the {data?.defaultCommissionPercent ?? 15}% default.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-3">Scope</th>
                  <th className="py-2 pr-3">Target</th>
                  <th className="py-2 pr-3">Commission %</th>
                  <th className="py-2 pr-3">Delay</th>
                  <th className="py-2 pr-3">Active</th>
                  <th className="py-2 pr-3" />
                </tr>
              </thead>
              <tbody>
                {data.rules.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{r.scope}</td>
                    <td className="py-2 pr-3">
                      {r.storeName ?? r.categoryName ?? (r.scope === 'GLOBAL' ? 'All stores' : '—')}
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        defaultValue={r.commissionPercent}
                        className="w-20 rounded border px-2 py-1"
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v !== r.commissionPercent) void updateRule(r.id, { commissionPercent: v });
                        }}
                      />
                    </td>
                    <td className="py-2 pr-3">{r.settlementDelayDays}d</td>
                    <td className="py-2 pr-3">
                      <button
                        onClick={() => void updateRule(r.id, { isActive: !r.isActive })}
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {r.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <button
                        onClick={() => void deleteRule(r.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
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
