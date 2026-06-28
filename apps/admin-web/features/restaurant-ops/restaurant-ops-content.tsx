'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';
import { Button, Input } from '@/design-system';

interface PendingApproval {
  id: string;
  businessType: string;
  status: string;
  store: { id: string; name: string; slug: string; status: string };
}

interface Cuisine {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface FoodAnalytics {
  totalOrders: number;
  revenue: number;
  byStatus: Array<{ status: string; _count: number }>;
}

interface PopularDish {
  itemName: string;
  _sum: { quantity: number | null };
}

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export function RestaurantOpsContent() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [days, setDays] = useState(7);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<{ storeId: string; businessType: string } | null>(null);

  const { data: approvals, isLoading: approvalsLoading } = useQuery({
    queryKey: ['admin', 'restaurant-ops', 'approvals', page],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: PendingApproval[] }>(
        `/api/admin/restaurant-ops/approvals?page=${page}`,
      );
      return res.data;
    },
  });

  const { data: cuisines, isLoading: cuisinesLoading } = useQuery({
    queryKey: ['admin', 'restaurant-ops', 'cuisines'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: Cuisine[] }>(
        '/api/admin/restaurant-ops/cuisines',
      );
      return res.data;
    },
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin', 'restaurant-ops', 'analytics', days],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: FoodAnalytics }>(
        `/api/admin/restaurant-ops/analytics/food-orders?days=${days}`,
      );
      return res.data;
    },
  });

  const { data: popularDishes, isLoading: dishesLoading } = useQuery({
    queryKey: ['admin', 'restaurant-ops', 'popular-dishes'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: PopularDish[] }>(
        '/api/admin/restaurant-ops/analytics/popular-dishes?limit=15',
      );
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ storeId, businessType }: { storeId: string; businessType: string }) => {
      await adminFetch(`/api/admin/restaurant-ops/approvals/${storeId}/${businessType}/approve`, {
        method: 'POST',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'restaurant-ops', 'approvals'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({
      storeId,
      businessType,
      reason,
    }: {
      storeId: string;
      businessType: string;
      reason: string;
    }) => {
      await adminFetch(`/api/admin/restaurant-ops/approvals/${storeId}/${businessType}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      setRejectTarget(null);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['admin', 'restaurant-ops', 'approvals'] });
    },
  });

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Restaurant business type approvals</h2>
        {approvalsLoading ? (
          <p className="text-sm text-slate-500">Loading pending approvals…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Store</th>
                  <th className="p-3">Business type</th>
                  <th className="p-3">Store status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(approvals ?? []).map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="p-3">
                      <p className="font-medium">{row.store.name}</p>
                      <p className="text-xs text-slate-500">{row.store.slug}</p>
                    </td>
                    <td className="p-3">{formatLabel(row.businessType)}</td>
                    <td className="p-3">{row.store.status}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          loading={approveMutation.isPending}
                          onClick={() =>
                            approveMutation.mutate({
                              storeId: row.store.id,
                              businessType: row.businessType,
                            })
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setRejectTarget({
                              storeId: row.store.id,
                              businessType: row.businessType,
                            })
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!approvals?.length && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No pending restaurant approvals.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </section>

      {rejectTarget && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
          <p className="text-sm font-medium text-red-900">
            Reject {formatLabel(rejectTarget.businessType)} for store
          </p>
          <Input
            placeholder="Rejection reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              loading={rejectMutation.isPending}
              disabled={rejectReason.trim().length < 5}
              onClick={() =>
                rejectMutation.mutate({
                  ...rejectTarget,
                  reason: rejectReason.trim(),
                })
              }
            >
              Confirm reject
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Cuisine directory</h2>
        {cuisinesLoading ? (
          <p className="text-sm text-slate-500">Loading cuisines…</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(cuisines ?? []).map((c) => (
              <span
                key={c.id}
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  c.isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {c.name}
              </span>
            ))}
            {!cuisines?.length && (
              <p className="text-sm text-slate-500">No cuisines configured.</p>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Food order analytics</h2>
          <div className="flex gap-2">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  days === d ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>
        {analyticsLoading ? (
          <p className="text-sm text-slate-500">Loading analytics…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500">Total food orders</p>
              <p className="text-2xl font-bold text-slate-900">{analytics?.totalOrders ?? 0}</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500">Revenue (delivered)</p>
              <p className="text-2xl font-bold text-slate-900">{formatInr(analytics?.revenue ?? 0)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500">Status breakdown</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {(analytics?.byStatus ?? []).slice(0, 5).map((s) => (
                  <li key={s.status} className="flex justify-between">
                    <span>{formatLabel(s.status)}</span>
                    <span className="font-medium">{s._count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Popular dishes (platform-wide)</h2>
        {dishesLoading ? (
          <p className="text-sm text-slate-500">Loading popular dishes…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Dish</th>
                  <th className="p-3">Quantity sold</th>
                </tr>
              </thead>
              <tbody>
                {(popularDishes ?? []).map((d, i) => (
                  <tr key={d.itemName} className="border-b">
                    <td className="p-3 text-slate-400">{i + 1}</td>
                    <td className="p-3 font-medium">{d.itemName}</td>
                    <td className="p-3">{d._sum.quantity ?? 0}</td>
                  </tr>
                ))}
                {!popularDishes?.length && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">
                      No food order data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
