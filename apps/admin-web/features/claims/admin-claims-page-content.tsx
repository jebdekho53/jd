'use client';

import { useEffect, useState } from 'react';
import { Button, Input } from '@/design-system';

interface ClaimRow {
  id: string;
  claimNumber: string;
  claimType: string;
  status: string;
  storeId: string;
  requestedAmount: number;
  createdAt: string;
}

export function AdminClaimsPageContent() {
  const [status, setStatus] = useState('PENDING');
  const [claims, setClaims] = useState<ClaimRow[]>([]);

  const load = async () => {
    const qs = new URLSearchParams();
    if (status) qs.set('status', status);
    const res = await fetch(`/api/admin/claims?${qs}`);
    const json = await res.json();
    setClaims(json?.data?.items ?? []);
  };

  useEffect(() => {
    void load();
  }, [status]);

  const act = async (claimId: string, action: string, adminAction?: string) => {
    await fetch(`/api/admin/claims/${claimId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, adminAction }),
    });
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Returns & Claims</h1>
          <p className="text-sm text-muted-foreground">Admin override, escalations, and fraud review</p>
        </div>
        <select
          className="rounded-lg border px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="REFUND_PROCESSING">Refund processing</option>
          <option value="REFUND_PROCESSED">Refund processed</option>
        </select>
      </div>

      <div className="rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Claim</th>
              <th className="px-4 py-3">Store</th>
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
                <td className="px-4 py-3">{c.storeId.slice(0, 8)}…</td>
                <td className="px-4 py-3">{c.claimType}</td>
                <td className="px-4 py-3">{c.status}</td>
                <td className="px-4 py-3">₹{c.requestedAmount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" onClick={() => act(c.id, 'APPROVE_REFUND', 'FORCE_REFUND')}>
                      Force refund
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => act(c.id, 'APPROVE_REPLACEMENT')}>
                      Approve replacement
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => act(c.id, 'REJECT')}>
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
