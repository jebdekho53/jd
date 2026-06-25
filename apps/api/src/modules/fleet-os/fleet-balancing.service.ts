import { Injectable, Logger } from '@nestjs/common';
import { RiderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FleetBalancingService {
  private readonly logger = new Logger(FleetBalancingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Suggest rider moves from high-supply to low-supply clusters */
  async getBalanceSuggestions() {
    const clusters = await this.prisma.riderCluster.findMany({
      orderBy: { demandSupplyRatio: 'desc' },
      take: 20,
    });
    if (clusters.length < 2) return [];

    const highSupply = clusters.filter((c) => c.activeRiders > 2 && c.demandSupplyRatio < 1);
    const lowSupply = clusters.filter((c) => c.demandSupplyRatio > 2);

    const suggestions = [];
    for (const low of lowSupply) {
      const donor = highSupply.find((h) => h.city === low.city);
      if (donor) {
        suggestions.push({
          from: { city: donor.city, locality: donor.locality, riders: donor.activeRiders },
          to: { city: low.city, locality: low.locality, orders: low.activeOrders },
          ridersToMove: 1,
        });
      }
    }
    return suggestions;
  }

  async countOnlineRiders() {
    return this.prisma.riderProfile.count({
      where: { status: { in: [RiderStatus.ONLINE, RiderStatus.ON_DELIVERY] } },
    });
  }
}
