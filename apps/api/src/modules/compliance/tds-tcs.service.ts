import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const DEFAULT_TDS_RATE = 1;
const DEFAULT_TCS_RATE = 0.5;

@Injectable()
export class TdsTcsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordMerchantTds(
    merchantProfileId: string,
    periodMonth: string,
    taxableAmount: number,
    tdsRate = DEFAULT_TDS_RATE,
  ) {
    const tdsAmount = round2(taxableAmount * (tdsRate / 100));
    const existing = await this.prisma.tdsRecord.findFirst({
      where: { merchantProfileId, periodMonth },
    });
    if (existing) {
      return this.prisma.tdsRecord.update({
        where: { id: existing.id },
        data: { taxableAmount, tdsRate, tdsAmount },
      });
    }
    return this.prisma.tdsRecord.create({
      data: { merchantProfileId, periodMonth, taxableAmount, tdsRate, tdsAmount },
    });
  }

  async recordPlatformTcs(periodMonth: string, gmvAmount: number, tcsRate = DEFAULT_TCS_RATE) {
    const tcsAmount = round2(gmvAmount * (tcsRate / 100));
    const existing = await this.prisma.tcsRecord.findFirst({ where: { periodMonth } });
    if (existing) {
      return this.prisma.tcsRecord.update({
        where: { id: existing.id },
        data: { gmvAmount, tcsRate, tcsAmount },
      });
    }
    return this.prisma.tcsRecord.create({
      data: { periodMonth, gmvAmount, tcsRate, tcsAmount },
    });
  }

  async merchantTdsSummary(merchantProfileId: string, periodMonth?: string) {
    const where: Prisma.TdsRecordWhereInput = { merchantProfileId };
    if (periodMonth) where.periodMonth = periodMonth;

    const records = await this.prisma.tdsRecord.findMany({
      where,
      orderBy: { periodMonth: 'desc' },
      take: 12,
    });

    return {
      records: records.map((r) => ({
        periodMonth: r.periodMonth,
        taxableAmount: Number(r.taxableAmount),
        tdsRate: Number(r.tdsRate),
        tdsAmount: Number(r.tdsAmount),
      })),
      totalTds: round2(records.reduce((s, r) => s + Number(r.tdsAmount), 0)),
    };
  }

  async platformTcsSummary(periodMonth?: string) {
    const where: Prisma.TcsRecordWhereInput = {};
    if (periodMonth) where.periodMonth = periodMonth;

    const records = await this.prisma.tcsRecord.findMany({
      where,
      orderBy: { periodMonth: 'desc' },
      take: 12,
    });

    return {
      records: records.map((r) => ({
        periodMonth: r.periodMonth,
        gmvAmount: Number(r.gmvAmount),
        tcsRate: Number(r.tcsRate),
        tcsAmount: Number(r.tcsAmount),
      })),
      totalTcs: round2(records.reduce((s, r) => s + Number(r.tcsAmount), 0)),
    };
  }

  async syncMonthlyFromInvoices(periodMonth: string) {
    const [year, month] = periodMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const invoices = await this.prisma.gSTInvoice.findMany({
      where: { invoiceDate: { gte: start, lt: end } },
      select: {
        merchantProfileId: true,
        taxableAmount: true,
        grandTotal: true,
      },
    });

    const byMerchant = new Map<string, number>();
    let platformGmv = 0;
    for (const inv of invoices) {
      byMerchant.set(
        inv.merchantProfileId,
        (byMerchant.get(inv.merchantProfileId) ?? 0) + Number(inv.taxableAmount),
      );
      platformGmv += Number(inv.grandTotal);
    }

    for (const [merchantProfileId, taxable] of byMerchant) {
      await this.recordMerchantTds(merchantProfileId, periodMonth, taxable);
    }
    await this.recordPlatformTcs(periodMonth, platformGmv);

    return { merchants: byMerchant.size, platformGmv: round2(platformGmv) };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
