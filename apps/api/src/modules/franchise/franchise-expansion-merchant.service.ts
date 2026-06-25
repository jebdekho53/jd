import { Injectable } from '@nestjs/common';
import { StoreType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MerchantDashboardService } from '../merchant-dashboard/merchant-dashboard.service';

@Injectable()
export class FranchiseExpansionMerchantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantDashboard: MerchantDashboardService,
  ) {}

  async getExpansionOpportunities(userId: string, storeId?: string) {
    const ctx = await this.merchantDashboard.resolveStoreContext(userId, storeId);
    if (!ctx.storeIds.length) return [];

    const store = await this.prisma.store.findFirst({
      where: { id: ctx.storeIds[0] },
      include: { city: true, storeHubs: true },
    });
    if (!store) return [];

    const darkStoresNearby = await this.prisma.store.count({
      where: {
        cityId: store.cityId,
        storeType: StoreType.DARK_STORE,
        isActive: true,
        merchantProfileId: { not: store.merchantProfileId },
      },
    });

    const cityPlan = await this.prisma.cityLaunchPlan.findFirst({
      where: { city: { equals: store.city.name, mode: 'insensitive' } },
    });

    const opportunities = [
      {
        id: 'dark-store',
        title: 'Open a dark store',
        description: 'Add a micro-fulfillment node in high-demand pincode',
        impact: 'Faster delivery · +15% conversion',
        type: 'FULFILLMENT_NODE',
      },
      {
        id: 'fulfillment-hub',
        title: 'Add fulfillment node to network',
        description: 'Join store network for smart routing',
        impact: cityPlan ? `City readiness ${Math.round(cityPlan.readinessScore)}%` : 'Expand coverage',
        type: 'NETWORK',
      },
    ];

    if (cityPlan && cityPlan.launchStatus !== 'LIVE') {
      opportunities.push({
        id: 'franchise-operator',
        title: 'Become franchise operator',
        description: `Lead ${store.city.name} expansion as franchise partner`,
        impact: `Target GMV ₹${Number(cityPlan.targetGmv).toLocaleString()}`,
        type: 'FRANCHISE',
      });
    }

    if (darkStoresNearby < 3) {
      opportunities.push({
        id: 'expansion-lead',
        title: 'Expansion opportunity in your city',
        description: 'Low dark store density — first-mover advantage',
        impact: 'High demand corridor',
        type: 'EXPANSION',
      });
    }

    return opportunities;
  }
}
