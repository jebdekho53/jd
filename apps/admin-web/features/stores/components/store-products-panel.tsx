'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listStoreProducts } from '@/services/admin-api';

/** Superadmin visibility into what a store actually sells — this section
 *  didn't exist anywhere in admin-web before; the store detail page only
 *  showed merchant/compliance info, never the catalog itself. */
export function StoreProductsPanel({ storeId }: { storeId: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stores', storeId, 'products', page, search, isActiveFilter],
    queryFn: () =>
      listStoreProducts({
        storeId,
        page,
        limit: 20,
        search: search.trim() || undefined,
        isActive: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
      }),
  });

  const products = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search products…"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
        />
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setIsActiveFilter(f);
              setPage(1);
            }}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${
              isActiveFilter === f ? 'bg-admin-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {f}
          </button>
        ))}
        {meta && <span className="ml-auto text-xs text-slate-500">{meta.total} products</span>}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading products…</p>}

      {!isLoading && products.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          No products{search ? ' matching that search' : ' yet'}.
        </p>
      )}

      {products.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="flex items-center gap-2 px-3 py-2">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-slate-100" />
                    )}
                    <span className="font-medium text-slate-900">{p.name}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{p.category?.name ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-900">
                    ₹{p.basePrice}
                    {p.mrp != null && p.mrp > p.basePrice && (
                      <span className="ml-1 text-xs text-slate-400 line-through">₹{p.mrp}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{p.totalStock}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-slate-500">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
