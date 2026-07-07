import { OrderRefundInitiator, OrderRefundStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from '../payment/razorpay.service';
import { LedgerService } from '../finance/ledger.service';
import { RewardService } from '../wallet-loyalty/reward.service';
import { CreditNoteService } from '../compliance/credit-note.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { AuditService } from '../audit/audit.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { FinanceAlertService } from '../finance/finance-alert.service';
export interface InitiateOrderRefundInput {
    orderId: string;
    actorId: string;
    initiatorType: OrderRefundInitiator;
    reason?: string;
    ipAddress?: string;
    amount?: number;
    idempotencyKey?: string;
}
export declare class OrderRefundService {
    private readonly prisma;
    private readonly razorpay;
    private readonly ledger;
    private readonly rewards;
    private readonly creditNotes;
    private readonly emailNotifications;
    private readonly audit;
    private readonly domainEvents;
    private readonly financeAlerts;
    private readonly logger;
    private readonly maxRetries;
    constructor(prisma: PrismaService, razorpay: RazorpayService, ledger: LedgerService, rewards: RewardService, creditNotes: CreditNoteService, emailNotifications: EmailNotificationService, audit: AuditService, domainEvents: DomainEventsService, financeAlerts: FinanceAlertService);
    initiateRefund(input: InitiateOrderRefundInput): Promise<{
        refundId: string;
        status: OrderRefundStatus;
    }>;
    retryFailedRefunds(): Promise<number>;
    listFailedRefunds(page?: number, limit?: number): Promise<{
        refunds: {
            id: string;
            orderId: string;
            orderNumber: string;
            amount: number;
            razorpayAmount: number;
            walletAmount: number;
            status: import("@prisma/client").$Enums.OrderRefundStatus;
            retryCount: number;
            lastError: string | null;
            razorpayRefundId: string | null;
            createdAt: string;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    reconcileRazorpayRefund(payload: Record<string, unknown> | undefined): Promise<void>;
    private processRefundRecord;
    private finalizeRefund;
    private computeRefundSplit;
    private extractRefundEntity;
}
