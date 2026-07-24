'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const EMPTY_FORM = {
  name: '',
  sku: '',
  category: '',
  hsnCode: '',
  gstRate: '',
  basePrice: '',
  moq: '1',
  leadTimeDays: '3',
  availableQty: '0',
};

function CatalogContent() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['vendor', 'catalog'],
    queryFn: async () => {
      const res = await fetch('/api/vendor/catalog');
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed');
      return json.data as CatalogRow[];
    },
  });

  const createProduct = useMutation({
    mutationFn: async (catalogId: string) => {
      const res = await fetch('/api/vendor/catalog/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalogId,
          name: form.name,
          sku: form.sku,
          category: form.category || undefined,
          hsnCode: form.hsnCode || undefined,
          gstRate: form.gstRate ? Number(form.gstRate) : undefined,
          basePrice: Number(form.basePrice),
          moq: Number(form.moq) || 1,
          leadTimeDays: Number(form.leadTimeDays) || 3,
          availableQty: Number(form.availableQty) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Failed to add product');
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor', 'catalog'] });
      setForm(EMPTY_FORM);
      setShowForm(false);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading catalog…</p>;

  const catalogs = data ?? [];
  const defaultCatalogId = catalogs[0]?.id;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {defaultCatalogId && (
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-violet-400"
          >
            {showForm ? 'Cancel' : 'Add product'}
          </button>
        )}
      </div>

      {showForm && defaultCatalogId && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createProduct.mutate(defaultCatalogId);
          }}
          className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Product name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
            <input
              required
              placeholder="SKU"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Category (optional)"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
            <input
              placeholder="HSN code (optional)"
              value={form.hsnCode}
              onChange={(e) => setForm((f) => ({ ...f, hsnCode: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              required
              type="number"
              min={0}
              step="0.01"
              placeholder="Base price (₹)"
              value={form.basePrice}
              onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              placeholder="GST rate %"
              value={form.gstRate}
              onChange={(e) => setForm((f) => ({ ...f, gstRate: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
            <input
              type="number"
              min={0}
              placeholder="Available stock"
              value={form.availableQty}
              onChange={(e) => setForm((f) => ({ ...f, availableQty: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-400">
              Minimum order quantity
              <input
                type="number"
                min={1}
                value={form.moq}
                onChange={(e) => setForm((f) => ({ ...f, moq: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-slate-400">
              Lead time (days)
              <input
                type="number"
                min={0}
                value={form.leadTimeDays}
                onChange={(e) => setForm((f) => ({ ...f, leadTimeDays: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>
          </div>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={createProduct.isPending}
            className="w-full rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-violet-400 disabled:opacity-50"
          >
            {createProduct.isPending ? 'Adding…' : 'Add product'}
          </button>
        </form>
      )}

      {catalogs.map((cat) => (
        <div key={cat.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="font-medium text-white">{cat.name}</h2>
          <div className="mt-2 space-y-1">
            {(cat.products ?? []).map((p) => (
              <div key={p.id} className="flex justify-between text-sm text-slate-300">
                <span>{p.name} ({p.sku})</span>
                <span>₹{Number(p.basePrice)} · Stock {p.inventory?.availableQty ?? 0}</span>
              </div>
            ))}
            {(cat.products ?? []).length === 0 && (
              <p className="text-sm text-slate-500">No products yet.</p>
            )}
          </div>
        </div>
      ))}
      {catalogs.length === 0 && <p className="text-sm text-slate-500">No catalog found.</p>}
    </div>
  );
}

export default function CatalogPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <h1 className="mb-4 text-2xl font-bold">Catalog</h1>
      <CatalogContent />
    </QueryClientProvider>
  );
}

interface CatalogRow { id: string; name: string; products?: ProductRow[] }
interface ProductRow { id: string; name: string; sku: string; basePrice: number; inventory?: { availableQty: number } }
