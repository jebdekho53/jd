'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveCategoryRequest,
  listCategoryRequests,
  rejectCategoryRequest,
  requestCategoryDocuments,
  revokeCategoryRejection,
} from '@/services/admin-api';
import type { StoreCategoryRequestStatus } from '@/types/category-governance';
import { Button } from '@/design-system';

const TABS: { label: string; value: StoreCategoryRequestStatus }[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Under review', value: 'UNDER_REVIEW' },
  { label: 'Documents required', value: 'DOCUMENTS_REQUIRED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export function CategoryRequestsContent() {
  const [tab, setTab] = useState<StoreCategoryRequestStatus>('PENDING');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'category-requests', tab],
    queryFn: () => listCategoryRequests({ status: tab, limit: 50 }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'category-requests'] });
    qc.invalidateQueries({ queryKey: ['admin', 'dashboard', 'categories'] });
  };

  const approveMutation = useMutation({
    mutationFn: approveCategoryRequest,
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectCategoryRequest(id, { reason }),
    onSuccess: invalidate,
  });

  const requestDocsMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      requestCategoryDocuments(id, { reason, documentTypes: [] }),
    onSuccess: invalidate,
  });

  const revokeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      revokeCategoryRejection(id, { reason }),
    onSuccess: invalidate,
  });

  const requests = data?.data ?? [];
  const pending = approveMutation.isPending || rejectMutation.isPending || requestDocsMutation.isPending;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Review store requests to sell in platform categories. Approval grants per-store catalog permissions.
      </p>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.value ? 'bg-admin-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}

      {!isLoading && requests.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No requests in this queue.
        </p>
      )}

      <ul className="space-y-3">
        {requests.map((item) => {
          const mp = item.store.merchantProfile;
          return (
            <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {item.category.name} → {item.subcategory.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    Store: {item.store.name} · {mp.businessName} · {mp.user.phone}
                  </p>
                  {item.reason && <p className="mt-1 text-sm text-slate-600">{item.reason}</p>}
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{item.status}</span>
              </div>

              {(item.status === 'PENDING' || item.status === 'DOCUMENTS_REQUIRED') && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Button size="sm" disabled={pending} onClick={() => approveMutation.mutate(item.id)}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => {
                      const reason = prompt('Rejection reason:');
                      if (reason?.trim()) rejectMutation.mutate({ id: item.id, reason: reason.trim() });
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => {
                      const reason = prompt('More information required:');
                      if (reason?.trim()) requestDocsMutation.mutate({ id: item.id, reason: reason.trim() });
                    }}
                  >
                    Request more info
                  </Button>
                </div>
              )}

              {item.status === 'REJECTED' && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-sm text-red-700">{item.adminNote}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    disabled={pending}
                    onClick={() => {
                      const reason = prompt('Revoke rejection reason:');
                      if (reason?.trim()) revokeMutation.mutate({ id: item.id, reason: reason.trim() });
                    }}
                  >
                    Revoke rejection
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
