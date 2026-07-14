'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Badge, Spinner } from '@/design-system';
import { listMerchantApplications, approveMerchantApplication, rejectMerchantApplication } from '@/services/admin-api';
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

export function MerchantApplicationsContent() {
  const [tab, setTab] = useState<string>('SUBMITTED');
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
    </>
  );
}
