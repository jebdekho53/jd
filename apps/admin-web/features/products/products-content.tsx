'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { listStoreProducts, listStores } from '@/services/admin-api';
import type { AdminStoreListItem } from '@/types/store';

/** Global superadmin product browser — "which store has which product" had
 *  no answer anywhere before: StoreProductsPanel only works once you already
 *  know the store. This searches products across every store at once, with
 *  an optional store filter for narrowing down to one. */
export function ProductsContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedStore, setSelectedStore] = useState<{ id: string; name: string } | null>(null);
  const [storeQuery, setStoreQuery] = useState('');
  const [debouncedStoreQuery, setDebouncedStoreQuery] = useState('');
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const storeBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedStoreQuery(storeQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [storeQuery]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (storeBoxRef.current && !storeBoxRef.current.contains(e.target as Node)) {
        setStoreDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const storeSearchQuery = useQuery({
    queryKey: ['admin', 'stores', 'search', debouncedStoreQuery],
    queryFn: () => listStores({ search: debouncedStoreQuery, limit: 8 }),
    enabled: debouncedStoreQuery.length >= 2,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', selectedStore?.id, page, debouncedSearch, isActiveFilter],
    queryFn: () =>
      listStoreProducts({
        storeId: selectedStore?.id,
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        isActive: isActiveFilter === 'all' ? undefined : isActiveFilter === 'active',
      }),
  });

  const products = data?.data ?? [];
  const meta = data?.meta;
  const storeResults: AdminStoreListItem[] = storeSearchQuery.data?.data ?? [];

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

        <div ref={storeBoxRef} className="relative">
          {selectedStore ? (
            <button
              type="button"
              onClick={() => {
                setSelectedStore(null);
                setPage(1);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-admin-800 px-2.5 py-1.5 text-xs font-medium text-white"
            >
              {selectedStore.name}
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <input
              value={storeQuery}
              onChange={(e) => {
                setStoreQuery(e.target.value);
                setStoreDropdownOpen(true);
              }}
              onFocus={() => setStoreDropdownOpen(true)}
              placeholder="Filter by store…"
              className="w-48 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            />
          )}

          {storeDropdownOpen && !selectedStore && debouncedStoreQuery.length >= 2 && (
            <div className="absolute z-10 mt-1 w-64 rounded-lg border border-slate-200 bg-white shadow-lg">
              {storeSearchQuery.isLoading && (
                <p className="px-3 py-2 text-xs text-slate-500">Searching…</p>
              )}
              {!storeSearchQuery.isLoading && storeResults.length === 0 && (
                <p className="px-3 py-2 text-xs text-slate-500">No stores found.</p>
              )}
              {storeResults.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedStore({ id: s.id, name: s.name });
                    setStoreQuery('');
                    setStoreDropdownOpen(false);
                    setPage(1);
                  }}
                  className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  {s.name}
                  <span className="ml-1 text-xs text-slate-400">{s.merchantProfile?.businessName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

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
          No products{search ? ' matching that search' : ''}.
        </p>
      )}

      {products.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Store</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">
                    <Link href={`/products/${p.id}`} className="flex items-center gap-2">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-slate-100" />
                      )}
                      <span className="font-medium text-slate-900 hover:underline">{p.name}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {p.store ? (
                      <Link href={`/stores/${p.store.id}`} className="hover:underline">
                        {p.store.name}
                      </Link>
                    ) : (
                      '—'
                    )}
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
