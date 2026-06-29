import { RejectionType } from '@prisma/client';
export declare const REVOCABLE_REJECTION_TYPES: RejectionType[];
export declare const BLACKLIST_REJECTION_TYPES: RejectionType[];
export declare function isRevocableRejection(type: RejectionType | null | undefined): boolean;
export declare function isBlacklistRejection(type: RejectionType): boolean;
export declare const MERCHANT_BLOCKED_MESSAGE = "This merchant account has been permanently blocked.";
