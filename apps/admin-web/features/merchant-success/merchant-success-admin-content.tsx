'use client';

import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';

export function MerchantSuccessAdminContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'merchant-success'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: SuccessData }>(
        '/api/admin/merchant-success/overview',
      );
      return res.data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const s = data?.summary ?? {};

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Stores tracked" value={String(s.storesTracked ?? 0)} />
        <Stat label="Avg health score" value={String(s.avgHealthScore ?? 0)} />
        <Stat label="At-risk merchants" value={String(s.atRiskCount ?? 0)} />
        <Stat label="Top performers" value={String(s.topPerformerCount ?? 0)} />
        <Stat label="Expansion-ready" value={String(s.expansionReadyCount ?? 0)} />
        <Stat label="Fraud-prone" value={String(s.fraudProneCount ?? 0)} />
      </div>

      <MerchantTable title="At-risk merchants" rows={data?.atRisk ?? []} />
      <MerchantTable title="Top performers" rows={data?.topPerformers ?? []} />
      <MerchantTable title="Expansion-ready" rows={data?.expansionReady ?? []} />
      <MerchantTable title="Fraud-prone / high risk" rows={data?.fraudProne ?? []} />

      {(data?.alertsByType ?? []).length > 0 && (
        <section className="rounded-xl border p-4">
          <h3 className="mb-2 font-semibold">Open growth alerts</h3>
          <ul className="text-sm space-y-1">
            {data!.alertsByType.map((a) => (
              <li key={a.type}>
                {a.type}: {a.count}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MerchantTable({ title, rows }: { title: string; rows: MerchantRow[] }) {
  return (
    <section className="rounded-xl border overflow-hidden">
      <h3 className="border-b bg-muted/50 px-4 py-3 font-semibold">{title}</h3>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2">Store</th>
            <th className="px-4 py-2">Merchant</th>
            <th className="px-4 py-2">Health</th>
            <th className="px-4 py-2">Visibility</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.storeName + r.phone} className="border-t">
              <td className="px-4 py-2">{r.storeName}</td>
              <td className="px-4 py-2">{r.merchantName}</td>
              <td className="px-4 py-2">{r.healthScore}</td>
              <td className="px-4 py-2">{r.visibilityScore}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                No data yet — snapshots populate as merchants use Growth OS
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

interface MerchantRow {
  storeName: string;
  merchantName: string;
  phone: string;
  healthScore: number;
  visibilityScore: number;
}

interface SuccessData {
  summary: {
    storesTracked?: number;
    avgHealthScore?: number;
    atRiskCount?: number;
    topPerformerCount?: number;
    expansionReadyCount?: number;
    fraudProneCount?: number;
  };
  atRisk: MerchantRow[];
  topPerformers: MerchantRow[];
  expansionReady: MerchantRow[];
  fraudProne: MerchantRow[];
  alertsByType: Array<{ type: string; count: number }>;
}
