import { Injectable } from '@nestjs/common';
import { GstSlab, GstSupplyType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface GstLineInput {
  quantity: number;
  unitPrice: number;
  discount?: number;
  gstSlab: GstSlab;
  taxInclusive?: boolean;
}

export interface GstLineBreakdown {
  taxableAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  lineTotal: number;
}

export interface GstTotals {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
}

@Injectable()
export class GstCalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  slabToPercent(slab: GstSlab): number {
    const map: Record<GstSlab, number> = {
      ZERO: 0,
      FIVE: 5,
      TWELVE: 12,
      EIGHTEEN: 18,
      TWENTY_EIGHT: 28,
    };
    return map[slab];
  }

  percentToSlab(percent: number): GstSlab {
    if (percent <= 0) return GstSlab.ZERO;
    if (percent <= 5) return GstSlab.FIVE;
    if (percent <= 12) return GstSlab.TWELVE;
    if (percent <= 18) return GstSlab.EIGHTEEN;
    return GstSlab.TWENTY_EIGHT;
  }

  resolveSupplyType(supplierState: string, buyerState: string | null): GstSupplyType {
    if (!buyerState || supplierState === buyerState) {
      return GstSupplyType.INTRA_STATE;
    }
    return GstSupplyType.INTER_STATE;
  }

  async getRatesForSlab(slab: GstSlab) {
    const rate = await this.prisma.taxRate.findUnique({ where: { slab } });
    if (!rate) {
      const pct = this.slabToPercent(slab);
      const half = pct / 2;
      return { cgstRate: half, sgstRate: half, igstRate: pct, totalRate: pct };
    }
    return {
      cgstRate: Number(rate.cgstRate),
      sgstRate: Number(rate.sgstRate),
      igstRate: Number(rate.igstRate),
      totalRate: Number(rate.totalRate),
    };
  }

  computeLine(
    input: GstLineInput,
    supplyType: GstSupplyType,
    rates: { cgstRate: number; sgstRate: number; igstRate: number },
  ): GstLineBreakdown {
    const gross = input.quantity * input.unitPrice - (input.discount ?? 0);
    const totalRate = supplyType === GstSupplyType.INTRA_STATE
      ? rates.cgstRate + rates.sgstRate
      : rates.igstRate;

    let taxableAmount: number;
    let lineTotal: number;

    if (input.taxInclusive && totalRate > 0) {
      taxableAmount = gross / (1 + totalRate / 100);
      lineTotal = gross;
    } else {
      taxableAmount = gross;
      lineTotal = gross + taxableAmount * (totalRate / 100);
    }

    taxableAmount = round2(taxableAmount);
    lineTotal = round2(lineTotal);

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (supplyType === GstSupplyType.INTRA_STATE) {
      cgstAmount = round2(taxableAmount * (rates.cgstRate / 100));
      sgstAmount = round2(taxableAmount * (rates.sgstRate / 100));
    } else {
      igstAmount = round2(taxableAmount * (rates.igstRate / 100));
    }

    return {
      taxableAmount,
      cgstRate: rates.cgstRate,
      sgstRate: rates.sgstRate,
      igstRate: rates.igstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      lineTotal,
    };
  }

  sumLines(lines: GstLineBreakdown[]): GstTotals {
    const taxableAmount = round2(lines.reduce((s, l) => s + l.taxableAmount, 0));
    const cgstAmount = round2(lines.reduce((s, l) => s + l.cgstAmount, 0));
    const sgstAmount = round2(lines.reduce((s, l) => s + l.sgstAmount, 0));
    const igstAmount = round2(lines.reduce((s, l) => s + l.igstAmount, 0));
    const totalTax = round2(cgstAmount + sgstAmount + igstAmount);
    const grandTotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
    return { taxableAmount, cgstAmount, sgstAmount, igstAmount, totalTax, grandTotal };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
