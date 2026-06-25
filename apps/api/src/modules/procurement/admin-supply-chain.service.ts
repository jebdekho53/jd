import { Injectable } from '@nestjs/common';
import { VendorOrderStatus, VendorSettlementStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminSupplyChainService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [vendors, orders, settlements, shortages] = await Promise.all([
      this.prisma.vendor.count({ where: { isActive: true } }),
      this.prisma.vendorOrder.count({
        where: { status: { in: [VendorOrderStatus.PENDING, VendorOrderStatus.CONFIRMED, VendorOrderStatus.SHIPPED] } },
      }),
      this.prisma.vendorSettlement.count({ where: { status: VendorSettlementStatus.PENDING } }),
      this.prisma.purchaseRecommendation.count({ where: { isDismissed: false, predictedOosDays: { lte: 3 } } }),
    ]);

    const topVendors = await this.prisma.vendor.findMany({
      where: { isActive: true },
      orderBy: { ratingAvg: 'desc' },
      take: 5,
      select: { id: true, businessName: true, vendorType: true, ratingAvg: true, ratingCount: true },
    });

    const creditRisk = await this.prisma.vendorCreditLine.findMany({
      where: { overdueAmount: { gt: 0 } },
      include: {
        vendor: { select: { businessName: true } },
        merchantProfile: { select: { businessName: true } },
      },
      take: 10,
    });

    return {
      activeVendors: vendors,
      activeOrders: orders,
      pendingSettlements: settlements,
      inventoryShortages: shortages,
      topVendors,
      creditRisk,
    };
  }

  async listVendors() {
    return this.prisma.vendor.findMany({
      include: { _count: { select: { products: true, orders: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listVendorOrders() {
    return this.prisma.vendorOrder.findMany({
      include: {
        vendor: { select: { businessName: true } },
        merchantProfile: { select: { businessName: true } },
        shipment: true,
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async listVendorSettlements() {
    return this.prisma.vendorSettlement.findMany({
      include: { vendor: { select: { businessName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
