'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/design-system';
import { fetchOnboardingFunnel, type OnboardingFunnel } from '@/services/admin-api';

const RANGES = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
] as const;

export function OnboardingFunnel() {
  const [range, setRange] = useState<number>(30);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'onboarding-funnel', range],
    queryFn: () => fetchOnboardingFunnel(range),
  });

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Onboarding funnel</h2>
          <p className="text-sm text-slate-500">
            Signup se approve tak — aur kahan applicants half-onboard chhod dete hain
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                range === r.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <FunnelBody data={data} />
      )}
    </section>
  );
}

function FunnelBody({ data }: { data: OnboardingFunnel }) {
  const { totals, conversion } = data;

  const stages = [
    { label: 'Signups started', value: totals.signups, tone: 'bg-slate-400' },
    { label: 'Submitted', value: totals.submitted, tone: 'bg-blue-500' },
    { label: 'In review', value: totals.underReview + totals.kycPending, tone: 'bg-amber-500' },
    { label: 'Approved', value: totals.approved, tone: 'bg-emerald-500' },
  ];
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Signup → Submit" value={`${conversion.signupToSubmit}%`} />
        <Kpi label="Submit → Approve" value={`${conversion.submitToApprove}%`} />
        <Kpi label="Overall (signup → live)" value={`${conversion.overall}%`} accent />
        <Kpi
          label="Half-onboard (drafts)"
          value={`${totals.drafts}`}
          sub={`${conversion.dropOffAtDraft}% of signups`}
          danger={conversion.dropOffAtDraft > 40}
        />
      </div>

      {/* Funnel bars */}
      <div className="space-y-2">
        {stages.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-32 shrink-0 text-sm text-slate-600">{s.label}</div>
            <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-slate-100">
              <div
                className={`h-full ${s.tone} transition-all`}
                style={{ width: `${(s.value / max) * 100}%` }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center text-xs font-semibold text-slate-700">
                {s.value.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Where drafts get stuck */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            Kahan atke hain (draft applicants)
          </h3>
          {data.stuckAtStep.length === 0 ? (
            <p className="text-sm text-slate-500">
              Koi draft stuck nahi — {data.draftsFullyFilled} ne sab bhara par submit nahi kiya.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {data.stuckAtStep.map((s) => (
                <li key={s.step} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{s.label}</span>
                  <span className="font-semibold text-slate-900">{s.count}</span>
                </li>
              ))}
              {data.draftsFullyFilled > 0 && (
                <li className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Sab bhara, submit pending</span>
                  <span className="font-semibold text-slate-900">{data.draftsFullyFilled}</span>
                </li>
              )}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            By source (Meta / Google / organic)
          </h3>
          {data.bySource.length === 0 ? (
            <p className="text-sm text-slate-500">Abhi koi attributed signup nahi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-slate-400">
                    <th className="py-1.5 pr-3">Source</th>
                    <th className="py-1.5 pr-3 text-right">Signups</th>
                    <th className="py-1.5 pr-3 text-right">Approved</th>
                    <th className="py-1.5 text-right">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bySource.map((s) => (
                    <tr key={s.source} className="border-b last:border-0">
                      <td className="py-1.5 pr-3 font-medium text-slate-700">{s.source}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{s.signups}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{s.approved}</td>
                      <td className="py-1.5 text-right tabular-nums font-semibold">
                        {s.conversion}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Step completion</h3>
          <ul className="space-y-1.5">
            {data.stepCompletion.map((s) => {
              const width = totals.signups > 0 ? (s.completed / totals.signups) * 100 : 0;
              return (
                <li key={s.step}>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{s.label}</span>
                    <span>{s.completed}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-admin-500" style={{ width: `${width}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
  danger,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        danger
          ? 'border-red-200 bg-red-50'
          : accent
            ? 'border-admin-100 bg-admin-50'
            : 'border-slate-200 bg-slate-50'
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${danger ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}
