import { Injectable } from '@nestjs/common';
import { GstSlab } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class GstConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async listTaxRates() {
    return this.prisma.taxRate.findMany({ where: { isActive: true }, orderBy: { totalRate: 'asc' } });
  }

  async listJurisdictions() {
    return this.prisma.taxJurisdiction.findMany({ where: { isActive: true }, orderBy: { stateName: 'asc' } });
  }

  async listHsnCodes(query?: string) {
    return this.prisma.hSNCode.findMany({
      where: query
        ? {
            isActive: true,
            OR: [
              { code: { contains: query } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          }
        : { isActive: true },
      orderBy: { code: 'asc' },
      take: 100,
    });
  }

  async updateProductTax(
    productId: string,
    storeId: string,
    data: {
      hsnCodeId?: string;
      gstSlab?: GstSlab;
      taxCategory?: 'GOODS' | 'SERVICES' | 'EXEMPT' | 'NIL_RATED';
      taxInclusive?: boolean;
    },
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
    });
    if (!product) return null;

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        hsnCodeId: data.hsnCodeId,
        gstSlab: data.gstSlab,
        taxCategory: data.taxCategory,
        taxInclusive: data.taxInclusive,
      },
      include: { hsnCodeRef: true },
    });
  }
}
