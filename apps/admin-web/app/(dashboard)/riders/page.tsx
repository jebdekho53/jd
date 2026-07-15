'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { useAdminRidersDashboardQuery } from '@/hooks/use-dashboard';

function RidersPageInner() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status')?.toUpperCase();
  const kyc = searchParams.get('kyc')?.toUpperCase();
  const { data, isLoading } = useAdminRidersDashboardQuery();

  const filtered = (data?.riders ?? []).filter((r) => {
    if (status === 'ONLINE') {
      return r.status === 'ONLINE' || r.status === 'ON_DELIVERY' || r.status === 'BUSY';
    }
    if (status === 'OFFLINE') return r.status === 'OFFLINE';
    if (status === 'BUSY') return r.status === 'BUSY' || r.status === 'ON_DELIVERY';
    if (status === 'AVAILABLE') return r.status === 'ONLINE';
    if (kyc === 'PENDING') return r.kycStatus === 'PENDING';
    if (kyc === 'REJECTED') return r.kycStatus === 'REJECTED';
    return true;
  });

  const title = status
    ? `${status.charAt(0) + status.slice(1).toLowerCase()} riders`
    : kyc
      ? `${kyc.charAt(0) + kyc.slice(1).toLowerCase()} KYC riders`
      : 'Rider management';

  return (
  <DashboardShell title={title}>
    <div className="mb-4 flex flex-wrap gap-2">
      <a href="/riders/kyc" className="rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted">
        KYC review
      </a>
      <a href="/riders/incentives" className="rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted">
        Incentives
      </a>
      <a href="/riders/live" className="rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted">
        Live operations
      </a>
    </div>
    {isLoading && <p className="text-sm text-muted-foreground">Loading riders…</p>}
    {!isLoading && filtered.length === 0 && (
      <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        No riders match this filter.
      </p>
    )}
    {!isLoading && filtered.length > 0 && (
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Rider</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">KYC</th>
              <th className="px-4 py-3 text-left">Current order</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="px-4 py-3">{r.name}<br /><span className="text-xs text-muted-foreground">{r.phone}</span></td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3">{r.kycStatus}</td>
                <td className="px-4 py-3">{r.currentOrder ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </DashboardShell>
  );
}

export default function RidersPage() {
  return (
    <Suspense fallback={<DashboardShell title="Rider management"><p className="text-sm text-muted-foreground">Loading…</p></DashboardShell>}>
      <RidersPageInner />
    </Suspense>
  );
}
