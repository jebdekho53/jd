import { Module } from '@nestjs/common';
import { BuyerModule } from '../buyer/buyer.module';
import { StoreReviewService } from './store-review.service';
import { StoreReputationService } from './store-reputation.service';
import {
  BuyerStoreReviewController,
  PublicStoreReviewController,
} from './buyer-store-review.controller';
import { MerchantStoreReviewController } from './merchant-store-review.controller';
import { AdminStoreReviewController } from './admin-store-review.controller';

@Module({
  imports: [BuyerModule],
  controllers: [
    BuyerStoreReviewController,
    PublicStoreReviewController,
    MerchantStoreReviewController,
    AdminStoreReviewController,
  ],
  providers: [StoreReviewService, StoreReputationService],
  exports: [StoreReviewService, StoreReputationService],
})
export class StoreReviewModule {}
