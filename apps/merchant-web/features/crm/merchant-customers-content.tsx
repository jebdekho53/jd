'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchCustomers() {
  const res = await fetch('/api/merchant/crm/customers');
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data as CustomerCrmData;
}

export function MerchantCustomersContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['merchant', 'crm', 'customers'],
    queryFn: fetchCustomers,
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading customers…</p>;

  return (
    <div className="space-y-8">
      <Section title="Repeat customers" rows={data?.repeatCustomers ?? []} cols={['name', 'phone', 'orderCount', 'totalSpent']} />
      <Section title="Top spenders" rows={data?.topSpenders ?? []} cols={['name', 'phone', 'totalSpent', 'orderCount']} />
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
    </div>
  );
}

function Section({
  title,
  rows,
  cols,
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  cols: string[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              {cols.map((c) => (
                <th key={c} className="px-4 py-3">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t">
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
