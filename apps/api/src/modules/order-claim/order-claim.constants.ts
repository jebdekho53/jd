import { OrderClaimStatus } from '@prisma/client';

/** Claims that still consume order-line quantity. */
export const INACTIVE_CLAIM_STATUSES: OrderClaimStatus[] = [
  OrderClaimStatus.REJECTED,
  OrderClaimStatus.CLOSED,
];

/** Terminal statuses — fulfillment actions must not run again. */
export const TERMINAL_FULFILLMENT_CLAIM_STATUSES: OrderClaimStatus[] = [
  OrderClaimStatus.REFUND_PROCESSED,
  OrderClaimStatus.REJECTED,
  OrderClaimStatus.CLOSED,
  OrderClaimStatus.REPLACEMENT_SHIPPED,
];

export const FULFILLMENT_CLAIM_ACTIONS = new Set([
  'APPROVE',
  'APPROVE_REFUND',
  'APPROVE_REPLACEMENT',
  'ISSUE_REPLACEMENT',
]);

export const MAX_CLAIM_EVIDENCE_ITEMS = 5;

export const REPLACEMENT_DISPATCH_FAILED = 'DISPATCH_FAILED';
