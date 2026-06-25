'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export function AdminCorporateContent() {
  const { data } = useQuery({
    queryKey: ['admin', 'corporate'],
    queryFn: async () => {
      const res = await fetch('/api/admin/corporate/overview');
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <DashboardShell title="Corporate Commerce">
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Companies" value={data.metrics?.activeCompanies ?? 0} />
            <Stat label="Spend" value={`₹${data.metrics?.totalSpend ?? 0}`} />
            <Stat label="Credit utilization" value={`${data.metrics?.creditUtilization ?? 0}%`} />
            <Stat label="Invoices" value={data.metrics?.invoices ?? 0} />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
