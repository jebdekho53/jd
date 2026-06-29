"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderClaimStatusEnum = exports.OrderClaimTypeEnum = exports.ReturnClaimReasonEnum = exports.PreparedFoodPolicyEnum = exports.ClaimRefundMethodEnum = exports.ClaimProofRequirementEnum = exports.ClaimApprovalModeEnum = void 0;
exports.ClaimApprovalModeEnum = {
    AUTO: 'AUTO',
    MANUAL: 'MANUAL',
};
exports.ClaimProofRequirementEnum = {
    NONE: 'NONE',
    PHOTO: 'PHOTO',
    VIDEO: 'VIDEO',
    PHOTO_AND_VIDEO: 'PHOTO_AND_VIDEO',
};
exports.ClaimRefundMethodEnum = {
    ORIGINAL_PAYMENT: 'ORIGINAL_PAYMENT',
    WALLET: 'WALLET',
    BOTH: 'BOTH',
};
exports.PreparedFoodPolicyEnum = {
    NO_RETURN: 'NO_RETURN',
    REPLACEMENT_ONLY: 'REPLACEMENT_ONLY',
    REFUND_ONLY: 'REFUND_ONLY',
    MERCHANT_DECIDES: 'MERCHANT_DECIDES',
};
exports.ReturnClaimReasonEnum = {
    WRONG_ITEM: 'WRONG_ITEM',
    DAMAGED: 'DAMAGED',
    MISSING_ITEM: 'MISSING_ITEM',
    QUALITY_ISSUE: 'QUALITY_ISSUE',
    EXPIRED_PRODUCT: 'EXPIRED_PRODUCT',
    PACKAGING_DAMAGED: 'PACKAGING_DAMAGED',
    NOT_AS_DESCRIBED: 'NOT_AS_DESCRIBED',
    CUSTOMER_CHANGED_MIND: 'CUSTOMER_CHANGED_MIND',
};
exports.OrderClaimTypeEnum = {
    RETURN: 'RETURN',
    REFUND: 'REFUND',
    REPLACEMENT: 'REPLACEMENT',
};
exports.OrderClaimStatusEnum = {
    PENDING: 'PENDING',
    EVIDENCE_REQUESTED: 'EVIDENCE_REQUESTED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    REPLACEMENT_APPROVED: 'REPLACEMENT_APPROVED',
    REPLACEMENT_SHIPPED: 'REPLACEMENT_SHIPPED',
    REFUND_PROCESSING: 'REFUND_PROCESSING',
    REFUND_PROCESSED: 'REFUND_PROCESSED',
    CLOSED: 'CLOSED',
};
//# sourceMappingURL=claim-policy.enums.js.map