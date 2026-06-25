'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export function AdminMembershipContent() {
  const { data } = useQuery({
    queryKey: ['admin', 'membership'],
    queryFn: async () => {
      const res = await fetch('/api/admin/membership/overview');
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <DashboardShell title="Membership">
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="MRR" value={`₹${data.metrics?.mrr ?? 0}`} />
            <Stat label="Active" value={data.metrics?.activeSubscribers ?? 0} />
            <Stat label="Retention" value={`${data.metrics?.retention ?? 0}%`} />
            <Stat label="Churn" value={`${data.metrics?.churnRate ?? 0}%`} />
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
