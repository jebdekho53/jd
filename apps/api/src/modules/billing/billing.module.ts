import { Module } from '@nestjs/common';
import { MerchantModule } from '../merchant/merchant.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { OfflineBillingService } from './offline-billing.service';
import { MerchantBillingController } from './merchant-billing.controller';
import { PublicOfflineBillController } from './public-offline-bill.controller';

@Module({
  imports: [MerchantModule, InventoryModule, ComplianceModule],
  controllers: [MerchantBillingController, PublicOfflineBillController],
  providers: [OfflineBillingService],
  exports: [OfflineBillingService],
})
export class BillingModule {}
