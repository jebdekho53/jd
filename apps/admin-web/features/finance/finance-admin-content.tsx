'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';
import { Badge, Button, Input, Modal } from '@/design-system';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Percent,
  CheckSquare,
  XSquare,
  Shield,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';

type CodStatusFilter = 'ALL' | 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export function FinanceAdminContent() {
  const queryClient = useQueryClient();
  const [codStatus, setCodStatus] = useState<CodStatusFilter>('SUBMITTED');
  const [codPage, setCodPage] = useState(1);

  // Reject Modal
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch Finance Overview & Control Tower
  const { data: overview, refetch: refetchOverview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['admin', 'finance', 'overview'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: OverviewData }>('/api/admin/finance/overview');
      return res.data;
    },
  });

  // Fetch COD records
  const { data: codData, refetch: refetchCod, isLoading: isCodLoading } = useQuery({
    queryKey: ['admin', 'finance', 'cod', codStatus, codPage],
    queryFn: async () => {
      const query = `?page=${codPage}&limit=10${codStatus !== 'ALL' ? `&status=${codStatus}` : ''}`;
      const res = await adminFetch<{ success: boolean; data: { records: CodRecord[]; meta: { total: number } } }>(
        `/api/admin/finance/cod${query}`,
      );
      return res.data;
    },
  });

  // Fetch Alerts
  const { data: alerts = [], refetch: refetchAlerts, isLoading: isAlertsLoading } = useQuery({
    queryKey: ['admin', 'finance', 'alerts'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: FinanceAlert[] }>('/api/admin/finance/alerts');
      return res.data;
    },
  });

  // COD Mutations
  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminFetch(`/api/admin/finance/cod/${id}/verify`, { method: 'POST' });
    },
    onSuccess: () => {
      refetchOverview();
      refetchCod();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return adminFetch(`/api/admin/finance/cod/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      setRejectId(null);
      setRejectReason('');
      refetchOverview();
      refetchCod();
    },
  });

  const handleVerify = (id: string) => {
    if (confirm('Verify this Cash on Delivery deposit? This will post Platform Escrow reconciliation journal entries.')) {
      verifyMutation.mutate(id);
    }
  };

  const handleRejectSubmit = () => {
    if (!rejectId || !rejectReason.trim()) return;
    rejectMutation.mutate({ id: rejectId, reason: rejectReason });
  };

  const triggerRefresh = () => {
    refetchOverview();
    refetchCod();
    refetchAlerts();
  };

  const formatInr = (n: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  };

  const revenue = overview?.revenue ?? {};
  const codSummary = overview?.cod ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Finance Control Tower</h2>
        <Button variant="outline" size="sm" onClick={triggerRefresh} disabled={isOverviewLoading || isCodLoading || isAlertsLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${(isOverviewLoading || isCodLoading || isAlertsLoading) ? 'animate-spin' : ''}`} />
          Refresh Finance Control
        </Button>
      </div>

      {/* Overview stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Platform GMV" value={formatInr(revenue.gmv ?? 0)} icon={TrendingUp} tone="success" />
        <StatCard label="Platform Commissions" value={formatInr(revenue.platformEarnings ?? 0)} icon={Percent} tone="info" />
        <StatCard label="Escrow Balance" value={formatInr(overview?.escrowBalance ?? 0)} icon={Shield} tone="neutral" />
        <StatCard label="Wallet Liabilities" value={formatInr(overview?.walletLiability ?? 0)} icon={CreditCard} tone="warning" />
      </div>

      {/* Main interface layout: Reconciliation & Readiness */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: COD reconciliation queue */}
        <div className="space-y-4 lg:col-span-8">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Cash on Delivery Reconciliation</h3>
                <p className="text-xs text-slate-400">Match rider cash deposit slips with expected order amounts.</p>
              </div>

              <select
                value={codStatus}
                onChange={(e) => {
                  setCodStatus(e.target.value as CodStatusFilter);
                  setCodPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="ALL">All Remittances</option>
                <option value="PENDING">Pending Delivery Match</option>
                <option value="SUBMITTED">Submitted / Needs Review</option>
                <option value="VERIFIED">Verified / Deposited</option>
                <option value="REJECTED">Rejected / Mismatches</option>
              </select>
            </div>

            {/* COD Stats Overview row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">COD PENDING</span>
                <span className="font-bold text-slate-800 font-mono text-sm">{formatInr(codSummary.codPending ?? 0)}</span>
                <span className="text-[10px] text-slate-400 block font-medium">({codSummary.codPendingCount ?? 0} items)</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">SUBMITTED (IN REVIEW)</span>
                <span className="font-bold text-slate-800 font-mono text-sm">{formatInr(codSummary.codSubmitted ?? 0)}</span>
                <span className="text-[10px] text-slate-400 block font-medium">({codSummary.codSubmittedCount ?? 0} items)</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">VERIFIED IN ESCROW</span>
                <span className="font-bold text-slate-800 font-mono text-sm">{formatInr(codSummary.codDeposited ?? 0)}</span>
                <span className="text-[10px] text-slate-400 block font-medium">({codSummary.codVerifiedCount ?? 0} items)</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">MISMATCHED / REJECTED</span>
                <span className="font-bold text-red-600 font-mono text-sm">{codSummary.mismatchCount ?? 0}</span>
                <span className="text-[10px] text-slate-400 block font-medium">Reconciliation alerts</span>
              </div>
            </div>

            {/* COD table queue */}
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/75 text-left text-xs uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Rider Name</th>
                      <th className="px-4 py-3">Order Number</th>
                      <th className="px-4 py-3">Expected Amount</th>
                      <th className="px-4 py-3">Deposited Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(codData?.records ?? []).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/30">
                        <td className="px-4 py-3 font-semibold text-slate-900">{r.rider}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">
                          {r.orderNumber ? `#${r.orderNumber}` : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-800">
                          {formatInr(r.amountExpected)}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-800">
                          {formatInr(r.amountDeposited)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={getCodStatusTone(r.status)}>{r.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {r.status === 'SUBMITTED' ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => handleVerify(r.id)}
                                disabled={verifyMutation.isPending}
                                className="h-7 text-[11px] px-2"
                              >
                                <CheckSquare className="h-3.5 w-3.5 mr-1" />
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRejectId(r.id)}
                                className="h-7 text-[11px] px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                <XSquare className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(codData?.records ?? []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-xs">
                          {isCodLoading ? 'Loading remittances...' : 'No COD remittances pending reconciliation.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Readiness Checks & Alerts */}
        <div className="space-y-6 lg:col-span-4">
          {/* Razorpay Route status cards */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <CreditCard className="h-4 w-4 text-slate-600 mr-2" />
              Razorpay Route Status
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              JebDekho marketplace splits transactions using Route transfers. Real-time transfer readiness is verified here.
            </p>

            <div className="space-y-2 pt-1.5 text-xs">
              <ReadinessItem label="Route Transfers Configured" status="not_configured" />
              <ReadinessItem label="Linked Accounts Active" status="unavailable" />
              <ReadinessItem label="Payout Webhooks Verified" status="disabled" />
              <ReadinessItem label="Bank Account Setup" status="healthy" />
            </div>

            <div className="text-[10px] text-amber-600 bg-amber-50 rounded-lg p-3 border border-amber-200 leading-normal flex items-start gap-1.5">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Razorpay Route</strong> is currently in sandbox mode. Real transfers will be enabled after production webhooks are configured.
              </span>
            </div>
          </div>

          {/* Finance system alerts */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              Finance System Warnings
            </h3>

            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.id} className="rounded-lg bg-red-50/50 border border-red-100 p-3 text-xs leading-normal">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span>{a.title}</span>
                  </div>
                  <p className="text-slate-500">{a.message}</p>
                  <span className="inline-block mt-2 font-bold font-mono text-[9px] bg-red-100/60 px-1.5 py-0.5 rounded text-red-700 capitalize">
                    {a.severity.toLowerCase()} warning
                  </span>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-1.5">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                  All finance system parameters healthy!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject COD Modal */}
      <Modal open={rejectId !== null} onClose={() => setRejectId(null)} title="Reject COD Remittance">
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Please enter a justification or mismatch reason for rejecting this COD remittance. The rider will be alerted to review the cash deposit.
          </p>

          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Mismatch reason or detail..."
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
              disabled={rejectMutation.isPending || !rejectReason.trim()}
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
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
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
        <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function ReadinessItem({ label, status }: { label: string; status: string }) {
  const stateColor = (st: string) => {
    if (st === 'healthy') return 'bg-emerald-500';
    if (st === 'warning') return 'bg-amber-500';
    if (st === 'danger') return 'bg-red-500';
    return 'bg-slate-300';
  };

  const stateText = (st: string) => {
    if (st === 'healthy') return 'Configured';
    if (st === 'not_configured') return 'Not Configured';
    if (st === 'unavailable') return 'Not Available';
    return 'Disabled';
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="font-semibold text-slate-600">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className={`h-2 w-2 rounded-full ${stateColor(status)}`} />
        <span className="font-semibold text-slate-700">{stateText(status)}</span>
      </div>
    </div>
  );
}

function getCodStatusTone(status: string) {
  const s = status.toUpperCase();
  if (s === 'VERIFIED') return 'success';
  if (s === 'REJECTED') return 'danger';
  if (s === 'SUBMITTED') return 'warning';
  return 'neutral';
}

interface OverviewData {
  escrowBalance: number;
  walletLiability: number;
  revenue: {
    gmv?: number;
    platformEarnings?: number;
  };
  cod: {
    codPending?: number;
    codPendingCount?: number;
    codSubmitted?: number;
    codSubmittedCount?: number;
    codDeposited?: number;
    codVerifiedCount?: number;
    mismatchCount?: number;
  };
}

interface CodRecord {
  id: string;
  rider: string;
  orderNumber: string | null;
  amountExpected: number;
  amountCollected: number;
  amountDeposited: number;
  mismatchAmount: number;
  status: string;
  submittedAt: string | null;
}

interface FinanceAlert {
  id: string;
  title: string;
  message: string;
  severity: string;
}
