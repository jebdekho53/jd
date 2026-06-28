'use client';

import { RefreshCw, ShieldAlert } from 'lucide-react';
import type { ReturnPolicySummary } from '@/types/return-policy';

interface Props {
  policy?: ReturnPolicySummary | null;
}

export function PdpReturnPolicySection({ policy }: Props) {
  if (!policy) return null;

  const highlights = policy.highlights.length
    ? policy.highlights
    : ['Return policy set by the merchant for this product'];

  return (
    <section
      className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5"
      aria-labelledby="pdp-return-policy-heading"
    >
      <div className="mb-3 flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-primary" aria-hidden />
        <h2 id="pdp-return-policy-heading" className="text-lg font-semibold text-jd-text-primary">
          Return & refund policy
        </h2>
      </div>
      <ul className="space-y-2">
        {highlights.map((line) => (
          <li key={line} className="flex items-start gap-2 text-sm text-jd-text-secondary">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {line}
          </li>
        ))}
      </ul>
      {!policy.refundAllowed && !policy.replacementAllowed && !policy.returnAllowed && (
        <p className="mt-3 flex items-center gap-2 text-xs text-amber-700">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
          This product has limited or no returns — only eligible issues may be accepted.
        </p>
      )}
    </section>
  );
}
