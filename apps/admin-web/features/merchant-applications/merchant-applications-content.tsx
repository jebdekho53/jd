'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Badge, Spinner, Modal } from '@/design-system';
import { listMerchantApplications, approveMerchantApplication, rejectMerchantApplication, getMerchantApplication } from '@/services/admin-api';
import { OnboardingFunnel } from './onboarding-funnel';

const TABS = ['SUBMITTED', 'UNDER_REVIEW', 'KYC_PENDING', 'APPROVED', 'REJECTED'] as const;

type MerchantAppRow = {
  id: string;
  status: string;
  businessName?: string;
  storeName?: string;
  ownerName?: string;
  riskScore?: number;
  submittedAt?: string;
};

const DOC_TYPE_LABELS: Record<string, string> = {
  GST_CERTIFICATE: 'GST Certificate',
  PAN_CARD: 'PAN Card',
  SHOP_LICENSE: 'Shop License',
  FSSAI_LICENSE: 'FSSAI License',
  CANCELLED_CHEQUE: 'Cancelled Cheque',
  OWNER_PHOTO: 'Owner Photo',
  STORE_PHOTO: 'Store Photo',
};

function MerchantApplicationDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'merchant-application', id],
    queryFn: () => getMerchantApplication(id),
  });

  return (
    <Modal open onClose={onClose} title="Documents & bank details" size="lg">
      {isLoading || !data ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Uploaded documents ({data.documents.length})
            </p>
            {data.documents.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No documents uploaded.</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {data.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}</p>
                      <p className="text-xs text-slate-500">{new Date(doc.uploadedAt).toLocaleString()}</p>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-sm font-medium text-brand-600 hover:underline"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bank account for payouts</p>
            {data.bankAccount ? (
              <dl className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
                <div className="flex justify-between gap-4 px-3 py-2">
                  <dt className="text-slate-500">Account holder</dt>
                  <dd className="font-medium text-slate-900">{data.bankAccount.accountHolderName}</dd>
                </div>
                <div className="flex justify-between gap-4 px-3 py-2">
                  <dt className="text-slate-500">Account number</dt>
                  <dd className="font-medium text-slate-900">{data.bankAccount.accountNumber}</dd>
                </div>
                <div className="flex justify-between gap-4 px-3 py-2">
                  <dt className="text-slate-500">IFSC</dt>
                  <dd className="font-medium text-slate-900">{data.bankAccount.ifsc}</dd>
                </div>
                {data.bankAccount.upiId && (
                  <div className="flex justify-between gap-4 px-3 py-2">
                    <dt className="text-slate-500">UPI ID</dt>
                    <dd className="font-medium text-slate-900">{data.bankAccount.upiId}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-amber-700">
                Not saved yet — merchant hasn't completed the Bank Details step, so payouts can't be processed.
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">GST / PAN</p>
            <dl className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
              <div className="flex justify-between gap-4 px-3 py-2">
                <dt className="text-slate-500">PAN</dt>
                <dd className="font-medium text-slate-900">{data.panNumber || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 px-3 py-2">
                <dt className="text-slate-500">GSTIN</dt>
                <dd className="font-medium text-slate-900">
                  {data.gstNumber || '—'} {data.gstNumber && (data.gstVerified ? '(verified)' : '(unverified)')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function MerchantApplicationsContent() {
  const [tab, setTab] = useState<string>('SUBMITTED');
  const [detailId, setDetailId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'merchant-applications', tab],
    queryFn: () => listMerchantApplications({ status: tab }),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveMerchantApplication(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'merchant-applications'] }),
  });

  const reject = useMutation({
    mutationFn: (id: string) => {
      const reason = prompt('Rejection reason (min 10 chars):');
      if (!reason || reason.length < 10) throw new Error('Reason required');
      return rejectMerchantApplication(id, reason);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'merchant-applications'] }),
  });

  const apps = (data?.applications ?? []) as MerchantAppRow[];

  return (
    <>
      <OnboardingFunnel />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {apps.length === 0 && (
            <p className="text-slate-500">No applications in this queue.</p>
          )}
          {apps.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{app.businessName ?? '—'}</h3>
                  <p className="text-sm text-slate-600">{app.storeName} · {app.ownerName}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge>{app.status}</Badge>
                    {app.riskScore != null && (
                      <Badge tone={app.riskScore >= 50 ? 'danger' : 'neutral'}>
                        Risk {app.riskScore}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setDetailId(app.id)}>
                    Documents & bank details
                  </Button>
                  {['SUBMITTED', 'UNDER_REVIEW', 'KYC_PENDING'].includes(app.status) && (
                    <>
                      <Button size="sm" loading={approve.isPending} onClick={() => approve.mutate(app.id)}>
                        Approve
                      </Button>
                      <Button variant="danger" size="sm" loading={reject.isPending} onClick={() => reject.mutate(app.id)}>
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailId && <MerchantApplicationDetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}
