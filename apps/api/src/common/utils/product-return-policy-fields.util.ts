import {
  ClaimApprovalMode,
  ClaimProofRequirement,
  ClaimRefundMethod,
  PreparedFoodPolicy,
  ReturnClaimReason,
} from '@prisma/client';

export interface ProductReturnPolicyFields {
  isReturnable?: boolean;
  isRefundable?: boolean;
  isReplaceable?: boolean;
  returnWindowHours?: number;
  approvalMode?: ClaimApprovalMode;
  proofRequired?: ClaimProofRequirement;
  autoApproveBelowAmount?: number;
  returnReasons?: ReturnClaimReason[];
  restockingFee?: number;
  refundMethod?: ClaimRefundMethod;
  returnPolicyText?: string;
  replacementPolicyText?: string;
  preparedFoodPolicy?: PreparedFoodPolicy;
  allowCustomerChangedMind?: boolean;
}

export function pickReturnPolicyPrismaData(
  dto: ProductReturnPolicyFields,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (dto.isReturnable !== undefined) data.isReturnable = dto.isReturnable;
  if (dto.isRefundable !== undefined) data.isRefundable = dto.isRefundable;
  if (dto.isReplaceable !== undefined) data.isReplaceable = dto.isReplaceable;
  if (dto.returnWindowHours !== undefined) data.returnWindowHours = dto.returnWindowHours;
  if (dto.approvalMode !== undefined) data.approvalMode = dto.approvalMode;
  if (dto.proofRequired !== undefined) data.proofRequired = dto.proofRequired;
  if (dto.autoApproveBelowAmount !== undefined) {
    data.autoApproveBelowAmount = dto.autoApproveBelowAmount;
  }
  if (dto.returnReasons !== undefined) data.returnReasons = dto.returnReasons;
  if (dto.restockingFee !== undefined) data.restockingFee = dto.restockingFee;
  if (dto.refundMethod !== undefined) data.refundMethod = dto.refundMethod;
  if (dto.returnPolicyText !== undefined) data.returnPolicyText = dto.returnPolicyText;
  if (dto.replacementPolicyText !== undefined) {
    data.replacementPolicyText = dto.replacementPolicyText;
  }
  if (dto.preparedFoodPolicy !== undefined) data.preparedFoodPolicy = dto.preparedFoodPolicy;
  if (dto.allowCustomerChangedMind !== undefined) {
    data.allowCustomerChangedMind = dto.allowCustomerChangedMind;
  }
  return data;
}
