'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';
import { Badge, Button, Input, Modal } from '@/design-system';
import {
  Search,
  RefreshCw,
  Star,
  Shield,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  Trash2,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';

type SectionTab = 'snapshots' | 'approvals';

export function MerchantSuccessAdminContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SectionTab>('snapshots');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [healthFilter, setHealthFilter] = useState('ALL');

  // Control Actions Modals
  const [actionStore, setActionStore] = useState<{ id: string; name: string } | null>(null);
  const [actionType, setActionType] = useState<'reject' | 'suspend' | 'delete' | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Fetch Merchant Success Snapshot Overview
  const { data: snapshotData, isLoading: isSnapshotLoading, refetch: refetchSnapshots } = useQuery({
    queryKey: ['admin', 'merchant-success', 'overview'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: SuccessData }>(
        '/api/admin/merchant-success/overview',
      );
      return res.data;
    },
  });

  // Fetch Store Approvals
  const { data: storeApprovals, isLoading: isApprovalsLoading, refetch: refetchApprovals } = useQuery({
    queryKey: ['admin', 'stores', 'list', statusFilter],
    queryFn: async () => {
      const path = statusFilter === 'ALL'
        ? '/api/admin/stores?status=PENDING_REVIEW'
        : `/api/admin/stores?status=${statusFilter}`;
      const res = await adminFetch<{ success: boolean; data: StoreApprovalItem[] }>(path);
      return res.data;
    },
  });

  // Store action mutations
  const approveMutation = useMutation({
    mutationFn: async (storeId: string) => {
      return adminFetch(`/api/admin/stores/${storeId}/approve`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stores'] });
      refetchSnapshots();
    },
  });

  const reinstateMutation = useMutation({
    mutationFn: async (storeId: string) => {
      return adminFetch(`/api/admin/stores/${storeId}/reinstate`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stores'] });
      refetchSnapshots();
    },
  });

  const customActionMutation = useMutation({
    mutationFn: async ({ storeId, type, reason }: { storeId: string; type: string; reason: string }) => {
      let body: Record<string, unknown> = { reason };
      if (type === 'reject') {
        body = { reason, rejectionType: 'REVOCABLE' };
      }
      return adminFetch(`/api/admin/stores/${storeId}/${type}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      setActionStore(null);
      setActionType(null);
      setActionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'stores'] });
      refetchSnapshots();
    },
  });

  const s = snapshotData?.summary ?? {};

  // Client-side filtering of snapshots
  const filteredSnapshots = (() => {
    let rows: MerchantRow[] = [];
    if (!snapshotData) return rows;

    if (healthFilter === 'ALL') {
      // combine all lists without duplicates
      const seen = new Set<string>();
      const lists = [
        snapshotData.topPerformers,
        snapshotData.expansionReady,
        snapshotData.atRisk,
        snapshotData.fraudProne,
      ];
      for (const list of lists) {
        for (const row of list) {
          if (!seen.has(row.storeId)) {
            seen.add(row.storeId);
            rows.push(row);
          }
        }
      }
    } else if (healthFilter === 'TOP') {
      rows = snapshotData.topPerformers;
    } else if (healthFilter === 'AT_RISK') {
      rows = snapshotData.atRisk;
    } else if (healthFilter === 'EXPANSION') {
      rows = snapshotData.expansionReady;
    } else if (healthFilter === 'FRAUD') {
      rows = snapshotData.fraudProne;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.storeName.toLowerCase().includes(q) ||
          r.merchantName.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q),
      );
    }

    return rows;
  })();

  const handleApprove = (id: string) => {
    if (confirm('Are you sure you want to approve this store? It will go live immediately.')) {
      approveMutation.mutate(id);
    }
  };

  const handleReinstate = (id: string) => {
    if (confirm('Are you sure you want to reinstate this store?')) {
      reinstateMutation.mutate(id);
    }
  };

  const openActionModal = (storeId: string, name: string, type: 'reject' | 'suspend' | 'delete') => {
    setActionStore({ id: storeId, name });
    setActionType(type);
  };

  const submitCustomAction = () => {
    if (!actionStore || !actionType || !actionReason.trim()) return;
    customActionMutation.mutate({
      storeId: actionStore.id,
      type: actionType,
      reason: actionReason,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Merchant Growth OS</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            refetchSnapshots();
            refetchApprovals();
          }}
          disabled={isSnapshotLoading || isApprovalsLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(isSnapshotLoading || isApprovalsLoading) ? 'animate-spin' : ''}`} />
          Refresh Snapshots
        </Button>
      </div>

      {/* Summary metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tracked Stores" value={s.storesTracked ?? 0} subtitle="Across growth tiers" icon={Shield} tone="info" />
        <StatCard label="Avg Health Score" value={`${s.avgHealthScore ?? 0}/100`} subtitle="Platform standard" icon={Star} tone="neutral" />
        <StatCard label="At Risk Merchants" value={s.atRiskCount ?? 0} subtitle="Health under 50" icon={TrendingDown} tone="danger" />
        <StatCard label="Top Performers" value={s.topPerformerCount ?? 0} subtitle="Health 80 or above" icon={TrendingUp} tone="success" />
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('snapshots')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'snapshots'
              ? 'border-slate-900 text-slate-950 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Merchant Health Snapshots
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'approvals'
              ? 'border-slate-900 text-slate-950 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Store Verification & Controls
        </button>
      </div>

      {activeTab === 'snapshots' && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Snapshots lists with filters */}
          <div className="space-y-4 lg:col-span-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search store name, merchant, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="ALL">All Health Tiers</option>
                <option value="TOP">Top Performers (Score &gt;= 80)</option>
                <option value="EXPANSION">Expansion Ready (Score &gt;= 70)</option>
                <option value="AT_RISK">At Risk (Score &lt; 50)</option>
                <option value="FRAUD">Fraud Prone / High Risk</option>
              </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/75 text-left text-xs uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Store Name</th>
                      <th className="px-4 py-3">Merchant / Business</th>
                      <th className="px-4 py-3">Health Score</th>
                      <th className="px-4 py-3">Visibility</th>
                      <th className="px-4 py-3">Est. Rating</th>
                      <th className="px-4 py-3">Nudge Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSnapshots.map((r) => {
                      const estimatedRating = (r.healthScore / 20).toFixed(1);
                      return (
                        <tr key={r.storeId + r.phone} className="hover:bg-slate-50/40">
                          <td className="px-4 py-3 font-semibold text-slate-900">{r.storeName}</td>
                          <td className="px-4 py-3 text-slate-600">
                            <div>{r.merchantName}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.phone}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono text-slate-800">{r.healthScore}</span>
                              <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    r.healthScore >= 80
                                      ? 'bg-emerald-500'
                                      : r.healthScore >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${r.healthScore}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono font-medium text-slate-700">
                            {r.visibilityScore}%
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                              {estimatedRating}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                title="Backend action not available yet"
                                className="opacity-50 cursor-not-allowed text-[11px] h-7 px-2"
                              >
                                Send Nudge
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                title="Backend action not available yet"
                                className="opacity-50 cursor-not-allowed text-[11px] h-7 px-2"
                              >
                                Review Note
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredSnapshots.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                          {isSnapshotLoading ? 'Loading snapshots...' : 'No snapshot records found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Side: Growth Nudges Alert Box */}
          <div className="space-y-6 lg:col-span-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                Active Growth Alerts
              </h3>
              <p className="text-xs text-slate-400">
                Snapshots generate system warnings when merchant catalog quality, inventory, or cancellation rates decline.
              </p>

              <div className="space-y-3 pt-2">
                {(snapshotData?.alertsByType ?? []).map((alert) => (
                  <div key={alert.type} className="rounded-lg bg-slate-50 border p-3 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 capitalize">
                        {alert.type.toLowerCase().replace(/_/g, ' ')}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">Needs Attention</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 bg-slate-200 px-2.5 py-0.5 rounded-full">
                      {alert.count}
                    </span>
                  </div>
                ))}
                {(snapshotData?.alertsByType ?? []).length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-1.5">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                    All store health snap parameters stable!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="ALL">Pending Review</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Live / Approved</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DOCUMENTS_REQUIRED">Docs Required</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-left text-xs uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Store Details</th>
                    <th className="px-4 py-3">Business / GST</th>
                    <th className="px-4 py-3">Pincode</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(storeApprovals ?? []).map((store) => (
                    <tr key={store.id} className="hover:bg-slate-50/40">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div>{store.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{store.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="font-medium">{store.merchantProfile?.businessName ?? '—'}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          GST: {store.merchantProfile?.gstNumber ?? 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-700">
                        {store.pincode}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={getStoreStatusTone(store.status)}>{store.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-medium">
                        {store.submittedAt ? new Date(store.submittedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {['PENDING_REVIEW', 'UNDER_REVIEW', 'DOCUMENTS_REQUIRED'].includes(store.status) && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(store.id)}
                                disabled={approveMutation.isPending}
                                className="h-7 text-[11px]"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => openActionModal(store.id, store.name, 'reject')}
                                className="h-7 text-[11px]"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {store.status === 'APPROVED' && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => openActionModal(store.id, store.name, 'suspend')}
                              className="h-7 text-[11px]"
                            >
                              <Lock className="h-3.5 w-3.5 mr-1" />
                              Suspend
                            </Button>
                          )}
                          {store.status === 'SUSPENDED' && (
                            <Button
                              size="sm"
                              onClick={() => handleReinstate(store.id)}
                              disabled={reinstateMutation.isPending}
                              className="h-7 text-[11px]"
                            >
                              <Unlock className="h-3.5 w-3.5 mr-1" />
                              Reinstate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openActionModal(store.id, store.name, 'delete')}
                            className="h-7 text-[11px]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(storeApprovals ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        {isApprovalsLoading ? 'Loading stores...' : 'No stores matching this verification filter.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Control Actions Modals (Reject/Suspend/Delete) */}
      <Modal
        open={actionStore !== null && actionType !== null}
        onClose={() => {
          setActionStore(null);
          setActionType(null);
          setActionReason('');
        }}
        title={`${actionType === 'reject' ? 'Reject' : actionType === 'suspend' ? 'Suspend' : 'Delete'} Store — ${actionStore?.name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Please enter a justification or reason for this change. The merchant will receive this reason in their status notifications.
          </p>

          <textarea
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            placeholder="Reason details..."
            className="w-full text-xs rounded-xl border border-slate-200 p-3 outline-none focus:ring-1 focus:ring-slate-900 h-24 resize-none"
            required
          />

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActionStore(null);
                setActionType(null);
                setActionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={actionType === 'delete' ? 'danger' : 'primary'}
              onClick={submitCustomAction}
              disabled={customActionMutation.isPending || !actionReason.trim()}
            >
              Confirm Action
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
  value: string | number;
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

function getStoreStatusTone(status: string) {
  const s = status.toUpperCase();
  if (s === 'APPROVED' || s === 'LIVE') return 'success';
  if (s === 'SUSPENDED' || s === 'REJECTED') return 'danger';
  if (s === 'PENDING_REVIEW' || s === 'UNDER_REVIEW') return 'warning';
  return 'neutral';
}

interface MerchantRow {
  storeId: string;
  storeName: string;
  merchantName: string;
  phone: string;
  healthScore: number;
  visibilityScore: number;
}

interface SuccessData {
  summary: {
    storesTracked?: number;
    avgHealthScore?: number;
    atRiskCount?: number;
    topPerformerCount?: number;
    expansionReadyCount?: number;
    fraudProneCount?: number;
  };
  atRisk: MerchantRow[];
  topPerformers: MerchantRow[];
  expansionReady: MerchantRow[];
  fraudProne: MerchantRow[];
  alertsByType: Array<{ type: string; count: number }>;
}

interface StoreApprovalItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  pincode: string;
  merchantProfile?: {
    businessName: string;
    gstNumber: string | null;
    isBlacklisted: boolean;
    user?: {
      phone: string;
      email: string | null;
    } | null;
  } | null;
}
