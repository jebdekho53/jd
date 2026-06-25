import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SettlementBatchStatus, SettlementCycle, SettlementLedgerStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from './ledger.service';
import { FinanceCacheService } from './finance-cache.service';
import { FinanceAlertService } from './finance-alert.service';
import { decimalToNumber, roundMoney } from '../settlement/settlement.utils';

@Injectable()
export class SettlementBatchService {
  private readonly logger = new Logger(SettlementBatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly cache: FinanceCacheService,
    private readonly alerts: FinanceAlertService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async runDailySettlements(): Promise<void> {
    await this.generateBatches(SettlementCycle.DAILY);
  }

  @Cron('0 2 * * 1')
  async runWeeklySettlements(): Promise<void> {
    await this.generateBatches(SettlementCycle.WEEKLY);
  }

  async generateBatches(cycle: SettlementCycle, merchantProfileId?: string): Promise<number> {
    const { periodStart, periodEnd } = this.periodForCycle(cycle);
    const merchants = merchantProfileId
      ? [{ merchantProfileId }]
      : await this.prisma.settlementLedger.groupBy({
          by: ['merchantProfileId'],
          where: {
            status: SettlementLedgerStatus.SETTLED,
            settledAt: { gte: periodStart, lte: periodEnd },
          },
        });

    let created = 0;
    for (const m of merchants) {
      try {
        const batch = await this.createBatchForMerchant(
          m.merchantProfileId,
          cycle,
          periodStart,
          periodEnd,
        );
        if (batch) created += 1;
      } catch (err) {
        this.logger.error({ err, merchantProfileId: m.merchantProfileId }, 'Settlement batch failed');
        await this.alerts.raiseSettlementFailure(m.merchantProfileId, (err as Error).message);
      }
    }

    if (created > 0) await this.cache.invalidateSettlements();
    return created;
  }

  async createBatchForMerchant(
    merchantProfileId: string,
    cycle: SettlementCycle,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const ledgers = await this.prisma.settlementLedger.findMany({
      where: {
        merchantProfileId,
        status: SettlementLedgerStatus.SETTLED,
        settledAt: { gte: periodStart, lte: periodEnd },
        settlementItems: { none: {} },
      },
    });
    if (ledgers.length === 0) return null;

    const gross = roundMoney(ledgers.reduce((s, l) => s + decimalToNumber(l.grossAmount), 0));
    const commission = roundMoney(
      ledgers.reduce((s, l) => s + decimalToNumber(l.platformCommission), 0),
    );
    const net = roundMoney(ledgers.reduce((s, l) => s + decimalToNumber(l.netAmount), 0));

    const settlement = await this.prisma.$transaction(async (tx) => {
      const batch = await tx.settlement.create({
        data: {
          merchantProfileId,
          cycle,
          status: SettlementBatchStatus.COMPLETED,
          periodStart,
          periodEnd,
          grossAmount: gross,
          commissionAmount: commission,
          netAmount: net,
          itemCount: ledgers.length,
          processedAt: new Date(),
          items: {
            create: ledgers.map((l) => ({
              orderId: l.orderId,
              settlementLedgerId: l.id,
              grossAmount: l.grossAmount,
              commissionAmount: l.platformCommission,
              netAmount: l.netAmount,
            })),
          },
        },
        include: { items: true },
      });

      return batch;
    });

    for (const l of ledgers) {
      await this.ledger.recordMerchantSettlement(
        l.orderId,
        merchantProfileId,
        decimalToNumber(l.grossAmount),
        decimalToNumber(l.platformCommission),
        decimalToNumber(l.netAmount),
      );
    }

    return settlement;
  }

  async listSettlements(merchantProfileId?: string, page = 1, limit = 20) {
    const where = merchantProfileId ? { merchantProfileId } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.settlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          merchantProfile: { select: { businessName: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return {
      settlements: rows.map((s) => ({
        id: s.id,
        merchant: s.merchantProfile.businessName,
        merchantProfileId: s.merchantProfileId,
        cycle: s.cycle,
        status: s.status,
        grossAmount: decimalToNumber(s.grossAmount),
        commissionAmount: decimalToNumber(s.commissionAmount),
        netAmount: decimalToNumber(s.netAmount),
        itemCount: s._count.items,
        periodStart: s.periodStart.toISOString(),
        periodEnd: s.periodEnd.toISOString(),
        processedAt: s.processedAt?.toISOString() ?? null,
      })),
      meta: { page, limit, total },
    };
  }

  private periodForCycle(cycle: SettlementCycle): { periodStart: Date; periodEnd: Date } {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    if (cycle === SettlementCycle.DAILY) {
      start.setHours(0, 0, 0, 0);
    } else {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    }
    return { periodStart: start, periodEnd: end };
  }
}
