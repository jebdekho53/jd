'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/design-system/primitives';
import { useStoreStore } from '@/store/store-store';

interface ClaimRow {
  id: string;
  claimNumber: string;
  claimType: string;
  status: string;
  reason: string;
  requestedAmount: number;
  orderNumber?: string;
  createdAt: string;
}

export function MerchantClaimsPageContent() {
  const { currentStore } = useStoreStore();
  const [status, setStatus] = useState('');
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (status) qs.set('status', status);
      if (currentStore?.id) qs.set('storeId', currentStore.id);
      const res = await fetch(`/api/merchant/claims?${qs}`);
      const json = await res.json();
      setClaims(json?.data?.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [status, currentStore?.id]);

  const act = async (claimId: string, action: string) => {
    await fetch(`/api/merchant/claims/${claimId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    void load();
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Returns & Claims</h1>
          <p className="text-sm text-slate-500">Review buyer return, refund, and replacement requests</p>
        </div>
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="REPLACEMENT_APPROVED">Replacement</option>
          <option value="REFUND_PROCESSED">Refund processed</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading claims…</p>
      ) : claims.length === 0 ? (
        <p className="text-sm text-slate-500">No claims found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Claim</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{c.claimNumber}</td>
                  <td className="px-4 py-3">{c.orderNumber ?? '—'}</td>
                  <td className="px-4 py-3">{c.claimType}</td>
                  <td className="px-4 py-3">{c.status}</td>
                  <td className="px-4 py-3">₹{c.requestedAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {c.status === 'PENDING' && (
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" onClick={() => act(c.id, 'APPROVE_REFUND')}>
                          Approve refund
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => act(c.id, 'APPROVE_REPLACEMENT')}>
                          Approve replacement
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => act(c.id, 'REQUEST_EVIDENCE')}>
                          More evidence
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => act(c.id, 'REJECT')}>
                          Reject
                        </Button>
                      </div>
                    )}
                    {c.status === 'APPROVED' && c.claimType === 'REPLACEMENT' && (
                      <Button size="sm" onClick={() => act(c.id, 'ISSUE_REPLACEMENT')}>
                        Issue replacement
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
