import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PromotionNotificationService {
  private readonly logger = new Logger(PromotionNotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async notifyStorePromotion(storeId: string, promotionName: string) {
    const buyers = await this.prisma.cart.findMany({
      where: { storeId },
      select: { buyerProfile: { select: { userId: true } } },
      distinct: ['buyerProfileId'],
      take: 100,
    });

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { name: true, slug: true },
    });
    if (!store) return;

    const title = `New offer at ${store.name}`;
    const body = `${promotionName} — shop now before it ends!`;

    for (const row of buyers) {
      const userId = row.buyerProfile.userId;
      await this.createInApp(userId, title, body, {
        type: 'STORE_PROMOTION',
        storeSlug: store.slug,
      });
    }

    this.logger.log(`Promotion alerts queued for ${buyers.length} buyers at store ${storeId}`);
  }

  async notifyCouponExpiring(userId: string, couponCode: string, expiresAt: Date) {
    await this.createInApp(
      userId,
      'Coupon expiring soon',
      `Your coupon ${couponCode} expires on ${expiresAt.toLocaleDateString('en-IN')}`,
      { type: 'COUPON_EXPIRY', code: couponCode },
    );
  }

  async notifyOfferExpiring(userId: string, offerName: string, storeName: string) {
    await this.createInApp(
      userId,
      'Offer ending soon',
      `${offerName} at ${storeName} is about to expire`,
      { type: 'OFFER_EXPIRY', offerName, storeName },
    );
  }

  private async createInApp(
    userId: string,
    title: string,
    body: string,
    data: Record<string, string>,
  ) {
    await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.PROMOTION,
        title,
        body,
        data,
      },
    });
  }
}
