'use client';

import { useState } from 'react';
import {
  useAdminPayoutRequestsQuery,
  useAdminSettlementsQuery,
  useApprovePayoutMutation,
  useProcessPayoutMutation,
  useRejectPayoutMutation,
} from '@/hooks/use-settlement';
import { AdminMetricCard, AdminSection } from '@/components/dashboard/dashboard-widgets';
import { Button } from '@/design-system';

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function AdminSettlementsContent() {
  const overview = useAdminSettlementsQuery();
  const payouts = useAdminPayoutRequestsQuery();
  const approve = useApprovePayoutMutation();
  const reject = useRejectPayoutMutation();
  const process = useProcessPayoutMutation();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const s = overview.data?.summary;

  return (
    <div className="space-y-10">
      <AdminSection title="Settlement overview" description="Platform merchant liabilities and payouts">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard label="Pending payouts" value={s?.pendingPayouts ?? '—'} loading={overview.isLoading} href="/settlements" />
          <AdminMetricCard label="Completed payouts" value={s?.completedPayouts ?? '—'} loading={overview.isLoading} />
          <AdminMetricCard label="Total liability" value={formatInr(s?.totalMerchantLiability ?? 0)} loading={overview.isLoading} />
          <AdminMetricCard label="Settled today" value={formatInr(s?.totalSettledToday ?? 0)} loading={overview.isLoading} />
        </div>
      </AdminSection>

      <AdminSection title="Payout requests">
        {payouts.data?.payoutRequests.length ? (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Merchant</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Requested</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.data.payoutRequests.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="px-4 py-3">{p.merchant}</td>
                    <td className="px-4 py-3 font-medium">{formatInr(p.amount)}</td>
                    <td className="px-4 py-3">{p.status}</td>
                    <td className="px-4 py-3">{new Date(p.requestedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {p.status === 'PENDING' && (
                          <>
                            <Button size="sm" onClick={() => approve.mutate(p.id)} disabled={approve.isPending}>Approve</Button>
                            <Button size="sm" variant="secondary" onClick={() => setRejectId(p.id)}>Reject</Button>
                          </>
                        )}
                        {p.status === 'APPROVED' && (
                          <Button size="sm" onClick={() => process.mutate(p.id)} disabled={process.isPending}>Process</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">No payout requests.</p>
        )}

        {rejectId && (
          <form
            className="mt-4 flex max-w-md flex-col gap-2 rounded-lg border bg-card p-4"
            onSubmit={(e) => {
              e.preventDefault();
              reject.mutate({ id: rejectId, reason: rejectReason }, { onSuccess: () => { setRejectId(null); setRejectReason(''); } });
            }}
          >
            <p className="text-sm font-medium">Reject payout</p>
            <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason" className="rounded border px-3 py-2 text-sm" required />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={reject.isPending}>Confirm reject</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setRejectId(null)}>Cancel</Button>
            </div>
          </form>
        )}
      </AdminSection>

      <AdminSection title="Merchant wallets">
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Merchant</th>
                <th className="px-4 py-3 text-left">Available</th>
                <th className="px-4 py-3 text-left">Pending</th>
                <th className="px-4 py-3 text-left">Earned</th>
                <th className="px-4 py-3 text-left">Paid out</th>
              </tr>
            </thead>
            <tbody>
              {(overview.data?.merchantWallets ?? []).map((w) => (
                <tr key={w.merchantProfileId} className="border-b">
                  <td className="px-4 py-3 font-medium">{w.businessName}</td>
                  <td className="px-4 py-3">{formatInr(w.availableBalance)}</td>
                  <td className="px-4 py-3">{formatInr(w.pendingBalance)}</td>
                  <td className="px-4 py-3">{formatInr(w.totalEarned)}</td>
                  <td className="px-4 py-3">{formatInr(w.totalPaidOut)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>

      <AdminSection title="Settlement ledger">
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Merchant</th>
                <th className="px-4 py-3 text-left">Net</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {(overview.data?.settlementLedger ?? []).map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="px-4 py-3">{l.orderNumber}</td>
                  <td className="px-4 py-3">{l.merchant}</td>
                  <td className="px-4 py-3">{formatInr(l.netAmount)}</td>
                  <td className="px-4 py-3">{l.status}</td>
                  <td className="px-4 py-3">{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>
    </div>
  );
}
