import { Module, forwardRef } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { SettlementCommissionService } from './settlement-commission.service';
import { SettlementAutomationService } from './settlement-automation.service';
import { MerchantSettlementController } from './merchant-settlement.controller';
import { AdminSettlementController } from './admin-settlement.controller';
import { FinanceModule } from '../finance/finance.module';
import { RazorpayService } from '../payment/razorpay.service';

@Module({
  imports: [forwardRef(() => FinanceModule)],
  controllers: [MerchantSettlementController, AdminSettlementController],
  providers: [
    SettlementService,
    SettlementCommissionService,
    SettlementAutomationService,
    // Self-contained (ConfigService only) — provided locally to drive Route
    // payout transfers without importing the heavy PaymentModule graph.
    RazorpayService,
  ],
  exports: [SettlementService, SettlementCommissionService],
})
export class SettlementModule {}
