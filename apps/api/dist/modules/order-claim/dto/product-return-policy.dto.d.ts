import type { ClaimApprovalMode, ClaimProofRequirement, ClaimRefundMethod, PreparedFoodPolicy, ReturnClaimReason } from '@prisma/client';
export declare class ProductReturnPolicyDto {
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
export declare class ApplyAiReturnPolicySuggestionDto extends ProductReturnPolicyDto {
    confirm?: boolean;
}
