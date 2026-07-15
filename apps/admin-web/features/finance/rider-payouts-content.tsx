'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';
import { Badge, Button, Modal } from '@/design-system';
import { RefreshCw, Landmark } from 'lucide-react';

type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';

interface RiderPayoutRow {
  id: string;
  rider: string | null;
  riderProfileId: string;
  status: PayoutStatus;
  totalAmount: number;
  deliveryCount: number;
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
}

interface BankAccount {
  accountHolderName: string;
  accountNumber: string; // masked by the API
  ifsc: string;
  bankName?: string | null;
  upiId?: string | null;
  verified: boolean;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const statusTone: Record<PayoutStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  PENDING: 'warning',
  PROCESSING: 'info',
  PAID: 'success',
  FAILED: 'danger',
};

export function RiderPayoutsContent() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [manage, setManage] = useState<RiderPayoutRow | null>(null);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['admin', 'finance', 'rider-payouts', page],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: { payouts: RiderPayoutRow[]; meta: { total: number } } }>(
        `/api/admin/finance/rider-payouts?page=${page}&limit=25`,
      );
      return res.data;
    },
  });

  const rows = data?.payouts ?? [];
  const total = data?.meta.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Rider payouts</h2>
          <p className="text-sm text-slate-500">Verify a rider&apos;s bank account, then pay their weekly earnings via Razorpay Route.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Rider</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3 text-right">Deliveries</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No rider payouts yet.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{r.rider ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(r.periodStart).toLocaleDateString('en-IN')} – {new Date(r.periodEnd).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">{r.deliveryCount}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">{inr(r.totalAmount)}</td>
                <td className="px-4 py-3"><Badge tone={statusTone[r.status]}>{r.status}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => setManage(r)}>
                    <Landmark className="mr-1.5 h-4 w-4" /> Manage
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 25 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-slate-500">Page {page}</span>
          <Button variant="outline" size="sm" disabled={page * 25 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {manage && (
        <ManagePayoutModal
          payout={manage}
          onClose={() => setManage(null)}
          onDone={() => {
            qc.invalidateQueries({ queryKey: ['admin', 'finance', 'rider-payouts'] });
          }}
        />
      )}
    </div>
  );
}

function ManagePayoutModal({
  payout,
  onClose,
  onDone,
}: {
  payout: RiderPayoutRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const bankKey = ['admin', 'finance', 'rider-bank', payout.riderProfileId];

  const { data: bank, isLoading } = useQuery({
    queryKey: bankKey,
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: BankAccount | null }>(
        `/api/admin/finance/riders/${payout.riderProfileId}/bank-account`,
      );
      return res.data;
    },
  });

  const verify = useMutation({
    mutationFn: () =>
      adminFetch(`/api/admin/finance/riders/${payout.riderProfileId}/bank-account/verify`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: bankKey }),
  });

  const pay = useMutation({
    mutationFn: () =>
      adminFetch(`/api/admin/finance/rider-payouts/${payout.id}/pay-route`, { method: 'POST' }),
    onSuccess: () => {
      onDone();
      onClose();
    },
  });

  const canPay = payout.status === 'PENDING' || payout.status === 'FAILED';

  return (
    <Modal open onClose={onClose} title={`Payout — ${payout.rider ?? 'Rider'}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-500">Amount</span>
          <span className="text-lg font-bold text-slate-900">{inr(payout.totalAmount)}</span>
        </div>

        {isLoading && <p className="text-sm text-slate-400">Loading bank account…</p>}

        {!isLoading && !bank && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            This rider hasn&apos;t added a payout bank account yet. They add it themselves in the rider app.
          </p>
        )}

        {bank && (
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-3">
              {bank.verified ? (
                <Badge tone="success">Verified</Badge>
              ) : (
                <Badge tone="warning">Not verified</Badge>
              )}
            </div>
            <dl className="space-y-1.5 text-sm">
              <Row label="Account holder" value={bank.accountHolderName} />
              <Row label="Account number" value={bank.accountNumber} />
              <Row label="IFSC" value={bank.ifsc} />
              {bank.bankName && <Row label="Bank" value={bank.bankName} />}
              {bank.upiId && <Row label="UPI" value={bank.upiId} />}
            </dl>

            {!bank.verified && (
              <div className="mt-4">
                {verify.isError && (
                  <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {(verify.error as Error).message}
                  </p>
                )}
                <Button size="sm" loading={verify.isPending} onClick={() => verify.mutate()}>
                  Verify &amp; create payout account
                </Button>
                <p className="mt-2 text-xs text-slate-400">
                  Verifying creates the rider&apos;s Razorpay linked account. Check the details above match the rider first.
                </p>
              </div>
            )}
          </div>
        )}

        {pay.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{(pay.error as Error).message}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            loading={pay.isPending}
            disabled={!bank?.verified || !canPay}
            onClick={() => pay.mutate()}
          >
            {payout.status === 'PAID' ? 'Already paid' : `Pay ${inr(payout.totalAmount)} via Route`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
