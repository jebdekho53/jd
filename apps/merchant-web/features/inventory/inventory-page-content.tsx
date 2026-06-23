'use client';

import { useState } from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import { Card, Input, Badge, Table, THead, TBody, Tr, Th, Td, Skeleton } from '@/design-system/primitives';
import { InventoryInlineEditor } from '@/features/products/components/inventory-inline-editor';
import { useProductsQuery } from '@/hooks/use-products';
import { useStoreStore } from '@/store/store-store';
import { useDebounce } from '@/hooks/use-debounce';
import Link from 'next/link';
import { Button } from '@/design-system/primitives';

export function InventoryPageContent() {
  const { currentStore } = useStoreStore();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterLow, setFilterLow] = useState(false);

  const { data, isLoading } = useProductsQuery(currentStore?.id ?? '', {
    search: debouncedSearch || undefined,
    limit: 100,
  });

  if (!currentStore) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="mb-3 h-8 w-8 text-amber-500" />
        <h3 className="font-semibold">No store selected</h3>
        <Link href="/stores"><Button className="mt-4" variant="outline">Go to Stores</Button></Link>
      </div>
    );
  }

  const products = data?.data ?? [];
  const rows = products.flatMap((p) =>
    p.variants.map((v) => ({
      productId: p.id,
      productName: p.name,
      variantId: v.id,
      variantName: v.name,
      sku: v.sku,
      qty: v.inventory?.quantity ?? 0,
      reserved: v.inventory?.reserved ?? 0,
      available: Math.max(0, (v.inventory?.quantity ?? 0) - (v.inventory?.reserved ?? 0)),
      threshold: v.inventory?.lowStockThreshold ?? null,
    })),
  );

  const filtered = filterLow ? rows.filter((r) => r.threshold !== null && r.qty <= r.threshold) : rows;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500">{currentStore.name}</p>
        </div>
        <button
          type="button"
          onClick={() => setFilterLow((p) => !p)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filterLow ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          {filterLow ? '✓ ' : ''}Low Stock Only
        </button>
      </div>

      <Card>
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input className="pl-8" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : (
          <Table>
            <THead>
              <Tr>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th>Stock</Th>
                <Th>Reserved</Th>
                <Th>Available</Th>
                <Th>Status</Th>
              </Tr>
            </THead>
            <TBody>
              {filtered.map((r) => {
                const isLow = r.threshold !== null && r.qty <= r.threshold;
                const isOut = r.qty === 0;
                return (
                  <Tr key={`${r.productId}-${r.variantId}`}>
                    <Td>
                      <p className="font-medium">{r.productName}</p>
                      <p className="text-xs text-slate-400">{r.variantName}</p>
                    </Td>
                    <Td><span className="font-mono text-xs text-slate-500">{r.sku}</span></Td>
                    <Td>
                      <InventoryInlineEditor
                        storeId={currentStore.id}
                        productId={r.productId}
                        variantId={r.variantId}
                        currentQty={r.qty}
                      />
                    </Td>
                    <Td className="text-slate-500">{r.reserved}</Td>
                    <Td className="font-medium">{r.available}</Td>
                    <Td>
                      {isOut ? (
                        <Badge tone="danger">Out of Stock</Badge>
                      ) : isLow ? (
                        <Badge tone="warning" dot>Low Stock</Badge>
                      ) : (
                        <Badge tone="success">In Stock</Badge>
                      )}
                    </Td>
                  </Tr>
                );
              })}
              {filtered.length === 0 && (
                <Tr>
                  <Td colSpan={6} className="py-8 text-center text-slate-400">
                    {filterLow ? 'No low-stock items!' : 'No inventory found.'}
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
