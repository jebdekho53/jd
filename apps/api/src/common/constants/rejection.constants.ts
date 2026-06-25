import { RejectionType } from '@prisma/client';

export const REVOCABLE_REJECTION_TYPES: RejectionType[] = [
  RejectionType.DOCUMENT_ISSUE,
  RejectionType.COMPLIANCE_ISSUE,
];

export const BLACKLIST_REJECTION_TYPES: RejectionType[] = [
  RejectionType.FRAUD,
  RejectionType.DUPLICATE_ACCOUNT,
  RejectionType.POLICY_VIOLATION,
];

export function isRevocableRejection(type: RejectionType | null | undefined): boolean {
  return type != null && REVOCABLE_REJECTION_TYPES.includes(type);
}

export function isBlacklistRejection(type: RejectionType): boolean {
  return BLACKLIST_REJECTION_TYPES.includes(type);
}

export const MERCHANT_BLOCKED_MESSAGE =
  'This merchant account has been permanently blocked.';
