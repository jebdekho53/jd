'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listStores,
  approveStore,
  rejectStore,
  requestDocuments,
  revokeRejection,
} from '@/services/admin-api';
import type {
  AdminStoreListItem,
  RejectionType,
  StoreDocumentType,
  StoreStatus,
} from '@/types/store';
import {
  DOCUMENT_TYPE_OPTIONS,
  REJECTION_TYPE_LABELS,
  REJECTION_TYPE_OPTIONS,
  REVOCABLE_REJECTION_TYPES,
} from '@/types/store';
import { Button } from '@/design-system';
import { StoreModerationActions } from './components/store-moderation-actions';

type TabKey = StoreStatus | 'BLACKLISTED';

const STATUS_TABS: { label: string; value: TabKey }[] = [
  { label: 'Pending review', value: 'PENDING_REVIEW' },
  { label: 'Documents required', value: 'DOCUMENTS_REQUIRED' },
  { label: 'Under review', value: 'UNDER_REVIEW' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Blacklisted', value: 'BLACKLISTED' },
];

const DEFAULT_DOC_TYPES: StoreDocumentType[] = ['GST_CERTIFICATE', 'PAN_CARD', 'FSSAI_LICENSE'];

const STATUS_FROM_QUERY: Record<string, TabKey> = {
  PENDING: 'PENDING_REVIEW',
  PENDING_REVIEW: 'PENDING_REVIEW',
  DOCUMENTS_REQUIRED: 'DOCUMENTS_REQUIRED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
  BLACKLISTED: 'BLACKLISTED',
};

export function StoreApprovalsContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status')?.toUpperCase();
  const initialTab = (statusParam && STATUS_FROM_QUERY[statusParam]) || 'PENDING_REVIEW';
  const [tab, setTab] = useState<TabKey>(initialTab);
  const qc = useQueryClient();

  useEffect(() => {
    if (statusParam && STATUS_FROM_QUERY[statusParam]) {
      setTab(STATUS_FROM_QUERY[statusParam]);
    }
  }, [statusParam]);

  const isBlacklistedTab = tab === 'BLACKLISTED';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'stores', tab],
    queryFn: () =>
      isBlacklistedTab
        ? listStores({ blacklisted: true, limit: 50 })
        : listStores({ status: tab as StoreStatus, limit: 50 }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveStore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'stores'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      id,
      reason,
      rejectionType,
    }: {
      id: string;
      reason: string;
      rejectionType: RejectionType;
    }) => rejectStore(id, { reason, rejectionType }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'stores'] }),
  });

  const revokeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      revokeRejection(id, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'stores'] }),
  });

  const requestDocsMutation = useMutation({
    mutationFn: ({
      id,
      reason,
      documentTypes,
    }: {
      id: string;
      reason: string;
      documentTypes: StoreDocumentType[];
    }) => requestDocuments(id, { reason, documentTypes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'stores'] }),
  });

  const handleReject = (id: string) => {
    const rejectionType = prompt(
      'Rejection type:\n' +
        REJECTION_TYPE_OPTIONS.map((o) => `- ${o.value}: ${o.label}`).join('\n') +
        '\n\nEnter rejection type code:',
      'DOCUMENT_ISSUE',
    )?.trim().toUpperCase() as RejectionType | undefined;

    if (!rejectionType || !REJECTION_TYPE_OPTIONS.some((o) => o.value === rejectionType)) return;

    const reason = prompt('Rejection reason for merchant:');
    if (!reason?.trim()) return;

    rejectMutation.mutate({ id, reason: reason.trim(), rejectionType });
  };

  const handleRequestDocuments = (id: string, storeName: string) => {
    const reason = prompt(
      `Documents required for "${storeName}".\n\nEnter message for merchant:`,
      'Please upload GST certificate, PAN card, and FSSAI license to complete verification.',
    );
    if (!reason?.trim()) return;

    requestDocsMutation.mutate({
      id,
      reason: reason.trim(),
      documentTypes: DEFAULT_DOC_TYPES,
    });
  };

  const stores = (data?.data ?? []) as AdminStoreListItem[];
  const actionPending =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    requestDocsMutation.isPending ||
    revokeMutation.isPending;

  const showReviewActions = (itemStatus: StoreStatus) =>
    itemStatus === 'PENDING_REVIEW' || itemStatus === 'UNDER_REVIEW';

  const canRevoke = (item: AdminStoreListItem) =>
    item.status === 'REJECTED' &&
    item.rejectionType &&
    REVOCABLE_REJECTION_TYPES.includes(item.rejectionType) &&
    !item.merchantProfile.isBlacklisted;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Review merchant stores. Use revocable rejections for fixable issues, or permanent blacklist
        types for fraud and policy violations.
      </p>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t.value
                ? 'bg-admin-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading stores…</p>}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load stores.{' '}
          <button type="button" className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && stores.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No stores in this view.
        </p>
      )}

      <ul className="space-y-3">
        {stores.map((item) => {
          const mp = item.merchantProfile;
          return (
            <li
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/stores/${item.id}`}
                    className="text-base font-semibold text-slate-900 hover:text-admin-700"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {mp?.businessName ?? '—'} · PIN {item.pincode}
                  </p>
                  {mp?.isBlacklisted && (
                    <span className="mt-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                      BLACKLISTED
                    </span>
                  )}
                  {item.rejectionType && (
                    <p className="mt-1 text-xs text-slate-600">
                      Rejection: {REJECTION_TYPE_LABELS[item.rejectionType]}
                    </p>
                  )}
                  {item.rejectionReason && (
                    <p className="mt-1 text-xs text-amber-700">{item.rejectionReason}</p>
                  )}
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {item.status}
                </span>
              </div>

              {showReviewActions(item.status) && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Button size="sm" onClick={() => approveMutation.mutate(item.id)} disabled={actionPending}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(item.id)} disabled={actionPending}>
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequestDocuments(item.id, item.name)}
                    disabled={actionPending}
                  >
                    Request documents
                  </Button>
                </div>
              )}

              {canRevoke(item) && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const reason = prompt('Reason for revoking rejection:');
                      if (reason?.trim()) revokeMutation.mutate({ id: item.id, reason: reason.trim() });
                    }}
                    disabled={actionPending}
                  >
                    Revoke rejection
                  </Button>
                </div>
              )}

              {item.status === 'DOCUMENTS_REQUIRED' && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequestDocuments(item.id, item.name)}
                    disabled={actionPending}
                  >
                    Request more documents
                  </Button>
                </div>
              )}

              {(item.status === 'APPROVED' || item.status === 'SUSPENDED' || item.status === 'REJECTED' || item.status === 'DRAFT') && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <StoreModerationActions
                    storeId={item.id}
                    storeName={item.name}
                    status={item.status}
                    onSuccess={() => qc.invalidateQueries({ queryKey: ['admin', 'stores'] })}
                    disabled={actionPending}
                    size="sm"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
