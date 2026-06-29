import { DeliveryProviderType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SettlementService } from '../settlement/settlement.service';
import { CodReconciliationService } from '../finance/cod-reconciliation.service';
import { ReservationService } from '../checkout/reservation.service';
import { OrderStatusHistoryService } from '../order/order-status-history.service';
import { InvoiceEngineService } from '../compliance/invoice-engine.service';
import { EmailNotificationService } from '../email/email-notification.service';
import { BuyerPushNotificationService } from '../push/buyer-push-notification.service';
import { TrustSafetyHookService } from '../trust-safety/trust-safety-hook.service';
import { WalletLoyaltyCheckoutService } from '../wallet-loyalty/wallet-loyalty-checkout.service';
import { ReferralService } from '../wallet-loyalty/referral.service';
import { DomainEventsService } from '../domain-events/domain-events.service';
import { TdsTcsService } from '../compliance/tds-tcs.service';
import { DistributedLockService } from '../../redis/distributed-lock.service';
export interface OrderDeliveredContext {
    orderId: string;
    actorId: string;
    riderProfileId?: string | null;
    providerType?: DeliveryProviderType | null;
    deliveryId?: string | null;
}
export declare class OrderDeliveredHandlerService {
    private readonly prisma;
    private readonly lock;
    private readonly settlement;
    private readonly cod;
    private readonly reservation;
    private readonly statusHistory;
    private readonly invoiceEngine;
    private readonly emailNotifications;
    private readonly buyerPush;
    private readonly trustSafety;
    private readonly walletLoyalty;
    private readonly referral;
    private readonly domainEvents;
    private readonly tdsTcs;
    private readonly logger;
    constructor(prisma: PrismaService, lock: DistributedLockService, settlement: SettlementService, cod: CodReconciliationService, reservation: ReservationService, statusHistory: OrderStatusHistoryService, invoiceEngine: InvoiceEngineService, emailNotifications: EmailNotificationService, buyerPush: BuyerPushNotificationService, trustSafety: TrustSafetyHookService, walletLoyalty: WalletLoyaltyCheckoutService, referral: ReferralService, domainEvents: DomainEventsService, tdsTcs: TdsTcsService);
    handleDelivered(ctx: OrderDeliveredContext): Promise<void>;
    handleProviderDelivered(orderId: string, providerType: DeliveryProviderType, deliveryId?: string | null): Promise<void>;
    private finalizeOrderRewards;
    private applyRiderEarningFromSnapshot;
    private syncMonthlyTdsTcs;
}
