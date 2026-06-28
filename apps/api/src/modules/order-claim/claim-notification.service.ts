import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderClaimStatus } from '@prisma/client';

export const CLAIM_EVENTS = {
  SUBMITTED: 'claim.submitted',
  APPROVED: 'claim.approved',
  REJECTED: 'claim.rejected',
  REFUND_PROCESSED: 'claim.refund_processed',
  REPLACEMENT_SHIPPED: 'claim.replacement_shipped',
  MERCHANT_REMINDER: 'claim.merchant_reminder',
  ADMIN_ESCALATED: 'claim.admin_escalated',
} as const;

@Injectable()
export class ClaimNotificationService {
  private readonly logger = new Logger(ClaimNotificationService.name);

  constructor(private readonly events: EventEmitter2) {}

  notifyClaimSubmitted(payload: {
    claimId: string;
    claimNumber: string;
    buyerUserId: string;
    storeId: string;
    merchantUserId?: string;
  }): void {
    this.events.emit(CLAIM_EVENTS.SUBMITTED, payload);
    this.logger.log({ claimId: payload.claimId }, 'Claim submitted notification');
  }

  notifyClaimStatus(payload: {
    claimId: string;
    claimNumber: string;
    buyerUserId: string;
    storeId: string;
    status: OrderClaimStatus;
    merchantUserId?: string;
  }): void {
    if (payload.status === OrderClaimStatus.APPROVED) {
      this.events.emit(CLAIM_EVENTS.APPROVED, payload);
    } else if (payload.status === OrderClaimStatus.REJECTED) {
      this.events.emit(CLAIM_EVENTS.REJECTED, payload);
    } else if (payload.status === OrderClaimStatus.REFUND_PROCESSED) {
      this.events.emit(CLAIM_EVENTS.REFUND_PROCESSED, payload);
    } else if (payload.status === OrderClaimStatus.REPLACEMENT_SHIPPED) {
      this.events.emit(CLAIM_EVENTS.REPLACEMENT_SHIPPED, payload);
    }
  }

  notifyMerchantReminder(payload: { claimId: string; storeId: string }): void {
    this.events.emit(CLAIM_EVENTS.MERCHANT_REMINDER, payload);
  }

  notifyAdminEscalation(payload: { claimId: string; claimNumber: string }): void {
    this.events.emit(CLAIM_EVENTS.ADMIN_ESCALATED, payload);
  }
}
