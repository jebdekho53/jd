'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStoreStore } from '@/store/store-store';

async function fetchProcurement(path: string, storeId?: string) {
  const params = new URLSearchParams();
  if (storeId) params.set('storeId', storeId);
  const qs = params.size ? `?${params}` : '';
  const res = await fetch(`/api/merchant/procurement/${path}${qs}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

export function MerchantProcurementContent() {
  const { currentStore } = useStoreStore();
  const storeId = currentStore?.id;
  const qc = useQueryClient();

  const { data: recommendations } = useQuery({
    queryKey: ['merchant', 'procurement', 'recommendations', storeId],
    queryFn: () => fetchProcurement('recommendations', storeId),
    enabled: !!storeId,
  });

  const { data: products } = useQuery({
    queryKey: ['merchant', 'procurement', 'products'],
    queryFn: () => fetchProcurement('products'),
  });

  const { data: vendors } = useQuery({
    queryKey: ['merchant', 'procurement', 'vendors'],
    queryFn: () => fetchProcurement('vendors'),
  });

  const { data: credit } = useQuery({
    queryKey: ['merchant', 'procurement', 'credit'],
    queryFn: () => fetchProcurement('credit'),
  });

  const { data: analytics } = useQuery({
    queryKey: ['merchant', 'procurement', 'analytics', storeId],
    queryFn: () => fetchProcurement('analytics', storeId),
    enabled: !!storeId,
  });

  const addToCart = useMutation({
    mutationFn: async (vendorProductId: string) => {
      const res = await fetch(`/api/merchant/procurement/cart/items${storeId ? `?storeId=${storeId}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorProductId, quantity: 10 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed');
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchant', 'procurement', 'cart'] }),
  });

  if (!storeId) {
    return <p className="text-sm text-slate-500">Select a store to use procurement.</p>;
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Smart Replenishment</h2>
        <div className="space-y-2">
          {(recommendations ?? []).length === 0 && (
            <p className="text-sm text-slate-500">No replenishment alerts right now.</p>
          )}
          {(recommendations ?? []).map((r: RecRow) => (
            <div key={r.id} className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm">
              <p className="font-medium">{r.productName}</p>
              <p className="text-slate-600">
                Stock: {r.currentStock} · Sales: {r.avgDailySales.toFixed(1)}/day · OOS in {r.predictedOosDays.toFixed(1)} days
              </p>
              <p className="text-brand-700">Order {r.recommendedQty} units · Impact +₹{Number(r.expectedRevenueImpact).toLocaleString()}</p>
              <p className="text-xs text-slate-500">{r.alertType.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="30d Spend" value={`₹${(analytics?.totalSpend ?? 0).toLocaleString()}`} />
        <Stat label="Savings" value={`₹${(analytics?.procurementSavings ?? 0).toLocaleString()}`} />
        <Stat label="Fulfillment" value={`${analytics?.fulfillmentRate ?? 0}%`} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Credit Lines</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {(credit ?? []).map((c: CreditRow) => (
            <div key={c.id} className="rounded-xl border bg-white p-4 text-sm">
              <p className="font-medium">{c.vendor?.businessName}</p>
              <p className="text-slate-600">
                Available: ₹{c.availableLimit?.toLocaleString() ?? 0} / ₹{c.creditLimit?.toLocaleString()}
              </p>
            </div>
          ))}
          {(credit ?? []).length === 0 && <p className="text-sm text-slate-500">No credit lines yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Suppliers</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(vendors ?? []).map((v: VendorRow) => (
            <div key={v.id} className="rounded-xl border bg-white p-4 text-sm">
              <p className="font-medium">{v.businessName}</p>
              <p className="text-xs text-slate-500">{v.vendorType} · ★ {v.ratingAvg.toFixed(1)}</p>
              <p className="text-xs text-slate-400">{v._count?.products ?? 0} products</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Marketplace Products</h2>
        <div className="space-y-2">
          {(products ?? []).map((p: ProductRow) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white p-4 text-sm">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.vendor.businessName} · MOQ {p.moq} · GST {p.gstRate}% · ₹{Number(p.basePrice)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => addToCart.mutate(p.id)}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
              >
                Add to cart
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

interface RecRow {
  id: string;
  productName: string;
  currentStock: number;
  avgDailySales: number;
  predictedOosDays: number;
  recommendedQty: number;
  expectedRevenueImpact: number;
  alertType: string;
}

interface CreditRow {
  id: string;
  creditLimit: number;
  availableLimit?: number;
  vendor?: { businessName: string };
}

interface VendorRow {
  id: string;
  businessName: string;
  vendorType: string;
  ratingAvg: number;
  _count?: { products: number };
}

interface ProductRow {
  id: string;
  name: string;
  moq: number;
  gstRate: number;
  basePrice: number;
  vendor: { businessName: string };
}
