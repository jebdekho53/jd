import { Module } from '@nestjs/common';
import { BuyerStoreService } from './buyer-store.service';
import { BuyerProductService } from './buyer-product.service';
import { BuyerCacheService } from './buyer-cache.service';
import { BuyerController } from './buyer.controller';
import { BuyerVisibilityService } from './buyer-visibility.service';

@Module({
  controllers: [BuyerController],
  providers: [BuyerStoreService, BuyerProductService, BuyerCacheService, BuyerVisibilityService],
  exports: [BuyerStoreService, BuyerProductService, BuyerCacheService, BuyerVisibilityService],
})
export class BuyerModule {}
