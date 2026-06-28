'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';
import { Input } from '@/design-system';

interface UsageItem {
  id: string;
  merchant: { id: string; businessName: string; phone: string | null; email: string | null };
  store: { id: string; name: string };
  uploadedImageUrl: string;
  confidence: number | null;
  status: string;
  chargeAmountPaise: number;
  chargedAt: string | null;
  createdProduct: { id: string; name: string; slug: string } | null;
  errorMessage: string | null;
  createdAt: string;
}

interface Stats {
  totalAnalyses: number;
  confirmedProducts: number;
  failedAnalyses: number;
  refunds: number;
  totalAiRevenuePaise: number;
  totalAiRevenueRupee: number;
  merchantWise: { merchantProfileId: string; businessName: string; analysisCount: number }[];
}

export function AiProductUsageContent() {
  const [status, setStatus] = useState('');
  const [lowConfidence, setLowConfidence] = useState(false);
  const [charged, setCharged] = useState(false);
  const [failed, setFailed] = useState(false);
  const [merchantId, setMerchantId] = useState('');
  const [storeId, setStoreId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ai-product-usage', status, lowConfidence, charged, failed, merchantId, storeId],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (status) q.set('status', status);
      if (lowConfidence) q.set('lowConfidence', 'true');
      if (charged) q.set('charged', 'true');
      if (failed) q.set('failed', 'true');
      if (merchantId) q.set('merchantProfileId', merchantId);
      if (storeId) q.set('storeId', storeId);
      const res = await adminFetch<{
        success: boolean;
        data: { items: UsageItem[]; meta: { total: number }; stats: Stats };
      }>(`/api/admin/ai-product-usage?${q.toString()}`);
      return res.data;
    },
  });

  const stats = data?.stats;

  const handleExport = async () => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (lowConfidence) q.set('lowConfidence', 'true');
    if (charged) q.set('charged', 'true');
    if (failed) q.set('failed', 'true');
    if (merchantId) q.set('merchantProfileId', merchantId);
    if (storeId) q.set('storeId', storeId);
    const res = await fetch(`/api/admin/ai-product-usage/export?${q.toString()}`, { credentials: 'include' });
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-product-usage.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Total analyses', stats.totalAnalyses],
            ['Confirmed products', stats.confirmedProducts],
            ['Failed analyses', stats.failedAnalyses],
            ['Refunds', stats.refunds],
            ['AI revenue', `₹${stats.totalAiRevenueRupee.toFixed(2)}`],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border bg-white p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {stats && stats.merchantWise.length > 0 && (
        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-2 text-sm font-medium text-slate-700">Top merchants by AI usage</h3>
          <div className="flex flex-wrap gap-2">
            {stats.merchantWise.map((m) => (
              <span key={m.merchantProfileId} className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                {m.businessName}: {m.analysisCount}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="grid flex-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Status</span>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>
            <Input label="Merchant profile ID" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} />
            <Input label="Store ID" value={storeId} onChange={(e) => setStoreId(e.target.value)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={lowConfidence} onChange={(e) => setLowConfidence(e.target.checked)} />
              Low confidence
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={charged} onChange={(e) => setCharged(e.target.checked)} />
              Charged
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={failed} onChange={(e) => setFailed(e.target.checked)} />
              Failed
            </label>
          </div>
          <button
            type="button"
            onClick={() => void handleExport()}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <div className="border-b px-4 py-3 text-sm text-slate-500">
          {isLoading ? 'Loading…' : `${data?.meta.total ?? 0} analyses`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Image</th>
                <th className="p-3">Merchant</th>
                <th className="p-3">Store</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Status</th>
                <th className="p-3">Charge</th>
                <th className="p-3">Product</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border">
                      <Image src={item.uploadedImageUrl} alt="" fill className="object-cover" unoptimized />
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{item.merchant.businessName}</div>
                    <div className="text-xs text-slate-500">{item.merchant.id}</div>
                  </td>
                  <td className="p-3">{item.store.name}</td>
                  <td className="p-3">{item.confidence != null ? `${(item.confidence * 100).toFixed(0)}%` : '—'}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{item.status}</span>
                    {item.errorMessage && (
                      <p className="mt-1 text-xs text-red-600">{item.errorMessage}</p>
                    )}
                  </td>
                  <td className="p-3">
                    ₹{(item.chargeAmountPaise / 100).toFixed(2)}
                    {item.chargedAt && <div className="text-xs text-slate-500">Charged</div>}
                  </td>
                  <td className="p-3">{item.createdProduct?.name ?? '—'}</td>
                  <td className="p-3 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
