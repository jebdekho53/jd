'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';
import { Badge, Button, Input } from '@/design-system';

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

interface WalletStats {
  totalRechargesPaise?: number;
  totalRechargeCount?: number;
  totalAiSpendPaise?: number;
  totalDebitCount?: number;
  totalRefundsPaise?: number;
  totalRefundCount?: number;
  outstandingBalancePaise?: number;
  merchantsWithBalance?: number;
}

function formatRupee(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

function exportWallets(rows: WalletItem[]) {
  const headers = ['Merchant', 'Contact', 'Balance', 'Recharged', 'Spent', 'Refunded', 'Updated'];
  const body = rows.map((w) => [
    w.businessName,
    w.email ?? w.phone ?? w.merchantProfileId,
    (w.balancePaise / 100).toFixed(2),
    (w.totalRechargedPaise / 100).toFixed(2),
    (w.totalSpentPaise / 100).toFixed(2),
    (w.totalRefundedPaise / 100).toFixed(2),
    new Date(w.updatedAt).toLocaleString('en-IN'),
  ]);
  const csv = [headers, ...body]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `merchant-ai-wallets-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function MerchantAiWalletsContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data: stats } = useQuery({
    queryKey: ['admin', 'merchant-ai-wallets', 'stats'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: WalletStats }>(
        '/api/admin/merchant-ai-wallets/stats',
      );
      return res.data;
    },
  });
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'merchant-ai-wallets', page],
    queryFn: async () => {
      const res = await adminFetch<{
        success: boolean;
        data: { items: WalletItem[]; meta: { total: number; totalPages: number } };
      }>(`/api/admin/merchant-ai-wallets?page=${page}&limit=50`);
      return res.data;
    },
  });

  const rows = data?.items ?? [];
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((w) =>
      [w.businessName, w.email, w.phone, w.merchantProfileId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [rows, search]);

  if (isLoading) return <p className="text-sm text-slate-500">Loading merchant AI wallets…</p>;
  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="font-medium text-red-700">Could not load merchant AI wallets.</p>
        <Button className="mt-3" size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <WalletStat label="Wallets" value={stats?.merchantsWithBalance ?? data?.meta.total ?? 0} />
        <WalletStat label="Outstanding" value={formatRupee(stats?.outstandingBalancePaise ?? 0)} />
        <WalletStat label="Recharged" value={formatRupee(stats?.totalRechargesPaise ?? 0)} />
        <WalletStat label="AI spend" value={formatRupee(stats?.totalAiSpendPaise ?? 0)} />
        <WalletStat label="Refunded" value={formatRupee(stats?.totalRefundsPaise ?? 0)} />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border bg-white p-3">
        <Input
          label="Search wallets"
          placeholder="Merchant, phone, email, or profile ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[280px]"
        />
        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-500">
            Showing {filteredRows.length} of {rows.length}
          </p>
          <Button variant="outline" onClick={() => exportWallets(filteredRows)} disabled={!filteredRows.length}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Merchant</th>
              <th className="p-3">Balance</th>
              <th className="p-3">Recharged</th>
              <th className="p-3">Spent</th>
              <th className="p-3">Refunded</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((w) => (
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
                  {w.balancePaise < 0 ? (
                    <Badge tone="danger" dot>Negative</Badge>
                  ) : w.balancePaise < 10_000 ? (
                    <Badge tone="warning" dot>Low</Badge>
                  ) : (
                    <Badge tone="success" dot>Funded</Badge>
                  )}
                </td>
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
            {!filteredRows.length && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  {rows.length ? 'No wallets match this search.' : 'No merchant AI wallets yet.'}
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

function WalletStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function MerchantAiWalletDetailContent({ merchantId }: { merchantId: string }) {
  const qc = useQueryClient();
  const [adjustPaise, setAdjustPaise] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
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
      qc.invalidateQueries({ queryKey: ['admin', 'merchant-ai-wallets'] });
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading wallet…</p>;
  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="font-medium text-red-700">Could not load this wallet.</p>
        <Button className="mt-3" size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }
  if (!data) return <p className="text-sm text-red-600">Wallet not found.</p>;

  const recharges = data.transactions.filter((t) => t.type === 'RECHARGE');
  const debits = data.transactions.filter((t) => t.type === 'DEBIT');
  const refunds = data.transactions.filter((t) => t.type === 'REFUND' || t.type === 'ADJUSTMENT');
  const amount = Number(adjustPaise);
  const adjustmentInvalid =
    !Number.isFinite(amount) ||
    amount === 0 ||
    adjustReason.trim().length < 8 ||
    adjustMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">{data.businessName ?? 'Merchant wallet'}</h2>
            <p className="text-sm text-slate-500">{data.email ?? data.phone ?? data.merchantProfileId}</p>
          </div>
          <Badge tone={data.balancePaise < 0 ? 'danger' : data.balancePaise < 10_000 ? 'warning' : 'success'} dot>
            {data.balancePaise < 0 ? 'Negative balance' : data.balancePaise < 10_000 ? 'Low balance' : 'Funded'}
          </Badge>
        </div>
      </div>

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
        <p className="mb-3 text-sm text-slate-500">
          Use positive amounts for credits and negative amounts for deductions. A reason of at least 8 characters is required for audit.
        </p>
        <div className="flex flex-wrap gap-3">
          <Input
            type="number"
            step="0.01"
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
            loading={adjustMutation.isPending}
            disabled={adjustmentInvalid}
          >
            Apply
          </Button>
        </div>
        {adjustMutation.isError && (
          <p className="mt-2 text-sm text-red-600">Adjustment failed. Check permissions and try again.</p>
        )}
      </div>

      <TransactionTable title="Recharge history" rows={recharges} signed={false} />
      <TransactionTable title="Debit history" rows={debits} signed />
      <TransactionTable title="Refund & adjustments" rows={refunds} signed={false} />
    </div>
  );
}

function TransactionTable({
  title,
  rows,
  signed,
}: {
  title: string;
  rows: WalletTransaction[];
  signed: boolean;
}) {
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
                <th className="p-3">Balance before</th>
                <th className="p-3">Balance after</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="p-3">{t.type}</td>
                  <td className={signed ? 'p-3 text-red-600' : 'p-3'}>
                    {signed ? '-' : ''}
                    {formatRupee(t.amountPaise)}
                  </td>
                  <td className="p-3">
                    <Badge tone={t.status === 'SUCCESS' || t.status === 'COMPLETED' ? 'success' : 'neutral'}>
                      {t.status}
                    </Badge>
                  </td>
                  <td className="p-3">{formatRupee(t.balanceBeforePaise)}</td>
                  <td className="p-3">{formatRupee(t.balanceAfterPaise)}</td>
                  <td className="p-3 text-xs text-slate-600">{t.reason ?? '—'}</td>
                  <td className="p-3 text-xs text-slate-500">
                    {t.razorpayPaymentId ?? t.razorpayOrderId ?? t.analysisId ?? t.storeId ?? '—'}
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {new Date(t.createdAt).toLocaleString('en-IN')}
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
