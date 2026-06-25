import { Module } from '@nestjs/common';
import { BuyerModule } from '../buyer/buyer.module';
import { MerchantModule } from '../merchant/merchant.module';
import { InventoryService } from './inventory.service';
import { InventoryCacheService } from './inventory-cache.service';
import { InventoryAlertService } from './inventory-alert.service';
import { MerchantInventoryController } from './merchant-inventory.controller';
import { AdminInventoryController } from './admin-inventory.controller';

@Module({
  imports: [BuyerModule, MerchantModule],
  controllers: [MerchantInventoryController, AdminInventoryController],
  providers: [InventoryService, InventoryCacheService, InventoryAlertService],
  exports: [InventoryService, InventoryCacheService],
})
export class InventoryModule {}
