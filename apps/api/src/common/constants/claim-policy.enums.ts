/**
 * Validator-safe claim policy enums (mirror Prisma schema).
 * Use in DTO @IsEnum decorators — avoids boot failures when @prisma/client
 * is not fully initialized during decorator evaluation in production monorepos.
 */
export const ClaimApprovalModeEnum = {
  AUTO: 'AUTO',
  MANUAL: 'MANUAL',
} as const;

export const ClaimProofRequirementEnum = {
  NONE: 'NONE',
  PHOTO: 'PHOTO',
  VIDEO: 'VIDEO',
  PHOTO_AND_VIDEO: 'PHOTO_AND_VIDEO',
} as const;

export const ClaimRefundMethodEnum = {
  ORIGINAL_PAYMENT: 'ORIGINAL_PAYMENT',
  WALLET: 'WALLET',
  BOTH: 'BOTH',
} as const;

export const PreparedFoodPolicyEnum = {
  NO_RETURN: 'NO_RETURN',
  REPLACEMENT_ONLY: 'REPLACEMENT_ONLY',
  REFUND_ONLY: 'REFUND_ONLY',
  MERCHANT_DECIDES: 'MERCHANT_DECIDES',
} as const;

export const ReturnClaimReasonEnum = {
  WRONG_ITEM: 'WRONG_ITEM',
  DAMAGED: 'DAMAGED',
  MISSING_ITEM: 'MISSING_ITEM',
  QUALITY_ISSUE: 'QUALITY_ISSUE',
  EXPIRED_PRODUCT: 'EXPIRED_PRODUCT',
  PACKAGING_DAMAGED: 'PACKAGING_DAMAGED',
  NOT_AS_DESCRIBED: 'NOT_AS_DESCRIBED',
  CUSTOMER_CHANGED_MIND: 'CUSTOMER_CHANGED_MIND',
} as const;

export const OrderClaimTypeEnum = {
  RETURN: 'RETURN',
  REFUND: 'REFUND',
  REPLACEMENT: 'REPLACEMENT',
} as const;

export const OrderClaimStatusEnum = {
  PENDING: 'PENDING',
  EVIDENCE_REQUESTED: 'EVIDENCE_REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REPLACEMENT_APPROVED: 'REPLACEMENT_APPROVED',
  REPLACEMENT_SHIPPED: 'REPLACEMENT_SHIPPED',
  REFUND_PROCESSING: 'REFUND_PROCESSING',
  REFUND_PROCESSED: 'REFUND_PROCESSED',
  CLOSED: 'CLOSED',
} as const;
