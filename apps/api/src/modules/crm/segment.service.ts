import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoyaltyTier, OrderStatus, SegmentKind } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SegmentService {
  private readonly logger = new Logger(SegmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listSegments() {
    return this.prisma.customerSegment.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getSegmentMembers(segmentId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.customerSegmentMember.findMany({
        where: { segmentId },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, phone: true, email: true } } },
      }),
      this.prisma.customerSegmentMember.count({ where: { segmentId } }),
    ]);
    return { items, total, page, limit };
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async refreshAllSegments() {
    const segments = await this.prisma.customerSegment.findMany({
      where: { isDynamic: true, isActive: true },
    });
    for (const segment of segments) {
      await this.refreshSegment(segment.id, segment.kind);
    }
    this.logger.log(`Refreshed ${segments.length} dynamic segments`);
  }

  async refreshSegment(segmentId: string, kind: SegmentKind) {
    const userIds = await this.resolveUserIds(kind);
    await this.prisma.customerSegmentMember.deleteMany({ where: { segmentId } });
    if (userIds.length > 0) {
      await this.prisma.customerSegmentMember.createMany({
        data: userIds.map((userId) => ({ segmentId, userId })),
        skipDuplicates: true,
      });
    }
    await this.prisma.customerSegment.update({
      where: { id: segmentId },
      data: { memberCount: userIds.length, lastRefreshedAt: new Date() },
    });
    return userIds.length;
  }

  private async resolveUserIds(kind: SegmentKind): Promise<string[]> {
    const since14 = new Date(Date.now() - 14 * 86400000);
    const since30 = new Date(Date.now() - 30 * 86400000);
    const since60 = new Date(Date.now() - 60 * 86400000);
    const since90 = new Date(Date.now() - 90 * 86400000);

    switch (kind) {
      case SegmentKind.NEW_USERS: {
        const users = await this.prisma.user.findMany({
          where: { buyerProfile: { isNot: null }, createdAt: { gte: since14 } },
          select: { id: true },
          take: 5000,
        });
        return users.map((u) => u.id);
      }
      case SegmentKind.ACTIVE_USERS: {
        const orders = await this.prisma.order.findMany({
          where: { createdAt: { gte: since30 }, status: { notIn: [OrderStatus.CANCELLED_BY_BUYER, OrderStatus.CANCELLED_BY_MERCHANT] } },
          select: { buyerProfile: { select: { userId: true } } },
          distinct: ['buyerProfileId'],
          take: 5000,
        });
        return orders.map((o) => o.buyerProfile.userId);
      }
      case SegmentKind.DORMANT_USERS: {
        const active = await this.resolveUserIds(SegmentKind.ACTIVE_USERS);
        const all = await this.prisma.user.findMany({
          where: { buyerProfile: { isNot: null } },
          select: { id: true },
          take: 5000,
        });
        const activeSet = new Set(active);
        return all.filter((u) => !activeSet.has(u.id)).map((u) => u.id);
      }
      case SegmentKind.WALLET_USERS: {
        const wallets = await this.prisma.buyerWallet.findMany({
          where: { balance: { gt: 0 } },
          select: { buyerProfile: { select: { userId: true } } },
          take: 5000,
        });
        return wallets.map((w) => w.buyerProfile.userId);
      }
      case SegmentKind.GOLD_MEMBERS:
      case SegmentKind.PLATINUM_MEMBERS: {
        const tier = kind === SegmentKind.GOLD_MEMBERS ? LoyaltyTier.GOLD : LoyaltyTier.PLATINUM;
        const wallets = await this.prisma.buyerWallet.findMany({
          where: { tier },
          select: { buyerProfile: { select: { userId: true } } },
          take: 5000,
        });
        return wallets.map((w) => w.buyerProfile.userId);
      }
      case SegmentKind.HIGH_COD_RISK: {
        const profiles = await this.prisma.buyerProfile.findMany({
          where: { codEnabled: false },
          select: { userId: true },
          take: 5000,
        });
        return profiles.map((p) => p.userId);
      }
      case SegmentKind.HIGH_REFUND_USERS: {
        const refunded = await this.prisma.order.groupBy({
          by: ['buyerProfileId'],
          where: { status: OrderStatus.REFUNDED },
          _count: { _all: true },
        });
        const profileIds = refunded
          .filter((r) => r._count._all >= 2)
          .map((r) => r.buyerProfileId);
        const profiles = await this.prisma.buyerProfile.findMany({
          where: { id: { in: profileIds } },
          select: { userId: true },
        });
        return profiles.map((p) => p.userId);
      }
      case SegmentKind.FREQUENT_BUYERS: {
        const grouped = await this.prisma.order.groupBy({
          by: ['buyerProfileId'],
          where: { createdAt: { gte: since90 } },
          _count: { _all: true },
        });
        const frequent = grouped.filter((g) => g._count._all >= 5).map((g) => g.buyerProfileId);
        const profiles = await this.prisma.buyerProfile.findMany({
          where: { id: { in: frequent } },
          select: { userId: true },
        });
        return profiles.map((p) => p.userId);
      }
      case SegmentKind.HIGH_VALUE_USERS:
      case SegmentKind.VIP_USERS: {
        const minLtv = kind === SegmentKind.VIP_USERS ? 15000 : 5000;
        const grouped = await this.prisma.order.groupBy({
          by: ['buyerProfileId'],
          where: { status: { in: [OrderStatus.DELIVERED, OrderStatus.REFUNDED] } },
          _sum: { totalAmount: true },
        });
        const high = grouped
          .filter((g) => Number(g._sum.totalAmount ?? 0) >= minLtv)
          .map((g) => g.buyerProfileId);
        const profiles = await this.prisma.buyerProfile.findMany({
          where: { id: { in: high } },
          select: { userId: true },
        });
        return profiles.map((p) => p.userId);
      }
      default:
        return [];
    }
  }
}
