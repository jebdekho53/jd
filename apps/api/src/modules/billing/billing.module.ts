import { Module } from '@nestjs/common';
import { MerchantModule } from '../merchant/merchant.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OfflineBillingService } from './offline-billing.service';
import { MerchantBillingController } from './merchant-billing.controller';

@Module({
  imports: [MerchantModule, InventoryModule],
  controllers: [MerchantBillingController],
  providers: [OfflineBillingService],
  exports: [OfflineBillingService],
})
export class BillingModule {}
