import { Injectable } from '@nestjs/common';
import { DeliveryStatus, RiderPayoutStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from './ledger.service';
import { FinanceCacheService } from './finance-cache.service';
import { decimalToNumber, roundMoney } from '../settlement/settlement.utils';

@Injectable()
export class RiderPayoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly cache: FinanceCacheService,
  ) {}

  async getRiderEarnings(riderProfileId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const deliveries = await this.prisma.delivery.findMany({
      where: { riderProfileId, status: DeliveryStatus.DELIVERED },
      include: { order: { select: { orderNumber: true, paymentMethod: true, totalAmount: true } } },
      orderBy: { deliveredAt: 'desc' },
      take: 100,
    });

    const sum = (from: Date) =>
      deliveries
        .filter((d) => d.deliveredAt && d.deliveredAt >= from)
        .reduce((s, d) => s + decimalToNumber(d.riderEarning ?? 0), 0);

    const [pendingPayout, paidPayouts] = await Promise.all([
      this.prisma.riderPayout.findFirst({
        where: { riderProfileId, status: RiderPayoutStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.riderPayout.aggregate({
        where: { riderProfileId, status: RiderPayoutStatus.PAID },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      today: roundMoney(sum(todayStart)),
      thisWeek: roundMoney(sum(weekStart)),
      pendingPayout: pendingPayout ? decimalToNumber(pendingPayout.totalAmount) : 0,
      totalPaid: decimalToNumber(paidPayouts._sum.totalAmount),
      recentDeliveries: deliveries.slice(0, 10).map((d) => ({
        orderNumber: d.order.orderNumber,
        earning: decimalToNumber(d.riderEarning ?? 0),
        deliveredAt: d.deliveredAt?.toISOString() ?? null,
        paymentMethod: d.order.paymentMethod,
      })),
    };
  }

  async generateWeeklyPayout(riderProfileId: string) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date();

    const deliveries = await this.prisma.delivery.findMany({
      where: {
        riderProfileId,
        status: DeliveryStatus.DELIVERED,
        deliveredAt: { gte: weekStart, lte: weekEnd },
        riderPayoutItems: { none: {} },
      },
      include: { order: { select: { id: true, financialSnapshot: true } } },
    });

    if (deliveries.length === 0) return null;

    let baseFee = 0;
    let distanceBonus = 0;
    for (const d of deliveries) {
      const earning = decimalToNumber(d.riderEarning ?? 0);
      baseFee += earning * 0.7;
      distanceBonus += earning * 0.3;
    }
    baseFee = roundMoney(baseFee);
    distanceBonus = roundMoney(distanceBonus);
    const total = roundMoney(baseFee + distanceBonus);

    const payout = await this.prisma.riderPayout.create({
      data: {
        riderProfileId,
        periodStart: weekStart,
        periodEnd: weekEnd,
        baseFee,
        distanceBonus,
        totalAmount: total,
        items: {
          create: deliveries.map((d) => ({
            deliveryId: d.id,
            orderId: d.orderId,
            amount: d.riderEarning ?? 0,
          })),
        },
      },
    });

    await this.cache.invalidatePayouts();
    return payout;
  }

  async markPaid(payoutId: string, adminUserId: string, referenceId: string) {
    const payout = await this.prisma.riderPayout.update({
      where: { id: payoutId },
      data: {
        status: RiderPayoutStatus.PAID,
        paidAt: new Date(),
        referenceId,
      },
    });

    await this.ledger.recordRiderPayout(
      payoutId,
      payout.riderProfileId,
      decimalToNumber(payout.totalAmount),
    );
    await this.cache.invalidatePayouts();

    return payout;
  }

  async listAdmin(page = 1, limit = 25) {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.riderPayout.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { riderProfile: { select: { name: true } }, _count: { select: { items: true } } },
      }),
      this.prisma.riderPayout.count(),
    ]);

    return {
      payouts: rows.map((p) => ({
        id: p.id,
        rider: p.riderProfile.name,
        riderProfileId: p.riderProfileId,
        status: p.status,
        totalAmount: decimalToNumber(p.totalAmount),
        deliveryCount: p._count.items,
        periodStart: p.periodStart.toISOString(),
        periodEnd: p.periodEnd.toISOString(),
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
      meta: { page, limit, total },
    };
  }
}
