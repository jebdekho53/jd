'use client';

import { Input, Select, Textarea } from '@/design-system/primitives';

const RETURN_REASONS = [
  'WRONG_ITEM',
  'DAMAGED',
  'MISSING_ITEM',
  'QUALITY_ISSUE',
  'EXPIRED_PRODUCT',
  'PACKAGING_DAMAGED',
  'NOT_AS_DESCRIBED',
  'CUSTOMER_CHANGED_MIND',
  'OTHER',
] as const;

export interface ProductReturnPolicyFormState {
  isReturnable: boolean;
  isRefundable: boolean;
  isReplaceable: boolean;
  returnWindowHours?: number;
  approvalMode: string;
  proofRequired: string;
  autoApproveBelowAmount?: number;
  returnReasons: string[];
  refundMethod: string;
  preparedFoodPolicy?: string;
  allowCustomerChangedMind: boolean;
  returnPolicyText?: string;
  replacementPolicyText?: string;
}

export const DEFAULT_RETURN_POLICY: ProductReturnPolicyFormState = {
  isReturnable: false,
  isRefundable: false,
  isReplaceable: false,
  approvalMode: 'MANUAL',
  proofRequired: 'NONE',
  returnReasons: [],
  refundMethod: 'ORIGINAL_PAYMENT',
  allowCustomerChangedMind: false,
};

interface Props {
  value: ProductReturnPolicyFormState;
  onChange: (next: ProductReturnPolicyFormState) => void;
  onSuggestAi?: () => void;
}

export function ProductReturnPolicySection({ value, onChange, onSuggestAi }: Props) {
  const patch = (partial: Partial<ProductReturnPolicyFormState>) =>
    onChange({ ...value, ...partial });

  const toggleReason = (reason: string) => {
    const next = value.returnReasons.includes(reason)
      ? value.returnReasons.filter((r) => r !== reason)
      : [...value.returnReasons, reason];
    patch({ returnReasons: next });
  };

  return (
    <details className="rounded-lg border border-neutral-200 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-neutral-800">
        Return & Refund Policy
      </summary>
      <div className="mt-3 space-y-3">
        {onSuggestAi && (
          <button
            type="button"
            className="text-xs font-medium text-violet-700 hover:underline"
            onClick={onSuggestAi}
          >
            Suggest policy with AI (you confirm before save)
          </button>
        )}
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.isReturnable}
              onChange={(e) => patch({ isReturnable: e.target.checked })}
              className="rounded"
            />
            Return allowed
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.isRefundable}
              onChange={(e) => patch({ isRefundable: e.target.checked })}
              className="rounded"
            />
            Refund allowed
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.isReplaceable}
              onChange={(e) => patch({ isReplaceable: e.target.checked })}
              className="rounded"
            />
            Replacement allowed
          </label>
        </div>
        <Input
          label="Return window (hours)"
          type="number"
          value={value.returnWindowHours ?? ''}
          onChange={(e) =>
            patch({ returnWindowHours: e.target.value ? Number(e.target.value) : undefined })
          }
        />
        <Select
          label="Proof required"
          value={value.proofRequired}
          onChange={(e) => patch({ proofRequired: e.target.value })}
        >
          <option value="NONE">None</option>
          <option value="PHOTO">Photo</option>
          <option value="VIDEO">Video</option>
          <option value="PHOTO_AND_VIDEO">Photo & video</option>
        </Select>
        <Select
          label="Approval"
          value={value.approvalMode}
          onChange={(e) => patch({ approvalMode: e.target.value })}
        >
          <option value="MANUAL">Manual review</option>
          <option value="AUTO">Auto-approve below amount</option>
        </Select>
        <Input
          label="Auto-approve below (₹)"
          type="number"
          value={value.autoApproveBelowAmount ?? ''}
          onChange={(e) =>
            patch({
              autoApproveBelowAmount: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
        <Select
          label="Refund method"
          value={value.refundMethod}
          onChange={(e) => patch({ refundMethod: e.target.value })}
        >
          <option value="ORIGINAL_PAYMENT">Original payment</option>
          <option value="WALLET">Wallet</option>
          <option value="BOTH">Both</option>
        </Select>
        <Select
          label="Food policy"
          value={value.preparedFoodPolicy ?? ''}
          onChange={(e) => patch({ preparedFoodPolicy: e.target.value || undefined })}
        >
          <option value="">Not food / default</option>
          <option value="NO_RETURN">No return</option>
          <option value="REPLACEMENT_ONLY">Replacement only</option>
          <option value="REFUND_ONLY">Refund only</option>
          <option value="MERCHANT_DECIDES">Merchant decides</option>
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.allowCustomerChangedMind}
            onChange={(e) => patch({ allowCustomerChangedMind: e.target.checked })}
            className="rounded"
          />
          Allow &quot;customer changed mind&quot;
        </label>
        <div>
          <p className="mb-1 text-xs font-medium text-neutral-600">Eligible reasons</p>
          <div className="flex flex-wrap gap-2">
            {RETURN_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => toggleReason(reason)}
                className={`rounded-full border px-2 py-0.5 text-xs ${
                  value.returnReasons.includes(reason)
                    ? 'border-violet-600 bg-violet-50 text-violet-800'
                    : 'border-neutral-200 text-neutral-600'
                }`}
              >
                {reason.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        <Textarea
          label="Return policy text (shown to buyers)"
          value={value.returnPolicyText ?? ''}
          onChange={(e) => patch({ returnPolicyText: e.target.value })}
        />
        <Textarea
          label="Replacement policy text"
          value={value.replacementPolicyText ?? ''}
          onChange={(e) => patch({ replacementPolicyText: e.target.value })}
        />
      </div>
    </details>
  );
}
