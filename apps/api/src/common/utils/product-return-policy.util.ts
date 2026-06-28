import {
  ClaimApprovalMode,
  ClaimProofRequirement,
  ClaimRefundMethod,
  OrderClaimType,
  PreparedFoodPolicy,
  ReturnClaimReason,
} from '@prisma/client';

export interface ProductPolicyInput {
  isReturnable: boolean;
  isRefundable: boolean;
  isReplaceable: boolean;
  returnWindowHours: number | null;
  approvalMode: ClaimApprovalMode;
  proofRequired: ClaimProofRequirement;
  autoApproveBelowAmount: number | null;
  returnReasons: ReturnClaimReason[];
  restockingFee: number;
  refundMethod: ClaimRefundMethod;
  returnPolicyText: string | null;
  replacementPolicyText: string | null;
  preparedFoodPolicy: PreparedFoodPolicy | null;
  allowCustomerChangedMind: boolean;
}

export interface ReturnPolicySummary {
  returnAllowed: boolean;
  refundAllowed: boolean;
  replacementAllowed: boolean;
  windowLabel: string | null;
  windowHours: number | null;
  proofRequired: ClaimProofRequirement;
  proofLabel: string | null;
  approvalMode: ClaimApprovalMode;
  refundMethod: ClaimRefundMethod;
  restockingFee: number;
  returnReasons: ReturnClaimReason[];
  returnPolicyText: string | null;
  replacementPolicyText: string | null;
  preparedFoodPolicy: PreparedFoodPolicy | null;
  highlights: string[];
}

export interface ClaimEligibilityResult {
  eligible: boolean;
  reason?: string;
  autoApprove: boolean;
}

const HOUR = 60 * 60 * 1000;

