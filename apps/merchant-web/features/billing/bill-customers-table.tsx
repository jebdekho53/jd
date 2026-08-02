'use client';

import { Card, CardBody, Skeleton } from '@/design-system/primitives';
import { useOfflineBillCustomersQuery } from '@/hooks/use-billing';

export function BillCustomersTable({ storeId }: { storeId: string }) {
  const { data, isLoading } = useOfflineBillCustomersQuery(storeId);
  const customers = data ?? [];

  if (isLoading) return <Skeleton className="h-40" />;

  if (customers.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-500">
            No walk-in customers yet — phone numbers captured on in-store bills will show up here.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Phone</th>
            <th className="px-3 py-2">Bills</th>
            <th className="px-3 py-2">Total spent</th>
            <th className="px-3 py-2">Last visit</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.customerPhone} className="border-t border-slate-100">
              <td className="px-3 py-2">{c.customerName || '—'}</td>
              <td className="px-3 py-2 text-slate-500">{c.customerPhone}</td>
              <td className="px-3 py-2">{c.billCount}</td>
              <td className="px-3 py-2 font-medium">₹{c.totalSpent.toFixed(2)}</td>
              <td className="px-3 py-2 text-slate-500">{new Date(c.lastBillAt).toLocaleDateString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
