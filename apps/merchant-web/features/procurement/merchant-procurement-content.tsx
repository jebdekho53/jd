'use client';

import { useState } from 'react';
import { useStoreStore } from '@/store/store-store';
import { Button, Modal, Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/primitives';
import {
  useAddToCartMutation,
  useCreditLinesQuery,
  useProcurementAnalyticsQuery,
  useProcurementCartQuery,
  useProductsQuery,
  useRecommendationsQuery,
  useVendorsQuery,
} from '@/hooks/use-procurement';
import { ProcurementCartPanel } from './procurement-cart-panel';
import { ProcurementOrdersPanel } from './procurement-orders-panel';
import type { VendorProduct } from '@/types/procurement';

export function MerchantProcurementContent() {
  const { currentStore } = useStoreStore();
  const storeId = currentStore?.id;
  const [tab, setTab] = useState('marketplace');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [conflict, setConflict] = useState<{ product: VendorProduct; quantity: number; existingVendor: string } | null>(null);

  const { data: recommendations } = useRecommendationsQuery(storeId);
  const { data: products } = useProductsQuery();
  const { data: vendors } = useVendorsQuery();
  const { data: credit } = useCreditLinesQuery();
  const { data: analytics } = useProcurementAnalyticsQuery(storeId);
  const { data: cart } = useProcurementCartQuery(storeId);
  const addToCart = useAddToCartMutation(storeId);

  if (!storeId) {
    return <p className="text-sm text-slate-500">Select a store to use procurement.</p>;
  }

  const cartVendorId = cart?.items?.[0]?.vendorProduct.vendor.id;
  const cartVendorName = cart?.items?.[0]?.vendorProduct.vendor.businessName;

  function qtyFor(product: VendorProduct) {
    return quantities[product.id] ?? product.moq;
  }

  function handleAddToCart(product: VendorProduct) {
    const quantity = qtyFor(product);
    if (cartVendorId && cartVendorId !== product.vendor.id) {
      setConflict({ product, quantity, existingVendor: cartVendorName ?? 'another supplier' });
      return;
    }
    addToCart.mutate({ vendorProductId: product.id, quantity });
  }

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="cart">Cart{cart?.items?.length ? ` (${cart.items.length})` : ''}</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-lg font-semibold">Smart Replenishment</h2>
              <div className="space-y-2">
                {(recommendations ?? []).length === 0 && (
                  <p className="text-sm text-slate-500">No replenishment alerts right now.</p>
                )}
                {(recommendations ?? []).map((r) => (
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
                {(credit ?? []).map((c) => (
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
                {(vendors ?? []).map((v) => (
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
                {(products ?? []).map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 text-sm">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        {p.vendor.businessName} · MOQ {p.moq} · GST {p.gstRate}% · ₹{Number(p.basePrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={p.moq}
                        value={qtyFor(p)}
                        onChange={(e) =>
                          setQuantities((q) => ({ ...q, [p.id]: Math.max(p.moq, Number(e.target.value) || p.moq) }))
                        }
                        className="w-20 rounded-lg border px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddToCart(p)}
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="cart">
          <ProcurementCartPanel storeId={storeId} onOrderPlaced={() => setTab('orders')} />
        </TabsContent>

        <TabsContent value="orders">
          <ProcurementOrdersPanel storeId={storeId} />
        </TabsContent>
      </Tabs>

      <Modal
        open={!!conflict}
        onClose={() => setConflict(null)}
        title="Replace cart?"
        description={`Your cart has items from ${conflict?.existingVendor}. A procurement order can only include one supplier at a time.`}
      >
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConflict(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (!conflict) return;
              addToCart.mutate({
                vendorProductId: conflict.product.id,
                quantity: conflict.quantity,
                replaceExisting: true,
              });
              setConflict(null);
            }}
          >
            Clear cart and add
          </Button>
        </div>
      </Modal>
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
