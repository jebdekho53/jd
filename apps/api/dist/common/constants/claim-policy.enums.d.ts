export declare const ClaimApprovalModeEnum: {
    readonly AUTO: "AUTO";
    readonly MANUAL: "MANUAL";
};
export declare const ClaimProofRequirementEnum: {
    readonly NONE: "NONE";
    readonly PHOTO: "PHOTO";
    readonly VIDEO: "VIDEO";
    readonly PHOTO_AND_VIDEO: "PHOTO_AND_VIDEO";
};
export declare const ClaimRefundMethodEnum: {
    readonly ORIGINAL_PAYMENT: "ORIGINAL_PAYMENT";
    readonly WALLET: "WALLET";
    readonly BOTH: "BOTH";
};
export declare const PreparedFoodPolicyEnum: {
    readonly NO_RETURN: "NO_RETURN";
    readonly REPLACEMENT_ONLY: "REPLACEMENT_ONLY";
    readonly REFUND_ONLY: "REFUND_ONLY";
    readonly MERCHANT_DECIDES: "MERCHANT_DECIDES";
};
export declare const ReturnClaimReasonEnum: {
    readonly WRONG_ITEM: "WRONG_ITEM";
    readonly DAMAGED: "DAMAGED";
    readonly MISSING_ITEM: "MISSING_ITEM";
    readonly QUALITY_ISSUE: "QUALITY_ISSUE";
    readonly EXPIRED_PRODUCT: "EXPIRED_PRODUCT";
    readonly PACKAGING_DAMAGED: "PACKAGING_DAMAGED";
    readonly NOT_AS_DESCRIBED: "NOT_AS_DESCRIBED";
    readonly CUSTOMER_CHANGED_MIND: "CUSTOMER_CHANGED_MIND";
};
export declare const OrderClaimTypeEnum: {
    readonly RETURN: "RETURN";
    readonly REFUND: "REFUND";
    readonly REPLACEMENT: "REPLACEMENT";
};
export declare const OrderClaimStatusEnum: {
    readonly PENDING: "PENDING";
    readonly EVIDENCE_REQUESTED: "EVIDENCE_REQUESTED";
    readonly APPROVED: "APPROVED";
    readonly REJECTED: "REJECTED";
    readonly REPLACEMENT_APPROVED: "REPLACEMENT_APPROVED";
    readonly REPLACEMENT_SHIPPED: "REPLACEMENT_SHIPPED";
    readonly REFUND_PROCESSING: "REFUND_PROCESSING";
    readonly REFUND_PROCESSED: "REFUND_PROCESSED";
    readonly CLOSED: "CLOSED";
};
