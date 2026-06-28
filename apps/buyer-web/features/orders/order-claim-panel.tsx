'use client';

import { useState } from 'react';
import { Button, Input } from '@/design-system/primitives';
import { useToast } from '@/design-system/primitives';
import type { OrderClaimEligibility } from '@/types/claims';

const REASON_LABELS: Record<string, string> = {
  WRONG_ITEM: 'Wrong item',
  DAMAGED: 'Damaged',
  MISSING_ITEM: 'Missing item',
  QUALITY_ISSUE: 'Quality issue',
  EXPIRED_PRODUCT: 'Expired product',
  PACKAGING_DAMAGED: 'Packaging damaged',
  NOT_AS_DESCRIBED: 'Not as described',
  CUSTOMER_CHANGED_MIND: 'Changed my mind',
  OTHER: 'Other',
};

interface Props {
  orderId: string;
  eligibility: OrderClaimEligibility | null;
  onSubmitted?: () => void;
}

export function OrderClaimPanel({ orderId, eligibility, onSubmitted }: Props) {
  const { toast } = useToast();
  const [claimType, setClaimType] = useState<'REFUND' | 'REPLACEMENT' | 'RETURN'>('REFUND');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!eligibility) return null;

  const canRefund = eligibility.actions.refund;
  const canReplacement = eligibility.actions.replacement;
  const canReturn = eligibility.actions.return;

  if (!canRefund && !canReplacement && !canReturn) return null;

  const item = eligibility.items[0];
  const reasons = item?.reasons ?? [];

  const handleSubmit = async () => {
    if (!item || !reason) {
      toast('Select a reason', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/buyer/orders/${orderId}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimType,
          reason,
          reasonNote: note || undefined,
          items: [{ orderItemId: item.orderItemId, quantity: 1 }],
          evidence: photoUrl ? [{ kind: 'PHOTO', url: photoUrl }] : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Could not submit claim');
      toast('Claim submitted', 'success');
      onSubmitted?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not submit claim', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-sm font-semibold">Need help?</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Raise a claim for items in this order. The merchant reviews per product policy.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {canRefund && (
          <Button
            type="button"
            size="sm"
            variant={claimType === 'REFUND' ? 'primary' : 'secondary'}
            onClick={() => setClaimType('REFUND')}
          >
            Raise Refund
          </Button>
        )}
        {canReplacement && (
          <Button
            type="button"
            size="sm"
            variant={claimType === 'REPLACEMENT' ? 'primary' : 'secondary'}
            onClick={() => setClaimType('REPLACEMENT')}
          >
            Raise Replacement
          </Button>
        )}
        {canReturn && (
          <Button
            type="button"
            size="sm"
            variant={claimType === 'RETURN' ? 'primary' : 'secondary'}
            onClick={() => setClaimType('RETURN')}
          >
            Raise Return
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Reason</span>
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">Select reason</option>
            {reasons.map((r) => (
              <option key={r} value={r}>
                {REASON_LABELS[r] ?? r}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Description</span>
          <textarea
            className="min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <Input
          label="Photo URL (proof)"
          placeholder="https://..."
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
        />
        <Button type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit claim'}
        </Button>
      </div>
    </div>
  );
}
