import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderClaimStatus } from '@prisma/client';
export declare const CLAIM_EVENTS: {
    readonly SUBMITTED: "claim.submitted";
    readonly APPROVED: "claim.approved";
    readonly REJECTED: "claim.rejected";
    readonly REFUND_PROCESSED: "claim.refund_processed";
    readonly REPLACEMENT_SHIPPED: "claim.replacement_shipped";
    readonly MERCHANT_REMINDER: "claim.merchant_reminder";
    readonly ADMIN_ESCALATED: "claim.admin_escalated";
};
export declare class ClaimNotificationService {
    private readonly events;
    private readonly logger;
    constructor(events: EventEmitter2);
    notifyClaimSubmitted(payload: {
        claimId: string;
        claimNumber: string;
        buyerUserId: string;
        storeId: string;
        merchantUserId?: string;
    }): void;
    notifyClaimStatus(payload: {
        claimId: string;
        claimNumber: string;
        buyerUserId: string;
        storeId: string;
        status: OrderClaimStatus;
        merchantUserId?: string;
    }): void;
    notifyMerchantReminder(payload: {
        claimId: string;
        storeId: string;
    }): void;
    notifyAdminEscalation(payload: {
        claimId: string;
        claimNumber: string;
    }): void;
}
