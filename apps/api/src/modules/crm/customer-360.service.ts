import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CustomerTimelineService } from '../support/customer-timeline.service';

@Injectable()
export class Customer360Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly timeline: CustomerTimelineService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        buyerProfile: {
          include: {
            wallet: true,
            orders: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              select: {
                id: true,
                orderNumber: true,
                status: true,
                totalAmount: true,
                createdAt: true,
              },
            },
          },
        },
        segmentMemberships: { include: { segment: true } },
        customerUserTags: { include: { tag: true } },
        notificationPreference: true,
      },
    });
    if (!user?.buyerProfile) throw new NotFoundException('Buyer not found');

    const [timeline, searches, campaignEvents, deliveries] = await Promise.all([
      this.timeline.getTimeline(userId),
      this.prisma.marketingEvent.findMany({
        where: { userId, eventType: 'SEARCH' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.marketingEvent.findMany({
        where: {
          userId,
          eventType: { in: ['CAMPAIGN_CLICK', 'CAMPAIGN_OPEN', 'NOTIFICATION_OPEN'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.notificationDelivery.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const carts = await this.prisma.cart.findMany({
      where: { buyerProfileId: user.buyerProfile.id },
      include: { items: true, store: { select: { name: true } } },
    });

    const orderStats = await this.prisma.order.aggregate({
      where: { buyerProfileId: user.buyerProfile.id },
      _count: true,
      _sum: { totalAmount: true },
    });

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.buyerProfile.name,
        createdAt: user.createdAt,
      },
      segments: user.segmentMemberships.map((m) => m.segment),
      tags: user.customerUserTags.map((t) => t.tag),
      preferences: user.notificationPreference,
      wallet: user.buyerProfile.wallet,
      orders: user.buyerProfile.orders,
      carts,
      timeline: timeline.events,
      searches,
      campaignEngagement: campaignEvents,
      notificationHistory: deliveries,
      metrics: {
        totalOrders: orderStats._count,
        lifetimeValue: Number(orderStats._sum.totalAmount ?? 0),
      },
    };
  }
}
