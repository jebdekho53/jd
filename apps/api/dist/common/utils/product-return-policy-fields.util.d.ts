import { ClaimApprovalMode, ClaimProofRequirement, ClaimRefundMethod, PreparedFoodPolicy, ReturnClaimReason } from '@prisma/client';
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
export declare function pickReturnPolicyPrismaData(dto: ProductReturnPolicyFields): Record<string, unknown>;
