'use client';

import { useState } from 'react';
import { Card, CardBody, Skeleton } from '@/design-system/primitives';
import { useOfflineBillsQuery } from '@/hooks/use-billing';
import { BillDetailModal } from './bill-detail-modal';
import type { OfflineBill } from '@/types/billing';

export function BillHistoryTable({ storeId }: { storeId: string }) {
  const { data, isLoading } = useOfflineBillsQuery(storeId);
  const bills = data?.items ?? [];
  const [selected, setSelected] = useState<OfflineBill | null>(null);

  if (isLoading) return <Skeleton className="h-40" />;

  if (bills.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-500">No in-store bills yet — create one above.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Items</th>
              <th className="px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => {
              const shortfall = bill.items.reduce((s, i) => s + i.shortfall, 0);
              return (
                <tr
                  key={bill.id}
                  onClick={() => setSelected(bill)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-3 py-2 text-slate-500">{new Date(bill.createdAt).toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2">
                    {bill.customerName || 'Walk-in customer'} <span className="text-slate-400">({bill.customerPhone})</span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
                    {shortfall > 0 && <span className="ml-2 text-amber-600">shortfall {shortfall}</span>}
                  </td>
                  <td className="px-3 py-2 font-medium">₹{Number(bill.totalAmount).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <BillDetailModal bill={selected} storeId={storeId} onClose={() => setSelected(null)} />
    </>
  );
}
