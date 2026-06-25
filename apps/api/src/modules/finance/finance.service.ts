import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SettlementService } from '../settlement/settlement.service';
import { LedgerService } from './ledger.service';
import { FinanceCacheService } from './finance-cache.service';
import { FinanceAlertService } from './finance-alert.service';
import { CodReconciliationService } from './cod-reconciliation.service';
import { SettlementBatchService } from './settlement-batch.service';
import { RiderPayoutService } from './rider-payout.service';
import { FinanceExportService } from './finance-export.service';
import { decimalToNumber } from '../settlement/settlement.utils';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settlement: SettlementService,
    private readonly ledger: LedgerService,
    private readonly cache: FinanceCacheService,
    private readonly alerts: FinanceAlertService,
    private readonly cod: CodReconciliationService,
    private readonly batches: SettlementBatchService,
    private readonly riderPayouts: RiderPayoutService,
    private readonly exports: FinanceExportService,
  ) {}

  async getControlTower() {
    return this.cache.wrap(this.cache.overviewKey(), async () => {
      const [settlementOverview, codSummary, revenue, balances, walletLiability, refunds] =
        await Promise.all([
          this.settlement.getAdminSettlementsOverview(),
          this.cod.getSummary(),
          this.exports.exportRevenueSummary(),
          this.ledger.getAccountBalances(),
          this.prisma.buyerWallet.aggregate({ _sum: { balance: true } }),
          this.prisma.order.count({
            where: { status: { in: ['REFUNDED', 'CANCELLED_BY_BUYER'] } },
          }),
        ]);

      return {
        revenue,
        settlement: settlementOverview.summary,
        cod: codSummary,
        ledgerBalances: balances,
        walletLiability: decimalToNumber(walletLiability._sum.balance),
        refundOrderCount: refunds,
        escrowBalance:
          balances.find((b) => b.code === 'PLATFORM_ESCROW')?.balance ?? 0,
        merchantPayable:
          balances.find((b) => b.code === 'MERCHANT_PAYABLE')?.balance ?? 0,
      };
    });
  }

  async getAlerts() {
    return this.alerts.listOpen();
  }

  async runHealthChecks() {
    const [negative, cod] = await Promise.all([
      this.alerts.checkNegativeMerchantBalances(),
      this.alerts.checkCodMismatches(),
    ]);
    return { negativeBalances: negative, codMismatches: cod };
  }
}
