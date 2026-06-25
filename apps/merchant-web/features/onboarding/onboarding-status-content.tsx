'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { MarketingShell } from '@/features/marketing/components/marketing-shell';
import { Button, Spinner } from '@/design-system/primitives';
import { fetchOnboardingStatus, fetchPostApprovalChecklist } from '@/services/onboarding/onboarding-api';

export function OnboardingStatusContent() {
  const { data: status, isLoading } = useQuery({
    queryKey: ['merchant', 'onboarding', 'status'],
    queryFn: fetchOnboardingStatus,
  });

  const { data: checklist } = useQuery({
    queryKey: ['merchant', 'onboarding', 'checklist'],
    queryFn: fetchPostApprovalChecklist,
    enabled: status?.storeStatus === 'APPROVED',
  });

  if (isLoading) {
    return (
      <MarketingShell>
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </MarketingShell>
    );
  }

  if (!status?.hasApplication) {
    return (
      <MarketingShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">No application yet</h1>
          <p className="mt-2 text-slate-600">Start your merchant application to sell on JebDekho.</p>
          <Link href="/signup" className="mt-6 inline-block">
            <Button>Start Application</Button>
          </Link>
        </div>
      </MarketingShell>
    );
  }

  const approved = status.storeStatus === 'APPROVED';

  return (
    <MarketingShell>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Application Status</h1>
        <p className="mt-2 text-slate-600">
          Status: <span className="font-medium text-brand-700">{status.status}</span>
          {status.riskScore != null && (
            <span className="ml-3 text-sm text-slate-500">Risk score: {status.riskScore}</span>
          )}
        </p>

        <div className="mt-8 space-y-4">
          {status.tracker?.map((item, i) => (
            <div key={item.key} className="flex items-center gap-4">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  item.done ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {item.done ? '✓' : i + 1}
              </div>
              <p className={item.done ? 'text-slate-900' : 'text-slate-500'}>{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 h-2 rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-brand-600 transition-all"
            style={{ width: `${status.progressPct ?? 0}%` }}
          />
        </div>

        {approved && checklist?.items?.length ? (
          <div className="mt-10">
            <h2 className="font-semibold">Getting started checklist</h2>
            <ul className="mt-4 space-y-2">
              {checklist.items.map((item) => (
                <li key={item.key} className="flex items-center gap-2 text-sm">
                  <span className={item.done ? 'text-brand-600' : 'text-slate-400'}>
                    {item.done ? '✓' : '○'}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-500">{checklist.progressPct}% complete</p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        ) : !approved ? (
          <p className="mt-8 text-sm text-slate-500">
            We will notify you by email and SMS when your application is reviewed.
          </p>
        ) : null}
      </div>
    </MarketingShell>
  );
}
