'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { merchantFetch } from '@/services/api/merchant-client';
import type { AiBillingItem } from '@/services/products/product-creation-api';

interface Props {
  storeId: string;
}

export function ProductAiBillingTab({ storeId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['merchant', 'ai-billing', storeId],
    queryFn: async () => {
      const res = await merchantFetch<{
        success: boolean;
        data: { items: AiBillingItem[]; meta: { total: number } };
      }>(`/api/merchant/stores/${storeId}/products/ai/billing`);
      return res.data;
    },
  });

  if (isLoading) {
    return <p className="p-4 text-sm text-slate-500">Loading AI billing history…</p>;
  }

  if (!data?.items.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Sparkles className="mb-2 h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-500">No AI product charges yet.</p>
        <p className="mt-1 text-xs text-slate-400">₹1.50 is charged only when you confirm an AI product.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="p-3">Product</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Status</th>
            <th className="p-3">Charged</th>
            <th className="p-3">Refunded</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr key={`${item.analysisId}-${idx}`} className="border-b">
              <td className="p-3">{item.productName}</td>
              <td className="p-3">₹{(item.amountPaise / 100).toFixed(2)}</td>
              <td className="p-3">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{item.status}</span>
              </td>
              <td className="p-3 text-xs text-slate-500">
                {item.chargedAt ? new Date(item.chargedAt).toLocaleString() : '—'}
              </td>
              <td className="p-3 text-xs text-slate-500">
                {item.refundedAt ? new Date(item.refundedAt).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
