import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BUYER_STATUS_GROUPS } from '../order/order-status-groups';

@Injectable()
export class HotspotService {
  private readonly logger = new Logger(HotspotService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateHotspots() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const orders = await this.prisma.order.groupBy({
      by: ['storeId'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { notIn: [...BUYER_STATUS_GROUPS.cancelled] },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 50,
    });

    let count = 0;
    for (const row of orders) {
      const store = await this.prisma.store.findUnique({
        where: { id: row.storeId },
        include: { city: true },
      });
      if (!store) continue;

      const searchHits = await this.prisma.searchEvent.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      });

      const demandScore = Math.min(100, row._count.id * 2 + searchHits / 100);

      const topCategory = await this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { storeId: store.id, createdAt: { gte: thirtyDaysAgo } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 1,
      });

      let categoryId: string | null = null;
      if (topCategory[0]) {
        const product = await this.prisma.product.findUnique({
          where: { id: topCategory[0].productId },
          select: { categoryId: true },
        });
        categoryId = product?.categoryId ?? null;
      }

      const locality = store.locality ?? 'Central';
      const existing = await this.prisma.demandHotspot.findFirst({
        where: { city: store.city.name, locality, categoryId },
      });
      if (existing) {
        await this.prisma.demandHotspot.update({
          where: { id: existing.id },
          data: { demandScore },
        });
      } else {
        await this.prisma.demandHotspot.create({
          data: {
            city: store.city.name,
            locality,
            categoryId,
            demandScore,
          },
        });
      }
      count++;
    }

    this.logger.log(`Generated ${count} demand hotspots`);
    return count;
  }

  async getHotspots(limit = 50) {
    return this.prisma.demandHotspot.findMany({
      orderBy: { demandScore: 'desc' },
      include: { category: { select: { name: true } } },
      take: limit,
    });
  }
}
