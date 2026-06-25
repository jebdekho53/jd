import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminMerchantSuccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const snapshots = await this.prisma.storeHealthSnapshot.findMany({
      where: { snapshotDate: today },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            merchantProfile: {
              select: {
                id: true,
                businessName: true,
                isBlacklisted: true,
                user: { select: { phone: true } },
              },
            },
          },
        },
      },
      orderBy: { healthScore: 'desc' },
      take: 500,
    });

    const atRisk = snapshots.filter((s) => s.healthScore < 50);
    const topPerformers = snapshots.filter((s) => s.healthScore >= 80);
    const expansionReady = snapshots.filter(
      (s) => s.healthScore >= 70 && s.visibilityScore >= 50 && s.fulfillmentPct >= 25,
    );
    const fraudProne = snapshots.filter(
      (s) =>
        s.store.merchantProfile.isBlacklisted ||
        (s.fulfillmentPct < 15 && s.healthScore < 40),
    );

    const openAlerts = await this.prisma.merchantGrowthAlert.groupBy({
      by: ['alertType'],
      where: { status: 'OPEN' },
      _count: { id: true },
    });

    const avgHealth =
      snapshots.length > 0
        ? Math.round(snapshots.reduce((s, x) => s + x.healthScore, 0) / snapshots.length)
        : 0;

    return {
      summary: {
        storesTracked: snapshots.length,
        avgHealthScore: avgHealth,
        atRiskCount: atRisk.length,
        topPerformerCount: topPerformers.length,
        expansionReadyCount: expansionReady.length,
        fraudProneCount: fraudProne.length,
      },
      atRisk: atRisk.slice(0, 20).map(this.mapRow),
      topPerformers: topPerformers.slice(0, 20).map(this.mapRow),
      expansionReady: expansionReady.slice(0, 20).map(this.mapRow),
      fraudProne: fraudProne.slice(0, 20).map(this.mapRow),
      alertsByType: openAlerts.map((a) => ({ type: a.alertType, count: a._count.id })),
    };
  }

  private mapRow(s: {
    healthScore: number;
    visibilityScore: number;
    fulfillmentPct: number;
    store: {
      id: string;
      name: string;
      merchantProfile: { businessName: string; user: { phone: string } };
    };
  }) {
    return {
      storeId: s.store.id,
      storeName: s.store.name,
      merchantName: s.store.merchantProfile.businessName,
      phone: s.store.merchantProfile.user.phone,
      healthScore: s.healthScore,
      visibilityScore: s.visibilityScore,
    };
  }
}
