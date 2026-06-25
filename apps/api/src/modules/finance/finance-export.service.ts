import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { decimalToNumber } from '../settlement/settlement.utils';

@Injectable()
export class FinanceExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportSettlementsCsv(merchantProfileId?: string): Promise<string> {
    const rows = await this.prisma.settlement.findMany({
      where: merchantProfileId ? { merchantProfileId } : {},
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { merchantProfile: { select: { businessName: true } } },
    });

    const header = 'id,merchant,cycle,status,gross,commission,net,items,period_start,period_end\n';
    const lines = rows.map(
      (r) =>
        `${r.id},${escapeCsv(r.merchantProfile.businessName)},${r.cycle},${r.status},${decimalToNumber(r.grossAmount)},${decimalToNumber(r.commissionAmount)},${decimalToNumber(r.netAmount)},${r.itemCount},${r.periodStart.toISOString()},${r.periodEnd.toISOString()}`,
    );
    return header + lines.join('\n');
  }

  async exportTaxReport(periodMonth: string): Promise<string> {
    const records = await this.prisma.taxRecord.findMany({
      where: { periodMonth },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const header = 'order_id,tax_type,taxable_amount,tax_amount,gst_rate,period\n';
    const lines = records.map(
      (r) =>
        `${r.orderId ?? ''},${r.taxType},${decimalToNumber(r.taxableAmount)},${decimalToNumber(r.taxAmount)},${r.gstRate ? decimalToNumber(r.gstRate) : ''},${r.periodMonth ?? ''}`,
    );
    return header + lines.join('\n');
  }

  async exportMerchantPayoutsCsv(): Promise<string> {
    const rows = await this.prisma.merchantPayout.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { merchantProfile: { select: { businessName: true } } },
    });
    const header = 'id,merchant,amount,status,reference,processed_at\n';
    const lines = rows.map(
      (r) =>
        `${r.id},${escapeCsv(r.merchantProfile.businessName)},${decimalToNumber(r.amount)},${r.status},${r.referenceId ?? ''},${r.processedAt?.toISOString() ?? ''}`,
    );
    return header + lines.join('\n');
  }

  async exportRevenueSummary(): Promise<Record<string, number>> {
    const [orders, snapshots] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: { in: ['DELIVERED', 'COMPLETED'] } },
        _sum: { totalAmount: true, discountAmount: true, deliveryFee: true },
        _count: { id: true },
      }),
      this.prisma.orderFinancialSnapshot.aggregate({
        _sum: {
          commissionAmount: true,
          netPlatformEarnings: true,
          netMerchantEarnings: true,
        },
      }),
    ]);

    return {
      orderCount: orders._count.id,
      gmv: decimalToNumber(orders._sum.totalAmount),
      discounts: decimalToNumber(orders._sum.discountAmount),
      deliveryFees: decimalToNumber(orders._sum.deliveryFee),
      platformCommission: decimalToNumber(snapshots._sum.commissionAmount),
      platformEarnings: decimalToNumber(snapshots._sum.netPlatformEarnings),
      merchantEarnings: decimalToNumber(snapshots._sum.netMerchantEarnings),
    };
  }
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
