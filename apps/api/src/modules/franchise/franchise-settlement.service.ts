import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  FranchiseAuditAction,
  FranchiseDocumentStatus,
  FranchiseDocumentType,
  FranchisePartnerStatus,
  FranchiseSettlementStatus,
  FranchiseStoreStatus,
  LedgerReferenceType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from '../finance/ledger.service';
import { LEDGER_ACCOUNT_CODES } from '../finance/ledger-accounts.constants';
import { computeFranchiseShare } from './expansion.util';
import { computeFranchiseTax } from './franchise-tax.util';
import { BUYER_STATUS_GROUPS } from '../order/order-status-groups';
import { DistributedLockService } from '../../redis/distributed-lock.service';

@Injectable()
export class FranchiseSettlementService {
  private readonly logger = new Logger(FranchiseSettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly lock?: DistributedLockService,
  ) {}

  async createSettlement(franchiseId: string, periodStart: Date, periodEnd: Date) {
    const existing = await this.prisma.franchiseSettlement.findUnique({
      where: { franchiseId_periodStart_periodEnd: { franchiseId, periodStart, periodEnd } },
    });
    if (existing) return existing;

    const fp = await this.prisma.franchisePartner.findUnique({
      where: { id: franchiseId },
      include: {
        // Only ACTIVE links earn a share. A link parked as PENDING_REVIEW (the store
        // sits in another partner's exclusive pincode) or REJECTED must not settle.
        stores: { where: { status: FranchiseStoreStatus.ACTIVE } },
        // Present only if a PAN has been verified — decides 194H (5%) vs 206AA (20%).
        documents: {
          where: {
            documentType: FranchiseDocumentType.PAN_CARD,
            status: FranchiseDocumentStatus.VERIFIED,
          },
          select: { id: true },
        },
      },
    });
    if (!fp) throw new NotFoundException('Franchise not found');

    const storeIds = fp.stores.map((s) => s.storeId);
    const [gmvAgg, commissionAgg] = storeIds.length > 0
      ? await Promise.all([
        this.prisma.order.aggregate({
          where: {
            storeId: { in: storeIds },
            createdAt: { gte: periodStart, lte: periodEnd },
            status: { notIn: [...BUYER_STATUS_GROUPS.cancelled] },
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.orderFinancialSnapshot.aggregate({
          where: {
            order: {
              storeId: { in: storeIds },
              createdAt: { gte: periodStart, lte: periodEnd },
              status: { notIn: [...BUYER_STATUS_GROUPS.cancelled] },
            },
          },
          _sum: { commissionAmount: true },
        }),
      ])
      : [{ _sum: { totalAmount: null } }, { _sum: { commissionAmount: null } }];

    const grossGmv = Number(gmvAgg._sum.totalAmount ?? 0);
    const commissionBase = Number(commissionAgg._sum.commissionAmount ?? 0);
    const { franchiseShare, platformShare } = computeFranchiseShare(commissionBase, fp.commissionPercent);

    // GST only applies if the partner is actually GST-registered. TDS is 5% (194H)
    // only where a PAN has been verified — without one, s.206AA requires 20%.
    const panVerified = fp.documents.length > 0;
    const tax = computeFranchiseTax({
      franchiseShare,
      gstRegistered: Boolean(fp.gstin),
      panVerified,
    });

    const settlement = await this.prisma.franchiseSettlement.create({
      data: {
        franchiseId,
        periodStart,
        periodEnd,
        grossGmv,
        commissionBase,
        franchiseShare,
        platformShare,
        gstPercent: tax.gstPercent,
        gstAmount: tax.gstAmount,
        tdsPercent: tax.tdsPercent,
        tdsAmount: tax.tdsAmount,
        netPayable: tax.netPayable,
        status: FranchiseSettlementStatus.PENDING,
      },
    });

    if (franchiseShare > 0) {
      // We owe the partner their share PLUS the GST they invoice us for. Booking
      // only the share here left FRANCHISE_PAYABLE short by the GST, which the
      // payout then debited in full — driving the account negative by the GST on
      // every settlement. The GST is an asset (input tax credit we reclaim), not
      // an expense, so it is debited to GST_INPUT_CREDIT.
      const lines = [
        { accountCode: LEDGER_ACCOUNT_CODES.PLATFORM_COMMISSION, debit: franchiseShare, credit: 0 },
        ...(tax.gstAmount > 0
          ? [{ accountCode: LEDGER_ACCOUNT_CODES.GST_INPUT_CREDIT, debit: tax.gstAmount, credit: 0 }]
          : []),
        {
          accountCode: LEDGER_ACCOUNT_CODES.FRANCHISE_PAYABLE,
          debit: 0,
          credit: round2(franchiseShare + tax.gstAmount),
        },
      ];

      const journalId = await this.ledger.postJournal({
        referenceType: LedgerReferenceType.ADJUSTMENT,
        referenceId: settlement.id,
        description: `Franchise settlement ${fp.businessName}`,
        idempotencyKey: `franchise-settlement:${settlement.id}`,
        metadata: { franchiseId, grossGmv, commissionBase, franchiseShare, gst: tax.gstAmount },
        lines,
      });
      await this.prisma.franchiseSettlement.update({
        where: { id: settlement.id },
        data: { ledgerJournalId: journalId, status: FranchiseSettlementStatus.PROCESSING },
      });
    }

    await this.prisma.franchiseAudit.create({
      data: {
        franchiseId,
        action: FranchiseAuditAction.SETTLEMENT_CREATED,
        metadata: { settlementId: settlement.id, commissionBase, franchiseShare },
      },
    });

    return settlement;
  }

  @Cron('15 2 1 * *')
  async runMonthlySettlements(): Promise<void> {
    if (!this.lock) return;
    await this.lock.runExclusive('cron:franchise-settlements-monthly', 3600, async () => {
      const { periodStart, periodEnd } = previousMonthPeriod(new Date());
      await this.generateSettlements(periodStart, periodEnd);
    });
  }

  async generateSettlements(periodStart: Date, periodEnd: Date, franchiseId?: string) {
    const partners = await this.prisma.franchisePartner.findMany({
      where: {
        status: FranchisePartnerStatus.ACTIVE,
        ...(franchiseId ? { id: franchiseId } : {}),
      },
      select: { id: true },
    });

    const settlements = [];
    for (const partner of partners) {
      try {
        settlements.push(await this.createSettlement(partner.id, periodStart, periodEnd));
      } catch (err) {
        this.logger.error({ err, franchiseId: partner.id }, 'Franchise settlement failed');
        throw err;
      }
    }
    return { count: settlements.length, settlements };
  }

  async markPaid(id: string) {
    return this.prisma.franchiseSettlement.update({
      where: { id },
      data: { status: FranchiseSettlementStatus.PAID, paidAt: new Date() },
    });
  }

  async listSettlements(franchiseId: string) {
    return this.prisma.franchiseSettlement.findMany({
      where: { franchiseId },
      orderBy: { periodEnd: 'desc' },
      take: 24,
    });
  }

  async listAllSettlements() {
    return this.prisma.franchiseSettlement.findMany({
      include: { franchise: { select: { businessName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function previousMonthPeriod(now: Date): { periodStart: Date; periodEnd: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
  return { periodStart: start, periodEnd: end };
}
