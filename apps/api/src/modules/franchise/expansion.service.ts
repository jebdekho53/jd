import { Injectable } from '@nestjs/common';
import { CityLaunchStatus, MarketingEventType, OrderStatus, StoreStatus, StoreType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { computeLaunchReadiness } from './expansion.util';
import { BUYER_STATUS_GROUPS } from '../order/order-status-groups';

@Injectable()
export class ExpansionService {
  constructor(private readonly prisma: PrismaService) {}

  async computeCityReadiness(city: string, state: string): Promise<number> {
    const cityRef = await this.prisma.city.findFirst({
      where: { name: { equals: city, mode: 'insensitive' } },
    });

    const [stores, riders, searchEvents, vendors, darkStores, delivered] = await Promise.all([
      this.prisma.store.count({
        where: {
          ...(cityRef ? { cityId: cityRef.id } : {}),
          status: StoreStatus.APPROVED,
          isActive: true,
        },
      }),
      this.prisma.riderProfile.count({
        where: { status: { in: ['ONLINE', 'ON_DELIVERY'] } },
      }),
      this.prisma.searchEvent.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.vendor.count({ where: { isActive: true } }),
      this.prisma.store.count({
        where: {
          ...(cityRef ? { cityId: cityRef.id } : {}),
          storeType: StoreType.DARK_STORE,
          isActive: true,
        },
      }),
      this.prisma.order.count({
        where: {
          ...(cityRef ? { store: { cityId: cityRef.id } } : {}),
          status: OrderStatus.DELIVERED,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const targetStores = 50;
    const targetRiders = 100;
    const fulfillmentSla = delivered > 0 ? Math.min(1, delivered / 500) : 0.3;

    return computeLaunchReadiness({
      storeDensity: Math.min(1, stores / targetStores),
      riderSupply: Math.min(1, riders / targetRiders),
      searchDemand: Math.min(1, searchEvents / 1000),
      population: cityRef ? 0.7 : 0.4,
      procurementCoverage: Math.min(1, vendors / 20) * 0.7 + fulfillmentSla * 0.3 * (darkStores > 0 ? 1.1 : 1),
    });
  }

  async refreshCityLaunchPlan(city: string, state: string) {
    const readinessScore = await this.computeCityReadiness(city, state);
    const cityRef = await this.prisma.city.findFirst({
      where: { name: { equals: city, mode: 'insensitive' } },
    });

    const [actualStores, actualRiders, gmvAgg] = await Promise.all([
      cityRef
        ? this.prisma.store.count({ where: { cityId: cityRef.id, isActive: true } })
        : 0,
      this.prisma.riderProfile.count(),
      cityRef
        ? this.prisma.order.aggregate({
            where: {
              store: { cityId: cityRef.id },
              createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
              status: { notIn: [...BUYER_STATUS_GROUPS.cancelled] },
            },
            _sum: { totalAmount: true },
          })
        : { _sum: { totalAmount: null } },
    ]);

    return this.prisma.cityLaunchPlan.upsert({
      where: { city_state: { city, state } },
      create: {
        city,
        state,
        cityId: cityRef?.id,
        readinessScore,
        actualStores,
        actualRiders,
        actualGmv: gmvAgg._sum.totalAmount ?? 0,
      },
      update: {
        readinessScore,
        actualStores,
        actualRiders,
        actualGmv: gmvAgg._sum.totalAmount ?? 0,
        cityId: cityRef?.id,
      },
    });
  }

  async listCities() {
    const plans = await this.prisma.cityLaunchPlan.findMany({
      orderBy: { readinessScore: 'desc' },
      take: 50,
    });
    if (plans.length === 0) {
      await this.refreshCityLaunchPlan('Delhi', 'Delhi');
      return this.prisma.cityLaunchPlan.findMany({ orderBy: { readinessScore: 'desc' } });
    }
    return plans;
  }

  async createCityLaunch(input: {
    city: string;
    state: string;
    launchStatus?: CityLaunchStatus;
    targetStores?: number;
    targetRiders?: number;
    targetGmv?: number;
  }) {
    const readinessScore = await this.computeCityReadiness(input.city, input.state);
    return this.prisma.cityLaunchPlan.upsert({
      where: { city_state: { city: input.city, state: input.state } },
      create: {
        city: input.city,
        state: input.state,
        launchStatus: input.launchStatus ?? CityLaunchStatus.PLANNING,
        readinessScore,
        targetStores: input.targetStores ?? 20,
        targetRiders: input.targetRiders ?? 50,
        targetGmv: input.targetGmv ?? 1000000,
      },
      update: {
        launchStatus: input.launchStatus,
        targetStores: input.targetStores,
        targetRiders: input.targetRiders,
        targetGmv: input.targetGmv,
        readinessScore,
      },
    });
  }

  async triggerLaunchCampaign(city: string, state: string) {
    await this.prisma.marketingEvent
      .create({
        data: {
          eventType: MarketingEventType.CAMPAIGN_OPEN,
          metadata: { city, state, campaign: `${city} launch`, type: 'CITY_LAUNCH' },
        },
      })
      .catch(() => null);
    return { city, state, campaignTriggered: true };
  }
}
