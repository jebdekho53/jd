import { OrderClaimStatus } from '@prisma/client';
export declare const INACTIVE_CLAIM_STATUSES: OrderClaimStatus[];
export declare const TERMINAL_FULFILLMENT_CLAIM_STATUSES: OrderClaimStatus[];
export declare const FULFILLMENT_CLAIM_ACTIONS: Set<string>;
export declare const MAX_CLAIM_EVIDENCE_ITEMS = 5;
export declare const REPLACEMENT_DISPATCH_FAILED = "DISPATCH_FAILED";
