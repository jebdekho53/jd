'use client';

import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';

type Tab = 'revenue' | 'settlements' | 'cod' | 'payouts' | 'riders' | 'alerts';

async function fetchOverview() {
  const res = await adminFetch<{ success: boolean; data: Record<string, unknown> }>(
    '/api/admin/finance/overview',
  );
  return res.data;
}

async function fetchCod() {
  const res = await adminFetch<{ success: boolean; data: { records: unknown[] } }>(
    '/api/admin/finance/cod',
  );
  return res.data;
}

async function fetchAlerts() {
  const res = await adminFetch<{ success: boolean; data: unknown[] }>('/api/admin/finance/alerts');
  return res.data;
}

export function FinanceAdminContent() {
  const { data: overview } = useQuery({ queryKey: ['admin', 'finance', 'overview'], queryFn: fetchOverview });
  const { data: cod } = useQuery({ queryKey: ['admin', 'finance', 'cod'], queryFn: fetchCod });
  const { data: alerts = [] } = useQuery({ queryKey: ['admin', 'finance', 'alerts'], queryFn: fetchAlerts });

  const revenue = (overview?.revenue ?? {}) as Record<string, number>;
  const codSummary = (overview?.cod ?? {}) as Record<string, number>;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="GMV" value={`₹${(revenue.gmv ?? 0).toLocaleString()}`} />
        <Stat label="Platform earnings" value={`₹${(revenue.platformEarnings ?? 0).toLocaleString()}`} />
        <Stat label="Escrow balance" value={`₹${Number(overview?.escrowBalance ?? 0).toLocaleString()}`} />
        <Stat label="Wallet liability" value={`₹${Number(overview?.walletLiability ?? 0).toLocaleString()}`} />
      </div>

      <section className="rounded-xl border p-4">
        <h3 className="mb-3 font-semibold">COD reconciliation</h3>
        <div className="grid gap-3 text-sm sm:grid-cols-4">
          <div>Pending: ₹{(codSummary.codPending ?? 0).toLocaleString()}</div>
          <div>Submitted: ₹{(codSummary.codSubmitted ?? 0).toLocaleString()}</div>
          <div>Deposited: ₹{(codSummary.codDeposited ?? 0).toLocaleString()}</div>
          <div>Mismatches: {codSummary.mismatchCount ?? 0}</div>
        </div>
        {(cod?.records ?? []).length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {(cod!.records as Array<{ id: string; rider: string; status: string; amountExpected: number }>).slice(0, 8).map((r) => (
              <li key={r.id} className="flex justify-between">
                <span>{r.rider}</span>
                <span>{r.status} · ₹{r.amountExpected}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border p-4">
        <h3 className="mb-3 font-semibold">Finance alerts</h3>
        {(alerts as Array<{ id: string; title: string; severity: string; message: string }>).length === 0 ? (
          <p className="text-sm text-muted-foreground">No open alerts</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {(alerts as Array<{ id: string; title: string; severity: string; message: string }>).map((a) => (
              <li key={a.id} className="rounded-lg bg-muted/40 p-3">
                <span className="font-medium">{a.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">{a.severity}</span>
                <p className="text-muted-foreground">{a.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
