import { BadRequestException, Injectable } from '@nestjs/common';
import { GstSlab } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { isValidHsnCode } from '../product/hsn-code.util';

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

    const effectiveHsnCodeId =
      data.hsnCodeId === undefined ? product.hsnCodeId : data.hsnCodeId;
    if (!effectiveHsnCodeId?.trim()) {
      throw new BadRequestException('HSN code is required for every product');
    }
    if (data.hsnCodeId !== undefined) {
      const hsn = await this.prisma.hSNCode.findFirst({
        where: { id: data.hsnCodeId.trim(), isActive: true },
        select: { code: true },
      });
      if (!hsn) {
        throw new BadRequestException('Selected HSN code is invalid or inactive');
      }
      if (!isValidHsnCode(hsn.code)) {
        throw new BadRequestException('HSN code must be numeric and 4, 6, or 8 digits');
      }
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        hsnCodeId: data.hsnCodeId?.trim(),
        gstSlab: data.gstSlab,
        taxCategory: data.taxCategory,
        taxInclusive: data.taxInclusive,
      },
      include: { hsnCodeRef: true },
    });
  }
}
