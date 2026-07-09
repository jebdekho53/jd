import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationPreference } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationOrchestratorService } from '../crm/notification-orchestrator.service';
import type { BuyerPushKind } from './buyer-push.events';
import {
  buildBuyerPushPayload,
  serializePushPayload,
  type BuyerPushNotificationPayload,
} from './push-payload.builder';
import { WebPushService } from './web-push.service';
import { WhatsAppService } from '../auth/whatsapp.service';

@Injectable()
export class BuyerPushNotificationService {
  private readonly logger = new Logger(BuyerPushNotificationService.name);
  private readonly buyerSiteUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly webPush: WebPushService,
    @Inject(forwardRef(() => NotificationOrchestratorService))
    private readonly notifications: NotificationOrchestratorService,
    private readonly whatsapp: WhatsAppService,
    configService: ConfigService,
  ) {
    this.buyerSiteUrl = configService.get<string>('BUYER_SITE_URL', 'https://jebdekho.com').replace(/\/$/, '');
  }

  /**
   * Send an order-update message over WhatsApp (Meta Cloud API). Auto-gated: a
   * no-op when WhatsApp isn't configured, so it never blocks the order flow.
   */
  private async sendOrderSms(orderId: string, message: string): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { buyerProfile: { select: { user: { select: { phone: true } } } } },
      });
      const phone = order?.buyerProfile?.user?.phone;
      if (!phone) return;
      await this.whatsapp.sendText(phone, message);
    } catch (err) {
      this.logger.warn(`Order WhatsApp failed for ${orderId}: ${(err as Error).message}`);
    }
  }

  async sendToUser(userId: string, kind: BuyerPushKind, payload: BuyerPushNotificationPayload): Promise<void> {
    if (!this.webPush.isConfigured()) return;

    const prefs = await this.notifications.getPreferences(userId);
    if (!this.isAllowed(kind, prefs)) return;

    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId, isActive: true },
    });
    if (!subs.length) return;

    const body = serializePushPayload({
      ...payload,
      data: {
        ...payload.data,
        url: payload.data.url.startsWith('http')
          ? payload.data.url
          : `${this.buyerSiteUrl}${payload.data.url}`,
      },
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          const { statusCode } = await this.webPush.send(sub, body);
          if (statusCode >= 200 && statusCode < 300) {
            await this.prisma.pushSubscription.update({
              where: { id: sub.id },
              data: { lastSeenAt: new Date() },
            });
          }
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.pushSubscription.update({
              where: { id: sub.id },
              data: { isActive: false },
            });
            this.logger.debug({ endpoint: sub.endpoint, statusCode }, 'Deactivated dead push subscription');
            return;
          }
          this.logger.warn({ err, userId, kind }, 'Push delivery failed');
        }
      }),
    );
  }

  private isAllowed(kind: BuyerPushKind, prefs: NotificationPreference): boolean {
    if (!prefs.pushEnabled) return false;
    switch (kind) {
      case 'ORDER_PLACED':
      case 'ORDER_ACCEPTED':
      case 'READY_FOR_PICKUP':
      case 'RIDER_ASSIGNED':
      case 'OUT_FOR_DELIVERY':
      case 'DELIVERED':
        return prefs.orderUpdates;
      case 'WALLET_CREDITED':
        return prefs.walletAlerts;
      case 'OFFER_AVAILABLE':
        return prefs.offerAlerts && prefs.marketingConsent;
      case 'SUPPORT_REPLY':
        return prefs.supportAlerts;
      default:
        return true;
    }
  }

  async notifyOrderPlaced(orderId: string): Promise<void> {
    const order = await this.loadOrder(orderId);
    if (!order) return;
    await this.sendToUser(
      order.userId,
      'ORDER_PLACED',
      buildBuyerPushPayload('ORDER_PLACED', {
        title: 'Order placed',
        body: `Your order #${order.orderNumber} has been placed successfully.`,
        orderId,
      }),
    );
  }

  async notifyOrderAccepted(orderId: string): Promise<void> {
    const order = await this.loadOrder(orderId);
    if (!order) return;
    await this.sendToUser(
      order.userId,
      'ORDER_ACCEPTED',
      buildBuyerPushPayload('ORDER_ACCEPTED', {
        title: 'Order confirmed',
        body: `Store accepted your order #${order.orderNumber}.`,
        orderId,
      }),
    );
    void this.sendOrderSms(
      orderId,
      `JebDekho: Order #${order.orderNumber} confirmed! The store is preparing it. Track at ${this.buyerSiteUrl}/orders`,
    );
  }

  async notifyReadyForPickup(orderId: string): Promise<void> {
    const order = await this.loadOrder(orderId);
    if (!order) return;
    await this.sendToUser(
      order.userId,
      'READY_FOR_PICKUP',
      buildBuyerPushPayload('READY_FOR_PICKUP', {
        title: 'Ready for pickup',
        body: `Order #${order.orderNumber} is packed and ready.`,
        orderId,
      }),
    );
  }

  async notifyRiderAssigned(orderId: string): Promise<void> {
    const order = await this.loadOrder(orderId);
    if (!order) return;
    await this.sendToUser(
      order.userId,
      'RIDER_ASSIGNED',
      buildBuyerPushPayload('RIDER_ASSIGNED', {
        title: 'Rider assigned',
        body: `A delivery partner is on the way for order #${order.orderNumber}.`,
        orderId,
      }),
    );
  }

  async notifyOutForDelivery(orderId: string): Promise<void> {
    const order = await this.loadOrder(orderId);
    if (!order) return;
    await this.sendToUser(
      order.userId,
      'OUT_FOR_DELIVERY',
      buildBuyerPushPayload('OUT_FOR_DELIVERY', {
        title: 'Out for delivery',
        body: `Order #${order.orderNumber} is on its way to you.`,
        orderId,
      }),
    );
    void this.sendOrderSms(
      orderId,
      `JebDekho: Order #${order.orderNumber} is out for delivery and arriving soon!`,
    );
  }

  async notifyDelivered(orderId: string): Promise<void> {
    const order = await this.loadOrder(orderId);
    if (!order) return;
    await this.sendToUser(
      order.userId,
      'DELIVERED',
      buildBuyerPushPayload('DELIVERED', {
        title: 'Delivered',
        body: `Order #${order.orderNumber} has been delivered. Enjoy!`,
        orderId,
      }),
    );
    void this.sendOrderSms(
      orderId,
      `JebDekho: Order #${order.orderNumber} delivered. Thank you for ordering! Reorder anytime at ${this.buyerSiteUrl}/orders`,
    );
  }

  async notifyWalletCredited(userId: string, amount: number): Promise<void> {
    await this.sendToUser(
      userId,
      'WALLET_CREDITED',
      buildBuyerPushPayload('WALLET_CREDITED', {
        title: 'Wallet credited',
        body: `₹${amount.toFixed(2)} has been added to your JebDekho wallet.`,
      }),
    );
  }

  async notifySupportReply(userId: string, ticketId: string, ticketNumber: string): Promise<void> {
    await this.sendToUser(
      userId,
      'SUPPORT_REPLY',
      buildBuyerPushPayload('SUPPORT_REPLY', {
        title: 'Support reply',
        body: `You have a new reply on ticket #${ticketNumber}.`,
        ticketId,
      }),
    );
  }

  async notifyOfferAvailable(userId: string, offerName: string, offerId?: string): Promise<void> {
    await this.sendToUser(
      userId,
      'OFFER_AVAILABLE',
      buildBuyerPushPayload('OFFER_AVAILABLE', {
        title: 'New offer for you',
        body: offerName,
        offerId,
      }),
    );
  }

  async sendGeneric(userId: string, kind: BuyerPushKind, title: string, body: string): Promise<void> {
    await this.sendToUser(userId, kind, buildBuyerPushPayload(kind, { title, body }));
  }

  private async loadOrder(orderId: string): Promise<{ userId: string; orderNumber: string } | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        buyerProfile: { select: { userId: true } },
      },
    });
    if (!order?.buyerProfile) return null;
    return { userId: order.buyerProfile.userId, orderNumber: order.orderNumber };
  }
}
