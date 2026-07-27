'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

function formatColumnLabel(col: string): string {
  return col
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (ch) => ch.toUpperCase());
}

async function fetchCustomers() {
  const res = await fetch('/api/merchant/crm/customers');
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data as CustomerCrmData;
}

async function fetchLedger(userId: string) {
  const res = await fetch(`/api/merchant/crm/customers/${userId}/ledger`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data as CustomerLedger;
}

export function MerchantCustomersContent() {
  const [selected, setSelected] = useState<{ userId: string; name?: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['merchant', 'crm', 'customers'],
    queryFn: fetchCustomers,
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading customers…</p>;

  return (
    <div className="space-y-8">
      <Section
        title="Repeat customers"
        rows={data?.repeatCustomers ?? []}
        cols={['name', 'phone', 'orderCount', 'totalSpent']}
        onRowClick={(row) => row.userId && setSelected({ userId: String(row.userId), name: row.name as string })}
      />
      <Section
        title="Top spenders"
        rows={data?.topSpenders ?? []}
        cols={['name', 'phone', 'totalSpent', 'orderCount']}
        onRowClick={(row) => row.userId && setSelected({ userId: String(row.userId), name: row.name as string })}
      />
      <Section title="Loyalty members" rows={data?.loyaltyMembers ?? []} cols={['name', 'phone', 'tier', 'points']} />
      <Section title="Win-back targets" rows={data?.winBack ?? []} cols={['name', 'phone', 'lastOrderAt']} />
      <Section title="Coupon users" rows={data?.couponUsers ?? []} cols={['name', 'phone']} />
      <section>
        <h2 className="mb-3 text-lg font-semibold">Campaign performance</h2>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Impressions</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">Orders</th>
              </tr>
            </thead>
            <tbody>
              {(data?.campaignPerformance ?? []).map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">{c.status}</td>
                  <td className="px-4 py-3">{c.impressions}</td>
                  <td className="px-4 py-3">{c.clicks}</td>
                  <td className="px-4 py-3">{c.redemptions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <CustomerLedgerModal userId={selected.userId} name={selected.name} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function CustomerLedgerModal({ userId, name, onClose }: { userId: string; name?: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['merchant', 'crm', 'ledger', userId],
    queryFn: () => fetchLedger(userId),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{data?.customer?.name ?? name ?? 'Customer'} — order ledger</h3>
            <p className="text-sm text-slate-500">{data?.customer?.phone}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        {isLoading && <p className="text-sm text-slate-500">Loading…</p>}

        {!isLoading && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3 text-sm">
              <div>
                <p className="text-slate-500">Total orders</p>
                <p className="text-lg font-semibold">{data?.totalOrders ?? 0}</p>
              </div>
              <div>
                <p className="text-slate-500">Total spent (lifetime)</p>
                <p className="text-lg font-semibold">₹{(data?.totalSpent ?? 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Order</th>
                    <th className="px-3 py-2">Store</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-right">Running total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.entries ?? []).map((e) => (
                    <tr key={e.orderId} className="border-t">
                      <td className="px-3 py-2">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="px-3 py-2">{e.orderNumber}</td>
                      <td className="px-3 py-2">{e.storeName}</td>
                      <td className="px-3 py-2">{e.status}</td>
                      <td className="px-3 py-2 text-right">₹{e.amount.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">₹{e.runningTotal.toLocaleString()}</td>
                    </tr>
                  ))}
                  {(data?.entries ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                        No orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  rows,
  cols,
  onRowClick,
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  cols: string[];
  onRowClick?: (row: Record<string, unknown>) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              {cols.map((c) => (
                <th key={c} className="px-4 py-3">{formatColumnLabel(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`border-t ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {cols.map((c) => (
                  <td key={c} className="px-4 py-3">
                    {String(row[c] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={cols.length} className="px-4 py-8 text-center text-slate-500">
                  No customers yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface CustomerCrmData {
  repeatCustomers: Array<Record<string, unknown>>;
  topSpenders: Array<Record<string, unknown>>;
  loyaltyMembers: Array<Record<string, unknown>>;
  winBack: Array<Record<string, unknown>>;
  couponUsers: Array<Record<string, unknown>>;
  campaignPerformance: Array<{
    id: string;
    name: string;
    status: string;
    impressions: number;
    clicks: number;
    redemptions: number;
  }>;
}

interface CustomerLedger {
  customer: { name: string | null; phone: string } | null;
  entries: Array<{
    orderId: string;
    orderNumber: string;
    date: string;
    storeName: string;
    status: string;
    amount: number;
    runningTotal: number;
  }>;
  totalSpent: number;
  totalOrders: number;
}
