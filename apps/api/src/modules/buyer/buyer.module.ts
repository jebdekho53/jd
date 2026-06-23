import { Module } from '@nestjs/common';
import { BuyerStoreService } from './buyer-store.service';
import { BuyerProductService } from './buyer-product.service';
import { BuyerCacheService } from './buyer-cache.service';
import { BuyerController } from './buyer.controller';

@Module({
  controllers: [BuyerController],
  providers: [BuyerStoreService, BuyerProductService, BuyerCacheService],
  exports: [BuyerStoreService, BuyerProductService],
})
export class BuyerModule {}