export function formatReturnWindow(hours: number | null): string | null {
  if (hours == null || hours <= 0) return null;
  if (hours < 24) return `Within ${hours} Hour${hours === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  return `Within ${days} Day${days === 1 ? '' : 's'}`;
}

export function proofRequirementLabel(proof: ClaimProofRequirement): string | null {
  switch (proof) {
    case ClaimProofRequirement.NONE:
      return null;
    case ClaimProofRequirement.PHOTO:
      return 'Photo proof required';
    case ClaimProofRequirement.VIDEO:
      return 'Video proof required';
    case ClaimProofRequirement.PHOTO_AND_VIDEO:
      return 'Photo & video proof required';
    default:
      return null;
  }
}

export function buildReturnPolicySummary(policy: ProductPolicyInput): ReturnPolicySummary {
  const windowLabel = formatReturnWindow(policy.returnWindowHours);
  const proofLabel = proofRequirementLabel(policy.proofRequired);
  const highlights: string[] = [];

  if (policy.isReplaceable) highlights.push('Replacement Available');
  if (policy.isRefundable) highlights.push('Refund Available');
  if (policy.isReturnable) highlights.push('Return Accepted');
  if (windowLabel) highlights.push(windowLabel);
  if (proofLabel) highlights.push(proofLabel);

  if (!policy.isReturnable && !policy.isRefundable && !policy.isReplaceable) {
    highlights.push('No Return');
    highlights.push('No Refund');
    if (policy.preparedFoodPolicy === PreparedFoodPolicy.NO_RETURN) {
      highlights.push('Only damaged items accepted');
    }
  }

  if (policy.returnPolicyText?.trim()) {
    highlights.push(policy.returnPolicyText.trim());
  }

  return {
    returnAllowed: policy.isReturnable,
    refundAllowed: policy.isRefundable,
    replacementAllowed: policy.isReplaceable,
    windowLabel,
    windowHours: policy.returnWindowHours,
    proofRequired: policy.proofRequired,
    proofLabel,
    approvalMode: policy.approvalMode,
    refundMethod: policy.refundMethod,
    restockingFee: policy.restockingFee,
    returnReasons: policy.returnReasons,
    returnPolicyText: policy.returnPolicyText,
    replacementPolicyText: policy.replacementPolicyText,
    preparedFoodPolicy: policy.preparedFoodPolicy,
    highlights,
  };
}

function isClaimTypeAllowed(policy: ProductPolicyInput, claimType: OrderClaimType): boolean {
  if (policy.preparedFoodPolicy === PreparedFoodPolicy.NO_RETURN) {
    return false;
  }
  if (policy.preparedFoodPolicy === PreparedFoodPolicy.REPLACEMENT_ONLY) {
    return claimType === OrderClaimType.REPLACEMENT;
  }
  if (policy.preparedFoodPolicy === PreparedFoodPolicy.REFUND_ONLY) {
    return claimType === OrderClaimType.REFUND;
  }

  switch (claimType) {
    case OrderClaimType.RETURN:
      return policy.isReturnable;
    case OrderClaimType.REFUND:
      return policy.isRefundable;
    case OrderClaimType.REPLACEMENT:
      return policy.isReplaceable;
    default:
      return false;
  }
}

export function evaluateClaimEligibility(input: {
  policy: ProductPolicyInput;
  claimType: OrderClaimType;
  reason: ReturnClaimReason;
  deliveredAt: Date | null;
  completedAt: Date | null;
  now?: Date;
  requestedAmount: number;
}): ClaimEligibilityResult {
  const now = input.now ?? new Date();
  const anchor = input.deliveredAt ?? input.completedAt;

  if (!anchor) {
    return { eligible: false, reason: 'Order is not yet delivered', autoApprove: false };
  }

  if (!isClaimTypeAllowed(input.policy, input.claimType)) {
    return { eligible: false, reason: `${input.claimType} is not allowed for this product`, autoApprove: false };
  }

  if (input.policy.returnWindowHours != null && input.policy.returnWindowHours > 0) {
    const deadline = new Date(anchor.getTime() + input.policy.returnWindowHours * HOUR);
    if (now > deadline) {
      return { eligible: false, reason: 'Return window has expired', autoApprove: false };
    }
  }

  if (
    input.reason === ReturnClaimReason.CUSTOMER_CHANGED_MIND &&
    !input.policy.allowCustomerChangedMind
  ) {
    return { eligible: false, reason: 'Customer changed mind is not accepted for this product', autoApprove: false };
  }

  if (
    input.policy.returnReasons.length > 0 &&
    input.reason !== ReturnClaimReason.OTHER &&
    !input.policy.returnReasons.includes(input.reason)
  ) {
    return { eligible: false, reason: 'Selected reason is not eligible for this product', autoApprove: false };
  }

  const autoApprove =
    input.policy.approvalMode === ClaimApprovalMode.AUTO &&
    input.policy.autoApproveBelowAmount != null &&
    input.requestedAmount <= input.policy.autoApproveBelowAmount;

  return { eligible: true, autoApprove };
}

export function validateEvidenceForPolicy(
  policy: ProductPolicyInput,
  photoCount: number,
  videoCount: number,
): string | null {
  switch (policy.proofRequired) {
    case ClaimProofRequirement.NONE:
      return null;
    case ClaimProofRequirement.PHOTO:
      return photoCount > 0 ? null : 'At least one photo is required';
    case ClaimProofRequirement.VIDEO:
      return videoCount > 0 ? null : 'A video is required';
    case ClaimProofRequirement.PHOTO_AND_VIDEO:
      if (photoCount === 0) return 'At least one photo is required';
      if (videoCount === 0) return 'A video is required';
      return null;
    default:
      return null;
  }
}

export function suggestDefaultReturnPolicy(input: {
  categorySlug?: string | null;
  productName?: string;
  isFood?: boolean;
}): Partial<ProductPolicyInput> {
  const name = (input.productName ?? '').toLowerCase();
  const slug = (input.categorySlug ?? '').toLowerCase();

  if (input.isFood || slug.includes('restaurant') || slug.includes('food') || slug.includes('cafe')) {
    return {
      isReturnable: false,
      isRefundable: true,
      isReplaceable: false,
      returnWindowHours: 2,
      preparedFoodPolicy: PreparedFoodPolicy.REFUND_ONLY,
      returnReasons: [
        ReturnClaimReason.WRONG_ITEM,
        ReturnClaimReason.DAMAGED,
        ReturnClaimReason.MISSING_ITEM,
      ],
      allowCustomerChangedMind: false,
      proofRequired: ClaimProofRequirement.PHOTO,
      approvalMode: ClaimApprovalMode.MANUAL,
      refundMethod: ClaimRefundMethod.ORIGINAL_PAYMENT,
    };
  }

  if (slug.includes('electronic') || name.includes('phone') || name.includes('laptop')) {
    return {
      isReturnable: true,
      isRefundable: true,
      isReplaceable: true,
      returnWindowHours: 24 * 7,
      returnReasons: [
        ReturnClaimReason.DAMAGED,
        ReturnClaimReason.NOT_AS_DESCRIBED,
        ReturnClaimReason.WRONG_ITEM,
      ],
      proofRequired: ClaimProofRequirement.PHOTO,
      approvalMode: ClaimApprovalMode.MANUAL,
      refundMethod: ClaimRefundMethod.BOTH,
    };
  }

  if (name.includes('milk') || slug.includes('dairy')) {
    return {
      isReturnable: false,
      isRefundable: false,
      isReplaceable: true,
      returnWindowHours: 2,
      returnReasons: [ReturnClaimReason.QUALITY_ISSUE, ReturnClaimReason.DAMAGED],
      proofRequired: ClaimProofRequirement.PHOTO,
      approvalMode: ClaimApprovalMode.AUTO,
      autoApproveBelowAmount: 200,
      refundMethod: ClaimRefundMethod.WALLET,
    };
  }

  if (name.includes('rice') || slug.includes('grocery')) {
    return {
      isReturnable: true,
      isRefundable: true,
      isReplaceable: true,
      returnWindowHours: 24 * 3,
      returnReasons: [
        ReturnClaimReason.DAMAGED,
        ReturnClaimReason.QUALITY_ISSUE,
        ReturnClaimReason.WRONG_ITEM,
      ],
      proofRequired: ClaimProofRequirement.PHOTO,
      approvalMode: ClaimApprovalMode.MANUAL,
      refundMethod: ClaimRefundMethod.BOTH,
    };
  }

  return {
    isReturnable: false,
    isRefundable: true,
    isReplaceable: true,
    returnWindowHours: 24,
    returnReasons: [ReturnClaimReason.DAMAGED, ReturnClaimReason.WRONG_ITEM],
    proofRequired: ClaimProofRequirement.PHOTO,
    approvalMode: ClaimApprovalMode.MANUAL,
    refundMethod: ClaimRefundMethod.ORIGINAL_PAYMENT,
  };
}
