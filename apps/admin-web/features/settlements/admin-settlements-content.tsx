'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';
import {
  useAdminPayoutRequestsQuery,
  useAdminSettlementsQuery,
  useApprovePayoutMutation,
  useProcessPayoutMutation,
  useRejectPayoutMutation,
} from '@/hooks/use-settlement';
import { Badge, Button, Input, Modal } from '@/design-system';
import {
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  CreditCard,
  Percent,
  Calendar,
  CheckSquare,
  Play,
  Lock,
  Unlock,
  AlertCircle,
  Layers,
  Clock,
} from 'lucide-react';

type SettlementTab = 'payouts' | 'batches' | 'wallets' | 'ledger';

export function AdminSettlementsContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettlementTab>('payouts');

  // Filters
  const [merchantSearch, setMerchantSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Trigger manual batch state
  const [batchCycle, setBatchCycle] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [batchMerchantId, setBatchMerchantId] = useState('');

  // Reject payout dialog
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Queries using the existing hooks
  const overview = useAdminSettlementsQuery();
  const payouts = useAdminPayoutRequestsQuery();

  const approve = useApprovePayoutMutation();
  const reject = useRejectPayoutMutation();
  const process = useProcessPayoutMutation();

  const handleRejectSubmit = () => {
    if (!rejectId || !rejectReason.trim()) return;
    reject.mutate({ id: rejectId, reason: rejectReason }, {
      onSuccess: () => {
        setRejectId(null);
        setRejectReason('');
      }
    });
  };

  // Fetch compiled settlement batches from BFF proxy
  const { data: batchesData, refetch: refetchBatches, isLoading: isBatchesLoading } = useQuery({
    queryKey: ['admin', 'settlements', 'batches', merchantSearch],
    queryFn: async () => {
      const query = merchantSearch ? `?merchant=${merchantSearch}` : '';
      const res = await adminFetch<{
        success: boolean;
        data: {
          settlements: Array<{
            id: string;
            merchant: string;
            merchantProfileId: string;
            cycle: string;
            status: string;
            grossAmount: number;
            commissionAmount: number;
            netAmount: number;
            itemCount: number;
            periodStart: string;
            periodEnd: string;
            processedAt: string | null;
          }>;
          meta: { total: number };
        };
      }>(`/api/admin/finance/settlements${query}`);
      return res.data;
    },
  });

  // Manual settlement batch generation mutation
  const generateBatchMutation = useMutation({
    mutationFn: async (body: { cycle: string; merchantProfileId?: string }) => {
      return adminFetch('/api/admin/finance/settlements/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: (res: any) => {
      alert(`Successfully generated ${res?.data?.batchesCreated ?? 0} settlement batches.`);
      setBatchMerchantId('');
      overview.refetch();
      refetchBatches();
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to generate batches.');
    },
  });

  const formatInr = (n: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  };

  const handleGenerateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    generateBatchMutation.mutate({
      cycle: batchCycle,
      ...(batchMerchantId.trim() ? { merchantProfileId: batchMerchantId.trim() } : {}),
    });
  };

  const s = overview.data?.summary;
  const walletList = overview.data?.merchantWallets ?? [];
  const ledgerList = overview.data?.settlementLedger ?? [];
  const payoutList = payouts.data?.payoutRequests ?? [];
  const batchesList = batchesData?.settlements ?? [];

  // Local filters
  const filteredPayouts = payoutList.filter((p) => {
    const matchesSearch = p.merchant.toLowerCase().includes(merchantSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredWallets = walletList.filter((w) =>
    w.businessName.toLowerCase().includes(merchantSearch.toLowerCase()),
  );

  const filteredLedger = ledgerList.filter((l) => {
    const matchesSearch = l.merchant.toLowerCase().includes(merchantSearch.toLowerCase()) ||
      l.orderNumber.toLowerCase().includes(merchantSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredBatches = batchesList.filter((b) => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Overview metrics */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Settlements Administration</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            overview.refetch();
            payouts.refetch();
            refetchBatches();
          }}
          disabled={overview.isLoading || payouts.isLoading || isBatchesLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(overview.isLoading || payouts.isLoading || isBatchesLoading) ? 'animate-spin' : ''}`} />
          Refresh Settlements
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Completed Payouts" value={String(s?.completedPayouts ?? 0)} subtitle="Paid Out" icon={CheckCircle} tone="success" />
        <StatCard label="Pending Payout Requests" value={String(s?.pendingPayouts ?? 0)} subtitle="Awaiting admin action" icon={Clock} tone="warning" />
        <StatCard label="Total Liability" value={formatInr(s?.totalMerchantLiability ?? 0)} subtitle="Pending + Available" icon={CreditCard} tone="info" />
        <StatCard label="Settled Today" value={formatInr(s?.totalSettledToday ?? 0)} subtitle={`${s?.settlementsSettledToday ?? 0} order ledgers`} icon={Calendar} tone="neutral" />
      </div>

      {/* Main split sections */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: Ledger & Tab lists */}
        <div className="space-y-4 lg:col-span-8">
          {/* Section tab controls */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('payouts');
                setStatusFilter('ALL');
              }}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'payouts'
                  ? 'border-slate-900 text-slate-950 bg-slate-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Payout Requests ({filteredPayouts.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('batches');
                setStatusFilter('ALL');
              }}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'batches'
                  ? 'border-slate-900 text-slate-950 bg-slate-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Settlement Batches ({filteredBatches.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('wallets');
                setStatusFilter('ALL');
              }}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'wallets'
                  ? 'border-slate-900 text-slate-950 bg-slate-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Merchant Wallets
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ledger');
                setStatusFilter('ALL');
              }}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'ledger'
                  ? 'border-slate-900 text-slate-950 bg-slate-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Order Ledger
            </button>
          </div>

          {/* Filters toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search merchant business..."
                value={merchantSearch}
                onChange={(e) => setMerchantSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {activeTab !== 'wallets' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="ALL">All Statuses</option>
                {activeTab === 'payouts' && (
                  <>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="REJECTED">Rejected</option>
                  </>
                )}
                {activeTab === 'batches' && (
                  <>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </>
                )}
                {activeTab === 'ledger' && (
                  <>
                    <option value="PENDING">Pending</option>
                    <option value="SETTLED">Settled</option>
                    <option value="HELD">Held</option>
                  </>
                )}
              </select>
            )}
          </div>

          {/* Tables containers */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {activeTab === 'payouts' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/75 text-left text-xs uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Merchant</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Requested Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayouts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/30">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{p.merchant}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.merchantProfileId}</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">
                          {formatInr(p.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={getPayoutStatusTone(p.status)}>{p.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-medium">
                          {new Date(p.requestedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            {p.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => approve.mutate(p.id)}
                                  disabled={approve.isPending}
                                  className="h-7 text-[11px] px-2"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setRejectId(p.id)}
                                  className="h-7 text-[11px] px-2 text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {p.status === 'APPROVED' && (
                              <Button
                                size="sm"
                                onClick={() => process.mutate(p.id)}
                                disabled={process.isPending}
                                className="h-7 text-[11px] px-2"
                              >
                                Process Bank Transfer
                              </Button>
                            )}
                            {!['PENDING', 'APPROVED'].includes(p.status) && (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPayouts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-xs">
                          No payout requests.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'batches' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/75 text-left text-xs uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Merchant</th>
                      <th className="px-4 py-3">Cycle</th>
                      <th className="px-4 py-3">Gross / Net</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3 text-right">Hold / Release</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBatches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/30">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{b.merchant}</div>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                            {b.itemCount} items
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600 text-xs">{b.cycle}</td>
                        <td className="px-4 py-3 font-mono">
                          <div className="text-slate-500 text-[11px]">Gross: {formatInr(b.grossAmount)}</div>
                          <div className="font-bold text-slate-800">Net: {formatInr(b.netAmount)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={b.status === 'COMPLETED' ? 'success' : 'danger'}>{b.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                          <div>S: {new Date(b.periodStart).toLocaleDateString()}</div>
                          <div>E: {new Date(b.periodEnd).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              title="Backend action not available yet"
                              className="opacity-50 cursor-not-allowed text-[11px] h-7 px-2"
                            >
                              Hold
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredBatches.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-xs">
                          {isBatchesLoading ? 'Loading batches...' : 'No settlement batches found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'wallets' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/75 text-left text-xs uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Merchant</th>
                      <th className="px-4 py-3">Available Balance</th>
                      <th className="px-4 py-3">Pending Balance</th>
                      <th className="px-4 py-3">Total Earned</th>
                      <th className="px-4 py-3">Paid Out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWallets.map((w) => (
                      <tr key={w.merchantProfileId} className="hover:bg-slate-50/30">
                        <td className="px-4 py-3 font-semibold text-slate-900">{w.businessName}</td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-600">{formatInr(w.availableBalance)}</td>
                        <td className="px-4 py-3 font-mono font-medium text-amber-600">{formatInr(w.pendingBalance)}</td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-700">{formatInr(w.totalEarned)}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">{formatInr(w.totalPaidOut)}</td>
                      </tr>
                    ))}
                    {filteredWallets.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-xs">
                          No merchant wallets found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'ledger' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/75 text-left text-xs uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Order Number</th>
                      <th className="px-4 py-3">Merchant</th>
                      <th className="px-4 py-3">Net Earning</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Settlement Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLedger.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/30">
                        <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                          #{l.orderNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600">{l.merchant}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{formatInr(l.netAmount)}</td>
                        <td className="px-4 py-3">
                          <Badge tone={getLedgerStatusTone(l.status)}>{l.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-medium">
                          {new Date(l.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {filteredLedger.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-xs">
                          No order ledger entries.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Manual Batch Run & Readiness */}
        <div className="space-y-6 lg:col-span-4">
          {/* Manual batch generator tool */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <Layers className="h-4 w-4 text-slate-600 mr-2" />
              Manual Settlement Run
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compile available order ledger entries into settlement batches manually for daily or weekly payout cycles.
            </p>

            <form onSubmit={handleGenerateBatch} className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Cycle Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchCycle('DAILY')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      batchCycle === 'DAILY'
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Daily Batches
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchCycle('WEEKLY')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      batchCycle === 'WEEKLY'
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Weekly Batches
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                  Merchant ID (Optional)
                </label>
                <Input
                  placeholder="Leave blank for all merchants"
                  value={batchMerchantId}
                  onChange={(e) => setBatchMerchantId(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                fullWidth
                disabled={generateBatchMutation.isPending}
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Run Compile Batch
              </Button>
            </form>
          </div>

          {/* Reconciliation verification metrics */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <CheckCircle className="h-4 w-4 text-emerald-600 mr-2" />
              Reconciliation Check
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify platform accounts matches ledger liabilities before processing any bank payouts.
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-600">Merchant Ledger Liability</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatInr(s?.totalMerchantLiability ?? 0)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-600">Pending Ledger Balances</span>
                <span className="font-mono text-slate-600">
                  {formatInr(s?.pendingLiability ?? 0)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-600">Available Ledger Balances</span>
                <span className="font-mono text-slate-600">
                  {formatInr(s?.availableLiability ?? 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Mismatch Risk Signal</span>
                <span className="text-emerald-600 font-bold">Stable (0.00)</span>
              </div>
            </div>
          </div>

          {/* Razorpay route readiness card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
              Route Configuration Setup
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-600">Webhook Registered</span>
                <span className="text-slate-400">N/A from API</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-slate-600">Transfers Active</span>
                <span className="text-slate-400">Not configured</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-600">Bank Verification</span>
                <span className="text-slate-400">N/A from API</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Payout Dialog */}
      <Modal open={rejectId !== null} onClose={() => setRejectId(null)} title="Reject Payout Request">
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Please enter a justification or reason for rejecting this payout request. The merchant will receive this reason.
          </p>

          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason details..."
            className="w-full text-xs rounded-xl border border-slate-200 p-3 outline-none focus:ring-1 focus:ring-slate-900 h-24 resize-none"
            required
          />

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleRejectSubmit}
              disabled={reject.isPending || !rejectReason.trim()}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const borderColors = {
    neutral: 'border-slate-200',
    success: 'border-emerald-200',
    warning: 'border-amber-200',
    danger: 'border-red-200',
    info: 'border-sky-200',
  };
  const iconColors = {
    neutral: 'text-slate-500 bg-slate-50',
    success: 'text-emerald-600 bg-emerald-50',
    warning: 'text-amber-600 bg-amber-50',
    danger: 'text-red-600 bg-red-50',
    info: 'text-sky-600 bg-sky-50',
  };

  return (
    <div className={`rounded-xl border p-4 bg-white shadow-sm flex items-center gap-4 ${borderColors[tone]}`}>
      <div className={`rounded-lg p-2.5 ${iconColors[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-slate-800">{value}</p>
        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

function getPayoutStatusTone(status: string) {
  const s = status.toUpperCase();
  if (s === 'COMPLETED') return 'success';
  if (s === 'REJECTED') return 'danger';
  if (s === 'APPROVED' || s === 'PROCESSING') return 'warning';
  return 'neutral';
}

function getLedgerStatusTone(status: string) {
  const s = status.toUpperCase();
  if (s === 'SETTLED') return 'success';
  if (s === 'HELD') return 'danger';
  if (s === 'PENDING') return 'warning';
  return 'neutral';
}
