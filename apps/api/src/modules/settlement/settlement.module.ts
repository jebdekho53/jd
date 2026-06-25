import { Module, forwardRef } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { SettlementCommissionService } from './settlement-commission.service';
import { SettlementAutomationService } from './settlement-automation.service';
import { MerchantSettlementController } from './merchant-settlement.controller';
import { AdminSettlementController } from './admin-settlement.controller';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [forwardRef(() => FinanceModule)],
  controllers: [MerchantSettlementController, AdminSettlementController],
  providers: [SettlementService, SettlementCommissionService, SettlementAutomationService],
  exports: [SettlementService, SettlementCommissionService],
})
export class SettlementModule {}
