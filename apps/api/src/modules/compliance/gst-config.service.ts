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
    const normalizedQuery = query?.trim();
    const numericPrefixCodes =
      normalizedQuery && /^\d{4}(\d{2}){0,2}$/.test(normalizedQuery)
        ? [normalizedQuery, normalizedQuery.slice(0, 6), normalizedQuery.slice(0, 4)]
            .filter((code, index, all) => code.length >= 4 && all.indexOf(code) === index)
        : [];
    return this.prisma.hSNCode.findMany({
      where: normalizedQuery
        ? {
            isActive: true,
            OR: [
              ...(numericPrefixCodes.length > 0 ? [{ code: { in: numericPrefixCodes } }] : []),
              { code: { contains: normalizedQuery } },
              { description: { contains: normalizedQuery, mode: 'insensitive' } },
            ],
          }
        : { isActive: true },
      orderBy: { code: 'asc' },
      take: 100,
    });
  }

  /**
   * Resolve a merchant-entered HSN code to a reference row, creating it if it
   * does not exist yet. This lets merchants register any valid HSN code
   * themselves instead of being limited to a pre-seeded lookup table. If the
   * code already exists it is returned as-is (its slab is authoritative and
   * shared); the per-product GST slab is stored separately on the product.
   */
  async ensureHsnCode(rawCode: string, gstSlab: GstSlab, description?: string) {
    const code = rawCode?.trim() ?? '';
    if (!isValidHsnCode(code)) {
      throw new BadRequestException('HSN code must be numeric and 4, 6, or 8 digits');
    }
    const existing = await this.prisma.hSNCode.findUnique({ where: { code } });
    if (existing) {
      if (!existing.isActive) {
        return this.prisma.hSNCode.update({ where: { code }, data: { isActive: true } });
      }
      return existing;
    }
    const cleanedDescription = description?.trim();
    return this.prisma.hSNCode.create({
      data: {
        code,
        description: cleanedDescription && cleanedDescription.length > 0 ? cleanedDescription : `HSN ${code}`,
        defaultGstSlab: gstSlab,
        isActive: true,
      },
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
