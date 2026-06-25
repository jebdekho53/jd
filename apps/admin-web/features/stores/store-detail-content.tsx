'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  getStore,
  approveStore,
  rejectStore,
  requestDocuments,
  revokeRejection,
  removeBlacklist,
} from '@/services/admin-api';
import { useSessionQuery } from '@/hooks/use-auth';
import type { AdminStoreDetail, RejectionType, StoreDocumentType } from '@/types/store';
import {
  DOCUMENT_TYPE_OPTIONS,
  REJECTION_TYPE_LABELS,
  REJECTION_TYPE_OPTIONS,
  REVOCABLE_REJECTION_TYPES,
} from '@/types/store';
import { Button } from '@/design-system';
import { VerificationDocumentsPanel } from './components/verification-documents-panel';

const DEFAULT_DOC_TYPES: StoreDocumentType[] = ['GST_CERTIFICATE', 'PAN_CARD', 'FSSAI_LICENSE'];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="text-slate-900">{value ?? '—'}</dd>
    </div>
  );
}

export function StoreDetailContent({ storeId }: { storeId: string }) {
  const qc = useQueryClient();
  const { data: session } = useSessionQuery();
  const { data: store, isLoading } = useQuery({
    queryKey: ['admin', 'stores', storeId],
    queryFn: () => getStore(storeId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'stores'] });
    qc.invalidateQueries({ queryKey: ['admin', 'stores', storeId] });
  };

  const approveMutation = useMutation({
    mutationFn: () => approveStore(storeId),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { reason: string; rejectionType: RejectionType }) =>
      rejectStore(storeId, payload),
    onSuccess: invalidate,
  });

  const requestDocsMutation = useMutation({
    mutationFn: (payload: { reason: string; documentTypes: StoreDocumentType[] }) =>
      requestDocuments(storeId, payload),
    onSuccess: invalidate,
  });

  const revokeMutation = useMutation({
    mutationFn: (reason: string) => revokeRejection(storeId, { reason }),
    onSuccess: invalidate,
  });

  const removeBlacklistMutation = useMutation({
    mutationFn: (reason: string) =>
      removeBlacklist(store!.merchantProfile.id, {
        reason,
        reopenStoreId: storeId,
      }),
    onSuccess: invalidate,
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading store…</p>;
  if (!store) return <p className="text-sm text-red-600">Store not found.</p>;

  const mp = store.merchantProfile;
  const isSuperAdmin = session?.roles.includes('SUPER_ADMIN');
  const canRevoke =
    store.status === 'REJECTED' &&
    store.rejectionType &&
    REVOCABLE_REJECTION_TYPES.includes(store.rejectionType) &&
    !mp.isBlacklisted;

  const showReviewActions =
    store.status === 'PENDING_REVIEW' || store.status === 'UNDER_REVIEW';

  const actionPending =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    requestDocsMutation.isPending ||
    revokeMutation.isPending ||
    removeBlacklistMutation.isPending;

  const handleReject = () => {
    const typeInput = prompt(
      `Rejection type:\n${REJECTION_TYPE_OPTIONS.map((o) => `${o.value} — ${o.label}`).join('\n')}`,
      'DOCUMENT_ISSUE',
    );
    const rejectionType = typeInput?.trim().toUpperCase() as RejectionType;
    if (!rejectionType || !REJECTION_TYPE_OPTIONS.some((o) => o.value === rejectionType)) return;

    const reason = prompt('Rejection reason for merchant:');
    if (!reason?.trim()) return;

    rejectMutation.mutate({ reason: reason.trim(), rejectionType });
  };

  const handleRequestDocuments = () => {
    const reason = prompt(
      `Documents required for "${store.name}".\n\nEnter message for merchant:`,
      store.documentRequestReason ??
        'Please upload GST certificate, PAN card, and FSSAI license to complete verification.',
    );
    if (!reason?.trim()) return;

    requestDocsMutation.mutate({
      reason: reason.trim(),
      documentTypes: (store.requestedDocumentTypes as StoreDocumentType[] | null) ??
        DEFAULT_DOC_TYPES,
    });
  };

  const requestedTypes = (store.requestedDocumentTypes ?? []) as StoreDocumentType[];

  return (
    <div className="space-y-5">
      <Link href="/stores" className="text-sm text-admin-700 hover:underline">
        ← Back to stores
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{store.name}</h1>
            <p className="text-sm text-slate-500">{mp.businessName}</p>
            {store.submittedAt && (
              <p className="mt-1 text-xs text-slate-400">
                Submitted {new Date(store.submittedAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium">
              {store.status}
            </span>
            {mp.isBlacklisted && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                BLACKLISTED
              </span>
            )}
          </div>
        </div>

        {showReviewActions && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <Button onClick={() => approveMutation.mutate()} loading={approveMutation.isPending} disabled={actionPending}>
              Approve store
            </Button>
            <Button variant="outline" onClick={handleReject} disabled={actionPending}>
              Reject
            </Button>
            <Button variant="outline" onClick={handleRequestDocuments} disabled={actionPending}>
              Request documents
            </Button>
          </div>
        )}

        {store.status === 'REJECTED' && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
            <h2 className="font-semibold text-amber-900">Rejection details</h2>
            <dl className="mt-2 space-y-1 text-amber-900">
              <div>
                <dt className="inline font-medium">Type: </dt>
                <dd className="inline">
                  {store.rejectionType ? REJECTION_TYPE_LABELS[store.rejectionType] : '—'}
                </dd>
              </div>
              <div>
                <dt className="inline font-medium">Reason: </dt>
                <dd className="inline">{store.rejectionReason ?? '—'}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Rejected at: </dt>
                <dd className="inline">
                  {store.reviewedAt ? new Date(store.reviewedAt).toLocaleString() : '—'}
                </dd>
              </div>
            </dl>

            {canRevoke && (
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                loading={revokeMutation.isPending}
                onClick={() => {
                  const reason = prompt('Reason for revoking rejection:');
                  if (reason?.trim()) revokeMutation.mutate(reason.trim());
                }}
              >
                Revoke rejection
              </Button>
            )}

            {mp.isBlacklisted && isSuperAdmin && (
              <Button
                className="mt-3 ml-2"
                size="sm"
                variant="outline"
                loading={removeBlacklistMutation.isPending}
                onClick={() => {
                  const reason = prompt('Reason for removing blacklist (SUPER_ADMIN):');
                  if (reason?.trim()) removeBlacklistMutation.mutate(reason.trim());
                }}
              >
                Remove blacklist
              </Button>
            )}
          </div>
        )}

        {mp.isBlacklisted && mp.blacklistReason && (
          <p className="mt-3 text-sm text-red-700">Blacklist reason: {mp.blacklistReason}</p>
        )}
      </div>

      {/* Merchant compliance */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Merchant &amp; compliance</h2>
        <dl className="mt-4 space-y-2">
          <InfoRow label="Business name" value={mp.businessName} />
          <InfoRow label="GSTIN" value={<span className="font-mono">{mp.gstNumber}</span>} />
          <InfoRow label="PAN" value={<span className="font-mono">{mp.panNumber}</span>} />
          <InfoRow label="KYC status" value={mp.kycStatus} />
          <InfoRow label="Account phone" value={mp.user.phone} />
          <InfoRow label="Account email" value={mp.user.email} />
        </dl>
      </section>

      {/* Store details */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Store details</h2>
        <dl className="mt-4 space-y-2">
          <InfoRow label="Description" value={store.description} />
          <InfoRow label="Address" value={`${store.line1}${store.line2 ? `, ${store.line2}` : ''}`} />
          <InfoRow label="Pincode" value={store.pincode} />
          <InfoRow label="Store phone" value={store.phone} />
          <InfoRow label="Store email" value={store.email} />
          <InfoRow
            label="Delivery zones"
            value={store.storeZones?.map((z) => z.zone.name).join(', ') || '—'}
          />
          <InfoRow label="Min order" value={store.minOrderAmount != null ? `₹${store.minOrderAmount}` : '—'} />
          <InfoRow label="Delivery fee" value={store.deliveryFee != null ? `₹${store.deliveryFee}` : '—'} />
        </dl>
      </section>

      {/* Verification documents */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Verification documents</h2>
        {store.documentRequestReason && (
          <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
            <span className="font-medium">Admin note: </span>
            {store.documentRequestReason}
          </p>
        )}
        <div className="mt-4">
          <VerificationDocumentsPanel
            documents={store.verificationDocuments ?? []}
            requestedTypes={requestedTypes}
          />
        </div>
      </section>

      {/* Document request history */}
      {store.documentRequests?.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Document request history</h2>
          <ul className="mt-4 space-y-3">
            {store.documentRequests.map((req) => (
              <li key={req.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-800">{req.reason}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Requested {new Date(req.requestedAt).toLocaleString()}
                  {req.fulfilledAt
                    ? ` · Fulfilled ${new Date(req.fulfilledAt).toLocaleString()}`
                    : ' · Pending'}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Types:{' '}
                  {(req.documentTypes as StoreDocumentType[])
                    .map((t) => DOCUMENT_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t)
                    .join(', ')}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
