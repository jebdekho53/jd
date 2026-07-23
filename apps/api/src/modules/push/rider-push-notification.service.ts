import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { WebPushService } from './web-push.service';
import { buildRiderPush, type RiderPushKind, type RiderPushPayload } from './rider-push.events';

@Injectable()
export class RiderPushNotificationService {
  private readonly logger = new Logger(RiderPushNotificationService.name);
  private readonly riderSiteUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly webPush: WebPushService,
    config: ConfigService,
  ) {
    this.riderSiteUrl = (
      config.get<string>('RIDER_SITE_URL') ?? 'https://rider.jebdekho.com'
    ).replace(/\/$/, '');
  }

  /**
   * Every rider notification is operational — an expiring delivery offer, a KYC
   * decision, cash the rider is holding. There is deliberately no preference
   * check: a rider who has opted into push has opted into the job.
   */
  async sendToUser(userId: string, payload: RiderPushPayload): Promise<void> {
    if (!this.webPush.isConfigured()) return;

    const subs = await this.prisma.pushSubscription.findMany({ where: { userId, isActive: true } });
    if (!subs.length) return;

    const body = JSON.stringify({
      ...payload,
      data: { ...payload.data, url: `${this.riderSiteUrl}${payload.data.url}` },
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
            return;
          }
          this.logger.warn({ err, userId, kind: payload.data.kind }, 'Rider push delivery failed');
        }
      }),
    );
  }

  /** Resolve the user behind a rider profile, then send. */
  private async sendToRider(
    riderProfileId: string,
    kind: RiderPushKind,
    title: string,
    body: string,
    ids: { orderId?: string; ticketId?: string } = {},
  ): Promise<void> {
    const profile = await this.prisma.riderProfile.findUnique({
      where: { id: riderProfileId },
      select: { userId: true },
    });
    if (!profile) return;
    await this.sendToUser(profile.userId, buildRiderPush(kind, title, body, ids));
  }

  /**
   * Fired the moment an offer record is created. The offer expires on a timer,
   * so this is the one notification a rider genuinely cannot afford to miss —
   * without it, offers only reach riders who happen to have the app open.
   */
  async notifyDeliveryOffered(
    riderProfileId: string,
    input: { orderId: string; isReassignment: boolean; expiresInSeconds: number },
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      select: { orderNumber: true, store: { select: { name: true } } },
    });
    if (!order) return;

    const where = order.store?.name ? ` from ${order.store.name}` : '';
    await this.sendToRider(
      riderProfileId,
      input.isReassignment ? 'DELIVERY_REASSIGNED' : 'DELIVERY_OFFERED',
      input.isReassignment ? 'Delivery reassigned to you' : 'New delivery offer',
      `Order ${order.orderNumber}${where}. Respond within ${input.expiresInSeconds}s.`,
      { orderId: input.orderId },
    );
  }

  async notifyKycDecision(riderProfileId: string, approved: boolean, reason?: string): Promise<void> {
    await this.sendToRider(
      riderProfileId,
      approved ? 'KYC_APPROVED' : 'KYC_REJECTED',
      approved ? 'You are approved' : 'Your documents need attention',
      approved
        ? 'Start a shift and go online to begin accepting deliveries.'
        : reason || 'One or more documents were rejected. Open the app to fix them.',
    );
  }

  async notifyPayoutSent(riderProfileId: string, amount: number): Promise<void> {
    await this.sendToRider(
      riderProfileId,
      'PAYOUT_SENT',
      'Payout sent',
      `₹${Math.round(amount).toLocaleString('en-IN')} is on its way to your bank account.`,
    );
  }

  async notifyCodReminder(riderProfileId: string, amount: number, count: number): Promise<void> {
    await this.sendToRider(
      riderProfileId,
      'COD_REMINDER',
      'COD deposit pending',
      `You are holding ₹${Math.round(amount).toLocaleString('en-IN')} across ${count} order${count === 1 ? '' : 's'}.`,
    );
  }

  async notifySupportReply(userId: string, ticketId: string, ticketNumber: string): Promise<void> {
    await this.sendToUser(
      userId,
      buildRiderPush('SUPPORT_REPLY', 'Support replied', `Ticket ${ticketNumber} has a new message.`, {
        ticketId,
      }),
    );
  }
}
