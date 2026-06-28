'use client';

import type { CartItem } from '@/types/cart';
import type { ReturnPolicySummary } from '@/types/return-policy';

interface Props {
  items: Array<Pick<CartItem, 'product' | 'returnPolicy'>>;
}

function summarizePolicies(items: Props['items']) {
  const policies = items.map((i) => i.returnPolicy).filter(Boolean) as ReturnPolicySummary[];
  if (!policies.length) return null;

  const anyRefund = policies.some((p) => p.refundAllowed);
  const anyReplacement = policies.some((p) => p.replacementAllowed);
  const anyReturn = policies.some((p) => p.returnAllowed);
  const windows = [...new Set(policies.map((p) => p.windowLabel).filter(Boolean))];

  return {
    returnPolicy: anyReturn ? 'Return accepted on eligible items' : 'No returns on some items',
    refundPolicy: anyRefund ? 'Refund available on eligible items' : 'No refund on some items',
    replacementPolicy: anyReplacement
      ? 'Replacement available on eligible items'
      : 'No replacement on some items',
    window: windows.length === 1 ? windows[0] : windows.length > 1 ? 'Varies by product' : null,
  };
}

export function CheckoutReturnPolicyPanel({ items }: Props) {
  const summary = summarizePolicies(items);
  if (!summary) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
      <p className="mb-2 font-semibold text-neutral-900">Before you place this order</p>
      <ul className="space-y-1 text-neutral-700">
        <li>Return policy: {summary.returnPolicy}</li>
        <li>Refund policy: {summary.refundPolicy}</li>
        <li>Replacement policy: {summary.replacementPolicy}</li>
        {summary.window && <li>Window: {summary.window}</li>}
      </ul>
      <p className="mt-2 text-xs text-neutral-500">
        Each product has its own merchant-defined policy. See product pages for full details.
      </p>
    </div>
  );
}
