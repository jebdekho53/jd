'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';
import { Button, Input } from '@/design-system';

interface WalletItem {
  merchantProfileId: string;
  businessName: string;
  email: string | null;
  phone: string | null;
  balancePaise: number;
  totalRechargedPaise: number;
  totalSpentPaise: number;
  totalRefundedPaise: number;
  updatedAt: string;
}

interface WalletTransaction {
  id: string;
  type: string;
  status: string;
  amountPaise: number;
  balanceBeforePaise: number;
  balanceAfterPaise: number;
  reason: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  storeId: string | null;
  analysisId: string | null;
  createdAt: string;
}

interface WalletDetail {
  merchantProfileId: string;
  businessName: string | null;
  email: string | null;
  phone: string | null;
  balancePaise: number;
  totalRechargedPaise: number;
  totalSpentPaise: number;
  totalRefundedPaise: number;
  transactions: WalletTransaction[];
}

function formatRupee(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function MerchantAiWalletsContent() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'merchant-ai-wallets', page],
    queryFn: async () => {
      const res = await adminFetch<{
        success: boolean;
        data: { items: WalletItem[]; meta: { total: number; totalPages: number } };
      }>(`/api/admin/merchant-ai-wallets?page=${page}&limit=50`);
      return res.data;
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading merchant AI wallets…</p>;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Merchant</th>
              <th className="p-3">Balance</th>
              <th className="p-3">Recharged</th>
              <th className="p-3">Spent</th>
              <th className="p-3">Refunded</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((w) => (
              <tr key={w.merchantProfileId} className="border-b">
                <td className="p-3">
                  <p className="font-medium">{w.businessName}</p>
                  <p className="text-xs text-slate-500">{w.email ?? w.phone ?? w.merchantProfileId}</p>
                </td>
                <td className="p-3 font-semibold">{formatRupee(w.balancePaise)}</td>
                <td className="p-3">{formatRupee(w.totalRechargedPaise)}</td>
                <td className="p-3">{formatRupee(w.totalSpentPaise)}</td>
                <td className="p-3">{formatRupee(w.totalRefundedPaise)}</td>
                <td className="p-3">
                  <Link
                    href={`/merchant-ai-wallets/${w.merchantProfileId}`}
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {!data?.items.length && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No merchant AI wallets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data && data.meta.totalPages > 1 && (
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export function MerchantAiWalletDetailContent({ merchantId }: { merchantId: string }) {
  const qc = useQueryClient();
  const [adjustPaise, setAdjustPaise] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'merchant-ai-wallet', merchantId],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: WalletDetail }>(
        `/api/admin/merchant-ai-wallets/${merchantId}`,
      );
      return res.data;
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      const amountPaise = Math.round(Number(adjustPaise) * 100);
      await adminFetch(`/api/admin/merchant-ai-wallets/${merchantId}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ amountPaise, reason: adjustReason }),
      });
    },
    onSuccess: () => {
      setAdjustPaise('');
      setAdjustReason('');
      qc.invalidateQueries({ queryKey: ['admin', 'merchant-ai-wallet', merchantId] });
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading wallet…</p>;
  if (!data) return <p className="text-sm text-red-600">Wallet not found.</p>;

  const recharges = data.transactions.filter((t) => t.type === 'RECHARGE');
  const debits = data.transactions.filter((t) => t.type === 'DEBIT');
  const refunds = data.transactions.filter((t) => t.type === 'REFUND' || t.type === 'ADJUSTMENT');

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Balance', formatRupee(data.balancePaise)],
          ['Total recharged', formatRupee(data.totalRechargedPaise)],
          ['Total AI spend', formatRupee(data.totalSpentPaise)],
          ['Total refunded', formatRupee(data.totalRefundedPaise)],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 font-semibold">Manual adjustment</h3>
        <div className="flex flex-wrap gap-3">
          <Input
            type="number"
            placeholder="Amount (₹, use negative to deduct)"
            value={adjustPaise}
            onChange={(e) => setAdjustPaise(e.target.value)}
            className="max-w-xs"
          />
          <Input
            placeholder="Reason"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            className="min-w-[200px] flex-1"
          />
          <Button
            onClick={() => adjustMutation.mutate()}
            disabled={!adjustPaise || !adjustReason || adjustMutation.isPending}
          >
            Apply
          </Button>
        </div>
      </div>

      <TransactionTable title="Recharge history" rows={recharges} />
      <TransactionTable title="Debit history" rows={debits} />
      <TransactionTable title="Refund & adjustments" rows={refunds} />
    </div>
  );
}

function TransactionTable({ title, rows }: { title: string; rows: WalletTransaction[] }) {
  return (
    <div className="rounded-xl border bg-white">
      <h3 className="border-b p-3 font-semibold">{title}</h3>
      {!rows.length ? (
        <p className="p-4 text-sm text-slate-500">None</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Balance after</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="p-3">{t.type}</td>
                  <td className="p-3">₹{(t.amountPaise / 100).toFixed(2)}</td>
                  <td className="p-3">{t.status}</td>
                  <td className="p-3">₹{(t.balanceAfterPaise / 100).toFixed(2)}</td>
                  <td className="p-3 text-xs text-slate-600">{t.reason ?? '—'}</td>
                  <td className="p-3 text-xs text-slate-500">
                    {new Date(t.createdAt).toLocaleString()}
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
