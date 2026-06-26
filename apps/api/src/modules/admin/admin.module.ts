import { Module } from '@nestjs/common';
import { AdminStoreService } from './admin-store.service';
import { AdminStoreController } from './admin-store.controller';
import { AdminMerchantService } from './admin-merchant.service';
import { AdminMerchantController } from './admin-merchant.controller';
import { AdminMediaController } from './admin-media.controller';
import { AdminMediaService } from './admin-media.service';
import { StoreModule } from '../store/store.module';
import { BuyerModule } from '../buyer/buyer.module';
import { MerchantModule } from '../merchant/merchant.module';

@Module({
  imports: [StoreModule, BuyerModule, MerchantModule],
  controllers: [AdminStoreController, AdminMerchantController, AdminMediaController],
  providers: [AdminStoreService, AdminMerchantService, AdminMediaService],
  exports: [AdminStoreService, AdminMerchantService, AdminMediaService],
})
export class AdminModule {}
