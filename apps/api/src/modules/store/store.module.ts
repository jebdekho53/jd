import { Module, forwardRef } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { MerchantModule } from '../merchant/merchant.module';
import { BuyerModule } from '../buyer/buyer.module';
import { LocationDirectoryModule } from '../location-directory/location-directory.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [MerchantModule, BuyerModule, LocationDirectoryModule, forwardRef(() => CartModule)],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
