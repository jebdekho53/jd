import { Injectable } from '@nestjs/common';
import { Prisma, VendorType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ProcurementQueryDto } from './dto/procurement.dto';

@Injectable()
export class ProcurementMarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  async searchVendors(query: ProcurementQueryDto) {
    return this.prisma.vendor.findMany({
      where: {
        isActive: true,
        ...(query.vendorType ? { vendorType: query.vendorType as VendorType } : {}),
        ...(query.q
          ? { businessName: { contains: query.q, mode: Prisma.QueryMode.insensitive } }
          : {}),
      },
      select: {
        id: true,
        businessName: true,
        vendorType: true,
        ratingAvg: true,
        ratingCount: true,
        gstNumber: true,
        city: { select: { name: true } },
        _count: { select: { products: true } },
      },
      orderBy: { ratingAvg: 'desc' },
      take: 30,
    });
  }

  async searchProducts(query: ProcurementQueryDto) {
    return this.prisma.vendorProduct.findMany({
      where: {
        isActive: true,
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
                { sku: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
                { category: { contains: query.q, mode: Prisma.QueryMode.insensitive } },
              ],
            }
          : {}),
        ...(query.moqMax ? { moq: { lte: query.moqMax } } : {}),
        ...(query.gstRate ? { gstRate: parseFloat(query.gstRate) } : {}),
      },
      include: {
        vendor: { select: { id: true, businessName: true, vendorType: true, ratingAvg: true } },
        inventory: { select: { availableQty: true } },
        priceTiers: { orderBy: { minQty: 'asc' }, take: 3 },
      },
      orderBy: { basePrice: 'asc' },
      take: 40,
    });
  }

  async getCreditLines(merchantProfileId: string) {
    const lines = await this.prisma.vendorCreditLine.findMany({
      where: { merchantProfileId, isActive: true },
      include: { vendor: { select: { businessName: true, vendorType: true } } },
    });
    return lines.map((l) => ({
      ...l,
      creditLimit: Number(l.creditLimit),
      usedLimit: Number(l.usedLimit),
      availableLimit: Number(l.creditLimit) - Number(l.usedLimit),
      overdueAmount: Number(l.overdueAmount),
    }));
  }
}
