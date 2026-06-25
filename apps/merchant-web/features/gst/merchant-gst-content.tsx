'use client';

import { useQuery } from '@tanstack/react-query';
import { merchantFetch } from '@/services/api/merchant-client';

export function MerchantGstContent() {
  const { data } = useQuery({
    queryKey: ['merchant', 'gst', 'overview'],
    queryFn: async () => {
      const res = await merchantFetch<{ success: boolean; data: GstOverview }>(
        '/api/merchant/gst/overview',
      );
      return res.data;
    },
  });

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Invoices" value={String(summary?.invoiceCount ?? 0)} />
        <Stat label="Taxable sales" value={`₹${(summary?.taxableSales ?? 0).toLocaleString()}`} />
        <Stat label="GST collected" value={`₹${(summary?.gstCollected ?? 0).toLocaleString()}`} />
        <Stat label="Gross total" value={`₹${(summary?.grossTotal ?? 0).toLocaleString()}`} />
      </div>

      <section className="rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Recent invoices</h3>
          <a
            href="/api/merchant/gst/reports/summary?format=csv"
            className="text-sm text-brand-700 hover:underline"
          >
            Export summary
          </a>
        </div>
        <ul className="divide-y text-sm">
          {(data?.recentInvoices ?? []).map((inv) => (
            <li key={inv.id} className="flex justify-between py-2">
              <span>{inv.invoiceNumber} · #{inv.orderNumber}</span>
              <span>₹{inv.grandTotal.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>

      {data?.tds && (
        <section className="rounded-xl border p-4">
          <h3 className="mb-2 font-semibold">TDS summary</h3>
          <p className="text-sm text-muted-foreground">Total TDS: ₹{data.tds.totalTds.toLocaleString()}</p>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

interface GstOverview {
  summary: {
    invoiceCount: number;
    taxableSales: number;
    gstCollected: number;
    grossTotal: number;
  };
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    orderNumber: string;
    grandTotal: number;
  }>;
  tds: { totalTds: number };
}
