'use client';

import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';

interface InventoryRow {
  productName: string;
  storeName: string;
  sku: string;
  availableQty: number;
  reservedQty: number;
  soldQty: number;
  stockLevel: string;
  status: string;
}

export function AdminInventoryContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'inventory'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: { items: InventoryRow[] } }>(
        '/api/admin/inventory?limit=100',
      );
      return res.data.items;
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Read-only audit view of inventory across all stores.</p>
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Reserved</th>
                <th className="px-4 py-3">Sold</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((row, i) => (
                <tr key={`${row.sku}-${i}`} className="border-t border-slate-100">
                  <td className="px-4 py-2">{row.storeName}</td>
                  <td className="px-4 py-2 font-medium">{row.productName}</td>
                  <td className="px-4 py-2 font-mono text-xs">{row.sku}</td>
                  <td className="px-4 py-2">{row.availableQty}</td>
                  <td className="px-4 py-2">{row.reservedQty}</td>
                  <td className="px-4 py-2">{row.soldQty}</td>
                  <td className="px-4 py-2">{row.stockLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
