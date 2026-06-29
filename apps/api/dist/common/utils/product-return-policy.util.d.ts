import { ClaimApprovalMode, ClaimProofRequirement, ClaimRefundMethod, OrderClaimType, PreparedFoodPolicy, ReturnClaimReason } from '@prisma/client';
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
export declare function formatReturnWindow(hours: number | null): string | null;
export declare function proofRequirementLabel(proof: ClaimProofRequirement): string | null;
export declare function buildReturnPolicySummary(policy: ProductPolicyInput): ReturnPolicySummary;
export declare function evaluateClaimEligibility(input: {
    policy: ProductPolicyInput;
    claimType: OrderClaimType;
    reason: ReturnClaimReason;
    deliveredAt: Date | null;
    completedAt: Date | null;
    now?: Date;
    requestedAmount: number;
}): ClaimEligibilityResult;
export declare function validateEvidenceForPolicy(policy: ProductPolicyInput, photoCount: number, videoCount: number): string | null;
export declare function suggestDefaultReturnPolicy(input: {
    categorySlug?: string | null;
    productName?: string;
    isFood?: boolean;
}): Partial<ProductPolicyInput>;
