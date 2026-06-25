'use client';

import { useQuery } from '@tanstack/react-query';

async function adminFetch(path: string) {
  const res = await fetch(path);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

export function SupplyChainAdminContent() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin', 'supply-chain'],
    queryFn: () => adminFetch('/api/admin/supply-chain'),
  });

  const { data: vendors } = useQuery({
    queryKey: ['admin', 'vendors'],
    queryFn: () => adminFetch('/api/admin/supply-chain/vendors'),
  });

  const { data: orders } = useQuery({
    queryKey: ['admin', 'vendor-orders'],
    queryFn: () => adminFetch('/api/admin/supply-chain/vendor-orders'),
  });

  const { data: settlements } = useQuery({
    queryKey: ['admin', 'vendor-settlements'],
    queryFn: () => adminFetch('/api/admin/supply-chain/vendor-settlements'),
  });

  if (isLoading) return <p className="text-sm text-slate-400">Loading supply chain…</p>;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Widget label="Active Vendors" value={String(dashboard?.activeVendors ?? 0)} />
        <Widget label="Active Orders" value={String(dashboard?.activeOrders ?? 0)} />
        <Widget label="Pending Settlements" value={String(dashboard?.pendingSettlements ?? 0)} />
        <Widget label="Stock Shortages" value={String(dashboard?.inventoryShortages ?? 0)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top Vendors">
          {(dashboard?.topVendors ?? []).map((v: VendorRow) => (
            <div key={v.id} className="flex justify-between text-xs text-slate-300">
              <span>{v.businessName}</span>
              <span>★ {v.ratingAvg.toFixed(1)}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Credit Risk">
          {(dashboard?.creditRisk ?? []).length === 0 && (
            <p className="text-xs text-slate-500">No overdue credit lines.</p>
          )}
          {(dashboard?.creditRisk ?? []).map((c: CreditRow) => (
            <div key={c.id} className="text-xs text-red-300">
              {c.vendor?.businessName} · {c.merchantProfile?.businessName} · ₹{Number(c.overdueAmount)}
            </div>
          ))}
        </Panel>
      </section>

      <Panel title="Vendor Registry">
        {(vendors ?? []).slice(0, 8).map((v: VendorListRow) => (
          <div key={v.id} className="flex justify-between text-xs text-slate-300">
            <span>{v.businessName} ({v.vendorType})</span>
            <span>{v._count?.products ?? 0} SKUs</span>
          </div>
        ))}
      </Panel>

      <Panel title="Vendor Orders">
        {(orders ?? []).slice(0, 8).map((o: OrderRow) => (
          <div key={o.id} className="flex justify-between text-xs text-slate-300">
            <span>{o.orderNumber} · {o.vendor?.businessName}</span>
            <span>{o.status}</span>
          </div>
        ))}
      </Panel>

      <Panel title="Settlements">
        {(settlements ?? []).slice(0, 6).map((s: SettlementRow) => (
          <div key={s.id} className="flex justify-between text-xs text-slate-300">
            <span>{s.vendor?.businessName}</span>
            <span>₹{Number(s.amount)} · {s.status}</span>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function Widget({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">{title}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

interface VendorRow { id: string; businessName: string; ratingAvg: number }
interface CreditRow { id: string; overdueAmount: number; vendor?: { businessName: string }; merchantProfile?: { businessName: string } }
interface VendorListRow { id: string; businessName: string; vendorType: string; _count?: { products: number } }
interface OrderRow { id: string; orderNumber: string; status: string; vendor?: { businessName: string } }
interface SettlementRow { id: string; amount: number; status: string; vendor?: { businessName: string } }
