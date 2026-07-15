'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, ExternalLink, FileWarning, RefreshCw, XCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import {
  approveAdminRiderDocument,
  listAdminRiderDocuments,
  rejectAdminRiderDocument,
  type AdminRiderDocumentStatus,
} from './rider-admin-api';

const filters: Array<{ label: string; value: '' | AdminRiderDocumentStatus }> = [
  { label: 'All', value: '' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

function pretty(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RiderKycReviewContent() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'' | AdminRiderDocumentStatus>('SUBMITTED');
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const query = useQuery({
    queryKey: ['admin', 'rider-kyc-documents', filter],
    queryFn: () => listAdminRiderDocuments(filter || undefined),
  });

  const approve = useMutation({
    mutationFn: approveAdminRiderDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'rider-kyc-documents'] }),
  });
  const reject = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      rejectAdminRiderDocument(id, rejectionReason),
    onSuccess: () => {
      setRejecting(null);
      setReason('');
      qc.invalidateQueries({ queryKey: ['admin', 'rider-kyc-documents'] });
    },
  });

  const rows = query.data ?? [];

  return (
    <DashboardShell title="Rider KYC Review">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                filter === item.value ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Link href="/riders/incentives" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            Incentives
          </Link>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {query.isLoading && <p className="text-sm text-muted-foreground">Loading documents...</p>}
      {query.isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {(query.error as Error).message}
        </div>
      )}

      {!query.isLoading && rows.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          <FileWarning className="mx-auto mb-2 h-8 w-8" />
          No rider documents match this filter.
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Rider</th>
                <th className="px-3 py-2">Document</th>
                <th className="px-3 py-2">KYC</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((doc) => (
                <tr key={doc.id} className="border-b border-border/70">
                  <td className="px-3 py-3">
                    <div className="font-medium">{doc.riderProfile.name}</div>
                    <div className="text-xs text-muted-foreground">{doc.riderProfile.user.phone}</div>
                    <div className="text-xs text-muted-foreground">
                      {pretty(doc.riderProfile.vehicleType)} {doc.riderProfile.vehicleNumber ?? ''}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{pretty(doc.documentType)}</div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Open file <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-3 py-3">{pretty(doc.riderProfile.kycStatus)}</td>
                  <td className="px-3 py-3">{pretty(doc.status)}</td>
                  <td className="px-3 py-3 text-xs">{new Date(doc.updatedAt).toLocaleString('en-IN')}</td>
                  <td className="max-w-xs px-3 py-3 text-xs text-muted-foreground">{doc.rejectionReason ?? '-'}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => approve.mutate(doc.id)}
                        disabled={approve.isPending || doc.status === 'APPROVED'}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejecting(doc.id)}
                        disabled={reject.isPending || doc.status === 'REJECTED'}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                    {rejecting === doc.id && (
                      <div className="mt-2 rounded-lg border bg-background p-2">
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Reason shown to rider"
                          className="min-h-20 w-full rounded-md border px-2 py-1 text-xs"
                        />
                        <div className="mt-2 flex justify-end gap-2">
                          <button type="button" onClick={() => setRejecting(null)} className="text-xs text-muted-foreground">
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => reject.mutate({ id: doc.id, rejectionReason: reason })}
                            disabled={reason.trim().length < 3 || reject.isPending}
                            className="rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Confirm reject
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
