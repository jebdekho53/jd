import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { MerchantModule } from '../merchant/merchant.module';
import { BuyerModule } from '../buyer/buyer.module';
import { LocationDirectoryModule } from '../location-directory/location-directory.module';

@Module({
  imports: [MerchantModule, BuyerModule, LocationDirectoryModule],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
