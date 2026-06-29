"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatReturnWindow = formatReturnWindow;
exports.proofRequirementLabel = proofRequirementLabel;
exports.buildReturnPolicySummary = buildReturnPolicySummary;
exports.evaluateClaimEligibility = evaluateClaimEligibility;
exports.validateEvidenceForPolicy = validateEvidenceForPolicy;
exports.suggestDefaultReturnPolicy = suggestDefaultReturnPolicy;
const client_1 = require("@prisma/client");
const HOUR = 60 * 60 * 1000;
function formatReturnWindow(hours) {
    if (hours == null || hours <= 0)
        return null;
    if (hours < 24)
        return `Within ${hours} Hour${hours === 1 ? '' : 's'}`;
    const days = Math.round(hours / 24);
    return `Within ${days} Day${days === 1 ? '' : 's'}`;
}
function proofRequirementLabel(proof) {
    switch (proof) {
        case client_1.ClaimProofRequirement.NONE:
            return null;
        case client_1.ClaimProofRequirement.PHOTO:
            return 'Photo proof required';
        case client_1.ClaimProofRequirement.VIDEO:
            return 'Video proof required';
        case client_1.ClaimProofRequirement.PHOTO_AND_VIDEO:
            return 'Photo & video proof required';
        default:
            return null;
    }
}
function buildReturnPolicySummary(policy) {
    const windowLabel = formatReturnWindow(policy.returnWindowHours);
    const proofLabel = proofRequirementLabel(policy.proofRequired);
    const highlights = [];
    if (policy.isReplaceable)
        highlights.push('Replacement Available');
    if (policy.isRefundable)
        highlights.push('Refund Available');
    if (policy.isReturnable)
        highlights.push('Return Accepted');
    if (windowLabel)
        highlights.push(windowLabel);
    if (proofLabel)
        highlights.push(proofLabel);
    if (!policy.isReturnable && !policy.isRefundable && !policy.isReplaceable) {
        highlights.push('No Return');
        highlights.push('No Refund');
        if (policy.preparedFoodPolicy === client_1.PreparedFoodPolicy.NO_RETURN) {
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
function isClaimTypeAllowed(policy, claimType) {
    if (policy.preparedFoodPolicy === client_1.PreparedFoodPolicy.NO_RETURN) {
        return false;
    }
    if (policy.preparedFoodPolicy === client_1.PreparedFoodPolicy.REPLACEMENT_ONLY) {
        return claimType === client_1.OrderClaimType.REPLACEMENT;
    }
    if (policy.preparedFoodPolicy === client_1.PreparedFoodPolicy.REFUND_ONLY) {
        return claimType === client_1.OrderClaimType.REFUND;
    }
    switch (claimType) {
        case client_1.OrderClaimType.RETURN:
            return policy.isReturnable;
        case client_1.OrderClaimType.REFUND:
            return policy.isRefundable;
        case client_1.OrderClaimType.REPLACEMENT:
            return policy.isReplaceable;
        default:
            return false;
    }
}
function evaluateClaimEligibility(input) {
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
    if (input.reason === client_1.ReturnClaimReason.CUSTOMER_CHANGED_MIND &&
        !input.policy.allowCustomerChangedMind) {
        return { eligible: false, reason: 'Customer changed mind is not accepted for this product', autoApprove: false };
    }
    if (input.policy.returnReasons.length > 0 &&
        input.reason !== client_1.ReturnClaimReason.OTHER &&
        !input.policy.returnReasons.includes(input.reason)) {
        return { eligible: false, reason: 'Selected reason is not eligible for this product', autoApprove: false };
    }
    const autoApprove = input.policy.approvalMode === client_1.ClaimApprovalMode.AUTO &&
        input.policy.autoApproveBelowAmount != null &&
        input.requestedAmount <= input.policy.autoApproveBelowAmount;
    return { eligible: true, autoApprove };
}
function validateEvidenceForPolicy(policy, photoCount, videoCount) {
    switch (policy.proofRequired) {
        case client_1.ClaimProofRequirement.NONE:
            return null;
        case client_1.ClaimProofRequirement.PHOTO:
            return photoCount > 0 ? null : 'At least one photo is required';
        case client_1.ClaimProofRequirement.VIDEO:
            return videoCount > 0 ? null : 'A video is required';
        case client_1.ClaimProofRequirement.PHOTO_AND_VIDEO:
            if (photoCount === 0)
                return 'At least one photo is required';
            if (videoCount === 0)
                return 'A video is required';
            return null;
        default:
            return null;
    }
}
function suggestDefaultReturnPolicy(input) {
    const name = (input.productName ?? '').toLowerCase();
    const slug = (input.categorySlug ?? '').toLowerCase();
    if (input.isFood || slug.includes('restaurant') || slug.includes('food') || slug.includes('cafe')) {
        return {
            isReturnable: false,
            isRefundable: true,
            isReplaceable: false,
            returnWindowHours: 2,
            preparedFoodPolicy: client_1.PreparedFoodPolicy.REFUND_ONLY,
            returnReasons: [
                client_1.ReturnClaimReason.WRONG_ITEM,
                client_1.ReturnClaimReason.DAMAGED,
                client_1.ReturnClaimReason.MISSING_ITEM,
            ],
            allowCustomerChangedMind: false,
            proofRequired: client_1.ClaimProofRequirement.PHOTO,
            approvalMode: client_1.ClaimApprovalMode.MANUAL,
            refundMethod: client_1.ClaimRefundMethod.ORIGINAL_PAYMENT,
        };
    }
    if (slug.includes('electronic') || name.includes('phone') || name.includes('laptop')) {
        return {
            isReturnable: true,
            isRefundable: true,
            isReplaceable: true,
            returnWindowHours: 24 * 7,
            returnReasons: [
                client_1.ReturnClaimReason.DAMAGED,
                client_1.ReturnClaimReason.NOT_AS_DESCRIBED,
                client_1.ReturnClaimReason.WRONG_ITEM,
            ],
            proofRequired: client_1.ClaimProofRequirement.PHOTO,
            approvalMode: client_1.ClaimApprovalMode.MANUAL,
            refundMethod: client_1.ClaimRefundMethod.BOTH,
        };
    }
    if (name.includes('milk') || slug.includes('dairy')) {
        return {
            isReturnable: false,
            isRefundable: false,
            isReplaceable: true,
            returnWindowHours: 2,
            returnReasons: [client_1.ReturnClaimReason.QUALITY_ISSUE, client_1.ReturnClaimReason.DAMAGED],
            proofRequired: client_1.ClaimProofRequirement.PHOTO,
            approvalMode: client_1.ClaimApprovalMode.AUTO,
            autoApproveBelowAmount: 200,
            refundMethod: client_1.ClaimRefundMethod.WALLET,
        };
    }
    if (name.includes('rice') || slug.includes('grocery')) {
        return {
            isReturnable: true,
            isRefundable: true,
            isReplaceable: true,
            returnWindowHours: 24 * 3,
            returnReasons: [
                client_1.ReturnClaimReason.DAMAGED,
                client_1.ReturnClaimReason.QUALITY_ISSUE,
                client_1.ReturnClaimReason.WRONG_ITEM,
            ],
            proofRequired: client_1.ClaimProofRequirement.PHOTO,
            approvalMode: client_1.ClaimApprovalMode.MANUAL,
            refundMethod: client_1.ClaimRefundMethod.BOTH,
        };
    }
    return {
        isReturnable: false,
        isRefundable: true,
        isReplaceable: true,
        returnWindowHours: 24,
        returnReasons: [client_1.ReturnClaimReason.DAMAGED, client_1.ReturnClaimReason.WRONG_ITEM],
        proofRequired: client_1.ClaimProofRequirement.PHOTO,
        approvalMode: client_1.ClaimApprovalMode.MANUAL,
        refundMethod: client_1.ClaimRefundMethod.ORIGINAL_PAYMENT,
    };
}
//# sourceMappingURL=product-return-policy.util.js.map