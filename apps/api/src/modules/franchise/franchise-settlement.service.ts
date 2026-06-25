import { Injectable, NotFoundException } from '@nestjs/common';
import { FranchiseAuditAction, FranchiseSettlementStatus, LedgerReferenceType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LedgerService } from '../finance/ledger.service';
import { LEDGER_ACCOUNT_CODES } from '../finance/ledger-accounts.constants';
import { computeFranchiseShare } from './expansion.util';
import { BUYER_STATUS_GROUPS } from '../order/order-status-groups';

@Injectable()
export class FranchiseSettlementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async createSettlement(franchiseId: string, periodStart: Date, periodEnd: Date) {
    const fp = await this.prisma.franchisePartner.findUnique({
      where: { id: franchiseId },
      include: { stores: true },
    });
    if (!fp) throw new NotFoundException('Franchise not found');

    const storeIds = fp.stores.map((s) => s.storeId);
    const gmvAgg = storeIds.length > 0
      ? await this.prisma.order.aggregate({
          where: {
            storeId: { in: storeIds },
            createdAt: { gte: periodStart, lte: periodEnd },
            status: { notIn: [...BUYER_STATUS_GROUPS.cancelled] },
          },
          _sum: { totalAmount: true },
        })
      : { _sum: { totalAmount: null } };

    const grossGmv = Number(gmvAgg._sum.totalAmount ?? 0);
    const { franchiseShare, platformShare } = computeFranchiseShare(grossGmv, fp.commissionPercent);

    const settlement = await this.prisma.franchiseSettlement.create({
      data: {
        franchiseId,
        periodStart,
        periodEnd,
        grossGmv,
        franchiseShare,
        platformShare,
        status: FranchiseSettlementStatus.PENDING,
      },
    });

    if (franchiseShare > 0) {
      const journalId = await this.ledger.postJournal({
        referenceType: LedgerReferenceType.ADJUSTMENT,
        referenceId: settlement.id,
        description: `Franchise settlement ${fp.businessName}`,
        idempotencyKey: `franchise-settlement:${settlement.id}`,
        metadata: { franchiseId, grossGmv, franchiseShare },
        lines: [
          { accountCode: LEDGER_ACCOUNT_CODES.PLATFORM_COMMISSION, debit: franchiseShare, credit: 0 },
          { accountCode: LEDGER_ACCOUNT_CODES.MERCHANT_PAYABLE, debit: 0, credit: franchiseShare },
        ],
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
        metadata: { settlementId: settlement.id, franchiseShare },
      },
    });

    return settlement;
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
