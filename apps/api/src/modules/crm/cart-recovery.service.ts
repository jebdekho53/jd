import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { JourneyEngineService } from './journey-engine.service';
import { MarketingEventService } from './marketing-event.service';

const WINDOWS = [
  { minutes: 30, journeyCode: 'CART_ABANDON_30M', eventKey: 'cart_abandon_30' },
  { minutes: 360, journeyCode: 'CART_ABANDON_6H', eventKey: 'cart_abandon_6h' },
  { minutes: 1440, journeyCode: 'CART_ABANDON_24H', eventKey: 'cart_abandon_24h' },
] as const;

@Injectable()
export class CartRecoveryService {
  private readonly logger = new Logger(CartRecoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly journeys: JourneyEngineService,
    private readonly events: MarketingEventService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processAbandonedCarts() {
    for (const window of WINDOWS) {
      const minAge = new Date(Date.now() - window.minutes * 60 * 1000);
      const maxAge = new Date(Date.now() - (window.minutes + 15) * 60 * 1000);

      const carts = await this.prisma.cart.findMany({
        where: {
          updatedAt: { lte: minAge, gte: maxAge },
          items: { some: {} },
        },
        include: {
          buyerProfile: { select: { userId: true } },
          items: { take: 3, include: { product: { select: { name: true } } } },
        },
        take: 100,
      });

      for (const cart of carts) {
        const userId = cart.buyerProfile.userId;
        const recentOrder = await this.prisma.order.findFirst({
          where: {
            buyerProfileId: cart.buyerProfileId,
            createdAt: { gte: cart.updatedAt },
          },
        });
        if (recentOrder) continue;

        await this.events.track({
          userId,
          eventType: 'CHECKOUT_ABANDON',
          storeId: cart.storeId,
          metadata: { cartId: cart.id, window: window.eventKey },
        });

        await this.journeys.enrollUser(window.journeyCode, userId);
      }
    }
    this.logger.debug('Cart recovery scan complete');
  }
}
