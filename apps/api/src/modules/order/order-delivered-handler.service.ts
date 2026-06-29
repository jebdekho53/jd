import { Injectable, Logger } from '@nestjs/common';
import { DeliveryProviderType, DomainEventType, OrderActorType, OrderStatus, PaymentMethod } from '@prisma/client';
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

/**
 * Idempotent post-delivery handler shared by own-fleet riders and logistics providers (Shadowfax).
 */
@Injectable()
export class OrderDeliveredHandlerService {
  private readonly logger = new Logger(OrderDeliveredHandlerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lock: DistributedLockService,
    private readonly settlement: SettlementService,
    private readonly cod: CodReconciliationService,
    private readonly reservation: ReservationService,
    private readonly statusHistory: OrderStatusHistoryService,
    private readonly invoiceEngine: InvoiceEngineService,
    private readonly emailNotifications: EmailNotificationService,
    private readonly buyerPush: BuyerPushNotificationService,
    private readonly trustSafety: TrustSafetyHookService,
    private readonly walletLoyalty: WalletLoyaltyCheckoutService,
    private readonly referral: ReferralService,
    private readonly domainEvents: DomainEventsService,
    private readonly tdsTcs: TdsTcsService,
  ) {}

  async handleDelivered(ctx: OrderDeliveredContext): Promise<void> {
    await this.lock.runExclusive(`order-delivered:${ctx.orderId}`, 120, async () => {
      const order = await this.prisma.order.findUnique({
        where: { id: ctx.orderId },
        select: { id: true, status: true, buyerProfileId: true, paymentMethod: true },
      });
      if (!order) return;

      if (
        order.status !== OrderStatus.DELIVERED &&
        order.status !== OrderStatus.COMPLETED
      ) {
        await this.statusHistory.transition({
          orderId: ctx.orderId,
          toStatus: OrderStatus.DELIVERED,
          actorType: OrderActorType.SYSTEM,
          actorId: ctx.actorId,
          note: ctx.providerType
            ? `Delivered via ${ctx.providerType}`
            : 'Delivered',
          skipIfAlreadyStatus: true,
        });
      }

      await this.settlement.createLedgerForDeliveredOrder(ctx.orderId, ctx.actorId);

      const isCod =
        order.paymentMethod === PaymentMethod.COD ||
        order.paymentMethod === PaymentMethod.WALLET_COD;

      if (isCod) {
        await this.cod.createForDeliveredOrder(
          ctx.orderId,
          ctx.riderProfileId ?? null,
          ctx.providerType ?? null,
        );
      }

      if (ctx.deliveryId && ctx.riderProfileId) {
        await this.applyRiderEarningFromSnapshot(ctx.deliveryId, ctx.orderId);
      }

      await this.reservation.fulfillOnDelivery(ctx.orderId).catch((err) => {
        this.logger.error({ err, orderId: ctx.orderId }, 'Inventory fulfillment failed');
      });

      await this.finalizeOrderRewards(ctx.orderId, ctx.actorId).catch((err) => {
        this.logger.error({ err, orderId: ctx.orderId }, 'Order rewards finalization failed');
      });

      await this.invoiceEngine.generateForOrder(ctx.orderId).catch((err) => {
        this.logger.error({ err, orderId: ctx.orderId }, 'GST invoice generation failed');
      });

      void this.syncMonthlyTdsTcs().catch(() => {});

      if (ctx.riderProfileId) {
        void this.trustSafety.onOrderDelivered(ctx.orderId, ctx.riderProfileId).catch(() => {});
      }

      void this.emailNotifications.sendOrderDelivered(ctx.orderId).catch((err) => {
        this.logger.error({ err, orderId: ctx.orderId }, 'Order delivered email failed');
      });
      void this.buyerPush.notifyDelivered(ctx.orderId).catch(() => {});

      void this.domainEvents.emit(
        DomainEventType.ORDER_DELIVERED,
        'order',
        ctx.orderId,
        { providerType: ctx.providerType ?? 'OWN_FLEET' },
        { userId: ctx.actorId },
      );
    });
  }

  /** Called from logistics orchestrator when provider shipment reaches DELIVERED. */
  async handleProviderDelivered(
    orderId: string,
    providerType: DeliveryProviderType,
    deliveryId?: string | null,
  ): Promise<void> {
    await this.handleDelivered({
      orderId,
      actorId: 'logistics-orchestrator',
      providerType,
      deliveryId,
      riderProfileId: null,
    });
  }

  private async finalizeOrderRewards(orderId: string, actorId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, buyerProfileId: true, status: true },
    });
    if (!order || order.status === OrderStatus.COMPLETED) return;

    await this.statusHistory.transition({
      orderId,
      toStatus: OrderStatus.COMPLETED,
      actorType: OrderActorType.SYSTEM,
      actorId,
      note: 'Order completed after delivery',
      skipIfAlreadyStatus: true,
    });

    void this.domainEvents.emit(
      DomainEventType.ORDER_COMPLETED,
      'order',
      orderId,
      { buyerProfileId: order.buyerProfileId },
      { userId: actorId },
    );

    await this.walletLoyalty.processOrderCompleted(orderId);
    await this.referral.completeReferralOnFirstOrder(order.buyerProfileId, orderId);
  }

  private async applyRiderEarningFromSnapshot(deliveryId: string, orderId: string): Promise<void> {
    const snap = await this.prisma.orderFinancialSnapshot.findUnique({
      where: { orderId },
      select: { riderPayoutAmount: true },
    });
    if (!snap) return;
    await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { riderEarning: snap.riderPayoutAmount },
    });
  }

  private async syncMonthlyTdsTcs(): Promise<void> {
    const now = new Date();
    const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await this.tdsTcs.syncMonthlyFromInvoices(periodMonth);
  }
}
