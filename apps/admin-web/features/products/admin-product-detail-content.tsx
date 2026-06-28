'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { adminFetch } from '@/services/api/admin-client';

interface ProductAudit {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  isActive: boolean;
  visibility: { buyerVisible: boolean; storeStatus: string; storeActive: boolean };
  metadata: Record<string, string | boolean | null>;
  tax: {
    hsnCode: string | null;
    hsnDescription: string | null;
    gstSlab: string | null;
    taxCategory: string | null;
  };
  inventory: {
    variantId: string;
    sku: string;
    name: string;
    price: number;
    availableQty: number;
    reservedQty: number;
    status: string | null;
  }[];
  reviews: {
    aggregate: { ratingAvg: number; ratingCount: number };
    recent: { id: string; rating: number; comment: string | null; buyerName: string }[];
  };
  offers: {
    storePromotions: { id: string; name: string }[];
    coupons: { id: string; code: string; name: string }[];
    campaignOffers: { id: string; name: string }[];
  };
  store: { id: string; name: string; slug: string; pincode: string };
  merchant: { businessName: string; email: string | null; phone: string | null } | null;
  category: { name: string } | null;
  pdpPreviewUrl: string;
}

export function AdminProductDetailContent({ productId }: { productId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'product', productId],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: ProductAudit }>(
        `/api/admin/products/${productId}`,
      );
      return res.data;
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading product audit…</p>;
  if (error || !data) return <p className="text-sm text-red-600">Failed to load product.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{data.name}</h1>
          <p className="text-sm text-slate-500">
            {data.brand ?? 'No brand'} · {data.category?.name ?? 'Uncategorized'}
          </p>
        </div>
        <a
          href={data.pdpPreviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          View buyer PDP →
        </a>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-slate-900">Visibility</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Buyer visible</dt><dd>{data.visibility.buyerVisible ? 'Yes' : 'No'}</dd></div>
          <div><dt className="text-slate-500">Store status</dt><dd>{data.visibility.storeStatus}</dd></div>
          <div><dt className="text-slate-500">Product active</dt><dd>{data.isActive ? 'Yes' : 'No'}</dd></div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-slate-900">Store & merchant</h2>
        <p className="text-sm">
          <Link href={`/stores/${data.store.id}`} className="text-emerald-700 hover:underline">{data.store.name}</Link>
          {' · PIN '}{data.store.pincode}
        </p>
        {data.merchant && (
          <p className="mt-1 text-sm text-slate-600">
            {data.merchant.businessName} · {data.merchant.email ?? data.merchant.phone}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-slate-900">Tax & compliance</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">HSN</dt><dd>{data.tax.hsnCode ?? '—'}</dd></div>
          <div><dt className="text-slate-500">GST slab</dt><dd>{data.tax.gstSlab ?? '—'}</dd></div>
          <div><dt className="text-slate-500">FSSAI</dt><dd>{String(data.metadata.fssaiLicense ?? '—')}</dd></div>
          <div><dt className="text-slate-500">Origin</dt><dd>{String(data.metadata.countryOfOrigin ?? '—')}</dd></div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-slate-900">Inventory</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr><th className="py-2">SKU</th><th>Available</th><th>Reserved</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.inventory.map((row) => (
                <tr key={row.variantId} className="border-t border-slate-100">
                  <td className="py-2 font-mono text-xs">{row.sku}</td>
                  <td>{row.availableQty}</td>
                  <td>{row.reservedQty}</td>
                  <td>{row.status ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-slate-900">Reviews</h2>
        <p className="text-sm text-slate-600">
          {data.reviews.aggregate.ratingCount > 0
            ? `${data.reviews.aggregate.ratingAvg.toFixed(1)} ★ (${data.reviews.aggregate.ratingCount})`
            : 'No product reviews yet'}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-slate-900">Active offers</h2>
        <p className="text-sm text-slate-600">
          {data.offers.storePromotions.length} promotions · {data.offers.coupons.length} coupons ·{' '}
          {data.offers.campaignOffers.length} campaigns
        </p>
      </section>
    </div>
  );
}
