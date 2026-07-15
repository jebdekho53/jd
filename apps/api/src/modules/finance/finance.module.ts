import { Module, forwardRef } from '@nestjs/common';
import { SettlementModule } from '../settlement/settlement.module';
import { PaymentModule } from '../payment/payment.module';
import { LedgerService } from './ledger.service';
import { FinanceCommissionService } from './finance-commission.service';
import { OrderFinancialsService } from './order-financials.service';
import { SettlementBatchService } from './settlement-batch.service';
import { CodReconciliationService } from './cod-reconciliation.service';
import { RiderPayoutService } from './rider-payout.service';
import { RiderBankAccountService } from './rider-bank-account.service';
import { FinanceExportService } from './finance-export.service';
import { FinanceAlertService } from './finance-alert.service';
import { FinanceCacheService } from './finance-cache.service';
import { FraudEngineService } from './fraud-engine.service';
import { FinanceService } from './finance.service';
import { AdminFinanceController } from './admin-finance.controller';
import { MerchantFinanceController } from './merchant-finance.controller';
import { RiderFinanceController } from './rider-finance.controller';

@Module({
  imports: [forwardRef(() => SettlementModule), forwardRef(() => PaymentModule)],
  controllers: [AdminFinanceController, MerchantFinanceController, RiderFinanceController],
  providers: [
    LedgerService,
    FinanceCommissionService,
    OrderFinancialsService,
    SettlementBatchService,
    CodReconciliationService,
    RiderPayoutService,
    RiderBankAccountService,
    FinanceExportService,
    FinanceAlertService,
    FinanceCacheService,
    FinanceService,
    FraudEngineService,
  ],
  exports: [
    LedgerService,
    OrderFinancialsService,
    CodReconciliationService,
    RiderPayoutService,
    FinanceCacheService,
    FinanceCommissionService,
    FinanceAlertService,
  ],
})
export class FinanceModule {}
